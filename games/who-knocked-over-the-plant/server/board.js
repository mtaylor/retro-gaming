// Cluedo-style board: 15 columns × 16 rows

export const COLS = 15;
export const ROWS = 16;

export const ROOM_DEFS = [
  { id: 'henrys-bedroom',   row: 0, col: 0,  h: 4, w: 4, door: { row: 3, col: 1 } },
  { id: 'eleanors-bedroom', row: 0, col: 11, h: 4, w: 4, door: { row: 3, col: 13 } },
  { id: 'dads-office',      row: 5, col: 0,  h: 3, w: 4, door: { row: 6, col: 3 } },
  { id: 'utility-room',     row: 5, col: 11, h: 3, w: 4, door: { row: 6, col: 11 } },
  { id: 'kitchen',          row: 12, col: 0, h: 4, w: 4, door: { row: 12, col: 1 } },
  { id: 'living-room',      row: 12, col: 11, h: 4, w: 4, door: { row: 12, col: 13 } },
];

export const SECRET_PASSAGES = [
  ['kitchen', 'living-room'],
  ['henrys-bedroom', 'utility-room'],
];

export const START_POSITIONS = [
  { row: 6, col: 7 },
  { row: 6, col: 8 },
  { row: 8, col: 7 },
  { row: 8, col: 8 },
  { row: 5, col: 7 },
  { row: 5, col: 8 },
];

function buildCellMap() {
  const cells = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

  for (const room of ROOM_DEFS) {
    for (let r = room.row; r < room.row + room.h; r++) {
      for (let c = room.col; c < room.col + room.w; c++) {
        cells[r][c] = { type: 'room', roomId: room.id };
      }
    }
    cells[room.door.row][room.door.col] = { type: 'door', roomId: room.id };
  }

  const hallTiles = [];

  // Top horizontal hallway (row 4)
  for (let c = 0; c < COLS; c++) hallTiles.push([4, c]);
  // Bottom horizontal hallway (row 11)
  for (let c = 0; c < COLS; c++) hallTiles.push([11, c]);
  // Left vertical (col 4)
  for (let r = 4; r <= 11; r++) hallTiles.push([r, 4]);
  // Right vertical (col 10)
  for (let r = 4; r <= 11; r++) hallTiles.push([r, 10]);
  // Centre cross
  for (let c = 5; c <= 9; c++) { hallTiles.push([7, c]); hallTiles.push([8, c]); }
  for (let r = 5; r <= 10; r++) { hallTiles.push([r, 7]); hallTiles.push([r, 8]); }

  // Door approach tiles
  hallTiles.push([4, 1], [4, 13], [6, 3], [6, 11], [11, 1], [11, 13]);

  for (const [r, c] of hallTiles) {
    if (cells[r]?.[c] === null) cells[r][c] = { type: 'hall' };
  }

  cells[7][7] = { type: 'plant' };

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (cells[r][c] === null) cells[r][c] = { type: 'blocked' };
    }
  }

  return cells;
}

export const CELLS = buildCellMap();

export function getRoomDef(roomId) {
  return ROOM_DEFS.find(r => r.id === roomId);
}

export function posKey(row, col) {
  return `${row},${col}`;
}

export function getValidMoves(fromRow, fromCol, steps, blocked = new Set()) {
  if (steps <= 0) return [];

  const visited = new Map();
  const queue = [{ row: fromRow, col: fromCol, dist: 0 }];
  visited.set(posKey(fromRow, fromCol), 0);
  const results = [];
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  while (queue.length) {
    const { row, col, dist } = queue.shift();
    if (dist > 0 && dist <= steps && !blocked.has(posKey(row, col))) {
      results.push({ row, col, dist });
    }
    if (dist >= steps) continue;

    for (const [dr, dc] of dirs) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
      const cell = CELLS[nr][nc];
      if (!cell || (cell.type !== 'hall' && cell.type !== 'door')) continue;
      const key = posKey(nr, nc);
      if (!visited.has(key) || visited.get(key) > dist + 1) {
        visited.set(key, dist + 1);
        queue.push({ row: nr, col: nc, dist: dist + 1 });
      }
    }
  }
  return results;
}

export function canEnterRoom(fromRow, fromCol, roomId, steps) {
  const room = getRoomDef(roomId);
  if (!room) return false;
  const doorKey = posKey(room.door.row, room.door.col);
  return getValidMoves(fromRow, fromCol, steps).some(m => posKey(m.row, m.col) === doorKey);
}

export function getRoomDoorPosition(roomId) {
  const room = getRoomDef(roomId);
  return room ? { row: room.door.row, col: room.door.col } : null;
}

export function hasSecretPassage(roomA, roomB) {
  return SECRET_PASSAGES.some(([a, b]) => (a === roomA && b === roomB) || (a === roomB && b === roomA));
}
