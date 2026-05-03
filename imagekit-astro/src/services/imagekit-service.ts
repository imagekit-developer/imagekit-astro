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
  mid: 50,
  high: 80,
  max: 100,
};

/**
 * Maps Astro `fit` prop to ImageKit `crop` parameter.
 * https://imagekit.io/docs/image-resize-and-crop
 *
 * - cover  -> maintain_ratio (resize+crop to exact dims)
 * - contain -> at_max (fit within bounds, preserve aspect)
 * - fill   -> force (stretch to exact dims)
 *
 * Sharp's `inside`/`outside`/`scale-down` have no clean IK equivalent and are ignored.
 */
const FIT_TO_CROP: Record<string, string> = {
  cover: 'maintain_ratio',
  contain: 'at_max',
  fill: 'force',
};

/**
 * Maps Astro `position` prop (Sharp keywords) to ImageKit `focus` parameter.
 * Sharp only accepts these 9 keyword values; CSS percentages are not supported.
 * https://imagekit.io/docs/image-resize-and-crop#focus-fo
 */
const POSITION_TO_FOCUS: Record<string, string> = {
  center: 'center',
  top: 'top',
  bottom: 'bottom',
  left: 'left',
  right: 'right',
  'top left': 'top_left',
  'top right': 'top_right',
  'bottom left': 'bottom_left',
  'bottom right': 'bottom_right',
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
 * Builds the IK transformation array from Astro `ImageTransform` options.
 * Maps width/height/fit/position/quality to their ImageKit equivalents and
 * appends user-supplied `transformation` last so users can override defaults.
 */
function buildIKTransformations(options: ImageTransform): Transformation[] {
  const transformations: Transformation[] = [];

  // Size + crop + focus combined into a single transformation step
  const sizeTransform: Transformation = {};
  if (options.width) sizeTransform.width = Math.round(options.width);
  if (options.height) sizeTransform.height = Math.round(options.height);

  // fit -> crop (only meaningful when both width and height are set)
  if (options.width && options.height && (options as any).fit) {
    const crop = FIT_TO_CROP[(options as any).fit as string];
    if (crop) sizeTransform.crop = crop as Transformation['crop'];
  }

  // position -> focus
  if ((options as any).position) {
    const focus = POSITION_TO_FOCUS[(options as any).position as string];
    if (focus) sizeTransform.focus = focus as Transformation['focus'];
  }

  if (Object.keys(sizeTransform).length > 0) {
    transformations.push(sizeTransform);
  }

  // quality
  const quality = resolveQuality(options.quality);
  if (quality !== undefined) {
    transformations.push({ quality });
  }

  // User-supplied transformations come last so they win on conflicts.
  const userTransformation = (options as any).transformation as Transformation[] | undefined;
  if (Array.isArray(userTransformation) && userTransformation.length > 0) {
    transformations.push(...userTransformation);
  }

  return transformations;
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
    // Strip only props we consume/handle:
    // - src is replaced with our generated URL
    // - quality/background are baked into the URL
    // - fit/position are mapped to ImageKit transformations
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
