import type { Transformation } from '@imagekit/javascript';
import type { HTMLAttributes } from 'astro/types';

/**
 * Props for the Video component.
 *
 * Extends standard HTML `<video>` attributes with ImageKit-specific options.
 * `src` is required and overridden to be a string (relative IK path or
 * absolute URL). All other HTML video attributes (controls, autoplay, loop,
 * muted, poster, preload, etc.) are typed via Astro's `HTMLAttributes`.
 */
export interface VideoProps extends Omit<HTMLAttributes<'video'>, 'src'> {
  /** Relative path or absolute URL of the video in your ImageKit account */
  src: string;

  /**
   * ImageKit URL endpoint. Overrides the value from
   * `imagekit({ urlEndpoint })` in `astro.config.mjs` and
    * `IMAGEKIT_URL_ENDPOINT` env var.
   */
  urlEndpoint?: string;

  /** Array of ImageKit transformations to apply */
  transformation?: Transformation[];

  /** Additional query parameters to append to the URL */
  queryParameters?: Record<string, string | number>;

  /** Position of transformation string in URL: 'path' or 'query' (default) */
  transformationPosition?: 'path' | 'query';
}

/**
 * Options for generating OpenGraph and Twitter Card meta tags.
 *
 * The output format is delegated to ImageKit's automatic format selection
 * (it serves WebP/AVIF based on the requesting client's `Accept` header), so
 * there is no explicit `format` option here.
 */
export interface OgImageUrlOptions {
  /** Relative path or absolute URL of the image */
  src: string;

  /**
   * ImageKit URL endpoint. Overrides the value from
   * `imagekit({ urlEndpoint })` in `astro.config.mjs` and
    * `IMAGEKIT_URL_ENDPOINT` env var.
   */
  urlEndpoint?: string;

  /** Array of ImageKit transformations to apply */
  transformation?: Transformation[];

  /** Additional query parameters to append to the URL */
  queryParameters?: Record<string, string | number>;

  /** Position of transformation string in URL */
  transformationPosition?: 'path' | 'query';

  /** OG image width. Default: 1200 */
  width?: number;

  /** OG image height. Default: 630 */
  height?: number;
}

/**
 * Props for the `<OgImage>` component. Extends `OgImageUrlOptions` with the
 * fields needed to render the full set of OG/Twitter `<meta>` tags.
 */
export interface OgImageProps extends OgImageUrlOptions {
  /** Alt text. Emitted as both `og:image:alt` and `twitter:image:alt`. */
  alt?: string;

  /** OpenGraph object type. Default: `'website'` */
  type?: 'website' | 'article' | 'book' | 'profile' | (string & {});

  /** Shared title used for OG and Twitter when specific titles are not set */
  title?: string;

  /** OpenGraph title. Falls back to `title`. */
  ogTitle?: string;

  /** Twitter title. Falls back to `title`. */
  twitterTitle?: string;

  /** Shared description used for OG and Twitter when specific descriptions are not set */
  description?: string;

  /** OpenGraph description. Falls back to `description`. */
  ogDescription?: string;

  /** Twitter description. Falls back to `description`. */
  twitterDescription?: string;

  /** Twitter card type. Default: `'summary_large_image'` */
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
}


