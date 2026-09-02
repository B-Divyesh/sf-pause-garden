import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { verifyReleaseIdentity } from './verify-release-identity.mjs';
import { verifyRealtimeCandidate } from './verify-realtime-candidate.mjs';

const candidateCommit = '1ab9ba039c16975014a5ac499447cf3e6f3edcc1';
const staleRoomCommit = 'f1c883faac0d9b3a93df79b7e51cee6bd84ed30f';
// Verification 8 found this precise mixed release. Keep the observed IDs so a
// future release-script edit cannot quietly reduce this to an abstract case.
const verificationEightStaticCommit = 'c24c20d9124569b8499814f45c95a6a5a306dc10';
const verificationEightRealtimeCommit = '01e3bffd7b44b5d6e808c62dc2b29449db319cb6';
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const temporaryDirectories = [];
const servers = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise((resolve) => server.close(resolve))));
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

async function candidate() {
  const directory = await mkdtemp(join(tmpdir(), 'pause-garden-release-'));
  temporaryDirectories.push(directory);
  await mkdir(join(directory, 'assets'));
  const script = 'candidate-main-BkvH-8yi';
  const style = 'candidate-main-Ce1lVhFR';
  const serviceWorker = `const BUILD = '${candidateCommit}';`;
  const index = `<html><head><link href="/assets/main-Ce1lVhFR.css"><meta name="pause-garden-build" content="${candidateCommit}"></head><body><script src="/assets/main-BkvH-8yi.js"></script></body></html>`;
  const manifest = {
    sourceCommit: candidateCommit,
    indexSha256: sha256(index),
    serviceWorkerSha256: sha256(serviceWorker),
    assets: {
      '/assets/main-BkvH-8yi.js': sha256(script),
      '/assets/main-Ce1lVhFR.css': sha256(style),
    },
  };
  await Promise.all([
    writeFile(join(directory, 'index.html'), index),
    writeFile(join(directory, 'sw.js'), serviceWorker),
    writeFile(join(directory, 'build-manifest.json'), JSON.stringify(manifest)),
    writeFile(join(directory, 'assets/main-BkvH-8yi.js'), script),
    writeFile(join(directory, 'assets/main-Ce1lVhFR.css'), style),
  ]);
  return { directory, index, serviceWorker, manifest, script, style };
}

async function serve(routes) {
  const server = createServer((request, response) => {
    const path = new URL(request.url, 'http://127.0.0.1').pathname;
    const route = routes[path];
    if (route === undefined) { response.writeHead(404).end('missing'); return; }
    response.setHeader('Content-Type', path.endsWith('.json') || path === '/health' ? 'application/json' : 'text/plain');
    response.end(typeof route === 'string' ? route : JSON.stringify(route));
  });
  servers.push(server);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${server.address().port}`;
}

describe('same-commit release identity', () => {
  it('rejects Verification 8: static c24c20d with realtime 01e3bff', async () => {
    const fixture = await candidate();
    fixture.manifest.sourceCommit = verificationEightStaticCommit;
    fixture.manifest.indexSha256 = sha256(fixture.index);
    fixture.manifest.serviceWorkerSha256 = sha256(fixture.serviceWorker);
    fixture.index = fixture.index.replace(candidateCommit, verificationEightStaticCommit);
    fixture.serviceWorker = fixture.serviceWorker.replace(candidateCommit, verificationEightStaticCommit);
    fixture.manifest.indexSha256 = sha256(fixture.index);
    fixture.manifest.serviceWorkerSha256 = sha256(fixture.serviceWorker);
    await Promise.all([
      writeFile(join(fixture.directory, 'index.html'), fixture.index),
      writeFile(join(fixture.directory, 'sw.js'), fixture.serviceWorker),
      writeFile(join(fixture.directory, 'build-manifest.json'), JSON.stringify(fixture.manifest)),
    ]);
    const staticOrigin = await serve({
      '/': fixture.index,
      '/build-manifest.json': fixture.manifest,
      '/sw.js': fixture.serviceWorker,
      '/assets/main-BkvH-8yi.js': fixture.script,
      '/assets/main-Ce1lVhFR.css': fixture.style,
    });
    const realtimeOrigin = await serve({
      '/health': { ok: true, build: verificationEightRealtimeCommit, storage: 'sqlite' },
    });

    const result = await verifyReleaseIdentity({
      expectedCommit: verificationEightStaticCommit,
      candidateDir: fixture.directory,
      staticOrigin,
      realtimeOrigin,
    });

    expect(result).toMatchObject({
      ok: false,
      expectedCommit: verificationEightStaticCommit,
      health: { ok: true, build: verificationEightRealtimeCommit, storage: 'sqlite' },
      errors: [`room service build ${verificationEightRealtimeCommit} does not match ${verificationEightStaticCommit}`],
    });
  });

  it('rejects the exact mixed release where static matches and realtime is stale', async () => {
    const fixture = await candidate();
    const staticOrigin = await serve({
      '/': fixture.index,
      '/build-manifest.json': fixture.manifest,
      '/sw.js': fixture.serviceWorker,
      '/assets/main-BkvH-8yi.js': fixture.script,
      '/assets/main-Ce1lVhFR.css': fixture.style,
    });
    const realtimeOrigin = await serve({ '/health': { ok: true, build: staleRoomCommit, storage: 'sqlite' } });

    const result = await verifyReleaseIdentity({ expectedCommit: candidateCommit, candidateDir: fixture.directory, staticOrigin, realtimeOrigin });
    const realtimeGate = await verifyRealtimeCandidate({ expectedCommit: candidateCommit, realtimeOrigin });
    expect(result).toMatchObject({
      ok: false,
      expectedCommit: candidateCommit,
      health: { ok: true, build: staleRoomCommit, storage: 'sqlite' },
      errors: [`room service build ${staleRoomCommit} does not match ${candidateCommit}`],
    });
    expect(realtimeGate).toMatchObject({
      ok: false,
      health: { ok: true, build: staleRoomCommit, storage: 'sqlite' },
      errors: [`room service build ${staleRoomCommit} does not match ${candidateCommit}`],
    });
  });

  it('reproduces the verifier failure when static and realtime are stale', async () => {
    const fixture = await candidate();
    const staleIndex = '<html><head><link href="/assets/main-Ce1lVhFR.css"></head><body><script src="/assets/main-BBPkgcOE.js"></script></body></html>';
    const staticOrigin = await serve({
      '/': staleIndex,
      '/build-manifest.json': { assets: { '/assets/main-BBPkgcOE.js': 'stale' } },
      '/sw.js': 'const CACHE = "pause-garden-v3";',
      '/assets/main-BkvH-8yi.js': fixture.script,
      '/assets/main-Ce1lVhFR.css': fixture.style,
    });
    const realtimeOrigin = await serve({ '/health': { ok: true, build: staleRoomCommit, storage: 'sqlite' } });

    const result = await verifyReleaseIdentity({ expectedCommit: candidateCommit, candidateDir: fixture.directory, staticOrigin, realtimeOrigin });
    expect(result.ok).toBe(false);
    expect(result.errors).toContain(`room service build ${staleRoomCommit} does not match ${candidateCommit}`);
    expect(result.errors.some((error) => error.includes('live HTML references /assets/main-BBPkgcOE.js, /assets/main-Ce1lVhFR.css instead of /assets/main-BkvH-8yi.js, /assets/main-Ce1lVhFR.css'))).toBe(true);
    expect(result.errors.some((error) => error.includes('live HTML checksum'))).toBe(true);
  });

  it('accepts only matching static bytes, manifest, service worker, and room build', async () => {
    const fixture = await candidate();
    const staticOrigin = await serve({
      '/': fixture.index,
      '/build-manifest.json': fixture.manifest,
      '/sw.js': fixture.serviceWorker,
      '/assets/main-BkvH-8yi.js': fixture.script,
      '/assets/main-Ce1lVhFR.css': fixture.style,
    });
    const realtimeOrigin = await serve({ '/health': { ok: true, build: candidateCommit, storage: 'sqlite' } });

    const result = await verifyReleaseIdentity({ expectedCommit: candidateCommit, candidateDir: fixture.directory, staticOrigin, realtimeOrigin });
    const realtimeGate = await verifyRealtimeCandidate({ expectedCommit: candidateCommit, realtimeOrigin });
    expect(result).toMatchObject({ ok: true, expectedCommit: candidateCommit, errors: [] });
    expect(realtimeGate).toMatchObject({ ok: true, expectedCommit: candidateCommit, errors: [] });
  });
});
