# @imagekit/astro Test App

This is a demo Astro application for testing the `@imagekit/astro` package.

## Pages

- `/` - Home page with navigation links
- `/videos` - Test cases for the `Video` component
- `/images` - Test cases for the `Image` component

## Running the App

```bash
# From the test-app directory
pnpm install
pnpm dev
```

Then open http://localhost:4321

## Configuration

The test app already includes the ImageKit service configuration in `astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  image: {
    domains: ["imagekit.io"],
    service: {
      entrypoint: '@imagekit/astro/image-service',
      config: {
        urlEndpoint: import.meta.env.PUBLIC_IMAGEKIT_URL_ENDPOINT,
      },
    },
  },
});
```

When using the `@imagekit/astro` package in your own project, you need to add similar configuration to your Astro config.

## Running Tests

```bash
# Run E2E tests
pnpm test:e2e

# Update snapshots
pnpm test:e2e-update
```

## Uploading Files

This demo shows how to implement file uploading in an Astro application using `@imagekit/astro`.

### Implementation Steps

1. **Server-side**: Create an API endpoint (e.g., `src/pages/api/upload-auth.ts`) that uses `getUploadAuthParams` from `@imagekit/astro/server` to generate authentication parameters.
2. **Client-side**: Use the `upload` function from `@imagekit/astro` to upload files. Fetch the authentication parameters from your API endpoint before calling `upload`.

See `/upload` for a live demo.

## Test Cases Covered
 
### Image

- Basic image with urlEndpoint prop
- Image with leading slash in src
- Image with transformation
- Image with queryParameters
- Responsive image with sizes
- Responsive image with fixed sizes (no vw token)
- Image with different urlEndpoint (override)
- Image with custom className
- Image with loading="eager"
- Image with transformationPosition="path"
- Image with transformationPosition="path" + custom transformations
- Absolute URL with transformationPosition="path"
- Image without width (natural size)
- Image with custom deviceBreakpoints
- Image with responsive=false
- Image with format and quality props
### Video


- Basic video with urlEndpoint prop
- Video with leading slash in src
- Video with transformations
- Video with all HTML attributes
- Video with different urlEndpoint (override)
- Video with transformationPosition="path"
- Video with custom class
- Video with queryParameters
- Video with chained transformations
- Video without controls (autoplay, muted, loop)
