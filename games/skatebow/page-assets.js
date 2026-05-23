/**
 * Resolve URLs for page.html without importing ../../js/core/config.js
 * (that path 404s when the dev server root is games/skatebow/).
 */

function detectPagesBase() {
  const { hostname, pathname } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return '';
  }
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0) {
    return `/${segments[0]}`;
  }
  return '';
}

/** Hub assets (css/site.css, index.html) — GitHub project Pages */
export function siteHref(pathFromRepoRoot) {
  const normalized = pathFromRepoRoot.replace(/^\//, '');
  const base = detectPagesBase();
  if (!base) {
    return `/${normalized}`;
  }
  return `${base}/${normalized}`;
}

/** Files next to page.html (game.js, skatebow.css, assets/…) */
export function skatebowHref(relativePath) {
  const clean = relativePath.replace(/^\//, '');
  return new URL(clean, import.meta.url).href;
}
