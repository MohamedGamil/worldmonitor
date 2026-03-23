// Military Strikes Layer (3D Globe + 2D Map)
// This module wires a client-side pipeline that ingests strike events from news sources,
// normalizes them to a StrikeEvent model, computes coordinates/arc paths, and renders
// them on GlobeMap (3D) and DeckGLMap (2D).

// Define the data model for a strike event
export type StrikeEvent = {
  id: string;
  originCountry: string;
  targetCountry: string;
  originCoord: [number, number]; // [lon, lat]
  targetCoord: [number, number]; // [lon, lat]
  timestamp: string; // ISO 8601
  source: string;
  summary: string;
  confidence: number; // 0.0 - 1.0
  tooltipEn: string;
  tooltipAr: string;
};

// Mock data fetcher - in production this would aggregate from news feeds/API
export async function fetchStrikeEvents(): Promise<StrikeEvent[]> {
  // Simulating fetching from a client-side aggregated store
  console.log('Fetching military strike events...');
  
  // Mock data representing a strike
  const mockEvents: StrikeEvent[] = [
    {
      id: 'strike-sample-001',
      originCountry: 'Country A',
      targetCountry: 'Country B',
      originCoord: [45.0, 32.0], // Example coords
      targetCoord: [55.0, 25.0],
      timestamp: new Date().toISOString(),
      source: 'GlobalNewsAggregator',
      summary: 'Reported aerial strike targeting infrastructure.',
      confidence: 0.85,
      tooltipEn: 'Strike from Country A to Country B\nSource: GlobalNewsAggregator',
      tooltipAr: 'ضربة جوية من الدولة أ إلى الدولة ب\nالمصدر: مجمع الأخبار العالمي'
    },
    {
      id: 'strike-sample-002',
      originCountry: 'Country C',
      targetCountry: 'Country D',
      originCoord: [100.0, 15.0], 
      targetCoord: [102.0, 13.0],
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      source: 'OSINT-Telegram',
      summary: 'Artillery fire exchange reported at border.',
      confidence: 0.70,
      tooltipEn: 'Border conflict: Country C -> Country D\nSource: OSINT-Telegram',
      tooltipAr: 'نزاغ حدودي: الدولة ج -> الدولة د\nالمصدر: OSINT-Telegram'
    }
  ];

  return mockEvents;
}

// ---------------------------------------------------------------------------
// Layer Rendering Logic (Framework Agnostic Adapter)
// ---------------------------------------------------------------------------

// Arc Layer Configuration for Deck.gl (2D/3D flat map)
export function getDeckGLArcLayer(data: StrikeEvent[]) {
  // Assuming 'ArcLayer' is available in the project's deck.gl imports
  // This function returns a configuration object compatible with deck.gl
  return {
    id: 'military-strikes-arc-layer',
    data: data,
    getSourcePosition: (d: StrikeEvent) => d.originCoord,
    getTargetPosition: (d: StrikeEvent) => d.targetCoord,
    getSourceColor: [255, 0, 0, 180], // Red for origin
    getTargetColor: [255, 140, 0, 180], // Orange for target
    getWidth: 2,
    pickable: true,
    // onHover handler would typically be wired in the main map component
  };
}

// Globe Layer Configuration (3D Globe.gl)
export function getGlobeArcLayer(globeInstance: any, data: StrikeEvent[]) {
  if (!globeInstance) return;

  // Globe.gl uses its own API for arcs
  globeInstance
    .arcsData(data)
    .arcStartLat((d: StrikeEvent) => d.originCoord[1])
    .arcStartLng((d: StrikeEvent) => d.originCoord[0])
    .arcEndLat((d: StrikeEvent) => d.targetCoord[1])
    .arcEndLng((d: StrikeEvent) => d.targetCoord[0])
    .arcColor(() => ['rgba(255,0,0,0.8)', 'rgba(255,140,0,0.8)'])
    .arcDashLength(0.4)
    .arcDashGap(0.2)
    .arcDashAnimateTime(1500)
    .arcStroke(0.5);
    // Label logic would be added via .labelsData() or markers mechanism
}

// ---------------------------------------------------------------------------
// Localization Helper
// ---------------------------------------------------------------------------

export function getTooltipContent(event: StrikeEvent, locale: 'en' | 'ar' = 'en'): string {
  if (locale === 'ar') {
    return `<div class="tooltip-ar" dir="rtl"><strong>${event.targetCountry}</strong><br/>${event.tooltipAr}<br/><small>${event.timestamp}</small></div>`;
  }
  return `<div class="tooltip-en"><strong>${event.targetCountry}</strong><br/>${event.tooltipEn}<br/><small>${event.timestamp}</small></div>`;
}
