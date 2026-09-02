import axe from 'axe-core';
import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('landing and demo have no serious accessibility findings', async ({ page }) => {
  for (const path of ['/', '/demo', '/play', '/privacy', '/terms']) {
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
  for (const path of ['/', '/demo', '/play', '/privacy', '/terms']) {
    await page.goto(path);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  }
  expect(errors).toEqual([]);
  await page.goto('/missing-page');
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveCount(1);
});

test('routes set unique titles, metadata, focus, and HTTP status', async ({ page }) => {
  const routes = [
    ['/', 'Pause Garden — Restore a garden with friends'],
    ['/demo', 'Demo — Pause Garden'],
    ['/play', 'Play — Pause Garden'],
    ['/privacy', 'Privacy — Pause Garden'],
    ['/terms', 'Terms — Pause Garden'],
  ] as const;
  for (const [path, title] of routes) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /\S+/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://pause-garden.sociobot.in${path}`);
  }
  const missing = await page.goto('/missing-page');
  expect(missing?.status()).toBe(404);
  await expect(page).toHaveTitle('Page not found — Pause Garden');

  await page.goto('/');
  await page.getByRole('link', { name: 'Demo', exact: true }).click();
  await expect(page.locator('h1')).toBeFocused();
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('h1')).toBeFocused();
});

test('@claim:build-identity built pages expose one source identity in metadata and the footer', async ({ page }) => {
  await page.goto('/');
  const build = await page.locator('meta[name="pause-garden-build"]').getAttribute('content');
  expect(build).toMatch(/^[0-9a-f]{40}$/);
  await expect(page.locator('.footer-note')).toContainText(`Build ${build!.slice(0, 7)}`);
});

test('@claim:production-default-build the default and named production builds use the production room service', async () => {
  const root = new URL('../../', import.meta.url);
  const packageJson = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
  const bundle = async (directory: string) => {
    const manifest = JSON.parse(await readFile(new URL(`${directory}/build-manifest.json`, root), 'utf8'));
    const script = Object.keys(manifest.assets).find((asset) => asset.endsWith('.js'));
    expect(script).toBeTruthy();
    return readFile(new URL(`${directory}${script}`, root), 'utf8');
  };

  expect(packageJson.scripts['build:production']).toBe('npm run build');
  const production = await bundle('dist');
  const testBundle = await bundle('test-dist');
  expect(production).toContain('https://pause-garden-realtime.sociobot.in');
  expect(production).not.toContain('http://127.0.0.1:8787');
  expect(testBundle).toContain('http://127.0.0.1:8787');
  expect(testBundle).not.toContain('https://pause-garden-realtime.sociobot.in');
});

test('every local page link resolves and legal links remain visible', async ({ page, request }) => {
  await page.goto('/');
  const paths = await page.locator('a[href^="/"]').evaluateAll((links) => [...new Set(links.map((link) => (link as HTMLAnchorElement).pathname))]);
  for (const path of paths) expect((await request.get(path)).status(), path).toBe(200);
  await expect(page.getByRole('link', { name: 'Privacy' }).last()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Terms', exact: true })).toBeVisible();
});

test('@mobile game fits a 390px viewport', async ({ page }) => {
  await page.goto('/demo');
  const width = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(width.scroll).toBeLessThanOrEqual(width.client);
  await expect(page.locator('[data-tool="tend"]')).toBeVisible();
});

test('@claim:rendering-rate animation has stable 55 fps median frame pacing', async ({ page }) => {
  await page.goto('/demo');
  const rate = await page.evaluate(async () => {
    const samples: number[] = [];
    let previous = performance.now();
    await new Promise<void>((resolve) => {
      const count = (now: number) => {
        samples.push(now - previous);
        previous = now;
        if (samples.length >= 90) resolve();
        else requestAnimationFrame(count);
      };
      requestAnimationFrame(count);
    });
    const steady = samples.slice(5).sort((a, b) => a - b);
    const median = steady[Math.floor(steady.length / 2)];
    return 1_000 / median;
  });
  expect(rate).toBeGreaterThanOrEqual(55);
});

test('invalid online room joins explain how to recover', async ({ page }) => {
  await page.goto('/play');
  await page.getByLabel('Room code').fill('AAAAA');
  await page.getByLabel('Your player name').fill('Jules');
  await page.getByRole('button', { name: 'Join online room' }).click();
  await expect(page.getByText('That room code was not found. Check it and try again.')).toBeVisible();
});

test('malformed join errors stay with the join form that describes them', async ({ page }) => {
  await page.goto('/play');
  await page.getByLabel('Room code').fill('ABC');
  await page.getByLabel('Your player name').fill('Noor');
  await page.getByRole('button', { name: 'Join online room' }).click();

  await expect(page.locator('#join-error')).toHaveText('Enter the five-character room code and your chosen player name.');
  await expect(page.locator('#setup-error')).toBeEmpty();
  await expect(page.getByLabel('Room code')).toHaveAttribute('aria-describedby', /join-error/);
  await expect(page.getByRole('button', { name: 'Join online room' })).toBeEnabled();
});

test('demo skip link remains inside the header landmark', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.locator('header .skip-link')).toHaveCount(1);
  await page.addScriptTag({ content: axe.source });
  const results = await page.evaluate(async () => {
    const runner = (window as unknown as { axe: typeof axe }).axe;
    return runner.run(document);
  });
  expect(results.violations.filter((violation) => violation.id === 'region')).toEqual([]);
});

test('@mobile all reported compact links meet the 44px touch target minimum', async ({ page }) => {
  const targets = [
    ['/', 'Pause Garden'],
    ['/', 'Read the purchase terms'],
    ['/privacy', 'Pause Garden'],
    ['/privacy', 'privacy@sociobot.in'],
    ['/terms', 'Pause Garden'],
    ['/terms', 'support@sociobot.in'],
  ] as const;

  for (const [path, name] of targets) {
    await page.goto(path);
    const box = await page.getByRole('link', { name, exact: true }).boundingBox();
    expect(box, `${path} ${name}`).not.toBeNull();
    expect(box!.height, `${path} ${name} height`).toBeGreaterThanOrEqual(44);
    expect(box!.width, `${path} ${name} width`).toBeGreaterThanOrEqual(44);
  }
});
