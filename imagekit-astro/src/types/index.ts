import type { Transformation } from '@imagekit/javascript';

/**
 * Props for the Video component.
 * Extends standard HTML video attributes with ImageKit-specific options.
 */
export interface VideoProps {
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
 * Options for generating OpenGraph and Twitter Card meta tags.
 */
export interface OgImageTagOptions {
  /** Relative path or absolute URL of the image */
  src: string;

  /**
   * ImageKit URL endpoint. Overrides PUBLIC_IMAGEKIT_URL_ENDPOINT/IMAGEKIT_URL_ENDPOINT env vars.
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

  /** Shared title used for OG and Twitter when specific titles are not set */
  title?: string;

  /** OpenGraph title. Falls back to `title`, then `twitterTitle` for backward compatibility */
  ogTitle?: string;

  /** Twitter title. Falls back to `title`, then `ogTitle` */
  twitterTitle?: string;

  /** Shared description used for OG and Twitter when specific descriptions are not set */
  description?: string;

  /** OpenGraph description. Falls back to `description`, then `twitterDescription` for backward compatibility */
  ogDescription?: string;

  /** Twitter description. Falls back to `description`, then `ogDescription` */
  twitterDescription?: string;

  /** Twitter card type. Default: summary_large_image */
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';

  /** OG image width. Default: 1200 */
  width?: number;

  /** OG image height. Default: 630 */
  height?: number;

  /** Image format override */
  format?: 'auto' | 'webp' | 'jpg' | 'jpeg' | 'png' | 'gif' | 'svg' | 'mp4' | 'webm' | 'avif' | 'orig';
}

/**
 * Props for the Image component.
 * Combines Astro's RemoteImageProps with ImageKit-specific options.
 */
export interface ImageProps {
  /** ImageKit URL endpoint */
  urlEndpoint?: string;
  /** Array of ImageKit transformations */
  transformation?: Transformation[];
  /** Additional query parameters */
  queryParameters?: Record<string, string | number>;
  /** Position of transformation string in URL */
  transformationPosition?: 'path' | 'query';
  /** Enable responsive srcSet generation */
  responsive?: boolean;
  /** HTML sizes attribute for responsive images */
  sizes?: string;
  /** Custom device-width breakpoints */
  deviceBreakpoints?: number[];
  /** Custom image-specific breakpoints */
  imageBreakpoints?: number[];
  /** Format for the image */
  format?: Transformation['format'];
}
