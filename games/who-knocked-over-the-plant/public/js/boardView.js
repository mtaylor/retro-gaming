import { ROOM_LABELS } from './data.js';

export function renderBoard(gameState, privateState, moveOptions, onCellClick) {
  if (!gameState?.board) return '';

  const { cols, rows, rooms, cells } = gameState.board;
  const players = gameState.players || [];
  const myId = privateState?.playerId;
  const isMyTurn = gameState.currentPlayerId === myId;

  const highlightSet = new Set();
  if (moveOptions?.options) {
    for (const o of moveOptions.options) {
      if (o.type === 'hall') highlightSet.add(`${o.row},${o.col}`);
      if (o.type === 'enter') {
        const room = rooms.find(r => r.id === o.roomId);
        if (room) highlightSet.add(`${room.door.row},${room.door.col}`);
      }
    }
  }

  let gridHtml = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = cells[r][c];
      if (!cell) continue;

      let cls = `cell cell-${cell.type}`;
      if (highlightSet.has(`${r},${c}`)) cls += ' reachable';
      if (cell.type === 'plant') cls += ' plant-cell';

      const tokens = players.filter(p => !p.inRoom && p.position?.row === r && p.position?.col === c);
      const tokenHtml = tokens.map(p =>
        `<span class="token" style="background:${p.color}" title="${p.name}">${p.name[0]}</span>`
      ).join('');

      const clickable = isMyTurn && highlightSet.has(`${r},${c}`);
      const click = clickable ? `onclick="window.gameActions.moveHall(${r},${c})"` : '';

      gridHtml += `<div class="${cls}" style="grid-row:${r+1};grid-column:${c+1}" ${click}>${tokenHtml}</div>`;
    }
  }

  const roomHtml = rooms.map(room => {
    const inRoom = players.filter(p => p.inRoom === room.id);
    const tokens = inRoom.map(p =>
      `<span class="token in-room" style="background:${p.color}" title="${p.name}">${p.name[0]}</span>`
    ).join('');

    const canEnter = isMyTurn && moveOptions?.options?.some(o => o.type === 'enter' && o.roomId === room.id);
    const click = canEnter ? `onclick="window.gameActions.enterRoom('${room.id}')"` : '';
    const enterCls = canEnter ? ' can-enter' : '';

    return `
      <div class="room-area room-${room.id}${enterCls}" style="
        grid-row: ${room.row + 1} / span ${room.h};
        grid-column: ${room.col + 1} / span ${room.w};
      " ${click}>
        <span class="room-label">${ROOM_LABELS[room.id] || room.id}</span>
        <div class="room-tokens">${tokens}</div>
      </div>`;
  }).join('');

  return `
    <div class="board-wrapper">
      <div class="board-grid" style="grid-template-rows: repeat(${rows}, 1fr); grid-template-columns: repeat(${cols}, 1fr);">
        ${gridHtml}
        ${roomHtml}
      </div>
      ${isMyTurn && moveOptions?.inRoom ? renderInRoomOptions(moveOptions) : ''}
    </div>`;
}

function renderInRoomOptions(moveOptions) {
  const opts = moveOptions.options || [];
  return `
    <div class="in-room-actions">
      ${opts.map(o => {
        if (o.type === 'stay') return `<button class="btn btn-sm" onclick="window.gameActions.stayRoom()">Stay in room</button>`;
        if (o.type === 'secret') return `<button class="btn btn-sm btn-secret" onclick="window.gameActions.secretPassage('${o.roomId}')">Secret passage → ${ROOM_LABELS[o.roomId]}</button>`;
        return '';
      }).join('')}
    </div>`;
}
