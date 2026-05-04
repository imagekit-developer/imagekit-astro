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
 *   [ ...userTransformation, { width, quality, crop: 'at_max' } ]
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
 */
function buildIKTransformations(options: IKImageTransform): Transformation[] {
  const result: Transformation[] = [];

  // 1. User-supplied transformations come first.
  if (Array.isArray(options.transformation) && options.transformation.length > 0) {
    result.push(...options.transformation);
  }

  // 2. Final chain step: width / quality / at_max crop.
  const finalStep: Transformation = { crop: 'at_max' };
  if (options.width) finalStep.width = Math.round(options.width);

  const quality = resolveQuality(options.quality);
  if (quality !== undefined) finalStep.quality = quality;

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

    const { urlEndpoint, transformationPosition } = resolveConfig(opts, imageConfig);

    return buildSrc({
      src,
      urlEndpoint,
      transformation: buildIKTransformations(opts),
      queryParameters: opts.queryParameters,
      transformationPosition,
    });
  },

  getHTMLAttributes(options: ImageTransform, imageConfig: AstroConfig['image']) {
    const opts = options as IKImageTransform;
    const srcStr = typeof opts.src === 'string' ? opts.src : opts.src.src;

    if (!isImageKitSrc(srcStr, getIKHosts(imageConfig))) {
      return sharpService.getHTMLAttributes!(options, imageConfig);
    }

    // Strip props we consume or that would otherwise leak as invalid HTML attrs:
    // - src is replaced with our generated URL
    // - quality/background are baked into the URL
    // - fit/position are intentionally ignored by the service
    // - format is intentionally ignored (use `transformation: [{ format: ... }]` to force one)
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
  // accepts requests for non-IK srcs (local assets, foreign hosts in
  // `image.domains`/`remotePatterns`). These hooks only fire when our
  // `getURL` returned a `/_image?...` URL — which only happens for
  // sharp-delegated srcs. IK URLs go straight to `ik.imagekit.io` and
  // never hit `/_image`, so this is purely additive.
  parseURL: sharpService.parseURL,
  transform: sharpService.transform,
  propertiesToHash: sharpService.propertiesToHash,
};

export default service;

