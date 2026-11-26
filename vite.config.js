import { defineConfig } from 'vite'
import simManifest from './tools/sim-manifest.js'
import sitePages from './tools/site-pages.js'

export default defineConfig({
  // Served from the root of https://scienceanim.nahamus.com (see public/CNAME), in dev and production alike
  base: '/',
  root: 'src',
  plugins: [simManifest({ dir: 'js/sims' }), sitePages({ sims: 'js/sims' })],
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