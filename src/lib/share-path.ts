/** Read the single share-id segment without accepting nested paths. */
export function shareIdFromPath(pathname: string): string {
  const match = /^\/s\/([^/]+)\/?$/.exec(pathname);
  if (!match) return "";
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return "";
  }
}
