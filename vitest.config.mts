import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
  resolve: {
    alias: {
      core: '/src/core',
      utils: '/src/utils',
      parsers: '/src/parsers',
    },
  },
});
