import type { Transformation } from '@imagekit/javascript';

/**
 * Props for the IKImage component.
 * Extends standard HTML img attributes with ImageKit-specific options.
 */
export interface IKImageProps {
  /** Relative path or absolute URL of the image in your ImageKit account */
  src: string;

  /** Alt text for the image (required for accessibility) */
  alt: string;

  /** 
   * ImageKit URL endpoint. Overrides PUBLIC_IMAGEKIT_URL_ENDPOINT env var.
   * Get it from https://imagekit.io/dashboard/url-endpoints 
   */
  urlEndpoint?: string;

  /** Array of ImageKit transformations to apply */
  transformation?: Transformation[];

  /** Additional query parameters to append to the URL */
  queryParameters?: Record<string, string | number>;

  /** Position of transformation string in URL: 'path' or 'query' (default) */
  transformationPosition?: 'path' | 'query';

  /** Enable responsive srcSet generation. Default: true */
  responsive?: boolean;

  /** HTML sizes attribute for responsive images (e.g., "(max-width: 600px) 100vw, 50vw") */
  sizes?: string;

  /** Custom device-width breakpoints for responsive srcSet */
  deviceBreakpoints?: number[];

  /** Custom image-specific breakpoints for responsive srcSet */
  imageBreakpoints?: number[];

  /** Image width */
  width?: number | string;

  /** Image height */
  height?: number | string;

  /** Loading strategy. Default: 'lazy' */
  loading?: 'lazy' | 'eager';

  /** CSS class name(s) */
  class?: string;

  /** Allow any additional HTML img attributes */
  [key: string]: unknown;
}

/**
 * Props for the IKVideo component.
 * Extends standard HTML video attributes with ImageKit-specific options.
 */
export interface IKVideoProps {
  /** Relative path or absolute URL of the video in your ImageKit account */
  src: string;

  /** 
   * ImageKit URL endpoint. Overrides PUBLIC_IMAGEKIT_URL_ENDPOINT env var.
   */
  urlEndpoint?: string;

  /** Array of ImageKit transformations to apply */
  transformation?: Transformation[];

  /** Additional query parameters to append to the URL */
  queryParameters?: Record<string, string | number>;

  /** Position of transformation string in URL: 'path' or 'query' (default) */
  transformationPosition?: 'path' | 'query';

  /** CSS class name(s) */
  class?: string;

  /** Allow any additional HTML video attributes */
  [key: string]: unknown;
}

/**
 * Props for the IKOgImage component.
 * Generates OpenGraph and Twitter Card meta tags.
 */
export interface IKOgImageProps {
  /** Relative path or absolute URL of the image */
  src: string;

  /** 
   * ImageKit URL endpoint. Overrides PUBLIC_IMAGEKIT_URL_ENDPOINT env var.
   */
  urlEndpoint?: string;

  /** Array of ImageKit transformations to apply */
  transformation?: Transformation[];

  /** Additional query parameters to append to the URL */
  queryParameters?: Record<string, string | number>;

  /** Position of transformation string in URL */
  transformationPosition?: 'path' | 'query';

  /** Alt text for og:image:alt meta tag */
  alt?: string;

  /** Required title for twitter:title meta tag. Used for og:title as well */
  twitterTitle: string;

  /** Description for twitter:description meta tag. Used for og:description as well */
  twitterDescription?: string;

  /** OG image width. Default: 1200 */
  width?: number | string;

  /** OG image height. Default: 630 */
  height?: number | string;

  /** Image format override */
  format?: 'auto' | 'webp' | 'jpg' | 'jpeg' | 'png' | 'gif' | 'svg' | 'mp4' | 'webm' | 'avif' | 'orig';
}
