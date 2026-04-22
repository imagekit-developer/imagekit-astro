import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    'index': './index.ts',
    'integration': './src/integration.ts',
    'helpers': './src/helpers/index.ts',
    'server': './src/server/index.ts',
    'imagekit-service': './src/services/imagekit-service.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  bundle: true,
  sourcemap: true,
  minify: false,
  external: [
    'astro',
    'astro:assets',
    '@imagekit/javascript',
    /\.astro$/,
  ],
})
