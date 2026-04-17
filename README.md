# @imagekit/astro

Astro SDK for [ImageKit.io](https://imagekit.io) — optimized image & video delivery with real-time transformations, responsive images, and automatic format optimization.

[![npm version](https://img.shields.io/npm/v/@imagekit/astro)](https://www.npmjs.com/package/@imagekit/astro)
[![license](https://img.shields.io/npm/l/@imagekit/astro)](./LICENSE)

## Quick Start

### 1. Install

```bash
npm install @imagekit/astro
# or
pnpm add @imagekit/astro
# or
yarn add @imagekit/astro
```

### 2. Configure

Add your ImageKit URL endpoint to your `.env` file:

```env
PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

> Get your URL endpoint from the [ImageKit dashboard](https://imagekit.io/dashboard/url-endpoints).

Also, add the ImageKit service to your Astro config:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  image: {
    service: {
      entrypoint: '@imagekit/astro/image-service',
      config: {
        urlEndpoint: 'https://ik.imagekit.io/your_imagekit_id',
      },
    },
  },
});
```

### 3. Use

```astro
---
import { Image } from '@imagekit/astro';
---

<Image
  src="/default-image.jpg"
  alt="A beautiful image"
  width={800}
  height={600}
  transformation={[{ quality: 80 }]}
/>
```

---

## Components

### `<Image />`
Uses Astro's built-in `<Image />` component with ImageKit transformations. This provides Astro's native image optimization features while leveraging ImageKit's URL-based transformations.

```astro
---
import { Image } from '@imagekit/astro';
---

<!-- Basic usage -->
<Image
  urlEndpoint="https://ik.imagekit.io/your_id"
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={630}
/>

<!-- With transformations -->
<Image
  urlEndpoint="https://ik.imagekit.io/your_id"
  src="/hero.jpg"
  alt="Cropped hero"
  transformation={[{ width: 600, height: 400, focus: "auto" }]}
  width={600}
  height={400}
/>

<!-- With Astro-specific props -->
<Image
  urlEndpoint="https://ik.imagekit.io/your_id"
  src="/hero.jpg"
  alt="Optimized hero"
  width={800}
  height={600}
  format="webp"
  quality={80}
  loading="eager"
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | *required* | Relative path or absolute ImageKit URL |
| `alt` | `string` | *required* | Alt text for accessibility |
| `urlEndpoint` | `string` | env var | Overrides `PUBLIC_IMAGEKIT_URL_ENDPOINT` |
| `transformation` | `Transformation[]` | `[]` | Array of ImageKit transformations |
| `queryParameters` | `Record<string, string \| number>` | — | Additional URL query parameters |
| `transformationPosition` | `'path' \| 'query'` | `'query'` | Where to place transformations in the URL |
| `responsive` | `boolean` | `true` | Generate responsive `srcSet` and `sizes` |
| `sizes` | `string` | — | HTML `sizes` attribute for responsive images |
| `deviceBreakpoints` | `number[]` | `[640,750,828,1080,1200,1920,2048,3840]` | Custom device-width breakpoints |
| `imageBreakpoints` | `number[]` | `[16,32,48,64,96,128,256,384]` | Custom image-specific breakpoints |
| `width` | `number \| string` | — | Image width |
| `height` | `number \| string` | — | Image height |
| `format` | `string` | — | Image format (webp, avif, jpg, png, etc.) |
| `quality` | `number` | — | Image quality (1-100) |
| `loading` | `'lazy' \| 'eager'` | `'lazy'` | Image loading strategy |
| `class` | `string` | — | CSS class(es) to add |

All standard Astro `<Image />` props are also supported.

---

### `<Video />`

Renders a `<video>` element with an ImageKit-optimized source URL.

```astro
---
import { Video } from '@imagekit/astro';
---

<Video
  src="/sample-video.mp4"
  width={640}
  height={360}
  controls
  transformation={[{ width: 640, height: 360 }]}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | *required* | Relative path or absolute ImageKit URL |
| `urlEndpoint` | `string` | env var | Overrides `PUBLIC_IMAGEKIT_URL_ENDPOINT` |
| `transformation` | `Transformation[]` | `[]` | Array of ImageKit transformations |
| `queryParameters` | `Record<string, string | number>` | — | Additional URL query parameters |
| `transformationPosition` | `'path' | 'query'` | `'query'` | Where to place transformations in the URL |
| `class` | `string` | — | CSS class(es) to add |

All standard HTML `<video>` attributes (`controls`, `autoplay`, `loop`, `muted`, `poster`, etc.) are supported.

---

### `<OgImage />`

Generates OpenGraph and Twitter Card `<meta>` tags with ImageKit-optimized image URLs. Place it inside `<head>`.

```astro
---
import { OgImage } from '@imagekit/astro';
---

<html>
<head>
  <OgImage
    src="/og-banner.jpg"
    alt="My page description"
    twitterTitle="Check out this page!"
    transformation={[{ width: 1200, height: 630 }]}
  />
</head>
<body>...</body>
</html>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | *required* | Relative path or absolute ImageKit URL |
| `twitterTitle` | `string` | *required* | Title for `twitter:title` and `og:title` meta tags |
| `twitterDescription` | `string` | — | Description for `twitter:description` and `og:description` meta tags |
| `alt` | `string` | — | Alt text for `og:image:alt` |
| `urlEndpoint` | `string` | env var | Overrides `PUBLIC_IMAGEKIT_URL_ENDPOINT` |
| `transformation` | `Transformation[]` | `[]` | Array of ImageKit transformations |
| `width` | `number | string` | `1200` | OG image width |
| `height` | `number | string` | `630` | OG image height |
| `format` | `string` | — | Image format override for Twitter image (default: `webp`) |

#### Generated Meta Tags

```html
<meta property="og:title" content="..." />
<meta property="og:image" content="..." />
<meta property="og:image:secure_url" content="..." />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="..." />
<meta property="twitter:title" content="..." />
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:image" content="..." />
```

---


## Transformations

This SDK supports all [ImageKit transformations](https://imagekit.io/docs/transformations). Transformations are passed as an array of objects:

```typescript
transformation={[
  { width: 400, height: 300 },           // Resize
  { quality: 80 },                       // Compression
  { format: 'webp' },                    // Format conversion
  { focus: 'auto' },                     // Smart crop
  { blur: 10 },                          // Blur effect
  { grayscale: true },                   // Grayscale
  { rotation: 90 },                      // Rotation
  { radius: 'max' },                     // Rounded corners
  { overlay: { type: 'text', text: 'Hello', transformation: [{ fontSize: 50 }] } },  // Text overlay
]}
```

### Chained Transformations

Multiple objects in the array create [chained transformations](https://imagekit.io/docs/transformations#chained-transformations):

```astro
<Image
  src="/photo.jpg"
  alt="Chained transformations"
  transformation={[
    { width: 400, height: 300 },  // First: resize
    { rotation: 45 },             // Then: rotate
  ]}
  width={400}
  height={300}
/>
```

### Transformation Position

By default, transformations are added as query parameters (`?tr=w-400,h-300`). Set `transformationPosition="path"` to use path-based transformations (`/tr:w-400,h-300/`):

```astro
<Image
  src="/photo.jpg"
  alt="Path-based transforms"
  transformationPosition="path"
  transformation={[{ width: 400 }]}
  width={400}
  height={300}
/>
```

---

## Configuration

### Environment Variable

Set `PUBLIC_IMAGEKIT_URL_ENDPOINT` in your `.env` (or `.env.local`) file. This is used as the default `urlEndpoint` for all components and helpers:

```env
PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

### Per-Component Override

Pass `urlEndpoint` directly to any component to override the environment variable:

```astro
<Image
  urlEndpoint="https://ik.imagekit.io/different_account"
  src="/image.jpg"
  alt="Different account"
  width={400}
  height={300}
/>
```

---

## Uploading Files

The SDK provides a `getUploadAuthParams` server-side helper that generates the authentication parameters (signature, token, expire) needed for client-side file uploads to ImageKit.

> **Important:** `getUploadAuthParams` must only be called on the server. Never expose your **private key** to the client.

### Setup

Add your ImageKit keys to `.env`:

```env
IMAGEKIT_PRIVATE_KEY=your_private_key
IMAGEKIT_PUBLIC_KEY=your_public_key
```

### Step 1: Create an Astro API Endpoint

Create a server-side endpoint that returns auth parameters. Astro API endpoints must export named HTTP method handlers. Make sure to add an adapter to your astro project and render the upload endpoint on demand. Refer astro docs for [on-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/) for more details.

```ts
// src/pages/api/upload-auth.ts
import type { APIRoute } from 'astro';
import { getUploadAuthParams } from '@imagekit/astro/server';

export const prerender = false;

export const GET: APIRoute = async () => {
  const authParams = getUploadAuthParams({
    privateKey: import.meta.env.IMAGEKIT_PRIVATE_KEY,
    publicKey: import.meta.env.IMAGEKIT_PUBLIC_KEY,
  });

  return new Response(JSON.stringify(authParams), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

### Step 2: Upload from the Client

Use the `upload` function (re-exported from `@imagekit/javascript`) to upload files. Fetch auth parameters from your endpoint before each upload.

```astro
---
// src/pages/upload.astro
---

<html>
<body>
  <input type="file" id="file-input" />
  <button id="upload-btn">Upload</button>
  <pre id="result"></pre>

  <script>
    import { upload } from '@imagekit/astro';

    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    const uploadBtn = document.getElementById('upload-btn') as HTMLButtonElement;
    const result = document.getElementById('result') as HTMLPreElement;

    uploadBtn.addEventListener('click', async () => {
      const file = fileInput.files?.[0];
      if (!file) return;

      // Fetch auth params from your server endpoint
      const res = await fetch('/api/upload-auth');
      const authParams = await res.json();

      const response = await upload({
        file,
        fileName: file.name,
        publicKey: import.meta.env.IMAGEKIT_PUBLIC_KEY,
        ...authParams,
      });

      result.textContent = JSON.stringify(response, null, 2);
    });
  </script>
</body>
</html>
```

### `getUploadAuthParams` Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `privateKey` | `string` | Yes | Your ImageKit private key |
| `publicKey` | `string` | Yes | Your ImageKit public key |
| `token` | `string` | No | Custom token (auto-generated UUID if omitted) |
| `expire` | `number` | No | Expiry timestamp in seconds (defaults to 30 min from now) |

### `getUploadAuthParams` Response

| Field | Type | Description |
|-------|------|-------------|
| `token` | `string` | Unique upload token |
| `signature` | `string` | HMAC-SHA1 signature for authentication |
| `expire` | `number` | Expiry timestamp (seconds since epoch) |
| `publicKey` | `string` | publicKey for passing in upload API request |

For the full list of `upload()` parameters, see the [@imagekit/javascript documentation](https://imagekit.io/docs/integration/javascript).


---

## Contributing

### Setup

```bash
git clone https://github.com/imagekit-developer/imagekit-astro.git
cd imagekit-astro
pnpm install
```

### Development

```bash
cd test-app
pnpm dev          # Watch mode for the package
```

### Testing

```bash
cd test-app
pnpm test:e2e          # Run Playwright E2E tests
pnpm test:e2e-update   # Update E2E snapshots
```

---

## License

[MIT](./LICENSE)
