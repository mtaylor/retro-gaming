import { STAGE_W, GROUND_Y, VIEW_W, VIEW_H, depthScale } from './stage.js';
import { drawFighterFrame } from './sprites.js';
import { getFrame } from './fighter.js';
import { STATE } from './fighter.js';

export function drawStage(ctx, cameraX, scrollPhase) {
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y - 80);
  sky.addColorStop(0, '#1a2848');
  sky.addColorStop(0.5, '#3a5888');
  sky.addColorStop(1, '#88b8d8');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  const parallax = (cameraX * 0.35 + scrollPhase) % (STAGE_W * 0.5);

  ctx.save();
  ctx.translate(-cameraX * 0.2 - parallax * 0.3, 0);
  drawBuildings(ctx, 0, true);
  ctx.restore();

  ctx.save();
  ctx.translate(-cameraX * 0.5 - parallax * 0.6, 0);
  drawBuildings(ctx, 400, false);
  ctx.restore();

  ctx.fillStyle = '#5a5048';
  ctx.fillRect(0, GROUND_Y + 20, VIEW_W, VIEW_H - GROUND_Y);

  ctx.fillStyle = '#d8c8a0';
  ctx.fillRect(0, GROUND_Y, VIEW_W + 200, 28);
  ctx.fillStyle = '#a89068';
  for (let x = -((cameraX | 0) % 48); x < VIEW_W + 48; x += 48) {
    ctx.fillRect(x, GROUND_Y + 8, 24, 4);
  }

  ctx.fillStyle = '#4098b8';
  ctx.fillRect(0, GROUND_Y + 48, VIEW_W, 80);
}

function drawBuildings(ctx, offset, far) {
  const baseY = far ? 120 : 80;
  const h = far ? 200 : 260;
  for (let i = 0; i < 8; i++) {
    const x = offset + i * 280;
    ctx.fillStyle = far ? '#2e3e58' : '#e8e4dc';
    ctx.fillRect(x, baseY + 40, 200, h);
    ctx.fillStyle = far ? '#4a6088' : '#88c8f0';
    for (let w = 0; w < 4; w++) {
      ctx.fillRect(x + 20 + w * 42, baseY + 70, 28, 36);
    }
    if (!far && i % 2 === 0) {
      ctx.fillStyle = '#f0e8d8';
      ctx.beginPath();
      ctx.ellipse(x + 100, baseY + 20, 50, 28, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawEnemyPlaceholder(ctx, e, cameraX) {
  const s = depthScale(e.y) * 1.1;
  const x = e.x - cameraX;
  const y = e.y;
  ctx.fillStyle = e.color || '#804040';
  ctx.fillRect(x - 14 * s, y - 44 * s, 28 * s, 44 * s);
  ctx.fillStyle = '#282838';
  ctx.fillRect(x - 10 * s, y - 52 * s, 20 * s, 12 * s);
  if (e.state === STATE.PUNCH) {
    ctx.fillStyle = '#ffd080';
    ctx.fillRect(x + e.facing * 22 * s, y - 30 * s, 16 * s, 8 * s);
  }
}

export function drawEntities(ctx, cameraX, entities, playerSprites) {
  for (const e of entities) {
    const x = e.x - cameraX;
    const scale = (e.sprites?.scale ?? 1) * depthScale(e.y);
    const foot = e.sprites?.foot ?? 48;

    if (e.team === 'enemy' && !e.sprites) {
      drawEnemyPlaceholder(ctx, e, cameraX);
      continue;
    }

    const frame = getFrame(e.sprites || playerSprites, e.state, e.facing);
    const flash = e.invuln > 0 && Math.floor(e.invuln * 20) % 2 === 0;
    if (flash) ctx.globalAlpha = 0.5;
    drawFighterFrame(ctx, frame, x, e.y, e.facing, scale, foot, false);
    if (flash) ctx.globalAlpha = 1;

    if (e.hp < e.maxHp && e.state !== STATE.DEAD) {
      const bw = 36;
      ctx.fillStyle = '#281818';
      ctx.fillRect(x - bw / 2, e.y - 58 * scale, bw, 5);
      ctx.fillStyle = '#e03048';
      ctx.fillRect(x - bw / 2, e.y - 58 * scale, bw * (e.hp / e.maxHp), 5);
    }
  }
}

export function drawHud(ctx, player, score, wave, lives) {
  ctx.fillStyle = 'rgba(20, 32, 48, 0.85)';
  ctx.fillRect(12, 12, 200, 56);
  ctx.strokeStyle = '#7ec8ff';
  ctx.lineWidth = 2;
  ctx.strokeRect(12, 12, 200, 56);
  ctx.fillStyle = '#e8f4ff';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('BAY STREETS', 22, 32);
  ctx.fillStyle = '#ffd080';
  ctx.font = '12px monospace';
  ctx.fillText(`SCORE ${score}`, 22, 50);
  ctx.fillText(`WAVE ${wave}`, 22, 64);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#ff6868';
  for (let i = 0; i < lives; i++) {
    ctx.fillText('♥', VIEW_W - 20 - i * 22, 36);
  }

  const hpW = 180;
  ctx.fillStyle = '#281818';
  ctx.fillRect(22, 72, hpW, 10);
  ctx.fillStyle = '#3fb950';
  ctx.fillRect(22, 72, hpW * (player.hp / player.maxHp), 10);
}

export function drawOverlay(ctx, title, sub) {
  ctx.fillStyle = 'rgba(12, 20, 32, 0.75)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#9ed4ff';
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(title, VIEW_W / 2, VIEW_H / 2 - 12);
  ctx.fillStyle = '#a8b8c8';
  ctx.font = '14px monospace';
  ctx.fillText(sub, VIEW_W / 2, VIEW_H / 2 + 20);
}
