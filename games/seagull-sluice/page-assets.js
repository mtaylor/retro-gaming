function detectPagesBase() {
  const { hostname, pathname } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return '';
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0) return `/${segments[0]}`;
  return '';
}

export function siteHref(pathFromRepoRoot) {
  const normalized = pathFromRepoRoot.replace(/^\//, '');
  const base = detectPagesBase();
  if (!base) return `/${normalized}`;
  return `${base}/${normalized}`;
}

export function gameHref(relativePath) {
  return new URL(relativePath.replace(/^\//, ''), import.meta.url).href;
}
