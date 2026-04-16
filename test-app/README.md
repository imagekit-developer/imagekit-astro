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
        urlEndpoint: 'https://ik.imagekit.io/demo/',
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
