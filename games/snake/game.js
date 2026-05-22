import { Game } from '../../js/core/game.js';
import { Input } from '../../js/core/input.js';

const GRID = 20;
const TICK = 0.12;
const COLORS = {
  bg: '#0a0f0a',
  grid: '#1a2a1a',
  snake: '#3fb950',
  head: '#58d68d',
  food: '#f85149',
};

const DIRECTIONS = {
  ArrowUp: { x: 0, y: -1 },
  KeyW: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  KeyS: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  KeyA: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  KeyD: { x: 1, y: 0 },
};

export function createSnakeGame(canvas, { onScore, onGameOver, onRestart }) {
  const input = new Input();
  input.attach();

  let snake = [];
  let direction = { x: 1, y: 0 };
  let nextDirection = { x: 1, y: 0 };
  let food = { x: 0, y: 0 };
  let score = 0;
  let tickAccumulator = 0;
  let gameOver = false;

  function reset() {
    const mid = Math.floor(GRID / 2);
    snake = [
      { x: mid - 1, y: mid },
      { x: mid, y: mid },
      { x: mid + 1, y: mid },
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    tickAccumulator = 0;
    gameOver = false;
    spawnFood();
    onScore?.(score);
    hideOverlay();
  }

  function spawnFood() {
    const occupied = new Set(snake.map((s) => `${s.x},${s.y}`));
    let attempts = 0;
    do {
      food = {
        x: Math.floor(Math.random() * GRID),
        y: Math.floor(Math.random() * GRID),
      };
      attempts++;
    } while (occupied.has(`${food.x},${food.y}`) && attempts < 200);
  }

  function showOverlay(title, message) {
    const overlay = document.getElementById('overlay');
    if (!overlay) return;
    overlay.querySelector('h2').textContent = title;
    overlay.querySelector('p').textContent = message;
    overlay.classList.add('visible');
  }

  function hideOverlay() {
    document.getElementById('overlay')?.classList.remove('visible');
  }

  function handleInput() {
    if (input.isDown('Space') || input.isDown('Enter')) {
      if (gameOver) {
        reset();
        onRestart?.();
      }
      return;
    }

    for (const code of Object.keys(DIRECTIONS)) {
      if (!input.isDown(code)) continue;
      const dir = DIRECTIONS[code];
      if (dir.x === -direction.x && dir.y === -direction.y) continue;
      nextDirection = dir;
      break;
    }
  }

  function step() {
    direction = nextDirection;
    const head = snake[snake.length - 1];
    const newHead = {
      x: head.x + direction.x,
      y: head.y + direction.y,
    };

    if (
      newHead.x < 0 ||
      newHead.x >= GRID ||
      newHead.y < 0 ||
      newHead.y >= GRID
    ) {
      endGame();
      return;
    }

    if (snake.some((s) => s.x === newHead.x && s.y === newHead.y)) {
      endGame();
      return;
    }

    snake.push(newHead);

    if (newHead.x === food.x && newHead.y === food.y) {
      score += 10;
      onScore?.(score);
      spawnFood();
    } else {
      snake.shift();
    }
  }

  function endGame() {
    gameOver = true;
    showOverlay('Game Over', `Score: ${score} — Press Space or Enter to restart`);
    onGameOver?.(score);
  }

  function render(ctx) {
    const cell = 32;

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, GRID * cell, GRID * cell);

    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cell, 0);
      ctx.lineTo(i * cell, GRID * cell);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cell);
      ctx.lineTo(GRID * cell, i * cell);
      ctx.stroke();
    }

    ctx.fillStyle = COLORS.food;
    ctx.fillRect(food.x * cell + 2, food.y * cell + 2, cell - 4, cell - 4);

    snake.forEach((segment, i) => {
      ctx.fillStyle = i === snake.length - 1 ? COLORS.head : COLORS.snake;
      ctx.fillRect(
        segment.x * cell + 1,
        segment.y * cell + 1,
        cell - 2,
        cell - 2
      );
    });
  }

  const game = new Game(canvas, {
    width: GRID * 32,
    height: GRID * 32,
    update(dt) {
      handleInput();
      if (gameOver) return;

      tickAccumulator += dt;
      while (tickAccumulator >= TICK) {
        tickAccumulator -= TICK;
        step();
        if (gameOver) break;
      }
    },
    render,
  });

  reset();
  game.start();

  return {
    destroy() {
      game.stop();
      input.detach();
    },
  };
}
