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
    'virtual:@imagekit/astro/config',
    /\.astro$/,
  ],
  // Copy .astro source files into dist so the relative imports kept by
  // tsup (e.g. `./src/components/Video.astro`) resolve correctly when the
  // built `dist/index.js` is consumed from the published package.
  onSuccess: 'rm -rf dist/src && cp -R src dist/src',
})
