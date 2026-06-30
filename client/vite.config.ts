import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/camarero_virtual/' : '/',
  publicDir: path.resolve(__dirname, '../public'),
  plugins: [
    react(),
    {
      name: 'manifest-base',
      transformIndexHtml(html) {
        const base = process.env.NODE_ENV === 'production' ? '/camarero_virtual/' : '/';
        return html.replace(/href="\.\/manifest\.json"/g, `href="${base}manifest.json"`);
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
