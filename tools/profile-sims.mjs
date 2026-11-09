// Measure how hard every simulation works the CPU, so the heavy ones can be found before a
// student's Chromebook finds them. Run after `npm run build`:
//   npm run profile [-- --phone --only ising,sandpile --ms 1500]
// For each simulation it plays every story chapter and times each animation frame's work, and
// writes profile.json with the simulations ranked by their worst chapter. A budget laptop or phone
// is roughly 4–5× slower than a desktop, so on a desktop aim for under ~3.5 ms a frame.
// (--slow N asks Chromium to throttle the CPU N×, but its slowdown is far from proportional:
// compare runs made with the same setting only.)

import { writeFileSync, existsSync } from 'node:fs';
import { chromium } from '@playwright/test';

const arg = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`);
  return i < 0 ? dflt : process.argv[i + 1] ?? true;
};
const SLOW = +arg('slow', 1); // Chromium CPU throttling (see above)
const PHONE = process.argv.includes('--phone');
const ONLY = arg('only', '') ? String(arg('only')).split(',') : null;
const PER_CHAPTER = +arg('ms', 1500);

process.env.NODE_ENV = 'production';
const { preview } = await import('vite');
if (!existsSync('dist/index.html')) {
  console.error('No build found: run `npm run build` first.');
  process.exit(1);
}
const PORT = 4191;
const server = await preview({ preview: { port: PORT, strictPort: true, open: false } });
const base = `http://localhost:${PORT}/ScienceAnim/`;

// time every requestAnimationFrame callback: that is the simulation's update + draw for the frame
const hook = () => {
  const raf = window.requestAnimationFrame.bind(window);
  window.__frames = [];
  window.requestAnimationFrame = (cb) =>
    raf((t) => {
      const t0 = performance.now();
      cb(t);
      window.__frames.push([t0, performance.now() - t0]);
    });
};

const browser = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext(
  PHONE
    ? { viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
    : { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 },
);
await ctx.addInitScript(hook);
// experiment: --noshadow turns canvas shadows off, to see what blurred text and glows cost
if (process.argv.includes('--noshadow'))
  await ctx.addInitScript(() =>
    Object.defineProperty(CanvasRenderingContext2D.prototype, 'shadowBlur', { set() {}, get: () => 0 }),
  );
const page = await ctx.newPage();
await page.route((url) => !url.href.startsWith(base), (r) => r.abort());
const cdp = await ctx.newCDPSession(page);

await page.goto(base);
await page.locator('.card').first().waitFor();
let ids = await page.$$eval('.card', (cs) => cs.map((c) => c.dataset.id));
if (ONLY) ids = ids.filter((id) => ONLY.includes(id));

const stats = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const at = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))] ?? 0;
  return { p50: at(0.5), p95: at(0.95) };
};

const results = [];
for (const id of ids) {
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await page.goto(`${base}#/sim/${id}`);
  await page.reload(); // a fresh page per sim, so one sim's garbage doesn't bill the next
  await page.locator('.player .stage-host canvas').first().waitFor();
  await page.waitForTimeout(400);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: SLOW });
  const chapters = await page.locator('.sc-dots button').count();
  const per = [];
  for (let ch = 0; ch < Math.max(1, chapters); ch++) {
    if (chapters) await page.evaluate((i) => document.querySelector(`.sc-dots button[data-ch="${i}"]`).click(), ch);
    await page.waitForTimeout(400); // let the chapter's tweens and set-up pass
    const from = await page.evaluate(() => performance.now());
    await page.waitForTimeout(PER_CHAPTER);
    const fr = await page.evaluate((from) => window.__frames.filter(([t]) => t >= from), from);
    const span = fr.length > 1 ? fr.at(-1)[0] - fr[0][0] : PER_CHAPTER;
    const { p50, p95 } = stats(fr.map(([, d]) => d));
    per.push({ ch, fps: fr.length > 1 ? ((fr.length - 1) * 1000) / span : 0, p50, p95 });
  }
  const worst = per.reduce((a, b) => (b.p50 > a.p50 ? b : a));
  const r = { id, worstChapter: worst.ch, fps: worst.fps, p50: worst.p50, p95: worst.p95, chapters: per };
  results.push(r);
  console.log(`  ${id.padEnd(22)} ch${worst.ch}  ${worst.p50.toFixed(1).padStart(6)} ms  p95 ${worst.p95.toFixed(1).padStart(6)} ms  ${worst.fps.toFixed(0).padStart(3)} fps`);
}

await browser.close();
await new Promise((r) => server.httpServer.close(r));

results.sort((a, b) => b.p50 - a.p50);
writeFileSync('profile.json', JSON.stringify({ slow: SLOW, phone: PHONE, results }, null, 1));
console.log(`\nWorst first (${PHONE ? 'phone' : 'desktop'}${SLOW > 1 ? `, CPU throttled ${SLOW}×` : ''}); aim for under ~3.5 ms on a desktop:`);
for (const r of results.slice(0, 20))
  console.log(`  ${r.id.padEnd(22)} ${r.p50.toFixed(1).padStart(6)} ms  ${r.fps.toFixed(0).padStart(3)} fps  (chapter ${r.worstChapter})`);
