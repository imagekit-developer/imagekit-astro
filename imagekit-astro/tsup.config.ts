import { defineConfig } from 'tsup'

export default defineConfig(() => {
  return {
    clean: true,
    entry: [
      './src/helpers/index.ts',
    ],
    dts: true,
    minify: false,
    bundle: true,
    sourcemap: true,
    format: ['esm'],
    external: ['astro', '@imagekit/javascript', 'node:async_hooks', '#async-local-storage'],
  };
});
