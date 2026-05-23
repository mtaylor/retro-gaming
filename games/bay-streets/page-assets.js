function detectPagesBase() {
  const { hostname, pathname } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return '';
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0) return `/${segments[0]}`;
  return '';
}

export function siteHref(path) {
  const n = path.replace(/^\//, '');
  const base = detectPagesBase();
  return base ? `${base}/${n}` : `/${n}`;
}

export function gameHref(path) {
  return new URL(path.replace(/^\//, ''), import.meta.url).href;
}
