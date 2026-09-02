import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const buildPattern = /^[0-9a-f]{40}$/;
const cleanOrigin = (value) => value.replace(/\/$/, '');

export async function verifyRealtimeCandidate({ expectedCommit, realtimeOrigin }) {
  if (!buildPattern.test(expectedCommit)) throw new Error('expectedCommit must be a full Git commit SHA');
  const origin = cleanOrigin(realtimeOrigin);
  let health = null;
  const errors = [];
  try {
    const response = await fetch(`${origin}/health`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!response.ok) throw new Error(`${origin}/health returned HTTP ${response.status}`);
    health = await response.json();
  } catch (error) {
    errors.push(String(error));
  }
  if (health?.build !== expectedCommit) errors.push(`room service build ${health?.build || 'missing'} does not match ${expectedCommit}`);
  if (health && (health.ok !== true || health.storage !== 'sqlite')) errors.push('room service health does not confirm SQLite readiness');
  return { ok: errors.length === 0, expectedCommit, realtimeOrigin: origin, health, errors };
}

async function main() {
  const repo = fileURLToPath(new URL('..', import.meta.url));
  const expectedCommit = process.argv[2] || execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim();
  const realtimeOrigin = process.env.PAUSE_GARDEN_REALTIME_ORIGIN || 'https://pause-garden-realtime.sociobot.in';
  const attempts = Number(process.env.RELEASE_VERIFY_ATTEMPTS || 24);
  let result;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    result = await verifyRealtimeCandidate({ expectedCommit, realtimeOrigin });
    if (result.ok) break;
    if (attempt < attempts) await new Promise((resolveWait) => setTimeout(resolveWait, 5_000));
  }
  const evidenceDirectory = resolve(repo, 'release-evidence');
  await mkdir(evidenceDirectory, { recursive: true });
  await writeFile(resolve(evidenceDirectory, 'live-realtime.json'), `${JSON.stringify({ checkedAt: new Date().toISOString(), ...result }, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  if (!result?.ok) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
