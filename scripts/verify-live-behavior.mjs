import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const repo = fileURLToPath(new URL('..', import.meta.url));
const staticOrigin = (process.env.PAUSE_GARDEN_STATIC_ORIGIN || 'https://pause-garden.sociobot.in').replace(/\/$/, '');
const realtimeOrigin = (process.env.PAUSE_GARDEN_REALTIME_ORIGIN || 'https://pause-garden-realtime.sociobot.in').replace(/\/$/, '');
const evidenceDir = resolve(repo, 'release-evidence');
const wait = (milliseconds) => new Promise((resolveWait) => setTimeout(resolveWait, milliseconds));

async function verifyRemoteChapter() {
  const browser = await chromium.launch();
  const hostContext = await browser.newContext();
  const friendContext = await browser.newContext();
  const host = await hostContext.newPage();
  const friend = await friendContext.newPage();
  const browserErrors = [];
  for (const [name, page] of [['host', host], ['friend', friend]]) {
    page.on('pageerror', (error) => browserErrors.push(`${name} page: ${error}`));
    page.on('console', (message) => {
      if (message.type() === 'error') browserErrors.push(`${name} console: ${message.text()}`);
    });
  }

  try {
    await host.goto(`${staticOrigin}/play?release-smoke=${Date.now()}`, { waitUntil: 'domcontentloaded' });
    await host.getByRole('button', { name: 'Create online room' }).click();
    await host.getByText('Room synced').waitFor();
    const roomLabel = await host.locator('.game-title-row .eyebrow').textContent();
    const code = roomLabel?.match(/Room ([A-Z0-9]{5})/)?.[1];
    assert.match(code || '', /^[A-Z0-9]{5}$/, 'host did not receive a five-character room code');

    await friend.goto(`${staticOrigin}/play?release-smoke=${Date.now()}`, { waitUntil: 'domcontentloaded' });
    await friend.getByLabel('Room code').fill(code);
    await friend.getByLabel('Your player name').fill('Jules');
    await friend.getByRole('button', { name: 'Join online room' }).click();
    await friend.getByText('Room synced').waitFor();
    await friend.getByText('1 of 12', { exact: true }).waitFor();

    for (let turn = 0; turn < 12; turn += 1) {
      const actor = turn % 2 === 0 ? host : friend;
      const observer = turn % 2 === 0 ? friend : host;
      await actor.locator('.garden-bed.valid').first().click();
      if (turn < 11) await observer.getByText(`${turn + 2} of 12`, { exact: true }).waitFor();
      if (turn === 1) {
        await friend.reload({ waitUntil: 'domcontentloaded' });
        await friend.getByText('Room synced').waitFor();
        await friend.getByText('3 of 12', { exact: true }).waitFor();
      }
    }

    await host.getByRole('heading', { name: 'Chapter complete' }).waitFor();
    await friend.getByRole('heading', { name: 'Chapter complete' }).waitFor();
    await host.getByText(new RegExp(`Room ${code} · 12 turns · 2 players`)).waitFor();
    await friend.getByText(new RegExp(`Room ${code} · 12 turns · 2 players`)).waitFor();
    await host.screenshot({ path: resolve(evidenceDir, 'live-room-host.png'), fullPage: true });
    await friend.screenshot({ path: resolve(evidenceDir, 'live-room-friend.png'), fullPage: true });
    assert.deepEqual(browserErrors, [], `browser errors: ${browserErrors.join('; ')}`);
    return { code, turns: 12, players: 2, reconnectAfterTurn: 2, endHeading: 'Chapter complete' };
  } finally {
    await hostContext.close();
    await friendContext.close();
    await browser.close();
  }
}

async function verifyResponsePolicy() {
  await wait(2_200);
  const responses = await Promise.all(Array.from({ length: 96 }, () => fetch(
    `${realtimeOrigin}/api/status`,
    { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } },
  )));
  const counts = responses.reduce((result, response) => {
    result[response.status] = (result[response.status] || 0) + 1;
    return result;
  }, {});
  const limited = responses.filter((response) => response.status === 429);
  assert.ok(responses.some((response) => response.status === 200), `rate probe returned no allowed response: ${JSON.stringify(counts)}`);
  assert.ok(limited.length > 0, `rate probe returned no 429 response: ${JSON.stringify(counts)}`);
  assert.ok(limited.every((response) => response.headers.get('retry-after') === '2'), 'every 429 response must include Retry-After: 2');
  return { requests: responses.length, statuses: counts, retryAfter: '2' };
}

async function main() {
  await mkdir(evidenceDir, { recursive: true });
  const startedAt = new Date().toISOString();
  let evidence;
  try {
    const remoteChapter = await verifyRemoteChapter();
    const responsePolicy = await verifyResponsePolicy();
    evidence = { ok: true, startedAt, checkedAt: new Date().toISOString(), staticOrigin, realtimeOrigin, remoteChapter, responsePolicy };
  } catch (error) {
    evidence = { ok: false, startedAt, checkedAt: new Date().toISOString(), staticOrigin, realtimeOrigin, error: String(error) };
    process.exitCode = 1;
  }
  await writeFile(resolve(evidenceDir, 'live-behavior.json'), `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
}

await main();
