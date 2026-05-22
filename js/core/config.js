/**
 * Base path for GitHub project Pages (e.g. /retro-gaming).
 * Empty string when running locally.
 */
function detectBasePath() {
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

export const BASE_PATH = detectBasePath();

/** Resolve a site-relative path for links and assets. */
export function asset(path) {
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  if (!BASE_PATH) {
    return `/${normalized}`;
  }
  return `${BASE_PATH}/${normalized}`;
}
