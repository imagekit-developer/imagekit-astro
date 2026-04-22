

/**
 * ImageKit configuration options.
 * Can be passed as props to override environment variable defaults.
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
 * Resolves ImageKit configuration from props and/or environment variables.
 * 
 * Priority: prop overrides > environment variables
 * 
 * @throws {Error} If no urlEndpoint is available from either source.
 */
export function getImageKitConfig(overrides?: Partial<ImageKitConfig>): ImageKitConfig {
  const urlEndpoint =
    overrides?.urlEndpoint ??
    import.meta.env.PUBLIC_IMAGEKIT_URL_ENDPOINT ??
    import.meta.env.IMAGEKIT_URL_ENDPOINT;

  if (!urlEndpoint) {
    throw new Error(
      'An ImageKit URL endpoint is required. Set PUBLIC_IMAGEKIT_URL_ENDPOINT or IMAGEKIT_URL_ENDPOINT in your environment, or pass urlEndpoint as a prop.'
    );
  }

  return {
    urlEndpoint,
    transformationPosition: overrides?.transformationPosition ?? 'query',
  };
}
