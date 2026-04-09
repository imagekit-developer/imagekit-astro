// Components
export { default as IKAstroImage } from './src/components/IKAstroImage.astro';
export { default as IKImage } from './src/components/IKImage.astro';
export { default as IKOgImage } from './src/components/IKOgImage.astro';
export { default as IKVideo } from './src/components/IKVideo.astro';

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
export type { IKImageProps, IKOgImageProps, IKVideoProps } from './src/types/index.js';

// Types - Re-export from @imagekit/javascript
export type {
  GetImageAttributesOptions,
  ResponsiveImageAttributes,
  SrcOptions,
  Transformation,
  UploadOptions,
  UploadResponse,
} from '@imagekit/javascript';
