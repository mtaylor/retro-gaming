import { STATE } from './fighter.js';

export const STAGE_W = 2400;
export const GROUND_Y = 420;
export const LANE_MIN = 340;
export const LANE_MAX = 480;
export const VIEW_W = 960;
export const VIEW_H = 540;

export function clampLane(y) {
  return Math.max(LANE_MIN, Math.min(LANE_MAX, y));
}

export function depthScale(y) {
  const t = (y - LANE_MIN) / (LANE_MAX - LANE_MIN);
  return 0.88 + t * 0.14;
}

export function sortByDepth(entities) {
  return [...entities].sort((a, b) => a.y - b.y);
}

export function overlapHit(a, b) {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return dx < (a.hitbox.w + b.hitbox.w) * 0.45 && dy < (a.hitbox.h + b.hitbox.h) * 0.35;
}

export function attackConnect(attacker, target) {
  if (!attacker.attackHit || target.invuln > 0 || target.state === STATE.DEAD) return false;
  const hit = attacker.attackHit;
  const dx = target.x - attacker.x;
  if (Math.sign(dx) !== hit.side && Math.abs(dx) > 8) return false;
  if (Math.abs(dx) > hit.reach) return false;
  if (Math.abs(target.y - attacker.y) > 36) return false;
  return true;
}

export function applyDamage(target, amount, fromX) {
  if (target.invuln > 0 || target.state === STATE.DEAD) return;
  target.hp -= amount;
  target.invuln = 0.4;
  target.knockbackX = Math.sign(target.x - fromX) * 120;
  if (target.hp <= 0) {
    target.state = STATE.DEAD;
    target.stateTime = 0;
  } else {
    target.state = STATE.HURT;
    target.stateTime = 0;
    target.attackHit = null;
  }
}
