// Components
export { default as Image } from './src/components/Image.astro';
export { default as Video } from './src/components/Video.astro';

// Helpers
export { getOgImageTags } from './src/helpers';
export type { OgMetaTag } from './src/helpers';

// Re-export functions from @imagekit/javascript
export {
  buildSrc,
  buildTransformationString,
  getResponsiveImageAttributes,
  ImageKitAbortError,
  ImageKitInvalidRequestError,
  ImageKitServerError,
  ImageKitUploadNetworkError,
  upload,
} from '@imagekit/javascript';

// Types - Astro SDK types
export type {ImageProps, OgImageTagOptions, VideoProps } from './src/types/index';

// Types - Re-export from @imagekit/javascript
export type {
  GetImageAttributesOptions,
  ResponsiveImageAttributes,
  SrcOptions,
  Transformation,
  UploadOptions,
  UploadResponse,
} from '@imagekit/javascript';
