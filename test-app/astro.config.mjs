import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import imagekit from '@imagekit/astro/integration';

export default defineConfig({
  integrations: [imagekit()],
  adapter: node({
    mode: 'standalone',
  }),
});
