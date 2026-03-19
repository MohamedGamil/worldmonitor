import type { NavalActivitySnapshot } from '@/types';
import { createCircuitBreaker } from '@/utils';

const ENDPOINT = '/api/naval-activity';
const LOCAL_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const breaker = createCircuitBreaker<NavalActivitySnapshot | null>({
  name: 'Naval Activity',
  maxFailures: 3,
  cooldownMs: 5 * 60 * 1000,
  cacheTtlMs: 10 * 60 * 1000,
});

let cachedSnapshot: NavalActivitySnapshot | null = null;
let cachedAt = 0;
let lastFetchMeta: { timestamp: number; source: string; vesselCount: number; csgCount: number } | null = null;

export async function fetchNavalActivity(): Promise<NavalActivitySnapshot | null> {
  const now = Date.now();
  if (cachedSnapshot && now - cachedAt < LOCAL_CACHE_TTL) {
    return cachedSnapshot;
  }

  const snapshot = await breaker.execute(async () => {
    const res = await fetch(ENDPOINT, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`/api/naval-activity returned ${res.status}`);

    const data = await res.json() as NavalActivitySnapshot;
    const xCache = res.headers.get('X-Cache') || 'UNKNOWN';

    lastFetchMeta = {
      timestamp: Date.now(),
      source: xCache,
      vesselCount: data.vessels?.length ?? 0,
      csgCount: data.strikeGroups?.length ?? 0,
    };

    return data;
  }, null);

  if (snapshot) {
    cachedSnapshot = snapshot;
    cachedAt = now;
  }

  return snapshot;
}

export function getNavalActivityStatus() {
  return lastFetchMeta;
}

export function clearNavalActivityCache(): void {
  cachedSnapshot = null;
  cachedAt = 0;
  lastFetchMeta = null;
}
