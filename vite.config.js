import { defineConfig } from 'vite'
import simManifest from './tools/sim-manifest.js'

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/ScienceAnim/' : '/',
  root: 'src',
  plugins: [simManifest({ dir: 'js/sims' })],
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