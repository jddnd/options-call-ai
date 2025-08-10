/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    globals:true,
    environment: 'jsdom',
  },
  server: {
    allowedHosts: [
      '16f99e92-2870-44e2-a457-becf0eaaa78b-00-2nvqxl1xu191c.kirk.replit.dev'
    ],
  },
});