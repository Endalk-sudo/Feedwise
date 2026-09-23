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
        // Split long-lived vendor code out of the entry chunk so app deploys
        // don't invalidate the (largest, rarely changing) library bundle.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return;
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'vendor-react';
          if (id.includes('@tanstack')) return 'vendor-query';
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
          if (id.includes('@radix-ui') || id.includes('lucide-react') || id.includes('sonner'))
            return 'vendor-ui';
          if (id.includes('@ai-sdk') || id.includes('/ai/') || id.includes('better-auth'))
            return 'vendor-ai';
          return 'vendor';
        },
      },
    },
  },
});