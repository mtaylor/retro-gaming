import {
  createSolution, buildDeck, dealCards, pickFamilyClue,
  findMatchingCards, getEliminationsFromClue, shuffle, SUSPECTS, getCharacter,
} from './data.js';
import {
  START_POSITIONS, getValidMoves, canEnterRoom, getRoomDoorPosition,
  hasSecretPassage, posKey, getRoomDef, CELLS, COLS, ROWS, ROOM_DEFS,
  START_SPOTS, SECRET_PASSAGES,
} from './board.js';

export const TEST_GAME_CODE = 'TEST';

export class GameRoom {
  constructor(code, hostId, { isTest = false } = {}) {
    this.code = code;
    this.hostId = hostId;
    this.isTest = isTest;
    this.players = new Map(); // socketId -> player
    this.status = 'lobby'; // lobby | playing | ended
    this.solution = null;
    this.familyClue = null;
    this.currentTurnIndex = 0;
    this.diceRoll = null;
    this.hasMoved = false;
    this.hasSuggested = false;
    this.pendingSuggestion = null;
    this.lastRoomLeft = null;
    this.winner = null;
    this.log = [];
  }

  addPlayer(socketId, characterId) {
    const character = getCharacter(characterId);
    if (!character) return { error: 'Invalid character' };
    const taken = [...this.players.values()].some((p) => p.characterId === characterId);
    if (taken) return { error: `${character.name} is already taken` };

    const index = this.players.size;
    this.players.set(socketId, {
      id: socketId,
      characterId: character.id,
      name: character.name,
      index,
      hand: [],
      position: null,
      inRoom: null,
      eliminated: false,
      color: character.color,
    });
    if (!this.hostId) this.hostId = socketId;
    return { ok: true };
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
  }

  getPlayerList() {
    return [...this.players.values()].map(p => ({
      id: p.id,
      name: p.name,
      characterId: p.characterId,
      index: p.index,
      color: p.color,
      eliminated: p.eliminated,
      inRoom: p.inRoom,
      position: p.position,
    }));
  }

  getPlayerOrder() {
    return [...this.players.values()].sort((a, b) => a.index - b.index);
  }

  getCurrentPlayer() {
    const order = this.getPlayerOrder().filter(p => !p.eliminated);
    if (!order.length) return null;
    return order[this.currentTurnIndex % order.length];
  }

  canStart() {
    if (this.status !== 'lobby') return false;
    const min = this.isTest ? 1 : 2;
    return this.players.size >= min && this.players.size <= 5;
  }

  start() {
    if (!this.canStart()) {
      return { error: this.isTest ? 'Need 1–5 players to start' : 'Need 2–5 players to start' };
    }

    this.solution = createSolution();
    const deck = buildDeck(this.solution);
    const hands = dealCards(deck, this.players.size);
    this.familyClue = pickFamilyClue(this.solution);

    const order = this.getPlayerOrder();
    order.forEach((p, i) => {
      p.hand = hands[i];
      p.position = { ...START_POSITIONS[i] };
      p.inRoom = null;
      p.eliminated = false;
    });

    this.status = 'playing';
    this.currentTurnIndex = 0;
    this.diceRoll = null;
    this.hasMoved = false;
    this.hasSuggested = false;
    this.pendingSuggestion = null;
    this.log = [`Game started! ${this.familyClue.text}`];

    return { ok: true };
  }

  rollDice(socketId) {
    const player = this.getCurrentPlayer();
    if (!player || player.id !== socketId) return { error: 'Not your turn' };
    if (this.diceRoll !== null) return { error: 'Already rolled' };

    this.diceRoll = Math.floor(Math.random() * 6) + 1;
    this.hasMoved = false;
    this.hasSuggested = false;
    this.log.push(`${player.name} rolled a ${this.diceRoll}`);
    return { ok: true, roll: this.diceRoll };
  }

  getReachableTiles(socketId) {
    const player = this.getCurrentPlayer();
    if (!player || player.id !== socketId) return { error: 'Not your turn' };
    if (this.diceRoll === null) return { error: 'Roll the dice first' };
    if (this.hasMoved) return { error: 'Already moved this turn' };

    if (player.inRoom) {
      // Can stay or use secret passage
      const options = [{ type: 'stay', roomId: player.inRoom }];
      for (const [a, b] of SECRET_PASSAGES) {
        if (player.inRoom === a) options.push({ type: 'secret', roomId: b });
        if (player.inRoom === b) options.push({ type: 'secret', roomId: a });
      }
      return { ok: true, options, inRoom: true };
    }

    const blocked = new Set();
    for (const p of this.players.values()) {
      if (p.inRoom) continue;
      if (p.position) blocked.add(posKey(p.position.row, p.position.col));
    }
    blocked.delete(posKey(player.position.row, player.position.col));

    const moves = getValidMoves(player.position.row, player.position.col, this.diceRoll, blocked);
    const options = moves.map(m => ({ type: 'hall', row: m.row, col: m.col }));

    // Can enter rooms if door is reachable
    for (const room of ROOM_DEFS) {
      if (this.lastRoomLeft === room.id && player.id === this.getCurrentPlayer()?.id) continue;
      if (canEnterRoom(player.position.row, player.position.col, room.id, this.diceRoll)) {
        options.push({ type: 'enter', roomId: room.id });
      }
    }

    return { ok: true, options, inRoom: false };
  }

  move(socketId, target) {
    const player = this.getCurrentPlayer();
    if (!player || player.id !== socketId) return { error: 'Not your turn' };
    if (this.diceRoll === null) return { error: 'Roll the dice first' };
    if (this.hasMoved) return { error: 'Already moved' };

    const reachable = this.getReachableTiles(socketId);
    if (reachable.error) return reachable;

    if (target.type === 'stay') {
      this.hasMoved = true;
      this.log.push(`${player.name} stays in ${target.roomId}`);
      return { ok: true };
    }

    if (target.type === 'secret') {
      if (!player.inRoom || !hasSecretPassage(player.inRoom, target.roomId)) {
        return { error: 'Invalid secret passage' };
      }
      this.lastRoomLeft = player.inRoom;
      player.inRoom = target.roomId;
      player.position = getRoomDoorPosition(target.roomId);
      this.hasMoved = true;
      this.log.push(`${player.name} took the secret passage to ${target.roomId}!`);
      return { ok: true };
    }

    if (target.type === 'enter') {
      const valid = reachable.options.some(o => o.type === 'enter' && o.roomId === target.roomId);
      if (!valid) return { error: 'Cannot enter that room' };
      this.lastRoomLeft = null;
      player.inRoom = target.roomId;
      player.position = getRoomDoorPosition(target.roomId);
      this.hasMoved = true;
      this.log.push(`${player.name} entered ${target.roomId}`);
      return { ok: true };
    }

    if (target.type === 'hall') {
      const valid = reachable.options.some(o => o.type === 'hall' && o.row === target.row && o.col === target.col);
      if (!valid) return { error: 'Invalid move' };
      player.inRoom = null;
      player.position = { row: target.row, col: target.col };
      this.hasMoved = true;
      this.lastRoomLeft = null;
      this.log.push(`${player.name} moved to (${target.row}, ${target.col})`);
      return { ok: true };
    }

    return { error: 'Unknown move type' };
  }

  suggest(socketId, suspectId, itemId) {
    const player = this.getCurrentPlayer();
    if (!player || player.id !== socketId) return { error: 'Not your turn' };
    if (!player.inRoom) return { error: 'Must be in a room to suggest' };
    if (this.hasSuggested) return { error: 'Already suggested this turn' };
    if (!this.hasMoved && this.diceRoll !== null) return { error: 'Move first (or stay in room)' };

    const roomId = player.inRoom;
    const order = this.getPlayerOrder();
    const startIdx = order.findIndex(p => p.id === socketId);
    let responder = null;
    let matches = [];

    for (let i = 1; i <= order.length; i++) {
      const p = order[(startIdx + i) % order.length];
      if (p.eliminated) continue;
      const m = findMatchingCards(p.hand, suspectId, itemId, roomId);
      if (m.length > 0) {
        responder = p;
        matches = m;
        break;
      }
    }

    this.hasSuggested = true;
    const suspect = SUSPECTS.find(s => s.id === suspectId);
    this.log.push(`${player.name} suggests ${suspect?.name || suspectId} with ${itemId} in ${roomId}`);

    if (!responder) {
      this.log.push('Nobody could disprove it!');
      return { ok: true, disproved: false };
    }

    this.pendingSuggestion = {
      suggesterId: socketId,
      responderId: responder.id,
      suspectId,
      itemId,
      roomId,
      matches,
    };

    return {
      ok: true,
      disproved: true,
      responderId: responder.id,
      responderName: responder.name,
      matchCount: matches.length,
    };
  }

  respond(socketId, card) {
    if (!this.pendingSuggestion) return { error: 'No pending suggestion' };
    if (this.pendingSuggestion.responderId !== socketId) return { error: 'Not your turn to respond' };

    const { matches, suggesterId } = this.pendingSuggestion;
    let shown = card;

    if (card) {
      const valid = matches.some(m => m.type === card.type && m.id === card.id);
      if (!valid) return { error: 'Invalid card' };
    } else if (matches.length === 1) {
      shown = matches[0];
    } else {
      return { error: 'Must choose a card to show' };
    }

    const responder = this.players.get(socketId);
    this.log.push(`${responder.name} showed a card to the suggester`);
    this.pendingSuggestion = null;

    return { ok: true, shown, suggesterId };
  }

  accuse(socketId, suspectId, itemId, roomId) {
    const player = this.players.get(socketId);
    if (!player || player.eliminated) return { error: 'Cannot accuse' };

    const correct =
      this.solution.suspect.id === suspectId &&
      this.solution.item.id === itemId &&
      this.solution.room.id === roomId;

    if (correct) {
      this.status = 'ended';
      this.winner = player;
      this.log.push(`${player.name} solved it! 🎉`);
      return { ok: true, correct: true, winner: player.name };
    }

    player.eliminated = true;
    this.log.push(`${player.name} accused wrongly and is out!`);

    const remaining = this.getPlayerOrder().filter(p => !p.eliminated);
    if (remaining.length === 0) {
      this.status = 'ended';
      this.log.push('Everyone is out! The plant culprit escapes justice.');
    } else if (player.id === this.getCurrentPlayer()?.id) {
      this.endTurn();
    }

    return { ok: true, correct: false, eliminated: true };
  }

  endTurn(socketId) {
    const player = this.getCurrentPlayer();
    if (socketId && player?.id !== socketId) return { error: 'Not your turn' };

    this.diceRoll = null;
    this.hasMoved = false;
    this.hasSuggested = false;
    this.lastRoomLeft = null;
    this.pendingSuggestion = null;

    const order = this.getPlayerOrder().filter(p => !p.eliminated);
    this.currentTurnIndex = (this.currentTurnIndex + 1) % order.length;
    const next = this.getCurrentPlayer();
    if (next) this.log.push(`${next.name}'s turn`);

    return { ok: true };
  }

  resetToLobby() {
    this.status = 'lobby';
    this.solution = null;
    this.familyClue = null;
    this.currentTurnIndex = 0;
    this.diceRoll = null;
    this.hasMoved = false;
    this.hasSuggested = false;
    this.pendingSuggestion = null;
    this.lastRoomLeft = null;
    this.winner = null;
    this.log = [this.isTest ? '🧪 Test game — pick a character and start solo to try the board.' : ''];
    for (const p of this.players.values()) {
      p.hand = [];
      p.position = null;
      p.inRoom = null;
      p.eliminated = false;
    }
  }

  endGame() {
    if (this.isTest) {
      this.resetToLobby();
      return { ok: true, reset: true };
    }
    this.status = 'ended';
    this.log.push('The host ended the game.');
    return { ok: true };
  }

  getPublicState() {
    const current = this.getCurrentPlayer();
    return {
      code: this.code,
      isTest: this.isTest,
      status: this.status,
      hostId: this.hostId,
      players: this.getPlayerList(),
      currentPlayerId: current?.id || null,
      diceRoll: this.diceRoll,
      hasMoved: this.hasMoved,
      hasSuggested: this.hasSuggested,
      familyClue: this.familyClue,
      pendingSuggestion: this.pendingSuggestion
        ? {
            suggesterId: this.pendingSuggestion.suggesterId,
            responderId: this.pendingSuggestion.responderId,
            suspectId: this.pendingSuggestion.suspectId,
            itemId: this.pendingSuggestion.itemId,
            roomId: this.pendingSuggestion.roomId,
          }
        : null,
      winner: this.winner ? { name: this.winner.name, id: this.winner.id } : null,
      log: this.log.slice(-8),
      board: { cols: COLS, rows: ROWS, rooms: ROOM_DEFS, cells: CELLS, startSpots: START_SPOTS },
    };
  }

  getPrivateState(socketId) {
    const player = this.players.get(socketId);
    if (!player) return null;
    return {
      hand: player.hand,
      eliminations: getEliminationsFromClue(this.familyClue),
      isHost: socketId === this.hostId,
      playerId: socketId,
      pendingMatches: this.pendingSuggestion?.responderId === socketId
        ? this.pendingSuggestion.matches
        : null,
    };
  }
}

const games = new Map();

export function createGame(hostId) {
  const code = generateUniqueCode();
  const game = new GameRoom(code, hostId);
  games.set(code, game);
  return game;
}

/** Always-available sandbox game (code TEST) for solo / board testing. */
export function ensureTestGame() {
  let game = games.get(TEST_GAME_CODE);
  if (!game) {
    game = new GameRoom(TEST_GAME_CODE, null, { isTest: true });
    game.log = ['🧪 Test game — anyone can join. Start with 1 player to explore the board.'];
    games.set(TEST_GAME_CODE, game);
  }
  return game;
}

export function getGame(code) {
  return games.get(code?.toUpperCase());
}

export function removeGame(code) {
  if (code === TEST_GAME_CODE) return;
  games.delete(code);
}

function generateUniqueCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (games.has(code) || code === TEST_GAME_CODE);
  return code;
}

export function findGameByPlayer(socketId) {
  for (const game of games.values()) {
    if (game.players.has(socketId)) return game;
  }
  return null;
}
