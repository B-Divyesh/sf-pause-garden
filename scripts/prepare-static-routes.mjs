import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const outputDir = process.env.BUILD_OUT_DIR || 'dist';
if (!/^[a-zA-Z0-9_-]+$/.test(outputDir)) throw new Error('BUILD_OUT_DIR must be a simple directory name');
const dist = new URL(`../${outputDir}/`, import.meta.url);
const sourceCommit = process.env.BUILD_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { cwd: new URL('..', import.meta.url), encoding: 'utf8' }).trim();
if (!/^[0-9a-f]{40}$/.test(sourceCommit)) throw new Error('BUILD_SHA must be a full Git commit SHA');

const indexUrl = new URL('index.html', dist);
const serviceWorkerUrl = new URL('sw.js', dist);
let html = await readFile(indexUrl, 'utf8');
if (html.includes('name="pause-garden-build"')) throw new Error('index.html already contains a build identity');
html = html.replace('</head>', `  <meta name="pause-garden-build" content="${sourceCommit}" />\n</head>`);
await writeFile(indexUrl, html);

let serviceWorker = await readFile(serviceWorkerUrl, 'utf8');
if (!serviceWorker.includes('__PAUSE_GARDEN_BUILD__')) throw new Error('service worker build placeholder is missing');
serviceWorker = serviceWorker.replaceAll('__PAUSE_GARDEN_BUILD__', sourceCommit);
await writeFile(serviceWorkerUrl, serviceWorker);

const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"?]+)"/g)].map((match) => match[1]);
const hashes = {};
for (const asset of assets) {
  const body = await readFile(join(dist.pathname, asset));
  hashes[asset] = createHash('sha256').update(body).digest('hex');
}
await writeFile(new URL('build-manifest.json', dist), `${JSON.stringify({
  sourceCommit,
  indexSha256: createHash('sha256').update(html).digest('hex'),
  serviceWorkerSha256: createHash('sha256').update(serviceWorker).digest('hex'),
  assets: hashes,
}, null, 2)}\n`);
