import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/device-check/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3004,
    proxy: {
      '/api': {
        target: 'http://test.dobaraindia.com',
        changeOrigin: true,
        // The test gateway rejects a browser Origin from localhost/LAN even though the
        // request is same-origin from the H5 page's perspective through this proxy.
        headers: { Origin: 'http://test.dobaraindia.com' },
      },
    },
  },
});
