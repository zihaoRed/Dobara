import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/device-check/',
  plugins: [react()],
  server: { port: 3004 },
});
