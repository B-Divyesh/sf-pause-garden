import { describe, expect, it } from 'vitest';
import { applyAction, createGame, hashSeed, weatherFor } from './game';

describe('deterministic garden core', () => {
  it('@claim:seed-determinism creates the same beds and weather for a seed', () => {
    const first = createGame(['A', 'B'], 'FERN-4', 100);
    const second = createGame(['A', 'B'], 'FERN-4', 100);
    expect(first).toEqual(second);
    expect(weatherFor(first)).toBe(weatherFor(second));
    expect(hashSeed('FERN-4')).toBe(hashSeed('FERN-4'));
  });

  it('plays a scripted run to a clear end state', () => {
    let game = createGame(['A', 'B'], 'WIN-8', 100);
    game.target = 3;
    game.visitorTarget = 1;
    game = applyAction(game, 'plant', 0);
    game = applyAction(game, 'water', 0);
    if (game.beds[0].stage !== 'bloom') game = applyAction(game, 'tend', 0);
    if (!game.beds[0].cared) game = applyAction(game, 'tend', 0);
    expect(game.status).toBe('won');
    expect(game.score).toBeGreaterThanOrEqual(3);
  });

  it('cannot spend a tool on an invalid bed', () => {
    const game = createGame(['A', 'B'], 'STILL', 100);
    expect(applyAction(game, 'water', 0)).toBe(game);
  });
});
