import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Gera o build no "root" do repositório para servir como site estático
    // (ex.: GitHub Pages/Cloudflare Pages), mantendo `assets/`, `favicon.svg`, etc.
    outDir: '.',
    emptyOutDir: false,
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Split vendor chunks for better caching
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
        },
      },
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
});
