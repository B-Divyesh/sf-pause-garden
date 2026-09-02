import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const cleanOrigin = (value) => value.replace(/\/$/, '');
const buildPattern = /^[0-9a-f]{40}$/;

function assetReferences(html) {
  return [...html.matchAll(/(?:src|href)="(\/assets\/[^"?]+)"/g)].map((match) => match[1]);
}

async function get(url, binary = false) {
  const response = await fetch(url, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return binary ? Buffer.from(await response.arrayBuffer()) : response.text();
}

export async function verifyReleaseIdentity({
  expectedCommit,
  candidateDir,
  staticOrigin,
  realtimeOrigin,
}) {
  if (!buildPattern.test(expectedCommit)) throw new Error('expectedCommit must be a full Git commit SHA');
  const errors = [];
  const staticBase = cleanOrigin(staticOrigin);
  const realtimeBase = cleanOrigin(realtimeOrigin);
  const cacheBust = `release-check=${expectedCommit}-${Date.now()}`;
  const candidateManifest = JSON.parse(await readFile(resolve(candidateDir, 'build-manifest.json'), 'utf8'));
  const candidateIndex = await readFile(resolve(candidateDir, 'index.html'));
  const candidateAssets = Object.entries(candidateManifest.assets || {});

  if (candidateManifest.sourceCommit !== expectedCommit) {
    errors.push(`candidate static build ${candidateManifest.sourceCommit || 'missing'} does not match ${expectedCommit}`);
  }
  if (sha256(candidateIndex) !== candidateManifest.indexSha256) errors.push('candidate HTML does not match its manifest checksum');

  let liveIndex;
  let liveManifest;
  let liveServiceWorker;
  let health;
  try { liveIndex = await get(`${staticBase}/?${cacheBust}`, true); }
  catch (error) { errors.push(String(error)); }
  try { liveManifest = JSON.parse(await get(`${staticBase}/build-manifest.json?${cacheBust}`)); }
  catch (error) { errors.push(String(error)); }
  try { liveServiceWorker = await get(`${staticBase}/sw.js?${cacheBust}`, true); }
  catch (error) { errors.push(String(error)); }
  try { health = JSON.parse(await get(`${realtimeBase}/health`)); }
  catch (error) { errors.push(String(error)); }

  if (liveIndex) {
    const actual = sha256(liveIndex);
    if (actual !== candidateManifest.indexSha256) errors.push(`live HTML checksum ${actual} does not match candidate ${candidateManifest.indexSha256}`);
    const expectedReferences = candidateAssets.map(([asset]) => asset).sort();
    const actualReferences = assetReferences(liveIndex.toString()).sort();
    if (JSON.stringify(actualReferences) !== JSON.stringify(expectedReferences)) {
      errors.push(`live HTML references ${actualReferences.join(', ') || 'no hashed assets'} instead of ${expectedReferences.join(', ') || 'no candidate assets'}`);
    }
  }

  if (liveManifest?.sourceCommit !== expectedCommit) {
    errors.push(`live static build ${liveManifest?.sourceCommit || 'missing'} does not match ${expectedCommit}`);
  }
  if (liveManifest && JSON.stringify(liveManifest.assets || {}) !== JSON.stringify(candidateManifest.assets || {})) {
    errors.push('live static asset manifest does not match the candidate manifest');
  }
  if (liveServiceWorker && sha256(liveServiceWorker) !== candidateManifest.serviceWorkerSha256) {
    errors.push(`live service worker checksum ${sha256(liveServiceWorker)} does not match candidate ${candidateManifest.serviceWorkerSha256}`);
  }

  const assetChecks = await Promise.all(candidateAssets.map(async ([asset, expectedHash]) => {
    try {
      const body = await get(`${staticBase}${asset}?${cacheBust}`, true);
      const actualHash = sha256(body);
      if (actualHash !== expectedHash) errors.push(`${asset} checksum ${actualHash} does not match candidate ${expectedHash}`);
      return { asset, sha256: actualHash, bytes: body.length };
    } catch (error) {
      errors.push(String(error));
      return { asset, error: String(error) };
    }
  }));

  if (health?.build !== expectedCommit) errors.push(`room service build ${health?.build || 'missing'} does not match ${expectedCommit}`);
  if (health && (health.ok !== true || health.storage !== 'sqlite')) errors.push('room service health does not confirm SQLite readiness');

  return {
    ok: errors.length === 0,
    expectedCommit,
    staticOrigin: staticBase,
    realtimeOrigin: realtimeBase,
    indexSha256: liveIndex ? sha256(liveIndex) : null,
    assets: assetChecks,
    serviceWorkerSha256: liveServiceWorker ? sha256(liveServiceWorker) : null,
    health: health || null,
    errors,
  };
}

async function main() {
  const repo = fileURLToPath(new URL('..', import.meta.url));
  const expectedCommit = process.argv[2] || execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim();
  const candidateDir = process.argv[3] || resolve(repo, 'dist');
  const staticOrigin = process.env.PAUSE_GARDEN_STATIC_ORIGIN || 'https://pause-garden.sociobot.in';
  const realtimeOrigin = process.env.PAUSE_GARDEN_REALTIME_ORIGIN || 'https://pause-garden-realtime.sociobot.in';
  const attempts = Number(process.env.RELEASE_VERIFY_ATTEMPTS || 24);
  let result;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    result = await verifyReleaseIdentity({ expectedCommit, candidateDir, staticOrigin, realtimeOrigin });
    if (result.ok) break;
    if (attempt < attempts) await new Promise((resolveWait) => setTimeout(resolveWait, 5_000));
  }
  const evidencePath = resolve(repo, 'release-evidence/live-release.json');
  await mkdir(resolve(repo, 'release-evidence'), { recursive: true });
  await writeFile(evidencePath, `${JSON.stringify({ checkedAt: new Date().toISOString(), ...result }, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  if (!result?.ok) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
