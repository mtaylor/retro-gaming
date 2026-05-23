import { REMOTE_SERVER_URL } from './deploy-config.js';

/** True when the static UI is on GitHub Pages but the game server is elsewhere */
export function isStaticHubHost() {
  const h = window.location.hostname;
  return h.endsWith('github.io') || h.endsWith('github.dev');
}

function urlFromQuery() {
  const q = new URLSearchParams(window.location.search).get('server');
  return q?.trim() ? q.replace(/\/$/, '') : null;
}

/**
 * Socket.io server URL.
 * - Same machine as UI → undefined (connect to current host)
 * - GitHub Pages → deploy-config.js or ?server=https://... for testing
 */
export function getSocketServerUrl() {
  if (!isStaticHubHost()) return undefined;

  const fromQuery = urlFromQuery();
  if (fromQuery) return fromQuery;

  if (!REMOTE_SERVER_URL?.trim()) return null;
  return REMOTE_SERVER_URL.replace(/\/$/, '');
}
