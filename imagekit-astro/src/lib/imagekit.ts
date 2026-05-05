
import {
  urlEndpoint as integrationUrlEndpoint,
  transformationPosition as integrationTransformationPosition,
} from 'virtual:@imagekit/astro/config';

/**
 * ImageKit configuration options.
 * Can be passed as props to override values resolved from the integration
 * config (`astro.config.mjs`) or environment variables.
 */
export interface ImageKitConfig {
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
 * Resolves ImageKit configuration.
 *
 * Priority:
 *   1. Per-call overrides (props)
 *   2. Integration config from `astro.config.mjs` (via virtual module)
 *   3. `IMAGEKIT_URL_ENDPOINT` env var
 *
 * @throws {Error} If no urlEndpoint is available from any source.
 */
export function getImageKitConfig(overrides?: Partial<ImageKitConfig>): ImageKitConfig {
  const urlEndpoint =
    overrides?.urlEndpoint ||
    integrationUrlEndpoint ||
    import.meta.env.IMAGEKIT_URL_ENDPOINT;

  if (!urlEndpoint) {
    throw new Error(
      'An ImageKit URL endpoint is required. Pass urlEndpoint to the imagekit() integration in astro.config.mjs, set IMAGEKIT_URL_ENDPOINT, or pass urlEndpoint as a prop.'
    );
  }

  return {
    urlEndpoint,
    transformationPosition:
      overrides?.transformationPosition ?? integrationTransformationPosition ?? 'query',
  };
}

