// Shareable links (#/sim/<id>?ch=3&angle=45): the format itself, and opening links in the app.

import { test, expect } from '@playwright/test';
import { parseShare, buildShare } from '../src/js/share.js';

const DEF = {
  id: 'demo',
  params: [
    { key: 'angle', type: 'range', min: 0, max: 90, step: 1, value: 40 },
    { key: 'speed', type: 'range', min: 0, max: 10, step: 0.1, value: 5 },
    { key: 'drag', type: 'toggle', value: false },
    { key: 'world', type: 'select', value: 'earth', options: [{ value: 'earth' }, { value: 'moon' }] },
    { key: 'level', type: 'select', value: 1, options: [{ value: 1 }, { value: 2 }] },
    { key: 'secret', type: 'range', min: 0, max: 1, value: 0, hidden: true },
    { key: 'fire', type: 'button' },
  ],
  story: [{ params: { angle: 20 } }, { params: { drag: true } }, { params: { speed: 8 } }],
};

test.describe('link format', () => {
  test('only values that differ from the chapter are written', () => {
    // chapter 3 (index 2) inherits angle 20 and drag on from earlier chapters, and sets speed 8
    const base = { angle: 20, speed: 8, drag: true, world: 'earth', level: 1, secret: 0 };
    expect(buildShare(DEF, 2, base)).toBe('#/sim/demo?ch=3');
    expect(buildShare(DEF, 2, { ...base, angle: 45.4, world: 'moon', level: 2, secret: 1 })).toBe(
      '#/sim/demo?ch=3&angle=45&world=moon&level=2',
    );
    expect(buildShare(DEF, 0, { ...base, speed: 3.14159 })).toBe('#/sim/demo?ch=1&speed=3.1&drag=1');
  });

  test('links round-trip', () => {
    const values = { angle: 70, speed: 2.5, drag: false, world: 'moon', level: 2 };
    const hash = buildShare(DEF, 1, values);
    expect(parseShare(DEF, hash.split('?')[1])).toEqual({ chapter: 1, params: { angle: 70, speed: 2.5, drag: false, world: 'moon', level: 2 } });
  });

  test('bad or hand-edited links are tamed, not trusted', () => {
    expect(parseShare(DEF, '')).toBeNull();
    expect(parseShare(DEF, 'utm_source=mail')).toBeNull();
    expect(parseShare(DEF, 'ch=99&angle=500&speed=abc&world=mars&level=7&secret=1&fire=1')).toEqual({
      chapter: 2,
      params: { angle: 90 },
    });
    expect(parseShare(DEF, 'ch=-4&drag=true')).toEqual({ chapter: 0, params: { drag: true } });
    expect(parseShare({ ...DEF, story: undefined }, 'ch=2&angle=10')).toEqual({ chapter: 0, params: { angle: 10 } });
  });
});

test.describe('opening links', () => {
  test.beforeEach(async ({ page }) => {
    await page.route((url) => !/^https?:\/\/(localhost|127\.0\.0\.1)[:/]/.test(url.href), (r) => r.abort());
  });

  test('opens at the shared chapter and settings, with auto-play off', async ({ page }) => {
    // (chapter 2 holds still; some chapters animate a control themselves, and the URL follows)
    await page.goto('./#/sim/projectile?ch=2&angle=30');
    await expect(page.locator('.sc-step')).toHaveText('02 / 06');
    await expect(page.locator('.ctl-range').first().locator('output')).toHaveText(/^30\b/);
    await expect(page.locator('.sc-mode')).toHaveText('Auto-play off');
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/#\/sim\/projectile\?ch=2&angle=30$/);
  });

  test('the address bar follows chapters without adding history', async ({ page }) => {
    await page.goto('./#/');
    await page.goto('./#/sim/projectile');
    const length = await page.evaluate(() => history.length);
    await page.locator('.sc-dots button[data-ch="4"]').dispatchEvent('click');
    await expect(page).toHaveURL(/\?ch=5$/);
    expect(await page.evaluate(() => history.length)).toBe(length);
    await page.goBack();
    await expect(page.locator('.card').first()).toBeVisible();
  });

  test('a garbled link still opens the simulation', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('./#/sim/projectile?ch=zz&angle=%%&nonsense');
    await expect(page.locator('.sc-step')).toHaveText('01 / 06');
    expect(errors).toEqual([]);
  });

  test('the link button copies the current view', async ({ page, context, browserName }, info) => {
    test.skip(info.project.name.startsWith('phone'), 'phones use the system share sheet');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('./#/sim/projectile?ch=2&angle=30');
    await page.locator('[data-act=share]').click();
    await expect(page.locator('.toast')).toHaveText('Link copied');
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied, browserName).toMatch(/\/ScienceAnim\/#\/sim\/projectile\?ch=2&angle=30$/);
  });
});
