import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // In docker compose, VITE_PROXY_TARGET=http://server:5000 (container DNS).
    // Locally (npm run dev) it defaults to http://localhost:5000.
    proxy: {
      '/setting': {
        target: process.env.VITE_PROXY_TARGET ?? 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: process.env.VITE_PROXY_TARGET ?? 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  // Build configuration for SPA routing
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});