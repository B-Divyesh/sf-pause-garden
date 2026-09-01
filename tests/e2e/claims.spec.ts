import { expect, test } from '@playwright/test';

test('@claim:chapter-complete sample play reaches the end summary', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: /Bed 3: growing fern.*Use Tend plant/ }).click();
  await expect(page.getByRole('heading', { name: 'Garden restored' })).toBeVisible();
  await expect(page.getByText(/bloom points and met the visitor request/)).toBeVisible();
});

test('@claim:restart-reset replay starts a fresh chapter', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: /Bed 3: growing fern.*Use Tend plant/ }).click();
  await page.getByRole('button', { name: 'Play this seed again' }).click();
  await expect(page.getByText('1 of 12', { exact: true })).toBeVisible();
  await expect(page.getByText('0 / 15', { exact: true }).first()).toBeVisible();
});

test('@claim:sleeping-handoff a group can place the current sleeping player token', async ({ page }) => {
  await page.goto('/demo');
  await page.locator('.player.current').getByRole('button', { name: 'Mark sleeping' }).click();
  await page.getByRole('button', { name: /Bed 4: empty.*Use Plant seed/ }).click();
  await expect(page.getByText(/The group used Mara’s queued token planted a seed/)).toBeVisible();
});

test('@claim:local-recovery a real room returns after refresh', async ({ page }) => {
  await page.goto('/play');
  await page.getByRole('button', { name: 'Create room' }).click();
  await page.getByRole('button', { name: /Bed 1: empty.*Use Plant seed/ }).click();
  await page.reload();
  await expect(page.getByText('2 of 12', { exact: true })).toBeVisible();
  await expect(page.locator('.game-title-row .eyebrow')).toContainText(/Room [A-Z0-9]{4}/);
});

test('@claim:settings-persist sound choice survives refresh', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Sound on' }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Sound off' })).toBeVisible();
});

test('@claim:offline-reload demo reloads after the first visit', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/demo');
  await page.evaluate(async () => navigator.serviceWorker.ready);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Restore this garden together' })).toBeVisible();
  await expect(page.getByText(/Offline — turns still save here/)).toBeVisible();
  await context.close();
});

test('@claim:privacy-same-origin demo sends no cross-origin requests', async ({ page }) => {
  const crossOrigin: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.origin !== 'http://127.0.0.1:4173') crossOrigin.push(request.url());
  });
  await page.goto('/demo');
  await page.getByRole('button', { name: /Bed 3: growing fern.*Use Tend plant/ }).click();
  await expect(page.getByRole('heading', { name: 'Garden restored' })).toBeVisible();
  expect(crossOrigin).toEqual([]);
});

test('@claim:keyboard-controls arrow keys move between beds and Enter acts', async ({ page }) => {
  await page.goto('/demo');
  const firstBed = page.locator('[data-bed="0"]');
  await firstBed.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-bed="1"]')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-bed="2"]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Garden restored' })).toBeVisible();
});

test('@claim:two-to-four-players setup creates a four-player room', async ({ page }) => {
  await page.goto('/play');
  await page.getByRole('button', { name: 'Add player' }).click();
  await page.getByRole('button', { name: 'Add player' }).click();
  await page.getByRole('button', { name: 'Create room' }).click();
  await expect(page.locator('.player')).toHaveCount(4);
});

test('@claim:paid-host-edition a cached valid license enables custom seeds', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sb_license:pause-garden', 'test-license');
    localStorage.setItem('pause-garden:license-verdict', JSON.stringify({ valid: true, checked: Date.now() }));
  });
  await page.goto('/play');
  await expect(page.getByLabel('Garden seed')).toBeEditable();
  await expect(page.getByText('Host Edition is active')).toBeVisible();
});
