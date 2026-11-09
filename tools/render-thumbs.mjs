// Render every simulation's gallery thumbnail from the production build, once, so visitors download
// a small JPEG instead of running each simulation in their browser. Run after `npm run build`:
//   npm run thumbs
// Writes dist/thumbs/<id>.jpg and dist/thumbs/index.json ({ files: { id: "id.jpg?v=<hash>" } }).
// Any simulation that fails is left out of the manifest, and the gallery renders it live instead.

import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { chromium } from '@playwright/test';

process.env.NODE_ENV = 'production'; // vite.config picks the /ScienceAnim/ base from this
const { preview } = await import('vite');

const PORT = 4190;
const OUT = 'dist/thumbs';
if (!existsSync('dist/index.html')) {
  console.error('No build found: run `npm run build` first.');
  process.exit(1);
}

const server = await preview({ preview: { port: PORT, strictPort: true, open: false } });
const base = `http://localhost:${PORT}/ScienceAnim/`;
// On a machine with a GPU, WebGL simulations render on it; CI runners fall back to SwiftShader.
const browser = await chromium.launch(process.env.CI ? {} : { args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
let failed = 0;
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', (e) => console.warn('  page error:', e.message));
  await page.goto(`${base}?export-thumbs#/`);
  await page.waitForFunction(() => window.__saExport, null, { timeout: 30_000 });
  const ids = await page.evaluate(() => window.__saExport.ids);
  mkdirSync(OUT, { recursive: true });
  const files = {};
  const t0 = Date.now();
  for (const id of ids) {
    const t = Date.now();
    try {
      const url = await page.evaluate((id) => window.__saExport.render(id), id);
      if (typeof url !== 'string' || !url.startsWith('data:image/jpeg')) throw new Error('no image returned');
      const buf = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
      const hash = createHash('sha256').update(buf).digest('hex').slice(0, 10);
      writeFileSync(`${OUT}/${id}.jpg`, buf);
      files[id] = `${id}.jpg?v=${hash}`;
      console.log(`  ${id.padEnd(22)} ${String(Date.now() - t).padStart(6)} ms  ${(buf.length / 1024).toFixed(0)} KB`);
    } catch (err) {
      failed++;
      console.warn(`  ${id.padEnd(22)} FAILED: ${err.message.split('\n')[0]}`);
    }
  }
  writeFileSync(`${OUT}/index.json`, JSON.stringify({ files }));
  console.log(`Rendered ${Object.keys(files).length} of ${ids.length} thumbnails in ${((Date.now() - t0) / 1000).toFixed(1)} s.`);
} finally {
  await browser.close();
  await new Promise((r) => server.httpServer.close(r));
}
// a few failures just fall back to live rendering; most failing means something is wrong
if (failed > 5) process.exit(1);
