import {
  textureFromPixels,
  textureFromSpriteImage,
  measureSpriteBounds,
} from './pixel-art.js';
import { resolveSkatebowAsset } from './assets-path.js';

export const HENRY_SPRITE_REL = 'assets/henry';
export const ELEANOR_SPRITE_REL = 'assets/eleanor';
export const SPRITE_DIRECTIONS = [
  'south',
  'south-east',
  'east',
  'north-east',
  'north',
  'north-west',
  'west',
  'south-west',
];

/** World-space height of the character (trimmed art, not empty 128×128 canvas) */
export const PLAYER_WORLD_HEIGHT = 1.72;
/** Y position of skate deck — sprite feet align here */
export const SKATE_FEET_Y = 0.3;
export const SPRITE_TEX_SCALE = 3;

export const CHARACTERS = {
  henry: {
    id: 'henry',
    name: 'Henry',
    label: 'Boy',
    spriteRel: HENRY_SPRITE_REL,
    detail: 'Newcastle United kit · orange trainers · curly hair',
  },
  eleanor: {
    id: 'eleanor',
    name: 'Eleanor',
    label: 'Girl',
    spriteRel: ELEANOR_SPRITE_REL,
    detail: 'Jeans & t-shirt · long blonde hair',
  },
};

const BODY_W = 80;
const BODY_H = 96;
const SPRITE_VER = 10;

const spriteCache = new Map();

function displayMetricsFromBounds(bounds) {
  const aspect = bounds.width / bounds.height;
  const displayHeight = PLAYER_WORLD_HEIGHT;
  const displayWidth = displayHeight * aspect;
  const footFromBottom = (bounds.footRow - bounds.minY + 1) / bounds.height;
  const bodyY = SKATE_FEET_Y + displayHeight * (0.5 - footFromBottom) + 0.02;

  return { displayWidth, displayHeight, bodyY, footFromBottom };
}

async function loadTrimmedSprite(url) {
  const result = await textureFromSpriteImage(url, {
    keyBlack: true,
    scale: SPRITE_TEX_SCALE,
    trim: true,
  });
  return result;
}

async function loadSpritePack(spriteRel) {
  const key = `${spriteRel}-${SPRITE_VER}`;
  if (spriteCache.has(key)) return spriteCache.get(key);

  const southUrl = resolveSkatebowAsset(`${spriteRel}/south.png`);
  const south = await loadTrimmedSprite(southUrl);
  const metrics = displayMetricsFromBounds(south.bounds);

  const rotations = { south: south.texture };
  await Promise.all(
    SPRITE_DIRECTIONS.filter((d) => d !== 'south').map(async (dir) => {
      const { texture } = await loadTrimmedSprite(
        resolveSkatebowAsset(`${spriteRel}/${dir}.png`)
      );
      rotations[dir] = texture;
    })
  );

  const pack = {
    rotations,
    body: rotations.south,
    usesSpritePack: true,
    facing: 'south',
    displayWidth: metrics.displayWidth,
    displayHeight: metrics.displayHeight,
    bodyY: metrics.bodyY,
  };
  spriteCache.set(key, pack);
  return pack;
}

export function loadHenrySpritePack() {
  return loadSpritePack(HENRY_SPRITE_REL);
}

export function loadEleanorSpritePack() {
  return loadSpritePack(ELEANOR_SPRITE_REL);
}

export function facingFromLaneDelta(dx) {
  if (dx < -0.15) return 'south-west';
  if (dx > 0.15) return 'south-east';
  return 'south';
}

export function applySpriteFacing(player, laneDeltaX) {
  const sprites = player.userData.charSprites;
  const body = player.userData.body;
  if (!sprites?.rotations || !body) return;

  const dir = facingFromLaneDelta(laneDeltaX);
  if (dir === sprites.facing) return;
  sprites.facing = dir;
  const tex = sprites.rotations[dir];
  if (!tex) return;
  body.material.map = tex;
  body.material.needsUpdate = true;
}

export function createProceduralEleanorSprites() {
  const key = `eleanor-proc-${SPRITE_VER}`;
  if (spriteCache.has(key)) return spriteCache.get(key);

  const sprites = {
    body: textureFromPixels(BODY_W, BODY_H, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#58a8d8';
      ctx.fillRect(20, 30, 30, 30);
    }),
    armIdle: textureFromPixels(28, 32, (ctx) => {
      ctx.fillStyle = '#58a8d8';
      ctx.fillRect(6, 2, 14, 16);
    }),
    armThrow: textureFromPixels(36, 24, (ctx) => {
      ctx.fillStyle = '#58a8d8';
      ctx.fillRect(2, 8, 22, 8);
    }),
    usesSpritePack: false,
    displayWidth: 1.62,
    displayHeight: 1.98,
    bodyY: 1.05,
  };
  spriteCache.set(key, sprites);
  return sprites;
}

export async function loadCharacterSprites(characterId) {
  if (characterId === 'henry') return loadHenrySpritePack();
  if (characterId === 'eleanor') return loadEleanorSpritePack();
  return createProceduralEleanorSprites();
}

/** Player-select preview — trimmed and scaled like in-game */
export function drawSpritePreview(canvas, spriteRel) {
  const img = new Image();
  img.onload = () => {
    const work = document.createElement('canvas');
    work.width = img.width;
    work.height = img.height;
    const wctx = work.getContext('2d');
    wctx.imageSmoothingEnabled = false;
    wctx.drawImage(img, 0, 0);
    const data = wctx.getImageData(0, 0, work.width, work.height);
    const p = data.data;
    for (let i = 0; i < p.length; i += 4) {
      if (p[i] < 28 && p[i + 1] < 28 && p[i + 2] < 28) p[i + 3] = 0;
    }
    wctx.putImageData(data, 0, 0);

    const bounds = measureSpriteBounds(work);
    const previewScale = 5;
    canvas.width = bounds.width * previewScale;
    canvas.height = bounds.height * previewScale;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#243448';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      work,
      bounds.minX,
      bounds.minY,
      bounds.width,
      bounds.height,
      0,
      0,
      canvas.width,
      canvas.height
    );
  };
  img.onerror = () => {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#243448';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };
  img.src = resolveSkatebowAsset(`${spriteRel}/south.png`);
}
