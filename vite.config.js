import { defineConfig } from 'vite'

export default defineConfig({
  base: '/ScienceAnim/', // <-- set this to your repo name, with slashes
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true
  },
  server: {
    port: 3000,
    open: true,
    host: true
  },
  preview: {
    port: 4173,
    open: true
  }
}) 