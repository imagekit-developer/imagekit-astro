// Components
export { default as Image } from './src/components/Image.astro';
export { default as OgImage } from './src/components/OgImage.astro';
export { default as Video } from './src/components/Video.astro';

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
export type {ImageProps, OgImageProps, VideoProps } from './src/types/index';

// Types - Re-export from @imagekit/javascript
export type {
  GetImageAttributesOptions,
  ResponsiveImageAttributes,
  SrcOptions,
  Transformation,
  UploadOptions,
  UploadResponse,
} from '@imagekit/javascript';
