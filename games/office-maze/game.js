import { Game } from '../../js/core/game.js';
import { Input } from '../../js/core/input.js';
import { asset } from '../../js/core/config.js';
import {
  TILE,
  LEVEL,
  parseLevel,
  CUSTOMER_ROUTES,
  buildPatrolPath,
  validateLevelCompletable,
} from './maze.js';
import {
  C,
  setupSnesContext,
  drawFloor,
  drawDesk,
  drawMeeting,
  drawPlant,
  drawCoffee,
  drawLaptop,
  drawPrinter,
  drawFika,
  drawWindowStrip,
  drawCharacter,
  drawHudBanner,
} from './graphics.js';

const CELL = 32;
const MOVE_COOLDOWN = 0.13;
const CUSTOMER_STEP = 0.22;
const BUMP_STUN = 1.5;
const HUD_H = 44;

const DIRECTIONS = {
  ArrowUp: { x: 0, y: -1, face: 'up' },
  KeyW: { x: 0, y: -1, face: 'up' },
  ArrowDown: { x: 0, y: 1, face: 'down' },
  KeyS: { x: 0, y: 1, face: 'down' },
  ArrowLeft: { x: -1, y: 0, face: 'left' },
  KeyA: { x: -1, y: 0, face: 'left' },
  ArrowRight: { x: 1, y: 0, face: 'right' },
  KeyD: { x: 1, y: 0, face: 'right' },
};

function cloneGrid(grid) {
  return grid.map((row) => row.slice());
}

function isBlocking(tile) {
  return tile === TILE.WALL || tile === TILE.COFFEE || tile === TILE.PRINTER;
}

function facingFromDelta(dx, dy) {
  if (dy < 0) return 'up';
  if (dy > 0) return 'down';
  if (dx < 0) return 'left';
  if (dx > 0) return 'right';
  return 'down';
}

export function createOfficeMazeGame(canvas, callbacks = {}) {
  const { onScore, onMessage, onWin, onLives } = callbacks;
  const input = new Input();
  input.attach();

  const level = parseLevel(LEVEL);
  const levelCheck = validateLevelCompletable(
    level.grid,
    level.start,
    level.exit
  );
  if (!levelCheck.ok) {
    console.error('Maze validation failed:', levelCheck.errors);
  }

  let grid = cloneGrid(level.grid);
  let player = { x: level.start.x, y: level.start.y, facing: 'down' };
  let score = 0;
  let lives = 3;
  let moveCooldown = 0;
  let stunned = 0;
  let won = false;
  let message = '';
  let messageTimer = 0;
  let logoImage = null;

  const logoImg = new Image();
  logoImg.src = asset('games/office-maze/assets/cambio-logo.svg');
  logoImg.onload = () => {
    logoImage = logoImg;
  };

  const patrolPaths = CUSTOMER_ROUTES.map((waypoints) =>
    buildPatrolPath(level.grid, waypoints)
  );

  const customers = patrolPaths.map((path, i) => ({
    path,
    pathIndex: 0,
    x: path[0]?.x ?? 1,
    y: path[0]?.y ?? 1,
    facing: 'down',
    stepTimer: 0,
    stepDelay: CUSTOMER_STEP + i * 0.04,
    wait: i * 0.9,
  }));

  function setMessage(text, duration = 2) {
    message = text;
    messageTimer = duration;
    onMessage?.(text);
  }

  function reset() {
    grid = cloneGrid(level.grid);
    player = { x: level.start.x, y: level.start.y, facing: 'down' };
    score = 0;
    lives = 3;
    moveCooldown = 0;
    stunned = 0;
    won = false;
    message = '';
    messageTimer = 0;
    customers.forEach((c, i) => {
      c.pathIndex = 0;
      c.x = c.path[0]?.x ?? 1;
      c.y = c.path[0]?.y ?? 1;
      c.facing = 'down';
      c.stepTimer = 0;
      c.wait = i * 0.9;
    });
    onScore?.(score);
    onLives?.(lives);
    hideOverlay();
  }

  function showOverlay(title, body) {
    const overlay = document.getElementById('overlay');
    if (!overlay) return;
    overlay.querySelector('h2').textContent = title;
    overlay.querySelector('p').textContent = body;
    overlay.classList.add('visible');
  }

  function hideOverlay() {
    document.getElementById('overlay')?.classList.remove('visible');
  }

  function getFacing() {
    for (const code of Object.keys(DIRECTIONS)) {
      if (input.isDown(code)) return DIRECTIONS[code];
    }
    return null;
  }

  function tryMove(dx, dy, face) {
    const nx = player.x + dx;
    const ny = player.y + dy;
    if (nx < 0 || ny < 0 || nx >= level.width || ny >= level.height) return;
    const tile = grid[ny][nx];
    if (isBlocking(tile)) {
      if (tile === TILE.COFFEE) setMessage('Spilled coffee! Press E to mop.');
      if (tile === TILE.PRINTER) setMessage('Printer jam! Press E to fix.');
      return;
    }
    player.x = nx;
    player.y = ny;
    player.facing = face;

    if (nx === level.exit.x && ny === level.exit.y) {
      won = true;
      score += 200;
      onScore?.(score);
      showOverlay('Fika!', `You made it! Score: ${score}. Space to play again.`);
      onWin?.(score);
    }
  }

  function interact() {
    const dirs = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ];
    for (const d of dirs) {
      const tx = player.x + d.x;
      const ty = player.y + d.y;
      if (tx < 0 || ty < 0 || tx >= level.width || ty >= level.height) continue;
      const tile = grid[ty][tx];
      if (tile === TILE.COFFEE) {
        grid[ty][tx] = TILE.FLOOR;
        score += 25;
        setMessage('Coffee mopped! +25');
        onScore?.(score);
        return;
      }
      if (tile === TILE.PRINTER) {
        grid[ty][tx] = TILE.FLOOR;
        score += 30;
        setMessage('Printer fixed! +30');
        onScore?.(score);
        return;
      }
      if (tile === TILE.LAPTOP) {
        grid[ty][tx] = TILE.FLOOR;
        score += 50;
        setMessage('Laptop closed! +50');
        onScore?.(score);
        return;
      }
    }
    setMessage('Nothing to fix nearby (E)');
  }

  function advanceCustomer(c) {
    if (c.path.length < 2) return;

    const prev = { x: c.x, y: c.y };
    c.pathIndex = (c.pathIndex + 1) % c.path.length;
    const next = c.path[c.pathIndex];
    c.x = next.x;
    c.y = next.y;
    c.facing = facingFromDelta(next.x - prev.x, next.y - prev.y);
  }

  function updateCustomers(dt) {
    for (const c of customers) {
      if (c.wait > 0) {
        c.wait -= dt;
        continue;
      }

      c.stepTimer += dt;
      while (c.stepTimer >= c.stepDelay) {
        c.stepTimer -= c.stepDelay;
        advanceCustomer(c);

        if (c.x === player.x && c.y === player.y && stunned <= 0) {
          stunned = BUMP_STUN;
          lives -= 1;
          onLives?.(lives);
          setMessage('Customer collision! Mind the hallway.');
          if (lives <= 0) {
            showOverlay('Busy day!', `Score: ${score}. Space to retry.`);
          }
        }
      }
    }
  }

  function handleInput(dt) {
    if (input.isDown('Space') || input.isDown('Enter')) {
      if (won || lives <= 0) {
        reset();
        return;
      }
    }

    if (won || lives <= 0) return;

    if (input.isDown('KeyE')) {
      if (!handleInput.interactLock) {
        interact();
        handleInput.interactLock = true;
      }
    } else {
      handleInput.interactLock = false;
    }

    if (stunned > 0) return;

    moveCooldown -= dt;
    if (moveCooldown > 0) return;

    const face = getFacing();
    if (face) {
      tryMove(face.x, face.y, face.face);
      moveCooldown = MOVE_COOLDOWN;
    }
  }
  handleInput.interactLock = false;

  function drawTile(ctx, x, y, tile) {
    const px0 = x * CELL;
    const py0 = y * CELL;
    const checker = (x + y) % 2 === 0;
    const onEdge =
      y === 0 || y === level.height - 1 || x === 0 || x === level.width - 1;

    switch (tile) {
      case TILE.WALL:
        drawDesk(ctx, px0, py0, CELL);
        break;
      case TILE.MEETING:
        drawMeeting(ctx, px0, py0, CELL);
        break;
      case TILE.PLANT:
        drawPlant(ctx, px0, py0, CELL);
        break;
      case TILE.COFFEE:
        drawCoffee(ctx, px0, py0, CELL);
        break;
      case TILE.LAPTOP:
        drawLaptop(ctx, px0, py0, CELL);
        break;
      case TILE.PRINTER:
        drawPrinter(ctx, px0, py0, CELL);
        break;
      case TILE.FLOOR:
      default:
        if (x === level.exit.x && y === level.exit.y) {
          drawFika(ctx, px0, py0, CELL);
        } else {
          drawFloor(ctx, px0, py0, CELL, checker);
        }
        break;
    }

    if (onEdge) {
      drawWindowStrip(ctx, px0, py0, CELL);
    }
  }

  function render(ctx) {
    setupSnesContext(ctx);
    const w = level.width * CELL;
    const h = level.height * CELL;

    ctx.fillStyle = C.outline;
    ctx.fillRect(0, 0, w, h + HUD_H + 28);

    drawHudBanner(ctx, w, 'CAMBIO STOCKHOLM  ·  Sveavägen 44');

    ctx.save();
    ctx.translate(0, HUD_H);

    for (let y = 0; y < level.height; y++) {
      for (let x = 0; x < level.width; x++) {
        drawTile(ctx, x, y, grid[y][x]);
      }
    }

    for (const c of customers) {
      drawCharacter(
        ctx,
        c.x * CELL + CELL / 2,
        c.y * CELL + CELL / 2,
        24,
        'customer',
        c.facing
      );
    }

    drawCharacter(
      ctx,
      player.x * CELL + CELL / 2,
      player.y * CELL + CELL / 2,
      24,
      'player',
      player.facing
    );

    if (stunned > 0) {
      ctx.fillStyle = 'rgba(186, 0, 32, 0.35)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = C.fikaHi;
      ctx.font = 'bold 16px monospace';
      ctx.fillText('CUSTOMER!', w / 2 - 52, h / 2);
    }

    ctx.restore();

    if (logoImage?.complete) {
      const lw = 110;
      const lh = (logoImage.height / logoImage.width) * lw;
      ctx.drawImage(logoImage, w - lw - 6, 6, lw, lh);
    }

    if (messageTimer > 0) {
      px(ctx, 6, h + HUD_H + 4, w - 12, 22, C.outline);
      px(ctx, 8, h + HUD_H + 6, w - 16, 18, '#384860');
      ctx.fillStyle = C.shirt;
      ctx.font = '11px monospace';
      ctx.fillText(message, 14, h + HUD_H + 20);
    }
  }

  function px(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  const logicalW = level.width * CELL;
  const logicalH = level.height * CELL + HUD_H + 28;

  const game = new Game(canvas, {
    width: logicalW,
    height: logicalH,
    update(dt) {
      if (messageTimer > 0) messageTimer -= dt;
      if (stunned > 0) stunned -= dt;
      handleInput(dt);
      if (!won && lives > 0) updateCustomers(dt);
    },
    render,
  });

  reset();
  setMessage(
    levelCheck.ok
      ? 'Reach FIKA! Mop coffee, close laptops, dodge customers.'
      : 'Warning: maze may be unsolvable — check level layout.'
  );
  game.start();

  return {
    destroy() {
      game.stop();
      input.detach();
    },
  };
}
