import { getHydratedData } from '@/services/bootstrap';

export interface ServerInsightStory {
  primaryTitle: string;
  primarySource: string;
  primaryLink: string;
  sourceCount: number;
  importanceScore: number;
  velocity: { level: string; sourcesPerHour: number };
  isAlert: boolean;
  category: string;
  threatLevel: string;
}

export interface ServerInsights {
  worldBrief: string;
  briefProvider: string;
  status: 'ok' | 'degraded';
  topStories: ServerInsightStory[];
  generatedAt: string;
  clusterCount: number;
  multiSourceCount: number;
  fastMovingCount: number;
}

let cached: ServerInsights | null = null;
const MAX_AGE_MS = 15 * 60 * 1000;

function isFresh(data: ServerInsights): boolean {
  const age = Date.now() - new Date(data.generatedAt).getTime();
  return age < MAX_AGE_MS;
}

function isValid(data: ServerInsights): boolean {
  return (
    Array.isArray(data.topStories) &&
    data.topStories.length > 0 &&
    typeof data.generatedAt === 'string'
  );
}

/**
 * Re-fetch insights from the bootstrap API when the in-memory cache expires.
 * The one-shot hydration cache (getHydratedData) is consumed at page load and
 * deleted after first read, so subsequent cache misses must go back to the API.
 */
async function fetchInsightsFromApi(): Promise<ServerInsights | null> {
  try {
    const resp = await fetch('/api/bootstrap?keys=insights', {
      signal: AbortSignal.timeout(5000),
    });
    if (!resp.ok) return null;
    const { data } = (await resp.json()) as { data: Record<string, unknown> };
    const raw = data.insights;
    if (!raw || typeof raw !== 'object') return null;
    const insights = raw as ServerInsights;
    if (!isValid(insights) || !isFresh(insights)) return null;
    return insights;
  } catch {
    return null;
  }
}

/** Synchronous read from in-memory cache only. */
export function getServerInsights(): ServerInsights | null {
  return cached && isFresh(cached) ? cached : null;
}

/**
 * Async loader: returns cached insights if still fresh, otherwise
 * reads the one-shot bootstrap hydration (page-load data), and finally
 * falls back to a live re-fetch from /api/bootstrap?keys=insights.
 * This ensures the panel keeps working after the initial 15-minute cache window.
 */
export async function loadServerInsights(): Promise<ServerInsights | null> {
  // 1. In-memory cache (fast path)
  if (cached && isFresh(cached)) return cached;
  cached = null;

  // 2. One-shot bootstrap hydration (consumed at page load, deleted after first read)
  const raw = getHydratedData('insights');
  if (raw && typeof raw === 'object') {
    const data = raw as ServerInsights;
    if (isValid(data) && isFresh(data)) {
      cached = data;
      return data;
    }
  }

  // 3. Re-fetch from API (cache expired or hydration already consumed)
  const fresh = await fetchInsightsFromApi();
  if (fresh) cached = fresh;
  return fresh;
}

export function setServerInsights(data: ServerInsights): void {
  cached = data;
}
