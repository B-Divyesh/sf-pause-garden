import { readFile } from 'node:fs/promises';

const productionRoomOrigin = 'https://pause-garden-realtime.sociobot.in';
const localRoomOrigin = 'http://127.0.0.1:8787';

async function bundleFor(directory) {
  const manifest = JSON.parse(await readFile(`${directory}/build-manifest.json`, 'utf8'));
  const script = Object.keys(manifest.assets || {}).find((asset) => asset.endsWith('.js'));
  if (!script) throw new Error(`${directory} has no JavaScript asset in its build manifest`);
  return readFile(`${directory}${script}`, 'utf8');
}

const [production, test] = await Promise.all([bundleFor('dist'), bundleFor('test-dist')]);
if (!production.includes(productionRoomOrigin) || production.includes(localRoomOrigin)) {
  throw new Error('dist was changed after the production build or does not use the production room service');
}
if (!test.includes(localRoomOrigin) || test.includes(productionRoomOrigin)) {
  throw new Error('test-dist is not the isolated local room build used by browser tests');
}

console.log('Build isolation regression passed: browser tests use test-dist and leave the production dist artifact intact.');
