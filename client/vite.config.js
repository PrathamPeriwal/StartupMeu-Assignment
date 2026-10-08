import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Same-origin /api in dev, so the auth cookie works without CORS.
  server: { proxy: { '/api': process.env.API_URL ?? 'http://localhost:4000' } },
});
