import { defineConfig } from 'vite';

// Vite config — static SPA. Build output to dist/ for Render Static Site.
// VITE_API_URL is injected at build time (see .env / Render env vars).
export default defineConfig({
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
