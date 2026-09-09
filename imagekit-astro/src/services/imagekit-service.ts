import type { LocalImageService, ImageTransform, AstroConfig } from 'astro';
import { buildSrc } from '@imagekit/javascript';
import type { Transformation } from '@imagekit/javascript';
import sharpService from 'astro/assets/services/sharp';

/**
 * Mirrors Astro's internal `UnresolvedSrcSetValue` (not exported from the
 * public `astro` entry). Astro's pipeline fills in `url` later by calling
 * `getURL` on the returned `transform`.
 */
type UnresolvedSrcSetValue = {
  transform: ImageTransform;
  descriptor?: string;
  attributes?: Record<string, any>;
};

/**
 * Astro `ImageTransform` augmented with the ImageKit-specific props
 * declared on `Astro.CustomImageProps` via the integration's `injectTypes`.
 */
type IKImageTransform = ImageTransform & {
  urlEndpoint?: string;
  transformation?: Transformation[];
  queryParameters?: Record<string, string | number>;
  transformationPosition?: 'path' | 'query';
  densities?: Array<number | `${number}x`>;
  widths?: number[];
};

export interface ImageKitServiceConfig {
  /**
   * The URL endpoint for your ImageKit account.
   * Get it from https://imagekit.io/dashboard/url-endpoints
   */
  urlEndpoint: string;

  /**
   * Position of the transformation string in the URL.
   * - `'query'` (default): appended as `?tr=...`
   * - `'path'`: inserted in the URL path as `tr:...`
   */
  transformationPosition?: 'path' | 'query';

  /**
   * Hostnames recognized as ImageKit endpoints. Absolute URLs whose host
   * matches one of these are treated as IK URLs (transformations applied
   * directly). All other srcs are delegated to Astro's default sharp service.
   *
   * Populated automatically by the integration from `urlEndpoint` and
   * `additionalEndpoints`.
   */
  imagekitHosts?: string[];
}

/**
 * Astro quality presets mapped to ImageKit quality (0-100).
 *
 * Aligned with Astro's sharp service defaults
 * (https://docs.astro.build/en/reference/image-service-reference/).
 */
const QUALITY_PRESETS: Record<string, number> = {
  low: 25,
  mid: 50,
  high: 75,
  max: 100,
};

/**
 * Resolves the ImageKit config from the service config and per-image overrides.
 *
 * Priority: per-image prop > integration service config > env vars.
 *
 * @throws {Error} If no urlEndpoint can be resolved.
 */
function resolveConfig(
  options: IKImageTransform,
  imageConfig: AstroConfig['image'],
): { urlEndpoint: string; transformationPosition: 'path' | 'query' } {
  const config = (imageConfig.service.config ?? {}) as Partial<ImageKitServiceConfig>;
  const urlEndpoint =
    options.urlEndpoint ||
    config.urlEndpoint ||
    import.meta.env?.IMAGEKIT_URL_ENDPOINT;

  if (!urlEndpoint) {
    throw new Error(
      '[@imagekit/astro] An ImageKit URL endpoint is required. Pass urlEndpoint to the imagekit() integration in astro.config.mjs, set IMAGEKIT_URL_ENDPOINT, or pass urlEndpoint as a prop on <Image>.',
    );
  }

  return {
    urlEndpoint,
    transformationPosition:
      options.transformationPosition ?? config.transformationPosition ?? 'query',
  };
}

/**
 * Resolves quality (preset string or number) to an ImageKit quality value.
 */
function resolveQuality(quality: ImageTransform['quality']): number | undefined {
  if (quality === undefined || quality === null) return undefined;
  if (typeof quality === 'number') return quality;
  const num = Number.parseInt(String(quality), 10);
  if (!Number.isNaN(num)) return num;
  return QUALITY_PRESETS[String(quality)];
}

/**
 * Builds the IK transformation chain from Astro `ImageTransform` options.
 *
 * Ordering matches imagekit-next:
 *   [ ...userTransformation, { width, quality, format, crop: 'at_max' } ]
 *
 * The trailing chain step always uses `crop: at_max` so that:
 *   - srcset variants never upscale beyond the source image
 *   - base src behaves consistently with its variants
 *
 * `height` is intentionally omitted from the final step — `at_max` preserves
 * the source's aspect ratio, so passing height is redundant and can produce
 * unexpected results if the requested aspect ratio doesn't match the source.
 *
 * Astro's `fit` and `position` props are intentionally ignored — `at_max`
 * preserves aspect ratio and there's no crop/focus to apply on top of it.
 * Users who need cropping or focus should pass them via `transformation`.
 *
 * `format` is honored only when explicitly set (e.g. by `<Picture>` iterating
 * its `formats` array, or by an explicit `format` prop on `<Image>`). When
 * undefined, no `f-` param is emitted so ImageKit's default `f-auto`
 * negotiation kicks in. Note: imported local assets cause Astro to auto-fill
 * `format` from the file extension, which will override `f-auto`.
 */
function buildIKTransformations(options: IKImageTransform): Transformation[] {
  const result: Transformation[] = [];

  // 1. User-supplied transformations come first.
  if (Array.isArray(options.transformation) && options.transformation.length > 0) {
    result.push(...options.transformation);
  }

  // 2. Final chain step: width / quality / format / at_max crop.
  const finalStep: Transformation = { crop: 'at_max' };
  if (options.width) finalStep.width = Math.round(options.width);

  const quality = resolveQuality(options.quality);
  if (quality !== undefined) finalStep.quality = quality;

  if (options.format) finalStep.format = options.format as Transformation['format'];

  result.push(finalStep);

  return result;
}

/**
 * Determines whether a `src` should be handled by the ImageKit service.
 *
 * Eligible:
 *   - Bare paths or filenames (e.g. `'foo.jpg'`, `'folder/bar.png'`).
 *   - Root-relative paths that don't look like Vite-emitted local assets.
 *   - Absolute URLs whose host matches a known IK host (canonical, custom
 *     domain, or any `additionalEndpoints` host).
 *
 * Not eligible (→ delegated to sharp):
 *   - Vite/Astro local asset paths: `/_astro/...`, `/@fs/...`, `/@id/...`.
 *   - Absolute URLs on hosts not in the IK host set.
 *   - `data:` / `blob:` URLs.
 */
function isImageKitSrc(src: string, ikHosts: string[]): boolean {
  if (!src) return false;
  if (src.startsWith('data:') || src.startsWith('blob:')) return false;
  if (
    src.startsWith('/_astro/') ||
    src.startsWith('/@fs/') ||
    src.startsWith('/@id/')
  ) {
    return false;
  }
  if (/^https?:\/\//i.test(src)) {
    try {
      const u = new URL(src);
      return ikHosts.includes(u.hostname.toLowerCase());
    } catch {
      return false;
    }
  }
  // Bare paths: assume IK (will be resolved against urlEndpoint).
  return true;
}

function getIKHosts(imageConfig: AstroConfig['image']): string[] {
  const config = (imageConfig.service.config ?? {}) as Partial<ImageKitServiceConfig>;
  const hosts = Array.isArray(config.imagekitHosts) ? config.imagekitHosts : [];
  // Always include the canonical host as a safety net.
  return Array.from(new Set([...hosts, 'ik.imagekit.io'].map((h) => h.toLowerCase())));
}

/**
 * Builds the final ImageKit URL for an IK-eligible transform.
 */
function buildIKUrl(opts: IKImageTransform, imageConfig: AstroConfig['image']): string {
  const src = typeof opts.src === 'string' ? opts.src : opts.src.src;
  const { urlEndpoint, transformationPosition } = resolveConfig(opts, imageConfig);

  return buildSrc({
    src,
    urlEndpoint,
    transformation: buildIKTransformations(opts),
    queryParameters: opts.queryParameters,
    transformationPosition,
  });
}

/**
 * URLs we generated for IK-eligible transforms, keyed by the exact transform
 * object Astro handed to `getURL`. Astro passes that same object to
 * `addStaticImage`, which lets the wrapper below short-circuit it.
 */
const ikUrlByTransform = new WeakMap<object, string>();

/** Last image config seen by the service; used as a fallback by the wrapper. */
let lastImageConfig: AstroConfig['image'] | undefined;

const WRAPPED_FLAG = '__imagekitAstroWrapped';

/**
 * Keep IK URLs out of Astro's static image pipeline.
 *
 * Because this service exposes sharp's `transform`, Astro classifies it as a
 * *local* service. During `astro build` (static output, or any prerendered
 * route in server output) Astro's `getImage()` therefore hands every result
 * to `globalThis.astroAsset.addStaticImage`, which replaces the URL with a
 * `/_astro/<hash>.<ext>` path and later tries to read the source from disk
 * (bare IK paths → ENOENT) or fetch it and re-encode it with sharp (absolute
 * IK URLs → transformations silently dropped).
 *
 * Astro only skips that step when the service returned the src unchanged,
 * which is never the case for IK URLs carrying transformations. So we wrap
 * `addStaticImage` and return our CDN URL for the transforms we own, letting
 * everything else (local assets, allow-listed third-party hosts) flow through
 * to sharp untouched. `addStaticImage` only exists at build time, so this is
 * a no-op in dev and in on-demand SSR rendering.
 */
function bypassStaticImagePipeline(): void {
  const astroAsset = (globalThis as any).astroAsset;
  const original = astroAsset?.addStaticImage;
  if (typeof original !== 'function' || original[WRAPPED_FLAG]) return;

  const wrapped = function (this: unknown, options: IKImageTransform, ...rest: unknown[]) {
    const known = ikUrlByTransform.get(options);
    if (known !== undefined) return known;

    // Fallback in case Astro passes a transform object we haven't seen.
    if (lastImageConfig) {
      const src = typeof options.src === 'string' ? options.src : options.src?.src;
      if (typeof src === 'string' && isImageKitSrc(src, getIKHosts(lastImageConfig))) {
        return buildIKUrl(options, lastImageConfig);
      }
    }

    return original.call(this, options, ...rest);
  } as ((...args: unknown[]) => unknown) & Record<string, unknown>;
  wrapped[WRAPPED_FLAG] = true;

  astroAsset.addStaticImage = wrapped;
}

const service: LocalImageService = {
  validateOptions(options: ImageTransform, imageConfig: AstroConfig['image']) {
    const src = typeof options.src === 'string' ? options.src : options.src.src;
    // For non-IK srcs, defer to sharp's validation (handles format clamping,
    // local-asset dimension inference, etc.).
    if (!isImageKitSrc(src, getIKHosts(imageConfig))) {
      return sharpService.validateOptions!(options, imageConfig);
    }
    // For IK srcs, just round dimensions — IK handles the rest server-side.
    if (options.width) options.width = Math.round(options.width);
    if (options.height) options.height = Math.round(options.height);
    return options;
  },

  getURL(options: ImageTransform, imageConfig: AstroConfig['image']) {
    const opts = options as IKImageTransform;
    const src = typeof opts.src === 'string' ? opts.src : opts.src.src;

    if (!isImageKitSrc(src, getIKHosts(imageConfig))) {
      return sharpService.getURL!(options, imageConfig);
    }

    const url = buildIKUrl(opts, imageConfig);

    // Remember this transform so the build-time static image pipeline
    // returns our CDN URL instead of trying to process the file with sharp.
    ikUrlByTransform.set(opts, url);
    lastImageConfig = imageConfig;
    bypassStaticImagePipeline();

    return url;
  },

  getHTMLAttributes(options: ImageTransform, imageConfig: AstroConfig['image']) {
    const opts = options as IKImageTransform;
    const srcStr = typeof opts.src === 'string' ? opts.src : opts.src.src;

    if (!isImageKitSrc(srcStr, getIKHosts(imageConfig))) {
      return sharpService.getHTMLAttributes!(options, imageConfig);
    }

    // Strip props we consume or that would otherwise leak as invalid HTML attrs:
    // - src is replaced with our generated URL
    // - quality/background/format are baked into the URL
    // - fit/position are intentionally ignored by the service
    // - inferSize is intentionally ignored (external services don't fetch remote images for dimensions)
    // - densities/widths/layout are Astro-internal (would render as invalid HTML attrs)
    // - urlEndpoint/transformation/queryParameters/transformationPosition are IK config
    // Everything else (width, height, sizes, alt, class, style, loading, etc.) passes through.
    const {
      src,
      format,
      quality,
      densities,
      widths,
      fit,
      position,
      layout,
      background,
      inferSize,
      urlEndpoint,
      transformation,
      queryParameters,
      transformationPosition,
      ...nonIKAttributes
    } = options as IKImageTransform & {
      format?: unknown;
      fit?: unknown;
      position?: unknown;
      layout?: unknown;
      background?: unknown;
      inferSize?: unknown;
    };

    return {
      ...nonIKAttributes,
      loading: nonIKAttributes.loading ?? 'lazy',
      decoding: nonIKAttributes.decoding ?? 'async',
    };
  },

  /**
   * Build one srcset entry per requested width. Astro fills in the `url`
   * for each entry by calling `getURL(transform)` (see
   * `astro/dist/assets/internal.js`). `layout` is already converted to
   * `widths` upstream by Astro's `getImage`, so only `widths`/`densities`
   * need handling here.
   */
  getSrcSet(options: ImageTransform, imageConfig: AstroConfig['image']): UnresolvedSrcSetValue[] {
    const opts = options as IKImageTransform;
    const src = typeof opts.src === 'string' ? opts.src : opts.src.src;

    if (!isImageKitSrc(src, getIKHosts(imageConfig))) {
      return sharpService.getSrcSet!(options, imageConfig) as UnresolvedSrcSetValue[];
    }

    const { width, height, densities, widths } = opts;

    const targets: Array<{ w: number; descriptor: string }> = [];

    if (widths?.length) {
      for (const w of widths) targets.push({ w, descriptor: `${Math.round(w)}w` });
    } else if (densities?.length && width) {
      for (const d of densities) {
        const factor = typeof d === 'number' ? d : Number.parseFloat(String(d));
        targets.push({ w: width * factor, descriptor: `${factor}x` });
      }
    }

    const aspectRatio = width && height ? width / height : undefined;

    return targets.map(({ w, descriptor }) => ({
      transform: {
        ...opts,
        width: Math.round(w),
        height: aspectRatio ? Math.round(w / aspectRatio) : height,
      },
      descriptor,
      attributes: {},
    }));
  },

  // --- Local-service hooks (delegated to sharp) ---
  //
  // We register as a `LocalImageService` so Astro's `/_image` endpoint
  // (SSR) and static image generation (build) handle non-IK srcs: local
  // assets and foreign hosts in `image.domains`/`remotePatterns`. These
  // hooks only fire for sharp-delegated srcs. IK URLs go straight to the
  // CDN — `bypassStaticImagePipeline()` keeps them out of Astro's build-time
  // pipeline, and they never hit `/_image` at runtime.
  parseURL: sharpService.parseURL,
  transform: sharpService.transform,
  propertiesToHash: sharpService.propertiesToHash,
};

export default service;

