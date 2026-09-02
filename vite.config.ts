import { defineConfig } from 'vite';

const outputDir = process.env.BUILD_OUT_DIR || 'dist';

export default defineConfig({
  build: {
    outDir: outputDir,
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: 'index.html',
        notFound: '404.html',
      },
    },
  },
});
