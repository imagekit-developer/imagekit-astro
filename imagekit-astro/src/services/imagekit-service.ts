import type { ExternalImageService, ImageTransform, AstroConfig } from 'astro';
import { buildSrc, getResponsiveImageAttributes } from '@imagekit/javascript';
import type { Transformation } from '@imagekit/javascript';
/**
 * Dynamically imports `inferRemoteSize` from `astro:assets`.
 * Available since Astro 4.12. Returns `undefined` on older versions.
 */
async function tryInferRemoteSize(url: string): Promise<{ width: number; height: number } | undefined> {
  try {
    const mod = await import('astro:assets');
    if (typeof mod.inferRemoteSize === 'function') {
      return await mod.inferRemoteSize(url);
    }
    return undefined;
  } catch {
    return undefined;
  }
}

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
 * IK-specific prop names that flow through ImageTransform's index signature.
 * These must be stripped from HTML attributes.
 */
const IK_PROP_NAMES = [
  'urlEndpoint',
  'transformation',
  'queryParameters',
  'transformationPosition',
  'responsive',
  'deviceBreakpoints',
  'imageBreakpoints',
  // Internal props set by the service
  '_ik_srcset',
  '_ik_sizes',
] as const;

const qualityPresets = {
  low: 30,
  mid: 50,
  high: 80,
  max: 100,
}

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
    process.env.PUBLIC_IMAGEKIT_URL_ENDPOINT ??
    process.env.IMAGEKIT_URL_ENDPOINT ??
    '';
  const transformationPosition =
    (options as any).transformationPosition ?? config.transformationPosition ?? 'query';
  return { urlEndpoint, transformationPosition };
}

/**
 * Builds the IK transformation array from user-supplied transformations
 * plus Astro's format/quality props.
 */
function buildIKTransformations(options: ImageTransform): Transformation[] {
  const userTransformation: Transformation[] = Array.from(
    (options as any).transformation ?? [],
  );

  if (options.format && typeof options.format === 'string') {
    userTransformation.push({ format: options.format as Transformation['format'] });
  }

  const qualityInt = parseInt(String(options.quality), 10);
  const quality = (options.quality as keyof typeof qualityPresets);
  const finalQuality = !Number.isNaN(qualityInt) ? qualityInt : qualityPresets[quality];
  
  if (finalQuality) {
    userTransformation.push({ quality: finalQuality as Transformation['quality'] });
  }

  return userTransformation;
}

/**
 * Determines whether ImageKit should handle responsive image generation
 * (as opposed to Astro's native layout/densities/widths handling).
 *
 * IK responsive is used when:
 * - `responsive` prop is true (default)
 * - No Astro `densities` are specified
 * - `width` is defined (including width inferred during validateOptions)
 */
function shouldUseIKResponsive(options: ImageTransform): boolean {
  const responsive = (options as any).responsive ?? true;
  const hasAstroDensities = !!(options as any).densities;
  return (
    responsive &&
    !hasAstroDensities &&
    options.width !== undefined
  );
}

function getDimensionsUnder25MP(width: number, height: number): { width: number; height: number } {
  const megapixels = (width * height) / 1_000_000;
  if (megapixels <= 25) {
    return { width, height };
  }
  const scaleFactor = Math.sqrt(25 / megapixels);
  return {
    width: Math.round(width * scaleFactor),
    height: Math.round(height * scaleFactor),
  };
}

const service: ExternalImageService = {
  async validateOptions(options: ImageTransform, imageConfig: AstroConfig['image']) {
    if (!options.width) {
      const baseSrc = buildSrc({
        src: typeof options.src === 'string' ? options.src : options.src.src,
        urlEndpoint: resolveConfig(options, imageConfig).urlEndpoint,
        transformation: [{ raw: 'orig-true'}],
        queryParameters: (options as any).queryParameters,
        transformationPosition: resolveConfig(options, imageConfig).transformationPosition,
      });
      const inferredSize = await tryInferRemoteSize(baseSrc);
      
      if (inferredSize) {
        const { width, height } = getDimensionsUnder25MP(inferredSize.width, inferredSize.height);
        inferredSize.width = width;
        inferredSize.height = height;
        const densities: (number | `${number}x`)[] = (options as any).densities ?? [1];
        const largestDensity = Math.max(...densities.map((d) => (typeof d === 'number' ? d : Number.parseFloat(d))));
        options.width = Math.round(inferredSize.width / largestDensity);
        options.height = Math.round(inferredSize.height / largestDensity);
      } else {
        console.warn(
          `Failed to infer image size for ${baseSrc}. ` +
          `Automatic dimension inference requires Astro 4.12+. ` +
          `Please provide explicit width and height.`,
        );
      }
    }
    // Round width/height like the base service
    if (options.width) options.width = Math.round(options.width);
    if (options.height) options.height = Math.round(options.height);

    return options;
  },

  getURL(options: ImageTransform, imageConfig: AstroConfig['image']) {
    const { urlEndpoint, transformationPosition } = resolveConfig(options, imageConfig);
    const src = typeof options.src === 'string' ? options.src : options.src.src;
    const transformation = buildIKTransformations(options);
    const queryParameters = (options as any).queryParameters;
    const widths = options.widths;

    // If IK responsive mode is active, use getResponsiveImageAttributes for the src URL.
    // The srcSet/sizes will be stored on options for getHTMLAttributes to pick up.
    if (shouldUseIKResponsive(options)) {
      const imageBreakpoints: number[] | undefined = (options as any).imageBreakpoints;
      const widthBreakpoints = Array.isArray(widths) && widths.length > 0 
                                ? Array.from(new Set(widths.concat(imageBreakpoints ?? [])))
                                : imageBreakpoints;

      const attrs = getResponsiveImageAttributes({
        src,
        urlEndpoint,
        transformation: [...transformation],
        queryParameters,
        transformationPosition,
        width: options.width,
        sizes: (options as any).sizes,
        deviceBreakpoints: (options as any).deviceBreakpoints,
        imageBreakpoints: widthBreakpoints,
      });

      // Store responsive attrs on options for getHTMLAttributes to read
      (options as any)._ik_srcset = attrs.srcSet;
      (options as any)._ik_sizes = attrs.sizes;

      return attrs.src;
    }

    // Non-responsive or Astro-handled responsive: build a single IK URL
    // Include width/height in the transformation so the IK URL reflects the requested dimensions
    const sizeTransformation: Transformation = {};
    if (options.width && options.densities) {
      sizeTransformation.width = options.width;
      sizeTransformation.crop = 'at_max';
    }

    return buildSrc({
      src,
      urlEndpoint,
      transformation: [sizeTransformation, ...transformation],
      queryParameters,
      transformationPosition,
    });
  },

  getSrcSet(options: ImageTransform, _imageConfig: AstroConfig['image']) {
    // If IK responsive mode handled srcSet, return empty - srcSet is set via getHTMLAttributes
    if (shouldUseIKResponsive(options)) {
      return [];
    }

    // For Astro layout/widths/densities: generate IK URLs for each width variant
    const { densities } = options;
    const targetWidth = options.width;
    const targetHeight = options.height;

    if (!targetWidth || !targetHeight) {
      return [];
    }

    const aspectRatio = targetWidth / targetHeight;
    const sortNumeric = (a: number, b: number) => a - b;

    let allWidths: Array<{ width: number; descriptor: string }> = [];

    if (densities) {
      const densityValues = (densities as (number | string)[]).map((d) =>
        typeof d === 'number' ? d : Number.parseFloat(d),
      );
      const densityWidths = densityValues
        .sort(sortNumeric)
        .map((d) => Math.round(targetWidth * d));
      allWidths = densityWidths.map((w, i) => ({
        width: w,
        descriptor: `${densityValues[i]}x`,
      }));
    }

    return allWidths.map(({ width, descriptor }) => {
      const height = Math.round(width / aspectRatio);
      const { width: adjustedWidth, height: adjustedHeight } = getDimensionsUnder25MP(width, height);
      return {
        transform: {
          ...options,
          width: adjustedWidth,
          height: adjustedHeight,
        },
        descriptor,
        attributes: {},
      };
    });
  },

  getHTMLAttributes(options: ImageTransform) {
    // Destructure standard image service props that shouldn't appear as HTML attributes
    const {
      src,
      width,
      height,
      format,
      quality,
      densities,
      widths,
      formats,
      priority,
      sizes,
      fit,
      position,
      layout,
      ...attributes
    } = options as any;

    // Remove IK-specific props from HTML attributes
    for (const prop of IK_PROP_NAMES) {
      delete attributes[prop];
    }

    const result: Record<string, any> = {
      ...attributes,
      width,
      height,
      loading: attributes.loading ?? 'lazy',
      decoding: attributes.decoding ?? 'async',
    };

    // If IK responsive mode generated srcSet/sizes, include them
    if ((options as any)._ik_srcset) {
      result.srcset = (options as any)._ik_srcset;
    }
    if ((options as any)._ik_sizes) {
      result.sizes = (options as any)._ik_sizes;
    }

    // If Astro set sizes (from layout computation), pass it through
    if (sizes && !result.sizes) {
      result.sizes = sizes;
    }

    if (fit) {
      result.style = `${result.style ?? ''} object-fit: ${fit};`.trim();
    }
    if (position) {
      result.style = `${result.style ?? ''} object-position: ${position};`.trim();
    }
    if (layout) {
      if (layout === 'constrained') {
        result.style = `${result.style ?? ''} max-width: 100%;`.trim();
      } else if (layout === 'full-width') {
        result.style = `${result.style ?? ''} width: 100%;`.trim();
      }
    }
    return result;
  },
};

export default service;
