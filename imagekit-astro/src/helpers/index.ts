import { buildSrc } from '@imagekit/javascript';
import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from '../constants/sizes';
import { getImageKitConfig } from '../lib/imagekit';
import type { OgImageUrlOptions } from '../types';

/**
 * Build the final ImageKit CDN URL for an Open Graph / social image.
 *
 * Returns just the URL string. Use this when you want to plug the URL into
 * your own metadata system, or render `<meta>` tags by hand. For the
 * common case, prefer the `<OgImage>` component, which renders the full
 * set of OG/Twitter tags for you.
 *
 * ImageKit serves the optimal image format automatically based on the
 * requesting client (no `format` option needed).
 */
export function getOgImageUrl(props: OgImageUrlOptions): string {
  const {
    src,
    urlEndpoint,
    transformation = [],
    queryParameters,
    transformationPosition,
    width = OG_IMAGE_WIDTH,
    height = OG_IMAGE_HEIGHT,
  } = props;

  const config = getImageKitConfig({ urlEndpoint, transformationPosition });

  return buildSrc({
    src,
    urlEndpoint: config.urlEndpoint,
    transformation: [...transformation, { width, height }],
    queryParameters,
    transformationPosition: config.transformationPosition,
  });
}
