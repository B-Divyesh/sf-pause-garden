import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { GameState } from '../src/game.js';

export interface StoredRoom {
  state: GameState;
  revision: number;
}

export class RoomStore {
  private readonly db: DatabaseSync;

  constructor(path: string) {
    mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(`
      PRAGMA journal_mode = DELETE;
      PRAGMA synchronous = FULL;
      PRAGMA busy_timeout = 5000;
      CREATE TABLE IF NOT EXISTS rooms (
        code TEXT PRIMARY KEY,
        state TEXT NOT NULL,
        revision INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        room_code TEXT NOT NULL,
        player_id INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY(room_code) REFERENCES rooms(code) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS sessions_room_code ON sessions(room_code);
    `);
  }

  create(state: GameState): StoredRoom {
    this.db.prepare('INSERT INTO rooms(code, state, revision, updated_at) VALUES (?, ?, 1, ?)')
      .run(state.code, JSON.stringify(state), Date.now());
    return { state, revision: 1 };
  }

  get(code: string): StoredRoom | null {
    const row = this.db.prepare('SELECT state, revision FROM rooms WHERE code = ?').get(code) as { state: string; revision: number } | undefined;
    return row ? { state: JSON.parse(row.state) as GameState, revision: row.revision } : null;
  }

  update(code: string, state: GameState, expectedRevision: number): StoredRoom | null {
    const nextRevision = expectedRevision + 1;
    const result = this.db.prepare('UPDATE rooms SET state = ?, revision = ?, updated_at = ? WHERE code = ? AND revision = ?')
      .run(JSON.stringify(state), nextRevision, Date.now(), code, expectedRevision);
    return result.changes === 1 ? { state, revision: nextRevision } : null;
  }

  addSession(token: string, code: string, playerId: number): void {
    this.db.prepare('INSERT INTO sessions(token, room_code, player_id, created_at) VALUES (?, ?, ?, ?)')
      .run(token, code, playerId, Date.now());
  }

  session(token: string): { code: string; playerId: number } | null {
    const row = this.db.prepare('SELECT room_code, player_id FROM sessions WHERE token = ?').get(token) as { room_code: string; player_id: number } | undefined;
    return row ? { code: row.room_code, playerId: row.player_id } : null;
  }

  deleteOlderThan(timestamp: number): void {
    this.db.prepare('DELETE FROM rooms WHERE updated_at < ?').run(timestamp);
  }

  close(): void {
    this.db.close();
  }
}
