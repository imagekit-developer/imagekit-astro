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

The test app uses the `@imagekit/astro` integration with a Node adapter in `astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import imagekit from '@imagekit/astro/integration';

export default defineConfig({
  output: 'server',
  integrations: [imagekit()],
  adapter: node({
    mode: 'standalone',
  }),
});
```

When using the `@imagekit/astro` package in your own project, you need to add the integration to your Astro config. The Node adapter is required for server-side features like upload authentication.

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
2. **Client-side**: Use the `upload` function from [`@imagekit/javascript`](https://www.npmjs.com/package/@imagekit/javascript) to upload files. Fetch the authentication parameters from your API endpoint before calling `upload`.

See `/upload` for a live demo.

