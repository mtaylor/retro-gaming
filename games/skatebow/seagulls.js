import { textureFromSpriteImage } from './pixel-art.js';
import { resolveSkatebowAsset } from './assets-path.js';
import { SPRITE_DIRECTIONS } from './characters.js';

export const SEAGULL_SPRITE_REL = 'assets/seagull-boss';
/** Boss gull is bulky — closer to player scale than a real bird */
export const SEAGULL_WORLD_HEIGHT = 1.42;
export const SEAGULL_TEX_SCALE = 3;

const DIRECTION_ANGLES = [
  { dir: 'south', angle: 0 },
  { dir: 'south-east', angle: Math.PI / 4 },
  { dir: 'east', angle: Math.PI / 2 },
  { dir: 'north-east', angle: (3 * Math.PI) / 4 },
  { dir: 'north', angle: Math.PI },
  { dir: 'north-west', angle: (-3 * Math.PI) / 4 },
  { dir: 'west', angle: -Math.PI / 2 },
  { dir: 'south-west', angle: -Math.PI / 4 },
];

let cachedPack = null;

function displayMetricsFromBounds(bounds) {
  const aspect = bounds.width / bounds.height;
  const displayHeight = SEAGULL_WORLD_HEIGHT;
  return {
    displayWidth: displayHeight * aspect,
    displayHeight,
  };
}

async function loadTrimmedSeagull(url) {
  return textureFromSpriteImage(url, {
    keyBlack: true,
    scale: SEAGULL_TEX_SCALE,
    trim: true,
  });
}

export async function loadSeagullSpritePack() {
  if (cachedPack) return cachedPack;

  const south = await loadTrimmedSeagull(
    resolveSkatebowAsset(`${SEAGULL_SPRITE_REL}/south.png`)
  );
  const metrics = displayMetricsFromBounds(south.bounds);

  const rotations = { south: south.texture };
  await Promise.all(
    SPRITE_DIRECTIONS.filter((d) => d !== 'south').map(async (dir) => {
      const { texture } = await loadTrimmedSeagull(
        resolveSkatebowAsset(`${SEAGULL_SPRITE_REL}/${dir}.png`)
      );
      rotations[dir] = texture;
    })
  );

  cachedPack = { rotations, ...metrics };
  return cachedPack;
}

export function getSeagullSpritePack() {
  return cachedPack;
}

/** Pick rotation from flight direction (dz = toward player, dx = sideways) */
export function seagullFacingFromMotion(dx, dz) {
  if (Math.abs(dx) < 0.02 && Math.abs(dz) < 0.02) return 'south';
  const angle = Math.atan2(dx, dz);
  let best = 'south';
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

export function applySeagullFacing(spriteMesh, pack, dx, dz) {
  if (!spriteMesh || !pack?.rotations) return;
  const dir = seagullFacingFromMotion(dx, dz);
  const tex = pack.rotations[dir];
  if (!tex || spriteMesh.material.map === tex) return;
  spriteMesh.material.map = tex;
  spriteMesh.material.needsUpdate = true;
  spriteMesh.userData.facing = dir;
}
