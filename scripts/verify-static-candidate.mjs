import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url);
const text = async (path) => readFile(new URL(path, root), 'utf8');
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const fail = (message) => {
  console.error(`Static candidate contract failed: ${message}`);
  process.exitCode = 1;
};

const roomOrigin = 'https://pause-garden-realtime.sociobot.in';
const expectedAssets = {
  'main-CNwY5fXg.js': '35cbd0ba4e244c9efa6066fd04eb842cc99b111278227ab127f2fba1ad3201c6',
  'main-DKua9P12.css': '8f0c21e45e8abb614bd9ee8d9f1ba8e545610113b81c186c08559530c283f10c',
};
const config = JSON.parse(await text('public/staticwebapp.config.json'));
const expectedFallback = {
  rewrite: '/index.html',
  exclude: ['/assets/*', '/art/*', '/*.svg', '/*.png', '/*.xml', '/*.txt', '/*.js'],
};

if (JSON.stringify(config.navigationFallback) !== JSON.stringify(expectedFallback)) {
  fail('unknown routes must use the exact candidate SPA navigation fallback');
}
if (config.routes?.some((route) => ['/demo', '/play', '/privacy', '/terms'].includes(route.route))) {
  fail('candidate routes must be served by navigationFallback, not per-route rewrites');
}

const index = await text('dist/index.html');
for (const [name, expectedHash] of Object.entries(expectedAssets)) {
  if (!index.includes(`/assets/${name}`)) fail(`index.html does not reference ${name}`);
  const actualHash = sha256(await readFile(join(new URL('.', root).pathname, 'dist', 'assets', name)));
  if (actualHash !== expectedHash) fail(`${name} hash was ${actualHash}, expected ${expectedHash}`);
}
const main = await text('dist/assets/main-CNwY5fXg.js');
if (!main.includes(roomOrigin)) fail(`built client does not contain production room origin ${roomOrigin}`);
const sourceConfig = await text('public/staticwebapp.config.json');
const deployedConfig = await text('dist/staticwebapp.config.json');
if (deployedConfig !== sourceConfig) fail('dist staticwebapp.config.json differs from the candidate configuration');

if (!process.exitCode) console.log('Static candidate contract passed: production assets, room origin, and route fallback are byte-identical.');
