import * as THREE from 'three';
import {
  createChipPacketTexture,
  createSingleChipTexture,
  createStoneTexture,
  createCarTexture,
  createVanTexture,
  createChildTexture,
  createDogPooTexture,
  createIceCreamCartTexture,
  createCyclistTexture,
  createBeachBallTexture,
  createPuddleTexture,
  createSkateboardTexture,
  createThrowArmTextures,
  createPixelMaterial,
} from './pixel-art.js';
import {
  loadCharacterSprites,
  SKATE_FEET_Y,
} from './characters.js';
import { getSeagullSpritePack } from './seagulls.js';
import { h, groundCenterY } from './world-scale.js';

export const THROW_ANIM_DURATION = 0.3;

export const LANES = [-3, -1.5, 0, 1.5, 3];
export const OBSTACLE_TYPES = [
  'car',
  'van',
  'child',
  'dogPoo',
  'iceCreamCart',
  'cyclist',
  'beachBall',
  'puddle',
];

const chipPacketTex = createChipPacketTexture();
const chipTex = createSingleChipTexture();
const stoneTex = createStoneTexture();
const skateboardTex = createSkateboardTexture();
const childTex = createChildTexture();
const dogPooTex = createDogPooTexture();
const iceCreamTex = createIceCreamCartTexture();
const cyclistTex = createCyclistTexture();
const beachBallTex = createBeachBallTexture();
const puddleTex = createPuddleTexture();
const carTex = createCarTexture();
const vanTex = createVanTexture();

function pixelBox(w, h, d, color) {
  return new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshBasicMaterial({ color })
  );
}

export async function createPlayer(characterId = 'henry') {
  const g = new THREE.Group();
  g.name = 'player';
  g.userData.characterId = characterId;

  const charSprites = await loadCharacterSprites(characterId);

  g.userData.charSprites = charSprites;
  g.userData.usesSpritePack = !!charSprites.usesSpritePack;

  const sprites = new THREE.Group();
  sprites.name = 'sprites';
  g.add(sprites);
  g.userData.spriteGroup = sprites;

  const spriteW = charSprites.displayWidth ?? 1.62;
  const spriteH = charSprites.displayHeight ?? 1.98;
  const bodyY = charSprites.bodyY ?? 1.05;

  const body = new THREE.Mesh(
    new THREE.PlaneGeometry(spriteW, spriteH),
    createPixelMaterial(charSprites.body, true)
  );
  body.position.set(0, bodyY, 0.08);
  sprites.add(body);
  g.userData.body = body;
  g.userData.spriteW = spriteW;
  g.userData.spriteH = spriteH;

  const armPivot = new THREE.Group();
  const armTex = charSprites.armIdle ?? charSprites.body;
  const armW = g.userData.usesSpritePack ? spriteW * 0.44 : 0.7;
  const armH = g.userData.usesSpritePack ? spriteH * 0.3 : 0.78;

  if (g.userData.usesSpritePack) {
    const sleeve = characterId === 'eleanor' ? '#58a8d8' : '#3868b0';
    g.userData.throwArmTex = createThrowArmTextures(sleeve);
    armPivot.position.set(spriteW * 0.28, bodyY + spriteH * 0.52, 0.38);
    armPivot.visible = false;
  } else {
    armPivot.position.set(0.52, 1.22, 0.24);
  }

  const arm = new THREE.Mesh(
    new THREE.PlaneGeometry(armW, armH),
    createPixelMaterial(
      g.userData.usesSpritePack ? g.userData.throwArmTex.idle : armTex,
      true
    )
  );
  arm.position.set(armW * 0.12, -armH * 0.2, 0);
  arm.renderOrder = 6;
  armPivot.add(arm);
  sprites.add(armPivot);
  g.userData.armPivot = armPivot;
  g.userData.armMesh = arm;
  g.userData.armThrowTimer = 0;
  g.userData.armW = armW;
  g.userData.armH = armH;

  if (g.userData.usesSpritePack) {
    const throwStone = new THREE.Mesh(
      new THREE.PlaneGeometry(spriteW * 0.14, spriteW * 0.14),
      createPixelMaterial(stoneTex, true)
    );
    throwStone.position.set(armW * 0.72, -armH * 0.05, 0.06);
    throwStone.visible = false;
    throwStone.renderOrder = 7;
    armPivot.add(throwStone);
    g.userData.throwStoneMesh = throwStone;
    const boardW = spriteW * 0.78;
    const boardH = h(0.11);
    const skate = new THREE.Mesh(
      new THREE.PlaneGeometry(boardW, boardH),
      createPixelMaterial(skateboardTex, true)
    );
    skate.position.set(0, SKATE_FEET_Y + boardH * 0.35, 0.14);
    skate.renderOrder = -8;
    sprites.add(skate);
    g.userData.skateboard = skate;
  } else {
    const board = pixelBox(1.08, 0.14, 2.35, 0x383848);
    board.position.y = 0.14;
    g.add(board);
    const deck = pixelBox(0.95, 0.07, 2.05, 0xc85828);
    deck.position.y = 0.22;
    g.add(deck);
  }

  const chipScale = g.userData.usesSpritePack ? spriteH * 0.38 : 1;
  const packetMat = createPixelMaterial(chipPacketTex, true);
  packetMat.transparent = true;
  const packet = new THREE.Mesh(
    new THREE.PlaneGeometry(0.85 * chipScale, 1 * chipScale),
    packetMat
  );
  packet.position.set(-spriteW * 0.38, bodyY + spriteH * 0.08, 0.42);
  packet.rotation.y = -0.3;
  sprites.add(packet);
  g.userData.chipPacket = packet;

  const chipStick = new THREE.Mesh(
    new THREE.PlaneGeometry(0.35 * chipScale, 0.3 * chipScale),
    createPixelMaterial(chipTex, true)
  );
  chipStick.position.set(-spriteW * 0.32, bodyY + spriteH * 0.22, 0.48);
  chipStick.rotation.y = -0.3;
  sprites.add(chipStick);
  g.userData.chipStick = chipStick;
  g.userData.chipStickVisible = true;

  return g;
}

export function updateChipPacket(player, chips, maxChips = 8) {
  const stick = player.userData.chipStick;
  if (stick) {
    stick.visible = chips > 0 && player.userData.chipStickVisible !== false;
    const s = 0.85 + (chips / maxChips) * 0.15;
    stick.scale.set(s, s, 1);
  }
  const packet = player.userData.chipPacket;
  if (packet) {
    packet.visible = chips > 0;
    packet.material.opacity = chips > 0 ? 1 : 0.5;
  }
}

export function setPlayerThrowing(player, active) {
  player.userData.armThrowTimer = active ? THROW_ANIM_DURATION : 0;
  const arm = player.userData.armMesh;
  const pivot = player.userData.armPivot;

  if (player.userData.usesSpritePack) {
    if (!pivot || !arm || !player.userData.throwArmTex) return;
    if (active) {
      pivot.visible = true;
      arm.material = createPixelMaterial(player.userData.throwArmTex.throwing, true);
      arm.scale.set(1.08, 1.05, 1);
    } else {
      resetSpritePackThrowPose(player);
    }
    return;
  }

  const sprites = player.userData.charSprites;
  if (!arm || !sprites?.armIdle) return;
  arm.material = createPixelMaterial(
    active ? sprites.armThrow : sprites.armIdle,
    true
  );
  arm.scale.set(1, 1, 1);
  if (active) arm.scale.set(1.12, 1.08, 1);
}

function resetSpritePackThrowPose(player) {
  const body = player.userData.body;
  const pivot = player.userData.armPivot;
  const arm = player.userData.armMesh;
  const stone = player.userData.throwStoneMesh;
  const tex = player.userData.throwArmTex;

  if (pivot) {
    pivot.visible = false;
    pivot.rotation.set(0, 0, 0);
  }
  if (arm && tex) {
    arm.material = createPixelMaterial(tex.idle, true);
    arm.scale.set(1, 1, 1);
  }
  if (stone) stone.visible = false;
  if (body) {
    body.rotation.z = 0;
    body.position.z = 0.08;
  }
}

export function updatePlayerThrowAnim(player, dt) {
  let t = player.userData.armThrowTimer;
  if (t <= 0) return;

  t -= dt;
  player.userData.armThrowTimer = t;
  const phase = 1 - t / THROW_ANIM_DURATION;
  const body = player.userData.body;

  if (player.userData.usesSpritePack) {
    const pivot = player.userData.armPivot;
    const arm = player.userData.armMesh;
    const stone = player.userData.throwStoneMesh;

    if (pivot) pivot.visible = true;

    if (phase < 0.38) {
      const p = phase / 0.38;
      if (pivot) {
        pivot.rotation.z = -0.15 - p * 1.05;
        pivot.rotation.x = p * 0.45;
      }
      if (stone) stone.visible = p > 0.12;
      if (body) {
        body.rotation.z = -p * 0.1;
        body.position.z = 0.08 - p * 0.03;
      }
    } else if (phase < 0.62) {
      const p = (phase - 0.38) / 0.24;
      if (pivot) {
        pivot.rotation.z = -1.2 - p * 0.55;
        pivot.rotation.x = -0.45 - p * 0.55;
      }
      if (stone) stone.visible = p < 0.45;
      if (body) {
        body.rotation.z = -0.1 + p * 0.22;
        body.position.z = 0.05 + p * 0.14;
      }
    } else {
      const p = (phase - 0.62) / 0.38;
      if (pivot) {
        pivot.rotation.z = -1.75 + p * 1.45;
        pivot.rotation.x = -1.0 + p * 1.0;
      }
      if (stone) stone.visible = false;
      if (body) {
        body.rotation.z = 0.12 - p * 0.12;
        body.position.z = 0.19 - p * 0.11;
      }
    }

    if (t <= 0) resetSpritePackThrowPose(player);
    return;
  }

  const pivot = player.userData.armPivot;
  if (!pivot) return;
  pivot.rotation.z = -0.55 - phase * 1.05;
  pivot.rotation.x = -phase * 0.35;
  if (t <= 0) {
    setPlayerThrowing(player, false);
    pivot.rotation.z = -0.55;
    pivot.rotation.x = 0;
  }
}

export function giveChipToSeagull(seagull) {
  const s = seagull.userData.baseH ?? 1.2;
  const chip = new THREE.Mesh(
    new THREE.PlaneGeometry(0.35 * (s / 1.2), 0.3 * (s / 1.2)),
    createPixelMaterial(chipTex, true)
  );
  chip.position.set(0.12 * s, 0.04 * s, 0.22);
  seagull.add(chip);
  seagull.userData.stolenChipMesh = chip;
  return chip;
}

function addGroundSprite(g, texture, width, height, hitRadius) {
  const spr = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    createPixelMaterial(texture, true)
  );
  spr.position.y = groundCenterY(height);
  g.add(spr);
  g.userData.sprite = spr;
  g.userData.hitRadius = hitRadius;
  return spr;
}

export function createObstacle(type, laneX) {
  const g = new THREE.Group();
  g.userData.kind = 'obstacle';
  g.userData.obstacleType = type;
  g.userData.hitRadius = h(0.55);

  switch (type) {
    case 'car':
      addGroundSprite(g, carTex, h(1.05), h(0.58), h(0.62));
      break;
    case 'van':
      addGroundSprite(g, vanTex, h(1.18), h(0.68), h(0.68));
      break;
    case 'child':
      addGroundSprite(g, childTex, h(0.42), h(0.52), h(0.28));
      break;
    case 'dogPoo':
      addGroundSprite(g, dogPooTex, h(0.32), h(0.2), h(0.22));
      break;
    case 'iceCreamCart':
      addGroundSprite(g, iceCreamTex, h(0.72), h(0.78), h(0.58));
      break;
    case 'cyclist':
      addGroundSprite(g, cyclistTex, h(0.62), h(0.68), h(0.52));
      break;
    case 'beachBall':
      addGroundSprite(g, beachBallTex, h(0.4), h(0.4), h(0.3));
      break;
    case 'puddle':
      addGroundSprite(g, puddleTex, h(0.85), h(0.38), h(0.48));
      break;
    default:
      addGroundSprite(g, childTex, h(0.42), h(0.52), h(0.28));
  }

  g.position.x = laneX;
  return g;
}

export function createSeagull(behaviour = 'cruise') {
  const pack = getSeagullSpritePack();
  const g = new THREE.Group();
  g.userData.kind = 'seagull';
  g.userData.behaviour = behaviour;
  g.userData.hitRadius = h(0.5);
  g.userData.stoleChip = false;
  g.userData.lastX = 0;
  g.userData.lastZ = 0;

  const w = pack?.displayWidth ?? 1.35;
  const h = pack?.displayHeight ?? 1.2;
  const sprite = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    createPixelMaterial(pack?.rotations?.south ?? chipTex, true)
  );
  g.add(sprite);
  g.userData.sprite = sprite;
  g.userData.baseW = w;
  g.userData.baseH = h;

  g.userData.orbitPhase = Math.random() * Math.PI * 2;
  g.userData.orbitSpeed = 1.6 + Math.random() * 1.4;
  g.userData.orbitRX = 2 + Math.random() * 2.5;
  g.userData.orbitRY = 0.8 + Math.random() * 1;
  g.userData.orbitRZ = 0.5 + Math.random() * 0.8;
  g.userData.anchorX = (Math.random() - 0.5) * 9;
  g.userData.baseY = 3 + Math.random() * 2.5;
  g.userData.driftX = (Math.random() - 0.5) * 0.6;

  return g;
}

export function createStone() {
  const g = new THREE.Group();
  g.userData.kind = 'stone';
  const s = h(0.14);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(s, s),
    createPixelMaterial(stoneTex, true)
  );
  g.add(mesh);
  g.userData.velocity = new THREE.Vector3();
  g.userData.life = 2.2;
  g.userData.spin = (Math.random() - 0.5) * 14;
  return g;
}

export function randomLaneX() {
  return LANES[Math.floor(Math.random() * LANES.length)];
}

export function randomObstacleType() {
  return OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
}

export function seagullPerspectiveScale(seagullZ, playerZ) {
  const dist = Math.max(playerZ - seagullZ, 2.5);
  return THREE.MathUtils.clamp(32 / dist, 0.4, 3.2);
}

export function billboardToCamera(mesh, camera) {
  if (mesh) mesh.lookAt(camera.position);
}
