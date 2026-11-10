// Link pages (sim/<id>/, with preview tags) and the offline service worker. Runs against the production build.
import { test, expect } from '@playwright/test';

const desktopOnly = (info) => test.skip(info.project.name !== 'desktop', 'one browser is enough');

test.describe('link pages and offline', () => {
  test('a simulation link page carries its preview tags and opens that view', async ({ page, request }, info) => {
    desktopOnly(info);
    const html = await (await request.get('./sim/projectile/?ch=2&angle=30')).text();
    expect(html).toContain('<title>Projectile Motion · ScienceAnim</title>');
    expect(html).toMatch(/<meta property="og:image" content="https:\/\/[^"]+\/thumbs\/projectile\.jpg"/);
    expect(html).toMatch(/<link rel="canonical" href="https:\/\/[^"]+\/sim\/projectile\/"/);

    await page.goto('./sim/projectile/?ch=2&angle=30');
    await expect(page).toHaveURL(/\/ScienceAnim\/#\/sim\/projectile\?ch=2&angle=30$/);
    await expect(page.locator('.story-card')).toBeVisible();
    // the gallery and other sims work as usual from here
    await page.locator('[data-act=back]').click();
    await expect(page).toHaveURL(/\/ScienceAnim\/#\/$/);
    await expect(page.locator('.card').first()).toBeVisible();
  });

  test('the sitemap lists every simulation page', async ({ request }, info) => {
    desktopOnly(info);
    const xml = await (await request.get('./sitemap.xml')).text();
    expect(xml).toContain('/sim/vision/</loc>');
    expect((xml.match(/<loc>/g) || []).length).toBeGreaterThan(90);
  });

  test('after one visit, every simulation opens offline', async ({ page, context }, info) => {
    desktopOnly(info);
    await page.goto('./?sw');
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller)
        await new Promise((r) => navigator.serviceWorker.addEventListener('controllerchange', r, { once: true }));
    });
    await context.setOffline(true);
    // a simulation this visit never loaded, through its link page
    await page.goto('./sim/vision/?ch=2');
    await expect(page).toHaveURL(/#\/sim\/vision\?ch=2$/);
    await expect(page.locator('.story-card')).toBeVisible();
    await expect(page.locator('.load-error')).toHaveCount(0);
    await page.goto('./#/sim/semiconductors');
    await expect(page.locator('.story-card')).toBeVisible();
    await expect(page.locator('.load-error')).toHaveCount(0);
    await context.setOffline(false);
  });
});
