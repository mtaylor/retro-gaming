/** Tile types for Whitley Bay promenade */
export const TILE = {
  SEA: 0,
  SAND: 1,
  PROM: 2,
  GOAL: 3,
};

export const TILE_SIZE = 40;

/** S=sea(block), A=sand, P=promenade, G=goal */
const LAYOUT = `
SSSSSSSSSSSSGGGGSSSSSSSSSS
SSSPPPPPPPPPPPPPPPPPPSSSSS
SSSPPPPPPPPPPPPPPPPPPSSSSS
SSSPPPPPPPPPPPPPPPPPPSSSSS
SSSPPPPPPCPPPPPPPPPPPSSSSS
SSSPPPPPPPPPPPPPPPPPPSSSSS
SSSPPPPPPPPPPPPPPPPPPSSSSS
SSSPPPPPPPPPPPPPPPPPPSSSSS
SSSSPPPPPPPPPPPPPPPPPSSSSS
SSSSSPPPPPPPPPPPPPPPPSSSSS
SSSSSSPPPPPPPPPPPPPPPSSSSS
SSSSSSSPPPPPPPPPPPPPPSSSSS
SSSSSSSSPPPPPPPPPPPPPSSSSS
SSSSSSSSSPPPPPPPPPPPPSSSSS
SSSSSSSSSSPPPPPPPPPPPSSSSS
SSSSSSSSSSSPPPPPPPPPPSSSSS
`.trim().split('\n');

export const MAP_W = LAYOUT[0].length;
export const MAP_H = LAYOUT.length;
export const WORLD_W = MAP_W * TILE_SIZE;
export const WORLD_H = MAP_H * TILE_SIZE;

const CHAR_TILE = {
  S: TILE.SEA,
  A: TILE.SAND,
  P: TILE.PROM,
  G: TILE.GOAL,
  C: TILE.PROM,
};

export function buildMap() {
  const tiles = [];
  const chipSpots = [];
  let playerStart = { x: 0, y: 0 };
  let goalCenter = { x: 0, y: 0 };
  let goalCount = 0;

  for (let y = 0; y < MAP_H; y++) {
    const row = [];
    for (let x = 0; x < MAP_W; x++) {
      const ch = LAYOUT[y][x];
      if (ch === 'C') {
        row.push(TILE.PROM);
        chipSpots.push({
          x: x * TILE_SIZE + TILE_SIZE / 2,
          y: y * TILE_SIZE + TILE_SIZE / 2,
          id: chipSpots.length,
          eaten: false,
        });
      } else {
        row.push(CHAR_TILE[ch] ?? TILE.SEA);
      }
      if (ch === 'G') {
        goalCenter.x += x;
        goalCenter.y += y;
        goalCount++;
      }
    }
    tiles.push(row);
  }

  goalCenter.x = (goalCenter.x / goalCount + 0.5) * TILE_SIZE;
  goalCenter.y = (goalCenter.y / goalCount + 0.5) * TILE_SIZE;

  for (let y = MAP_H - 1; y >= 0; y--) {
    for (let x = 0; x < MAP_W; x++) {
      if (tiles[y][x] === TILE.PROM) {
        playerStart = {
          x: x * TILE_SIZE + TILE_SIZE / 2,
          y: y * TILE_SIZE + TILE_SIZE / 2,
        };
        y = -1;
        break;
      }
    }
  }

  return { tiles, chipSpots, playerStart, goalCenter, goalRadius: TILE_SIZE * 2.2 };
}

export function isWalkable(tiles, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return false;
  const t = tiles[ty][tx];
  return t === TILE.PROM || t === TILE.SAND || t === TILE.GOAL;
}

export function worldToTile(wx, wy) {
  return {
    x: Math.floor(wx / TILE_SIZE),
    y: Math.floor(wy / TILE_SIZE),
  };
}

export function collidesCircleTiles(tiles, x, y, radius) {
  const minTx = Math.floor((x - radius) / TILE_SIZE);
  const maxTx = Math.floor((x + radius) / TILE_SIZE);
  const minTy = Math.floor((y - radius) / TILE_SIZE);
  const maxTy = Math.floor((y + radius) / TILE_SIZE);
  for (let ty = minTy; ty <= maxTy; ty++) {
    for (let tx = minTx; tx <= maxTx; tx++) {
      if (!isWalkable(tiles, tx, ty)) {
        const cx = tx * TILE_SIZE + TILE_SIZE / 2;
        const cy = ty * TILE_SIZE + TILE_SIZE / 2;
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.hypot(dx, dy);
        if (dist < radius + TILE_SIZE * 0.42) return true;
      }
    }
  }
  return false;
}
