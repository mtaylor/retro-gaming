export const STATE = {
  IDLE: 'idle',
  WALK: 'walk',
  PUNCH: 'punch',
  KICK: 'kick',
  HURT: 'hurt',
  DEAD: 'dead',
};

const ANIM = {
  idle: { dur: 0.4, loop: true },
  walk: { dur: 0.45, loop: true },
  punch: { dur: 0.22, loop: false, damage: 12, reach: 42, active: 0.08 },
  kick: { dur: 0.32, loop: false, damage: 18, reach: 48, active: 0.12 },
  hurt: { dur: 0.35, loop: false },
};

export function createPlayer(x, y, sprites, opts = {}) {
  return {
    team: 'player',
    x,
    y,
    vx: 0,
    vy: 0,
    facing: 1,
    state: STATE.IDLE,
    stateTime: 0,
    animFrame: 0,
    hp: opts.hp ?? 100,
    maxHp: opts.hp ?? 100,
    sprites,
    hitbox: { w: 28, h: 52 },
    attackHit: null,
    invuln: 0,
    combo: 0,
    comboTimer: 0,
    knockbackX: 0,
    attackCooldown: 0,
    isPlayer: true,
  };
}

export function createEnemy(x, y, wave = 1) {
  return {
    team: 'enemy',
    x,
    y,
    vx: 0,
    vy: 0,
    facing: -1,
    state: STATE.WALK,
    stateTime: 0,
    animFrame: 0,
    hp: 30 + wave * 8,
    maxHp: 30 + wave * 8,
    sprites: null,
    hitbox: { w: 26, h: 48 },
    attackHit: null,
    invuln: 0,
    combo: 0,
    comboTimer: 0,
    knockbackX: 0,
    isPlayer: false,
    aiTimer: 0,
    color: '#c04048',
  };
}

export function setState(f, state) {
  if (f.state === STATE.DEAD) return;
  if (f.state === STATE.HURT && state !== STATE.DEAD) return;
  if (
    (f.state === STATE.PUNCH || f.state === STATE.KICK) &&
    state !== STATE.HURT &&
    state !== STATE.DEAD
  ) {
    const a = ANIM[f.state];
    if (f.stateTime < a.dur * 0.55) return;
  }
  f.state = state;
  f.stateTime = 0;
  f.animFrame = 0;
  if (state === STATE.PUNCH || state === STATE.KICK) {
    f.attackHit = null;
  }
}

export function updateAnim(f, dt) {
  const def = ANIM[f.state] || ANIM.idle;
  f.stateTime += dt;
  if (def.loop) {
    const frameDur = def.dur / 4;
    f.animFrame = Math.floor(f.stateTime / frameDur) % 4;
  } else if (f.stateTime >= def.dur) {
    if (f.state === STATE.HURT) setState(f, STATE.IDLE);
    else if (f.state === STATE.PUNCH || f.state === STATE.KICK) setState(f, STATE.IDLE);
    else if (f.hp <= 0) f.state = STATE.DEAD;
    else setState(f, STATE.IDLE);
  } else if (f.state === STATE.PUNCH || f.state === STATE.KICK) {
    const a = ANIM[f.state];
    if (f.stateTime >= a.active && f.stateTime < a.active + 0.06 && !f.attackHit) {
      f.attackHit = {
        damage: a.damage,
        reach: a.reach,
        side: f.facing,
      };
    }
  }
}

export function getFrame(sprites, state, facing) {
  if (!sprites) return null;
  const set = sprites[state] || sprites.idle;
  const side = facing >= 0 ? 'right' : 'left';
  return set[side] || set.right;
}
