import { buildSrc } from '@imagekit/javascript';
import type { Transformation } from '@imagekit/javascript';
import { getImageKitConfig, type ImageKitConfig } from '../lib/imagekit.js';

export interface GetImagekitUrlOptions {
  /** Relative path or absolute URL of the image */
  src: string;
  /** Array of ImageKit transformations to apply */
  transformation?: Transformation[];
  /** Additional query parameters */
  queryParameters?: Record<string, string | number>;
  /** ImageKit URL endpoint override */
  urlEndpoint?: string;
  /** Transformation position: 'path' or 'query' */
  transformationPosition?: 'path' | 'query';
}

/**
 * Generates an ImageKit URL with transformations applied.
 * 
 * Can be used outside of components for programmatic URL generation.
 * 
 * @example
 * ```ts
 * import { getImagekitUrl } from '@imagekit/astro/helpers';
 * 
 * const url = getImagekitUrl({
 *   src: '/my-image.jpg',
 *   transformation: [{ width: 800, height: 600 }],
 * });
 * ```
 */
export function getImagekitUrl(options: GetImagekitUrlOptions, config?: Partial<ImageKitConfig>): string {
  const resolvedConfig = getImageKitConfig({
    urlEndpoint: options.urlEndpoint ?? config?.urlEndpoint,
    transformationPosition: options.transformationPosition ?? config?.transformationPosition,
  });

  return buildSrc({
    src: options.src,
    urlEndpoint: resolvedConfig.urlEndpoint,
    transformation: options.transformation,
    queryParameters: options.queryParameters,
    transformationPosition: resolvedConfig.transformationPosition,
  });
}
