import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const deploymentScript = new URL('./deploy-production.sh', import.meta.url);

function position(source, text) {
  const found = source.indexOf(text);
  expect(found, `expected deploy-production.sh to include ${text}`).toBeGreaterThanOrEqual(0);
  return found;
}

describe('production deployment gate', () => {
  it('updates the room service, proves its candidate identity, then publishes static files', async () => {
    const source = await readFile(deploymentScript, 'utf8');
    const updateRealtime = position(source, 'az containerapp update --name sf-pause-garden-realtime');
    const verifyRealtime = position(source, 'node scripts/verify-realtime-candidate.mjs "$CANDIDATE"');
    const publishStatic = position(source, '/opt/fleet/lib/deploy-static.sh pause-garden "$REPO/dist"');
    const verifyParity = position(source, 'node scripts/verify-release-identity.mjs "$CANDIDATE" "$REPO/dist"');

    expect(updateRealtime).toBeLessThan(verifyRealtime);
    expect(verifyRealtime).toBeLessThan(publishStatic);
    expect(publishStatic).toBeLessThan(verifyParity);
    expect(source).toContain('--build-arg "BUILD_SHA=$CANDIDATE"');
    expect(source).toContain('UPDATED_STORAGE');
    expect(source).toContain('the existing /data mount or storage identity was not preserved');
  });
});
