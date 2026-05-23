/** Playable / suspect characters — sprites from repo sprites/*.zip */
export const CHARACTERS = [
  { id: 'dad', name: 'Dad', emoji: '👨', color: '#c62828' },
  { id: 'mam', name: 'Mam', emoji: '👩', color: '#1565c0' },
  { id: 'henry', name: 'Henry', emoji: '👦', color: '#2e7d32' },
  { id: 'eleanor', name: 'Eleanor', emoji: '👧', color: '#ad1457' },
  { id: 'cleaner', name: 'Cleaner', emoji: '🧹', color: '#6a1b9a' },
];

const spriteCache = new Map();

export function characterSpriteUrl(characterId) {
  if (!characterId || spriteCache.has(characterId)) {
    return spriteCache.get(characterId) ?? '';
  }
  try {
    const url = new URL(`../assets/characters/${characterId}.png`, import.meta.url).href;
    spriteCache.set(characterId, url);
    return url;
  } catch {
    return '';
  }
}

export function getCharacter(id) {
  return CHARACTERS.find((c) => c.id === id);
}
