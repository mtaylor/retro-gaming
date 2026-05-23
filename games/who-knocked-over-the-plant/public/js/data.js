import { CHARACTERS } from './characters.js';

export const SUSPECTS = CHARACTERS.map((c) => ({ id: c.id, name: c.name, emoji: c.emoji }));

export const ITEMS = [
  { id: 'tennis-ball', name: 'Tennis Ball', emoji: '🎾' },
  { id: 'duster', name: 'Duster', emoji: '🧹' },
  { id: 'football', name: 'Football', emoji: '⚽' },
  { id: 'frying-pan', name: 'Frying Pan', emoji: '🍳' },
  { id: 'chair', name: 'Chair', emoji: '🪑' },
  { id: 'toilet-plunger', name: 'Toilet Plunger', emoji: '🪠' },
];

export const ROOMS = [
  { id: 'kitchen', name: 'Kitchen', emoji: '🍽️' },
  { id: 'living-room', name: 'Living Room', emoji: '🛋️' },
  { id: 'eleanors-bedroom', name: "Eleanor's Bedroom", emoji: '🛏️' },
  { id: 'henrys-bedroom', name: "Henry's Bedroom", emoji: '🛏️' },
  { id: 'dads-office', name: "Dad's Office", emoji: '💼' },
  { id: 'utility-room', name: 'Utility Room', emoji: '🧺' },
];

export const ROOM_LABELS = {
  kitchen: 'Kitchen',
  'living-room': 'Living Rm',
  'eleanors-bedroom': 'Eleanor',
  'henrys-bedroom': 'Henry',
  'dads-office': 'Dad Office',
  'utility-room': 'Utility',
};

export function getCardLabel(card) {
  const map = { suspect: SUSPECTS, item: ITEMS, room: ROOMS };
  const e = map[card?.type]?.find((x) => x.id === card?.id);
  return e ? `${e.emoji} ${e.name}` : '';
}

export function findEntry(type, id) {
  const map = { suspect: SUSPECTS, item: ITEMS, room: ROOMS };
  return map[type]?.find((x) => x.id === id);
}
