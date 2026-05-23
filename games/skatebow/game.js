import * as THREE from 'three';
import { createWhitleyBayWorld, scrollWorld, COLORS } from './world.js';
import {
  createPlayer,
  createObstacle,
  createSeagull,
  createStone,
  updateChipPacket,
  setPlayerThrowing,
  updatePlayerThrowAnim,
  giveChipToSeagull,
  seagullPerspectiveScale,
  LANES,
  randomLaneX,
  randomObstacleType,
} from './entities.js';
import { applySpriteFacing } from './characters.js';
import { loadSeagullSpritePack, getSeagullSpritePack, applySeagullFacing } from './seagulls.js';
import { h } from './world-scale.js';

const PLAYER_Z = 2;
const SCROLL_BASE = 14;
const LANE_LERP = 12;
const MAX_CHIPS = 8;
const MAX_PIXEL_RATIO = 2;

let activeInstance = null;

function renderPixelRatio() {
  return Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
}

function disposeObject3D(root) {
  root.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m) => m.dispose());
    }
  });
}

export async function initSkatebow(canvas, ui, options = {}) {
  if (activeInstance) {
    activeInstance.destroy();
    activeInstance = null;
  }
  const characterId = options.character === 'eleanor' ? 'eleanor' : 'henry';
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(renderPixelRatio());
  renderer.setClearColor(COLORS.sky, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = false;
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 150);
  camera.position.set(0, 3.85, 8.4);

  const { world, promenadeSegments } = createWhitleyBayWorld(scene);
  scene.add(world);

  await loadSeagullSpritePack();

  const player = await createPlayer(characterId);
  player.position.set(0, 0, PLAYER_Z);
  scene.add(player);

  const obstacles = [];
  const seagulls = [];
  const stones = [];
  const particles = [];

  let score = 0;
  let lives = 3;
  let chips = MAX_CHIPS;
  let combo = 0;
  let comboTimer = 0;
  let scrollSpeed = SCROLL_BASE;
  let gameTime = 0;
  let obstacleTimer = 0;
  let seagullTimer = 0;
  let playing = true;
  let laneIndex = 2;

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const worldObjects = new THREE.Group();
  scene.add(worldObjects);

  function resize() {
    const w =
      canvas.clientWidth ||
      canvas.parentElement?.clientWidth ||
      window.innerWidth;
    const height =
      canvas.clientHeight ||
      canvas.parentElement?.clientHeight ||
      Math.min(window.innerHeight * 0.72, 640);
    if (w === 0 || height === 0) return;
    renderer.setPixelRatio(renderPixelRatio());
    renderer.setSize(w, height, false);
    camera.aspect = w / height;
    camera.updateProjectionMatrix();
  }

  function setHud(msg) {
    if (ui.messageEl) ui.messageEl.textContent = msg;
  }

  function updateUI() {
    if (ui.scoreEl) ui.scoreEl.textContent = String(score);
    if (ui.livesEl) ui.livesEl.textContent = String(lives);
    if (ui.comboEl) ui.comboEl.textContent = String(combo);
    if (ui.chipsEl) ui.chipsEl.textContent = String(chips);
    updateChipPacket(player, chips, MAX_CHIPS);
  }

  function showOverlay(title, text) {
    if (!ui.overlay) return;
    ui.overlayTitle.textContent = title;
    ui.overlayText.textContent = text;
    ui.overlay.classList.remove('hidden');
  }

  function hideOverlay() {
    ui.overlay?.classList.add('hidden');
  }

  function resetGame() {
    score = 0;
    lives = 3;
    chips = MAX_CHIPS;
    combo = 0;
    scrollSpeed = SCROLL_BASE;
    gameTime = 0;
    obstacleTimer = 0;
    seagullTimer = 0;
    playing = true;
    laneIndex = 2;
    player.position.set(0, 0, PLAYER_Z);
    player.userData.chipStickVisible = true;
    setPlayerThrowing(player, false);
    if (player.userData.armPivot) {
      player.userData.armPivot.rotation.set(0, 0, -0.55);
    }

    for (const o of obstacles) worldObjects.remove(o);
    for (const s of seagulls) worldObjects.remove(s);
    for (const st of stones) worldObjects.remove(st);
    for (const p of particles) scene.remove(p);
    obstacles.length = 0;
    seagulls.length = 0;
    stones.length = 0;
    particles.length = 0;

    world.position.set(0, 0, 0);
    promenadeSegments.forEach((seg, i) => {
      seg.position.z = -i * 40;
    });

    hideOverlay();
    updateUI();
    const who = characterId === 'eleanor' ? 'Eleanor' : 'Henry';
    setHud(`${who} — hold your chips! Throw stones at the evil seagulls!`);
  }

  function spawnObstacle() {
    const obs = createObstacle(randomObstacleType(), randomLaneX());
    obs.position.z = -52 - Math.random() * 18;
    worldObjects.add(obs);
    obstacles.push(obs);
  }

  function spawnSeagull() {
    const swoop = Math.random() < 0.5;
    const g = createSeagull(swoop ? 'swoop' : 'cruise');
    g.position.z = -48 - Math.random() * 22;
    g.position.x = swoop ? player.position.x + (Math.random() - 0.5) * 2 : (Math.random() - 0.5) * 10;
    g.position.y = g.userData.baseY;
    g.userData.anchorX = g.position.x;
    worldObjects.add(g);
    seagulls.push(g);
  }

  function throwStone(clientX, clientY) {
    if (!playing) return;
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const meshes = seagulls.map((s) => s.userData.sprite).filter(Boolean);
    const hits = raycaster.intersectObjects(meshes, false);
    const aimPoint = hits.length > 0
      ? hits[0].point.clone()
      : raycaster.ray.at(22, new THREE.Vector3());

    const stone = createStone();
    stone.position.copy(player.position);
    stone.position.y +=
      (player.userData.body?.position.y ?? 1.05) + (player.userData.spriteH ?? 1.7) * 0.45;
    stone.position.z -= 0.2;
    const dir = aimPoint.sub(stone.position).normalize();
    stone.userData.velocity.copy(dir.multiplyScalar(38));
    worldObjects.add(stone);
    stones.push(stone);
    setPlayerThrowing(player, true);
  }

  function spawnFeathers(pos) {
    const geo = new THREE.BufferGeometry();
    const n = 10;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 0.5;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const pts = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ color: 0xf0f0ff, size: 0.18 })
    );
    pts.position.copy(pos);
    pts.userData.life = 0.35;
    scene.add(pts);
    particles.push(pts);
  }

  function onHitSeagull(gull) {
    const idx = seagulls.indexOf(gull);
    if (idx === -1) return;
    worldObjects.remove(gull);
    seagulls.splice(idx, 1);
    combo += 1;
    comboTimer = 2.5;
    const points = 130 + combo * 35;
    score += points;
    spawnFeathers(gull.position);
    setHud(`Evil seagull bonked! +${points}`);
    updateUI();
  }

  function stealChip(gull) {
    if (gull.userData.stoleChip) return;
    gull.userData.stoleChip = true;
    gull.userData.behaviour = 'fleeWithChip';
    if (chips > 0) {
      chips -= 1;
      score = Math.max(0, score - 50);
      combo = 0;
      giveChipToSeagull(gull);
      player.userData.chipStickVisible = chips > 0;
      setHud('Evil seagull stole a chip and flew off!');
      stunnedFlash();
    }
    updateUI();
    if (chips <= 0 && lives > 0) {
      lives -= 1;
      chips = 4;
      setHud('Packet empty! Lost a life — new bag from the chippy.');
      if (lives <= 0) {
        playing = false;
        showOverlay('The seagulls win!', `Score: ${score}. Press Space to retry.`);
      }
    }
    updateUI();
  }

  function onCollision(obs) {
    lives -= 1;
    combo = 0;
    stunnedFlash();
    const labels = {
      car: 'Car!',
      van: 'Van!',
      child: 'Child!',
      dogPoo: 'Dog poo!',
      iceCreamCart: 'Ice cream cart!',
      cyclist: 'Cyclist!',
      beachBall: 'Beach ball!',
      puddle: 'Puddle!',
    };
    setHud(labels[obs.userData.obstacleType] || 'Oof!');
    updateUI();
    if (lives <= 0) {
      playing = false;
      showOverlay('Wiped out!', `Score: ${score}. Press Space to retry.`);
    }
  }

  function stunnedFlash() {
    canvas.classList.add('retro-flash');
    setTimeout(() => canvas.classList.remove('retro-flash'), 100);
  }

  function updatePlayer(dt) {
    const targetX = LANES[laneIndex];
    const prevX = player.position.x;
    player.position.x += (targetX - player.position.x) * Math.min(1, LANE_LERP * dt);
    if (player.userData.usesSpritePack) {
      applySpriteFacing(player, targetX - player.position.x);
      player.rotation.z = THREE.MathUtils.lerp(
        player.rotation.z,
        -(player.position.x - prevX) * 0.8,
        dt * 10
      );
    } else {
      player.rotation.z = THREE.MathUtils.lerp(
        player.rotation.z,
        -(targetX - player.position.x) * 0.12,
        dt * 8
      );
    }
    updatePlayerThrowAnim(player, dt);
    if (player.userData.spriteGroup) {
      player.userData.spriteGroup.lookAt(camera.position);
    }
  }

  function updateObstacles(dt) {
    const dz = scrollSpeed * dt;
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.position.z += dz;
      if (o.userData.sprite) o.userData.sprite.lookAt(camera.position);

      const dzP = o.position.z - player.position.z;
      if (
        dzP > -1.2 &&
        dzP < 1.2 &&
        Math.abs(o.position.x - player.position.x) < o.userData.hitRadius
      ) {
        onCollision(o);
        worldObjects.remove(o);
        obstacles.splice(i, 1);
        continue;
      }
      if (o.position.z > 12) {
        worldObjects.remove(o);
        obstacles.splice(i, 1);
      }
    }
  }

  function updateSeagullMotion(g, i, dt, dz) {
    const ud = g.userData;
    const prevX = g.position.x;
    const prevZ = g.position.z;
    const pack = getSeagullSpritePack();

    const scale = seagullPerspectiveScale(g.position.z, player.position.z);
    ud.sprite.scale.set(scale, scale, 1);
    ud.hitRadius = 0.55 * scale;

    ud.orbitPhase += dt * ud.orbitSpeed;

    if (ud.behaviour === 'cruise') {
      g.position.z += dz * 0.95;
      g.position.x =
        ud.anchorX +
        Math.sin(ud.orbitPhase) * ud.orbitRX +
        Math.cos(ud.orbitPhase * 0.65) * 1.4;
      g.position.y =
        ud.baseY +
        Math.sin(ud.orbitPhase * 1.4) * ud.orbitRY +
        Math.cos(ud.orbitPhase * 2.1) * 0.35;
    } else if (ud.behaviour === 'swoop') {
      g.position.z += dz * 1.1;
      ud.anchorX += (player.position.x - ud.anchorX) * dt * 2.5;
      g.position.x =
        ud.anchorX +
        Math.sin(ud.orbitPhase * 2) * 0.8;
      const dive = g.position.z > player.position.z - 12;
      if (dive) {
        g.position.y += (h(0.92) - g.position.y) * dt * 4;
      } else {
        g.position.y =
          ud.baseY +
          Math.sin(ud.orbitPhase * 1.2) * 1.2;
      }

      const near =
        g.position.z > player.position.z - 1.8 &&
        g.position.z < player.position.z + 2.5 &&
        Math.abs(g.position.x - player.position.x) < 1.2 * scale &&
        g.position.y < 3.2;

      if (near) stealChip(g);
    } else if (ud.behaviour === 'fleeWithChip') {
      g.position.y += dt * 9;
      g.position.z += dz * 0.25 + dt * 6;
      g.position.x += ud.driftX * 2.2;
      ud.orbitPhase += dt * 4;
      g.position.x += Math.sin(ud.orbitPhase) * 0.15;
      if (ud.stolenChipMesh) ud.stolenChipMesh.lookAt(camera.position);
    }

    const mdx = g.position.x - prevX;
    const mdz = g.position.z - prevZ;
    if (ud.sprite && pack) {
      applySeagullFacing(ud.sprite, pack, mdx, mdz);
      ud.sprite.lookAt(camera.position);
    }
    ud.lastX = g.position.x;
    ud.lastZ = g.position.z;
  }

  function updateSeagulls(dt) {
    const dz = scrollSpeed * dt;
    for (let i = seagulls.length - 1; i >= 0; i--) {
      const g = seagulls[i];
      updateSeagullMotion(g, i, dt, dz);
      if (g.position.z > 14 || g.position.y > 14) {
        worldObjects.remove(g);
        seagulls.splice(i, 1);
      }
    }
  }

  function updateStones(dt) {
    for (let i = stones.length - 1; i >= 0; i--) {
      const st = stones[i];
      st.position.addScaledVector(st.userData.velocity, dt);
      st.userData.velocity.y -= 18 * dt;
      st.rotation.z += st.userData.spin * dt;
      st.userData.life -= dt;

      for (let j = seagulls.length - 1; j >= 0; j--) {
        const g = seagulls[j];
        const hitR = g.userData.hitRadius ?? 1;
        if (st.position.distanceTo(g.position) < hitR) {
          onHitSeagull(g);
          worldObjects.remove(st);
          stones.splice(i, 1);
          break;
        }
      }
      if (i >= stones.length) continue;

      if (st.userData.life <= 0 || st.position.y < -2) {
        worldObjects.remove(st);
        stones.splice(i, 1);
      }
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].userData.life -= dt;
      if (particles[i].userData.life <= 0) {
        scene.remove(particles[i]);
        particles.splice(i, 1);
      }
    }
  }

  let last = performance.now();
  let rafId = 0;
  let disposed = false;

  function tick(now) {
    if (disposed) return;
    rafId = requestAnimationFrame(tick);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    if (playing) {
      gameTime += dt;
      scrollSpeed = SCROLL_BASE + gameTime * 0.3;
      scrollWorld(world, promenadeSegments, scrollSpeed, dt);

      obstacleTimer += dt;
      seagullTimer += dt;
      if (obstacleTimer > Math.max(0.48, 1.25 - gameTime * 0.018)) {
        obstacleTimer = 0;
        spawnObstacle();
      }
      if (seagullTimer > 0.65) {
        seagullTimer = 0;
        spawnSeagull();
      }

      if (comboTimer > 0) {
        comboTimer -= dt;
        if (comboTimer <= 0) combo = 0;
      }

      updatePlayer(dt);
      updateObstacles(dt);
      updateSeagulls(dt);
      updateStones(dt);
    }

    updateParticles(dt);

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, player.position.x * 0.28, dt * 4);
    camera.lookAt(player.position.x * 0.12, h(0.72), player.position.z - 9);

    renderer.render(scene, camera);
    updateUI();
  }

  function onKeyDown(e) {
    if (e.code === 'Space' && !playing) resetGame();
    if (playing) {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        laneIndex = Math.max(0, laneIndex - 1);
        e.preventDefault();
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        laneIndex = Math.min(LANES.length - 1, laneIndex + 1);
        e.preventDefault();
      }
    }
  }

  function onPointerDown(e) {
    if (e.button === 0) throwStone(e.clientX, e.clientY);
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('resize', resize);
  resize();
  resetGame();
  rafId = requestAnimationFrame(tick);

  const handle = {
    destroy() {
      disposed = true;
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', resize);
      disposeObject3D(scene);
      renderer.dispose();
      renderer.forceContextLoss?.();
      if (activeInstance === handle) activeInstance = null;
    },
  };

  activeInstance = handle;
  return handle;
}
