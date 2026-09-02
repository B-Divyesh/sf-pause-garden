import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const root = new URL('..', import.meta.url);
const text = async (path) => readFile(new URL(path, root), 'utf8');
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const fail = (message) => {
  console.error(`Static candidate contract failed: ${message}`);
  process.exitCode = 1;
};

const roomOrigin = 'https://pause-garden-realtime.sociobot.in';
const expectedCommit = process.env.BUILD_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const validRoutes = ['/demo', '/play', '/privacy', '/terms'];
const config = JSON.parse(await text('dist/staticwebapp.config.json'));
const sourceConfig = JSON.parse(await text('public/staticwebapp.config.json'));
if (JSON.stringify(config) !== JSON.stringify(sourceConfig)) fail('deployed configuration differs from its source');
if (config.navigationFallback) fail('navigationFallback would turn unknown paths into HTTP 200 responses');
for (const route of validRoutes) {
  const rule = config.routes?.find((item) => item.route === route);
  if (rule?.rewrite !== '/index.html' || 'statusCode' in rule) fail(`${route} needs a status-preserving index rewrite`);
}
if (config.responseOverrides?.['404']?.rewrite !== '/404.html') fail('unknown paths need the designed 404 document');

const index = await text('dist/index.html');
const notFound = await text('dist/404.html');
if (!notFound.includes('Page not found — Pause Garden') || !notFound.includes('name="robots" content="noindex"')) {
  fail('404.html is not the titled, noindex error document');
}
const manifest = JSON.parse(await text('dist/build-manifest.json'));
if (manifest.sourceCommit !== expectedCommit) fail(`build identity ${manifest.sourceCommit || 'missing'} does not match ${expectedCommit}`);
if (!index.includes(`<meta name="pause-garden-build" content="${expectedCommit}"`)) fail('index.html does not expose the source commit');
if (sha256(index) !== manifest.indexSha256) fail('index.html does not match its manifest checksum');
const serviceWorker = await text('dist/sw.js');
if (!serviceWorker.includes(expectedCommit) || serviceWorker.includes('__PAUSE_GARDEN_BUILD__')) fail('service worker cache is not scoped to the source commit');
if (sha256(serviceWorker) !== manifest.serviceWorkerSha256) fail('service worker does not match its manifest checksum');
const assetEntries = Object.entries(manifest.assets || {});
if (!assetEntries.length) fail('build manifest has no hashed assets');
for (const [asset, expected] of assetEntries) {
  if (!index.includes(asset)) fail(`index.html does not reference ${asset}`);
  const body = await readFile(new URL(`dist${asset}`, root));
  if (sha256(body) !== expected) fail(`${asset} does not match its built-file checksum`);
  if (asset.endsWith('.js') && !body.includes(roomOrigin)) fail(`${asset} does not contain the production room origin`);
  if (asset.endsWith('.js') && body.includes('http://127.0.0.1:8787')) fail(`${asset} contains the local room origin`);
}

if (!process.exitCode) console.log('Static candidate contract passed: assets, production room origin, app routes, and true 404 policy are valid.');
