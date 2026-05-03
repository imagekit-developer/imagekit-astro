import type { ExternalImageService, ImageTransform, AstroConfig } from 'astro';
import { buildSrc } from '@imagekit/javascript';
import type { Transformation } from '@imagekit/javascript';

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
}

/**
 * Astro quality presets mapped to ImageKit quality (0-100).
 * https://imagekit.io/docs/image-resize-and-crop#quality-q
 */
const QUALITY_PRESETS: Record<string, number> = {
  low: 30,
  mid: 80,
  high: 90,
  max: 95,
};

/**
 * Resolves the ImageKit config from the service config and per-image overrides.
 */
function resolveConfig(
  options: ImageTransform,
  imageConfig: AstroConfig['image'],
): { urlEndpoint: string; transformationPosition: 'path' | 'query' } {
  const config = (imageConfig.service.config ?? {}) as ImageKitServiceConfig;
  const urlEndpoint =
    (options as any).urlEndpoint ??
    config.urlEndpoint ??
    import.meta.env?.PUBLIC_IMAGEKIT_URL_ENDPOINT ??
    import.meta.env?.IMAGEKIT_URL_ENDPOINT ??
    '';
  const transformationPosition =
    (options as any).transformationPosition ?? config.transformationPosition ?? 'query';
  return { urlEndpoint, transformationPosition };
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
function buildIKTransformations(options: ImageTransform): Transformation[] {
  const result: Transformation[] = [];

  // 1. User-supplied transformations come first.
  const userTransformation = (options as any).transformation as Transformation[] | undefined;
  if (Array.isArray(userTransformation) && userTransformation.length > 0) {
    result.push(...userTransformation);
  }

  // 2. Final chain step: width / quality / at_max crop.
  const finalStep: Transformation = { crop: 'at_max' };
  if (options.width) finalStep.width = Math.round(options.width);

  const quality = resolveQuality(options.quality);
  if (quality !== undefined) finalStep.quality = quality;

  result.push(finalStep);

  return result;
}

const service: ExternalImageService = {
  validateOptions(options: ImageTransform) {
    // No remote-size inference: external services don't process images,
    // so we don't need exact source dimensions at build time. Just round.
    if (options.width) options.width = Math.round(options.width);
    if (options.height) options.height = Math.round(options.height);
    return options;
  },

  getURL(options: ImageTransform, imageConfig: AstroConfig['image']) {
    const { urlEndpoint, transformationPosition } = resolveConfig(options, imageConfig);
    const src = typeof options.src === 'string' ? options.src : options.src.src;

    return buildSrc({
      src,
      urlEndpoint,
      transformation: buildIKTransformations(options),
      queryParameters: (options as any).queryParameters,
      transformationPosition,
    });
  },

  getHTMLAttributes(options: ImageTransform) {
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
    } = options as any;

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
  getSrcSet(options: ImageTransform): UnresolvedSrcSetValue[] {
    const { width, height, densities, widths } = options as ImageTransform & {
      densities?: Array<number | `${number}x`>;
      widths?: number[];
    };

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
        ...options,
        width: Math.round(w),
        height: aspectRatio ? Math.round(w / aspectRatio) : height,
      },
      descriptor,
      attributes: {},
    }));
  },
};

export default service;
