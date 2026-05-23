import * as THREE from 'three';

export const PAL = {
  skyHi: '#88b8e8',
  skyLo: '#b8d0e8',
  seaHi: '#4098b8',
  promHi: '#d8c8a0',
  promLo: '#a89068',
  sand: '#e8d8b0',
  white: '#ffffff',
  cream: '#faf8f2',
  creamSh: '#e8e4dc',
  domeHi: '#ffffff',
  domeSh: '#e0dcd4',
  red: '#e03048',
  blue: '#4888c8',
  yellow: '#f0d050',
  chipGold: '#e8c040',
  skin: '#f0b890',
  skinSh: '#d89868',
  hair: '#483028',
  jacket: '#3868b0',
  jacketHi: '#5088d0',
  jeans: '#384860',
  gull: '#f4f4fc',
  gullWing: '#d8d8e8',
  gullBeak: '#f0a030',
  chipBag: '#e83850',
  stone: '#788088',
};

/** Match sprite pack upscale (characters / seagulls use 3×) */
export const ART_SCALE = 3;

export function textureFromPixels(width, height, drawFn) {
  const canvas = document.createElement('canvas');
  canvas.width = width * ART_SCALE;
  canvas.height = height * ART_SCALE;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.scale(ART_SCALE, ART_SCALE);
  drawFn(ctx, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createPixelMaterial(texture, transparent = false) {
  return new THREE.MeshBasicMaterial({
    map: texture,
    transparent,
    alphaTest: transparent ? 0.25 : 0,
    depthWrite: !transparent,
    depthTest: true,
  });
}

export function createBillboard(texture, width, height, opts = {}) {
  const mat = createPixelMaterial(texture, true);
  mat.depthWrite = opts.depthWrite !== false;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
  mesh.renderOrder = opts.renderOrder ?? -5;
  return mesh;
}

/**
 * Spanish City Whitley Bay — large white pixel façade (inspired by dome photos).
 * Cream/white Edwardian building with central dome, towers, wide frontage.
 */
export function createSpanishCityTexture() {
  return textureFromPixels(320, 140, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, PAL.skyHi);
    grad.addColorStop(0.45, PAL.skyLo);
    grad.addColorStop(0.55, PAL.seaHi);
    grad.addColorStop(1, '#3580a0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#3a90b0';
    ctx.fillRect(0, 88, w, 52);

    const bx = 18;
    const bw = w - 36;
    const by = 38;
    const bh = 88;

    ctx.fillStyle = PAL.creamSh;
    ctx.fillRect(bx, by + 20, bw, bh - 20);

    ctx.fillStyle = PAL.cream;
    ctx.fillRect(bx + 8, by + 8, bw - 16, bh - 8);

    ctx.fillStyle = PAL.white;
    ctx.fillRect(bx + 16, by + 4, bw - 32, bh - 4);

    const cx = w / 2;
    const domeY = 8;
    for (let row = 0; row < 22; row++) {
      const rw = 28 + row * 5;
      const y = domeY + row * 2;
      ctx.fillStyle = row < 4 ? PAL.domeHi : row < 8 ? PAL.cream : PAL.creamSh;
      ctx.fillRect(cx - rw / 2, y, rw, 3);
    }
    ctx.fillStyle = PAL.domeHi;
    ctx.fillRect(cx - 22, domeY - 2, 44, 6);
    ctx.fillStyle = '#d8d4cc';
    ctx.fillRect(cx - 18, domeY + 44, 36, 4);

    ctx.fillStyle = PAL.white;
    ctx.fillRect(bx + 4, by + 28, 22, 56);
    ctx.fillRect(bx + bw - 26, by + 28, 22, 56);
    ctx.fillStyle = PAL.cream;
    ctx.fillRect(bx + 6, by + 32, 18, 48);
    ctx.fillRect(bx + bw - 24, by + 32, 18, 48);

    ctx.fillStyle = PAL.blue;
    for (let x = bx + 36; x < bx + bw - 36; x += 16) {
      ctx.fillRect(x, by + 36, 10, 14);
      ctx.fillRect(x, by + 54, 10, 12);
      ctx.fillStyle = '#88c8f0';
      ctx.fillRect(x + 2, by + 38, 6, 8);
      ctx.fillStyle = PAL.blue;
    }

    ctx.fillStyle = '#c8c4bc';
    for (let i = 0; i < 9; i++) {
      ctx.fillRect(bx + 20 + i * 28, by + bh - 6, 18, 4);
    }

    ctx.fillStyle = PAL.red;
    ctx.fillRect(cx - 28, by + bh - 18, 56, 8);
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = PAL.white;
    ctx.fillText('SPANISH CITY', cx - 42, by + bh - 8);
    ctx.font = '9px monospace';
    ctx.fillText('WHITLEY BAY', cx - 34, h - 6);
  });
}

export function createLighthouseTexture() {
  return textureFromPixels(128, 96, (ctx, w, h) => {
    ctx.fillStyle = PAL.skyHi;
    ctx.fillRect(0, 0, w, 48);
    ctx.fillStyle = PAL.seaHi;
    ctx.fillRect(0, 48, w, 48);
    ctx.fillStyle = '#586878';
    ctx.fillRect(28, 62, 72, 30);
    ctx.fillStyle = PAL.white;
    for (let y = 22; y < 78; y++) {
      const tw = Math.max(12, 22 - Math.floor((y - 22) / 5));
      ctx.fillRect(64 - tw / 2, y, tw, 3);
    }
    ctx.fillStyle = PAL.yellow;
    ctx.fillRect(58, 16, 14, 10);
    ctx.fillStyle = '#404858';
    ctx.fillRect(10, 72, 44, 6);
    ctx.font = '7px monospace';
    ctx.fillStyle = PAL.white;
    ctx.fillText("ST MARY'S", 38, 92);
  });
}

export function createPromenadeTexture() {
  return textureFromPixels(64, 64, (ctx, w, h) => {
    ctx.fillStyle = '#9a8060';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = PAL.promLo;
    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        if ((x + y) % 4 === 0) ctx.fillRect(x, y, 2, 2);
      }
    }
    ctx.fillStyle = PAL.promHi;
    for (let y = 0; y < h; y += 8) {
      for (let x = 0; x < w; x += 8) {
        if ((x * 3 + y) % 16 === 0) ctx.fillRect(x + 1, y + 1, 5, 5);
      }
    }
    ctx.fillStyle = '#706048';
    ctx.fillRect(0, Math.floor(h * 0.42), w, 4);
    ctx.fillStyle = '#c8b898';
    ctx.fillRect(1, Math.floor(h * 0.44), w - 2, 2);
    ctx.fillStyle = '#585040';
    for (let x = 4; x < w; x += 14) {
      ctx.fillRect(x, Math.floor(h * 0.43), 8, 1);
    }
  });
}

/** Pixel sky gradient + block clouds for scene background / backdrop */
export function createSkyTexture() {
  return textureFromPixels(160, 96, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#68a0d8');
    grad.addColorStop(0.35, PAL.skyHi);
    grad.addColorStop(0.62, PAL.skyLo);
    grad.addColorStop(0.82, '#a8c4dc');
    grad.addColorStop(1, '#88b0c8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const clouds = [
      [12, 18, 28, 10],
      [48, 12, 36, 12],
      [92, 22, 32, 9],
      [128, 14, 24, 11],
      [24, 32, 22, 8],
      [70, 28, 40, 10],
      [110, 34, 26, 7],
    ];
    clouds.forEach(([x, y, cw, ch], i) => {
      ctx.fillStyle = i % 2 ? '#e8f4ff' : '#d0e4f8';
      ctx.fillRect(x, y, cw, ch);
      ctx.fillRect(x + 6, y - 3, cw - 10, ch - 2);
      ctx.fillRect(x + cw * 0.35, y + 2, cw * 0.5, ch - 3);
    });

    for (let y = 0; y < h; y += 4) {
      if (y % 8 === 0) {
        ctx.fillStyle = `rgba(255,255,255,${y < h * 0.5 ? 0.04 : 0.02})`;
        ctx.fillRect(0, y, w, 2);
      }
    }
  });
}

export function createSandTexture() {
  return textureFromPixels(48, 48, (ctx, w, h) => {
    ctx.fillStyle = '#e0d0a8';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = PAL.sand;
    for (let y = 0; y < h; y += 4) {
      for (let x = 0; x < w; x += 4) {
        if ((x + y) % 8 < 4) ctx.fillRect(x, y, 4, 4);
      }
    }
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = i % 3 ? '#dcc8a0' : '#f4e8c8';
      ctx.fillRect((i * 7) % (w - 3), (i * 11) % (h - 3), 2, 2);
    }
  });
}

export function createSeagullTextures() {
  const frame = (wingUp) =>
    textureFromPixels(40, 36, (ctx, w, h) => {
      ctx.fillStyle = PAL.gull;
      ctx.fillRect(12, 14, 14, 10);
      ctx.fillStyle = PAL.gullWing;
      if (wingUp) {
        ctx.fillRect(2, 6, 14, 6);
        ctx.fillRect(22, 8, 14, 5);
      } else {
        ctx.fillRect(2, 16, 14, 5);
        ctx.fillRect(22, 6, 14, 6);
      }
      ctx.fillRect(13, 9, 12, 9);
      ctx.fillStyle = PAL.gullBeak;
      ctx.fillRect(26, 12, 6, 4);
      ctx.fillStyle = '#282838';
      ctx.fillRect(17, 11, 3, 3);
      ctx.fillRect(10, 24, 5, 6);
      ctx.fillRect(26, 24, 5, 6);
    });
  return [frame(true), frame(false)];
}

export function createSkateboardTexture() {
  return textureFromPixels(72, 20, (ctx, w, h) => {
    ctx.fillStyle = '#282838';
    ctx.fillRect(4, 12, w - 8, 5);
    ctx.fillStyle = '#c85828';
    ctx.fillRect(6, 8, w - 12, 6);
    ctx.fillStyle = '#e87840';
    ctx.fillRect(8, 9, w - 16, 3);
    ctx.fillStyle = '#a0a8b8';
    ctx.fillRect(10, 14, 8, 4);
    ctx.fillRect(w - 18, 14, 8, 4);
    ctx.fillStyle = '#f0f0f8';
    ctx.fillRect(12, 15, 4, 2);
    ctx.fillRect(w - 16, 15, 4, 2);
  });
}

export function createChipPacketTexture() {
  return textureFromPixels(48, 52, (ctx, w, h) => {
    ctx.fillStyle = PAL.chipBag;
    ctx.fillRect(6, 14, 28, 26);
    ctx.fillStyle = '#ff5868';
    ctx.fillRect(8, 10, 24, 8);
    ctx.fillStyle = PAL.yellow;
    ctx.fillRect(9, 18, 22, 16);
    ctx.fillStyle = PAL.cream;
    ctx.fillRect(11, 20, 18, 12);
    ctx.fillStyle = PAL.white;
    ctx.font = 'bold 9px monospace';
    ctx.fillText('CHIPS', 10, 17);
    ctx.fillText('WB', 15, 36);
  });
}

export function createSingleChipTexture() {
  return textureFromPixels(16, 14, (ctx) => {
    ctx.fillStyle = PAL.chipGold;
    ctx.fillRect(1, 2, 10, 6);
    ctx.fillStyle = '#c8a030';
    ctx.fillRect(2, 3, 8, 4);
    ctx.fillStyle = '#fff8c0';
    ctx.fillRect(4, 3, 4, 2);
  });
}

export function createStoneTexture() {
  return textureFromPixels(14, 14, (ctx) => {
    ctx.fillStyle = PAL.stone;
    ctx.fillRect(2, 3, 6, 5);
    ctx.fillStyle = '#a0a8b0';
    ctx.fillRect(3, 2, 4, 2);
    ctx.fillStyle = '#505860';
    ctx.fillRect(3, 6, 4, 2);
  });
}

/** Overlay arm for sprite-pack skaters during stone throws */
export function createThrowArmTextures(sleeveColor = '#3868b0') {
  const idle = textureFromPixels(22, 26, (ctx) => {
    ctx.fillStyle = sleeveColor;
    ctx.fillRect(5, 4, 12, 18);
    ctx.fillStyle = PAL.skin;
    ctx.fillRect(14, 16, 8, 8);
  });
  const throwing = textureFromPixels(44, 22, (ctx, w) => {
    ctx.fillStyle = sleeveColor;
    ctx.fillRect(2, 9, 30, 7);
    ctx.fillRect(4, 7, 10, 4);
    ctx.fillStyle = PAL.skin;
    ctx.fillRect(28, 7, 8, 10);
    ctx.fillStyle = PAL.stone;
    ctx.fillRect(w - 12, 5, 10, 10);
    ctx.fillStyle = '#a0a8b0';
    ctx.fillRect(w - 10, 6, 6, 4);
  });
  return { idle, throwing };
}

function drawWheel(ctx, x, y) {
  ctx.fillStyle = '#181820';
  ctx.fillRect(x, y, 10, 6);
  ctx.fillStyle = '#606878';
  ctx.fillRect(x + 2, y + 1, 6, 4);
}

export function createCarTexture() {
  return textureFromPixels(56, 36, (ctx, w, h) => {
    ctx.fillStyle = '#181820';
    ctx.fillRect(4, h - 8, w - 8, 3);
    drawWheel(ctx, 8, h - 9);
    drawWheel(ctx, w - 18, h - 9);
    ctx.fillStyle = '#b83840';
    ctx.fillRect(6, 12, w - 12, 14);
    ctx.fillStyle = '#d85058';
    ctx.fillRect(8, 14, w - 16, 6);
    ctx.fillStyle = '#383848';
    ctx.fillRect(10, 4, w - 20, 12);
    ctx.fillStyle = '#88c8f0';
    ctx.fillRect(12, 6, 10, 7);
    ctx.fillRect(w - 22, 6, 10, 7);
    ctx.fillStyle = '#f0f0f8';
    ctx.fillRect(14, 7, 6, 4);
    ctx.fillRect(w - 20, 7, 6, 4);
    ctx.fillStyle = '#ffd080';
    ctx.fillRect(6, 16, 5, 4);
    ctx.fillRect(w - 11, 16, 5, 4);
  });
}

export function createVanTexture() {
  return textureFromPixels(64, 40, (ctx, w, h) => {
    ctx.fillStyle = '#181820';
    ctx.fillRect(4, h - 8, w - 8, 3);
    drawWheel(ctx, 10, h - 9);
    drawWheel(ctx, w - 20, h - 9);
    ctx.fillStyle = '#e8e0d0';
    ctx.fillRect(6, 10, w - 12, 18);
    ctx.fillStyle = '#f8f4ec';
    ctx.fillRect(8, 12, w - 16, 8);
    ctx.fillStyle = '#404850';
    ctx.fillRect(8, 2, w - 16, 12);
    ctx.fillStyle = '#88c8f0';
    ctx.fillRect(12, 4, 12, 8);
    ctx.fillRect(w - 24, 4, 12, 8);
    ctx.fillStyle = '#c0c8d0';
    ctx.fillRect(w / 2 - 12, 20, 24, 8);
  });
}

export function createChildTexture() {
  return textureFromPixels(32, 48, (ctx, w, h) => {
    ctx.fillStyle = '#181820';
    ctx.fillRect(10, h - 6, 5, 5);
    ctx.fillRect(17, h - 6, 5, 5);
    ctx.fillStyle = '#e85848';
    ctx.fillRect(9, 22, 14, 16);
    ctx.fillStyle = '#ff6868';
    ctx.fillRect(11, 24, 10, 8);
    ctx.fillStyle = PAL.skin;
    ctx.fillRect(10, 8, 12, 12);
    ctx.fillStyle = PAL.skinSh;
    ctx.fillRect(12, 14, 8, 4);
    ctx.fillStyle = '#483028';
    ctx.fillRect(9, 4, 14, 8);
    ctx.fillStyle = '#282838';
    ctx.fillRect(13, 11, 3, 3);
    ctx.fillRect(17, 11, 3, 3);
  });
}

export function createDogPooTexture() {
  return textureFromPixels(24, 16, (ctx, w, h) => {
    ctx.fillStyle = '#4a3828';
    ctx.fillRect(6, 8, 12, 6);
    ctx.fillRect(8, 4, 8, 6);
    ctx.fillStyle = '#5a4838';
    ctx.fillRect(7, 5, 10, 4);
    ctx.fillStyle = '#382820';
    ctx.fillRect(9, 10, 6, 3);
  });
}

export function createIceCreamCartTexture() {
  return textureFromPixels(48, 52, (ctx, w, h) => {
    ctx.fillStyle = '#181820';
    ctx.fillRect(8, h - 7, 8, 6);
    ctx.fillRect(w - 16, h - 7, 8, 6);
    ctx.fillStyle = '#f8f0e0';
    ctx.fillRect(6, 14, w - 12, 24);
    ctx.fillStyle = '#e8d8c0';
    ctx.fillRect(8, 16, w - 16, 8);
    ctx.fillStyle = PAL.red;
    ctx.fillRect(10, 6, w - 20, 10);
    ctx.fillStyle = PAL.yellow;
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(12 + i * 8, 22, 5, 12);
      ctx.fillStyle = '#f8f8ff';
      ctx.fillRect(13 + i * 8, 20, 3, 4);
      ctx.fillStyle = PAL.yellow;
    }
    ctx.fillStyle = PAL.white;
    ctx.font = 'bold 7px monospace';
    ctx.fillText('99', w / 2 - 6, 13);
  });
}

export function createCyclistTexture() {
  return textureFromPixels(44, 48, (ctx, w, h) => {
    ctx.fillStyle = '#181820';
    ctx.fillRect(6, h - 5, 6, 5);
    ctx.fillRect(w - 12, h - 5, 6, 5);
    ctx.strokeStyle = '#282828';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10, h - 6);
    ctx.lineTo(w / 2, 20);
    ctx.lineTo(w - 10, h - 6);
    ctx.stroke();
    ctx.fillStyle = PAL.yellow;
    ctx.fillRect(14, 14, 16, 14);
    ctx.fillStyle = '#f0d050';
    ctx.fillRect(16, 16, 12, 8);
    ctx.fillStyle = PAL.skin;
    ctx.fillRect(16, 4, 12, 10);
    ctx.fillStyle = '#383848';
    ctx.fillRect(15, 2, 14, 5);
  });
}

export function createBeachBallTexture() {
  return textureFromPixels(28, 28, (ctx, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    ctx.fillStyle = '#ff4040';
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - 4, cy - 2, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4088d8';
    ctx.beginPath();
    ctx.arc(cx + 5, cy + 4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f0f040';
    ctx.fillRect(cx - 2, cy + 6, 8, 5);
    ctx.fillStyle = '#181820';
    ctx.fillRect(cx - 1, h - 5, 3, 4);
  });
}

export function createPuddleTexture() {
  return textureFromPixels(40, 20, (ctx, w, h) => {
    ctx.fillStyle = '#4888b0';
    ctx.beginPath();
    ctx.ellipse(w / 2, h / 2 + 2, w / 2 - 4, h / 2 - 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#68b0d8';
    ctx.fillRect(8, 6, 10, 4);
    ctx.fillRect(w - 18, 8, 8, 3);
    ctx.fillStyle = '#306888';
    ctx.fillRect(6, h - 5, w - 12, 3);
  });
}

export function createLampPostTexture() {
  return textureFromPixels(20, 64, (ctx, w, h) => {
    ctx.fillStyle = '#404850';
    ctx.fillRect(7, 8, 6, h - 12);
    ctx.fillStyle = '#606878';
    ctx.fillRect(8, 10, 4, h - 16);
    ctx.fillStyle = '#fff8d0';
    ctx.fillRect(3, 2, 14, 10);
    ctx.fillStyle = '#ffe8a0';
    ctx.fillRect(5, 4, 10, 6);
  });
}

export function createBeachHutTexture(color) {
  return textureFromPixels(32, 44, (ctx, w, h) => {
    ctx.fillStyle = '#585048';
    ctx.fillRect(10, h - 6, 12, 5);
    ctx.fillStyle = color;
    ctx.fillRect(5, 18, 22, 20);
    ctx.fillStyle = PAL.white;
    ctx.fillRect(3, 8, 26, 12);
    ctx.fillStyle = '#e8e4dc';
    ctx.fillRect(6, 10, 8, 8);
    ctx.fillRect(18, 10, 8, 8);
    ctx.fillStyle = '#707880';
    ctx.fillRect(14, 34, 5, 5);
  });
}

function isSpritePixelVisible(r, g, b, a) {
  return a > 24 && !(r < 28 && g < 28 && b < 28);
}

/** Bounding box of visible pixels (after black keying). footRow = lowest visible row. */
export function measureSpriteBounds(canvas) {
  const w = canvas.width;
  const h = canvas.height;
  const data = canvas.getContext('2d').getImageData(0, 0, w, h).data;
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  let footRow = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (isSpritePixelVisible(data[i], data[i + 1], data[i + 2], data[i + 3])) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        footRow = Math.max(footRow, y);
      }
    }
  }

  if (minX > maxX) {
    return { minX: 0, minY: 0, maxX: w - 1, maxY: h - 1, width: w, height: h, footRow: h - 1 };
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    footRow,
  };
}

function canvasToTexture(canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Load sprite PNG — optional trim of empty padding and crisp upscale.
 * Returns { texture, bounds } when trim is true (bounds in source pixel space).
 */
export function textureFromSpriteImage(
  url,
  { keyBlack = false, scale = ART_SCALE, trim = false } = {}
) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const work = document.createElement('canvas');
      work.width = img.width;
      work.height = img.height;
      const wctx = work.getContext('2d');
      wctx.imageSmoothingEnabled = false;
      wctx.drawImage(img, 0, 0);

      if (keyBlack) {
        const data = wctx.getImageData(0, 0, work.width, work.height);
        const p = data.data;
        for (let i = 0; i < p.length; i += 4) {
          if (p[i] < 28 && p[i + 1] < 28 && p[i + 2] < 28) p[i + 3] = 0;
        }
        wctx.putImageData(data, 0, 0);
      }

      const bounds = measureSpriteBounds(work);
      const out = document.createElement('canvas');

      if (trim) {
        out.width = bounds.width * scale;
        out.height = bounds.height * scale;
        const octx = out.getContext('2d');
        octx.imageSmoothingEnabled = false;
        octx.drawImage(
          work,
          bounds.minX,
          bounds.minY,
          bounds.width,
          bounds.height,
          0,
          0,
          out.width,
          out.height
        );
        resolve({ texture: canvasToTexture(out), bounds });
        return;
      }

      out.width = work.width * scale;
      out.height = work.height * scale;
      const octx = out.getContext('2d');
      octx.imageSmoothingEnabled = false;
      octx.drawImage(work, 0, 0, out.width, out.height);
      resolve(trim ? { texture: canvasToTexture(out), bounds } : canvasToTexture(out));
    };
    img.onerror = reject;
    img.src = url;
  });
}

/** Load external image and pixelate (for optional photo reference) */
export function textureFromImagePixelated(url, targetW, targetH) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      const scale = Math.max(targetW / img.width, targetH / img.height);
      const sw = img.width * scale;
      const sh = img.height * scale;
      const ox = (targetW - sw) / 2;
      const oy = (targetH - sh) / 2;
      ctx.drawImage(img, ox, oy, sw, sh);
      const tex = new THREE.CanvasTexture(canvas);
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      resolve(tex);
    };
    img.onerror = reject;
    img.src = url;
  });
}
