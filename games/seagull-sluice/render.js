import { TILE, TILE_SIZE, MAP_W, MAP_H, WORLD_W, WORLD_H } from './level.js';
import { drawSprite } from './sprites.js';

const PAL = {
  sea: '#3d6d8a',
  seaHi: '#4a88a8',
  sand: '#e0d0a8',
  sandLo: '#c8b890',
  prom: '#d8c8a0',
  promLo: '#a89068',
  goal: '#58a8d8',
  goalHi: '#9ed4ff',
};

export function drawWorld(ctx, tiles, chipSpots, goalCenter, goalRadius, camera) {
  const viewW = camera.viewW;
  const viewH = camera.viewH;

  const skyGrad = ctx.createLinearGradient(0, 0, 0, viewH);
  skyGrad.addColorStop(0, '#68a0d8');
  skyGrad.addColorStop(0.45, '#b8d0e8');
  skyGrad.addColorStop(1, '#d8e8f4');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, viewW, viewH);

  ctx.save();
  ctx.translate(viewW / 2 - camera.x, viewH / 2 - camera.y);

  const startTx = Math.max(0, Math.floor((camera.x - viewW / 2) / TILE_SIZE) - 1);
  const endTx = Math.min(MAP_W, Math.ceil((camera.x + viewW / 2) / TILE_SIZE) + 1);
  const startTy = Math.max(0, Math.floor((camera.y - viewH / 2) / TILE_SIZE) - 1);
  const endTy = Math.min(MAP_H, Math.ceil((camera.y + viewH / 2) / TILE_SIZE) + 1);

  for (let ty = startTy; ty < endTy; ty++) {
    for (let tx = startTx; tx < endTx; tx++) {
      const t = tiles[ty][tx];
      const px = tx * TILE_SIZE;
      const py = ty * TILE_SIZE;
      if (t === TILE.SEA) {
        ctx.fillStyle = ((tx + ty) % 2 ? PAL.sea : PAL.seaHi);
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        continue;
      }
      if (t === TILE.SAND) {
        ctx.fillStyle = ((tx + ty) % 2 ? PAL.sand : PAL.sandLo);
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        continue;
      }
      ctx.fillStyle = ((tx + ty) % 2 ? PAL.prom : PAL.promLo);
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      if ((tx + ty) % 3 === 0) {
        ctx.fillStyle = 'rgba(136,112,80,0.35)';
        ctx.fillRect(px + 4, py + TILE_SIZE / 2 - 2, TILE_SIZE - 8, 3);
      }
    }
  }

  const pulse = 0.55 + Math.sin(performance.now() / 280) * 0.15;
  ctx.fillStyle = `rgba(88, 168, 216, ${pulse * 0.35})`;
  ctx.beginPath();
  ctx.arc(goalCenter.x, goalCenter.y, goalRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PAL.goalHi;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#f8f4ec';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CHIPPY', goalCenter.x, goalCenter.y + 4);

  for (const chip of chipSpots) {
    if (chip.eaten) continue;
    drawChipBag(ctx, chip.x, chip.y);
  }

  ctx.restore();
}

function drawChipBag(ctx, x, y) {
  ctx.fillStyle = '#e83850';
  ctx.fillRect(x - 10, y - 6, 20, 14);
  ctx.fillStyle = '#f0d050';
  ctx.fillRect(x - 8, y - 2, 16, 10);
  ctx.fillStyle = '#fff8e8';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('WB', x, y + 5);
}

export function drawChipBagSmall(ctx, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  drawChipBag(ctx, 0, 0);
  ctx.restore();
}

export function drawHud(ctx, w, sprites, state) {
  const pad = 12;
  if (sprites.boss) {
    drawSprite(ctx, sprites.boss.frames.south, pad + 36, pad + 28, 0.55, 'center');
  }
  ctx.fillStyle = 'rgba(20, 32, 48, 0.82)';
  ctx.fillRect(pad, pad, 168, 52);
  ctx.strokeStyle = '#7ec8ff';
  ctx.lineWidth = 2;
  ctx.strokeRect(pad, pad, 168, 52);
  ctx.fillStyle = '#e8f4ff';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('BOSS ORDERS:', pad + 8, pad + 18);
  ctx.fillStyle = '#ffd080';
  ctx.font = '10px monospace';
  ctx.fillText('Steal all chips!', pad + 8, pad + 36);

  const chipsX = w - pad - 120;
  ctx.fillStyle = 'rgba(20, 32, 48, 0.82)';
  ctx.fillRect(chipsX, pad, 120, 40);
  ctx.strokeStyle = '#ffd080';
  ctx.strokeRect(chipsX, pad, 120, 40);
  ctx.fillStyle = '#ffd080';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`CHIPS: ${state.chips}`, chipsX + 60, pad + 26);

  if (state.message) {
    ctx.fillStyle = 'rgba(20, 32, 48, 0.9)';
    const mw = Math.min(420, w - 40);
    ctx.fillRect(w / 2 - mw / 2, 56, mw, 28);
    ctx.fillStyle = '#9ed4ff';
    ctx.font = '11px monospace';
    ctx.fillText(state.message, w / 2, 75);
  }
}

export function drawEntities(ctx, camera, entities, sprites) {
  ctx.save();
  ctx.translate(camera.viewW / 2 - camera.x, camera.viewH / 2 - camera.y);

  const sorted = [...entities].sort((a, b) => a.y - b.y);
  for (const e of sorted) {
    if (e.type === 'seagull') {
      const frame = sprites.minion.frames[e.facing];
      drawSprite(ctx, frame, e.x, e.y, e.scale, 'feet');
      if (e.carryingChip) {
        drawChipBag(ctx, e.x + 8, e.y - 22);
      }
    } else if (e.type === 'player') {
      const frame = sprites.player.frames[e.facing];
      drawSprite(ctx, frame, e.x, e.y, e.scale, 'feet');
      if (e.invuln > 0 && Math.floor(e.invuln * 12) % 2 === 0) {
        ctx.globalAlpha = 0.55;
        drawSprite(ctx, frame, e.x, e.y, e.scale, 'feet');
        ctx.globalAlpha = 1;
      }
    }
  }
  ctx.restore();
}

export { WORLD_W, WORLD_H };
