export function resolveAsset(relativePath) {
  return new URL(relativePath.replace(/^\//, ''), import.meta.url).href;
}
