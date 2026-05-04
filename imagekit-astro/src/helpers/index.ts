import { buildSrc } from '@imagekit/javascript';
import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from '../constants/sizes';
import { getImageKitConfig } from '../lib/imagekit';
import type { OgImageTagOptions } from '../types';

export interface OgMetaTag {
  property: string;
  content: string;
}

/**
 * Build OG/Twitter meta tags for a given image.
 *
 * Render these tags inside your page's <head>. ImageKit serves the optimal
 * image format automatically based on the requesting client (no `format`
 * option needed).
 */
export function getOgImageTags(props: OgImageTagOptions): OgMetaTag[] {
  const {
    src,
    alt,
    title,
    ogTitle,
    twitterTitle,
    description,
    ogDescription,
    twitterDescription,
    twitterCard = 'summary_large_image',
    urlEndpoint,
    transformation = [],
    queryParameters,
    transformationPosition,
    width = OG_IMAGE_WIDTH,
    height = OG_IMAGE_HEIGHT,
  } = props;

  const resolvedOgTitle = ogTitle ?? title ?? twitterTitle;
  const resolvedTwitterTitle = twitterTitle ?? title ?? ogTitle;

  const resolvedOgDescription = ogDescription ?? description ?? twitterDescription;
  const resolvedTwitterDescription = twitterDescription ?? description ?? ogDescription;

  if (!resolvedOgTitle && !resolvedTwitterTitle) {
    throw new Error(
      '[getOgImageTags] A title is required. Provide one of: title, ogTitle, or twitterTitle.',
    );
  }

  const config = getImageKitConfig({ urlEndpoint, transformationPosition });

  const imageUrl = buildSrc({
    src,
    urlEndpoint: config.urlEndpoint,
    transformation: [...transformation, { width, height }],
    queryParameters,
    transformationPosition: config.transformationPosition,
  });

  const tags: Array<OgMetaTag | undefined> = [
    resolvedOgTitle ? { property: 'og:title', content: resolvedOgTitle } : undefined,
    resolvedOgDescription ? { property: 'og:description', content: resolvedOgDescription } : undefined,
    { property: 'og:image', content: imageUrl },
    { property: 'og:image:secure_url', content: imageUrl },
    { property: 'og:image:width', content: String(width) },
    { property: 'og:image:height', content: String(height) },
    alt ? { property: 'og:image:alt', content: alt } : undefined,
    resolvedTwitterTitle ? { property: 'twitter:title', content: resolvedTwitterTitle } : undefined,
    resolvedTwitterDescription
      ? { property: 'twitter:description', content: resolvedTwitterDescription }
      : undefined,
    { property: 'twitter:card', content: twitterCard },
    { property: 'twitter:image', content: imageUrl },
  ];

  return tags.filter((tag): tag is OgMetaTag => Boolean(tag));
}

