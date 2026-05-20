const store = new Map<string, { value: string; expiresAt: number }>();

export async function getOrFetch(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<string>,
): Promise<string> {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expiresAt > now) {
    console.log(`[cache] HIT ${key}`);
    return hit.value;
  }

  if (hit) {
    store.delete(key);
  }

  const value = await fn();
  store.set(key, { value, expiresAt: now + ttlSeconds * 1000 });
  return value;
}
