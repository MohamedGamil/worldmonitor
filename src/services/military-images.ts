/**
 * military-images.ts
 *
 * Client-side image lookup for military aircraft and naval vessels using the
 * Wikipedia REST summary API (no API key required, CORS-friendly, royalty-free).
 *
 * Fetched URLs are cached in memory for the lifetime of the page to avoid
 * duplicate requests when the same popup is opened multiple times.
 */

import type { MilitaryAircraftType, MilitaryVesselType } from '@/types';

// ─── In-memory cache (Wikipedia title → image URL | null) ────────────────────
const _imageCache = new Map<string, string | null>();

// ─── In-memory cache (hex code → Wikipedia title | null) ─────────────────────
const _hexCache = new Map<string, string | null>();

// ─── In-memory cache (hex code → Planespotters photo | null) ─────────────────
interface PlanespottersPhoto {
  largeUrl: string;
  pageUrl: string;
  photographer: string;
}
const _planespottersCache = new Map<string, PlanespottersPhoto | null>();

// ─── ICAO aircraft type code → Wikipedia article title ───────────────────────
// Keys are ICAO designators as returned by adsbdb (case-normalised to uppercase)
const ICAO_TYPE_TO_WIKI: Record<string, string> = {
  // US – Fighters
  'F15':   'McDonnell Douglas F-15 Eagle',
  'F15E':  'McDonnell Douglas F-15E Strike Eagle',
  'F16':   'General Dynamics F-16 Fighting Falcon',
  'F16C':  'General Dynamics F-16 Fighting Falcon',
  'F16D':  'General Dynamics F-16 Fighting Falcon',
  'F22':   'Lockheed Martin F-22 Raptor',
  'F22A':  'Lockheed Martin F-22 Raptor',
  'F35':   'Lockheed Martin F-35 Lightning II',
  'F35A':  'Lockheed Martin F-35 Lightning II',
  'F35B':  'Lockheed Martin F-35 Lightning II',
  'F35C':  'Lockheed Martin F-35 Lightning II',
  'F18':   'McDonnell Douglas F/A-18 Hornet',
  'F18S':  'Boeing F/A-18E/F Super Hornet',
  'F18E':  'Boeing F/A-18E/F Super Hornet',
  'F18F':  'Boeing F/A-18E/F Super Hornet',
  'F14':   'Grumman F-14 Tomcat',
  'A10':   'Fairchild Republic A-10 Thunderbolt II',
  'A10C':  'Fairchild Republic A-10 Thunderbolt II',
  // US – Bombers
  'B52':   'Boeing B-52 Stratofortress',
  'B52H':  'Boeing B-52 Stratofortress',
  'B1':    'Rockwell B-1 Lancer',
  'B1B':   'Rockwell B-1 Lancer',
  'B2':    'Northrop Grumman B-2 Spirit',
  'B2A':   'Northrop Grumman B-2 Spirit',
  'B21':   'Northrop Grumman B-21 Raider',
  // US – Transports
  'C130':  'Lockheed C-130 Hercules',
  'C130J': 'Lockheed C-130 Hercules',
  'C17':   'Boeing C-17 Globemaster III',
  'C17A':  'Boeing C-17 Globemaster III',
  'C5':    'Lockheed C-5 Galaxy',
  'C5M':   'Lockheed C-5 Galaxy',
  'C27':   'Alenia C-27J Spartan',
  'C27J':  'Alenia C-27J Spartan',
  'C40':   'Boeing C-40 Clipper',
  'C40B':  'Boeing C-40 Clipper',
  'C40C':  'Boeing C-40 Clipper',
  'C32':   'Boeing C-32',
  'C32A':  'Boeing C-32',
  'C37':   'Gulfstream C-37',
  'C37A':  'Gulfstream C-37',
  'C37B':  'Gulfstream C-37',
  'C12':   'Beechcraft Super King Air',
  'C12C':  'Beechcraft Super King Air',
  'C12D':  'Beechcraft Super King Air',
  'C12F':  'Beechcraft Super King Air',
  'C12J':  'Beechcraft Super King Air',
  'C12R':  'Beechcraft Super King Air',
  'C23':   'Short C-23 Sherpa',
  'C26':   'Fairchild Metro',
  // US – Tankers
  'KC135': 'Boeing KC-135 Stratotanker',
  'K35R':  'Boeing KC-135 Stratotanker',
  'KC10':  'McDonnell Douglas KC-10 Extender',
  'KC46':  'Boeing KC-46 Pegasus',
  'KC46A': 'Boeing KC-46 Pegasus',
  // US – Surveillance / AWACS
  'E3':    'Boeing E-3 Sentry',
  'E3CF':  'Boeing E-3 Sentry',
  'E3TF':  'Boeing E-3 Sentry',
  'E7':    'Boeing E-7',
  'E7A':   'Boeing E-7',
  'E2':    'Northrop Grumman E-2 Hawkeye',
  'E2C':   'Northrop Grumman E-2 Hawkeye',
  'E2D':   'Northrop Grumman E-2 Hawkeye',
  'E4':    'Boeing E-4 Nightwatch',
  'E4B':   'Boeing E-4 Nightwatch',
  'E6':    'Boeing E-6 Mercury',
  'E6B':   'Boeing E-6 Mercury',
  'RC135': 'Boeing RC-135',
  'RC35':  'Boeing RC-135',
  'U2':    'Lockheed U-2',
  'TR1':   'Lockheed U-2',
  // US – Maritime Patrol
  'P8':    'Boeing P-8 Poseidon',
  'P8A':   'Boeing P-8 Poseidon',
  'P3':    'Lockheed P-3 Orion',
  'P3C':   'Lockheed P-3 Orion',
  // US – Drones
  'RQ4':   'Northrop Grumman RQ-4 Global Hawk',
  'MQ9':   'General Atomics MQ-9 Reaper',
  'MQ1':   'General Atomics MQ-1 Predator',
  // US – Helicopters
  'UH60':  'Sikorsky UH-60 Black Hawk',
  'UH60L': 'Sikorsky UH-60 Black Hawk',
  'UH60M': 'Sikorsky UH-60 Black Hawk',
  'MH60':  'Sikorsky MH-60 Jayhawk',
  'MH60S': 'Sikorsky MH-60 Jayhawk',
  'AH64':  'Boeing AH-64 Apache',
  'AH64D': 'Boeing AH-64 Apache',
  'AH64E': 'Boeing AH-64 Apache',
  'CH47':  'Boeing CH-47 Chinook',
  'CH47F': 'Boeing CH-47 Chinook',
  'CH53':  'Sikorsky CH-53E Super Stallion',
  'MH53':  'Sikorsky CH-53E Super Stallion',
  'AH1':   'Bell AH-1 SuperCobra',
  'AH1Z':  'Bell AH-1 SuperCobra',
  // US – Special Ops / Tiltrotor
  'V22':   'Bell Boeing V-22 Osprey',
  'CV22':  'Bell Boeing V-22 Osprey',
  'MV22':  'Bell Boeing V-22 Osprey',
  'MV22B': 'Bell Boeing V-22 Osprey',
  'AC130': 'Lockheed AC-130',
  'AC13J': 'Lockheed AC-130',
  'MC130': 'Lockheed MC-130',
  'MC13J': 'Lockheed MC-130',
  // US – VIP
  'VC25':  'Boeing VC-25',
  'VC25A': 'Boeing VC-25',
  // Russia – Fighters
  'SU27':  'Sukhoi Su-27',
  'SU30':  'Sukhoi Su-30',
  'SU33':  'Sukhoi Su-33',
  'SU34':  'Sukhoi Su-34',
  'SU35':  'Sukhoi Su-35',
  'SU57':  'Sukhoi Su-57',
  'MG29':  'Mikoyan MiG-29',
  'MG31':  'Mikoyan MiG-31',
  // Russia – Bombers
  'TU95':  'Tupolev Tu-95',
  'TU16':  'Tupolev Tu-160',
  'TU22':  'Tupolev Tu-22M',
  // Russia – Transports
  'IL76':  'Ilyushin Il-76',
  'IL78':  'Ilyushin Il-78',
  'AN12':  'Antonov An-12',
  'AN124': 'Antonov An-124 Ruslan',
  // China
  'J20':   'Chengdu J-20',
  'J16':   'Shenyang J-16',
  'J11':   'Shenyang J-11',
  'H6':    'Xian H-6',
  'Y20':   'Xian Y-20',
  // Europe
  'EUFI':  'Eurofighter Typhoon',
  'TYFN':  'Eurofighter Typhoon',
  'RFAL':  'Dassault Rafale',
  'GRPS':  'Saab JAS 39 Gripen',
  'TORNA': 'Panavia Tornado',
  'A400':  'Airbus A400M Atlas',
  // Training
  'T38':   'Northrop T-38 Talon',
  'T38A':  'Northrop T-38 Talon',
  'T6':    'Beechcraft T-6 Texan II',
  'T6A':   'Beechcraft T-6 Texan II',
  'T6B':   'Beechcraft T-6 Texan II',
};

// ─── Aircraft model prefix → Wikipedia article title ─────────────────────────
const AIRCRAFT_MODEL_TO_WIKI: Record<string, string> = {
  // US – Fighters
  'F-15':   'McDonnell Douglas F-15 Eagle',
  'F-16':   'General Dynamics F-16 Fighting Falcon',
  'F-22':   'Lockheed Martin F-22 Raptor',
  'F-35':   'Lockheed Martin F-35 Lightning II',
  'F/A-18': 'McDonnell Douglas F/A-18 Hornet',
  'FA-18':  'McDonnell Douglas F/A-18 Hornet',
  'F-14':   'Grumman F-14 Tomcat',
  'F-18':   'McDonnell Douglas F/A-18 Hornet',
  'A-10':   'Fairchild Republic A-10 Thunderbolt II',
  'F-4':    'McDonnell Douglas F-4 Phantom II',
  'F-2':    'Mitsubishi F-2',

  // US – Bombers
  'B-52':   'Boeing B-52 Stratofortress',
  'B-1':    'Rockwell B-1 Lancer',
  'B-2':    'Northrop Grumman B-2 Spirit',
  'B-21':   'Northrop Grumman B-21 Raider',

  // US – Transports
  'C-130':  'Lockheed C-130 Hercules',
  'C-17':   'Boeing C-17 Globemaster III',
  'C-5':    'Lockheed C-5 Galaxy',
  'C-141':  'Lockheed C-141 Starlifter',
  'C-40':   'Boeing C-40 Clipper',
  'C-32':   'Boeing C-32',
  'C-37':   'Gulfstream C-37',

  // US – Tankers
  'KC-135': 'Boeing KC-135 Stratotanker',
  'KC-10':  'McDonnell Douglas KC-10 Extender',
  'KC-46':  'Boeing KC-46 Pegasus',

  // US – Surveillance / AWACS
  'E-3':    'Boeing E-3 Sentry',
  'E-7':    'Boeing E-7',
  'E-2':    'Northrop Grumman E-2 Hawkeye',
  'E-4':    'Boeing E-4 Nightwatch',
  'E-6':    'Boeing E-6 Mercury',
  'E-8':    'Northrop Grumman E-8 Joint STARS',
  'RC-135': 'Boeing RC-135',
  'U-2':    'Lockheed U-2',
  'SR-71':  'Lockheed SR-71 Blackbird',

  // US – Maritime Patrol
  'P-8':    'Boeing P-8 Poseidon',
  'P-3':    'Lockheed P-3 Orion',

  // US – Drones / UAS
  'RQ-4':   'Northrop Grumman RQ-4 Global Hawk',
  'MQ-9':   'General Atomics MQ-9 Reaper',
  'MQ-1':   'General Atomics MQ-1 Predator',
  'RQ-180': 'Northrop Grumman RQ-180',

  // US – Helicopters
  'UH-60':  'Sikorsky UH-60 Black Hawk',
  'MH-60':  'Sikorsky MH-60 Jayhawk',
  'AH-64':  'Boeing AH-64 Apache',
  'CH-47':  'Boeing CH-47 Chinook',
  'CH-53':  'Sikorsky CH-53E Super Stallion',
  'MH-6':   'Boeing MH-6 Little Bird',
  'AH-1':   'Bell AH-1 SuperCobra',

  // US – Special Ops
  'MC-130': 'Lockheed MC-130',
  'AC-130': 'Lockheed AC-130',
  'CV-22':  'Bell Boeing V-22 Osprey',
  'MV-22':  'Bell Boeing V-22 Osprey',
  'V-22':   'Bell Boeing V-22 Osprey',

  // US – VIP / Command
  'VC-25':  'Boeing VC-25',
  'C-20':   'Grumman C-20 Gulfstream',
  'C-12':   'Beechcraft Super King Air',

  // Russia – Fighters
  'Su-27':  'Sukhoi Su-27',
  'Su-30':  'Sukhoi Su-30',
  'Su-33':  'Sukhoi Su-33',
  'Su-34':  'Sukhoi Su-34',
  'Su-35':  'Sukhoi Su-35',
  'Su-57':  'Sukhoi Su-57',
  'MiG-29': 'Mikoyan MiG-29',
  'MiG-31': 'Mikoyan MiG-31',

  // Russia – Bombers
  'Tu-95':  'Tupolev Tu-95',
  'Tu-160': 'Tupolev Tu-160',
  'Tu-22':  'Tupolev Tu-22M',

  // Russia – Transports / Tankers
  'Il-76':  'Ilyushin Il-76',
  'Il-78':  'Ilyushin Il-78',
  'An-124': 'Antonov An-124 Ruslan',
  'An-22':  'Antonov An-22',

  // Russia – Surveillance
  'A-50':   'Beriev A-50',
  'Tu-142': 'Tupolev Tu-142',
  'Il-38':  'Ilyushin Il-38',

  // China
  'J-20':   'Chengdu J-20',
  'J-16':   'Shenyang J-16',
  'J-11':   'Shenyang J-11',
  'H-6':    'Xian H-6',
  'Y-20':   'Xian Y-20',
  'KJ-500': 'Shaanxi KJ-500',

  // Europe
  'Typhoon':     'Eurofighter Typhoon',
  'Eurofighter': 'Eurofighter Typhoon',
  'Rafale':      'Dassault Rafale',
  'Gripen':      'Saab JAS 39 Gripen',
  'Tornado':     'Panavia Tornado',
  'A400M':       'Airbus A400M Atlas',
  'Mirage':      'Dassault Mirage 2000',

  // Others
  'F-16V':  'General Dynamics F-16 Fighting Falcon',
  'T-38':   'Northrop T-38 Talon',
  'T-6':    'Beechcraft T-6 Texan II',
};

// ─── Fallback: aircraft category → representative Wikipedia title ─────────────
const AIRCRAFT_TYPE_TO_WIKI: Record<MilitaryAircraftType, string> = {
  fighter:       'Lockheed Martin F-35 Lightning II',
  bomber:        'Boeing B-52 Stratofortress',
  transport:     'Boeing C-17 Globemaster III',
  tanker:        'Boeing KC-135 Stratotanker',
  awacs:         'Boeing E-3 Sentry',
  reconnaissance:'Lockheed U-2',
  helicopter:    'Sikorsky UH-60 Black Hawk',
  drone:         'General Atomics MQ-9 Reaper',
  patrol:        'Boeing P-8 Poseidon',
  special_ops:   'Lockheed MC-130',
  vip:           'Boeing VC-25',
  unknown:       '',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Strip trailing variant suffix (single letter after a digit), e.g.:
 *   "F-35A" → "F-35",  "B-52H" → "B-52",  "KC-135R" → "KC-135"
 */
function normalizeModel(model: string): string {
  return model.replace(/(\d)[A-Za-z]$/, '$1').trim();
}

/**
 * Return the best Wikipedia article title for the given aircraft, or null if
 * we have no reliable mapping.
 */
export function getAircraftWikiTitle(
  aircraftType: MilitaryAircraftType,
  aircraftModel?: string,
): string | null {
  if (aircraftModel) {
    const raw = aircraftModel.trim();

    // 1. Exact match
    if (AIRCRAFT_MODEL_TO_WIKI[raw]) return AIRCRAFT_MODEL_TO_WIKI[raw];

    // 2. Normalized (strip trailing variant letter)
    const norm = normalizeModel(raw);
    if (AIRCRAFT_MODEL_TO_WIKI[norm]) return AIRCRAFT_MODEL_TO_WIKI[norm];

    // 3. Prefix match (iterate shortest-to-longest for specificity)
    const prefixMatch = Object.keys(AIRCRAFT_MODEL_TO_WIKI)
      .filter(k => raw.startsWith(k) || norm.startsWith(k))
      .sort((a, b) => b.length - a.length)[0]; // longest matching prefix wins
    if (prefixMatch) return AIRCRAFT_MODEL_TO_WIKI[prefixMatch] ?? null;
  }

  // 4. Category fallback
  const fallback = AIRCRAFT_TYPE_TO_WIKI[aircraftType];
  return fallback || null;
}

// ─── Callsign prefix → Wikipedia article title ───────────────────────────────
// Maps the mission-name prefix of a military/government callsign to the most
// representative aircraft article.  Prefix matching is longest-first, so
// e.g. "REACH" wins over a hypothetical shorter entry.
const CALLSIGN_PREFIX_TO_WIKI: Record<string, string> = {
  // USAF Air Mobility Command – C-17 Globemaster III
  'RCH':    'Boeing C-17 Globemaster III',
  'REACH':  'Boeing C-17 Globemaster III',
  'ROCKY':  'Boeing C-17 Globemaster III',

  // USAF – Tankers KC-135 / KC-46
  'JAKE':   'Boeing KC-135 Stratotanker',
  'POLO':   'Boeing KC-135 Stratotanker',
  'BUCK':   'Boeing KC-135 Stratotanker',
  'BALL':   'Boeing KC-135 Stratotanker',
  'IRON':   'Boeing KC-135 Stratotanker',
  'PEARL':  'Boeing KC-46 Pegasus',

  // USAF – Bombers
  'STONE':  'Boeing B-52 Stratofortress',
  'DOOM':   'Boeing B-52 Stratofortress',
  'DEATH':  'Boeing B-52 Stratofortress',
  'PACK':   'Boeing B-52 Stratofortress',
  'GHOST':  'Northrop Grumman B-2 Spirit',
  'SPIRIT': 'Northrop Grumman B-2 Spirit',

  // USAF – Reconnaissance / Signals Intelligence
  'FORTE':  'Boeing RC-135',
  'COBRA':  'Boeing RC-135',
  'HOMER':  'Boeing RC-135',
  'JAKE6':  'Boeing RC-135',   // RC-135V Rivet Joint

  // USAF – AWACS / C2
  'NOBLE':  'Boeing E-3 Sentry',
  'OASIS':  'Boeing E-3 Sentry',

  // USAF – VIP / Special Air Mission
  'SAM':    'Boeing VC-25',
  'SPAR':   'Boeing C-32',
  'VENUS':  'Boeing C-32',

  // USAF – Surveillance / UAS
  'GLOBAL': 'Northrop Grumman RQ-4 Global Hawk',
  'REAPER': 'General Atomics MQ-9 Reaper',
  'PREDATOR': 'General Atomics MQ-1 Predator',

  // USAF – Special Ops (AC-130 / MC-130)
  'MAGMA':  'Lockheed MC-130',
  'GRIM':   'Lockheed AC-130',
  'SPOOKY': 'Lockheed AC-130',
  'SHADOW': 'Lockheed MC-130',

  // US Navy – Maritime Patrol
  'NAVY':   'Boeing P-8 Poseidon',
  'PATRON': 'Boeing P-8 Poseidon',

  // US Coast Guard
  'CGAS':   'Sikorsky MH-60 Jayhawk',
  'CGXX':   'Sikorsky MH-60 Jayhawk',

  // NOAA
  'NOAA':   'Lockheed WP-3D Orion',

  // RAF – Air Mobility / Tanker
  'RRR':    'Airbus A400M Atlas',
  'ASCOT':  'Airbus A400M Atlas',
  'TARTAN': 'Airbus A330 MRTT',

  // NATO E-3
  'NATO':   'Boeing E-3 Sentry',

  // Training
  'SPORT':  'Northrop T-38 Talon',
};

/**
 * Return a Wikipedia article title for the aircraft associated with a known
 * callsign, or null if the callsign is not recognisable.
 *
 * Resolution:
 *  1. Specific full-callsign overrides (e.g. "SAM28000" → VC-25 Air Force One)
 *  2. Longest matching prefix from CALLSIGN_PREFIX_TO_WIKI
 */
export function getCallsignWikiTitle(callsign: string): string | null {
  if (!callsign || callsign.length < 2) return null;
  const cs = callsign.trim().toUpperCase();

  // 1. Special full-callsign overrides
  if (cs === 'SAM28000' || cs === 'SAM29000') return 'Boeing VC-25'; // Air Force One
  if (cs.startsWith('AF1') || cs === 'AIRFORCE1') return 'Boeing VC-25';

  // 2. Longest-prefix match
  const match = Object.keys(CALLSIGN_PREFIX_TO_WIKI)
    .filter(prefix => cs.startsWith(prefix))
    .sort((a, b) => b.length - a.length)[0];

  return match ? (CALLSIGN_PREFIX_TO_WIKI[match] ?? null) : null;
}

// ─── Wikipedia REST API fetch ─────────────────────────────────────────────────

/**
 * Fetch the representative image URL for a Wikipedia article.
 * Returns null on any error or when no thumbnail exists.
 * Results are cached for the lifetime of the page.
 */
export async function fetchWikipediaImage(wikiTitle: string): Promise<string | null> {
  if (_imageCache.has(wikiTitle)) return _imageCache.get(wikiTitle)!;

  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      _imageCache.set(wikiTitle, null);
      return null;
    }
    const data = (await res.json()) as { thumbnail?: { source?: string } };
    const imgUrl = data?.thumbnail?.source ?? null;
    _imageCache.set(wikiTitle, imgUrl);
    return imgUrl;
  } catch {
    _imageCache.set(wikiTitle, null);
    return null;
  }
}

// ─── Hex code → Planespotters photo ──────────────────────────────────────────

/**
 * Fetch a real photo of the exact aircraft (by ICAO24 hex code) from the
 * Planespotters.net public API.
 *
 * API: GET https://api.planespotters.net/pub/photos/hex/{icao24}
 * - No API key required
 * - CORS: Access-Control-Allow-Origin: *
 * - Rate limit: reasonable (cached with CDN, max-age=3600)
 * - Returns photos of the specific tail number — far more relevant than a
 *   generic Wikipedia article image of the aircraft type.
 *
 * Results are cached for the lifetime of the page.
 * Returns null when the hex is unknown, has no indexed photos, or the request
 * fails.
 */
export async function fetchPlanespottersImage(hexCode: string): Promise<PlanespottersPhoto | null> {
  if (!hexCode) return null;
  const key = hexCode.toUpperCase();
  if (_planespottersCache.has(key)) return _planespottersCache.get(key)!;

  try {
    const res = await fetch(`https://api.planespotters.net/pub/photos/hex/${key}`, {
      signal: AbortSignal.timeout(6_000),
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) { _planespottersCache.set(key, null); return null; }

    const data = (await res.json()) as {
      photos?: Array<{
        thumbnail_large?: { src?: string };
        thumbnail?: { src?: string };
        link?: string;
        photographer?: string;
      }>;
    };

    const photo = data?.photos?.[0];
    if (!photo) { _planespottersCache.set(key, null); return null; }

    const largeUrl = photo.thumbnail_large?.src ?? photo.thumbnail?.src ?? '';
    if (!largeUrl) { _planespottersCache.set(key, null); return null; }

    const result: PlanespottersPhoto = {
      largeUrl,
      pageUrl: photo.link ?? `https://www.planespotters.net`,
      photographer: photo.photographer ?? '',
    };
    _planespottersCache.set(key, result);
    return result;
  } catch {
    _planespottersCache.set(key, null);
    return null;
  }
}

// ─── Hex code → Wikipedia title via adsbdb ───────────────────────────────────

/**
 * Look up the aircraft type for an ICAO hex code via the adsbdb public API,
 * then map the returned ICAO type designator to a Wikipedia article title.
 *
 * Results are cached in memory for the lifetime of the page.
 * Returns null when the hex is unknown, the type has no mapping, or the
 * request fails or times out.
 */
export async function fetchHexWikiTitle(hexCode: string): Promise<string | null> {
  if (!hexCode) return null;
  const key = hexCode.toUpperCase();
  if (_hexCache.has(key)) return _hexCache.get(key)!;

  try {
    const res = await fetch(`https://api.adsbdb.com/v0/aircraft/${key}`, {
      signal: AbortSignal.timeout(5_000),
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) { _hexCache.set(key, null); return null; }

    const data = (await res.json()) as {
      response?: { aircraft?: { type?: string; manufacturer?: string } };
    };
    const icaoType = data?.response?.aircraft?.type?.toUpperCase() ?? '';
    if (!icaoType) { _hexCache.set(key, null); return null; }

    const wikiTitle = ICAO_TYPE_TO_WIKI[icaoType] ?? null;
    _hexCache.set(key, wikiTitle);
    return wikiTitle;
  } catch {
    _hexCache.set(key, null);
    return null;
  }
}

/**
 * Synchronously return the best Wikipedia article title for a military flight,
 * using the cached hex lookup result if available, then callsign, then
 * model/type — all without making any network requests.
 *
 * Use this when building the popup HTML. If none of the synchronous strategies
 * succeed, the caller should emit a `data-hex-code` attribute so the async
 * loader (`loadPopupImages`) can do a live hex lookup as a final fallback.
 */
export function getMilitaryFlightWikiTitle(flight: {
  callsign?: string;
  hexCode?: string;
  aircraftType: string;
  aircraftModel?: string;
}): string | null {
  // 1. Hex cache (populated by a previous fetchHexWikiTitle call)
  if (flight.hexCode) {
    const cached = _hexCache.get(flight.hexCode.toUpperCase());
    if (cached) return cached;
  }

  // 2. Callsign prefix lookup
  if (flight.callsign) {
    const byCallsign = getCallsignWikiTitle(flight.callsign);
    if (byCallsign) return byCallsign;
  }

  // 3. Model + type (existing logic)
  return getAircraftWikiTitle(
    flight.aircraftType as MilitaryAircraftType,
    flight.aircraftModel,
  );
}

// ─── Named naval vessel → Wikipedia article title ────────────────────────────
// Keyed by the exact vessel name used in KNOWN_NAVAL_VESSELS / AIS data.
// Wikipedia titles are verified to resolve to a page with a thumbnail.
const VESSEL_NAME_TO_WIKI: Record<string, string> = {
  // ── US Nimitz-class carriers ──────────────────────────────────────────────
  'USS Nimitz':                 'USS Nimitz',
  'USS Dwight D. Eisenhower':   'USS Dwight D. Eisenhower',
  'USS Carl Vinson':            'USS Carl Vinson',
  'USS Theodore Roosevelt':     'USS Theodore Roosevelt (CVN-71)',
  'USS Abraham Lincoln':        'USS Abraham Lincoln (CVN-72)',
  'USS George Washington':      'USS George Washington (CVN-73)',
  'USS John C. Stennis':        'USS John C. Stennis',
  'USS Harry S. Truman':        'USS Harry S. Truman (CVN-75)',
  'USS Ronald Reagan':          'USS Ronald Reagan',
  'USS George H.W. Bush':       'USS George H.W. Bush',

  // ── US Gerald R. Ford-class carriers ─────────────────────────────────────
  'USS Gerald R. Ford':         'USS Gerald R. Ford',
  'USS John F. Kennedy':        'USS John F. Kennedy (CVN-79)',
  'USS Enterprise':             'USS Enterprise (CVN-80)',

  // ── UK Queen Elizabeth-class carriers ────────────────────────────────────
  'HMS Queen Elizabeth':        'HMS Queen Elizabeth (R08)',
  'HMS Prince of Wales':        'HMS Prince of Wales (R09)',

  // ── Chinese carriers ─────────────────────────────────────────────────────
  'Liaoning':                   'Chinese aircraft carrier Liaoning',
  'Shandong':                   'Chinese aircraft carrier Shandong',
  'Fujian':                     'Chinese aircraft carrier Fujian',

  // ── Russian carrier ───────────────────────────────────────────────────────
  'Admiral Kuznetsov':          'Admiral Kuznetsov aircraft carrier',

  // ── Indian carrier ────────────────────────────────────────────────────────
  'INS Vikrant':                'INS Vikrant (R11)',
  'INS Vikramaditya':           'INS Vikramaditya',

  // ── French carrier ────────────────────────────────────────────────────────
  'Charles de Gaulle':          'French aircraft carrier Charles de Gaulle',

  // ── Italian carrier ───────────────────────────────────────────────────────
  'ITS Cavour':                 'Italian aircraft carrier Cavour',

  // ── US amphibious assault ships (act as light carriers) ───────────────────
  'USS America':                'USS America (LHA-6)',
  'USS Tripoli':                'USS Tripoli (LHA-7)',
  'USS Tarawa':                 'USS Tarawa (LHA-1)',
  'USS Essex':                  'USS Essex (LHD-2)',
  'USS Kearsarge':              'USS Kearsarge (LHD-3)',
  'USS Boxer':                  'USS Boxer (LHD-4)',
  'USS Bataan':                 'USS Bataan (LHD-5)',
  'USS Bonhomme Richard':       'USS Bonhomme Richard (LHD-6)',
  'USS Iwo Jima':               'USS Iwo Jima (LHD-7)',
  'USS Makin Island':           'USS Makin Island (LHD-8)',

  // ── US destroyers ─────────────────────────────────────────────────────────
  'USS Zumwalt':                'USS Zumwalt (DDG-1000)',
  'USS Michael Monsoor':        'USS Michael Monsoor (DDG-1001)',
  'USS Lyndon B. Johnson':      'USS Lyndon B. Johnson (DDG-1002)',
  'USS Arleigh Burke':          'USS Arleigh Burke (DDG-51)',

  // ── UK destroyers / frigates ──────────────────────────────────────────────
  'HMS Defender':               'HMS Defender (D36)',
  'HMS Dragon':                 'HMS Dragon (D35)',
  'HMS Duncan':                 'HMS Duncan (D37)',
  'HMS Daring':                 'HMS Daring (D32)',
  'HMS Dauntless':              'HMS Dauntless (D33)',
  'HMS Diamond':                'HMS Diamond (D34)',
  'HMS Type 45':                'Type 45 destroyer',

  // ── Russian notable ships ─────────────────────────────────────────────────
  'Moskva':                     'Russian cruiser Moskva',
  'Admiral Nakhimov':           'Russian cruiser Admiral Nakhimov',
  'Peter the Great':            'Russian battlecruiser Pyotr Velikiy',

  // ── Chinese notable ships ─────────────────────────────────────────────────
  'Nanchang':                   'Chinese destroyer Nanchang (101)',
  'Renhai':                     'Type 055 destroyer',

  // ── Research / intelligence vessels ──────────────────────────────────────
  'USNS Victorious':            'USNS Victorious (T-AGOS-19)',
  'USNS Impeccable':            'USNS Impeccable (T-AGOS-23)',
  'Yuan Wang':                  'Yuan Wang (ship)',
};

// ─── Vessel type → representative Wikipedia article (fallback) ───────────────
const VESSEL_TYPE_TO_WIKI: Record<MilitaryVesselType, string> = {
  carrier:    'Gerald R. Ford-class aircraft carrier',
  destroyer:  'Arleigh Burke-class destroyer',
  frigate:    'Constellation-class frigate',
  submarine:  'Virginia-class submarine',
  amphibious: 'America-class amphibious assault ship',
  patrol:     'Cyclone-class patrol ship',
  auxiliary:  'Henry J. Kaiser-class underway replenishment oiler',
  research:   'USNS Impeccable (T-AGOS-23)',
  icebreaker: 'Arktika-class icebreaker',
  special:    '',
  unknown:    '',
};

/**
 * Return the best Wikipedia article title for a carrier strike group cluster.
 *
 * Resolution order:
 *  1. Carrier vessel found in the cluster → use its named lookup
 *  2. Parse the cluster name string to extract a recognisable ship fragment
 *     e.g. "Carl Vinson Strike Group CSG" → "USS Carl Vinson" entry
 *  3. Generic carrier-class fallback image
 */
export function getStrikeGroupWikiTitle(
  clusterName: string,
  vessels: Array<{ name: string; vesselType: string }>,
): string | null {
  // 1. Prefer the actual carrier in the group
  const carrier = vessels.find(v => v.vesselType === 'carrier');
  if (carrier?.name) {
    const title = getVesselWikiTitle(carrier.name, 'carrier');
    if (title) return title;
  }

  // 2. Strip boilerplate from cluster name and match a known vessel name fragment
  //    e.g. "Carl Vinson Strike Group CSG" → "Carl Vinson"
  const stripped = clusterName
    .replace(/\s*CSG\s*$/, '')
    .replace(/\s*(Carrier\s+)?Strike\s+Group\s*\d*\s*/gi, ' ')
    .trim();

  if (stripped.length > 3) {
    for (const [vesselName, wikiTitle] of Object.entries(VESSEL_NAME_TO_WIKI)) {
      // Match against the short form (sans USS/HMS/etc. prefix)
      const shortName = vesselName.replace(/^(USS|HMS|INS|ITS|USNS)\s+/, '');
      if (stripped.toLowerCase().includes(shortName.toLowerCase())) {
        return wikiTitle as string;
      }
    }
  }

  // 3. Generic carrier-class fallback
  return (VESSEL_TYPE_TO_WIKI['carrier'] as string | undefined) ?? null;
}

/**
 * Return the best Wikipedia article title for a naval vessel.
 *
 * Resolution order:
 *  1. Exact name match in VESSEL_NAME_TO_WIKI
 *  2. Partial / prefix match (e.g. "Yuan Wang 5" → "Yuan Wang")
 *  3. Vessel-type category fallback via VESSEL_TYPE_TO_WIKI
 *  4. Raw vessel name as last resort (works well for unique named ships)
 */
export function getVesselWikiTitle(
  vesselName: string,
  vesselType?: MilitaryVesselType,
): string | null {
  if (!vesselName) return null;
  const name = vesselName.trim();

  // Skip purely numeric names (MMSI-derived placeholders)
  if (/^\d+$/.test(name)) return null;
  // Skip very short codes
  if (name.length < 4) return null;

  // 1. Exact match
  if (VESSEL_NAME_TO_WIKI[name]) return VESSEL_NAME_TO_WIKI[name];

  // 2. Partial match — longest key that is a prefix of the vessel name
  //    Handles e.g. "Yuan Wang 5" → key "Yuan Wang"
  const prefixKey = Object.keys(VESSEL_NAME_TO_WIKI)
    .filter(k => name.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  const prefixValue: string | null = prefixKey
    ? ((VESSEL_NAME_TO_WIKI[prefixKey] as string | undefined) ?? null)
    : null;
  if (prefixValue) return prefixValue;

  // 3. Type-based fallback (shows a representative ship of the class)
  if (vesselType) {
    const typeFallback = VESSEL_TYPE_TO_WIKI[vesselType];
    if (typeFallback) return typeFallback;
  }

  // 4. Use the raw name directly — Wikipedia often has articles for named ships
  return name;
}
