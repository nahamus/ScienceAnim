// Accessibility: axe-core checks the main screens against WCAG 2.1 A/AA. Runs against the production build.
// The animation canvases themselves can't be checked this way; each one is labelled for screen readers instead.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const scan = async (page) => {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  return violations.map((v) => `${v.id} (${v.impact}): ${v.help}\n    ${v.nodes.slice(0, 4).map((n) => n.target.join(' ')).join('\n    ')}`);
};

const SCREENS = {
  gallery: async (page) => {
    await page.goto('./#/');
    await expect(page.locator('.card').first()).toBeVisible();
  },
  'lesson builder': async (page) => {
    await page.goto('./#/');
    await page.getByRole('button', { name: 'Make a lesson' }).click();
    await page.locator('.card[data-id="vision"]').click();
  },
  player: async (page) => {
    await page.goto('./#/sim/projectile');
    await expect(page.locator('.story-card h2')).not.toBeEmpty();
  },
  'player with a quick check and the share menu': async (page) => {
    await page.goto('./#/sim/vision?ch=3');
    await expect(page.locator('.sc-check')).toBeVisible();
    await page.locator('[data-act=share]').click();
  },
  lesson: async (page) => {
    await page.goto('./#/lesson/1?t=Light&s=refraction,vision');
    await expect(page.locator('.lesson-bar')).toBeVisible();
  },
  worksheet: async (page) => {
    await page.goto('./#/sheet/projectile');
    await expect(page.locator('[data-act=print]')).toHaveText('Print', { timeout: 30_000 });
  },
};

test.describe('accessibility', () => {
  test('every simulation names its controls and its animation', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'the controls are the same on phones');
    test.setTimeout(600_000);
    await page.goto('./#/');
    const ids = await page.locator('.card').evaluateAll((cards) => cards.map((c) => c.dataset.id));
    const problems = [];
    for (const id of ids) {
      await page.goto(`./#/sim/${id}`);
      await expect(page.locator('.stage-host canvas[role=img]')).toHaveAttribute('aria-label', /interactive animation/);
      const { violations } = await new AxeBuilder({ page })
        .include('.player')
        .withRules(['label', 'button-name', 'link-name', 'aria-allowed-attr', 'aria-valid-attr-value', 'nested-interactive'])
        .analyze();
      for (const v of violations) problems.push(`${id}: ${v.id} ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
    }
    expect(problems).toEqual([]);
  });

  for (const [name, open] of Object.entries(SCREENS)) {
    test(`${name} has no WCAG A/AA violations`, async ({ page }) => {
      await open(page);
      await page.waitForTimeout(600); // let entrance animations settle (contrast is measured on what's drawn)
      expect(await scan(page)).toEqual([]);
    });
  }
});
