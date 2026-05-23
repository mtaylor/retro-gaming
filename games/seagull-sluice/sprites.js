import { resolveAsset } from './assets-path.js';

export const DIRECTIONS = [
  'south',
  'south-east',
  'east',
  'north-east',
  'north',
  'north-west',
  'west',
  'south-west',
];

const DIRECTION_ANGLES = DIRECTIONS.map((dir, i) => ({
  dir,
  angle: (i * Math.PI) / 4,
}));

function isVisible(r, g, b, a) {
  return a > 24 && !(r < 28 && g < 28 && b < 28);
}

export function measureBounds(imageData, w, h) {
  const p = imageData.data;
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (isVisible(p[i], p[i + 1], p[i + 2], p[i + 3])) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (minX > maxX) return { x: 0, y: 0, w, h };
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

function trimImage(img) {
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, c.width, c.height);
  const p = data.data;
  for (let i = 0; i < p.length; i += 4) {
    if (p[i] < 28 && p[i + 1] < 28 && p[i + 2] < 28) p[i + 3] = 0;
  }
  ctx.putImageData(data, 0, 0);
  const bounds = measureBounds(data, c.width, c.height);
  const out = document.createElement('canvas');
  out.width = bounds.w;
  out.height = bounds.h;
  const octx = out.getContext('2d');
  octx.imageSmoothingEnabled = false;
  octx.drawImage(c, bounds.x, bounds.y, bounds.w, bounds.h, 0, 0, bounds.w, bounds.h);
  return { canvas: out, bounds };
}

async function loadFrame(folder, dir) {
  const img = new Image();
  img.src = resolveAsset(`assets/${folder}/${dir}.png`);
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
  });
  return trimImage(img);
}

export async function loadSpriteSet(folder) {
  const frames = {};
  let maxH = 0;
  for (const dir of DIRECTIONS) {
    const { canvas, bounds } = await loadFrame(folder, dir);
    frames[dir] = canvas;
    maxH = Math.max(maxH, bounds.h);
  }
  return { frames, height: maxH };
}

export function directionFromVelocity(dx, dy, fallback = 'south') {
  if (Math.abs(dx) < 0.02 && Math.abs(dy) < 0.02) return fallback;
  const angle = Math.atan2(dx, dy);
  let best = fallback;
  let bestDiff = Math.PI * 2;
  for (const { dir, angle: dirAngle } of DIRECTION_ANGLES) {
    let diff = Math.abs(angle - dirAngle);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;
    if (diff < bestDiff) {
      bestDiff = diff;
      best = dir;
    }
  }
  return best;
}

export function drawSprite(ctx, frame, x, y, scale, anchor = 'feet') {
  if (!frame) return;
  const w = frame.width * scale;
  const h = frame.height * scale;
  const ax = x - w / 2;
  const ay = anchor === 'feet' ? y - h : y - h / 2;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(frame, ax, ay, w, h);
}
