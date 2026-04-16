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
