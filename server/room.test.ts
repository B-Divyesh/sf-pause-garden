import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import { createRoomServer } from './index.js';

const tempDirs: string[] = [];
afterEach(() => {
  for (const path of tempDirs.splice(0)) rmSync(path, { recursive: true, force: true });
});

function nextMessage(socket: WebSocket): Promise<Record<string, any>> {
  return new Promise((resolve) => socket.once('message', (raw) => resolve(JSON.parse(raw.toString()))));
}

async function openSocket(port: number): Promise<WebSocket> {
  const socket = new WebSocket(`ws://127.0.0.1:${port}/rooms`, { origin: 'http://127.0.0.1:4173' });
  await new Promise<void>((resolve, reject) => { socket.once('open', resolve); socket.once('error', reject); });
  return socket;
}

describe('product-owned room service', () => {
  it('persists a synchronized two-browser room and reconnect token in SQLite', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'pause-garden-room-'));
    tempDirs.push(directory);
    const database = join(directory, 'rooms.sqlite');
    const service = createRoomServer(database);
    const port = await service.listen(0);
    const host = await openSocket(port);
    host.send(JSON.stringify({ type: 'create', names: ['Mara', 'Jules'], seed: 'SYNC-1' }));
    const created = await nextMessage(host);
    expect(created.state.players.map((player: { name: string }) => player.name)).toEqual(['Mara', 'Jules']);
    expect(created.state.code).toMatch(/^[A-Z0-9]{5}$/);
    expect(created.sessionToken).toMatch(/^[A-Za-z0-9_-]{32}$/);

    const friend = await openSocket(port);
    friend.send(JSON.stringify({ type: 'join', code: created.state.code, name: 'Jules' }));
    const joined = await nextMessage(friend);
    expect(joined.state).toEqual(created.state);
    expect(joined.playerId).toBe(1);

    const hostUpdate = nextMessage(host);
    const friendUpdate = nextMessage(friend);
    host.send(JSON.stringify({ type: 'play', tool: 'plant', bedIndex: 0, revision: created.revision }));
    expect((await hostUpdate).state.turn).toBe(1);
    const synchronized = await friendUpdate;
    expect(synchronized.state.turn).toBe(1);
    expect(synchronized.state.beds[0].stage).not.toBe('empty');

    const reconnect = await openSocket(port);
    reconnect.send(JSON.stringify({ type: 'reconnect', sessionToken: created.sessionToken }));
    expect((await nextMessage(reconnect)).state.turn).toBe(1);
    host.terminate(); friend.terminate(); reconnect.terminate();
    await service.close();

    const restored = createRoomServer(database);
    expect(restored.store.get(created.state.code)?.state.turn).toBe(1);
    await restored.close();
  });

  it('returns 429 with Retry-After when a client exceeds the response policy', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'pause-garden-rate-'));
    tempDirs.push(directory);
    const service = createRoomServer(join(directory, 'rooms.sqlite'));
    const port = await service.listen(0);
    const responses = await Promise.all(Array.from({ length: 50 }, () => fetch(`http://127.0.0.1:${port}/api/status`)));
    const limited = responses.find((response) => response.status === 429);
    expect(limited?.headers.get('retry-after')).toBe('2');
    await service.close();
  });
});
