# Changelog

All notable changes to `@imagekit/astro` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-05-05

First stable release of the official ImageKit SDK for Astro. Drop-in components and an Astro integration for delivering optimized, transformed images and videos through ImageKit, plus server-side helpers for secure uploads.

### Added

- **Astro integration** — register ImageKit once in `astro.config.mjs` and use the components anywhere, including inside Markdown and MDX.
- **Built-in image service** (`@imagekit/astro/image-service`) — opt-in Astro image service so the native `<Image />` from `astro:assets`, Markdown images, and MDX images all route through ImageKit automatically with responsive `srcset`/`sizes`, lazy loading, and full transformation support (resize, crop, focus, AI transforms, overlays, etc.).
- **`<Video />` component** — adaptive video delivery with ImageKit transformations.
- **`<OgImage />` component** — generate Open Graph / social share images on the fly using ImageKit transformations and overlays.
- **`getOgImageUrl` helper** — build OG/social image URLs programmatically from layouts and endpoints.
- **Server helpers** (`@imagekit/astro/server`) — `getUploadAuthParams` for issuing secure client-side upload tokens (HMAC-SHA1 signature, server-only, private API key never shipped to the browser).
- **TypeScript-first** — full types for components, transformations, and helpers.
- **Wide Astro compatibility** — tested against Astro 3, 4, 5, and 6 via end-to-end Playwright tests.
- **Provenance-signed npm releases** — published with `npm publish --provenance` for supply-chain transparency.

### Compatibility

- Astro `>= 3.2.0`
- Node.js `>= 18`

[1.0.0]: https://github.com/imagekit-developer/imagekit-astro/releases/tag/v1.0.0
