[<img width="250" alt="ImageKit.io" src="https://raw.githubusercontent.com/imagekit-developer/imagekit-javascript/master/assets/imagekit-light-logo.svg"/>](https://imagekit.io)

# ImageKit.io Astro SDK

[![npm version](https://img.shields.io/npm/v/@imagekit/astro)](https://www.npmjs.com/package/@imagekit/astro)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Twitter Follow](https://img.shields.io/twitter/follow/imagekitio?label=Follow&style=social)](https://twitter.com/ImagekitIo)

## Introduction

ImageKit Astro SDK plugs ImageKit.io into Astro's built-in image pipeline as an [external image service](https://docs.astro.build/en/reference/image-service-reference/). It allows you to:

- Render images with Astro's `<Image />` and `<Picture />` components, served from ImageKit with automatic optimization, responsive `srcset`, and lazy loading.
- Apply real-time transformations (resize, crop, focus, quality, format) using URL parameters.
- Apply AI-powered transformations such as background removal, generative fill, and smart cropping via the `transformation` prop.
- Render optimized `<Video />` tags backed by ImageKit.
- Generate OpenGraph / Twitter Card meta tags pointing to ImageKit URLs with `getOgImageTags()`.
- Generate server-side upload authentication parameters with `getUploadAuthParams()`.

## Installation

```bash
npm install @imagekit/astro
```

If you call `upload()` (or other helpers) from `@imagekit/javascript` directly in your code, also add it to your project so strict package managers (e.g. pnpm) can resolve it:

```bash
npm install @imagekit/javascript
```

## TypeScript support

The SDK is written in TypeScript and ships with full type definitions. The integration uses Astro's [`injectTypes()`](https://docs.astro.build/en/reference/integrations-reference/#injecttypes-option) helper to register ImageKit-specific props (`urlEndpoint`, `transformation`, `queryParameters`, `transformationPosition`) on the `Astro.CustomImageProps` namespace, so `<Image />`, `<Picture />`, and `getImage()` get full autocomplete and type-checking for these props.

Run `astro sync` (or start the dev server) once after installing so Astro picks up the injected types. For editor support in `.astro` files, install the [Astro VS Code extension](https://marketplace.visualstudio.com/items?itemName=astro-build.astro-vscode); for type-checking from the CLI, use [`@astrojs/check`](https://www.npmjs.com/package/@astrojs/check).

## Documentation

Refer to the ImageKit [official documentation](https://imagekit.io/docs/integration/astro) for setup instructions, configuration options, and the full API reference.
