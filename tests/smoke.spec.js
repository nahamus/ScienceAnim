// Opens every simulation, plays its story forwards and backwards, pokes every control and the
// stage, and fails on any uncaught error, console error or (on phones) sideways page scroll.

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import { readSimMeta } from '../tools/sim-manifest.js';

const SIMS_DIR = 'src/js/sims';
const SIMS = readdirSync(SIMS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .flatMap((d) => readdirSync(join(SIMS_DIR, d.name)).map((f) => readSimMeta(join(SIMS_DIR, d.name, f))));

const isLocal = (url) => /^https?:\/\/(localhost|127\.0\.0\.1)[:/]/.test(url);

/** Collect everything that should never happen while a simulation runs. */
async function watchErrors(page) {
  const errors = [];
  // web fonts are the only third-party requests; skip them so results don't depend on the network
  await page.route((url) => !isLocal(url.href), (route) => route.abort());
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    const thirdParty = /Failed to load resource/.test(m.text()) && !isLocal(m.location().url);
    if (m.type() === 'error' && !thirdParty) errors.push(`console.error: ${m.text()}`);
    if (m.type() === 'warning' && /failed|could not/i.test(m.text())) errors.push(`console.warn: ${m.text()}`);
  });
  return errors;
}

const frames = (page, n = 2) =>
  page.evaluate((n) => new Promise((r) => {
    const step = () => (--n <= 0 ? r() : requestAnimationFrame(step));
    requestAnimationFrame(step);
  }), n);

test.describe('gallery', () => {
  test('lists every simulation and renders its thumbnail', async ({ page }) => {
    const errors = await watchErrors(page);
    await page.goto('./');
    await expect(page.locator('.card')).toHaveCount(SIMS.length);
    await expect(page.locator('.pills button[data-f=all] small')).toHaveText(String(SIMS.length));
    // thumbnails render one at a time in the background
    await expect(page.locator('.thumb-img.ready')).toHaveCount(SIMS.length, { timeout: 75_000 });
    for (const f of await page.locator('.pills button').all()) {
      await f.dispatchEvent('click'); // the pill row scrolls sideways on phones
      await expect(page.locator('.card:not([hidden])')).toHaveCount(+(await f.locator('small').innerText()));
    }
    expect(errors).toEqual([]);
  });

  test('unknown routes fall back to the gallery', async ({ page }) => {
    await page.goto('./#/sim/does-not-exist');
    await expect(page.locator('.card').first()).toBeVisible();
  });
});

// WebGL sims are tagged @webgl and run in their own GPU-enabled projects (see playwright.config.js).
test.describe('simulations', () => {
  for (const sim of SIMS) simTest(sim);
});

function simTest(sim) {
    test(sim.id, { tag: sim.renderer === 'webgl' ? '@webgl' : [] }, async ({ page }, info) => {
      const errors = await watchErrors(page);
      // no GPU on CI: software WebGL can't draw these shaders at full size, so draw them at 1/8
      if (sim.renderer === 'webgl') test.slow(); // heavy shaders; slower still when two run side by side
      if (process.env.CI && sim.renderer === 'webgl') await page.addInitScript(() => (window.__SIM_RENDER_SCALE = 0.125));
      await page.goto(`./#/sim/${sim.id}`);
      await expect(page).toHaveTitle(`${sim.title} · ScienceAnim`);
      await page.locator('.player .stage-host canvas').first().waitFor();
      await expect(page.locator('.stage-host .error')).toHaveCount(0);
      await page.waitForTimeout(600);

      // story: every chapter forwards, then backwards
      const chapters = await page.locator('.sc-dots button').count();
      const go = (i) => page.evaluate((i) => document.querySelector(`.sc-dots button[data-ch="${i}"]`).click(), i);
      for (let i = 0; i < chapters; i++) {
        await go(i);
        await page.waitForTimeout(450);
      }
      for (let i = chapters - 1; i >= 0; i--) {
        await go(i);
        await page.waitForTimeout(150);
      }

      // controls: sweep sliders to both ends, flip toggles, pick every option, press every button
      const controls = await page.evaluate(() => {
        const box = document.querySelector('.player .controls');
        if (!box) return 0;
        const acts = [];
        for (const r of box.querySelectorAll('input[type=range]'))
          for (const v of [r.min, r.max, (+r.min + +r.max) / 2])
            acts.push(() => {
              r.value = v;
              r.dispatchEvent(new Event('input', { bubbles: true }));
            });
        for (const c of box.querySelectorAll('input[type=checkbox]'))
          acts.push(() => c.click(), () => c.click());
        for (const b of box.querySelectorAll('.seg button')) acts.push(() => b.click());
        for (const b of box.querySelectorAll('.ctl-buttons button')) acts.push(() => b.click());
        window.__acts = acts;
        return acts.length;
      });
      for (let i = 0; i < controls; i++) {
        await page.evaluate((i) => window.__acts[i](), i);
        await frames(page, 3);
      }

      // pointer: press, drag and release across the stage
      const box = await page.locator('.stage-host').boundingBox();
      const at = (fx, fy) => [box.x + box.width * fx, box.y + box.height * fy];
      await page.mouse.move(...at(0.4, 0.45));
      await page.mouse.down();
      await page.mouse.move(...at(0.55, 0.55), { steps: 6 });
      await page.mouse.up();
      await page.mouse.click(...at(0.6, 0.4));
      await page.waitForTimeout(400);

      if (info.project.name === 'phone') {
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        expect(overflow, 'page scrolls sideways').toBeLessThanOrEqual(1);
      }
      expect(errors).toEqual([]);
    });
}
