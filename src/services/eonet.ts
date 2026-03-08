import type { NaturalEvent, NaturalEventCategory } from '@/types';
import { NATURAL_EVENT_CATEGORIES } from '@/types';
import {
  NaturalServiceClient,
  type ListNaturalEventsResponse,
} from '@/generated/client/marsd/natural/v1/service_client';
import { createCircuitBreaker } from '@/utils';
import { getHydratedData } from '@/services/bootstrap';
import { svgIcon, type IconName } from '@/utils/icons';

const CATEGORY_ICON_NAMES: Record<NaturalEventCategory, IconName> = {
  severeStorms: 'storm',
  wildfires: 'fire',
  volcanoes: 'volcano',
  earthquakes: 'earthquake',
  floods: 'flood',
  landslides: 'landslide',
  drought: 'drought',
  dustHaze: 'fog',
  snow: 'snow',
  tempExtremes: 'thermometer',
  seaLakeIce: 'ice',
  waterColor: 'water-color',
  manmade: 'warning',
};

const CATEGORY_COLORS: Record<NaturalEventCategory, string> = {
  severeStorms: '#88aaff',
  wildfires: '#ff6600',
  volcanoes: '#ff2020',
  earthquakes: '#ff4400',
  floods: '#44aaff',
  landslides: '#cc8844',
  drought: '#ffcc00',
  dustHaze: '#ccaa88',
  snow: '#ccddff',
  tempExtremes: '#ff6600',
  seaLakeIce: '#88ddff',
  waterColor: '#44dd88',
  manmade: '#ffaa00',
};

export function getNaturalEventIcon(category: NaturalEventCategory, size = 12): string {
  const name = CATEGORY_ICON_NAMES[category] ?? 'warning';
  const color = CATEGORY_COLORS[category] ?? '#ffaa00';
  return svgIcon(name, color, size);
}

function normalizeNaturalCategory(category: string | undefined): NaturalEventCategory {
  if (!category) return 'manmade';
  return NATURAL_EVENT_CATEGORIES.has(category as NaturalEventCategory)
    ? (category as NaturalEventCategory)
    : 'manmade';
}

const client = new NaturalServiceClient('', { fetch: (...args) => globalThis.fetch(...args) });
const breaker = createCircuitBreaker<ListNaturalEventsResponse>({ name: 'NaturalEvents', cacheTtlMs: 30 * 60 * 1000, persistCache: true });

const emptyFallback: ListNaturalEventsResponse = { events: [] };

function toNaturalEvent(e: ListNaturalEventsResponse['events'][number]): NaturalEvent {
  return {
    id: e.id,
    title: e.title,
    description: e.description || undefined,
    category: normalizeNaturalCategory(e.category),
    categoryTitle: e.categoryTitle,
    lat: e.lat,
    lon: e.lon,
    date: new Date(e.date),
    magnitude: e.magnitude ?? undefined,
    magnitudeUnit: e.magnitudeUnit ?? undefined,
    sourceUrl: e.sourceUrl || undefined,
    sourceName: e.sourceName || undefined,
    closed: e.closed,
  };
}

export async function fetchNaturalEvents(_days = 30): Promise<NaturalEvent[]> {
  const hydrated = getHydratedData('naturalEvents') as ListNaturalEventsResponse | undefined;
  const response = (hydrated?.events?.length ? hydrated : null) ?? await breaker.execute(async () => {
    return client.listNaturalEvents({ days: 30 });
  }, emptyFallback);

  return (response.events || []).map(toNaturalEvent);
}
