# Changelog

All notable changes to `@imagekit/astro` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.3](https://github.com/imagekit-developer/imagekit-astro/compare/1.0.2...1.0.3) (2026-09-17)


### Bug Fixes

* **deps:** require @imagekit/javascript ^5.5.0 and set up Release Please ([202f720](https://github.com/imagekit-developer/imagekit-astro/commit/202f72028ccf18622b3a480c80fc077960436863))
* **deps:** require @imagekit/javascript ^5.5.0 for density transformation support ([f8f8f87](https://github.com/imagekit-developer/imagekit-astro/commit/f8f8f87a274cbc0c56b94447d05d81d303dae96e))

## [1.0.2] - 2026-09-09

### Fixed

- **Static builds and prerendered routes no longer fail for ImageKit images.** Because the image service delegates local assets to sharp (and therefore exposes sharp's `transform`), Astro classifies it as a *local* service. During `astro build` with `output: 'static'` — or for any prerendered route in `output: 'server'` — Astro handed every image to its static image pipeline, which rewrote the ImageKit URL to a `/_astro/<hash>` file and then tried to read the source from disk. Bare ImageKit paths (`src="/photo.jpg"`) crashed the build with `ENOENT: no such file or directory, open '<outDir>/photo.jpg'`, and absolute ImageKit URLs were silently fetched and re-encoded by sharp, dropping every transformation. The service now keeps ImageKit-eligible images out of that pipeline so they resolve to CDN URLs in every output mode, while local imports and allow-listed third-party hosts still go through sharp.

### Changed

- **Astro 7 is now part of the test matrix.** End-to-end tests run against Astro 3, 4, 5, 6, and 7.
- **End-to-end coverage for prerendered routes.** The test app now includes a prerendered page in its server-output build, so the static image pipeline bypass is exercised on every Astro version in CI.

## [1.0.1] - 2026-05-05

### Fixed

- **`<Picture />` now emits one URL per format.** The image service was discarding the `format` prop, so every `<source>` Astro generated for `<Picture />` resolved to the same URL — defeating the point of multi-format delivery. The service now appends `format` to the final transformation chain step as `f-<format>`, so each `<source>` correctly requests its own format from ImageKit (`f-avif`, `f-webp`, etc.).

### Changed

- **`format` prop on `<Image />` is now honored.** Previously ignored; now appended to the final transformation chain step as `f-<format>`. When unset, no `f-` parameter is emitted so ImageKit's default `f-auto` negotiation still applies. Note: imported local assets cause Astro to auto-fill `format` from the file extension — to force `f-auto` in that case, override via `transformation: [{ format: 'auto' }]`.

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
[1.0.1]: https://github.com/imagekit-developer/imagekit-astro/releases/tag/v1.0.1
[1.0.2]: https://github.com/imagekit-developer/imagekit-astro/releases/tag/v1.0.2
