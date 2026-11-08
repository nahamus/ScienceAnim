// Guided stories: quick-check questions ("Predict…") inside story chapters.

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test, expect } from '@playwright/test';

const SIMS_DIR = 'src/js/sims';
const files = readdirSync(SIMS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .flatMap((d) => readdirSync(join(SIMS_DIR, d.name)).map((f) => join(SIMS_DIR, d.name, f)));

test.describe('quick checks', () => {
  test('every question is well formed', async () => {
    let count = 0;
    for (const f of files) {
      const def = (await import(pathToFileURL(f).href)).default;
      const keys = new Set((def.params || []).map((p) => p.key));
      (def.story || []).forEach((ch, i) => {
        if (!ch.check) return;
        count++;
        const where = `${def.id} chapter ${i + 1}`;
        const { q, options, answer, explain, setup } = ch.check;
        expect(i, `${where}: the first chapter can't be a question`).toBeGreaterThan(0);
        expect(typeof q === 'string' && q.length > 10, `${where}: question`).toBe(true);
        expect(options?.length, `${where}: 2–4 options`).toBeGreaterThanOrEqual(2);
        expect(options.length, `${where}: 2–4 options`).toBeLessThanOrEqual(4);
        expect(Number.isInteger(answer) && answer >= 0 && answer < options.length, `${where}: answer index`).toBe(true);
        expect(typeof explain === 'string' && explain.length > 20, `${where}: explanation`).toBe(true);
        for (const k of Object.keys(setup || {})) expect(keys.has(k), `${where}: setup key "${k}"`).toBe(true);
      });
    }
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('quick checks in the player', () => {
  test.beforeEach(async ({ page }) => {
    await page.route((url) => !/^https?:\/\/(localhost|127\.0\.0\.1)[:/]/.test(url.href), (r) => r.abort());
  });

  test('asks first, then reveals the chapter', async ({ page }) => {
    await page.goto('./#/sim/circuits?ch=4');
    const card = page.locator('.story-card');
    await expect(card.locator('.sc-q')).toContainText('in series');
    await expect(card.locator('.sc-text')).toBeHidden(); // the chapter text would give it away
    await expect(card.locator('[data-act=next]')).toHaveText('Show me');
    await expect(page.locator('.player')).toHaveClass(/paused/); // held still while you think

    await card.getByRole('button', { name: 'brighter' }).click();
    await expect(card.locator('.sc-options .wrong')).toHaveText('brighter');
    await expect(card.locator('.sc-options .right')).toHaveText('dimmer');
    await expect(card.locator('.sc-explain')).toContainText('Not quite.');
    await expect(card.locator('.sc-text')).toBeVisible();
    await expect(page.locator('.player')).not.toHaveClass(/paused/);
    await expect(page.locator('.ctl[data-key=layout] .seg button.on')).toHaveText('Series'); // the chapter played out
    await expect(card.locator('[data-act=next]')).toContainText('Next');
  });

  test('"Show me" and → reveal without answering; the answer is kept when you come back', async ({ page }) => {
    await page.goto('./#/sim/projectile?ch=3');
    const card = page.locator('.story-card');
    await card.locator('[data-act=next]').click(); // "Show me"
    await expect(card.locator('.sc-explain')).toContainText('Here’s why.');
    await expect(card.locator('.sc-options .right')).toHaveText('45°');

    await page.keyboard.press('ArrowRight'); // to chapter 4, another question
    await expect(card.locator('.sc-step')).toHaveText('04 / 06');
    await expect(card.locator('[data-act=next]')).toHaveText('Show me');
    await page.keyboard.press('ArrowRight'); // reveals it rather than skipping past
    await expect(card.locator('.sc-step')).toHaveText('04 / 06');
    await expect(card.locator('.sc-explain')).toBeVisible();

    await page.keyboard.press('ArrowLeft');
    await expect(card.locator('.sc-explain')).toContainText('Here’s why.'); // chapter 3 remembered
  });

  test('auto-play waits for an answer', async ({ page }) => {
    await page.clock.install();
    await page.goto('./#/sim/galton');
    const card = page.locator('.story-card');
    await expect(card.locator('.sc-mode')).toHaveText('Auto-play on');
    await card.locator('.sc-dots button[data-ch="1"]').dispatchEvent('click'); // a question chapter
    await expect(card.locator('.sc-q')).toBeVisible();
    await page.clock.runFor(30_000); // well past the chapter's duration
    await expect(card.locator('.sc-step')).toHaveText('02 / 06');
  });

  test('restart forgets the answers', async ({ page }) => {
    await page.goto('./#/sim/seasons?ch=5');
    const card = page.locator('.story-card');
    await card.getByRole('button', { name: 'Winter' }).click();
    await expect(card.locator('.sc-explain')).toContainText('Yes!');
    await page.locator('[data-act=restart]').click();
    await card.locator('.sc-dots button[data-ch="4"]').dispatchEvent('click');
    await expect(card.locator('[data-act=next]')).toHaveText('Show me');
  });
});
