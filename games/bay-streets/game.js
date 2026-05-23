import { Game } from '../../js/core/game.js';
import { Input } from '../../js/core/input.js';
import { loadFighterSprites } from './sprites.js';
import {
  createPlayer,
  createEnemy,
  setState,
  updateAnim,
  STATE,
} from './fighter.js';
import {
  STAGE_W,
  GROUND_Y,
  LANE_MIN,
  LANE_MAX,
  VIEW_W,
  VIEW_H,
  clampLane,
  sortByDepth,
  attackConnect,
  applyDamage,
} from './stage.js';
import { drawStage, drawEntities, drawHud, drawOverlay } from './render.js';

const MOVE_SPEED = 200;
const DEPTH_SPEED = 140;

export async function createBayStreetsGame(canvas, ui = {}) {
  const characterId = ui.character === 'eleanor' ? 'eleanor' : 'henry';
  const playerSprites = await loadFighterSprites(characterId);

  const input = new Input();
  input.attach();

  let player;
  let enemies = [];
  let cameraX = 0;
  let score = 0;
  let wave = 1;
  let lives = 3;
  let spawnTimer = 1.5;
  let gameOver = false;
  let scrollPhase = 0;
  let shake = 0;

  function reset() {
    player = createPlayer(180, GROUND_Y - 10, playerSprites, { hp: 100 });
    enemies = [];
    cameraX = 0;
    score = 0;
    wave = 1;
    lives = 3;
    spawnTimer = 1.2;
    gameOver = false;
    ui.onScore?.(score);
    ui.onLives?.(lives);
    ui.hideOverlay?.();
  }

  function spawnEnemy() {
    const side = Math.random() < 0.5 ? -1 : 1;
    const x = player.x + side * (VIEW_W * 0.55 + Math.random() * 120);
    const ex = Math.max(80, Math.min(STAGE_W - 80, x));
    const e = createEnemy(ex, clampLane(LANE_MIN + Math.random() * (LANE_MAX - LANE_MIN)), wave);
    e.facing = player.x < e.x ? -1 : 1;
    enemies.push(e);
  }

  function tryAttack(state) {
    if (player.state === STATE.PUNCH || player.state === STATE.KICK) return;
    if (player.state === STATE.HURT) return;
    setState(player, state);
  }

  function updatePlayer(dt) {
    let mx = 0;
    let my = 0;
    if (input.isDown('ArrowLeft') || input.isDown('KeyA')) mx -= 1;
    if (input.isDown('ArrowRight') || input.isDown('KeyD')) mx += 1;
    if (input.isDown('ArrowUp') || input.isDown('KeyW')) my -= 1;
    if (input.isDown('ArrowDown') || input.isDown('KeyS')) my += 1;

    if (player.attackCooldown > 0) player.attackCooldown -= dt;
    if (
      (input.isDown('KeyZ') || input.isDown('KeyJ')) &&
      player.attackCooldown <= 0
    ) {
      tryAttack(STATE.PUNCH);
      player.attackCooldown = 0.35;
    }
    if (
      (input.isDown('KeyX') || input.isDown('KeyK')) &&
      player.attackCooldown <= 0
    ) {
      tryAttack(STATE.KICK);
      player.attackCooldown = 0.4;
    }

    if (player.state === STATE.IDLE || player.state === STATE.WALK) {
      if (mx !== 0 || my !== 0) {
        setState(player, STATE.WALK);
        const len = Math.hypot(mx, my) || 1;
        player.x += (mx / len) * MOVE_SPEED * dt;
        player.y += (my / len) * DEPTH_SPEED * dt;
        player.y = clampLane(player.y);
        player.facing = mx >= 0 ? 1 : -1;
      } else {
        setState(player, STATE.IDLE);
      }
    }

    player.x = Math.max(60, Math.min(STAGE_W - 60, player.x));
    if (player.knockbackX !== 0) {
      player.x += player.knockbackX * dt;
      player.knockbackX *= 0.85;
      if (Math.abs(player.knockbackX) < 8) player.knockbackX = 0;
    }
    if (player.invuln > 0) player.invuln -= dt;
    updateAnim(player, dt);
  }

  function updateEnemies(dt) {
    spawnTimer -= dt;
    if (spawnTimer <= 0 && enemies.filter((e) => e.state !== STATE.DEAD).length < 4 + wave) {
      spawnEnemy();
      spawnTimer = Math.max(0.8, 2.2 - wave * 0.12);
    }

    for (const e of enemies) {
      if (e.state === STATE.DEAD) {
        e.stateTime += dt;
        continue;
      }

      e.aiTimer -= dt;
      const dx = player.x - e.x;
      const dy = player.y - e.y;

      if (e.state === STATE.IDLE || e.state === STATE.WALK) {
        if (Math.abs(dx) < 52 && Math.abs(dy) < 30 && e.aiTimer <= 0) {
          setState(e, Math.random() < 0.55 ? STATE.PUNCH : STATE.KICK);
          e.facing = dx >= 0 ? 1 : -1;
        } else {
          setState(e, STATE.WALK);
          const len = Math.hypot(dx, dy) || 1;
          e.x += (dx / len) * 70 * dt;
          e.y += (dy / len) * 50 * dt;
          e.y = clampLane(e.y);
          e.facing = dx >= 0 ? 1 : -1;
        }
      }

      if (e.knockbackX) {
        e.x += e.knockbackX * dt;
        e.knockbackX *= 0.88;
      }
      if (e.invuln > 0) e.invuln -= dt;
      updateAnim(e, dt);
    }

    enemies = enemies.filter((e) => e.state !== STATE.DEAD || e.stateTime < 2);
  }

  function resolveCombat() {
    if (player.attackHit) {
      for (const e of enemies) {
        if (attackConnect(player, e)) {
          applyDamage(e, player.attackHit.damage, player.x);
          score += 100;
          shake = 0.12;
          player.attackHit = null;
          player.combo += 1;
          player.comboTimer = 1.2;
          ui.onScore?.(score);
        }
      }
    }

    for (const e of enemies) {
      if (e.attackHit && attackConnect(e, player)) {
        applyDamage(player, e.attackHit.damage, e.x);
        e.attackHit = null;
        shake = 0.18;
        if (player.hp <= 0) {
          lives -= 1;
          ui.onLives?.(lives);
          if (lives <= 0) {
            gameOver = true;
            ui.showOverlay?.('GAME OVER', 'Space to retry');
          } else {
            player.hp = player.maxHp;
            player.x = Math.max(100, cameraX + 120);
            player.state = STATE.IDLE;
            player.invuln = 1.5;
          }
        }
      }
    }
  }

  function updateCamera(dt) {
    const target = Math.max(0, Math.min(STAGE_W - VIEW_W, player.x - VIEW_W * 0.38));
    cameraX += (target - cameraX) * Math.min(1, dt * 6);
    scrollPhase += dt * 40;
    if (shake > 0) shake -= dt;
  }

  function update(dt) {
    if (gameOver) {
      if (input.isDown('Space') || input.isDown('Enter')) reset();
      return;
    }

    updatePlayer(dt);
    updateEnemies(dt);
    resolveCombat();
    updateCamera(dt);

    if (score > wave * 800) {
      wave += 1;
      ui.onWave?.(wave);
    }
  }

  function render(ctx) {
    const cam = cameraX + (shake > 0 ? (Math.random() - 0.5) * 12 * shake : 0);
    drawStage(ctx, cam, scrollPhase);
    const all = sortByDepth([player, ...enemies]);
    drawEntities(ctx, cam, all, playerSprites);
    drawHud(ctx, player, score, wave, lives);
    if (gameOver) drawOverlay(ctx, 'GAME OVER', 'Press Space');
  }

  reset();

  const game = new Game(canvas, {
    update,
    render,
    width: VIEW_W,
    height: VIEW_H,
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
