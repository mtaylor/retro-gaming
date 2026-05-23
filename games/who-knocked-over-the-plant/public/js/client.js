/* global io */
import { SUSPECTS, ITEMS, ROOMS, getCardLabel, findEntry } from './data.js';
import { CHARACTERS, characterSpriteUrl, getCharacter } from './characters.js';
import { renderBoard } from './boardView.js';
import { getSocketServerUrl, isStaticHubHost } from './socket-url.js';

const app = document.getElementById('app');
if (!app) throw new Error('App element not found');

if (typeof io === 'undefined') {
  app.innerHTML =
    '<div class="screen welcome"><h1>Connection error</h1><p>Could not load Socket.io. Check your network or ad blocker.</p></div>';
  throw new Error('Socket.io not loaded');
}

const serverUrl = getSocketServerUrl();
if (isStaticHubHost() && !serverUrl) {
  app.innerHTML = `<div class="screen welcome">
    <div class="hero-plant">🪴💨</div>
    <h1>Multiplayer server needed</h1>
    <p class="sub">GitHub Pages can't host real-time games. Deploy the free server once, then everyone plays on their own phone.</p>
    <div class="panel" style="text-align:left">
      <p><strong>Easiest:</strong> deploy to <a href="https://render.com" target="_blank" rel="noopener">Render</a> (see <code>DEPLOY.md</code>) and open that URL on every device.</p>
      <p><strong>Or:</strong> add GitHub secret <code>WKOTP_RENDER_URL</code> and redeploy Pages.</p>
      <p><strong>Test now:</strong> add <code>?server=https://YOUR-APP.onrender.com</code> to this page's URL.</p>
      <p><strong>Local:</strong> <code>npm start</code> → <code>http://localhost:3456</code></p>
    </div>
  </div>`;
  throw new Error('REMOTE_SERVER_URL not set');
}

const socket = serverUrl
  ? io(serverUrl, { transports: ['websocket', 'polling'], reconnection: true })
  : io({ transports: ['websocket', 'polling'], reconnection: true });
const SESSION_KEY = 'wkotp-session';

let gameState = null;
let privateState = null;
let moveOptions = null;
let screen = 'welcome';
let pendingMode = null;
let pendingCode = '';
let notebookOpen = false;
let notebook = { suspects: {}, items: {}, rooms: {} };
let revealedCard = null;
let modal = null;
let connectionError = null;

function saveSession(data) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

function loadSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

function initNotebook() {
  notebook = { suspects: {}, items: {}, rooms: {} };
  SUSPECTS.forEach(s => { notebook.suspects[s.id] = 'unknown'; });
  ITEMS.forEach(i => { notebook.items[i.id] = 'unknown'; });
  ROOMS.forEach(r => { notebook.rooms[r.id] = 'unknown'; });
}

function syncNotebook() {
  if (!privateState?.hand) return;
  for (const card of privateState.hand) {
    const key = card.type === 'suspect' ? 'suspects' : card.type === 'item' ? 'items' : 'rooms';
    notebook[key][card.id] = 'in-hand';
  }
  for (const { type, id } of privateState.eliminations || []) {
    const key = type === 'suspect' ? 'suspects' : type === 'item' ? 'items' : 'rooms';
    if (notebook[key][id] === 'unknown') notebook[key][id] = 'eliminated';
  }
}

function applyPrivateState(state) {
  privateState = state;
  if (gameState?.status === 'playing') syncNotebook();
}

function setScreenFromGame() {
  if (!gameState) return;
  if (gameState.status === 'lobby') screen = 'lobby';
  else if (gameState.status === 'playing') {
    if (screen !== 'game') initNotebook();
    screen = 'game';
  } else if (gameState.status === 'ended') screen = 'ended';
}

socket.on('connect', () => {
  connectionError = null;
  const session = loadSession();
  if (session?.code && session?.playerId) {
    socket.emit('rejoin-game', {
      code: session.code,
      playerId: session.playerId,
      characterId: session.characterId,
    }, (res) => {
      if (res.error) {
        clearSession();
        screen = 'welcome';
      } else {
        saveSession({
          code: res.code,
          playerId: res.playerId,
          characterId: session.characterId,
          name: session.name,
          isHost: res.isHost,
        });
        screen = 'lobby';
      }
      render();
    });
  } else {
    render();
  }
});

socket.on('connect_error', () => {
  connectionError = serverUrl
    ? `Cannot reach game server at ${serverUrl}. If it was idle, wait 30s and refresh (free tier wakes up).`
    : 'Cannot reach game server. Run npm start on the host computer.';
  screen = 'welcome';
  render();
});

socket.on('game-state', (state) => {
  gameState = state;
  setScreenFromGame();
  if (state.pendingSuggestion?.responderId === privateState?.playerId) modal = 'respond';
  render();
});

socket.on('private-state', (state) => {
  applyPrivateState(state);
  render();
});

socket.on('card-revealed', ({ card }) => {
  revealedCard = card;
  modal = 'reveal';
  render();
});

socket.on('game-ended-by-host', () => {
  clearSession();
  gameState = null;
  privateState = null;
  screen = 'welcome';
  modal = null;
  alert('The host ended the game.');
  render();
});

function toggleNote(type, id) {
  const key = type === 'suspect' ? 'suspects' : type === 'item' ? 'items' : 'rooms';
  const cur = notebook[key][id];
  if (cur === 'unknown') notebook[key][id] = 'eliminated';
  else if (cur === 'eliminated') notebook[key][id] = 'unknown';
  render();
}

window.notebook = { toggle: toggleNote };

window.gameActions = {
  createGame() {
    pendingMode = 'create';
    pendingCode = '';
    screen = 'character';
    render();
  },

  joinGame() {
    const code = document.getElementById('code-input')?.value?.trim().toUpperCase() || '';
    if (!code) return alert('Enter a game code');
    pendingMode = 'join';
    pendingCode = code;
    screen = 'character';
    render();
  },

  pickCharacter(characterId) {
    const ch = getCharacter(characterId);
    if (!ch) return;

    if (pendingMode === 'create') {
      socket.emit('create-game', { characterId }, (res) => {
        if (res.error) return alert(res.error);
        saveSession({
          code: res.code,
          playerId: res.playerId,
          characterId,
          name: ch.name,
          isHost: true,
        });
        applyPrivateState({ playerId: res.playerId, isHost: true, hand: [], eliminations: [] });
        pendingMode = null;
        screen = 'lobby';
        render();
      });
      return;
    }

    if (pendingMode === 'join') {
      socket.emit('join-game', { code: pendingCode, characterId }, (res) => {
        if (res.error) return alert(res.error);
        saveSession({
          code: res.code,
          playerId: res.playerId,
          characterId,
          name: ch.name,
          isHost: false,
        });
        applyPrivateState({ playerId: res.playerId, isHost: false, hand: [], eliminations: [] });
        pendingMode = null;
        screen = 'lobby';
        render();
      });
    }
  },

  cancelCharacterPick() {
    pendingMode = null;
    pendingCode = '';
    screen = 'welcome';
    render();
  },

  toggleNotebook() {
    notebookOpen = !notebookOpen;
    render();
  },

  startGame() {
    if (!privateState?.isHost) return alert('Only the host can start the game');
    socket.emit('start-game', {}, (res) => { if (res.error) alert(res.error); });
  },

  endGame() {
    if (!privateState?.isHost) return alert('Only the host can end the game');
    if (!confirm('End this game for everyone?')) return;
    socket.emit('end-game', {}, (res) => {
      if (res.error) return alert(res.error);
      clearSession();
      gameState = null;
      privateState = null;
      screen = 'welcome';
      moveOptions = null;
      modal = null;
      render();
    });
  },

  leaveGame() {
    socket.emit('leave-game', {}, () => {
      clearSession();
      gameState = null;
      privateState = null;
      screen = 'welcome';
      moveOptions = null;
      modal = null;
      render();
    });
  },

  rollDice() {
    socket.emit('roll-dice', {}, (res) => {
      if (res.error) return alert(res.error);
      socket.emit('get-moves', {}, (moves) => { moveOptions = moves; render(); });
    });
  },

  moveHall(row, col) {
    socket.emit('move', { type: 'hall', row, col }, (res) => {
      if (res.error) return alert(res.error);
      moveOptions = null;
      render();
    });
  },

  enterRoom(roomId) {
    socket.emit('move', { type: 'enter', roomId }, (res) => {
      if (res.error) return alert(res.error);
      moveOptions = null;
      render();
    });
  },

  stayRoom() {
    const me = gameState.players.find(p => p.id === privateState.playerId);
    socket.emit('move', { type: 'stay', roomId: me.inRoom }, (res) => {
      if (res.error) return alert(res.error);
      moveOptions = null;
      render();
    });
  },

  secretPassage(roomId) {
    socket.emit('move', { type: 'secret', roomId }, (res) => {
      if (res.error) return alert(res.error);
      moveOptions = null;
      render();
    });
  },

  openSuggest() { modal = 'suggest'; render(); },
  openAccuse() { modal = 'accuse'; render(); },
  closeModal() { modal = null; render(); },

  submitSuggest() {
    socket.emit('suggest', {
      suspectId: document.getElementById('pick-suspect').value,
      itemId: document.getElementById('pick-item').value,
    }, (res) => {
      if (res.error) return alert(res.error);
      modal = res.disproved && res.responderId === privateState.playerId ? 'respond' : null;
      render();
    });
  },

  submitAccuse() {
    socket.emit('accuse', {
      suspectId: document.getElementById('pick-suspect').value,
      itemId: document.getElementById('pick-item').value,
      roomId: document.getElementById('pick-room').value,
    }, (res) => {
      if (res.error) return alert(res.error);
      modal = null;
      render();
    });
  },

  respondCard(type, id) {
    socket.emit('respond', { type, id }, (res) => {
      if (res.error) return alert(res.error);
      modal = null;
      render();
    });
  },

  dismissReveal() {
    revealedCard = null;
    modal = null;
    render();
  },

  endTurn() {
    socket.emit('end-turn', {}, (res) => {
      if (res.error) return alert(res.error);
      moveOptions = null;
      render();
    });
  },

  refreshMoves() {
    socket.emit('get-moves', {}, (moves) => { moveOptions = moves; render(); });
  },
};

function nbSection(title, items, type, key) {
  return `
    <div class="nb-section">
      <h4>${title}</h4>
      <div class="nb-grid">
        ${items.map((item) => {
          const sprite = type === 'suspect' ? characterSpriteUrl(item.id) : '';
          return `
          <button type="button" class="nb-cell ${notebook[key][item.id]}"
            onclick="window.notebook.toggle('${type}','${item.id}')">
            ${sprite ? `<img src="${sprite}" alt="" class="nb-sprite">` : `<span>${item.emoji}</span>`}
            <small>${item.name.split(' ')[0]}</small>
          </button>`;
        }).join('')}
      </div>
    </div>`;
}

function renderNotebook() {
  return `
    <div class="notebook">
      <h3>📓 Notebook</h3>
      ${nbSection('Who?', SUSPECTS, 'suspect', 'suspects')}
      ${nbSection('What?', ITEMS, 'item', 'items')}
      ${nbSection('Where?', ROOMS, 'room', 'rooms')}
    </div>`;
}

function renderCharacterCard(character, taken) {
  const src = characterSpriteUrl(character.id);
  return `
    <button type="button" class="char-card ${taken ? 'taken' : ''}" ${taken ? 'disabled' : ''}
      onclick="window.gameActions.pickCharacter('${character.id}')">
      ${src ? `<img src="${src}" alt="${character.name}" class="char-sprite">` : `<span class="char-emoji">${character.emoji}</span>`}
      <span class="char-name">${character.name}</span>
      ${taken ? '<span class="char-taken">Taken</span>' : ''}
    </button>`;
}

function renderCharacterSelect() {
  const takenIds = new Set((gameState?.players || []).map((p) => p.characterId));
  return `
    <div class="screen character-select">
      <div class="hero-plant">🪴</div>
      <h1>Choose your character</h1>
      <p class="sub">${pendingMode === 'join' ? `Joining game ${pendingCode}` : 'Creating a new game'} — pick who you are</p>
      <div class="char-grid">
        ${CHARACTERS.map((c) => renderCharacterCard(c, takenIds.has(c.id))).join('')}
      </div>
      <button type="button" class="btn btn-ghost btn-block" onclick="window.gameActions.cancelCharacterPick()">← Back</button>
    </div>`;
}

function renderWelcome() {
  return `
    <div class="screen welcome">
      <div class="hero-plant">🪴💨</div>
      <h1>Who Knocked Over the Plant?</h1>
      <p class="sub">Cluedo with a family twist — each device is one player</p>
      ${connectionError ? `<p class="error-msg">${connectionError}</p>` : ''}
      <div class="panel">
        <button type="button" class="btn btn-primary btn-block" onclick="window.gameActions.createGame()">Create Game</button>
        <div class="divider">or join with code</div>
        <label>Game code<input id="code-input" type="text" placeholder="ABCD" maxlength="4" style="text-transform:uppercase"></label>
        <button type="button" class="btn btn-secondary btn-block" onclick="window.gameActions.joinGame()">Join Game</button>
      </div>
      <div class="rules">
        <p>👑 Host creates the game and picks a character first</p>
        <p>📱 Dad, Mam, Henry, Eleanor, or the Cleaner — one per device</p>
      </div>
    </div>`;
}

function renderLobby() {
  const players = gameState?.players || [];
  const isHost = privateState?.isHost;
  return `
    <div class="screen lobby">
      <h2>${isHost ? '👑 Your Game' : 'Game Lobby'}</h2>
      <div class="code-display">${gameState?.code || '...'}</div>
      <p class="sub">${isHost ? 'Share this code so others can join' : 'Waiting for the host...'}</p>
      <ul class="player-list">
        ${players.map((p) => {
          const src = characterSpriteUrl(p.characterId);
          return `<li>
            ${src ? `<img class="lobby-sprite" src="${src}" alt="">` : `<span class="pdot" style="background:${p.color}"></span>`}
            <span>${p.name}${p.id === gameState.hostId ? ' 👑 host' : ''}</span>
          </li>`;
        }).join('')}
      </ul>
      <p>${players.length}/5 players</p>
      ${isHost ? `
        <button type="button" class="btn btn-primary btn-block" onclick="window.gameActions.startGame()" ${players.length < 2 ? 'disabled' : ''}>Start Game</button>
        <button type="button" class="btn btn-danger btn-block" onclick="window.gameActions.endGame()">Cancel Game</button>
      ` : `
        <p class="waiting">Waiting for host to start...</p>
        <button type="button" class="btn btn-ghost btn-block" onclick="window.gameActions.leaveGame()">Leave</button>
      `}
    </div>`;
}

function renderGame() {
  if (!gameState?.players) return renderWelcome();

  const me = gameState.players.find(p => p.id === privateState?.playerId);
  const isMyTurn = gameState.currentPlayerId === privateState?.playerId;
  const isHost = privateState?.isHost;
  const currentName = gameState.players.find(p => p.id === gameState.currentPlayerId)?.name;
  const canRoll = isMyTurn && gameState.diceRoll === null && !me?.eliminated;
  const canSuggest = isMyTurn && me?.inRoom && gameState.hasMoved && !gameState.hasSuggested;

  const drawerOpen = notebookOpen ? 'open' : '';

  return `
    <div class="screen game-layout">
      <header class="game-header">
        <span class="code-badge">${gameState.code}</span>
        <span class="turn-info">${isMyTurn ? '🟢 Your turn' : `⏳ ${currentName}'s turn`}</span>
        ${gameState.diceRoll ? `<span class="dice-badge">🎲 ${gameState.diceRoll}</span>` : ''}
        <button type="button" class="btn btn-sm btn-notebook-toggle" onclick="window.gameActions.toggleNotebook()" aria-expanded="${notebookOpen}">
          📓 ${notebookOpen ? 'Hide' : 'Notebook'}
        </button>
        ${isHost ? `<button type="button" class="btn btn-sm btn-danger" onclick="window.gameActions.endGame()">End</button>` : ''}
      </header>
      ${gameState.familyClue ? `<div class="clue-bar">${gameState.familyClue.text}</div>` : ''}
      <div class="game-stage">
        <div class="board-panel">${renderBoard(gameState, privateState, moveOptions)}</div>
        <div class="game-bar">
          <div class="hand-compact">
            <span class="hand-label">Cards:</span>
            ${(privateState?.hand || []).map((c) => `<span class="card-chip">${getCardLabel(c)}</span>`).join('') || '<span class="muted">—</span>'}
          </div>
          <div class="actions actions-inline">
            ${canRoll ? `<button type="button" class="btn btn-primary btn-sm" onclick="window.gameActions.rollDice()">Roll 🎲</button>` : ''}
            ${isMyTurn && gameState.diceRoll && !gameState.hasMoved && !moveOptions ? `<button type="button" class="btn btn-secondary btn-sm" onclick="window.gameActions.refreshMoves()">Moves</button>` : ''}
            ${canSuggest ? `<button type="button" class="btn btn-primary btn-sm" onclick="window.gameActions.openSuggest()">Suggest</button>` : ''}
            ${!me?.eliminated ? `<button type="button" class="btn btn-danger btn-sm" onclick="window.gameActions.openAccuse()">Accuse</button>` : ''}
            ${isMyTurn ? `<button type="button" class="btn btn-ghost btn-sm" onclick="window.gameActions.endTurn()">End turn</button>` : ''}
          </div>
        </div>
        <aside class="notebook-drawer ${drawerOpen}" aria-hidden="${!notebookOpen}">
          <button type="button" class="drawer-close" onclick="window.gameActions.toggleNotebook()" aria-label="Close notebook">×</button>
          ${renderNotebook()}
          <div class="log">${(gameState.log || []).slice(-8).map((l) => `<p>${l}</p>`).join('')}</div>
        </aside>
        ${notebookOpen ? '<div class="drawer-backdrop" onclick="window.gameActions.toggleNotebook()"></div>' : ''}
      </div>
      ${renderModal()}
    </div>`;
}

function renderModal() {
  if (modal === 'reveal' && revealedCard) {
    return `<div class="modal-overlay"><div class="modal"><h3>Card shown to you</h3><p class="big-card">${getCardLabel(revealedCard)}</p><button type="button" class="btn btn-primary" onclick="window.gameActions.dismissReveal()">OK</button></div></div>`;
  }
  if (modal === 'respond' && privateState?.pendingMatches?.length) {
    return `<div class="modal-overlay"><div class="modal"><h3>Show one card</h3>
      ${privateState.pendingMatches.map(c => `<button type="button" class="btn btn-primary btn-block" onclick="window.gameActions.respondCard('${c.type}','${c.id}')">${getCardLabel(c)}</button>`).join('')}
      <button type="button" class="btn btn-ghost btn-block" onclick="window.gameActions.closeModal()">Cancel</button></div></div>`;
  }
  if (modal === 'suggest' || modal === 'accuse') {
    const me = gameState.players.find(p => p.id === privateState?.playerId);
    const roomName = findEntry('room', me?.inRoom)?.name || '';
    return `<div class="modal-overlay"><div class="modal">
      <h3>${modal === 'accuse' ? '⚖️ Accusation' : '🔍 Suggestion'}</h3>
      ${modal === 'suggest' ? `<p>In ${roomName}</p>` : ''}
      <label>Suspect<select id="pick-suspect">${SUSPECTS.map(s => `<option value="${s.id}">${s.emoji} ${s.name}</option>`).join('')}</select></label>
      <label>Item<select id="pick-item">${ITEMS.map(i => `<option value="${i.id}">${i.emoji} ${i.name}</option>`).join('')}</select></label>
      ${modal === 'accuse' ? `<label>Room<select id="pick-room">${ROOMS.map(r => `<option value="${r.id}">${r.emoji} ${r.name}</option>`).join('')}</select></label>` : ''}
      <button type="button" class="btn btn-primary btn-block" onclick="window.gameActions.${modal === 'accuse' ? 'submitAccuse' : 'submitSuggest'}()">Submit</button>
      <button type="button" class="btn btn-ghost btn-block" onclick="window.gameActions.closeModal()">Cancel</button>
    </div></div>`;
  }
  return '';
}

function renderEnded() {
  const isHost = privateState?.isHost;
  return `
    <div class="screen ended">
      <h1>🪴 Game Over</h1>
      ${gameState?.winner ? `<p class="winner">${gameState.winner.name} solved it!</p>` : ''}
      <button type="button" class="btn btn-primary" onclick="window.gameActions.${isHost ? 'endGame' : 'leaveGame'}()">Back to Home</button>
    </div>`;
}

function render() {
  try {
    const screens = {
      welcome: renderWelcome,
      character: renderCharacterSelect,
      lobby: renderLobby,
      game: renderGame,
      ended: renderEnded,
    };
    if (screen === 'game') {
      document.body.classList.add('in-game');
    } else {
      document.body.classList.remove('in-game');
    }
    let html = (screens[screen] || renderWelcome)();
    html = html.replace(/<\/?motion-div[^>]*>/g, t => t.startsWith('</') ? '</div>' : '<div>');
    app.innerHTML = html;
  } catch (err) {
    console.error(err);
    app.innerHTML = `<div class="screen welcome"><h1>Something went wrong</h1><p class="error-msg">${err.message}</p><button type="button" class="btn btn-primary" onclick="location.reload()">Reload</button></div>`;
  }
}

render();
