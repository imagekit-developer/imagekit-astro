import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

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
  adapter: node({
    mode: 'standalone',
  }),
});
