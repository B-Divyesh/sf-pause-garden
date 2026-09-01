export type Weather = 'Rain' | 'Warm light' | 'Wind';
export type Tool = 'plant' | 'water' | 'tend';
export type Stage = 'empty' | 'seeded' | 'growing' | 'bloom';

export interface Player {
  id: number;
  name: string;
  away: boolean;
  queuedTool: Tool;
}

export interface Bed {
  stage: Stage;
  family: 'moon' | 'coral' | 'fern';
  cared: boolean;
}

export interface GameState {
  version: 1;
  code: string;
  seed: string;
  rng: number;
  turn: number;
  maxTurns: number;
  score: number;
  target: number;
  caredCount: number;
  visitorTarget: number;
  status: 'playing' | 'won' | 'lost';
  players: Player[];
  beds: Bed[];
  history: string[];
  startedAt: number;
}

export const tools: Record<Tool, { label: string; help: string }> = {
  plant: { label: 'Plant seed', help: 'Start an empty bed.' },
  water: { label: 'Water bed', help: 'Advance a planted bed.' },
  tend: { label: 'Tend plant', help: 'Care for a growing or blooming bed.' },
};

export function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function nextRng(value: number): number {
  let x = value || 1;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return x >>> 0;
}

export function weatherFor(state: GameState): Weather {
  const weather: Weather[] = ['Rain', 'Warm light', 'Wind'];
  return weather[(hashSeed(state.seed) + state.turn) % weather.length];
}

export function createGame(names: string[], seed: string, now = Date.now()): GameState {
  const cleanNames = names.map((name, index) => name.trim() || `Player ${index + 1}`).slice(0, 4);
  while (cleanNames.length < 2) cleanNames.push(`Player ${cleanNames.length + 1}`);
  let rng = hashSeed(seed);
  const families: Bed['family'][] = ['moon', 'coral', 'fern'];
  const beds = Array.from({ length: 16 }, () => {
    rng = nextRng(rng);
    return { stage: 'empty' as const, family: families[rng % families.length], cared: false };
  });
  return {
    version: 1,
    code: (hashSeed(`${seed}:${now}`) % 1_679_616).toString(36).toUpperCase().padStart(4, '0'),
    seed,
    rng,
    turn: 0,
    maxTurns: 12,
    score: 0,
    target: 12 + cleanNames.length,
    caredCount: 0,
    visitorTarget: 3,
    status: 'playing',
    players: cleanNames.map((name, id) => ({ id, name, away: false, queuedTool: 'plant' })),
    beds,
    history: ['The garden is ready. Plant the first seed.'],
    startedAt: now,
  };
}

export function createDemoGame(): GameState {
  const state = createGame(['Mara', 'Jules', 'Noor'], 'MOSS-27', 1_788_278_400_000);
  state.code = 'MOSS';
  state.turn = 6;
  state.score = 11;
  state.target = 14;
  state.caredCount = 2;
  state.visitorTarget = 3;
  state.players[1].away = true;
  state.players[1].queuedTool = 'water';
  state.beds[0] = { stage: 'bloom', family: 'moon', cared: true };
  state.beds[1] = { stage: 'bloom', family: 'coral', cared: true };
  state.beds[2] = { stage: 'growing', family: 'fern', cared: false };
  state.beds[4] = { stage: 'seeded', family: 'coral', cared: false };
  state.beds[5] = { stage: 'growing', family: 'moon', cared: false };
  state.history = [
    'Noor planted a moon seed.',
    'Mara tended the moon bloom.',
    'Jules is sleeping. The group can place their queued water token.',
  ];
  return state;
}

export function currentPlayer(state: GameState): Player {
  return state.players[state.turn % state.players.length];
}

export function validAction(state: GameState, tool: Tool, bedIndex: number): boolean {
  if (state.status !== 'playing') return false;
  const bed = state.beds[bedIndex];
  if (!bed) return false;
  if (tool === 'plant') return bed.stage === 'empty';
  if (tool === 'water') return bed.stage === 'seeded' || bed.stage === 'growing';
  return bed.stage === 'growing' || (bed.stage === 'bloom' && !bed.cared);
}

export function applyAction(source: GameState, tool: Tool, bedIndex: number): GameState {
  if (!validAction(source, tool, bedIndex)) return source;
  const state: GameState = structuredClone(source);
  const bed = state.beds[bedIndex];
  const player = currentPlayer(state);
  const weather = weatherFor(state);
  const actor = player.away ? `The group used ${player.name}’s queued token` : player.name;
  let result = '';

  if (tool === 'plant') {
    bed.stage = weather === 'Warm light' ? 'growing' : 'seeded';
    result = weather === 'Warm light' ? 'planted a seed that began growing' : 'planted a seed';
  } else if (tool === 'water') {
    if (bed.stage === 'growing' || weather === 'Rain') {
      bed.stage = 'bloom';
      state.score += 3;
      result = 'watered a bed into bloom';
    } else {
      bed.stage = 'growing';
      result = 'watered a seedling';
    }
  } else {
    if (bed.stage === 'growing') {
      bed.stage = 'bloom';
      state.score += weather === 'Wind' ? 4 : 3;
      result = 'tended a plant into bloom';
    } else {
      state.score += weather === 'Wind' ? 2 : 1;
      result = 'tended a blooming plant';
    }
    if (!bed.cared) {
      bed.cared = true;
      state.caredCount += 1;
    }
  }

  state.turn += 1;
  const line = `${actor} ${result}.`;
  state.history = [...state.history.slice(-4), line];
  if (state.score >= state.target && state.caredCount >= state.visitorTarget) {
    state.status = 'won';
    state.history.push('The garden is restored and the visitor request is complete.');
  } else if (state.turn >= state.maxTurns) {
    state.status = 'lost';
    state.history.push('The chapter ended before both garden goals were met.');
  }
  return state;
}

export function toggleAway(source: GameState, playerId: number): GameState {
  const state: GameState = structuredClone(source);
  const player = state.players.find((item) => item.id === playerId);
  if (!player) return source;
  player.away = !player.away;
  state.history = [...state.history.slice(-4), player.away
    ? `${player.name} is sleeping. The group can use their queued token.`
    : `${player.name} returned to the garden.`];
  return state;
}

export function setQueuedTool(source: GameState, playerId: number, tool: Tool): GameState {
  const state: GameState = structuredClone(source);
  const player = state.players.find((item) => item.id === playerId);
  if (player) player.queuedTool = tool;
  return state;
}
