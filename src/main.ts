import './styles.css';
import {
  applyAction,
  createDemoGame,
  createGame,
  currentPlayer,
  setQueuedTool,
  toggleAway,
  tools,
  validAction,
  weatherFor,
  type GameState,
  type Tool,
} from './game';

const root = document.querySelector<HTMLDivElement>('#app')!;
const STORAGE_KEY = 'pause-garden:room';
const ROOM_SESSION_KEY = 'pause-garden:room-session';
const DEMO_KEY = 'demo:pause-garden:room';
const SOUND_KEY = 'pause-garden:sound';
const COMPLETE_KEY = 'pause-garden:chapters-complete';
const LICENSE_KEY = 'sb_license:pause-garden';
const VERDICT_KEY = 'pause-garden:license-verdict';
const API_BASE = 'https://api.sociobot.in/api/v1/products/pause-garden';
const ROOM_ORIGIN = import.meta.env.VITE_ROOM_API || (location.hostname === '127.0.0.1' || location.hostname === 'localhost'
  ? 'http://127.0.0.1:8787'
  : 'https://pause-garden-realtime.sociobot.in');

interface RoomSession { code: string; sessionToken: string; playerId: number }

let game: GameState | null = null;
let selectedTool: Tool = 'plant';
let soundEnabled = localStorage.getItem(SOUND_KEY) !== 'off';
let licensed = false;
let licenseNotice = '';
let lastFocus: HTMLElement | null = null;
let roomSocket: WebSocket | null = null;
let roomRevision = 0;
let remotePlayerId: number | null = null;
let connectionState: 'local' | 'connecting' | 'connected' | 'reconnecting' | 'offline' = 'local';
let roomError = '';
let reconnectTimer = 0;

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character]!);
}

function route(): string {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  if (path === '/demo' || path === '/play' || path === '/privacy' || path === '/terms' || path === '/404') return path;
  return path === '/' ? '/' : '/404';
}

function isDemo(): boolean {
  return route() === '/demo' || new URLSearchParams(location.search).get('demo') === '1';
}

function saveGame(): void {
  if (!game) return;
  const storage = isDemo() ? sessionStorage : localStorage;
  storage.setItem(isDemo() ? DEMO_KEY : STORAGE_KEY, JSON.stringify(game));
}

function savedRoomSession(): RoomSession | null {
  try {
    const session = JSON.parse(localStorage.getItem(ROOM_SESSION_KEY) || 'null') as RoomSession | null;
    return session?.code && session.sessionToken && Number.isInteger(session.playerId) ? session : null;
  } catch { return null; }
}

function loadGame(demo: boolean): GameState | null {
  if (!demo && !savedRoomSession()) return null;
  const storage = demo ? sessionStorage : localStorage;
  const raw = storage.getItem(demo ? DEMO_KEY : STORAGE_KEY);
  if (!raw) return demo ? createDemoGame() : null;
  try {
    const parsed = JSON.parse(raw) as GameState;
    return parsed.version === 1 ? parsed : null;
  } catch {
    return demo ? createDemoGame() : null;
  }
}

function pageTitle(path: string): string {
  const titles: Record<string, string> = {
    '/': 'Pause Garden — Restore a garden with friends',
    '/demo': 'Demo — Pause Garden',
    '/play': 'Play — Pause Garden',
    '/privacy': 'Privacy — Pause Garden',
    '/terms': 'Terms — Pause Garden',
    '/404': 'Page not found — Pause Garden',
  };
  return titles[path] || titles['/404'];
}

function updateMetadata(path: string): void {
  const descriptions: Record<string, string> = {
    '/': 'Play a 12-turn garden chapter with 2–4 friends. A sleeping player never stops the group.',
    '/demo': 'Try a sample Pause Garden chapter on turn seven with no setup.',
    '/play': 'Create or join a private Pause Garden room for 2–4 remote friends.',
    '/privacy': 'Read what Pause Garden stores for private rooms and when it checks a license.',
    '/terms': 'Read the purchase and license terms for Pause Garden.',
    '/404': 'This page does not reach the garden. Return home or open the sample game.',
  };
  const description = descriptions[path] || descriptions['/404'];
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', description);
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', `https://pause-garden.sociobot.in${path}`);
  document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute('content', pageTitle(path));
  document.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.setAttribute('content', description);
}

function header(path: string): string {
  return `<a class="skip-link button" href="#main">Skip to game</a>
    <header class="shell site-header">
      <a class="wordmark" href="/" data-link>Pause Garden</a>
      <nav class="site-nav" aria-label="Main navigation">
        <a class="nav-demo" href="/demo" data-link ${path === '/demo' ? 'aria-current="page"' : ''}>Demo</a>
        <a href="/play" data-link ${path === '/play' ? 'aria-current="page"' : ''}>Play</a>
        <a href="/privacy" data-link ${path === '/privacy' ? 'aria-current="page"' : ''}>Privacy</a>
      </nav>
    </header>`;
}

function footer(): string {
  return `<footer class="site-footer">
    <div class="shell footer-grid">
      <div>
        <strong>Pause Garden</strong>
        <div>Restore a garden with 2–4 friends.</div>
        <div class="footer-note">Original generated scenery. Room data goes only to Pause Garden. Version 1.1.0.</div>
      </div>
      <div class="footer-links">
        <a href="/privacy" data-link>Privacy</a>
        <a href="/terms" data-link>Terms</a>
        <a href="https://hello-factory.sociobot.in" target="_blank" rel="noreferrer">Built by Param Factory <span class="visually-hidden">(opens in a new tab)</span></a>
      </div>
    </div>
  </footer>`;
}

function previewBoard(): string {
  const marks = ['🌱', '✿', '☘', '', '❀', '🌿', '', '✦', '', '🌱', '✿', '', '☘', '', '🌱', ''];
  return `<div class="hero-preview" aria-label="Sample garden board">
    <div class="preview-top"><strong>Room MOSS · Turn 7 of 12</strong><span>Jules is sleeping</span></div>
    <div class="preview-board">${marks.map((mark) => `<span class="preview-bed">${mark}</span>`).join('')}</div>
  </div>`;
}

function landing(): string {
  return `${header('/')}
    <main id="main">
      <section class="shell hero">
        <div class="hero-art">
          <picture>
            <source media="(max-width: 760px)" srcset="/art/greenhouse-760.webp" />
            <img src="/art/greenhouse-1200.webp" width="1200" height="800" alt="Four garden sprites share a moonlit paper greenhouse." fetchpriority="high" />
          </picture>
        </div>
        <div class="hero-copy">
          <p class="eyebrow">A 12-turn game for 2–4 players</p>
          <h1>Restore a garden, even when friends <em>pause</em></h1>
          <p class="lede">For friends with interrupted evenings who still want each turn to matter.</p>
          <div class="hero-actions">
            <a class="button" href="/demo" data-link>Try it with sample data</a>
            <span class="action-note">A garden opens on turn seven. No setup is needed.</span>
          </div>
          <ul class="facts">
            <li>Keyboard and touch controls</li>
            <li>Private room code, no account</li>
            <li>One full chapter is free</li>
          </ul>
        </div>
        ${previewBoard()}
      </section>
      <section class="section shell" aria-labelledby="how-heading">
        <div class="section-heading">
          <p class="eyebrow">How it works</p>
          <h2 id="how-heading">Take turns without waiting on anyone</h2>
        </div>
        <ol class="steps">
          <li><h3>Choose one action</h3><p>Plant, water, or tend one bed. Weather changes which action helps most.</p></li>
          <li><h3>Mark a player sleeping</h3><p>Their queued token remains available. Any present player can place it.</p></li>
          <li><h3>Meet both goals</h3><p>Restore enough blooms and finish the visitor request within 12 turns.</p></li>
        </ol>
      </section>
      <section class="section plain-section">
        <div class="shell boundaries">
          <div><p class="eyebrow">What it does</p><h2>One shared garden room</h2><ul><li>Creates a private five-character room code.</li><li>Syncs each turn across your friends’ browsers.</li><li>Reconnects the room after a refresh.</li></ul></div>
          <div><p class="eyebrow">What it does not do</p><h2>No pressure to stay online</h2><ul><li>No timers, combat, or daily streaks.</li><li>No account, chat, or public player list.</li><li>No third-party multiplayer service.</li></ul></div>
        </div>
      </section>
      <section class="section shell" id="price">
        <div class="price-layout">
          <div><p class="eyebrow">Host edition</p><h2>Start as many chapters as you want</h2><p class="muted">The free game includes the demo and one full chapter. Host Edition adds unlimited new chapters and custom seeds.</p><p class="price">$6 <small>one-time purchase</small></p><a class="button" href="${API_BASE}/checkout">Buy Host Edition</a></div>
          ${licenseBox()}
        </div>
      </section>
    </main>${footer()}`;
}

function licenseBox(): string {
  return `<div class="license-box">
    <h3>${licensed ? 'Host Edition is active' : 'Already bought it?'}</h3>
    <p class="muted">${licensed ? 'Unlimited chapters and custom seeds are ready.' : 'Paste your license to use Host Edition on this device.'}</p>
    ${licensed ? '' : `<form id="license-form" class="inline-form"><div class="field"><label for="license">License</label><input id="license" name="license" autocomplete="off" required /></div><button type="submit">Restore purchase</button></form>`}
    <p id="license-status" class="${licenseNotice.includes('not') ? 'form-error' : 'muted'}" aria-live="polite">${escapeHtml(licenseNotice)}</p>
  </div>`;
}

function demoBar(): string {
  return `<aside class="demo-bar" aria-label="Demo mode">
    <strong>Demo — sample data, nothing is saved</strong>
    <button type="button" class="secondary" id="reset-demo">Reset demo</button>
    <a class="button secondary" href="/play" data-link>Start for real</a>
  </aside>`;
}

function setupPage(): string {
  const completed = Number(localStorage.getItem(COMPLETE_KEY) || '0');
  const gated = completed > 0 && !licensed;
  return `${header('/play')}<main id="main" class="shell setup-page">
    <p class="eyebrow">Private online room</p>
    <h1>${gated ? 'Start another garden chapter' : 'Start a garden chapter together'}</h1>
    <p class="lede">Name 2–4 friends, then share the room code. Each friend joins from their own browser.</p>
    <div class="setup-grid">
      ${gated ? `<section><div class="notice"><strong>Your free chapter is complete.</strong><p>Host Edition adds unlimited chapters and custom seeds.</p></div><p class="price">$6 <small>one-time purchase</small></p><a class="button" href="${API_BASE}/checkout">Buy Host Edition</a></section>` : `<form id="setup-form" class="setup-form">
        <div class="name-fields" id="name-fields">
          <div class="field"><label for="player-1">Player 1 name</label><input id="player-1" name="player" value="Mara" maxlength="18" required /></div>
          <div class="field"><label for="player-2">Player 2 name</label><input id="player-2" name="player" value="Jules" maxlength="18" required /></div>
        </div>
        <div class="setup-actions"><button type="button" class="secondary" id="add-player">Add player</button><button type="button" class="quiet" id="remove-player" disabled>Remove player</button></div>
        <div class="field"><label for="seed">Garden seed ${licensed ? '' : '(set by the garden)'}</label><input id="seed" name="seed" value="${randomSeed()}" maxlength="16" ${licensed ? '' : 'readonly'} aria-describedby="seed-help" /><small id="seed-help" class="muted">The same seed always creates the same garden and weather.</small></div>
        <p class="form-error" id="setup-error" aria-live="polite">${escapeHtml(roomError)}</p>
        <button type="submit">Create online room</button>
      </form>`}
      <aside class="join-panel"><h2>Join a friend’s room</h2><form id="join-form" class="setup-form"><div class="field"><label for="room-code">Room code</label><input id="room-code" name="code" maxlength="5" autocapitalize="characters" autocomplete="off" required /></div><div class="field"><label for="join-name">Your player name</label><input id="join-name" name="name" maxlength="18" autocomplete="nickname" required /></div><button type="submit">Join online room</button><p class="muted">Use the name your host entered.</p></form></aside>
    </div>
    <section class="section">${licenseBox()}</section>
  </main>${footer()}`;
}

function randomSeed(): string {
  const plants = ['MOSS', 'FERN', 'IRIS', 'SAGE', 'REED'];
  return `${plants[Math.floor(Math.random() * plants.length)]}-${Math.floor(Math.random() * 90 + 10)}`;
}

function plantMark(stage: string, family: string): string {
  if (stage === 'empty') return '<span class="plant-mark">·</span>';
  if (stage === 'seeded') return '<span class="plant-mark">•</span>';
  if (stage === 'growing') return `<span class="plant-mark">${family === 'fern' ? '☘' : '🌱'}</span>`;
  return `<span class="plant-mark">${family === 'coral' ? '❀' : family === 'moon' ? '✿' : '❈'}</span>`;
}

function gamePage(demo: boolean): string {
  if (!game) return setupPage();
  const player = currentPlayer(game);
  if (player.away) selectedTool = player.queuedTool;
  const weather = weatherFor(game);
  const weatherClass = weather.toLowerCase().replace(' ', '-');
  const canTakeTurn = demo || (connectionState === 'connected' && (player.id === remotePlayerId || player.away));
  const connectionCopy = demo
    ? (navigator.onLine ? 'Demo stays in this browser' : 'Offline — demo turns still save here')
    : ({ connected: 'Room synced', connecting: 'Connecting to room…', reconnecting: 'Reconnecting to room…', offline: 'Connection lost — actions are paused', local: 'Opening saved room…' }[connectionState]);
  const awayText = player.away
    ? `<p class="sleep-note"><strong>${escapeHtml(player.name)} is sleeping.</strong> Place their queued ${tools[player.queuedTool].label.toLowerCase()} token for them.</p>`
    : '';
  return `${demo ? demoBar() : ''}${header(demo ? '/demo' : '/play')}
    <main id="main" class="shell game-page">
      <div class="game-title-row">
        <div><p class="eyebrow">Room ${escapeHtml(game.code)} · Seed ${escapeHtml(game.seed)}</p><h1>Restore this garden together</h1><p class="connection ${connectionState === 'offline' || !navigator.onLine ? 'offline' : ''}" aria-live="polite">${connectionCopy}</p>${demo ? '' : '<p class="invite-note">Share the room code and each player’s chosen name.</p>'}</div>
        <div class="game-actions-top">${demo ? '' : '<button type="button" class="secondary" id="copy-room">Copy room code</button>'}<button type="button" class="secondary" id="sound-toggle">Sound ${soundEnabled ? 'on' : 'off'}</button><button type="button" class="secondary" id="pause-game">Pause game</button></div>
      </div>
      <div class="game-layout">
        <section class="garden-stage" aria-label="Garden board">
          <div class="status-strip">
            <div class="status-item"><span>Turn</span><strong>${Math.min(game.turn + 1, game.maxTurns)} of ${game.maxTurns}</strong></div>
            <div class="status-item ${`weather-${weatherClass}`}"><span>Weather</span><strong>${weather}</strong></div>
            <div class="status-item"><span>Bloom points</span><strong>${game.score} / ${game.target}</strong></div>
            <div class="status-item"><span>Visitor care</span><strong>${game.caredCount} / ${game.visitorTarget}</strong></div>
          </div>
          <div class="garden-board" aria-label="Four by four garden beds">
            ${game.beds.map((bed, index) => {
              const valid = validAction(game!, selectedTool, index) && canTakeTurn;
              return `<button type="button" class="garden-bed ${valid ? 'valid' : 'invalid'}" data-bed="${index}" aria-label="Bed ${index + 1}: ${bed.stage} ${bed.family}${bed.cared ? ', cared for' : ''}. ${valid ? `Use ${tools[selectedTool].label}` : 'Not available for this tool'}" ${valid ? '' : 'aria-disabled="true"'}>
                ${bed.cared ? '<span class="cared-mark" aria-hidden="true">♥</span>' : ''}${plantMark(bed.stage, bed.family)}<span class="bed-label">${bed.stage}</span>
              </button>`;
            }).join('')}
          </div>
          <div class="toolbox" role="group" aria-label="Choose an action">
            ${(Object.keys(tools) as Tool[]).map((tool) => `<button type="button" class="tool ${selectedTool === tool ? 'selected' : ''}" data-tool="${tool}" aria-pressed="${selectedTool === tool}" ${player.away || !canTakeTurn ? 'disabled' : ''}><span>${tools[tool].label}</span><small>${tools[tool].help}</small></button>`).join('')}
          </div>
          ${awayText}
        </section>
        <aside class="side-panel">
          <section class="panel"><h2>Chapter goals</h2><div class="goal-line"><span>Bloom points</span><strong>${game.score} / ${game.target}</strong></div><div class="goal-line"><span>Tended beds</span><strong>${game.caredCount} / ${game.visitorTarget}</strong></div><p class="muted">Meet both goals before turn ${game.maxTurns}.</p></section>
          <section class="panel"><h2>Players</h2><div class="players">${game.players.map((item) => `<div class="player ${item.id === player.id ? 'current' : ''} ${item.away ? 'away' : ''}"><span class="player-name"><span class="sprite" aria-hidden="true">${item.away ? 'z' : item.name.slice(0, 1).toUpperCase()}</span><span><strong>${escapeHtml(item.name)}</strong><br><small>${item.away ? `Sleeping · ${tools[item.queuedTool].label}` : item.id === player.id ? 'Current turn' : 'Ready'}</small></span></span><button type="button" class="secondary" data-away="${item.id}">${item.away ? 'Mark present' : 'Mark sleeping'}</button></div>`).join('')}</div></section>
          <section class="panel"><h2>What happened</h2><ul class="history" aria-live="polite">${game.history.slice(-4).map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul></section>
        </aside>
      </div>
      <p class="form-error" aria-live="assertive">${escapeHtml(roomError)}</p><dialog id="pause-dialog" aria-labelledby="pause-title"><h2 id="pause-title">Game paused</h2><p>${demo ? 'This sample is saved for this browser session.' : 'Your room is saved by Pause Garden. Return with this browser or join again.'}</p><div class="dialog-actions"><button type="button" id="resume-game">Resume game</button><a class="button secondary" href="/" data-link>Leave garden</a></div></dialog>
      <dialog id="end-dialog" class="end-panel ${game.status === 'lost' ? 'lost' : ''}" aria-labelledby="end-title"><h2 id="end-title">${game.status === 'won' ? 'Garden restored' : 'Chapter complete'}</h2><p>${game.status === 'won' ? `You earned ${game.score} bloom points and met the visitor request.` : `You earned ${game.score} of ${game.target} bloom points. Try a different action order.`}</p><p class="muted">Room ${escapeHtml(game.code)} · ${game.turn} turns · ${game.players.length} players</p><div class="dialog-actions"><button type="button" id="play-again">Play this seed again</button><button type="button" class="secondary" id="new-room">Start a new room</button></div></dialog>
    </main>${footer()}`;
}

function legalPage(kind: 'privacy' | 'terms'): string {
  const privacy = kind === 'privacy';
  return `${header(`/${kind}`)}<main id="main" class="shell legal-page"><p class="eyebrow">${privacy ? 'Privacy' : 'Terms'}</p><h1>${privacy ? 'Your garden stays on this device' : 'Play fairly and keep your license'}</h1><div class="legal-copy">
    ${privacy ? `<p>Pause Garden does not require an account. The browser stores your room code, reconnect token, last room state, sound setting, and license token.</p><h2>What leaves your device</h2><p>Online room names, turns, and garden state go only to the product-owned Pause Garden room service. The service stores rooms for up to 30 inactive days. A license token goes to Sociobot only when you restore or verify a purchase.</p><h2>Your choices</h2><p>Clear this site’s browser storage to remove this browser’s reconnect data. Demo data uses session storage, never enters the online room service, and ends with that browser session.</p><h2>Contact</h2><p>Email <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a> with a privacy question.</p>` : `<p>Pause Garden is a browser game for personal use. You may play the free chapter and demo without an account.</p><h2>Purchase</h2><p>Host Edition costs $6 once. It adds unlimited chapters and custom seeds. Sociobot and Dodo are the merchant of record. A refund revokes the license.</p><h2>License use</h2><p>You may use your license on your own devices. Do not sell or publish the token. Access may stop if a payment is refunded or the token is misused.</p><h2>Game availability</h2><p>Online rooms require a connection and expire after 30 inactive days. Keep your license token somewhere safe.</p><h2>Contact</h2><p>Email <a href="mailto:support@sociobot.in">support@sociobot.in</a> with a purchase question.</p>`}
    <p>Last updated: September 1, 2026.</p></div></main>${footer()}`;
}

function notFound(): string {
  return `${header('/404')}<main id="main" class="shell not-found"><p class="eyebrow">404</p><h1>This path does not reach the garden</h1><p class="lede">The page may have moved. Return home or open the sample garden.</p><div class="hero-actions"><a class="button" href="/" data-link>Return home</a><a class="button secondary" href="/demo" data-link>Open sample garden</a></div></main>${footer()}`;
}

function bindCommon(): void {
  document.querySelectorAll<HTMLAnchorElement>('a[data-link]').forEach((link) => link.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(new URL(link.href).pathname);
  }));
  document.querySelector<HTMLFormElement>('#license-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const token = new FormData(event.currentTarget as HTMLFormElement).get('license')?.toString().trim();
    if (!token) return;
    localStorage.setItem(LICENSE_KEY, token);
    licenseNotice = 'Checking this license…';
    render(false);
    await verifyLicense(token, true);
  });
}

function roomSocketUrl(): string {
  const url = new URL('/rooms', ROOM_ORIGIN);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}

function showRoomError(message: string): void {
  roomError = message;
  const region = document.querySelector<HTMLElement>('#setup-error');
  if (region) region.textContent = message;
  else if (game) render(false);
}

function connectRoom(message: Record<string, unknown>, reconnect = false): void {
  window.clearTimeout(reconnectTimer);
  roomSocket?.close();
  connectionState = reconnect ? 'reconnecting' : 'connecting';
  roomError = '';
  const socket = new WebSocket(roomSocketUrl());
  roomSocket = socket;
  socket.addEventListener('open', () => socket.send(JSON.stringify(message)));
  socket.addEventListener('message', (event) => {
    let incoming: { type?: string; state?: GameState; revision?: number; sessionToken?: string; playerId?: number; message?: string };
    try { incoming = JSON.parse(String(event.data)); } catch { return showRoomError('The room service sent an unreadable response. Try again.'); }
    if (incoming.type === 'error') return showRoomError(incoming.message || 'The room action could not be completed.');
    if (incoming.type !== 'room' || !incoming.state || !Number.isInteger(incoming.revision)) return;
    const wasPlaying = game?.status === 'playing';
    game = incoming.state;
    roomRevision = incoming.revision!;
    const saved = savedRoomSession();
    if (incoming.sessionToken && Number.isInteger(incoming.playerId)) {
      const session = { code: game.code, sessionToken: incoming.sessionToken, playerId: incoming.playerId! };
      localStorage.setItem(ROOM_SESSION_KEY, JSON.stringify(session));
      remotePlayerId = session.playerId;
    } else if (saved) remotePlayerId = saved.playerId;
    connectionState = 'connected';
    roomError = '';
    if (wasPlaying && game.status !== 'playing') {
      const complete = Number(localStorage.getItem(COMPLETE_KEY) || '0');
      localStorage.setItem(COMPLETE_KEY, String(complete + 1));
    }
    saveGame();
    render(false);
  });
  socket.addEventListener('close', () => {
    if (roomSocket !== socket || route() !== '/play' || !savedRoomSession()) return;
    connectionState = navigator.onLine ? 'reconnecting' : 'offline';
    if (game) render(false);
    reconnectTimer = window.setTimeout(connectSavedRoom, 1_000);
  });
  socket.addEventListener('error', () => {
    if (!game) showRoomError('The online room service is unavailable. Try again in a moment.');
  });
}

function connectSavedRoom(): void {
  const session = savedRoomSession();
  if (!session || route() !== '/play' || roomSocket?.readyState === WebSocket.OPEN || roomSocket?.readyState === WebSocket.CONNECTING) return;
  remotePlayerId = session.playerId;
  connectRoom({ type: 'reconnect', sessionToken: session.sessionToken }, true);
}

function sendRoomAction(message: Record<string, unknown>): boolean {
  if (!roomSocket || roomSocket.readyState !== WebSocket.OPEN) {
    showRoomError('The room is reconnecting. Wait for “Room synced” before acting.');
    return false;
  }
  roomSocket.send(JSON.stringify({ ...message, revision: roomRevision }));
  return true;
}

function bindSetup(): void {
  const fields = document.querySelector('#name-fields');
  const add = document.querySelector<HTMLButtonElement>('#add-player');
  const remove = document.querySelector<HTMLButtonElement>('#remove-player');
  const syncButtons = () => {
    const count = fields?.querySelectorAll('input').length || 0;
    if (add) add.disabled = count >= 4;
    if (remove) remove.disabled = count <= 2;
  };
  add?.addEventListener('click', () => {
    const count = fields?.querySelectorAll('input').length || 0;
    if (!fields || count >= 4) return;
    fields.insertAdjacentHTML('beforeend', `<div class="field"><label for="player-${count + 1}">Player ${count + 1} name</label><input id="player-${count + 1}" name="player" value="Player ${count + 1}" maxlength="18" required /></div>`);
    syncButtons();
  });
  remove?.addEventListener('click', () => {
    const all = fields?.querySelectorAll('.field');
    if (all && all.length > 2) all[all.length - 1].remove();
    syncButtons();
  });
  document.querySelector<HTMLFormElement>('#setup-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget as HTMLFormElement);
    const names = data.getAll('player').map(String).filter((name) => name.trim());
    const seed = String(data.get('seed') || randomSeed()).toUpperCase();
    if (names.length < 2) {
      document.querySelector('#setup-error')!.textContent = 'Add at least two player names to create a room.';
      return;
    }
    selectedTool = 'plant';
    const submit = (event.currentTarget as HTMLFormElement).querySelector<HTMLButtonElement>('button[type="submit"]');
    if (submit) { submit.disabled = true; submit.textContent = 'Creating room…'; }
    connectRoom({ type: 'create', names, seed });
  });
  document.querySelector<HTMLFormElement>('#join-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget as HTMLFormElement);
    const code = String(data.get('code') || '').trim().toUpperCase();
    const name = String(data.get('name') || '').trim();
    if (!/^[A-Z0-9]{5}$/.test(code) || !name) return showRoomError('Enter the five-character room code and your chosen player name.');
    const submit = (event.currentTarget as HTMLFormElement).querySelector<HTMLButtonElement>('button[type="submit"]');
    if (submit) { submit.disabled = true; submit.textContent = 'Joining room…'; }
    connectRoom({ type: 'join', code, name });
  });
}

function bindGame(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach((button) => button.addEventListener('click', () => {
    selectedTool = button.dataset.tool as Tool;
    if (game) {
      const player = currentPlayer(game);
      game = setQueuedTool(game, player.id, selectedTool);
      if (isDemo()) saveGame();
      else sendRoomAction({ type: 'tool', tool: selectedTool });
    }
    render(false);
  }));
  document.querySelectorAll<HTMLButtonElement>('[data-bed]').forEach((button) => button.addEventListener('click', () => {
    if (!game) return;
    const index = Number(button.dataset.bed);
    const player = currentPlayer(game);
    const allowedHere = isDemo() || (connectionState === 'connected' && (player.id === remotePlayerId || player.away));
    if (!allowedHere || !validAction(game, selectedTool, index)) {
      announce(`That bed cannot use ${tools[selectedTool].label.toLowerCase()}.`);
      return;
    }
    if (isDemo()) {
      game = applyAction(game, selectedTool, index);
      playChime();
      saveGame();
      render(false);
    } else if (sendRoomAction({ type: 'play', tool: selectedTool, bedIndex: index })) playChime();
  }));
  document.querySelectorAll<HTMLButtonElement>('[data-away]').forEach((button) => button.addEventListener('click', () => {
    if (!game) return;
    if (isDemo()) {
      game = toggleAway(game, Number(button.dataset.away));
      saveGame();
      render(false);
    } else sendRoomAction({ type: 'away', playerId: Number(button.dataset.away) });
  }));
  document.querySelector('#sound-toggle')?.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem(SOUND_KEY, soundEnabled ? 'on' : 'off');
    render(false);
  });
  document.querySelector('#copy-room')?.addEventListener('click', async () => {
    if (!game) return;
    try {
      await navigator.clipboard.writeText(game.code);
      announce(`Room code ${game.code} copied.`);
      const button = document.querySelector<HTMLButtonElement>('#copy-room');
      if (button) button.textContent = 'Room code copied';
    } catch { announce(`Room code is ${game.code}.`); }
  });
  const pauseDialog = document.querySelector<HTMLDialogElement>('#pause-dialog');
  document.querySelector('#pause-game')?.addEventListener('click', () => { lastFocus = document.activeElement as HTMLElement; pauseDialog?.showModal(); });
  document.querySelector('#resume-game')?.addEventListener('click', () => { pauseDialog?.close(); lastFocus?.focus(); });
  const endDialog = document.querySelector<HTMLDialogElement>('#end-dialog');
  if (game?.status !== 'playing') window.setTimeout(() => endDialog?.showModal(), 0);
  document.querySelector('#play-again')?.addEventListener('click', () => {
    if (!game) return;
    const names = game.players.map((player) => player.name);
    if (isDemo()) {
      game = createGame(names, game.seed);
      selectedTool = 'plant';
      saveGame();
      render(false);
    } else sendRoomAction({ type: 'restart' });
  });
  document.querySelector('#new-room')?.addEventListener('click', () => {
    if (isDemo()) {
      navigate('/play');
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ROOM_SESSION_KEY);
    roomSocket?.close();
    roomSocket = null;
    connectionState = 'local';
    remotePlayerId = null;
    game = null;
    render(false);
  });
  document.querySelector('#reset-demo')?.addEventListener('click', () => {
    sessionStorage.removeItem(DEMO_KEY);
    game = createDemoGame();
    selectedTool = 'tend';
    saveGame();
    render(false);
  });
  const board = document.querySelector<HTMLElement>('.garden-board');
  board?.addEventListener('keydown', (event) => {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-bed]');
    if (!target) return;
    const index = Number(target.dataset.bed);
    const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -4, ArrowDown: 4 };
    const offset = offsets[event.key];
    if (!offset) return;
    event.preventDefault();
    const next = Math.max(0, Math.min(15, index + offset));
    board.querySelector<HTMLButtonElement>(`[data-bed="${next}"]`)?.focus();
  });
}

function render(moveFocus = true): void {
  const path = route();
  document.title = pageTitle(path);
  updateMetadata(path);
  if (path === '/demo') {
    game = loadGame(true);
    if (!sessionStorage.getItem(DEMO_KEY)) saveGame();
    if (game && game.turn === 6 && game.score === 11) selectedTool = 'tend';
    root.innerHTML = gamePage(true);
  } else if (path === '/play') {
    game = loadGame(false);
    root.innerHTML = game ? gamePage(false) : setupPage();
  } else if (path === '/privacy') root.innerHTML = legalPage('privacy');
  else if (path === '/terms') root.innerHTML = legalPage('terms');
  else if (path === '/404') root.innerHTML = notFound();
  else root.innerHTML = landing();
  root.insertAdjacentHTML('beforeend', '<div class="route-announcer" aria-live="polite" aria-atomic="true"></div>');
  bindCommon();
  if (path === '/play' && !game) bindSetup();
  if ((path === '/play' || path === '/demo') && game) bindGame();
  if (moveFocus) {
    window.scrollTo(0, 0);
    const heading = document.querySelector<HTMLElement>('h1');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus({ preventScroll: true });
    announce(document.title);
  }
}

function navigate(path: string): void {
  if (path !== '/play' && route() === '/play') {
    roomSocket?.close();
    roomSocket = null;
  }
  history.pushState({}, '', path);
  game = null;
  selectedTool = path === '/demo' ? 'tend' : 'plant';
  render(true);
  if (path === '/play') connectSavedRoom();
}

function announce(message: string): void {
  const region = document.querySelector<HTMLElement>('.route-announcer');
  if (region) region.textContent = message;
}

function playChime(): void {
  if (!soundEnabled) return;
  try {
    const audio = new AudioContext();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 480;
    gain.gain.setValueAtTime(0.05, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.12);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.12);
  } catch { /* Audio is optional. */ }
}

async function verifyLicense(token: string, force = false): Promise<void> {
  let cached: { valid: boolean; checked: number } | null = null;
  try { cached = JSON.parse(localStorage.getItem(VERDICT_KEY) || 'null'); } catch { cached = null; }
  if (cached?.valid) licensed = true;
  if (!force && cached && Date.now() - cached.checked < 86_400_000) return;
  try {
    const response = await fetch(`${API_BASE}/verify?license=${encodeURIComponent(token)}`);
    const result = await response.json() as { valid: boolean; reason: string };
    licensed = result.valid;
    localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: result.valid, checked: Date.now() }));
    licenseNotice = result.valid ? 'License restored. Host Edition is active.' : 'This license is not active. Check the token or buy Host Edition.';
  } catch {
    licenseNotice = licensed ? 'Using the last valid license check.' : 'License check needs a connection. Try again when online.';
  }
  render(false);
}

function takeLicenseFromUrl(): string | null {
  const params = new URLSearchParams(location.search);
  const token = params.get('license');
  if (!token) return localStorage.getItem(LICENSE_KEY);
  localStorage.setItem(LICENSE_KEY, token);
  params.delete('license');
  const query = params.toString();
  history.replaceState({}, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`);
  return token;
}

function startMotes(): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.createElement('canvas');
  canvas.id = 'motes';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);
  const context = canvas.getContext('2d');
  if (!context) return;
  const motes = Array.from({ length: 24 }, (_, index) => ({ x: (index * 97) % innerWidth, y: (index * 61) % innerHeight, speed: 4 + index % 7 }));
  let last = performance.now();
  let accumulator = 0;
  const step = 1000 / 60;
  const resize = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
  resize();
  addEventListener('resize', resize);
  const frame = (now: number) => {
    const delta = Math.min(now - last, 100);
    last = now;
    if (!document.hidden) {
      accumulator += delta;
      while (accumulator >= step) {
        for (const mote of motes) { mote.y -= mote.speed / 60; if (mote.y < -4) { mote.y = canvas.height + 4; mote.x = (mote.x + 137) % canvas.width; } }
        accumulator -= step;
      }
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#f5f0df';
      for (const mote of motes) { context.beginPath(); context.arc(mote.x, mote.y, 1.1, 0, Math.PI * 2); context.fill(); }
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

addEventListener('popstate', () => { game = null; render(true); if (route() === '/play') connectSavedRoom(); });
addEventListener('online', () => { if (route() === '/play') connectSavedRoom(); else render(false); });
addEventListener('offline', () => { connectionState = 'offline'; render(false); });

const license = takeLicenseFromUrl();
if (license) void verifyLicense(license);
render(false);
if (route() === '/play') connectSavedRoom();
startMotes();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
}
