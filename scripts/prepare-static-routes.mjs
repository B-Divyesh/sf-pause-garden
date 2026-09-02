import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const outputDir = process.env.BUILD_OUT_DIR || 'dist';
if (!/^[a-zA-Z0-9_-]+$/.test(outputDir)) throw new Error('BUILD_OUT_DIR must be a simple directory name');
const dist = new URL(`../${outputDir}/`, import.meta.url);
const html = await readFile(new URL('index.html', dist), 'utf8');
const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"?]+)"/g)].map((match) => match[1]);
const hashes = {};
for (const asset of assets) {
  const body = await readFile(join(dist.pathname, asset));
  hashes[asset] = createHash('sha256').update(body).digest('hex');
}
await writeFile(new URL('build-manifest.json', dist), `${JSON.stringify({ assets: hashes }, null, 2)}\n`);
