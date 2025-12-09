import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Add base configuration for Netlify
  base: '/',
  // Optional: Optimize build
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps for faster build
    rollupOptions: {
      output: {
        manualChunks: undefined, // Keep as single bundle
      }
    }
  },
})