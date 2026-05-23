import { ROOM_LABELS } from './data.js';
import { characterSpriteUrl } from './characters.js';

const PLANT_IMG = new URL('../assets/knocked-over-plant.svg', import.meta.url).href;

function renderToken(player) {
  const src = characterSpriteUrl(player.characterId);
  const title = player.name;
  if (src) {
    return `<img class="token-sprite" src="${src}" alt="${title}" title="${title}" style="--token-ring:${player.color}">`;
  }
  return `<span class="token token-fallback" style="background:${player.color}" title="${title}">${player.name[0]}</span>`;
}

export function renderBoard(gameState, privateState, moveOptions) {
  if (!gameState?.board) return '';

  const { cols, rows, cells } = gameState.board;
  const players = gameState.players || [];
  const isMyTurn = gameState.currentPlayerId === privateState?.playerId;

  const highlightSet = new Set();
  if (moveOptions?.options) {
    for (const o of moveOptions.options) {
      if (o.type === 'hall' || o.type === 'start') {
        highlightSet.add(`${o.row},${o.col}`);
      }
      if (o.type === 'enter') {
        const door = gameState.board.rooms?.find((r) => r.id === o.roomId)?.door;
        if (door) highlightSet.add(`${door.row},${door.col}`);
      }
    }
  }

  let gridHtml = '';
  let plantPlaced = false;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = cells[r]?.[c];
      if (!cell) continue;
      if (cell.type === 'border') {
        gridHtml += `<div class="cell cell-border" style="grid-row:${r + 1};grid-column:${c + 1}"></div>`;
        continue;
      }
      if (cell.type === 'plant' && !(r === 11 && c === 11)) continue;

      let cls = `cell cell-${cell.type}`;
      if (cell.roomId) cls += ` room-${cell.roomId}`;
      if ((r + c) % 2 === 0 && (cell.type === 'hall' || cell.type === 'start')) cls += ' hall-a';
      if (highlightSet.has(`${r},${c}`)) cls += ' reachable';
      if (cell.type === 'door') cls += ' cell-door';

      let inner = '';

      if (cell.type === 'plant' && !plantPlaced && r === 11 && c === 11) {
        inner = `<img class="plant-art" src="${PLANT_IMG}" alt="Knocked over plant">`;
        plantPlaced = true;
        cls += ' plant-center';
      }

      if (cell.roomLabel && cell.roomId) {
        inner += `<span class="room-label">${ROOM_LABELS[cell.roomId] || cell.roomId}</span>`;
      }

      const onBoard = players.filter(
        (p) => !p.inRoom && p.position?.row === r && p.position?.col === c
      );
      const inThisRoom = cell.roomId
        ? players.filter((p) => p.inRoom === cell.roomId && (cell.type === 'door' || cell.roomLabel))
        : [];
      const tokenHtml = [...onBoard, ...inThisRoom]
        .map((p) => renderToken(p))
        .join('');

      const clickable =
        isMyTurn &&
        highlightSet.has(`${r},${c}`) &&
        (cell.type === 'hall' || cell.type === 'start' || cell.type === 'door');
      const click =
        clickable && cell.type !== 'door'
          ? `onclick="window.gameActions.moveHall(${r},${c})"`
          : '';
      const doorClick =
        clickable && cell.type === 'door'
          ? `onclick="window.gameActions.enterRoom('${cell.roomId}')"`
          : '';

      const span =
        cell.type === 'plant' && r === 11 && c === 11
          ? 'grid-row:12 / span 3; grid-column:12 / span 3;'
          : `grid-row:${r + 1};grid-column:${c + 1};`;
      gridHtml += `<div class="${cls}" style="${span}" ${click || doorClick}>${inner}${tokenHtml}</div>`;
    }
  }

  return `
    <div class="board-wrapper board-cluedo">
      <div class="board-camera">
        <div class="board-floor-shadow" aria-hidden="true"></div>
        <div class="board-grid board-grid-cluedo" style="grid-template-rows: repeat(${rows}, 1fr); grid-template-columns: repeat(${cols}, 1fr);">
          ${gridHtml}
        </div>
      </div>
      ${isMyTurn && moveOptions?.inRoom ? renderInRoomOptions(moveOptions) : ''}
    </div>`;
}

function renderInRoomOptions(moveOptions) {
  const opts = moveOptions.options || [];
  return `
    <div class="in-room-actions">
      ${opts
        .map((o) => {
          if (o.type === 'stay') {
            return `<button type="button" class="btn btn-sm" onclick="window.gameActions.stayRoom()">Stay in room</button>`;
          }
          if (o.type === 'secret') {
            return `<button type="button" class="btn btn-sm btn-secret" onclick="window.gameActions.secretPassage('${o.roomId}')">Secret passage → ${ROOM_LABELS[o.roomId]}</button>`;
          }
          return '';
        })
        .join('')}
    </div>`;
}
