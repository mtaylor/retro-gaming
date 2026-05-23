export const SUSPECTS = [
  { id: 'dad', name: 'Dad', emoji: '👨', color: '#e53935' },
  { id: 'mam', name: 'Mam', emoji: '👩', color: '#1e88e5' },
  { id: 'eleanor', name: 'Eleanor', emoji: '👧', color: '#ec407a' },
  { id: 'henry', name: 'Henry', emoji: '👦', color: '#43a047' },
  { id: 'buttons', name: 'Buttons', emoji: '🐾', color: '#fb8c00' },
  { id: 'joanna', name: 'Joanna', emoji: '🤖', color: '#8e24aa' },
];

export const ITEMS = [
  { id: 'tennis-ball', name: 'Tennis Ball', emoji: '🎾' },
  { id: 'duster', name: 'Duster', emoji: '🧹' },
  { id: 'football', name: 'Football', emoji: '⚽' },
  { id: 'frying-pan', name: 'Frying Pan', emoji: '🍳' },
  { id: 'chair', name: 'Chair', emoji: '🪑' },
  { id: 'toilet-plunger', name: 'Toilet Plunger', emoji: '🪠' },
];

export const ROOMS = [
  { id: 'kitchen', name: 'Kitchen', emoji: '🍽️', short: 'Kitchen' },
  { id: 'living-room', name: 'Living Room', emoji: '🛋️', short: 'Living Rm' },
  { id: 'eleanors-bedroom', name: "Eleanor's Bedroom", emoji: '🛏️', short: 'Eleanor' },
  { id: 'henrys-bedroom', name: "Henry's Bedroom", emoji: '🛏️', short: 'Henry' },
  { id: 'dads-office', name: "Dad's Office", emoji: '💼', short: 'Dad Office' },
  { id: 'utility-room', name: 'Utility Room', emoji: '🧺', short: 'Utility' },
];

export const PLAYER_COLORS = ['#ef5350', '#42a5f5', '#66bb6a', '#ffca28', '#ec407a', '#ab47bc'];

export const FAMILY_CLUES = [
  { text: '🌱 Mud on the floor matches the Kitchen!', eliminates: { type: 'room', ids: ['living-room', 'eleanors-bedroom', 'henrys-bedroom', 'dads-office', 'utility-room'] } },
  { text: '🌱 Mam heard a loud THWACK from upstairs!', eliminates: { type: 'room', ids: ['kitchen', 'living-room', 'utility-room'] } },
  { text: '🌱 Dad\'s coffee was still warm — it happened recently!', eliminates: null },
  { text: '🌱 Paw prints near the plant — but whose paws?', eliminates: null },
  { text: '🌱 Joanna was charging in the Utility Room. Or was she?', eliminates: { type: 'suspect', ids: ['joanna'] } },
  { text: '🌱 A tennis ball behind the sofa — probably not the weapon.', eliminates: { type: 'item', ids: ['tennis-ball'] } },
  { text: '🌱 Henry swears he was reading. Eleanor disagrees.', eliminates: null },
  { text: '🌱 The frying pan has a suspicious dent.', eliminates: null },
  { text: '🌱 Buttons has soil on his nose. Guilty paws?', eliminates: null },
  { text: '🌱 Eleanor\'s door was shut. Very shut. Too shut.', eliminates: null },
];

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createSolution() {
  return {
    suspect: { type: 'suspect', id: SUSPECTS[Math.floor(Math.random() * SUSPECTS.length)].id },
    item: { type: 'item', id: ITEMS[Math.floor(Math.random() * ITEMS.length)].id },
    room: { type: 'room', id: ROOMS[Math.floor(Math.random() * ROOMS.length)].id },
  };
}

export function buildDeck(solution) {
  const skip = new Set([`suspect:${solution.suspect.id}`, `item:${solution.item.id}`, `room:${solution.room.id}`]);
  const deck = [];
  for (const s of SUSPECTS) if (!skip.has(`suspect:${s.id}`)) deck.push({ type: 'suspect', id: s.id });
  for (const i of ITEMS) if (!skip.has(`item:${i.id}`)) deck.push({ type: 'item', id: i.id });
  for (const r of ROOMS) if (!skip.has(`room:${r.id}`)) deck.push({ type: 'room', id: r.id });
  return shuffle(deck);
}

export function dealCards(deck, n) {
  const hands = Array.from({ length: n }, () => []);
  deck.forEach((c, i) => hands[i % n].push(c));
  return hands;
}

export function pickFamilyClue(solution) {
  const sol = { suspect: solution.suspect.id, item: solution.item.id, room: solution.room.id };
  const ok = FAMILY_CLUES.filter(c => !c.eliminates || !c.eliminates.ids.includes(sol[c.eliminates.type]));
  const pool = ok.length ? ok : FAMILY_CLUES.filter(c => !c.eliminates);
  return pool[Math.floor(Math.random() * pool.length)];
}

export function findMatchingCards(hand, suspectId, itemId, roomId) {
  const m = [];
  if (hand.some(c => c.type === 'suspect' && c.id === suspectId)) m.push({ type: 'suspect', id: suspectId });
  if (hand.some(c => c.type === 'item' && c.id === itemId)) m.push({ type: 'item', id: itemId });
  if (hand.some(c => c.type === 'room' && c.id === roomId)) m.push({ type: 'room', id: roomId });
  return m;
}

export function getCardLabel(card) {
  const map = { suspect: SUSPECTS, item: ITEMS, room: ROOMS };
  const e = map[card.type]?.find(x => x.id === card.id);
  return e ? `${e.emoji} ${e.name}` : card.id;
}

export function getEliminationsFromClue(clue) {
  if (!clue?.eliminates) return [];
  return clue.eliminates.ids.map(id => ({ type: clue.eliminates.type, id }));
}

export function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
