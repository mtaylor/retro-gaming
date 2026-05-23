/** Tile types for Cambio Office Maze */
export const TILE = {
  WALL: 0,
  FLOOR: 1,
  START: 2,
  EXIT: 3,
  COFFEE: 4,
  LAPTOP: 5,
  PRINTER: 6,
  MEETING: 7,
  PLANT: 8,
};

const CHAR = {
  '#': TILE.WALL,
  '.': TILE.FLOOR,
  S: TILE.START,
  E: TILE.EXIT,
  c: TILE.COFFEE,
  l: TILE.LAPTOP,
  p: TILE.PRINTER,
  g: TILE.MEETING,
  '*': TILE.PLANT,
};

/**
 * Stockholm-style open-plan office maze (Sveavägen 44 vibes).
 * Legend: # desk/wall  . floor  g glass meeting room  * plant
 *         c spilled coffee  l open laptop  p jammed printer  S start  E fika exit
 */
export const LEVEL = `
###########################
#S..g...#...#....#....#...#
#.#.#.#.#.#.#.##.#.##.#.#.#
#...c...#...l...#...p...#.#
#.###.#####.###.#.###.###.#
#.*.#.....#.....#.....#.*.#
###.#.#####.###.#####.#.###
#...#...#.....#...#...#...#
#.#.###.#.#####.#.#.###.#.#
#...#..l..#...c...#...#...#
###.#.#.###.###.#.#.###.###
#...#.#.......#...#...#...#
#.#.#.#####.###.#.#.###.#.#
#.*.#.......#............E#
###########################
`.trim();

export function parseLevel(lines) {
  const rows = lines.split('\n').map((row) =>
    row.split('').map((ch) => CHAR[ch] ?? TILE.WALL)
  );
  let start = { x: 1, y: 1 };
  let exit = { x: 1, y: 1 };

  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      if (rows[y][x] === TILE.START) {
        start = { x, y };
        rows[y][x] = TILE.FLOOR;
      }
      if (rows[y][x] === TILE.EXIT) {
        exit = { x, y };
        rows[y][x] = TILE.FLOOR;
      }
    }
  }

  return { grid: rows, width: rows[0].length, height: rows.length, start, exit };
}

/** Same rules as player movement in game.js */
export function isPassable(grid, x, y) {
  if (y < 0 || x < 0 || y >= grid.length || x >= grid[0].length) return false;
  const t = grid[y][x];
  return (
    t !== TILE.WALL &&
    t !== TILE.COFFEE &&
    t !== TILE.PRINTER
  );
}

/** Tiles customers (and pathfinding) may enter */
export function isWalkable(grid, x, y) {
  return isPassable(grid, x, y);
}

/**
 * Ensure the level can be finished from start to exit.
 * @returns {{ ok: boolean, pathLength?: number, errors: string[] }}
 */
export function validateLevelCompletable(grid, start, exit) {
  const errors = [];

  const rows = grid.map((r) => r.length);
  const w = rows[0];
  if (rows.some((len) => len !== w)) {
    errors.push('Maze rows have inconsistent widths.');
  }

  if (!isPassable(grid, start.x, start.y)) {
    errors.push('Start position is blocked.');
  }
  if (!isPassable(grid, exit.x, exit.y)) {
    errors.push('Exit position is blocked.');
  }

  const path = findPath(grid, start, exit);
  if (!path) {
    errors.push('No path from start to FIKA — maze is not completable.');
  } else {
    const passableNeighbors = [
      { x: exit.x + 1, y: exit.y },
      { x: exit.x - 1, y: exit.y },
      { x: exit.x, y: exit.y + 1 },
      { x: exit.x, y: exit.y - 1 },
    ].filter((p) => isPassable(grid, p.x, p.y));
    if (passableNeighbors.length === 0) {
      errors.push('Exit is sealed — no way to step onto FIKA.');
    }
  }

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const t = grid[y][x];
      if (t !== TILE.COFFEE && t !== TILE.PRINTER) continue;
      const canReachToInteract = [
        { x: x + 1, y },
        { x: x - 1, y },
        { x, y: y + 1 },
        { x, y: y - 1 },
      ].some((adj) => isPassable(grid, adj.x, adj.y) && findPath(grid, start, adj));
      if (!canReachToInteract) {
        errors.push(`Blocked obstacle at (${x},${y}) cannot be reached to clear.`);
      }
    }
  }

  return {
    ok: errors.length === 0,
    pathLength: path?.length,
    errors,
  };
}

/** Orthogonal BFS — only moves along valid corridors */
export function findPath(grid, start, end) {
  if (start.x === end.x && start.y === end.y) {
    return [{ x: start.x, y: start.y }];
  }

  const key = (p) => `${p.x},${p.y}`;
  const queue = [{ x: start.x, y: start.y, path: [{ x: start.x, y: start.y }] }];
  const seen = new Set([key(start)]);
  const dirs = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  ];

  while (queue.length > 0) {
    const cur = queue.shift();
    for (const d of dirs) {
      const nx = cur.x + d.x;
      const ny = cur.y + d.y;
      const k = key({ x: nx, y: ny });
      if (seen.has(k) || !isWalkable(grid, nx, ny)) continue;
      seen.add(k);
      const path = [...cur.path, { x: nx, y: ny }];
      if (nx === end.x && ny === end.y) return path;
      queue.push({ x: nx, y: ny, path });
    }
  }

  return null;
}

/** Stitch waypoint loop into one grid path (no wall cutting) */
export function buildPatrolPath(grid, waypoints) {
  if (!waypoints.length) return [];

  const full = [];
  for (let i = 0; i < waypoints.length; i++) {
    const from = waypoints[i];
    const to = waypoints[(i + 1) % waypoints.length];
    const segment = findPath(grid, from, to);
    if (!segment || segment.length === 0) continue;
    if (full.length === 0) {
      full.push(...segment);
    } else {
      full.push(...segment.slice(1));
    }
  }

  if (full.length < 2) {
    return waypoints.map((p) => ({ ...p }));
  }

  for (let i = 1; i < full.length; i++) {
    const a = full[i - 1];
    const b = full[i];
    const step = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    if (step !== 1) {
      return waypoints.map((p) => ({ ...p }));
    }
  }

  return full;
}

/** Customer patrol waypoints — BFS links each pair along corridors only */
export const CUSTOMER_ROUTES = [
  [
    { x: 2, y: 1 },
    { x: 10, y: 1 },
    { x: 2, y: 5 },
    { x: 15, y: 5 },
  ],
  [
    { x: 9, y: 5 },
    { x: 15, y: 5 },
    { x: 15, y: 9 },
    { x: 9, y: 9 },
  ],
  [
    { x: 2, y: 11 },
    { x: 13, y: 11 },
    { x: 13, y: 13 },
    { x: 24, y: 13 },
    { x: 24, y: 11 },
  ],
];

const _parsed = parseLevel(LEVEL);
const _validation = validateLevelCompletable(
  _parsed.grid,
  _parsed.start,
  _parsed.exit
);
if (!_validation.ok) {
  throw new Error(
    `Office maze level invalid: ${_validation.errors.join(' ')}`
  );
}
