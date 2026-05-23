/** Resolve paths relative to the skatebow game folder (works locally and on GitHub Pages). */
export function resolveSkatebowAsset(relativePath) {
  const clean = relativePath.replace(/^\//, '');
  return new URL(clean, import.meta.url).href;
}
