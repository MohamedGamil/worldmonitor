/**
 * RPC: listIranEvents
 *
 * Reads Iran-related conflict events from the Redis key written by
 * seed-iran-events.mjs (conflict:iran-events:v1). Returns empty on cache miss.
 *
 * When a non-English locale is requested via `req.lang`, the handler translates
 * event titles using Groq and caches the result per locale.
 * Falls back to the original English text on any translation error.
 */

import type {
  ServerContext,
  ListIranEventsRequest,
  ListIranEventsResponse,
  IranEvent,
} from '../../../../src/generated/server/marsd/conflict/v1/service_server';

import { getCachedJson, setCachedJson } from '../../../_shared/redis';
import { GROQ_API_URL, GROQ_MODEL, UPSTREAM_TIMEOUT_MS } from '../intelligence/v1/_shared';

const REDIS_KEY = 'conflict:iran-events:v1';

// Translated locale caches expire after 2 hours (base data refreshes every ~2h)
const LOCALE_CACHE_TTL = 3600 * 2;

const BATCH_SIZE = 10;

const LANG_NAME_MAP: Record<string, string> = {
  ar: 'Arabic (العربية)',
  fr: 'French (Français)',
  es: 'Spanish (Español)',
  de: 'German (Deutsch)',
  it: 'Italian (Italiano)',
  pt: 'Portuguese (Português)',
  ru: 'Russian (Русский)',
  zh: 'Chinese Simplified (简体中文)',
  ja: 'Japanese (日本語)',
  ko: 'Korean (한국어)',
  tr: 'Turkish (Türkçe)',
};

async function translateBatch(texts: string[], targetLang: string): Promise<string[] | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const langName = LANG_NAME_MAP[targetLang] ?? targetLang;

  try {
    const resp = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. You will receive a JSON array of strings. Translate each string into ${langName} and return ONLY a valid JSON array with the exact same number of elements in the same order. Do NOT wrap it in markdown. Do NOT add explanations. Preserve proper nouns and place names.`,
          },
          {
            role: 'user',
            content: JSON.stringify(texts),
          },
        ],
        temperature: 0.1,
        max_tokens: 800,
      }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (!resp.ok) return null;

    const data = await resp.json() as { choices?: Array<{ message?: { content?: string } }> };
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) return null;

    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return null;
    }

    if (!Array.isArray(parsed)) return null;

    return texts.map((orig, i) => (typeof parsed[i] === 'string' ? parsed[i] : orig));
  } catch {
    return null;
  }
}

export async function listIranEvents(
  _ctx: ServerContext,
  req: ListIranEventsRequest,
): Promise<ListIranEventsResponse> {
  const lang = (req.lang || '').trim().toLowerCase().slice(0, 10);
  const wantsLocale = lang && lang !== 'en' && /^[a-z]{2,5}$/.test(lang);

  try {
    // For non-English requests check locale-specific cache first.
    // Locale keys are written via setCachedJson (prefixed) so read without raw=true.
    if (wantsLocale) {
      const localeKey = `${REDIS_KEY}:${lang}`;
      const localeCached = await getCachedJson(localeKey);
      if (localeCached && typeof localeCached === 'object' && 'events' in (localeCached as Record<string, unknown>)) {
        return localeCached as ListIranEventsResponse;
      }
    }

    // Fetch base English data (written by seed script without env prefix)
    const cached = await getCachedJson(REDIS_KEY, true);
    if (!cached || typeof cached !== 'object' || !('events' in (cached as Record<string, unknown>))) {
      return { events: [], scrapedAt: '0' };
    }
    const base = cached as ListIranEventsResponse;

    // English or no translation needed — return as-is
    if (!wantsLocale || base.events.length === 0) {
      return base;
    }

    // Translate titles in batches
    const events = base.events;
    const titles = events.map(e => e.title);

    const batches: string[][] = [];
    for (let i = 0; i < titles.length; i += BATCH_SIZE) {
      batches.push(titles.slice(i, i + BATCH_SIZE));
    }

    const batchResults = await Promise.all(batches.map(batch => translateBatch(batch, lang)));

    // If every batch failed, return untranslated without caching so the next
    // request retries Groq instead of serving stale English from locale cache
    if (batchResults.every(r => r === null)) {
      return base;
    }

    const translatedTitles = titles.map((orig, i) => {
      const batchIdx = Math.floor(i / BATCH_SIZE);
      const slotIdx = i % BATCH_SIZE;
      return batchResults[batchIdx]?.[slotIdx] ?? orig;
    });

    const translatedEvents: IranEvent[] = events.map((e, i) => ({
      ...e,
      title: translatedTitles[i] ?? e.title,
    }));

    const result: ListIranEventsResponse = { ...base, events: translatedEvents };

    const localeKey = `${REDIS_KEY}:${lang}`;
    await setCachedJson(localeKey, result, LOCALE_CACHE_TTL);

    return result;
  } catch {
    return { events: [], scrapedAt: '0' };
  }
}
