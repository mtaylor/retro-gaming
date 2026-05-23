// Vintage Cluedo–style board (family rooms). Server source of truth.

export const COLS = 25;
export const ROWS = 25;

/** @typedef {{ row: number, col: number }} Pos */

export const SECRET_PASSAGES = [
  ['kitchen', 'living-room'],
  ['henrys-bedroom', 'utility-room'],
];

/** Dedicated outer-corridor starts (classic red semicircle positions). */
export const START_SPOTS = [
  { index: 0, row: 1, col: 2, label: 'START' },
  { index: 1, row: 1, col: 22, label: 'START' },
  { index: 2, row: 23, col: 2, label: 'START' },
  { index: 3, row: 23, col: 22, label: 'START' },
  { index: 4, row: 12, col: 1, label: 'START' },
];

export const START_POSITIONS = START_SPOTS.map((s) => ({ row: s.row, col: s.col }));

/**
 * Irregular room footprints (grid cells). door = hallway entry; label = name tile.
 */
export const ROOM_DEFS = [
  {
    id: 'henrys-bedroom',
    door: { row: 6, col: 8 },
    label: { row: 3, col: 4 },
    cells: lShapeTopLeft(2, 3, 4, 4),
  },
  {
    id: 'eleanors-bedroom',
    door: { row: 6, col: 16 },
    label: { row: 3, col: 19 },
    cells: lShapeTopRight(2, 16, 4, 4),
  },
  {
    id: 'dads-office',
    door: { row: 11, col: 5 },
    label: { row: 9, col: 3 },
    cells: lShapeTopLeft(8, 2, 4, 4),
  },
  {
    id: 'utility-room',
    door: { row: 11, col: 19 },
    label: { row: 9, col: 20 },
    cells: lShapeTopRight(8, 17, 4, 4),
  },
  {
    id: 'kitchen',
    door: { row: 18, col: 8 },
    label: { row: 20, col: 4 },
    cells: lShapeBottomLeft(17, 2, 4, 4),
  },
  {
    id: 'living-room',
    door: { row: 18, col: 16 },
    label: { row: 20, col: 19 },
    cells: lShapeBottomRight(17, 17, 4, 4),
  },
];

const PLANT_CELLS = cellRect(11, 11, 3, 3);

function cellRect(row, col, h, w) {
  const out = [];
  for (let r = row; r < row + h; r++) {
    for (let c = col; c < col + w; c++) {
      out.push({ row: r, col: c });
    }
  }
  return out;
}

function lShapeTopLeft(row, col, leg, arm) {
  return cellRect(row, col, leg, arm).concat(cellRect(row + leg - 2, col, 2, 2));
}

function lShapeTopRight(row, col, leg, arm) {
  return cellRect(row, col, leg, arm).concat(cellRect(row + leg - 2, col + arm - 2, 2, 2));
}

function lShapeBottomLeft(row, col, leg, arm) {
  return cellRect(row, col, leg, arm).concat(cellRect(row, col, 2, 2));
}

function lShapeBottomRight(row, col, leg, arm) {
  return cellRect(row, col, leg, arm).concat(cellRect(row, col + arm - 2, 2, 2));
}

function key(row, col) {
  return `${row},${col}`;
}

function buildCellMap() {
  const cells = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ type: 'blocked' }))
  );

  // Playable interior defaults to hallway (fills gaps between rooms).
  for (let r = 1; r < ROWS - 1; r++) {
    for (let c = 1; c < COLS - 1; c++) {
      cells[r][c] = { type: 'hall' };
    }
  }

  // Outer rim = vintage green border (not walkable).
  for (let c = 0; c < COLS; c++) {
    cells[0][c] = { type: 'border' };
    cells[ROWS - 1][c] = { type: 'border' };
  }
  for (let r = 0; r < ROWS; r++) {
    cells[r][0] = { type: 'border' };
    cells[r][COLS - 1] = { type: 'border' };
  }

  const labelKeys = new Set();

  for (const room of ROOM_DEFS) {
    for (const { row, col } of room.cells) {
      const isLabel = room.label.row === row && room.label.col === col;
      cells[row][col] = {
        type: 'room',
        roomId: room.id,
        roomLabel: isLabel,
      };
      if (isLabel) labelKeys.add(key(row, col));
    }
    const d = room.door;
    cells[d.row][d.col] = { type: 'door', roomId: room.id };
  }

  for (const { row, col } of PLANT_CELLS) {
    cells[row][col] = { type: 'plant' };
  }

  for (const spot of START_SPOTS) {
    cells[spot.row][spot.col] = {
      type: 'start',
      startIndex: spot.index,
      startLabel: spot.label,
    };
  }

  // Ensure door-adjacent approach tiles are hall (movement graph).
  const hallBoost = [
    [5, 7], [5, 8], [5, 9], [6, 7], [7, 8],
    [5, 15], [5, 16], [5, 17], [6, 16],
    [10, 4], [11, 4], [12, 5], [10, 6],
    [10, 18], [11, 20], [12, 19],
    [17, 7], [17, 8], [18, 9], [16, 8],
    [17, 15], [17, 16], [18, 15], [16, 16],
    [1, 3], [1, 4], [1, 21], [1, 20],
    [23, 3], [23, 21], [12, 2], [12, 22],
  ];
  for (const [r, c] of hallBoost) {
    if (cells[r][c].type === 'blocked') cells[r][c] = { type: 'hall' };
  }

  // Fill any interior gap still blocked (between rooms) → hallway.
  for (let r = 1; r < ROWS - 1; r++) {
    for (let c = 1; c < COLS - 1; c++) {
      if (cells[r][c].type !== 'blocked') continue;
      const touchHall = [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dr, dc]) => {
        const t = cells[r + dr]?.[c + dc];
        return t && (t.type === 'hall' || t.type === 'door' || t.type === 'start');
      });
      if (touchHall) cells[r][c] = { type: 'hall' };
    }
  }

  return cells;
}

export const CELLS = buildCellMap();

export function getRoomDef(roomId) {
  return ROOM_DEFS.find((r) => r.id === roomId);
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
  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  const walkable = (cell) =>
    cell &&
    (cell.type === 'hall' || cell.type === 'door' || cell.type === 'start');

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
      if (!walkable(cell)) continue;
      const k = posKey(nr, nc);
      if (!visited.has(k) || visited.get(k) > dist + 1) {
        visited.set(k, dist + 1);
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
  return getValidMoves(fromRow, fromCol, steps).some(
    (m) => posKey(m.row, m.col) === doorKey
  );
}

export function getRoomDoorPosition(roomId) {
  const room = getRoomDef(roomId);
  return room ? { row: room.door.row, col: room.door.col } : null;
}

export function hasSecretPassage(roomA, roomB) {
  return SECRET_PASSAGES.some(
    ([a, b]) => (a === roomA && b === roomB) || (a === roomB && b === roomA)
  );
}
