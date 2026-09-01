import axe from 'axe-core';
import { expect, test } from '@playwright/test';

test('landing and demo have no serious accessibility findings', async ({ page }) => {
  for (const path of ['/', '/demo', '/privacy', '/terms']) {
    await page.goto(path);
    await page.addScriptTag({ content: axe.source });
    const results = await page.evaluate(async () => {
      const runner = (window as unknown as { axe: typeof axe }).axe;
      return runner.run(document);
    });
    const serious = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''));
    expect(serious, `${path}: ${serious.map((item) => item.id).join(', ')}`).toEqual([]);
  }
});

test('routes have one h1 and no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  for (const path of ['/', '/demo', '/play', '/privacy', '/terms', '/missing-page']) {
    await page.goto(path);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  }
  expect(errors).toEqual([]);
});

test('@mobile game fits a 390px viewport', async ({ page }) => {
  await page.goto('/demo');
  const width = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(width.scroll).toBeLessThanOrEqual(width.client);
  await expect(page.locator('[data-tool="tend"]')).toBeVisible();
});

test('@claim:rendering-rate animation reaches 55 frames per second', async ({ page }) => {
  await page.goto('/demo');
  const rate = await page.evaluate(async () => {
    let frames = 0;
    const start = performance.now();
    await new Promise<void>((resolve) => {
      const count = (now: number) => {
        frames += 1;
        if (now - start >= 1_000) resolve();
        else requestAnimationFrame(count);
      };
      requestAnimationFrame(count);
    });
    return frames;
  });
  expect(rate).toBeGreaterThanOrEqual(55);
});
