#!/usr/bin/env node
/**
 * Run: node games/office-maze/validate-level.mjs
 * Exits 0 if the office maze is completable from start to FIKA.
 */
import {
  LEVEL,
  parseLevel,
  validateLevelCompletable,
  CUSTOMER_ROUTES,
  buildPatrolPath,
} from './maze.js';

const { grid, start, exit } = parseLevel(LEVEL);
const result = validateLevelCompletable(grid, start, exit);

if (!result.ok) {
  console.error('Maze NOT completable:');
  for (const err of result.errors) console.error(' -', err);
  process.exit(1);
}

console.log(`OK: completable in ${result.pathLength} steps (start → FIKA).`);

let routesOk = true;
CUSTOMER_ROUTES.forEach((waypoints, i) => {
  const path = buildPatrolPath(grid, waypoints);
  for (let j = 1; j < path.length; j++) {
    const step =
      Math.abs(path[j].x - path[j - 1].x) + Math.abs(path[j].y - path[j - 1].y);
    if (step !== 1) {
      console.error(`Customer route ${i} has invalid step`, path[j - 1], '→', path[j]);
      routesOk = false;
    }
  }
});
if (!routesOk) process.exit(1);
console.log('OK: customer patrol paths stay on corridors.');
