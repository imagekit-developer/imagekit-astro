import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import imagekit from '@imagekit/astro/integration';

export default defineConfig({
  output: 'server',
  integrations: [
    imagekit({
      urlEndpoint: 'https://ik.imagekit.io/demo/',
    }),
  ],
  adapter: node({
    mode: 'standalone',
  }),
  image: {
    layout: 'constrained',
  }
});
