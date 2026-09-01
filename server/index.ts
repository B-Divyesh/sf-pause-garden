import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { WebSocketServer, WebSocket } from 'ws';
import { applyAction, createGame, currentPlayer, setQueuedTool, toggleAway, validAction, type GameState, type Tool } from '../src/game.js';
import { RoomStore, type StoredRoom } from './store.js';

const PORT = Number(process.env.PORT || 8787);
const dataDir = process.env.DATA_DIR || (existsSync('/data') ? '/data' : resolve('data'));
const dbPath = process.env.DATABASE_PATH || join(dataDir, 'pause-garden-v2.sqlite');
const buildSha = process.env.BUILD_SHA || 'dev';
const allowedOrigins = new Set(['https://pause-garden.sociobot.in', 'http://127.0.0.1:4173', 'http://localhost:4173']);
const codeAlphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const tools = new Set<Tool>(['plant', 'water', 'tend']);
const buckets = new Map<string, { tokens: number; updated: number }>();

function clientIp(request: IncomingMessage): string {
  return String(request.headers['x-forwarded-for'] || request.socket.remoteAddress || 'unknown').split(',')[0].trim();
}

function takeRateToken(request: IncomingMessage): boolean {
  const key = clientIp(request);
  const now = Date.now();
  const bucket = buckets.get(key) || { tokens: 40, updated: now };
  bucket.tokens = Math.min(40, bucket.tokens + ((now - bucket.updated) / 1000) * 20);
  bucket.updated = now;
  if (bucket.tokens < 1) { buckets.set(key, bucket); return false; }
  bucket.tokens -= 1;
  buckets.set(key, bucket);
  return true;
}

function setHeaders(response: ServerResponse): void {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
}

function sendHttp(response: ServerResponse, status: number, body: object): void {
  response.statusCode = status;
  setHeaders(response);
  if (status === 429) response.setHeader('Retry-After', '2');
  response.end(JSON.stringify(body));
}

function cleanName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const name = value.trim().replace(/\s+/g, ' ');
  return name.length >= 1 && name.length <= 18 ? name : null;
}

function roomCode(): string {
  const bytes = randomBytes(5);
  return Array.from(bytes, (byte) => codeAlphabet[byte % codeAlphabet.length]).join('');
}

function token(): string {
  return randomBytes(24).toString('base64url');
}

type Client = WebSocket & { roomCode?: string; playerId?: number; request?: IncomingMessage };

export function createRoomServer(databasePath = dbPath) {
  const store = new RoomStore(databasePath);
  store.deleteOlderThan(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const clients = new Set<Client>();
  const http = createServer((request, response) => {
    if (request.url === '/') return sendHttp(response, 200, { service: 'pause-garden-realtime', ok: true });
    if (request.url === '/health') return sendHttp(response, 200, { ok: true, build: buildSha, storage: 'sqlite' });
    if (!takeRateToken(request)) return sendHttp(response, 429, { error: 'rate_limited' });
    if (request.url === '/api/status') return sendHttp(response, 200, { ok: true });
    return sendHttp(response, 404, { error: 'not_found' });
  });
  const sockets = new WebSocketServer({ noServer: true, maxPayload: 4096 });

  function send(socket: Client, body: object): void {
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(body));
  }

  function roomMessage(room: StoredRoom, sessionToken?: string, playerId?: number) {
    return { type: 'room', state: room.state, revision: room.revision, sessionToken, playerId };
  }

  function broadcast(code: string, room: StoredRoom): void {
    for (const client of clients) if (client.roomCode === code) send(client, roomMessage(room));
  }

  function fail(socket: Client, code: string, message: string): void {
    send(socket, { type: 'error', code, message });
  }

  function attach(socket: Client, code: string, playerId: number): void {
    socket.roomCode = code;
    socket.playerId = playerId;
  }

  sockets.on('connection', (socket: Client, request) => {
    socket.request = request;
    clients.add(socket);
    socket.on('close', () => clients.delete(socket));
    socket.on('message', (raw) => {
      if (!socket.request || !takeRateToken(socket.request)) return fail(socket, 'rate_limited', 'Too many actions. Wait two seconds and try again.');
      let message: Record<string, unknown>;
      try { message = JSON.parse(raw.toString()) as Record<string, unknown>; }
      catch { return fail(socket, 'invalid_message', 'The room message was not valid JSON.'); }

      if (message.type === 'create') {
        const names = Array.isArray(message.names) ? message.names.map(cleanName) : [];
        if (names.length < 2 || names.length > 4 || names.some((name) => !name)) return fail(socket, 'invalid_players', 'Add two to four player names.');
        if (new Set(names.map((name) => name!.toLocaleLowerCase())).size !== names.length) return fail(socket, 'duplicate_players', 'Each player needs a different name.');
        const seed = typeof message.seed === 'string' && /^[A-Z0-9-]{2,16}$/.test(message.seed) ? message.seed : 'MOSS-27';
        let code = roomCode();
        while (store.get(code)) code = roomCode();
        const state = createGame(names as string[], seed);
        state.code = code;
        const room = store.create(state);
        const sessionToken = token();
        store.addSession(sessionToken, code, 0);
        attach(socket, code, 0);
        return send(socket, roomMessage(room, sessionToken, 0));
      }

      if (message.type === 'join') {
        const code = typeof message.code === 'string' ? message.code.trim().toUpperCase() : '';
        const name = cleanName(message.name);
        const room = /^[A-Z0-9]{5}$/.test(code) ? store.get(code) : null;
        if (!room) return fail(socket, 'room_not_found', 'That room code was not found. Check it and try again.');
        const player = name && room.state.players.find((item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase());
        if (!player) return fail(socket, 'player_not_found', 'Use one of the player names chosen by the host.');
        const sessionToken = token();
        store.addSession(sessionToken, code, player.id);
        attach(socket, code, player.id);
        return send(socket, roomMessage(room, sessionToken, player.id));
      }

      if (message.type === 'reconnect') {
        const session = typeof message.sessionToken === 'string' ? store.session(message.sessionToken) : null;
        const room = session ? store.get(session.code) : null;
        if (!session || !room) return fail(socket, 'session_expired', 'This saved room is no longer available. Join again with its code.');
        attach(socket, session.code, session.playerId);
        return send(socket, roomMessage(room, message.sessionToken as string, session.playerId));
      }

      if (!socket.roomCode || socket.playerId === undefined) return fail(socket, 'join_required', 'Join a room before playing.');
      const room = store.get(socket.roomCode);
      if (!room) return fail(socket, 'room_not_found', 'This room is no longer available.');
      if (message.revision !== room.revision) return send(socket, roomMessage(room));
      let next: GameState = room.state;

      if (message.type === 'play') {
        const tool = message.tool as Tool;
        const bedIndex = Number(message.bedIndex);
        const player = currentPlayer(room.state);
        if (player.id !== socket.playerId && !player.away) return fail(socket, 'not_your_turn', `It is ${player.name}’s turn.`);
        if (!tools.has(tool) || !Number.isInteger(bedIndex) || !validAction(room.state, tool, bedIndex)) return fail(socket, 'invalid_action', 'Choose an available bed for that action.');
        next = applyAction(room.state, tool, bedIndex);
      } else if (message.type === 'away') {
        const playerId = Number(message.playerId);
        if (!Number.isInteger(playerId) || !room.state.players.some((player) => player.id === playerId)) return fail(socket, 'invalid_player', 'That player is not in this room.');
        next = toggleAway(room.state, playerId);
      } else if (message.type === 'tool') {
        const tool = message.tool as Tool;
        if (!tools.has(tool)) return fail(socket, 'invalid_tool', 'Choose Plant, Water, or Tend.');
        next = setQueuedTool(room.state, socket.playerId, tool);
      } else if (message.type === 'restart') {
        if (socket.playerId !== 0 || room.state.status === 'playing') return fail(socket, 'restart_denied', 'The host can restart after the chapter ends.');
        next = createGame(room.state.players.map((player) => player.name), room.state.seed);
        next.code = room.state.code;
      } else {
        return fail(socket, 'invalid_message', 'That room action is not supported.');
      }

      const saved = store.update(socket.roomCode, next, room.revision);
      if (!saved) return fail(socket, 'retry', 'The room changed. Try that action again.');
      broadcast(socket.roomCode, saved);
    });
  });

  http.on('upgrade', (request, socket, head) => {
    const origin = request.headers.origin || '';
    const allowed = takeRateToken(request);
    if (request.url !== '/rooms' || !allowedOrigins.has(origin) || !allowed) {
      const status = !allowed ? '429 Too Many Requests' : '403 Forbidden';
      socket.write(`HTTP/1.1 ${status}\r\nConnection: close\r\nRetry-After: 2\r\n\r\n`);
      return socket.destroy();
    }
    sockets.handleUpgrade(request, socket, head, (webSocket) => sockets.emit('connection', webSocket, request));
  });

  return {
    http,
    store,
    listen(port = PORT): Promise<number> {
      return new Promise((resolveListen) => http.listen(port, '0.0.0.0', () => resolveListen((http.address() as { port: number }).port)));
    },
    close(): Promise<void> {
      for (const client of clients) client.terminate();
      return new Promise((resolveClose) => http.close(() => { store.close(); resolveClose(); }));
    },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const service = createRoomServer();
  service.listen().then((port) => console.log(JSON.stringify({ level: 'info', message: 'room service started', port, build: buildSha, database: dbPath })));
  const stop = () => void service.close().then(() => process.exit(0));
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}
