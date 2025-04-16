import { defineConfig } from 'vite';

export default defineConfig({
  // Use environment variable or default to '/' for Vercel
  base: process.env.DEPLOY_TARGET === 'gh-pages' ? '/learning-2025-playcanvas-spz/' : '/',
  build: {
    outDir: 'dist',
  }
}); 