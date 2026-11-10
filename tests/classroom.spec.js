// Classroom features: printable worksheets, recorded clips and lesson playlists. Runs against the production build.
import { test, expect } from '@playwright/test';
import { parseLesson, lessonHash } from '../src/js/lesson.js';

const desktopOnly = (info) => test.skip(info.project.name !== 'desktop', 'one browser is enough');

test.describe('lesson links', () => {
  const known = new Set(['refraction', 'rainbows', 'vision']);
  test('round-trip a lesson and drop unknown or repeated ids', () => {
    const plan = { title: 'Light & sight', ids: ['refraction', 'rainbows', 'vision'] };
    const hash = lessonHash(plan, 1);
    expect(hash).toBe('#/lesson/2?t=Light+%26+sight&s=refraction,rainbows,vision');
    expect(parseLesson(hash.split('?')[1], known)).toEqual(plan);
    expect(parseLesson('s=vision,nope,vision,rainbows', known)).toEqual({ title: '', ids: ['vision', 'rainbows'] });
  });
});

test.describe('classroom', () => {
  test('a worksheet has every chapter, its questions and an answer key', async ({ page }, info) => {
    desktopOnly(info);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('./#/sim/vision');
    await page.locator('[data-act=share]').click();
    await page.getByRole('menuitem', { name: 'Printable worksheet' }).click();
    await expect(page).toHaveURL(/#\/sheet\/vision$/);
    await expect(page.locator('.sheet h1')).toHaveText('How We See');
    await expect(page.locator('.sh-ch')).toHaveCount(13);
    await expect(page.locator('.sh-q')).toHaveCount(4);
    await expect(page.locator('.sh-key li')).toHaveCount(4);
    await expect(page.locator('[data-act=print]')).toHaveText('Print', { timeout: 60_000 });
    await expect(page.locator('.sh-pic img')).toHaveCount(13);

    // printing hides the toolbar; unticking a part hides it on paper too
    await page.getByLabel('Answer key').uncheck();
    await expect(page.locator('.sh-key')).toBeHidden();
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.sheet-bar')).toBeHidden();
    await page.emulateMedia({ media: 'screen' });

    await page.locator('[data-act=back]').click();
    await expect(page).toHaveURL(/#\/sim\/vision$/);
    expect(errors).toEqual([]);
  });

  test('records a clip of the animation and downloads it', async ({ page }, info) => {
    desktopOnly(info);
    await page.goto('./#/sim/projectile');
    await page.locator('[data-act=share]').click();
    await page.getByRole('menuitem', { name: 'Record a clip' }).click();
    await expect(page.locator('.rec')).toBeVisible();
    await page.waitForTimeout(1500);
    const [download] = await Promise.all([page.waitForEvent('download'), page.locator('.rec button').click()]);
    expect(download.suggestedFilename()).toMatch(/^projectile-clip\.(mp4|webm)$/);
    const path = await download.path();
    const { statSync } = await import('node:fs');
    expect(statSync(path).size).toBeGreaterThan(5_000);
    await expect(page.locator('.rec')).toHaveCount(0);
  });

  test('a teacher builds a lesson in the gallery and steps through it', async ({ page, context }, info) => {
    desktopOnly(info);
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('./#/');
    await page.getByRole('button', { name: 'Make a lesson' }).click();
    for (const id of ['refraction', 'rainbows', 'vision']) await page.locator(`.card[data-id="${id}"]`).click();
    await expect(page).toHaveURL(/#\/$/); // picking doesn't open the cards
    await page.getByLabel('Lesson title').fill('Light & sight');
    // reorder: move "How We See" (3rd) earlier
    await page.getByRole('button', { name: 'Move How We See earlier' }).click();
    await expect(page.locator('.lt-items li span')).toHaveText(['Light, Lenses & Rainbows', 'How We See', 'How Rainbows Form']);

    await page.getByRole('button', { name: 'Copy lesson link' }).click();
    const link = await page.evaluate(() => navigator.clipboard.readText());
    expect(link).toMatch(/\/ScienceAnim\/#\/lesson\/1\?t=Light\+%26\+sight&s=refraction,vision,rainbows$/);

    await page.goto(link);
    const bar = page.locator('.lesson-bar');
    await expect(bar).toContainText('Light & sight');
    await expect(bar).toContainText('1 of 3');
    await expect(page.locator('.p-title h1')).toHaveText('Light, Lenses & Rainbows');
    await bar.getByRole('link', { name: /Next: How We See/ }).click();
    await expect(page.locator('.p-title h1')).toHaveText('How We See');
    await expect(bar).toContainText('2 of 3');
    await bar.getByRole('link', { name: '3' }).click();
    await expect(page.locator('.p-title h1')).toHaveText('How Rainbows Form');
    await expect(bar.getByRole('link', { name: 'Lesson complete' })).toBeVisible();
  });

  test('a lesson title from the link is shown as text, never as markup', async ({ page }, info) => {
    desktopOnly(info);
    await page.goto('./#/lesson/1?t=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E&s=vision');
    await expect(page.locator('.lb-title b')).toHaveText('<img src=x onerror=alert(1)>');
    await expect(page.locator('.lesson-bar img')).toHaveCount(0);
  });
});
