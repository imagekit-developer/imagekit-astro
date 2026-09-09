[<img width="250" alt="ImageKit.io" src="https://raw.githubusercontent.com/imagekit-developer/imagekit-javascript/master/assets/imagekit-light-logo.svg"/>](https://imagekit.io)

# ImageKit.io Astro SDK

[![npm version](https://img.shields.io/npm/v/@imagekit/astro)](https://www.npmjs.com/package/@imagekit/astro)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Twitter Follow](https://img.shields.io/twitter/follow/imagekitio?label=Follow&style=social)](https://twitter.com/ImagekitIo)

## Introduction

ImageKit Astro SDK plugs ImageKit.io into Astro's built-in image pipeline. It allows you to:

- Render images with Astro's `<Image />` and `<Picture />` components, served from ImageKit with automatic optimization, responsive `srcset`, and lazy loading.
- Apply real-time transformations (resize, crop, focus, quality, format) using URL parameters.
- Apply AI-powered transformations such as background removal, generative fill, and smart cropping via the `transformation` prop.
- Render optimized `<Video />` tags backed by ImageKit.
- Generate OpenGraph / Twitter Card meta tags pointing to ImageKit URLs with the `<OgImage>` component (or the `getOgImageUrl()` helper for custom layouts).
- Generate server-side upload authentication parameters with `getUploadAuthParams()`.

## How it works

The SDK ships as an Astro **integration** that registers a custom **image service**. Once added to `astro.config.mjs`, it takes over Astro's image pipeline for the whole site — `<Image />`, `<Picture />`, `getImage()`, and even markdown `![]()` images all flow through it.

The service is **host-aware**. For each image, it inspects the `src` and routes the request to one of two backends:

1. **ImageKit fast-path** — when `src` is an ImageKit URL (your `urlEndpoint` host, any `additionalEndpoints` host, or a bare path like `"folder/photo.jpg"`), the service builds an ImageKit URL with the requested transformations and points the browser at `https://ik.imagekit.io/...` directly. No server processing, no `/_image` round-trip — just a CDN-cached URL with `?tr=...` parameters.

2. **Sharp fallback** — when `src` is a local Astro asset (`import` of an image, or markdown `![](../foo.jpg)`) or an absolute URL on a non-ImageKit host (e.g. an allow-listed third-party domain), the service delegates to Astro's bundled sharp service. The image is processed at build time (or on-demand by Astro's `/_image` endpoint in SSR) exactly as if you had no integration installed.

This means you can drop the integration into an existing Astro project without breaking any of its existing local-asset usage. Local assets keep working via sharp; ImageKit URLs get the full ImageKit treatment.

Both paths work in every output mode — `static`, `server`, and prerendered routes inside a server build. At build time the sharp path emits optimized files into `dist/_astro/`, while the ImageKit path always emits CDN URLs and never writes files.

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

## Loading images from your ImageKit Media Library

You can use [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/) together with the [`@imagekit/nodejs`](https://www.npmjs.com/package/@imagekit/nodejs) SDK to power gallery/listing pages directly from your ImageKit Media Library, without hand-maintaining a list of URLs.

Install the Node SDK as a dev dependency (it's only used at build time):

```bash
npm install -D @imagekit/nodejs
```

Define a collection backed by `client.assets.list()`. The Node SDK returns an array of `File | Folder` objects directly, so pass `type: 'file'` to exclude folders and `fileType: 'image'` to limit results to images. Shape each entry as `{ id, ...data }` — Astro's content layer treats the top-level `id` as the entry key and validates everything else against your `schema`:

```ts
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import ImageKit from '@imagekit/nodejs';
import type { Files } from '@imagekit/nodejs/resources/files/files';

const client = new ImageKit({
  privateKey: import.meta.env.IMAGEKIT_PRIVATE_KEY,
});

const gallery = defineCollection({
  loader: async () => {
    const assets = await client.assets.list({
      type: 'file',       // exclude folders
      fileType: 'image',  // only image files
      skip: 0,
      limit: 50,
    });

    return assets
      .filter((asset): asset is Files.File =>
        asset.type === 'file' && !!asset.fileId && !!asset.url
      )
      .map((asset) => ({
        id: asset.fileId ?? '',
        url: asset.url ?? '',
        width: asset.width ?? 0,
        height: asset.height ?? 0,
        name: asset.name ?? '',
        tags: asset.tags ?? [],
      }));
  },
  schema: z.object({
    url: z.string().url(),
    width: z.number(),
    height: z.number(),
    name: z.string(),
    tags: z.array(z.string()),
  }),
});

export const collections = { gallery };
```

After adding the collection, run `astro sync` (or start the dev server) so Astro generates the collection types used by `getCollection()`.

Render with `<Image>` from `astro:assets` — the integration's image service generates the IK CDN URL with the correct transformations:

```astro
---
import { Image } from 'astro:assets';
import { getCollection } from 'astro:content';

const photos = await getCollection('gallery');
---
{photos.map(({ data }) => (
  <Image src={data.url} width={data.width} height={data.height} alt={data.name} />
))}
```

> Keep your `privateKey` in a server-only env var (e.g. `IMAGEKIT_PRIVATE_KEY` in `.env`, never prefixed with `PUBLIC_`). Collection loaders run at build time (or in SSR endpoints), never in the browser.

## Documentation

Refer to the ImageKit [official documentation](https://imagekit.io/docs/integration/astro) for setup instructions, configuration options, and the full API reference.
