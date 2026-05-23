export function resolveAsset(relativePath) {
  const clean = relativePath.replace(/^\//, '');
  return new URL(clean, import.meta.url).href;
}
