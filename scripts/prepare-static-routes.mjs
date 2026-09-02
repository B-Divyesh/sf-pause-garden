import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const dist = new URL('../dist/', import.meta.url);
const html = await readFile(new URL('index.html', dist), 'utf8');
const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"?]+)"/g)].map((match) => match[1]);
const hashes = {};
for (const asset of assets) {
  const body = await readFile(join(dist.pathname, asset));
  hashes[asset] = createHash('sha256').update(body).digest('hex');
}
await writeFile(new URL('build-manifest.json', dist), `${JSON.stringify({ assets: hashes }, null, 2)}\n`);
