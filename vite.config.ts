import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/AI_ldyx-game/' : './',
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  test: {
    environment: 'node',
  },
});
