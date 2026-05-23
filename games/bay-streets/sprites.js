import { resolveAsset } from './assets-path.js';

const cache = new Map();

function keyBlack(imageData) {
  const p = imageData.data;
  for (let i = 0; i < p.length; i += 4) {
    if (p[i] < 28 && p[i + 1] < 28 && p[i + 2] < 28) p[i + 3] = 0;
  }
}

function trim(img) {
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, c.width, c.height);
  keyBlack(data);
  ctx.putImageData(data, 0, 0);
  let minX = c.width;
  let minY = c.height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      const i = (y * c.width + x) * 4;
      if (data.data[i + 3] > 24) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (minX > maxX) return { canvas: c, foot: c.height - 1 };
  const out = document.createElement('canvas');
  out.width = maxX - minX + 1;
  out.height = maxY - minY + 1;
  const o = out.getContext('2d');
  o.imageSmoothingEnabled = false;
  o.drawImage(c, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
  return { canvas: out, foot: maxY - minY };
}

async function loadPng(folder, name) {
  const k = `${folder}/${name}`;
  if (cache.has(k)) return cache.get(k);
  const img = new Image();
  img.src = resolveAsset(`assets/${folder}/${name}.png`);
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = () => res();
  });
  if (!img.width) return null;
  const t = trim(img);
  cache.set(k, t);
  return t;
}

/** Placeholder set from 8-way rotation packs until side-view sheets arrive */
export async function loadFighterSprites(folder) {
  const [east, west, south, se, ne] = await Promise.all([
    loadPng(folder, 'east'),
    loadPng(folder, 'west'),
    loadPng(folder, 'south'),
    loadPng(folder, 'south-east'),
    loadPng(folder, 'north-east'),
  ]);
  const base = east || south || west;
  const h = base?.canvas.height ?? 64;
  const scale = 1.35 / (h / 64);
  return {
    idle: { right: south?.canvas || east?.canvas, left: south?.canvas || west?.canvas },
    walk: { right: east?.canvas, left: west?.canvas },
    punch: { right: se?.canvas || east?.canvas, left: se?.canvas || west?.canvas },
    kick: { right: ne?.canvas || east?.canvas, left: ne?.canvas || west?.canvas },
    hurt: { right: south?.canvas, left: south?.canvas },
    foot: base?.foot ?? h - 4,
    scale,
  };
}

export function drawFighterFrame(ctx, frame, x, y, facing, scale, footOffset, flip = false) {
  if (!frame) return;
  const w = frame.width * scale;
  const h = frame.height * scale;
  const fx = facing < 0 ? -1 : 1;
  ctx.save();
  ctx.translate(x, y);
  if (flip || facing < 0) ctx.scale(-1, 1);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(frame, -w / 2, -h + footOffset * scale, w, h);
  ctx.restore();
}
