import { PLAYER_WORLD_HEIGHT, SKATE_FEET_Y } from './characters.js';

/** One “player height” in world units — anchor for props and obstacles */
export const H = PLAYER_WORLD_HEIGHT;
export const FEET_Y = SKATE_FEET_Y;

export function h(ratio) {
  return H * ratio;
}

/** Alias — avoids clashing with canvas height variables named `h` */
export const worldH = h;

/** Centre Y for a billboard standing on the promenade (feet at y ≈ 0) */
export function groundCenterY(height) {
  return height * 0.5;
}
