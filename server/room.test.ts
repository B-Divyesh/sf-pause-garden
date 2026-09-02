import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import WebSocket from 'ws';
import { createRoomServer } from './index.js';
import { RoomStore } from './store.js';

const tempDirs: string[] = [];
afterEach(() => {
  vi.useRealTimers();
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
  it('@claim:room-storage-sqlite persists synchronized room state and a reconnect token in SQLite', async () => {
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

  it('@claim:room-expiry removes a room after 30 inactive days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const directory = mkdtempSync(join(tmpdir(), 'pause-garden-expiry-'));
    tempDirs.push(directory);
    const database = join(directory, 'rooms.sqlite');
    const first = new RoomStore(database);
    first.create({
      version: 1, code: 'OLD30', seed: 'MOSS-27', rng: 1, turn: 0, maxTurns: 12,
      score: 0, target: 14, caredCount: 0, visitorTarget: 3, status: 'playing',
      players: [{ id: 0, name: 'A', away: false, queuedTool: 'plant' }, { id: 1, name: 'B', away: false, queuedTool: 'plant' }],
      beds: Array.from({ length: 16 }, () => ({ stage: 'empty' as const, family: 'fern' as const, cared: false })),
      history: [], startedAt: Date.now(),
    });
    first.close();

    vi.setSystemTime(new Date('2026-02-01T00:00:01Z'));
    const second = new RoomStore(database);
    second.deleteOlderThan(Date.now() - 30 * 24 * 60 * 60 * 1000);
    expect(second.get('OLD30')).toBeNull();
    second.close();
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

  it('restores a durable SQLite snapshot while the open database stays local', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'pause-garden-mirror-'));
    tempDirs.push(directory);
    const durable = join(directory, 'data', 'rooms.sqlite');
    const stateDir = join(directory, 'runtime');
    const first = createRoomServer(durable, join(stateDir, 'first.sqlite'));
    const state = first.store.create({
      version: 1, code: 'ABCDE', seed: 'SAVE-1', rng: 1, turn: 0, maxTurns: 12,
      score: 0, target: 14, caredCount: 0, visitorTarget: 3, status: 'playing',
      players: [{ id: 0, name: 'A', away: false, queuedTool: 'plant' }, { id: 1, name: 'B', away: false, queuedTool: 'plant' }],
      beds: Array.from({ length: 16 }, () => ({ stage: 'empty' as const, family: 'fern' as const, cared: false })),
      history: [], startedAt: 1,
    });
    expect(state.revision).toBe(1);
    await first.close();
    const second = createRoomServer(durable, join(stateDir, 'second.sqlite'));
    expect(second.store.get('ABCDE')?.state.seed).toBe('SAVE-1');
    await second.close();
  });
});
