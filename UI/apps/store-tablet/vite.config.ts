import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: '/tablet/',
  plugins: [react()],
  server: {
    port: 3002,
    /**
     * TAB-P0-14 — the check page opens from the tablet, so in dev it must live on the
     * tablet's origin: a separate port would give it its own localStorage and the
     * demoBus (device-check session state) could not reach the tablet.
     */
    proxy: {
      '/device-check': {
        target: 'http://localhost:3004',
        changeOrigin: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
