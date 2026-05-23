import * as THREE from 'three';
import {
  createPromenadeTexture,
  createSandTexture,
  createBeachHutTexture,
  createLampPostTexture,
  createSkyTexture,
  createBillboard,
  createPixelMaterial,
  PAL,
} from './pixel-art.js';
import { h, groundCenterY } from './world-scale.js';

export const COLORS = {
  sky: 0xb8d0e8,
  sea: 0x4098b8,
};

let skyTextureCache = null;

function getSkyTexture() {
  if (!skyTextureCache) skyTextureCache = createSkyTexture();
  return skyTextureCache;
}

export function createWhitleyBayWorld(scene) {
  const scrollWorld = new THREE.Group();
  scrollWorld.name = 'scrollWorld';

  const skyTex = getSkyTexture();
  scene.background = skyTex;
  scene.fog = new THREE.Fog(COLORS.sky, 42, 95);

  const promTex = createPromenadeTexture();
  const sandTex = createSandTexture();
  const promMat = createPixelMaterial(promTex);
  promMat.map.repeat.set(6, 10);
  promMat.map.wrapS = promMat.map.wrapT = THREE.RepeatWrapping;

  const sandMat = createPixelMaterial(sandTex);
  sandMat.map.repeat.set(4, 10);
  sandMat.map.wrapS = sandMat.map.wrapT = THREE.RepeatWrapping;

  const skyMat = createPixelMaterial(skyTex, false);
  skyMat.depthWrite = false;
  const skyBackdrop = new THREE.Mesh(new THREE.PlaneGeometry(120, 36), skyMat);
  skyBackdrop.renderOrder = -20;
  skyBackdrop.rotation.y = Math.PI;
  skyBackdrop.position.set(0, 14, -55);
  scrollWorld.add(skyBackdrop);

  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 70),
    new THREE.MeshBasicMaterial({
      color: COLORS.sea,
      depthWrite: true,
    })
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(10, -0.04, -22);
  scrollWorld.add(sea);

  const promenadeSegments = [];
  for (let i = 0; i < 5; i++) {
    const seg = createPromenadeSegment(promMat, sandMat);
    seg.position.z = -i * 40;
    scrollWorld.add(seg);
    promenadeSegments.push(seg);
  }

  return { world: scrollWorld, promenadeSegments };
}

function createPromenadeSegment(promMat, sandMat) {
  const g = new THREE.Group();

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(24, 40), promMat);
  ground.rotation.x = -Math.PI / 2;
  ground.renderOrder = 0;
  g.add(ground);

  const sand = new THREE.Mesh(new THREE.PlaneGeometry(7, 40), sandMat);
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(8.5, 0.02, 0);
  sand.renderOrder = 0;
  g.add(sand);

  const hutW = h(0.82);
  const hutH = h(1.05);
  const hutColors = [PAL.red, PAL.blue, PAL.yellow];
  for (let i = 0; i < 3; i++) {
    const hut = createBillboard(createBeachHutTexture(hutColors[i]), hutW, hutH);
    hut.position.set(9.5, groundCenterY(hutH), -12 + i * 10);
    g.add(hut);
  }

  const lampTex = createLampPostTexture();
  const lampH = h(1.55);
  const lampW = h(0.22);
  for (let z = -18; z <= 18; z += 6) {
    const lamp = createBillboard(lampTex, lampW, lampH, { depthWrite: true });
    lamp.position.set(-5, groundCenterY(lampH), z);
    g.add(lamp);
  }

  const railH = h(0.42);
  const rail = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, railH, 38),
    new THREE.MeshBasicMaterial({ color: 0x606878 })
  );
  rail.position.set(-6.2, groundCenterY(railH), 0);
  g.add(rail);

  return g;
}

export function scrollWorld(worldRoot, _segments, speed, dt) {
  const dz = speed * dt;
  worldRoot.position.z += dz;
  if (worldRoot.position.z > 40) {
    worldRoot.position.z -= 40;
  }
}
