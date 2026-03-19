import type { MilitaryBase, NavalActivitySnapshot, NavalCluster } from '@/types';
import { MILITARY_BASES } from '@/config/geo';
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
const NAVAL_BASE_RE = /\b(naval|fleet|submarine|carrier|shipyard|maritime)\b/i;

function theaterFromCoords(lat: number, lon: number): string {
  if (lat <= 50 && lat >= -5 && lon <= 180 && lon >= 100) return 'Indo-Pacific';
  if (lat <= 40 && lat >= 10 && lon <= 65 && lon >= 30) return 'Middle East';
  if (lat <= 72 && lat >= 30 && lon <= 40 && lon >= -15) return 'Europe';
  if (lat <= 72 && lat >= 0 && lon <= -5 && lon >= -80) return 'Atlantic';
  return 'Global';
}

function isNavalBase(base: MilitaryBase): boolean {
  const hay = `${base.name || ''} ${base.description || ''} ${base.arm || ''}`;
  return NAVAL_BASE_RE.test(hay);
}

function buildGeoNavalClusters(existingIds: Set<string>): NavalCluster[] {
  const navalBases = MILITARY_BASES.filter(isNavalBase);
  if (navalBases.length === 0) return [];

  const buckets = new Map<string, { lat: number; lon: number; count: number; hasCarrier: boolean }>();
  for (const base of navalBases) {
    const region = theaterFromCoords(base.lat, base.lon);
    const current = buckets.get(region) || { lat: 0, lon: 0, count: 0, hasCarrier: false };
    current.lat += base.lat;
    current.lon += base.lon;
    current.count += 1;
    current.hasCarrier = current.hasCarrier || /carrier/i.test(base.name || '') || /carrier/i.test(base.description || '');
    buckets.set(region, current);
  }

  const clusters: NavalCluster[] = [];
  for (const [region, bucket] of buckets.entries()) {
    const id = `geo-naval-${region.toLowerCase().replace(/\s+/g, '-')}`;
    if (existingIds.has(id)) continue;
    clusters.push({
      id,
      name: `${region} Naval Bases`,
      lat: bucket.lat / bucket.count,
      lon: bucket.lon / bucket.count,
      vesselCount: bucket.count,
      hasCarrier: bucket.hasCarrier,
      vesselTypes: ['auxiliary'],
      region,
      activityType: 'patrol',
    });
  }
  return clusters;
}

function mergeGeoNavalIntoSnapshot(snapshot: NavalActivitySnapshot): NavalActivitySnapshot {
  const existingClusterIds = new Set(snapshot.clusters.map((c) => c.id));
  const geoClusters = buildGeoNavalClusters(existingClusterIds);
  if (geoClusters.length === 0) return snapshot;

  const warnings = Array.isArray(snapshot.sources?.warnings) ? snapshot.sources.warnings : [];
  const mergedWarnings = warnings.includes('geo-config-merged')
    ? warnings
    : [...warnings, 'geo-config-merged'];

  return {
    ...snapshot,
    clusters: [...snapshot.clusters, ...geoClusters],
    sources: {
      ...snapshot.sources,
      warnings: mergedWarnings,
    },
  };
}

function snapshotScore(snapshot: NavalActivitySnapshot | null | undefined): number {
  if (!snapshot) return 0;
  return (snapshot.vessels?.length ?? 0)
    + (snapshot.strikeGroups?.length ?? 0)
    + (snapshot.clusters?.length ?? 0);
}

function isDegradedSnapshot(snapshot: NavalActivitySnapshot): boolean {
  const score = snapshotScore(snapshot);
  const warnings = snapshot.sources?.warnings ?? [];
  return score === 0 || warnings.some((w) => /fallback active|temporarily unavailable/i.test(String(w)));
}

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

    return mergeGeoNavalIntoSnapshot(data);
  }, null, {
    // Never cache degraded/empty payloads inside circuit-breaker cache.
    shouldCache: (value) => Boolean(value && !isDegradedSnapshot(value)),
  });

  if (snapshot) {
    // Preserve last known-good snapshot when backend temporarily returns fallback.
    const nextScore = snapshotScore(snapshot);
    const currentScore = snapshotScore(cachedSnapshot);
    const shouldPromote = !isDegradedSnapshot(snapshot)
      || !cachedSnapshot
      || nextScore >= currentScore;

    if (shouldPromote) {
      cachedSnapshot = snapshot;
      cachedAt = now;
      return snapshot;
    }

    // Keep existing stable snapshot while still updating status metadata.
    return cachedSnapshot;
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
