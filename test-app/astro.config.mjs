import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

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
  adapter: node({
    mode: 'standalone',
  }),
});
