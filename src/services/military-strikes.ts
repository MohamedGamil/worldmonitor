import type { MilitaryStrikeEvent, NewsItem } from '@/types';
import { inferGeoHubsFromTitle } from './geo-hub-index';
import { tokenizeForMatch, matchKeyword } from '@/utils/keyword-match';

interface CountryHint {
  country: string;
  aliases: string[];
  hubs?: string[];
}

const COUNTRY_HINTS: CountryHint[] = [
  { country: 'Israel', aliases: ['israel', 'israeli', 'idf'], hubs: ['jerusalem', 'telaviv', 'haifa', 'dimona'] },
  { country: 'Iran', aliases: ['iran', 'iranian', 'irgc'], hubs: ['tehran', 'isfahan'] },
  { country: 'USA', aliases: ['united states', 'u.s.', 'us', 'american', 'pentagon'], hubs: ['washington', 'guam'] },
  { country: 'UK', aliases: ['united kingdom', 'britain', 'british', 'uk'], hubs: ['london', 'diegogarcia'] },
  { country: 'Russia', aliases: ['russia', 'russian', 'kremlin'], hubs: ['moscow'] },
  { country: 'Ukraine', aliases: ['ukraine', 'ukrainian'], hubs: ['kyiv', 'ukraine-front'] },
  { country: 'Turkey', aliases: ['turkey', 'turkish'], hubs: ['ankara'] },
  { country: 'Yemen', aliases: ['yemen', 'yemeni', 'houthi', 'houthis'], hubs: ['yemen'] },
  { country: 'Syria', aliases: ['syria', 'syrian'], hubs: ['syria'] },
  { country: 'Lebanon', aliases: ['lebanon', 'lebanese', 'hezbollah'], hubs: ['lebanon'] },
  { country: 'Iraq', aliases: ['iraq', 'iraqi'], hubs: ['baghdad', 'erbil', 'iraq-conflict'] },
  { country: 'Palestine', aliases: ['gaza', 'palestinian', 'hamas', 'west bank', 'rafah'], hubs: ['gaza', 'westbank'] },
  { country: 'India', aliases: ['india', 'indian'], hubs: ['newdelhi', 'kashmir'] },
  { country: 'Pakistan', aliases: ['pakistan', 'pakistani'], hubs: ['islamabad', 'kashmir'] },
  { country: 'Sudan', aliases: ['sudan', 'sudanese'], hubs: ['sudan'] },
];

const STRIKE_KEYWORDS = ['strike', 'airstrike', 'missile', 'drone', 'rocket', 'shelling', 'bombardment', 'artillery', 'raid'];
const CONTEXT_KEYWORDS = ['military', 'base', 'troops', 'forces', 'defense', 'defence', 'air defense', 'navy'];
const OUTBOUND_PREPS = ['against', 'on', 'into', 'inside', 'targeting', 'targets', 'hits', 'hit'];

function mentionsCountry(tokens: ReturnType<typeof tokenizeForMatch>, hint: CountryHint): boolean {
  return hint.aliases.some((alias) => matchKeyword(tokens, alias));
}

function inferEventType(title: string): MilitaryStrikeEvent['eventType'] {
  const lower = title.toLowerCase();
  if (lower.includes('drone')) return 'drone';
  if (lower.includes('missile') || lower.includes('rocket')) return 'missile';
  if (lower.includes('shell') || lower.includes('artillery')) return 'artillery';
  if (lower.includes('naval')) return 'naval';
  if (lower.includes('raid') || lower.includes('special forces')) return 'special-operation';
  if (lower.includes('airstrike') || lower.includes('air strike')) return 'airstrike';
  return 'strike';
}

function inferSeverity(title: string): MilitaryStrikeEvent['severity'] {
  const lower = title.toLowerCase();
  if (/(massive|major|heavy|barrage|wave|deadly|kills|destroyed)/.test(lower)) return 'high';
  if (/(multiple|series|retaliatory|overnight|targeted)/.test(lower)) return 'medium';
  return 'low';
}

function findCountries(item: NewsItem) {
  const tokens = tokenizeForMatch(`${item.title} ${item.locationName ?? ''}`);
  const hubs = inferGeoHubsFromTitle(`${item.title} ${item.locationName ?? ''}`);
  const direct = COUNTRY_HINTS.filter((hint) => mentionsCountry(tokens, hint));
  const viaHubs = hubs.flatMap((hub) => COUNTRY_HINTS.filter((hint) => hint.hubs?.includes(hub.hubId)));
  const unique: CountryHint[] = [];
  for (const hint of [...direct, ...viaHubs]) {
    if (!unique.some((x) => x.country === hint.country)) unique.push(hint);
  }
  return { tokens, hubs, countries: unique };
}

function inferOriginAndTarget(item: NewsItem): Omit<MilitaryStrikeEvent, 'id' | 'title' | 'summary' | 'source' | 'link' | 'timestamp' | 'eventType' | 'severity' | 'confidence' | 'satelliteEnrichment'> | null {
  const { hubs, countries } = findCountries(item);
  const title = item.title.toLowerCase();
  const targetHub = hubs[0]?.hub;

  let targetCountry = targetHub?.country || countries[0]?.country || item.locationName || 'Unknown';
  let originCountry = countries.find((c) => c.country !== targetCountry)?.country || countries[0]?.country || 'Unknown';

  for (const prep of OUTBOUND_PREPS) {
    const idx = title.indexOf(` ${prep} `);
    if (idx > 0) {
      const left = title.slice(0, idx);
      const right = title.slice(idx + prep.length + 2);
      const leftCountry = COUNTRY_HINTS.find((hint) => hint.aliases.some((alias) => left.includes(alias)));
      const rightCountry = COUNTRY_HINTS.find((hint) => hint.aliases.some((alias) => right.includes(alias)));
      if (leftCountry) originCountry = leftCountry.country;
      if (rightCountry) targetCountry = rightCountry.country;
    }
  }

  const originHub = hubs.find((hub) => hub.hub.country === originCountry)?.hub;
  const resolvedTargetHub = hubs.find((hub) => hub.hub.country === targetCountry)?.hub || targetHub;

  if (!resolvedTargetHub && item.lat == null && item.lon == null) return null;

  const originLat = originHub?.lat ?? resolvedTargetHub?.lat ?? item.lat ?? 0;
  const originLon = originHub?.lon ?? resolvedTargetHub?.lon ?? item.lon ?? 0;
  const targetLat = resolvedTargetHub?.lat ?? item.lat ?? originLat;
  const targetLon = resolvedTargetHub?.lon ?? item.lon ?? originLon;

  return {
    originCountry,
    originLabel: originHub?.name || originCountry,
    originLat,
    originLon,
    targetCountry,
    targetLabel: resolvedTargetHub?.name || item.locationName || targetCountry,
    targetLat,
    targetLon,
  };
}

export function deriveMilitaryStrikeEvents(news: NewsItem[]): MilitaryStrikeEvent[] {
  const seen = new Set<string>();
  const events: MilitaryStrikeEvent[] = [];

  for (const item of news) {
    const title = item.title || '';
    const tokens = tokenizeForMatch(title);
    const strikeLike = STRIKE_KEYWORDS.some((keyword) => matchKeyword(tokens, keyword));
    const militaryContext = CONTEXT_KEYWORDS.some((keyword) => matchKeyword(tokens, keyword));
    if (!strikeLike || (!militaryContext && !item.locationName)) continue;

    const geo = inferOriginAndTarget(item);
    if (!geo) continue;

    const id = `${item.link || item.title}:${geo.originCountry}:${geo.targetCountry}`;
    if (seen.has(id)) continue;
    seen.add(id);

    const confidence = Math.max(0.45, Math.min(0.95,
      0.45
      + (item.lat != null && item.lon != null ? 0.15 : 0)
      + (item.locationName ? 0.1 : 0)
      + (geo.originCountry !== 'Unknown' ? 0.1 : 0)
      + (geo.targetCountry !== 'Unknown' ? 0.1 : 0)
      + (inferGeoHubsFromTitle(title).length > 0 ? 0.1 : 0)
    ));

    events.push({
      id,
      title: item.title,
      summary: item.locationName ? `${item.title} · ${item.locationName}` : item.title,
      source: item.source,
      link: item.link,
      timestamp: item.pubDate,
      eventType: inferEventType(title),
      severity: inferSeverity(title),
      confidence,
      satelliteEnrichment: { status: 'pending', note: 'Reserved for future satellite/BDA enrichment' },
      ...geo,
    });
  }

  return events
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 150);
}
