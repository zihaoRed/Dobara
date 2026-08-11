import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { appVersionPlugin } from '../../scripts/viteAppVersionPlugin';

export default defineConfig({
  base: '/consumer/',
  plugins: [react(), appVersionPlugin({ basePath: '/consumer/' })],
  server: {
    port: 3001,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
