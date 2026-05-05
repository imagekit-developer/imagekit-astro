import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import imagekit from '@imagekit/astro/integration';

export default defineConfig({
  output: 'server',
  integrations: [
    imagekit({
      urlEndpoint: 'https://ik.imagekit.io/demo/',
      additionalEndpoints: ['https://ik.imgkit.net'],
    }),
  ],
  adapter: node({
    mode: 'standalone',
  }),
  image: {
    layout: 'constrained',
    domains: ['placehold.co']
  }
});
