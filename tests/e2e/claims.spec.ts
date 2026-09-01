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

test('@claim:remote-room-play @claim:remote-reconnect two browsers join, play, reconnect, and reach the end', async ({ browser }) => {
  const hostContext = await browser.newContext();
  const friendContext = await browser.newContext();
  const host = await hostContext.newPage();
  const friend = await friendContext.newPage();

  await host.goto('/play');
  await host.getByRole('button', { name: 'Create online room' }).click();
  await expect(host.getByText('Room synced')).toBeVisible();
  const roomLabel = await host.locator('.game-title-row .eyebrow').textContent();
  const code = roomLabel?.match(/Room ([A-Z0-9]{5})/)?.[1];
  expect(code).toMatch(/^[A-Z0-9]{5}$/);

  await friend.goto('/play');
  await friend.getByLabel('Room code').fill(code!);
  await friend.getByLabel('Your player name').fill('Jules');
  await friend.getByRole('button', { name: 'Join online room' }).click();
  await expect(friend.getByText('Room synced')).toBeVisible();
  await expect(friend.getByText('1 of 12', { exact: true })).toBeVisible();

  for (let turn = 0; turn < 12; turn += 1) {
    const actor = turn % 2 === 0 ? host : friend;
    const observer = turn % 2 === 0 ? friend : host;
    await actor.locator('.garden-bed.valid').first().click();
    if (turn < 11) await expect(observer.getByText(`${turn + 2} of 12`, { exact: true })).toBeVisible();
    if (turn === 1) {
      await friend.reload();
      await expect(friend.getByText('Room synced')).toBeVisible();
      await expect(friend.getByText('3 of 12', { exact: true })).toBeVisible();
    }
  }

  await expect(host.getByRole('heading', { name: 'Chapter complete' })).toBeVisible();
  await expect(friend.getByRole('heading', { name: 'Chapter complete' })).toBeVisible();
  await expect(host.getByText(new RegExp(`Room ${code} · 12 turns · 2 players`))).toBeVisible();
  await hostContext.close();
  await friendContext.close();
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
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Restore this garden together' })).toBeVisible();
  await expect(page.getByText(/Offline — demo turns still save here/)).toBeVisible();
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
  await page.getByRole('button', { name: 'Create online room' }).click();
  await expect(page.locator('.player')).toHaveCount(4);
  await expect(page.getByText('1 of 12', { exact: true })).toBeVisible();
});

test('@claim:paid-host-edition a cached valid license enables custom seeds', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sb_license:pause-garden', 'test-license');
    localStorage.setItem('pause-garden:license-verdict', JSON.stringify({ valid: true, checked: Date.now() }));
    localStorage.setItem('pause-garden:chapters-complete', '4');
  });
  await page.goto('/');
  await expect(page.locator('.price')).toContainText('$6');
  await expect(page.getByRole('link', { name: 'Buy Host Edition' })).toHaveAttribute('href', 'https://api.sociobot.in/api/v1/products/pause-garden/checkout');
  await page.goto('/play');
  await expect(page.getByLabel('Garden seed')).toBeEditable();
  await expect(page.getByText('Host Edition is active')).toBeVisible();
});

test('@claim:free-chapter a visitor can create the free room without an account', async ({ page }) => {
  await page.goto('/play');
  await expect(page.getByRole('button', { name: 'Create online room' })).toBeVisible();
  await page.getByRole('button', { name: 'Create online room' }).click();
  await expect(page.getByText('1 of 12', { exact: true })).toBeVisible();
  await expect(page.locator('.garden-board')).toBeVisible();
});

test('@claim:calm-private-rules the game uses turns without account or chat controls', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText('7 of 12', { exact: true })).toBeVisible();
  await expect(page.locator('input[type="email"], input[type="password"], [data-chat]')).toHaveCount(0);
  await expect(page.getByText(/No timers, combat, or daily streaks/)).toHaveCount(0);
});
