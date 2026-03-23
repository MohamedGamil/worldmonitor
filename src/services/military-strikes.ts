import type { MilitaryStrikeEvent, MilitaryStrikeSourceEvidence, MilitaryStrikeSourceReliability, NewsItem } from '@/types';
import { inferGeoHubsFromTitle } from './geo-hub-index';
import { tokenizeForMatch, matchKeyword } from '@/utils/keyword-match';

interface CountryHint {
  country: string;
  aliases: string[];
  hubs?: string[];
}

interface StrikeDeriveOptions {
  minConfidence?: number;
  maxEvents?: number;
  allowedSources?: string[];
  regions?: string[];
  now?: Date;
}

interface StrikeSignalMatch {
  eventType: MilitaryStrikeEvent['eventType'];
  score: number;
  labels: string[];
}

interface SourceProfile {
  reliability: MilitaryStrikeSourceReliability;
  score: number;
}

interface StrikeCandidate {
  item: NewsItem;
  title: string;
  normalizedTitle: string;
  geo: ResolvedStrikeGeo;
  eventType: MilitaryStrikeEvent['eventType'];
  severity: MilitaryStrikeEvent['severity'];
  sourceProfile: SourceProfile;
  signalLabels: string[];
  actorKey: string;
  targetKey: string;
  locationKey: string;
  bucketHour: number;
}

interface StrikeCluster {
  key: string;
  items: StrikeCandidate[];
}

type ResolvedStrikeGeo = Omit<MilitaryStrikeEvent, 'id' | 'title' | 'summary' | 'source' | 'link' | 'timestamp' | 'eventType' | 'severity' | 'confidence' | 'satelliteEnrichment' | 'corroboratingSourceCount' | 'sourceReliability' | 'sourceEvidence' | 'confidenceBreakdown'>;

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

const EVENT_SIGNAL_RULES: Array<{ eventType: MilitaryStrikeEvent['eventType']; patterns: RegExp[] }> = [
  { eventType: 'missile', patterns: [/\bmissile(?:s)?\b/i, /\bballistic\b/i, /\bcruise missile\b/i, /\brocket(?:s)?\b/i] },
  { eventType: 'drone', patterns: [/\bdrone(?:s)?\b/i, /\buav(?:s)?\b/i, /\bloitering munition(?:s)?\b/i, /\bkamikaze drone(?:s)?\b/i] },
  { eventType: 'artillery', patterns: [/\bartillery\b/i, /\bshell(?:ing|ed)?\b/i, /\bmortar(?:s)?\b/i, /\bhowitzer(?:s)?\b/i] },
  { eventType: 'naval', patterns: [/\bnaval\b/i, /\bwarship\b/i, /\bdestroyer\b/i, /\bfrigate\b/i, /\bsubmarine\b/i] },
  { eventType: 'special-operation', patterns: [/\braid\b/i, /\bcommando\b/i, /\bspecial forces\b/i] },
  { eventType: 'airstrike', patterns: [/\bair ?strike(?:s)?\b/i, /\bbomb(?:ed|ing)?\b/i, /\baerial bombardment\b/i, /\bwarplane(?:s)?\b/i, /\bfighter jet(?:s)?\b/i] },
  { eventType: 'strike', patterns: [/\bstrike(?:s|d)?\b/i, /\bhit(?:s)?\b/i, /\bexplosion(?:s)?\b/i, /\bblast(?:s)?\b/i] },
];

const MILITARY_CONTEXT_PATTERNS = [
  /\bmilitary\b/i, /\barmy\b/i, /\bair force\b/i, /\bnavy\b/i, /\bdefen[cs]e\b/i, /\btroops?\b/i,
  /\bbase\b/i, /\bairbase\b/i, /\bcommand(?:er)?\b/i, /\bmilitant(?:s)?\b/i, /\bweapon(?:s)? depot\b/i,
  /\banti-?aircraft\b/i, /\bair defense\b/i, /\bmunition(?:s)?\b/i, /\blaunch(?: site|er)?\b/i,
];

const STRIKE_OUTCOME_PATTERNS = [
  /\btarget(?:ed|ing|s)?\b/i, /\bhit(?:s|ting)?\b/i, /\bstruck\b/i, /\bdestroy(?:ed|s)?\b/i,
  /\bexplosion(?:s)?\b/i, /\bblast(?:s)?\b/i, /\bintercept(?:ed|s|ion)?\b/i, /\bimpact\b/i,
];

const EXCLUSION_PATTERNS = [
  /\bworkers? strike\b/i,
  /\blabor strike\b/i,
  /\bgo(?:es|ing)? on strike\b/i,
  /\bstrike deal\b/i,
  /\bstrike agreement\b/i,
  /\bstrike action\b/i,
  /\bprice strike\b/i,
  /\bmarket strike\b/i,
  /\bfilm strike\b/i,
  /\bactor(?:s)? strike\b/i,
  /\bbaseball strike\b/i,
  /\bfootball strike\b/i,
  /\bbowling strike\b/i,
  /\bthunderstorm\b/i,
  /\blightning strike\b/i,
  /\bearthquake\b/i,
  /\bvolcano\b/i,
  /\bgas explosion\b/i,
  /\bfactory explosion\b/i,
  /\bchemical explosion\b/i,
  /\bmine explosion\b/i,
  /\bbuilding collapse\b/i,
  /\bfirework(?:s)?\b/i,
];

const OUTBOUND_PREPS = ['against', 'on', 'into', 'inside', 'targeting', 'targets', 'hits', 'hit'];

const SOURCE_REGISTRY: Record<string, SourceProfile> = {
  reuters: { reliability: 'high', score: 0.95 },
  associatedpress: { reliability: 'high', score: 0.94 },
  apnews: { reliability: 'high', score: 0.94 },
  bbc: { reliability: 'high', score: 0.9 },
  afp: { reliability: 'high', score: 0.9 },
  france24: { reliability: 'high', score: 0.84 },
  aljazeera: { reliability: 'medium', score: 0.74 },
  cnn: { reliability: 'medium', score: 0.72 },
  skynews: { reliability: 'medium', score: 0.72 },
  guardian: { reliability: 'medium', score: 0.72 },
  timesofisrael: { reliability: 'medium', score: 0.7 },
  haaretz: { reliability: 'medium', score: 0.76 },
  jpost: { reliability: 'medium', score: 0.67 },
  usni: { reliability: 'medium', score: 0.78 },
  defensenews: { reliability: 'medium', score: 0.75 },
  twz: { reliability: 'medium', score: 0.69 },
  tass: { reliability: 'low', score: 0.48 },
  rt: { reliability: 'low', score: 0.38 },
  sputnik: { reliability: 'low', score: 0.32 },
  xinhua: { reliability: 'low', score: 0.44 },
  presstv: { reliability: 'low', score: 0.35 },
  irna: { reliability: 'low', score: 0.42 },
};

function normalizeSourceName(source: string): string {
  return source.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getSourceProfile(item: NewsItem): SourceProfile {
  const key = normalizeSourceName(item.source || '');
  const exact = SOURCE_REGISTRY[key];
  if (exact) return exact;

  for (const [candidate, profile] of Object.entries(SOURCE_REGISTRY)) {
    if (key.includes(candidate) || candidate.includes(key)) return profile;
  }

  const tier = item.tier;
  if (tier === 1) return { reliability: 'high', score: 0.88 };
  if (tier === 2) return { reliability: 'medium', score: 0.72 };
  if (tier === 3) return { reliability: 'low', score: 0.52 };
  return { reliability: 'medium', score: 0.64 };
}

function mentionsCountry(tokens: ReturnType<typeof tokenizeForMatch>, hint: CountryHint): boolean {
  return hint.aliases.some((alias) => matchKeyword(tokens, alias));
}

function inferSeverity(title: string): MilitaryStrikeEvent['severity'] {
  const lower = title.toLowerCase();
  if (/(massive|major|heavy|barrage|wave|deadly|kills|destroyed|dozens|wounded|casualt)/.test(lower)) return 'high';
  if (/(multiple|series|retaliatory|overnight|targeted|exchange|salvo)/.test(lower)) return 'medium';
  return 'low';
}

function detectStrikeSignal(title: string): StrikeSignalMatch | null {
  if (!title.trim()) return null;
  if (EXCLUSION_PATTERNS.some((pattern) => pattern.test(title))) return null;

  const labels: string[] = [];
  let best: StrikeSignalMatch | null = null;
  let militaryContextCount = 0;
  let outcomeCount = 0;

  for (const pattern of MILITARY_CONTEXT_PATTERNS) {
    if (pattern.test(title)) militaryContextCount += 1;
  }
  for (const pattern of STRIKE_OUTCOME_PATTERNS) {
    if (pattern.test(title)) outcomeCount += 1;
  }

  for (const rule of EVENT_SIGNAL_RULES) {
    let localScore = 0;
    const localLabels: string[] = [];
    for (const pattern of rule.patterns) {
      if (pattern.test(title)) {
        localScore += 1;
        localLabels.push(pattern.source.replace(/\\b|\(\?:|\)|\?[:=!]?/g, '').replace(/\|/g, '/'));
      }
    }
    if (!localScore) continue;
    const score = localScore + (militaryContextCount > 0 ? 1 : 0) + (outcomeCount > 0 ? 1 : 0);
    if (!best || score > best.score) {
      best = { eventType: rule.eventType, score, labels: localLabels };
    }
    labels.push(...localLabels);
  }

  if (!best) return null;
  const strongKinetic = best.eventType !== 'strike' || outcomeCount > 0;
  if (!strongKinetic) return null;
  if (militaryContextCount === 0 && !/(\bmissile\b|\bdrone\b|\bair ?strike\b|\bshell(?:ing|ed)?\b|\bartillery\b|\bbomb(?:ed|ing)?\b)/i.test(title)) return null;

  return {
    eventType: best.eventType,
    score: best.score + Math.min(2, militaryContextCount) + Math.min(2, outcomeCount),
    labels: [...new Set(labels)],
  };
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

function inferOriginAndTarget(item: NewsItem): ResolvedStrikeGeo | null {
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

function toHourBucket(date: Date): number {
  return Math.floor(date.getTime() / 3_600_000);
}

function normalizeLocationKey(geo: ResolvedStrikeGeo): string {
  return `${geo.targetCountry.toLowerCase()}|${geo.targetLabel.toLowerCase()}`;
}

function buildClusterKey(candidate: StrikeCandidate): string {
  return [candidate.eventType, candidate.targetKey, candidate.actorKey].join('|');
}

function computeConsistency(cluster: StrikeCluster): number {
  if (cluster.items.length <= 1) return 0.52;
  const actorSet = new Set(cluster.items.map((item) => item.actorKey));
  const targetSet = new Set(cluster.items.map((item) => item.targetKey));
  const locationSet = new Set(cluster.items.map((item) => item.locationKey));
  const hourMin = Math.min(...cluster.items.map((item) => item.bucketHour));
  const hourMax = Math.max(...cluster.items.map((item) => item.bucketHour));
  const timeSpreadHours = hourMax - hourMin;

  const actorConsistency = actorSet.size === 1 ? 1 : actorSet.size <= 2 ? 0.7 : 0.45;
  const targetConsistency = targetSet.size === 1 ? 1 : targetSet.size <= 2 ? 0.75 : 0.5;
  const locationConsistency = locationSet.size === 1 ? 1 : locationSet.size <= 2 ? 0.8 : 0.55;
  const timeConsistency = timeSpreadHours <= 2 ? 1 : timeSpreadHours <= 6 ? 0.82 : timeSpreadHours <= 12 ? 0.68 : 0.52;

  return (actorConsistency * 0.3) + (targetConsistency * 0.25) + (locationConsistency * 0.25) + (timeConsistency * 0.2);
}

function buildSourceEvidence(cluster: StrikeCluster): MilitaryStrikeSourceEvidence[] {
  const deduped = new Map<string, MilitaryStrikeSourceEvidence>();
  for (const candidate of cluster.items) {
    const key = `${candidate.item.source}|${candidate.item.link}`;
    if (deduped.has(key)) continue;
    deduped.set(key, {
      source: candidate.item.source,
      link: candidate.item.link,
      title: candidate.item.title,
      reliability: candidate.sourceProfile.reliability,
      publishedAt: candidate.item.pubDate,
    });
  }
  return [...deduped.values()].sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function severityRank(severity: MilitaryStrikeEvent['severity']): number {
  return severity === 'high' ? 3 : severity === 'medium' ? 2 : 1;
}

function pickRepresentative(cluster: StrikeCluster): StrikeCandidate {
  const sorted = [...cluster.items].sort((a, b) => {
    const sourceDelta = b.sourceProfile.score - a.sourceProfile.score;
    if (sourceDelta !== 0) return sourceDelta;
    const severityDelta = severityRank(b.severity) - severityRank(a.severity);
    if (severityDelta !== 0) return severityDelta;
    return b.item.pubDate.getTime() - a.item.pubDate.getTime();
  });
  return sorted[0]!;
}

function filterByOptions(items: NewsItem[], options: StrikeDeriveOptions): NewsItem[] {
  return items.filter((item) => {
    if (options.allowedSources?.length) {
      const source = item.source.toLowerCase();
      if (!options.allowedSources.some((allowed) => source.includes(allowed.toLowerCase()))) return false;
    }
    if (options.regions?.length && item.locationName) {
      const location = item.locationName.toLowerCase();
      if (!options.regions.some((region) => location.includes(region.toLowerCase()))) return false;
    }
    return true;
  });
}

export function deriveMilitaryStrikeEvents(news: NewsItem[], options: StrikeDeriveOptions = {}): MilitaryStrikeEvent[] {
  const minConfidence = options.minConfidence ?? 0.58;
  const maxEvents = options.maxEvents ?? 150;

  const candidates: StrikeCandidate[] = [];
  for (const item of filterByOptions(news, options)) {
    const title = item.title || '';
    const signal = detectStrikeSignal(title);
    if (!signal) continue;

    const geo = inferOriginAndTarget(item);
    if (!geo) continue;

    const profile = getSourceProfile(item);
    const actorKey = geo.originCountry === 'Unknown' ? 'unknown' : geo.originCountry.toLowerCase();
    const targetKey = geo.targetCountry === 'Unknown' ? normalizeLocationKey(geo) : geo.targetCountry.toLowerCase();

    candidates.push({
      item,
      title,
      normalizedTitle: title.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim(),
      geo,
      eventType: signal.eventType,
      severity: inferSeverity(title),
      sourceProfile: profile,
      signalLabels: signal.labels,
      actorKey,
      targetKey,
      locationKey: normalizeLocationKey(geo),
      bucketHour: toHourBucket(item.pubDate),
    });
  }

  const clusters = new Map<string, StrikeCluster>();
  for (const candidate of candidates) {
    const baseKey = buildClusterKey(candidate);
    const existing = [...clusters.values()].find((cluster) =>
      cluster.key.startsWith(`${baseKey}|`)
      && cluster.items.some((item) => Math.abs(item.bucketHour - candidate.bucketHour) <= 12)
      && cluster.items.some((item) => item.normalizedTitle === candidate.normalizedTitle || item.locationKey === candidate.locationKey),
    );
    if (existing) {
      existing.items.push(candidate);
      continue;
    }
    clusters.set(`${baseKey}|${candidate.bucketHour}`, { key: `${baseKey}|${candidate.bucketHour}`, items: [candidate] });
  }

  const events = [...clusters.values()].map((cluster) => {
    const representative = pickRepresentative(cluster);
    const sourceEvidence = buildSourceEvidence(cluster);
    const corroboratingSourceCount = new Set(sourceEvidence.map((e) => normalizeSourceName(e.source))).size;
    const sourceReliabilityScore = Math.max(...cluster.items.map((item) => item.sourceProfile.score));
    const corroborationScore = corroboratingSourceCount >= 4 ? 1 : corroboratingSourceCount === 3 ? 0.9 : corroboratingSourceCount === 2 ? 0.72 : 0.45;
    const detailConsistencyScore = computeConsistency(cluster);
    const geoScore = representative.item.lat != null && representative.item.lon != null
      ? 0.9
      : representative.item.locationName || representative.geo.targetLabel !== 'Unknown'
        ? 0.72
        : 0.5;

    const confidence = clamp01(
      (sourceReliabilityScore * 0.34)
      + (corroborationScore * 0.27)
      + (detailConsistencyScore * 0.27)
      + (geoScore * 0.12),
    );

    const latest = cluster.items.reduce((best, item) => item.item.pubDate > best ? item.item.pubDate : best, cluster.items[0]!.item.pubDate);
    const sourceReliability = representative.sourceProfile.reliability;
    const summaryParts = [representative.title];
    if (representative.geo.targetLabel && representative.geo.targetLabel !== representative.title) summaryParts.push(representative.geo.targetLabel);
    summaryParts.push(`${corroboratingSourceCount} source${corroboratingSourceCount === 1 ? '' : 's'}`);

    return {
      id: `${representative.item.link || representative.title}:${representative.geo.originCountry}:${representative.geo.targetCountry}:${representative.bucketHour}`,
      title: representative.item.title,
      summary: summaryParts.join(' · '),
      source: representative.item.source,
      link: representative.item.link,
      timestamp: latest,
      eventType: representative.eventType,
      severity: cluster.items.reduce((best, item) => severityRank(item.severity) > severityRank(best) ? item.severity : best, representative.severity),
      confidence,
      corroboratingSourceCount,
      sourceReliability,
      sourceEvidence,
      confidenceBreakdown: {
        sourceReliability: sourceReliabilityScore,
        corroboration: corroborationScore,
        detailConsistency: detailConsistencyScore,
      },
      satelliteEnrichment: { status: 'pending', note: 'Reserved for future satellite/BDA enrichment' },
      ...representative.geo,
    } satisfies MilitaryStrikeEvent;
  });

  return events
    .filter((event) => event.confidence >= minConfidence)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, maxEvents);
}
