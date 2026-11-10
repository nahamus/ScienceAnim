// Render every simulation's images from the production build, once, at deploy time. Run after `npm run build`:
//   npm run thumbs
// Writes
//   dist/thumbs/<id>.jpg + dist/thumbs/index.json ({ files: { id: "id.jpg?v=<hash>" } })  gallery cards
//   dist/og/<id>.jpg                                                                       1200×630 link previews
// Link pages are built pointing at a site-wide fallback preview (icons/og-default.png, see tools/site-pages.js);
// each one whose preview rendered is switched to its own image here. Anything that fails keeps the fallback,
// and the gallery renders any card missing from the manifest live instead.

import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { chromium } from '@playwright/test';
import { OG_W, OG_H, ogFallback, ogFor, SITE_IMAGE } from './site-pages.js';

process.env.NODE_ENV = 'production'; // vite.config picks the /ScienceAnim/ base from this
const { preview } = await import('vite');

const PORT = 4190;
const OUT = 'dist/thumbs';
const OG = 'dist/og';
if (!existsSync('dist/index.html')) {
  console.error('No build found: run `npm run build` first.');
  process.exit(1);
}

const server = await preview({ preview: { port: PORT, strictPort: true, open: false } });
const base = `http://localhost:${PORT}/ScienceAnim/`;
// On a machine with a GPU, WebGL simulations render on it; CI runners fall back to SwiftShader.
const browser = await chromium.launch(process.env.CI ? {} : { args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const jpeg = (url) => {
  if (typeof url !== 'string' || !url.startsWith('data:image/jpeg')) throw new Error('no image returned');
  return Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
};
/** Point a built page's preview tags at this simulation's own image. */
const usePreview = (page, id) => {
  if (!existsSync(page)) return;
  const html = readFileSync(page, 'utf8');
  writeFileSync(page, html.replaceAll(ogFallback(), ogFor(id)));
};

let failed = 0;
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', (e) => console.warn('  page error:', e.message));
  await page.goto(`${base}?export-thumbs#/`);
  await page.waitForFunction(() => window.__saExport, null, { timeout: 30_000 });
  const ids = await page.evaluate(() => window.__saExport.ids);
  mkdirSync(OUT, { recursive: true });
  mkdirSync(OG, { recursive: true });
  const files = {};
  let previews = 0;
  const t0 = Date.now();
  for (const id of ids) {
    const t = Date.now();
    try {
      const buf = jpeg(await page.evaluate((id) => window.__saExport.render(id), id));
      const hash = createHash('sha256').update(buf).digest('hex').slice(0, 10);
      writeFileSync(`${OUT}/${id}.jpg`, buf);
      files[id] = `${id}.jpg?v=${hash}`;
      let note = '';
      try {
        const og = jpeg(await page.evaluate(([id, w, h]) => window.__saExport.render(id, w, h), [id, OG_W, OG_H]));
        writeFileSync(`${OG}/${id}.jpg`, og);
        usePreview(`dist/sim/${id}/index.html`, id);
        if (id === SITE_IMAGE) usePreview('dist/index.html', id);
        previews++;
      } catch (err) {
        note = `  (no preview image: ${err.message.split('\n')[0]})`;
      }
      console.log(`  ${id.padEnd(22)} ${String(Date.now() - t).padStart(6)} ms  ${(buf.length / 1024).toFixed(0)} KB${note}`);
    } catch (err) {
      failed++;
      console.warn(`  ${id.padEnd(22)} FAILED: ${err.message.split('\n')[0]}`);
    }
  }
  writeFileSync(`${OUT}/index.json`, JSON.stringify({ files }));
  console.log(
    `Rendered ${Object.keys(files).length} of ${ids.length} thumbnails and ${previews} link previews in ${((Date.now() - t0) / 1000).toFixed(1)} s.`,
  );
} finally {
  await browser.close();
  await new Promise((r) => server.httpServer.close(r));
}
// a few failures just fall back to live rendering; most failing means something is wrong
if (failed > 5) process.exit(1);
