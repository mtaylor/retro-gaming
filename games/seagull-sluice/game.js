import { Game } from '../../js/core/game.js';
import { Input } from '../../js/core/input.js';
import {
  buildMap,
  collidesCircleTiles,
  TILE_SIZE,
  WORLD_W,
  WORLD_H,
} from './level.js';
import { loadSpriteSet, directionFromVelocity } from './sprites.js';
import { drawWorld, drawEntities, drawHud } from './render.js';

const PLAYER_SPEED = 145;
const SEAGULL_SPEED = 92;
const PLAYER_RADIUS = 14;
const SEAGULL_RADIUS = 16;
const STEAL_COOLDOWN = 1.1;
const INVULN_TIME = 1.4;
const MAX_SEAGULLS = 6;
const SPAWN_INTERVAL = 4.5;

export async function createSeagullSluiceGame(canvas, ui = {}) {
  const [henry, eleanor, minion, boss] = await Promise.all([
    loadSpriteSet('henry'),
    loadSpriteSet('eleanor'),
    loadSpriteSet('seagull-minion'),
    loadSpriteSet('seagull-boss'),
  ]);

  const characterId = ui.character === 'eleanor' ? 'eleanor' : 'henry';
  const playerSprites = characterId === 'eleanor' ? eleanor : henry;
  const playerScale = 1.15 / (playerSprites.height / 128);

  const sprites = {
    player: playerSprites,
    minion,
    boss,
    playerScale,
    minionScale: 0.95 / (minion.height / 128),
  };

  const input = new Input();
  input.attach();

  const map = buildMap();
  let player;
  let seagulls = [];
  let chips = 5;
  let chipsOnMap;
  let spawnTimer = 2;
  let gameOver = false;
  let won = false;
  let message = '';
  let messageTimer = 0;
  const camera = { x: 0, y: 0, viewW: 960, viewH: 600 };

  function reset() {
    const start = { ...map.playerStart };
    player = {
      type: 'player',
      x: start.x,
      y: start.y,
      vx: 0,
      vy: 0,
      facing: 'south',
      scale: playerScale,
      invuln: 0,
      stealCooldown: 0,
    };
    seagulls = [];
    chips = 5 + map.chipSpots.length;
    chipsOnMap = map.chipSpots.map((c) => ({ ...c, eaten: false }));
    spawnTimer = 2;
    gameOver = false;
    won = false;
    message = 'Get to the chippy — protect your chips!';
    messageTimer = 4;
    camera.x = player.x;
    camera.y = player.y;
    ui.onChips?.(chips);
    ui.hideOverlay?.();
  }

  function spawnSeagull() {
    if (seagulls.length >= MAX_SEAGULLS) return;
    const edges = [
      { x: TILE_SIZE, y: Math.random() * WORLD_H },
      { x: WORLD_W - TILE_SIZE, y: Math.random() * WORLD_H },
      { x: Math.random() * WORLD_W, y: TILE_SIZE * 2 },
    ];
    const e = edges[Math.floor(Math.random() * edges.length)];
    seagulls.push({
      type: 'seagull',
      x: e.x,
      y: e.y,
      vx: 0,
      vy: 0,
      facing: 'south',
      scale: sprites.minionScale,
      stealCooldown: 0.5 + Math.random(),
      carryingChip: false,
    });
  }

  function tryMove(entity, dx, dy, speed, dt) {
    const len = Math.hypot(dx, dy);
    if (len < 0.01) {
      entity.vx = 0;
      entity.vy = 0;
      return;
    }
    const nx = (dx / len) * speed * dt;
    const ny = (dy / len) * speed * dt;
    let nextX = entity.x + nx;
    let nextY = entity.y + ny;
    const r = entity.type === 'player' ? PLAYER_RADIUS : SEAGULL_RADIUS;
    if (!collidesCircleTiles(map.tiles, nextX, entity.y, r)) entity.x = nextX;
    if (!collidesCircleTiles(map.tiles, entity.x, nextY, r)) entity.y = nextY;
    entity.vx = dx / len;
    entity.vy = dy / len;
    entity.facing = directionFromVelocity(entity.vx, entity.vy, entity.facing);
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function updatePlayer(dt) {
    let dx = 0;
    let dy = 0;
    if (input.isDown('ArrowLeft') || input.isDown('KeyA')) dx -= 1;
    if (input.isDown('ArrowRight') || input.isDown('KeyD')) dx += 1;
    if (input.isDown('ArrowUp') || input.isDown('KeyW')) dy -= 1;
    if (input.isDown('ArrowDown') || input.isDown('KeyS')) dy += 1;
    tryMove(player, dx, dy, PLAYER_SPEED, dt);
    if (player.invuln > 0) player.invuln -= dt;
    if (player.stealCooldown > 0) player.stealCooldown -= dt;

    if (dist(player, map.goalCenter) < map.goalRadius) {
      if (chips > 0) {
        won = true;
        gameOver = true;
        message = 'You made it to the chippy with your chips!';
        ui.showOverlay?.('Victory!', 'Press Space to play again.');
      } else {
        message = 'No chips left — grab bags on the prom first!';
        messageTimer = 2;
      }
    }
  }

  function updateSeagulls(dt) {
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnSeagull();
      spawnTimer = SPAWN_INTERVAL * (0.7 + Math.random() * 0.5);
    }

    for (const g of seagulls) {
      let target = null;
      let best = Infinity;

      if (!g.carryingChip) {
        for (const chip of chipsOnMap) {
          if (chip.eaten) continue;
          const d = dist(g, chip);
          if (d < best) {
            best = d;
            target = chip;
          }
        }
      }

      const dPlayer = dist(g, player);
      if (dPlayer < best * 0.85 || g.carryingChip) target = player;

      if (target) {
        const dx = target.x - g.x;
        const dy = target.y - g.y;
        tryMove(g, dx, dy, SEAGULL_SPEED * (g.carryingChip ? 1.08 : 1), dt);
      }

      if (g.stealCooldown > 0) g.stealCooldown -= dt;

      if (!g.carryingChip && g.stealCooldown <= 0) {
        for (const chip of chipsOnMap) {
          if (chip.eaten) continue;
          if (dist(g, chip) < SEAGULL_RADIUS + 12) {
            chip.eaten = true;
            g.carryingChip = true;
            g.stealCooldown = STEAL_COOLDOWN;
            chips = Math.max(0, chips - 1);
            ui.onChips?.(chips);
            message = 'A minion stole a chip bag!';
            messageTimer = 2.5;
            if (chips <= 0) {
              gameOver = true;
              message = 'All chips stolen — the boss wins!';
              ui.showOverlay?.('Game Over', 'Press Space to try again.');
            }
            break;
          }
        }
      }

      if (
        g.stealCooldown <= 0 &&
        player.invuln <= 0 &&
        dist(g, player) < PLAYER_RADIUS + SEAGULL_RADIUS
      ) {
        if (chips > 0) {
          chips -= 1;
          ui.onChips?.(chips);
          player.invuln = INVULN_TIME;
          player.stealCooldown = 0.5;
          g.stealCooldown = STEAL_COOLDOWN;
          g.carryingChip = true;
          message = 'Seagull nabbed a chip from you!';
          messageTimer = 2;
          if (chips <= 0) {
            gameOver = true;
            message = 'Out of chips — Whitely Bay goes hungry!';
            ui.showOverlay?.('Game Over', 'Press Space to try again.');
          }
        }
      }

      if (g.carryingChip && g.stealCooldown > STEAL_COOLDOWN * 0.6) {
        g.carryingChip = false;
      }
    }
  }

  function updateCamera(dt) {
    const t = 1 - Math.exp(-8 * dt);
    camera.x += (player.x - camera.x) * t;
    camera.y += (player.y - camera.y) * t;
    camera.x = Math.max(camera.viewW / 2, Math.min(WORLD_W - camera.viewW / 2, camera.x));
    camera.y = Math.max(camera.viewH / 2, Math.min(WORLD_H - camera.viewH / 2, camera.y));
  }

  function update(dt) {
    if (gameOver) {
      if (input.isDown('Space') || input.isDown('Enter')) reset();
      return;
    }

    updatePlayer(dt);
    updateSeagulls(dt);
    updateCamera(dt);
    if (messageTimer > 0) messageTimer -= dt;
  }

  function render(ctx) {
    drawWorld(ctx, map.tiles, chipsOnMap, map.goalCenter, map.goalRadius, camera);
    drawEntities(ctx, camera, [player, ...seagulls], sprites);
    drawHud(ctx, camera.viewW, sprites, {
      chips,
      message: messageTimer > 0 ? message : '',
    });
  }

  reset();

  const game = new Game(canvas, {
    update,
    render,
    width: camera.viewW,
    height: camera.viewH,
  });

  return {
    start: () => game.start(),
    stop: () => {
      game.stop();
      input.detach();
    },
    reset,
  };
}
