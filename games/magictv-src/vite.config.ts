import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative paths so the built game works from any folder (e.g. a games/magictv subfolder).
  base: './',
  // Local only: the children's computer should not be reachable from the home
  // network. To test from another device on purpose: npm run dev -- --host
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
  },
});