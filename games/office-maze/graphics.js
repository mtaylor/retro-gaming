/**
 * SNES-inspired pixel art drawing helpers (16-bit RPG office look).
 */

export const C = {
  outline: '#1a1428',
  shadow: '#00000055',
  floorA: '#d4c4a8',
  floorB: '#c4b498',
  floorHi: '#ebe0cc',
  floorLo: '#9a8868',
  deskTop: '#8b7355',
  deskMid: '#6b5344',
  deskLo: '#4a3828',
  deskHi: '#a89070',
  glass: '#88c8e8',
  glassHi: '#b8e8ff',
  glassLo: '#4888a8',
  plant: '#38a048',
  plantLo: '#206028',
  plantHi: '#68d070',
  pot: '#a06830',
  coffee: '#4a2818',
  coffeeHi: '#7a4830',
  laptop: '#384858',
  screen: '#58b8e8',
  screenHi: '#98e8ff',
  printer: '#585858',
  printerHi: '#888888',
  cambio: '#ba0020',
  cambioLo: '#780018',
  cambioHi: '#e83848',
  skin: '#f0c0a0',
  skinSh: '#c89070',
  shirt: '#f8f8f8',
  shirtSh: '#c8c8d0',
  suit: '#384860',
  suitHi: '#5878a0',
  customer: '#e8a030',
  customerSh: '#a06018',
  fika: '#ba0020',
  fikaHi: '#ff4858',
  window: '#fff0c8',
  windowHi: '#ffffe8',
};

/** @param {CanvasRenderingContext2D} ctx */
export function setupSnesContext(ctx) {
  ctx.imageSmoothingEnabled = false;
}

/** @param {CanvasRenderingContext2D} ctx */
function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
}

/** @param {CanvasRenderingContext2D} ctx */
export function drawFloor(ctx, px0, py0, size, checker) {
  const base = checker ? C.floorA : C.floorB;
  px(ctx, px0, py0, size, size, base);
  px(ctx, px0, py0, size, 2, C.floorHi);
  px(ctx, px0, py0 + size - 2, size, 2, C.floorLo);
  if (checker) {
    px(ctx, px0 + size - 3, py0 + 2, 2, 2, C.floorHi);
  }
}

/** @param {CanvasRenderingContext2D} ctx */
export function drawDesk(ctx, px0, py0, size) {
  px(ctx, px0, py0, size, size, C.deskLo);
  px(ctx, px0 + 2, py0 + 2, size - 4, size - 8, C.deskTop);
  px(ctx, px0 + 2, py0 + 2, size - 4, 3, C.deskHi);
  px(ctx, px0 + 4, py0 + size - 10, size - 8, 8, C.deskMid);
  px(ctx, px0 + 2, py0 + size - 4, size - 4, 4, C.outline);
  px(ctx, px0 + 6, py0 + 8, size - 12, 4, C.deskMid);
}

/** @param {CanvasRenderingContext2D} ctx */
export function drawMeeting(ctx, px0, py0, size) {
  drawFloor(ctx, px0, py0, size, true);
  px(ctx, px0 + 3, py0 + 3, size - 6, size - 6, C.glass);
  px(ctx, px0 + 4, py0 + 4, size - 8, 3, C.glassHi);
  px(ctx, px0 + 3, py0 + 3, 2, size - 6, C.glassLo);
  px(ctx, px0 + size - 5, py0 + 3, 2, size - 6, C.glassLo);
  px(ctx, px0 + 3, py0 + size - 5, size - 6, 2, C.glassLo);
}

/** @param {CanvasRenderingContext2D} ctx */
export function drawPlant(ctx, px0, py0, size) {
  drawFloor(ctx, px0, py0, size, false);
  px(ctx, px0 + 10, py0 + 20, 12, 10, C.pot);
  px(ctx, px0 + 12, py0 + 22, 8, 6, C.deskHi);
  px(ctx, px0 + 8, py0 + 8, 16, 14, C.plant);
  px(ctx, px0 + 10, py0 + 6, 10, 8, C.plantHi);
  px(ctx, px0 + 14, py0 + 12, 6, 6, C.plantLo);
}

/** @param {CanvasRenderingContext2D} ctx */
export function drawCoffee(ctx, px0, py0, size) {
  drawFloor(ctx, px0, py0, size, true);
  px(ctx, px0 + 6, py0 + 14, 16, 12, C.coffee);
  px(ctx, px0 + 8, py0 + 12, 12, 6, C.coffeeHi);
  px(ctx, px0 + 10, py0 + 18, 8, 4, C.outline);
}

/** @param {CanvasRenderingContext2D} ctx */
export function drawLaptop(ctx, px0, py0, size) {
  drawFloor(ctx, px0, py0, size, false);
  px(ctx, px0 + 8, py0 + 18, 16, 8, C.laptop);
  px(ctx, px0 + 10, py0 + 10, 12, 10, C.screen);
  px(ctx, px0 + 11, py0 + 11, 8, 6, C.screenHi);
  px(ctx, px0 + 8, py0 + 24, 16, 2, C.outline);
}

/** @param {CanvasRenderingContext2D} ctx */
export function drawPrinter(ctx, px0, py0, size) {
  drawFloor(ctx, px0, py0, size, true);
  px(ctx, px0 + 8, py0 + 10, 14, 16, C.printer);
  px(ctx, px0 + 10, py0 + 8, 10, 5, C.printerHi);
  px(ctx, px0 + 12, py0 + 6, 6, 3, C.cambio);
  px(ctx, px0 + 10, py0 + 18, 10, 4, C.outline);
}

/** @param {CanvasRenderingContext2D} ctx */
export function drawFika(ctx, px0, py0, size) {
  drawFloor(ctx, px0, py0, size, true);
  px(ctx, px0 + 4, py0 + 8, size - 8, 14, C.fika);
  px(ctx, px0 + 6, py0 + 10, size - 12, 4, C.fikaHi);
  ctx.fillStyle = C.shirt;
  ctx.font = 'bold 8px monospace';
  ctx.fillText('FIKA', px0 + 5, py0 + 22);
}

/** @param {CanvasRenderingContext2D} ctx */
export function drawWindowStrip(ctx, px0, py0, size) {
  px(ctx, px0, py0, size, size, C.window);
  px(ctx, px0 + 2, py0 + 2, size - 4, 3, C.windowHi);
  px(ctx, px0 + 4, py0 + 10, 2, size - 14, C.glassLo);
}

/** @param {CanvasRenderingContext2D} ctx */
export function drawCharacter(ctx, cx, cy, size, type, facing) {
  const s = size;
  const ox = cx - s / 2;
  const oy = cy - s / 2;
  const isPlayer = type === 'player';
  const body = isPlayer ? C.cambio : C.suit;
  const bodyLo = isPlayer ? C.cambioLo : C.suit;
  const bodyHi = isPlayer ? C.cambioHi : C.suitHi;
  const head = isPlayer ? C.skin : C.customer;
  const headLo = isPlayer ? C.skinSh : C.customerSh;

  px(ctx, ox + 4, oy + 14, s - 8, s - 10, bodyLo);
  px(ctx, ox + 5, oy + 13, s - 10, s - 12, body);
  px(ctx, ox + 6, oy + 14, s - 12, 3, bodyHi);

  if (isPlayer) {
    px(ctx, ox + 7, oy + 16, s - 14, 6, C.shirt);
    px(ctx, ox + 8, oy + 17, 2, 4, C.shirtSh);
  } else {
    px(ctx, ox + 8, oy + 15, s - 16, 4, C.customer);
    ctx.fillStyle = C.shirt;
    ctx.font = 'bold 7px monospace';
    ctx.fillText('?', ox + s / 2 - 3, oy + 12);
  }

  const headY = facing === 'up' ? oy + 2 : oy + 4;
  px(ctx, ox + 6, headY, s - 12, 10, headLo);
  px(ctx, ox + 7, headY + 1, s - 14, 8, head);
  px(ctx, ox + 8, headY + 2, 3, 2, C.shirt);

  if (facing === 'down') {
    px(ctx, ox + s - 10, headY + 4, 3, 2, C.outline);
    px(ctx, ox + 8, headY + 4, 3, 2, C.outline);
  }

  px(ctx, ox + 4, oy + s - 4, s - 8, 2, C.outline);
  px(ctx, ox + 4, oy + 4, 2, s - 8, C.outline);
  px(ctx, ox + s - 6, oy + 4, 2, s - 8, C.outline);
}

/** @param {CanvasRenderingContext2D} ctx */
export function drawHudBanner(ctx, w, text) {
  px(ctx, 0, 0, w, 40, '#283048');
  px(ctx, 0, 0, w, 2, C.floorHi);
  px(ctx, 0, 38, w, 2, C.outline);
  ctx.fillStyle = C.shirt;
  ctx.font = 'bold 10px monospace';
  ctx.fillText(text, 10, 24);
}
