import { getCorsHeaders, isDisallowedOrigin } from './_cors.js';

export const config = { runtime: 'edge' };

const REDIS_KEY = 'intelligence:gpsjam:v2';
const REDIS_KEY_V1 = 'intelligence:gpsjam:v1';

let cached = null;
let cachedAt = 0;
const CACHE_TTL = 300_000;

let negUntil = 0;
const NEG_TTL = 60_000;

async function readFromRedis(key) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const resp = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(3_000),
  });
  if (!resp.ok) return null;

  const data = await resp.json();
  if (!data.result) return null;

  try { return JSON.parse(data.result); } catch { return null; }
}

async function fetchDirectFromGpsJam() {
  const manifestResp = await fetch(`${BASE_URL}/manifest.csv`, {
    headers: { 'User-Agent': UA },
    signal: AbortSignal.timeout(10_000),
  });
  if (!manifestResp.ok) throw new Error(`Manifest HTTP ${manifestResp.status}`);
  const manifest = await manifestResp.text();
  const lines = manifest.trim().split('\n');
  const latestDate = lines[lines.length - 1].split(',')[0];

  // 2. Fetch hex data
  const hexResp = await fetch(`${BASE_URL}/${latestDate}-h3_4.csv`, {
    headers: { 'User-Agent': UA },
    signal: AbortSignal.timeout(15_000),
  });
  if (!hexResp.ok) throw new Error(`Hex data HTTP ${hexResp.status}`);
  const csv = await hexResp.text();
  const rows = csv.trim().split('\n');

  const hexes = [];
  for (let i = 1; i < rows.length; i++) {
    const parts = rows[i].split(',');
    if (parts.length < 3) continue;
    const hex = parts[0];
    const good = parseInt(parts[1], 10);
    const bad = parseInt(parts[2], 10);
    const total = good + bad;
    if (total < MIN_AIRCRAFT) continue;
    const pct = (bad / total) * 100;
    let level;
    if (pct > 10) level = 'high';
    else if (pct >= 2) level = 'medium';
    else continue;
    hexes.push({ h3: hex, pct: Math.round(pct * 10) / 10, good, bad, total, level });
  }

  hexes.sort((a, b) => {
    if (a.level !== b.level) return a.level === 'high' ? -1 : 1;
    return b.pct - a.pct;
  });

  return {
    date: latestDate,
    fetchedAt: new Date().toISOString(),
    source: 'gpsjam.org',
    stats: {
      totalHexes: rows.length - 1,
      highCount: hexes.filter(h => h.level === 'high').length,
      mediumCount: hexes.filter(h => h.level === 'medium').length,
    },
    hexes,
  };
}

async function fetchGpsJamData() {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_TTL) return cached;
  if (now < negUntil) return null;

  let data;
  try { data = await readFromRedis(REDIS_KEY); } catch { data = null; }

  if (!data) {
    let v1;
    try { v1 = await readFromRedis(REDIS_KEY_V1); } catch { v1 = null; }
    if (v1?.hexes) {
      data = {
        ...v1,
        source: v1.source || 'gpsjam.org (normalized)',
        hexes: v1.hexes.map(hex => {
          if ('npAvg' in hex) return hex;
          const pct = hex.pct || 0;
          return {
            h3: hex.h3,
            lat: hex.lat,
            lon: hex.lon,
            level: hex.level,
            region: hex.region,
            npAvg: pct > 10 ? 0.3 : pct >= 2 ? 0.8 : 1.5,
            sampleCount: hex.bad || 0,
            aircraftCount: hex.total || 0,
          };
        }),
      };
    }
  }

  if (!data) {
    negUntil = now + NEG_TTL;
    return null;
  }

  cached = data;
  cachedAt = now;
  return data;
}

export default async function handler(req) {
  const corsHeaders = getCorsHeaders(req, 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (isDisallowedOrigin(req)) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const data = await fetchGpsJamData();

  if (!data) {
    return new Response(JSON.stringify({ error: 'GPS interference data temporarily unavailable' }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store',
        ...corsHeaders,
      },
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=1800, stale-if-error=3600',
      ...corsHeaders,
    },
  });
}
