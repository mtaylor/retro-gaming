import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import os from 'os';
import {
  createGame,
  getGame,
  findGameByPlayer,
  removeGame,
  ensureTestGame,
  TEST_GAME_CODE,
} from './gameEngine.js';
import { getCharacter } from './data.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
  : true;

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

const publicDir = join(__dirname, '..', 'public');
app.use(express.static(publicDir));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'who-knocked-over-the-plant' });
});

function broadcastGame(game) {
  const pub = game.getPublicState();
  for (const [sid] of game.players) {
    io.to(sid).emit('game-state', pub);
    const priv = game.getPrivateState(sid);
    if (priv) io.to(sid).emit('private-state', priv);
  }
}

function destroyGame(game) {
  if (game.isTest) {
    game.resetToLobby();
    broadcastGame(game);
    return;
  }
  io.to(game.code).emit('game-ended-by-host');
  removeGame(game.code);
}

function handleTestDisconnect(game, socketId) {
  const wasHost = game.hostId === socketId;
  game.removePlayer(socketId);

  if (game.players.size === 0) {
    game.resetToLobby();
    game.hostId = null;
  } else if (wasHost) {
    game.hostId = game.getPlayerOrder()[0]?.id ?? null;
    if (game.status === 'playing') game.resetToLobby();
  }
  broadcastGame(game);
}

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}

io.on('connection', (socket) => {
  socket.on('create-game', ({ characterId }, cb) => {
    if (findGameByPlayer(socket.id)) return cb?.({ error: 'Already in a game' });
    const game = createGame(socket.id);
    const added = game.addPlayer(socket.id, characterId);
    if (added?.error) return cb?.(added);
    socket.join(game.code);
    cb?.({ ok: true, code: game.code, playerId: socket.id, isHost: true, characterId });
    broadcastGame(game);
  });

  socket.on('peek-lobby', ({ code }, cb) => {
    const upper = code?.trim()?.toUpperCase();
    const game = upper === TEST_GAME_CODE ? ensureTestGame() : getGame(upper);
    if (!game) return cb?.({ error: 'Game not found' });
    cb?.({
      ok: true,
      code: game.code,
      isTest: game.isTest,
      status: game.status,
      hostId: game.hostId,
      players: game.getPlayerList(),
    });
  });

  socket.on('join-game', ({ code, characterId }, cb) => {
    if (findGameByPlayer(socket.id)) return cb?.({ error: 'Already in a game' });
    const upper = code?.trim()?.toUpperCase();
    const game = upper === TEST_GAME_CODE ? ensureTestGame() : getGame(upper);
    if (!game) return cb?.({ error: 'Game not found' });
    if (game.status !== 'lobby') return cb?.({ error: 'Game already started' });
    if (game.players.size >= 5) return cb?.({ error: 'Game is full' });
    const added = game.addPlayer(socket.id, characterId);
    if (added?.error) return cb?.(added);
    socket.join(game.code);
    cb?.({
      ok: true,
      code: game.code,
      playerId: socket.id,
      isHost: game.hostId === socket.id,
      characterId,
      isTest: game.isTest,
    });
    broadcastGame(game);
  });

  socket.on('rejoin-game', ({ code, playerId, characterId }, cb) => {
    const game = getGame(code?.trim()?.toUpperCase());
    if (!game) return cb?.({ error: 'Game not found' });
    const existing = game.players.get(playerId);
    if (!existing) return cb?.({ error: 'Session expired' });

    game.players.delete(playerId);
    existing.id = socket.id;
    if (characterId && getCharacter(characterId)) {
      const taken = [...game.players.values()].some(
        (p) => p.characterId === characterId && p.id !== socket.id
      );
      if (!taken) {
        const ch = getCharacter(characterId);
        existing.characterId = ch.id;
        existing.name = ch.name;
        existing.color = ch.color;
      }
    }
    game.players.set(socket.id, existing);
    if (game.hostId === playerId) game.hostId = socket.id;
    socket.join(game.code);
    cb?.({ ok: true, code: game.code, playerId: socket.id, isHost: game.hostId === socket.id });
    broadcastGame(game);
  });

  socket.on('start-game', (_, cb) => {
    const game = findGameByPlayer(socket.id);
    if (!game) return cb?.({ error: 'Not in a game' });
    if (game.hostId !== socket.id) return cb?.({ error: 'Only the host can start the game' });
    const result = game.start();
    if (result.error) return cb?.(result);
    cb?.({ ok: true });
    broadcastGame(game);
  });

  socket.on('end-game', (_, cb) => {
    const game = findGameByPlayer(socket.id);
    if (!game) return cb?.({ error: 'Not in a game' });
    if (game.hostId !== socket.id) return cb?.({ error: 'Only the host can end the game' });
    const result = game.endGame();
    if (result.error) return cb?.(result);
    cb?.({ ok: true, reset: !!result.reset });
    if (game.isTest) {
      broadcastGame(game);
    } else {
      destroyGame(game);
    }
  });

  socket.on('leave-game', (_, cb) => {
    const game = findGameByPlayer(socket.id);
    if (!game) return cb?.({ ok: true });
    if (game.hostId === socket.id && !game.isTest) {
      return cb?.({ error: 'Host must use End Game to close the session' });
    }
    socket.leave(game.code);
    if (game.isTest) {
      handleTestDisconnect(game, socket.id);
      return cb?.({ ok: true });
    }
    game.removePlayer(socket.id);
    cb?.({ ok: true });
    broadcastGame(game);
  });

  socket.on('roll-dice', (_, cb) => {
    const game = findGameByPlayer(socket.id);
    if (!game) return cb?.({ error: 'Not in a game' });
    const result = game.rollDice(socket.id);
    cb?.(result);
    broadcastGame(game);
  });

  socket.on('get-moves', (_, cb) => {
    const game = findGameByPlayer(socket.id);
    if (!game) return cb?.({ error: 'Not in a game' });
    cb?.(game.getReachableTiles(socket.id));
  });

  socket.on('move', (target, cb) => {
    const game = findGameByPlayer(socket.id);
    if (!game) return cb?.({ error: 'Not in a game' });
    const result = game.move(socket.id, target);
    cb?.(result);
    broadcastGame(game);
  });

  socket.on('suggest', ({ suspectId, itemId }, cb) => {
    const game = findGameByPlayer(socket.id);
    if (!game) return cb?.({ error: 'Not in a game' });
    const result = game.suggest(socket.id, suspectId, itemId);
    cb?.(result);
    broadcastGame(game);
  });

  socket.on('respond', (card, cb) => {
    const game = findGameByPlayer(socket.id);
    if (!game) return cb?.({ error: 'Not in a game' });
    const result = game.respond(socket.id, card);
    if (result.ok && result.shown) {
      io.to(result.suggesterId).emit('card-revealed', { card: result.shown });
    }
    cb?.(result);
    broadcastGame(game);
  });

  socket.on('accuse', ({ suspectId, itemId, roomId }, cb) => {
    const game = findGameByPlayer(socket.id);
    if (!game) return cb?.({ error: 'Not in a game' });
    const result = game.accuse(socket.id, suspectId, itemId, roomId);
    cb?.(result);
    broadcastGame(game);
  });

  socket.on('end-turn', (_, cb) => {
    const game = findGameByPlayer(socket.id);
    if (!game) return cb?.({ error: 'Not in a game' });
    const result = game.endTurn(socket.id);
    cb?.(result);
    broadcastGame(game);
  });

  socket.on('disconnect', () => {
    const game = findGameByPlayer(socket.id);
    if (!game) return;

    if (game.isTest) {
      handleTestDisconnect(game, socket.id);
      return;
    }

    if (game.hostId === socket.id) {
      destroyGame(game);
      return;
    }

    if (game.status === 'lobby') {
      game.removePlayer(socket.id);
      broadcastGame(game);
    }
  });
});

ensureTestGame();

const PORT = Number(process.env.PORT) || 3456;
httpServer.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIp();
  console.log(`\n🪴 Who Knocked Over the Plant?`);
  console.log(`   Local:   http://localhost:${PORT}`);
  if (ip !== 'localhost') console.log(`   Network: http://${ip}:${PORT}`);
  console.log(`   Health:  http://localhost:${PORT}/health`);
  console.log(`   Test:    join code ${TEST_GAME_CODE} (solo play OK)\n`);
});
