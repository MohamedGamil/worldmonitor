/**
 * DeckGLMap - WebGL-accelerated map visualization for desktop
 * Uses deck.gl for high-performance rendering of large datasets
 * Mobile devices gracefully degrade to the D3/SVG-based Map component
 */
import { MapboxOverlay } from '@deck.gl/mapbox';
import type { Layer, LayersList, PickingInfo } from '@deck.gl/core';
import { GeoJsonLayer, ScatterplotLayer, PathLayer, IconLayer, TextLayer, PolygonLayer } from '@deck.gl/layers';
import maplibregl from 'maplibre-gl';
import Supercluster from 'supercluster';
import type { GetClustersResult } from '@/workers/map-cluster.worker';
import type {
  MapLayers,
  Hotspot,
  NewsItem,
  InternetOutage,
  RelatedAsset,
  AssetType,
  AisDisruptionEvent,
  AisDensityZone,
  CableAdvisory,
  RepairShip,
  SocialUnrestEvent,
  AIDataCenter,
  MilitaryFlight,
  MilitaryVessel,
  MilitaryFlightCluster,
  MilitaryVesselCluster,
  NavalActivitySnapshot,
  NavalStrikeGroup,
  SeededVessel,
  NavalCluster,
  NaturalEvent,
  UnderseaCable,
  UcdpGeoEvent,
  MapProtestCluster,
  MapTechHQCluster,
  MapTechEventCluster,
  MapDatacenterCluster,
  CyberThreat,
  CableHealthRecord,
  MilitaryBaseEnriched,
} from '@/types';
import { fetchMilitaryBases, type MilitaryBaseCluster as ServerBaseCluster } from '@/services/military-bases';
import type { AirportDelayAlert, PositionSample } from '@/services/aviation';
import { fetchAircraftPositions } from '@/services/aviation';
import type { IranEvent } from '@/services/conflict';
import type { GpsJamHex } from '@/services/gps-interference';
import type { DisplacementFlow } from '@/services/displacement';
import type { Earthquake } from '@/services/earthquakes';
import type { ClimateAnomaly } from '@/services/climate';
import { ArcLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { H3HexagonLayer } from '@deck.gl/geo-layers';
import type { WeatherAlert } from '@/services/weather';
import { escapeHtml } from '@/utils/sanitize';
import { svgIcon } from '@/utils/icons';
import { tokenizeForMatch, matchKeyword, matchesAnyKeyword, findMatchingKeywords } from '@/utils/keyword-match';
import { t, getCurrentLanguage, getLocalizedGeoName, getLocalizedCountryName } from '@/services/i18n';
import arGeoFallbacks from '@/locales/geo/ar';
import { debounce, rafSchedule, getCurrentTheme } from '@/utils/index';
import { localizeMapLabels } from '@/utils/map-locale';
import { identifyByCallsign, isKnownMilitaryHex } from '@/config/military';
import {
  INTEL_HOTSPOTS,
  CONFLICT_ZONES,
  GEOPOLITICAL_BOUNDARIES,

  MILITARY_BASES,
  UNDERSEA_CABLES,
  NUCLEAR_FACILITIES,
  GAMMA_IRRADIATORS,
  PIPELINES,
  PIPELINE_COLORS,
  STRATEGIC_WATERWAYS,
  ECONOMIC_CENTERS,
  AI_DATA_CENTERS,
  SITE_VARIANT,
  STARTUP_HUBS,
  ACCELERATORS,
  TECH_HQS,
  CLOUD_REGIONS,
  PORTS,
  SPACEPORTS,
  APT_GROUPS,
  CRITICAL_MINERALS,
  STOCK_EXCHANGES,
  FINANCIAL_CENTERS,
  CENTRAL_BANKS,
  COMMODITY_HUBS,
  GULF_INVESTMENTS,
} from '@/config';
import type { GulfInvestment } from '@/types';
import { resolveTradeRouteSegments, TRADE_ROUTES as TRADE_ROUTES_LIST, type TradeRouteSegment } from '@/config/trade-routes';
import { getLayersForVariant, resolveLayerLabel, type MapVariant } from '@/config/map-layer-definitions';
import { haversineKm } from '@/utils/distance';
import { expandUnderseaCablePaths, constrainUnderseaCablesToWater } from '@/utils/undersea-cables';
import { MapPopup, type PopupType, type EnrichedAircraftPopupData } from './MapPopup';
import {
  updateHotspotEscalation,
  getHotspotEscalation,
  setMilitaryData,
  setCIIGetter,
  setGeoAlertGetter,
} from '@/services/hotspot-escalation';
import { getCountryScore } from '@/services/country-instability';
import { getAlertsNearLocation } from '@/services/geo-convergence';
import type { PositiveGeoEvent } from '@/services/positive-events-geo';
import type { KindnessPoint } from '@/services/kindness-data';
import type { HappinessData } from '@/services/happiness-data';
import type { RenewableInstallation } from '@/services/renewable-installations';
import type { SpeciesRecovery } from '@/services/conservation-data';
import { getCountriesGeoJson, getCountryAtCoordinates, getCountryBbox, preloadCountryGeometry } from '@/services/country-geometry';
import type { FeatureCollection, Geometry } from 'geojson';

export type TimeRange = '1h' | '6h' | '24h' | '48h' | '7d' | 'all';
export type DeckMapView = 'global' | 'america' | 'mena' | 'eu' | 'asia' | 'latam' | 'africa' | 'oceania';
type MapInteractionMode = 'flat' | '3d';

export interface CountryClickPayload {
  lat: number;
  lon: number;
  code?: string;
  name?: string;
}

interface DeckMapState {
  zoom: number;
  pan: { x: number; y: number };
  view: DeckMapView;
  layers: MapLayers;
  timeRange: TimeRange;
}

interface HotspotWithBreaking extends Hotspot {
  hasBreaking?: boolean;
}

interface TechEventMarker {
  id: string;
  title: string;
  location: string;
  lat: number;
  lng: number;
  country: string;
  startDate: string;
  endDate: string;
  url: string | null;
  daysUntil: number;
}

// View presets with longitude, latitude, zoom
const VIEW_PRESETS: Record<DeckMapView, { longitude: number; latitude: number; zoom: number }> = {
  global: { longitude: 0, latitude: 20, zoom: 1.5 },
  america: { longitude: -95, latitude: 38, zoom: 3 },
  mena: { longitude: 45, latitude: 28, zoom: 3.5 },
  eu: { longitude: 15, latitude: 50, zoom: 3.5 },
  asia: { longitude: 105, latitude: 35, zoom: 3 },
  latam: { longitude: -60, latitude: -15, zoom: 3 },
  africa: { longitude: 20, latitude: 5, zoom: 3 },
  oceania: { longitude: 135, latitude: -25, zoom: 3.5 },
};

const MAP_INTERACTION_MODE: MapInteractionMode =
  import.meta.env.VITE_MAP_INTERACTION_MODE === 'flat' ? 'flat' : '3d';
const SHOW_NAVAL_DEV_OVERLAY = import.meta.env.DEV;

const DARK_STYLE = SITE_VARIANT === 'happy'
  ? '/map-styles/happy-dark.json'
  : 'https://tiles.openfreemap.org/styles/dark';
const LIGHT_STYLE = SITE_VARIANT === 'happy'
  ? '/map-styles/happy-light.json'
  : 'https://tiles.openfreemap.org/styles/positron';

const FALLBACK_DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const FALLBACK_LIGHT_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

// Zoom thresholds for layer visibility and labels (matches old Map.ts)
// Zoom-dependent layer visibility and labels
const LAYER_ZOOM_THRESHOLDS: Partial<Record<keyof MapLayers, { minZoom: number; showLabels?: number }>> = {
  bases: { minZoom: 3, showLabels: 5 },
  nuclear: { minZoom: 3 },
  conflicts: { minZoom: 1, showLabels: 3 },
  economic: { minZoom: 3 },
  natural: { minZoom: 1, showLabels: 2 },
  datacenters: { minZoom: 5 },
  irradiators: { minZoom: 4 },
  spaceports: { minZoom: 3 },
  gulfInvestments: { minZoom: 2, showLabels: 5 },
};
// Export for external use
export { LAYER_ZOOM_THRESHOLDS };

// Theme-aware overlay color function — refreshed each buildLayers() call
function getOverlayColors() {
  const isLight = getCurrentTheme() === 'light';
  return {
    // Threat dots: IDENTICAL in both modes (user locked decision)
    hotspotHigh: [255, 68, 68, 200] as [number, number, number, number],
    hotspotElevated: [255, 165, 0, 200] as [number, number, number, number],
    hotspotLow: [255, 255, 0, 180] as [number, number, number, number],

    // Conflict zone fills: more transparent in light mode
    conflict: isLight
      ? [255, 0, 0, 60] as [number, number, number, number]
      : [255, 0, 0, 100] as [number, number, number, number],

    // Infrastructure/category markers: darker variants in light mode for map readability
    base: [0, 150, 255, 200] as [number, number, number, number],
    nuclear: isLight
      ? [180, 120, 0, 220] as [number, number, number, number]
      : [255, 215, 0, 200] as [number, number, number, number],
    datacenter: isLight
      ? [13, 148, 136, 200] as [number, number, number, number]
      : [0, 255, 200, 180] as [number, number, number, number],
    cable: [0, 200, 255, 150] as [number, number, number, number],
    cableHighlight: [255, 100, 100, 200] as [number, number, number, number],
    cableFault: [255, 50, 50, 220] as [number, number, number, number],
    cableDegraded: [255, 165, 0, 200] as [number, number, number, number],
    earthquake: [255, 100, 50, 200] as [number, number, number, number],
    vesselMilitary: [255, 100, 100, 220] as [number, number, number, number],
    flightMilitary: [160, 190, 225, 220] as [number, number, number, number],
    protest: [255, 150, 0, 200] as [number, number, number, number],
    outage: [255, 50, 50, 180] as [number, number, number, number],
    weather: [100, 150, 255, 180] as [number, number, number, number],
    startupHub: isLight
      ? [22, 163, 74, 220] as [number, number, number, number]
      : [0, 255, 150, 200] as [number, number, number, number],
    techHQ: [100, 200, 255, 200] as [number, number, number, number],
    accelerator: isLight
      ? [180, 120, 0, 220] as [number, number, number, number]
      : [255, 200, 0, 200] as [number, number, number, number],
    cloudRegion: [150, 100, 255, 180] as [number, number, number, number],
    stockExchange: isLight
      ? [20, 120, 200, 220] as [number, number, number, number]
      : [80, 200, 255, 210] as [number, number, number, number],
    financialCenter: isLight
      ? [0, 150, 110, 215] as [number, number, number, number]
      : [0, 220, 150, 200] as [number, number, number, number],
    centralBank: isLight
      ? [180, 120, 0, 220] as [number, number, number, number]
      : [255, 210, 80, 210] as [number, number, number, number],
    commodityHub: isLight
      ? [190, 95, 40, 220] as [number, number, number, number]
      : [255, 150, 80, 200] as [number, number, number, number],
    gulfInvestmentSA: [0, 168, 107, 220] as [number, number, number, number],
    gulfInvestmentUAE: [255, 0, 100, 220] as [number, number, number, number],
    ucdpStateBased: [255, 50, 50, 200] as [number, number, number, number],
    ucdpNonState: [255, 165, 0, 200] as [number, number, number, number],
    ucdpOneSided: [255, 255, 0, 200] as [number, number, number, number],
  };
}
// Initialize and refresh on every buildLayers() call
let COLORS = getOverlayColors();

// SVG icons as data URLs for different marker shapes
const MARKER_ICONS = {
  // Square - for datacenters
  square: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect x="2" y="2" width="28" height="28" rx="3" fill="white"/></svg>`),
  // Diamond - for hotspots
  diamond: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><polygon points="16,2 30,16 16,30 2,16" fill="white"/></svg>`),
  // Triangle up - for military bases
  triangleUp: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><polygon points="16,2 30,28 2,28" fill="white"/></svg>`),
  // Hexagon - for nuclear
  hexagon: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><polygon points="16,2 28,9 28,23 16,30 4,23 4,9" fill="white"/></svg>`),
  // Circle - fallback
  circle: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="white"/></svg>`),
  // Star - for special markers
  star: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><polygon points="16,2 20,12 30,12 22,19 25,30 16,23 7,30 10,19 2,12 12,12" fill="white"/></svg>`),
  // Aircraft silhouette - fighter jet (from fighter-jet-svgrepo-com.svg, pointing north, rotated by heading)
  plane: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 -64 640 640"><path fill="white" d="M544 224l-128-16-48-16h-24L227.158 44h39.509C278.333 44 288 41.375 288 38s-9.667-6-21.333-6H152v12h16v164h-48l-66.667-80H18.667L8 138.667V208h8v16h48v2.666l-64 8v42.667l64 8V288H16v16H8v69.333L18.667 384h34.667L120 304h48v164h-16v12h114.667c11.667 0 21.333-2.625 21.333-6s-9.667-6-21.333-6h-39.509L344 320h24l48-16 128-16c96-21.333 96-26.583 96-32 0-5.417 0-10.667-96-32z"/></svg>`),
  // Civilian aircraft silhouette (optimized from artifacts/plane-updated.svg.md)
  planeCivilian: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="-225.072 101.737 500 500"><path fill="white" fill-rule="evenodd" clip-rule="evenodd" transform="matrix(.707107 .707107 -.707107 .707107 8e-6 -4e-6)" d="M110.4 378.152C110.429 366.497 117.052 355.102 127.84 342.348L65.457 302.9C61.523 301.193 61.61 298.793 63.895 295.959L77.112 284.679C79.512 283.204 82.057 282.568 84.805 283.32L161.793 296.335 225.94 226.866 76.186 125.555C72.398 123.328 72.08 120.812 75.984 117.891L97.588 100.654 292.806 155.517 350.475 93.857C369.823 77.112 388.622 69.622 403.053 73.179 411.007 75.145 413.812 77.517 416.27 84.979 421.042 99.613 413.639 119.279 396.141 139.524L334.481 197.193 389.345 392.411 372.108 414.015C369.187 417.89 366.671 417.572 364.444 413.812L263.104 264.087 193.635 328.206 206.65 405.194C207.402 407.912 206.794 410.457 205.291 412.887L194.011 426.104C191.206 428.389 188.777 428.475 187.07 424.542L147.622 362.159C134.81 372.976 123.415 379.599 111.702 379.599 110.632 379.57 110.4 379.194 110.4 378.152Z"/></svg>`),
  // Naval vessel silhouette (from warship-simple.svg)
  ship: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 2095 2095"><path fill="white" fill-rule="nonzero" d="M 2078.29 1175.37 C 2078.29 1187.92 2018.45 1351.02 2005.91 1370.32 C 1993.36 1389.62 1966.14 1389.62 1966.14 1389.62 L 147 1389.62 C 122.873 1271.88 16.713 1151.25 16.713 1150.28 C 16.713 1149.32 441.352 1151.25 436.526 1150.28 L 436.526 1113.61 L 275.453 1078.87 L 285.104 1046.05 L 442.413 1063.42 C 452.064 1046.05 474.261 1044.12 481.886 1044.12 C 489.606 1044.12 561.988 1044.12 561.988 1044.12 C 589.059 1044.12 593.884 1047.02 593.884 1083.69 C 593.884 1120.36 593.884 1152.21 593.884 1152.21 L 657.676 1152.21 L 657.676 1015.17 L 694.157 1015.17 L 694.157 929.278 L 645.034 929.278 L 645.034 892.605 L 664.335 892.605 L 624.767 811.538 L 639.243 803.817 L 675.916 880.059 L 675.916 705.378 L 693.288 705.378 L 693.288 881.989 L 737.586 881.989 L 737.586 863.653 C 737.586 848.211 750.228 835.665 765.67 835.665 L 771.364 835.665 C 786.902 835.665 799.448 848.211 799.448 863.653 L 799.448 881.989 L 826.567 881.989 C 843.745 881.989 848.571 884.884 848.571 913.837 L 848.571 1029.65 C 848.571 1047.02 856.291 1069.21 870.768 1044.12 C 885.244 1020 932.726 928.313 947.203 901.291 C 961.679 874.268 966.504 871.373 983.683 871.373 C 1001.06 871.373 1033.1 871.373 1064.95 871.373 C 1096.79 871.373 1094.67 895.5 1089.07 910.942 C 1084.25 925.418 1033.1 1094.31 1033.1 1094.31 L 1116.1 1094.31 L 1116.1 1017.1 C 1116.1 978.498 1146.98 947.615 1185.58 947.615 L 1262.79 947.615 C 1301.39 947.615 1332.28 978.498 1332.28 1017.1 L 1332.28 1094.31 C 1332.28 1094.31 1452.91 1092.38 1481.86 1094.31 C 1498.08 1095.27 1505.99 1100.1 1505.99 1122.29 C 1505.99 1144.49 1505.99 1167.65 1505.99 1167.65 L 1552.32 1167.65 L 1552.32 1101.06 C 1552.32 1082.72 1566.79 1068.25 1584.94 1068.25 L 1663.3 1068.25 C 1681.44 1068.25 1695.92 1082.72 1695.92 1101.06 L 1695.92 1113.61 L 1800.34 1076.93 L 1812.89 1111.68 L 1697.08 1156.07 L 1697.08 1175.37 L 1704.8 1175.37 L 2078.29 1175.37 Z"/></svg>`),

  // Aircraft carrier silhouette (from aricraft-carrier.svg)
  carrier: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 2095 2095"><path fill="white" fill-rule="nonzero" d="M 2079.04 1099.31 L 2079.04 1227.43 L 1977.3 1334.82 L 99.806 1334.82 C 73.429 1188.81 15.964 1099.31 15.964 1099.31 L 821.41 1099.31 L 821.41 958.006 C 805.395 958.006 792.207 944.817 792.207 928.803 C 792.207 912.788 805.395 899.599 821.41 899.599 L 826.12 899.599 C 826.12 899.599 826.12 760.177 826.12 760.177 L 844.019 760.177 L 844.019 899.599 L 892.063 899.599 L 892.063 870.396 L 892.063 851.555 C 892.063 835.541 905.252 822.352 921.266 822.352 L 997.572 822.352 C 1013.59 822.352 1026.78 835.541 1026.78 851.555 L 1026.78 870.396 L 1026.78 899.599 L 1107.79 899.599 C 1123.81 899.599 1136.99 912.788 1136.99 928.803 C 1136.99 944.817 1123.81 958.006 1107.79 958.006 L 1107.79 999.456 L 1276.42 999.456 C 1299.97 996.63 1307.5 1009.82 1307.5 1033.37 L 1307.5 1098.37 L 2079.04 1098.37 L 2079.04 1099.31 Z M 1600.48 1068.22 C 1628.74 1072.93 1660.77 1071.99 1685.26 1071.99 C 1740.84 1071.99 1831.28 1071.99 1831.28 1071.99 C 1840.7 1070.11 1874.61 1059.75 1874.61 1059.75 L 1877.44 1039.02 L 1869.9 1039.02 L 1890.63 999.456 L 1868.02 999.456 L 1830.34 1039.02 C 1830.34 1039.02 1700.34 1039.02 1676.78 1034.31 C 1652.29 1029.6 1644.76 1027.72 1636.28 1027.72 C 1627.8 1027.72 1617.43 1031.48 1613.67 1033.37 C 1595.77 1039.96 1587.29 1039.96 1580.7 1042.79 C 1554.32 1055.98 1572.22 1063.52 1600.48 1068.22 Z M 360.751 1068.22 C 389.013 1072.93 421.042 1071.99 445.535 1071.99 C 501.116 1071.99 591.552 1071.99 591.552 1071.99 C 600.972 1070.11 634.886 1059.75 634.886 1059.75 L 637.712 1039.02 L 630.175 1039.02 L 650.9 999.456 L 628.291 999.456 L 590.61 1039.02 C 590.61 1039.02 460.608 1039.02 437.057 1034.31 C 412.564 1029.6 405.027 1027.72 396.549 1027.72 C 388.071 1027.72 377.708 1031.48 373.94 1033.37 C 356.041 1039.96 347.563 1039.96 340.969 1042.79 C 314.591 1055.98 332.49 1063.52 360.751 1068.22 Z"/></svg>`),
    // Cardinal compass star - for military bases (from cardinal-compass.svg)
  compass: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="white" d="M12,24l-3-9L0,12l9-3L12,0l3,9,9,3-9,3-3,9ZM7.425,7.425l.473-1.385-3.898-2.039,2.039,3.898,1.385-.473Zm9.15,0l1.385,.473,2.039-3.897-3.898,2.039,.473,1.385ZM7.424,16.575l-1.385-.473-2.039,3.898,3.897-2.039-.473-1.385Zm9.151,0l-.473,1.385,3.898,2.039-2.039-3.898-1.385,.473Z"/></svg>`),
  // Airport check-in: location pin with inner circle + aircraft silhouette (from airport-check-in.svg, optimized)
  airport: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 512 512"><path fill="white" d="M132.6 287.7l118.3 175.2c2.4 3.6 7.8 3.6 10.2 0l118.3-175.2 6.1-9-.1.1c15.3-24.7 23.8-54 22.7-85.4-2.7-78.4-65.6-142.6-144-146.7C176.5 42.2 104 112.2 104 198.6c0 29.4 8.4 56.8 22.8 80.1 1.5 2.4 3.3 5.2 5.8 9zm123.4-196.7c59.4 0 107.6 48.2 107.6 107.6 0 59.4-48.2 107.6-107.6 107.6S148.4 258 148.4 198.6 196.6 91 256 91z"/><path fill="white" d="M187.5 162.6c.6 1 1.4 1.8 2.3 2.4l36.1 26 10.3 61.3c.4 2.4 1.7 4.7 3.5 6.3l6.4 5.6c1.7 1.5 4.4.3 4.4-2l.4-53 35.9 26c8.2 5.9 19.2 6.2 27.7.7l13.8-9c1.6-1 1.9-3.2.6-4.6l-1.5-1.7c-2.8-3.1-7-4.6-11.2-3.8l-15.8 3-73.4-62.3c-7.1-6.1-16.2-9.6-25.6-9.5-3 .1-6.1.4-9.2 1.4-5.6 1.7-8 8-5 13.1l.3.4z"/><path fill="white" d="M272.8 181.5c2.2 2 5.1 3 8 2.9l38.5-1.8c1.9-.4 2.4-2.8.9-4l-5.7-4.2c-1.7-1.2-3.7-1.9-5.7-1.8l-46.4-5.1c-1.9-.2-2.9 2.1-1.5 3.4z"/></svg>`),
  // Radiation symbol - ringed with three sector arms (from radiation-alt (1).svg)
  radiation: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="white" d="m12,0C5.383,0,0,5.383,0,12s5.383,12,12,12,12-5.383,12-12S18.617,0,12,0Zm0,21c-4.963,0-9-4.037-9-9S7.037,3,12,3s9,4.037,9,9-4.037,9-9,9Zm-1.5-9c0-.828.672-1.5,1.5-1.5s1.5.672,1.5,1.5-.672,1.5-1.5,1.5-1.5-.672-1.5-1.5Zm8.5,0h-3.5c0-1.221-.628-2.294-1.576-2.92l1.926-2.927c.773.508,1.459,1.177,2,2,.781,1.188,1.151,2.525,1.15,3.848Zm-10.5,0h-3.5c-.001-1.323.368-2.66,1.15-3.848.541-.822,1.227-1.491,2-2l1.926,2.927c-.948.626-1.576,1.699-1.576,2.92Zm5.338,2.969l1.841,2.973c-1.07.665-2.326,1.06-3.678,1.06s-2.608-.395-3.678-1.06l1.84-2.973c.535.332,1.162.531,1.838.531s1.303-.199,1.838-.531Z"/></svg>`),
};

const RADIATION_ICON_MAPPING = { radiation: { x: 0, y: 0, width: 32, height: 32, mask: true } };
const AIRCRAFT_ICON_MAPPING = { plane: { x: 0, y: 0, width: 32, height: 32, mask: true } };
const CIVILIAN_AIRCRAFT_ICON_MAPPING = { 'plane-civilian': { x: 0, y: 0, width: 32, height: 32, mask: true } };
const SHIP_ICON_MAPPING = { ship: { x: 0, y: 0, width: 32, height: 32, mask: true } };
const CARRIER_ICON_MAPPING = { carrier: { x: 0, y: 0, width: 32, height: 32, mask: true } };
const DATACENTER_ICON_MAPPING = { square: { x: 0, y: 0, width: 32, height: 32, mask: true } };
const COMPASS_ICON_MAPPING = { compass: { x: 0, y: 0, width: 32, height: 32, mask: true } };
const AIRPORT_ICON_MAPPING = { airport: { x: 0, y: 0, width: 32, height: 32, mask: true } };

const CONFLICT_ZONES_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: CONFLICT_ZONES.map(zone => ({
    type: 'Feature' as const,
    properties: { id: zone.id, name: zone.name, intensity: zone.intensity },
    geometry: { type: 'Polygon' as const, coordinates: [zone.coords] },
  })),
};


export class DeckGLMap {
  private static readonly MAX_CLUSTER_LEAVES = 200;
  private static readonly MAX_FIRE_POINTS = 10_000;

  private container: HTMLElement;
  private deckOverlay: MapboxOverlay | null = null;
  private maplibreMap: maplibregl.Map | null = null;
  private state: DeckMapState;
  private popup: MapPopup;
  private isResizing = false;
  private savedTopLat: number | null = null;
  private correctingCenter = false;

  // Data stores
  private hotspots: HotspotWithBreaking[];
  private earthquakes: Earthquake[] = [];
  private weatherAlerts: WeatherAlert[] = [];
  private outages: InternetOutage[] = [];
  private cyberThreats: CyberThreat[] = [];
  private iranEvents: IranEvent[] = [];
  private aisDisruptions: AisDisruptionEvent[] = [];
  private aisDensity: AisDensityZone[] = [];
  private cableAdvisories: CableAdvisory[] = [];
  private repairShips: RepairShip[] = [];
  private healthByCableId: Record<string, CableHealthRecord> = {};
  private protests: SocialUnrestEvent[] = [];
  private militaryFlights: MilitaryFlight[] = [];
  private militaryFlightClusters: MilitaryFlightCluster[] = [];
  private militaryVessels: MilitaryVessel[] = [];
  private militaryVesselClusters: MilitaryVesselCluster[] = [];
  private navalSnapshot: NavalActivitySnapshot | null = null;
  private showNavalDevOverlay = SHOW_NAVAL_DEV_OVERLAY;
  private navalInfoOverlayEl: HTMLElement | null = null;
  private serverBases: MilitaryBaseEnriched[] = [];
  private serverBaseClusters: ServerBaseCluster[] = [];
  private serverBasesLoaded = false;
  private naturalEvents: NaturalEvent[] = [];
  private firmsFireData: Array<{ lat: number; lon: number; brightness: number; frp: number; confidence: number; region: string; acq_date: string; daynight: string }> = [];
  private techEvents: TechEventMarker[] = [];
  private flightDelays: AirportDelayAlert[] = [];
  private aircraftPositions: PositionSample[] = [];
  private aircraftFetchTimer: ReturnType<typeof setInterval> | null = null;
  private news: NewsItem[] = [];
  private newsLocations: Array<{ lat: number; lon: number; title: string; threatLevel: string; timestamp?: Date }> = [];
  private newsLocationFirstSeen = new Map<string, number>();
  private ucdpEvents: UcdpGeoEvent[] = [];
  private displacementFlows: DisplacementFlow[] = [];
  private gpsJammingHexes: GpsJamHex[] = [];
  private climateAnomalies: ClimateAnomaly[] = [];
  private tradeRouteSegments: TradeRouteSegment[] = resolveTradeRouteSegments();
  private renderableUnderseaCables: UnderseaCable[] = expandUnderseaCablePaths(UNDERSEA_CABLES);
  private positiveEvents: PositiveGeoEvent[] = [];
  private kindnessPoints: KindnessPoint[] = [];

  // Phase 8 overlay data
  private happinessScores: Map<string, number> = new Map();
  private happinessYear = 0;
  private happinessSource = '';
  private speciesRecoveryZones: Array<SpeciesRecovery & { recoveryZone: { name: string; lat: number; lon: number } }> = [];
  private renewableInstallations: RenewableInstallation[] = [];
  private countriesGeoJsonData: FeatureCollection<Geometry> | null = null;

  // CII choropleth data
  private ciiScoresMap: Map<string, { score: number; level: string }> = new Map();
  private ciiScoresVersion = 0;

  // Country highlight state
  private countryGeoJsonLoaded = false;
  private countryHoverSetup = false;
  private highlightedCountryCode: string | null = null;

  // Callbacks
  private onHotspotClick?: (hotspot: Hotspot) => void;
  private onTimeRangeChange?: (range: TimeRange) => void;
  private onCountryClick?: (country: CountryClickPayload) => void;
  private onLayerChange?: (layer: keyof MapLayers, enabled: boolean, source: 'user' | 'programmatic') => void;
  private onStateChange?: (state: DeckMapState) => void;
  private onAircraftPositionsUpdate?: (positions: PositionSample[]) => void;

  // Highlighted assets
  private highlightedAssets: Record<AssetType, Set<string>> = {
    pipeline: new Set(),
    cable: new Set(),
    datacenter: new Set(),
    base: new Set(),
    nuclear: new Set(),
  };

  private renderScheduled = false;
  private renderPaused = false;
  private renderPending = false;
  private webglLost = false;
  private usedFallbackStyle = false;
  private styleLoadTimeoutId: ReturnType<typeof setTimeout> | null = null;


  // --- Optimization: dirty-flag layer rebuilds (spec 06, §1.1) ---
  private dirtyLayers: Set<string> = new Set();
  // --- Optimization: batch update coalescing (spec 06, §1.2) ---
  private _batchingUpdates = false;
  // --- Optimization: memoized time filtering (spec 06, §1.3) ---
  private timeFilterCache: Map<string, { dataLength: number; timeRange: TimeRange; result: unknown[] }> = new Map();
  // --- Optimization: render pause during gestures (spec 06, §4.4) ---
  private gestureActive = false;
  private gestureEndTimeoutId: ReturnType<typeof setTimeout> | null = null;

  private layerCache: Map<string, any> = new Map();
  private lastZoomThreshold = 0;
  private mapClusterWorker: Worker | null = null;
  private mapClusterWorkerReady = false;
  private progressiveLoadStep = 5;
  private protestSC: Supercluster | null = null;
  private techHQSC: Supercluster | null = null;
  private techEventSC: Supercluster | null = null;
  private datacenterSC: Supercluster | null = null;
  private datacenterSCSource: AIDataCenter[] = [];
  private protestClusters: MapProtestCluster[] = [];
  private techHQClusters: MapTechHQCluster[] = [];
  private techEventClusters: MapTechEventCluster[] = [];
  private datacenterClusters: MapDatacenterCluster[] = [];
  private lastSCZoom = -1;
  private lastSCBoundsKey = '';
  private lastSCMask = '';
  private protestSuperclusterSource: SocialUnrestEvent[] = [];
  private newsPulseIntervalId: ReturnType<typeof setInterval> | null = null;
  private dayNightIntervalId: ReturnType<typeof setInterval> | null = null;
  private cachedNightPolygon: [number, number][] | null = null;
  private readonly startupTime = Date.now();
  private lastCableHighlightSignature = '';
  private lastCableHealthSignature = '';
  private lastPipelineHighlightSignature = '';
  private debouncedRebuildLayers: (() => void) & { cancel(): void };
  private debouncedFetchBases: (() => void) & { cancel(): void };
  private debouncedFetchAircraft: (() => void) & { cancel(): void };
  private rafUpdateLayers: (() => void) & { cancel(): void };
  private handleThemeChange: (e: Event) => void;
  private moveTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private lastAircraftFetchCenter: [number, number] | null = null;
  private lastAircraftFetchZoom = -1;
  private aircraftFetchSeq = 0;

  constructor(container: HTMLElement, initialState: DeckMapState) {
    this.container = container;
    this.state = initialState;
    this.hotspots = [...INTEL_HOTSPOTS];

    this.debouncedRebuildLayers = debounce(() => {
      if (this.renderPaused || this.webglLost || !this.maplibreMap) return;
      this.maplibreMap.resize();
      try { this.deckOverlay?.setProps({ layers: this.buildLayers() }); } catch { /* map mid-teardown */ }
      this.maplibreMap.triggerRepaint();
    }, 150);
    this.debouncedFetchBases = debounce(() => this.fetchServerBases(), 300);
    this.debouncedFetchAircraft = debounce(() => this.fetchViewportAircraft(), 500);
    this.rafUpdateLayers = rafSchedule(() => {
      if (this.renderPaused || this.webglLost || !this.maplibreMap) return;
      try { this.deckOverlay?.setProps({ layers: this.buildLayers() }); } catch { /* map mid-teardown */ }
      this.maplibreMap?.triggerRepaint();
    });

    this.setupDOM();
    this.popup = new MapPopup(container);

    this.handleThemeChange = (e: Event) => {
      const theme = (e as CustomEvent).detail?.theme as 'dark' | 'light';
      if (theme) {
        this.switchBasemap(theme);
        this.markAllDirty(); // Theme affects all layer colors
        this.render();
      }
    };
    window.addEventListener('theme-changed', this.handleThemeChange);

    this.initMapLibre();
    this.mapClusterWorker = new Worker(new URL('@/workers/map-cluster.worker.ts', import.meta.url), { type: 'module' });
    this.mapClusterWorker.onmessage = (e: MessageEvent<any>) => {
      const msg = e.data;
      if (msg.type === 'ready') {
        this.mapClusterWorkerReady = true;
        this.lastSCZoom = -1; // Force immediate re-fetch
        this.updateClusterData();
      } else if (msg.type === 'clusters-result') {
        const res = msg as GetClustersResult;
        if (res.zoom !== this.lastSCZoom || res.bbox.join(':') !== this.lastSCBoundsKey) {
          // outdated response, ignore
          return;
        }
        if (res.protestClusters) { this.protestClusters = res.protestClusters; this.markDirty('protests'); }
        if (res.techHQClusters) { this.techHQClusters = res.techHQClusters; this.markDirty('tech'); }
        if (res.techEventClusters) { this.techEventClusters = res.techEventClusters; this.markDirty('tech'); }
        if (res.datacenterClusters) { this.datacenterClusters = res.datacenterClusters; this.markDirty('datacenters'); }
        this.render();
      }
    };
    this.mapClusterWorker.postMessage({ type: 'init' });

    this.maplibreMap?.on('load', () => {
      this.initDeck();
      this.loadCountryBoundaries();
      this.fetchServerBases();
      // When aircraft layers are already enabled in the initial state (no
      // external setLayers call happens on a normal first page load), the
      // polling timer would never start. Kick it off here after the map style
      // has fully loaded so getZoom() and getBounds() return reliable values.
      if (this.state.layers.flights || this.state.layers.militaryAircraftUnknown) {
        this.manageAircraftTimer(true);
      }

      this.progressiveLoadStep = 0;
      const tick = () => {
        if (this.renderPaused || this.webglLost || !this.maplibreMap) return;
        this.progressiveLoadStep++;
        this.rafUpdateLayers(); // Progressive load
        if (this.progressiveLoadStep < 5) {
          requestAnimationFrame(tick);
        }
      };
      requestAnimationFrame(tick);
    });

    this.createControls();
    this.createTimeSlider();
    this.createLayerToggles();
    this.createLegend();

    preloadCountryGeometry()
      .then(() => {
        if (!this.maplibreMap) return;
        this.renderableUnderseaCables = constrainUnderseaCablesToWater(
          expandUnderseaCablePaths(UNDERSEA_CABLES),
          (lat, lon) => Boolean(getCountryAtCoordinates(lat, lon)),
        );
        this.layerCache.delete('cables-layer');
        this.markDirty('cables');
        this.render();
      })
      .catch(() => {
        // Keep fallback geometry if country land mask is unavailable.
      });

    // Start day/night timer only if layer is initially enabled
    if (this.state.layers.dayNight) {
      this.startDayNightTimer();
    }
  }

  private startDayNightTimer(): void {
    if (this.dayNightIntervalId) return;
    this.cachedNightPolygon = this.computeNightPolygon();
    this.dayNightIntervalId = setInterval(() => {
      this.cachedNightPolygon = this.computeNightPolygon();
      this.render();
    }, 5 * 60 * 1000);
  }

  private stopDayNightTimer(): void {
    if (this.dayNightIntervalId) {
      clearInterval(this.dayNightIntervalId);
      this.dayNightIntervalId = null;
    }
    this.cachedNightPolygon = null;
  }

  private setupDOM(): void {
    const wrapper = document.createElement('div');
    wrapper.className = 'deckgl-map-wrapper';
    wrapper.id = 'deckglMapWrapper';
    wrapper.style.cssText = 'position: relative; width: 100%; height: 100%; overflow: hidden;';

    // MapLibre container - deck.gl renders directly into MapLibre via MapboxOverlay
    const mapContainer = document.createElement('div');
    mapContainer.id = 'deckgl-basemap';
    mapContainer.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%;';
    wrapper.appendChild(mapContainer);

    // Map attribution (OpenFreeMap basemap + OpenStreetMap data)
    const attribution = document.createElement('div');
    attribution.className = 'map-attribution';
    attribution.innerHTML = '© <a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';
    wrapper.appendChild(attribution);

    if (SHOW_NAVAL_DEV_OVERLAY) {
      const navalOverlay = document.createElement('div');
      navalOverlay.className = 'naval-info-overlay';
      navalOverlay.style.cssText = [
        'position:absolute',
        'direction:ltr',
        'bottom:10px',
        'left:10px',
        'z-index:60',
        'display:none',
        'min-width:220px',
        'max-width:320px',
        'padding:10px 12px',
        'border-radius:8px',
        'border:1px solid rgba(110,180,255,0.45)',
        'background:rgba(7,12,20,0.88)',
        'backdrop-filter:blur(4px)',
        'color:#eaf4ff',
        'font-size:12px',
        'line-height:1.35',
        'box-shadow:0 10px 24px rgba(0,0,0,0.35)',
        'pointer-events:none',
      ].join(';');
      wrapper.appendChild(navalOverlay);
      this.navalInfoOverlayEl = navalOverlay;
    }

    this.container.appendChild(wrapper);
    this.updateNavalInfoOverlay();
  }

  private updateNavalInfoOverlay(): void {
    if (!SHOW_NAVAL_DEV_OVERLAY) return;
    const overlay = this.navalInfoOverlayEl;
    if (!overlay) return;
    const snapshot = this.navalSnapshot;
    const shouldShow = this.showNavalDevOverlay;
    if (!shouldShow) {
      overlay.style.display = 'none';
      overlay.innerHTML = '';
      return;
    }

    overlay.style.display = 'block';
    if (!snapshot) {
      overlay.innerHTML = `
        <div style="font-weight:700;letter-spacing:0.02em;margin-bottom:6px;color:#9ed0ff;">Naval Data Overlay</div>
        <div style="opacity:.9;">Waiting for naval endpoint data...</div>
      `;
      return;
    }

    const uniqueRegions = new Set(snapshot.clusters.map((cluster) => cluster.region)).size;
    const carrierClusters = snapshot.clusters.filter((cluster) => cluster.hasCarrier).length;
    const assessedAt = new Date(snapshot.assessedAt);
    const assessedLabel = Number.isNaN(assessedAt.getTime())
      ? snapshot.assessedAt
      : assessedAt.toLocaleString();

    overlay.innerHTML = `
      <div style="font-weight:700;letter-spacing:0.02em;margin-bottom:6px;color:#9ed0ff;">Naval Data Overlay</div>
      <div>Strike Groups: <b>${snapshot.strikeGroups.length}</b></div>
      <div>Tracked Vessels: <b>${snapshot.vessels.length}</b></div>
      <div>Operational Clusters: <b>${snapshot.clusters.length}</b></div>
      <div>Carrier Clusters: <b>${carrierClusters}</b></div>
      <div>Active Regions: <b>${uniqueRegions}</b></div>
      <div style="opacity:.82;margin-top:6px;">Assessed: ${assessedLabel}</div>
    `;
  }

  private initMapLibre(): void {
    if (maplibregl.getRTLTextPluginStatus() === 'unavailable') {
      maplibregl.setRTLTextPlugin(
        '/mapbox-gl-rtl-text.min.js',
        true,
      );
    }

    const preset = VIEW_PRESETS[this.state.view];
    const initialTheme = getCurrentTheme();
    const primaryStyle = initialTheme === 'light' ? LIGHT_STYLE : DARK_STYLE;

    // Enable RTL support for Arabic and other RTL languages in map labels
    if (maplibregl.getRTLTextPluginStatus() === 'unavailable') {
      maplibregl.setRTLTextPlugin(
        'https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js',
        true // Lazy load
      );
    }

    this.maplibreMap = new maplibregl.Map({
      container: 'deckgl-basemap',
      style: primaryStyle,
      center: [preset.longitude, preset.latitude],
      zoom: preset.zoom,
      renderWorldCopies: false,
      attributionControl: false,
      interactive: true,
      localIdeographFontFamily: "'Cairo', 'Tajawal', 'Noto Sans Arabic', sans-serif",
      ...(MAP_INTERACTION_MODE === 'flat'
        ? {
          maxPitch: 0,
          pitchWithRotate: false,
          dragRotate: false,
          touchPitch: false,
        }
        : {}),
    });

    const recreateWithFallback = () => {
      if (this.usedFallbackStyle) return;
      this.usedFallbackStyle = true;
      const fallback = initialTheme === 'light' ? FALLBACK_LIGHT_STYLE : FALLBACK_DARK_STYLE;
      console.warn(`[DeckGLMap] Primary basemap failed, recreating with fallback: ${fallback}`);
      this.maplibreMap?.remove();
      this.maplibreMap = new maplibregl.Map({
        container: 'deckgl-basemap',
        style: fallback,
        center: [preset.longitude, preset.latitude],
        zoom: preset.zoom,
        renderWorldCopies: false,
        attributionControl: false,
        interactive: true,
        ...(MAP_INTERACTION_MODE === 'flat'
          ? {
            maxPitch: 0,
            pitchWithRotate: false,
            dragRotate: false,
            touchPitch: false,
          }
          : {}),
      });
      this.maplibreMap.on('load', () => {
        localizeMapLabels(this.maplibreMap);
        this.rebuildTechHQSupercluster();
        this.rebuildDatacenterSupercluster();
        this.initDeck();
        this.loadCountryBoundaries();
        this.fetchServerBases();
        this.render();
      });
    };

    let styleLoaded = false;

    this.maplibreMap.on('error', (e: { error?: Error; message?: string }) => {
      const msg = e.error?.message ?? e.message ?? '';
      if (msg.includes('Failed to fetch') || msg.includes('AJAXError') || msg.includes('CORS') || msg.includes('NetworkError') || msg.includes('cartocdn.com') || msg.includes('403') || msg.includes('Forbidden')) {
        if (!styleLoaded) {
          recreateWithFallback();
        }
      }
    });

    this.styleLoadTimeoutId = setTimeout(() => {
      this.styleLoadTimeoutId = null;
      if (!this.maplibreMap?.isStyleLoaded()) recreateWithFallback();
    }, 5000);
    this.maplibreMap.once('style.load', () => {
      styleLoaded = true;
      if (this.styleLoadTimeoutId) {
        clearTimeout(this.styleLoadTimeoutId);
        this.styleLoadTimeoutId = null;
      }
    });

    const canvas = this.maplibreMap.getCanvas();
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.webglLost = true;
      console.warn('[DeckGLMap] WebGL context lost — will restore when browser recovers');
    });
    canvas.addEventListener('webglcontextrestored', () => {
      this.webglLost = false;
      console.info('[DeckGLMap] WebGL context restored');
      this.maplibreMap?.triggerRepaint();
    });

    // Pin top edge during drag-resize: correct center shift synchronously
    // inside MapLibre's own resize() call (before it renders the frame).
    this.maplibreMap.on('move', () => {
      if (this.correctingCenter || !this.isResizing || !this.maplibreMap) return;
      if (this.savedTopLat === null) return;

      const w = this.maplibreMap.getCanvas().clientWidth;
      if (w <= 0) return;
      const currentTop = this.maplibreMap.unproject([w / 2, 0]).lat;
      const delta = this.savedTopLat - currentTop;

      if (Math.abs(delta) > 1e-6) {
        this.correctingCenter = true;
        const c = this.maplibreMap.getCenter();
        const clampedLat = Math.max(-90, Math.min(90, c.lat + delta));
        this.maplibreMap.jumpTo({ center: [c.lng, clampedLat] });
        this.correctingCenter = false;
        // Do NOT update savedTopLat — keep the original mousedown position
        // so every frame targets the exact same geographic anchor.
      }
    });
  }

  private initDeck(): void {
    if (!this.maplibreMap) return;

    this.deckOverlay = new MapboxOverlay({
      interleaved: true,
      layers: this.buildLayers(),
      getTooltip: (info: PickingInfo) => this.getTooltip(info),
      onClick: (info: PickingInfo) => this.handleClick(info),
      pickingRadius: 10,
      useDevicePixels: window.devicePixelRatio > 2 ? 2 : true,
      onError: (error: Error) => console.warn('[DeckGLMap] Render error (non-fatal):', error.message),
    });

    this.maplibreMap.addControl(this.deckOverlay as unknown as maplibregl.IControl);

    this.maplibreMap.on('styledata', () => {
      this.applyMapLanguage();
    });

    this.maplibreMap.on('movestart', () => {
      // Gesture pause: suppress expensive layer rebuilds during pan/zoom (spec 06, §4.4)
      this.gestureActive = true;
      if (this.gestureEndTimeoutId) {
        clearTimeout(this.gestureEndTimeoutId);
        this.gestureEndTimeoutId = null;
      }
      if (this.moveTimeoutId) {
        clearTimeout(this.moveTimeoutId);
        this.moveTimeoutId = null;
      }
    });

    this.maplibreMap.on('moveend', () => {
      // Resume layer updates 200ms after gesture ends
      if (this.gestureEndTimeoutId) clearTimeout(this.gestureEndTimeoutId);
      this.gestureEndTimeoutId = setTimeout(() => {
        this.gestureActive = false;
        this.gestureEndTimeoutId = null;
        this.lastSCZoom = -1;
        this.markAllDirty(); // Rebuild with final viewport
        this.rafUpdateLayers();
      }, 200);
      this.debouncedFetchBases();
      this.debouncedFetchAircraft();
      this.state.zoom = this.maplibreMap?.getZoom() ?? this.state.zoom;
      this.onStateChange?.(this.state);
    });

    this.maplibreMap.on('move', () => {
      if (this.moveTimeoutId) clearTimeout(this.moveTimeoutId);
      this.moveTimeoutId = setTimeout(() => {
        this.lastSCZoom = -1;
        this.rafUpdateLayers();
      }, 100);
    });

    this.maplibreMap.on('zoom', () => {
      if (this.moveTimeoutId) clearTimeout(this.moveTimeoutId);
      this.moveTimeoutId = setTimeout(() => {
        this.lastSCZoom = -1;
        this.rafUpdateLayers();
      }, 100);
    });

    this.maplibreMap.on('zoomend', () => {
      const currentZoom = Math.floor(this.maplibreMap?.getZoom() || 2);
      const thresholdCrossed = Math.abs(currentZoom - this.lastZoomThreshold) >= 1;
      if (thresholdCrossed) {
        this.lastZoomThreshold = currentZoom;
        this.debouncedRebuildLayers();
      }
      this.state.zoom = this.maplibreMap?.getZoom() ?? this.state.zoom;
      this.onStateChange?.(this.state);
    });
  }

  private applyMapLanguage(): void {
    if (!this.maplibreMap) return;
    const style = this.maplibreMap.getStyle();
    if (!style || !style.layers) return;

    const lang = getCurrentLanguage();
    // Even if 'en', we want to coalesce because 'name:en' might be better than missing fields
    // but the original config mostly expects 'name_en' to work.

    // If tile engine lacks native name:{lang} fields, dynamically fall back to a client-generated match expression
    // converting English labels to native labels mapping all global ISO-3166 territory codes
    const FALLBACK_CODES = [
      "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ", "BA", "BB", "BD", "BE",
      "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS", "BT", "BV", "BW", "BY", "BZ", "CA", "CC", "CD",
      "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN", "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM",
      "DO", "DZ", "EC", "EE", "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK", "FM", "FO", "FR", "GA", "GB", "GD", "GE", "GF",
      "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY", "HK", "HM", "HN", "HR", "HT", "HU",
      "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT", "JE", "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN",
      "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME",
      "MF", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA",
      "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM",
      "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU", "RW", "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI",
      "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV", "SX", "SY", "SZ", "TC", "TD", "TF", "TG", "TH", "TJ", "TK",
      "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ", "UA", "UG", "UM", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI",
      "VN", "VU", "WF", "WS", "YE", "YT", "ZA", "ZM", "ZW", "002", "019", "142", "150", "009"
    ];

    const matchExpr: any[] = ['match', ['to-string', ['get', 'name_en']]];
    const addedKeys = new Set<string>();

    const addFallbackPair = (enName: string, localName: string) => {
      if (!addedKeys.has(enName) && enName && localName && enName !== localName) {
        matchExpr.push(enName, localName);
        addedKeys.add(enName);
      }
    };

    // Use the comprehensive resolution logic already built in i18n service
    for (const c of FALLBACK_CODES) {
      // We only need fallback definitions if the english map name differs from localized!
      // To do that, we get the English name by forcing 'en' resolution, and compare.
      // But wait, the map has English labels already. So if we map English -> Localized, it works.
      // Let's get the English name of the country code:
      let enName = '';
      try { const d = new Intl.DisplayNames(['en'], { type: 'region' }); enName = d.of(c) || ''; } catch { continue; }

      if (enName) {
        const localName = getLocalizedCountryName(c);
        addFallbackPair(enName, localName);
      }
    }

    // Add common geographic anomalies and explicit non-ISO mappings using the i18n geo dictionary
    const knownAnomalies = [
      "United States of America", "Russia", "Russian Federation", "South Korea",
      "North Korea", "Iran", "Syria", "Czech Republic"
    ];
    for (const name of knownAnomalies) {
      const localName = getLocalizedGeoName(name);
      addFallbackPair(name, localName);
    }

    if (lang === 'ar') {
      for (const [enName, arName] of Object.entries(arGeoFallbacks)) {
        addFallbackPair(enName, arName as string);
      }
    }

    matchExpr.push(['to-string', ['get', 'name_en']]); // Final fallback clause for mapLibre match

    // Build a second match expression that matches against the generic 'name' field
    // Many CARTO features only have 'name' (English) without a separate 'name_en'
    const matchExprByName: any[] = ['match', ['to-string', ['get', 'name']]];
    // Copy all the same en→local pairs (skip first 2 items: 'match' and the get-expr)
    for (let i = 2; i < matchExpr.length - 1; i += 2) {
      matchExprByName.push(matchExpr[i], matchExpr[i + 1]);
    }
    matchExprByName.push(['to-string', ['get', 'name']]); // terminal fallback

    const fallbackField = matchExpr.length > 3 ? matchExpr : ['get', 'name_en'];
    const fallbackByName = matchExprByName.length > 3 ? matchExprByName : ['get', 'name'];

    const localizedNameExpr = [
      'to-string',
      [
        'coalesce',
        // ['get', `name:${lang}`],
        // ['get', `name_${lang}`],
        ['get', 'name_en'],
        fallbackField,
        fallbackByName,
        ''
      ]
    ];

    const convertStopsToStep = (stopsObj: any): any[] => {
      const stops = stopsObj.stops;
      if (!Array.isArray(stops) || stops.length === 0) return [''];
      const stepExpr = ['step', ['zoom'], stops[0][1]];
      for (let i = 1; i < stops.length; i++) {
        stepExpr.push(stops[i][0], stops[i][1]);
      }
      return stepExpr;
    };

    const injectLocale = (ast: any): any => {
      if (typeof ast === 'string') {
        if (ast === '{name}' || ast === '{name_en}' || ast === '{name_ar}' || ast === '{name:ar}') return localizedNameExpr;
        return ast;
      }
      if (Array.isArray(ast)) {
        return ast.map(injectLocale);
      }
      if (ast !== null && typeof ast === 'object') {
        if (ast.stops) {
          return injectLocale(convertStopsToStep(ast)); // Convert legacy stops to step expression and recurse!
        }
        const newObj: any = {};
        for (const k in ast) {
          newObj[k] = injectLocale(ast[k]);
        }
        return newObj;
      }
      return ast;
    };

    style.layers.forEach((layer) => {
      if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
        const textField = layer.layout['text-field'];
        const strField = JSON.stringify(textField);

        if (strField.includes('{name}') || strField.includes('{name_en}') || strField.includes('name_en') || strField.includes('name:')) {
          try {
            // Generate the modern, localized text-field layout expression safely
            const newTextField = injectLocale(textField);

            // Prevent infinite styledata event loops!
            if (JSON.stringify(newTextField) !== strField) {
              this.maplibreMap?.setLayoutProperty(layer.id, 'text-field', newTextField);
            }
          } catch (e) {
            console.warn(`[DeckGLMap] Failed to update layout property for layer ${layer.id}`, e);
          }
        }

        // Ensure Arabic fonts are available in the font stack when Arabic locale is active
        if (lang === 'ar' && layer.layout['text-font']) {
          const currentFonts = layer.layout['text-font'] as string[];
          if (Array.isArray(currentFonts)) {
            const newFonts = [...currentFonts];
            // if (!newFonts.includes('Noto Sans Arabic Regular')) newFonts.push('Noto Sans Arabic Regular');
            // if (!newFonts.includes('Cairo')) newFonts.push('Cairo');
            // if (!newFonts.includes('Tajawal')) newFonts.push('Tajawal');
            // if (!newFonts.includes('Arial Unicode MS Regular')) newFonts.push('Arial Unicode MS Regular');

            if (JSON.stringify(newFonts) !== JSON.stringify(currentFonts)) {
              this.maplibreMap?.setLayoutProperty(layer.id, 'text-font', newFonts);
            }
          }
        }
      }
    });
  }

  public setIsResizing(value: boolean): void {
    this.isResizing = value;
    if (value && this.maplibreMap) {
      const w = this.maplibreMap.getCanvas().clientWidth;
      if (w > 0) {
        this.savedTopLat = this.maplibreMap.unproject([w / 2, 0]).lat;
      }
    } else {
      this.savedTopLat = null;
    }
  }

  // --- Optimization helpers (spec 06) ---

  /** Mark specific layer groups as needing rebuild on next render */
  private markDirty(...groups: string[]): void {
    for (const g of groups) this.dirtyLayers.add(g);
  }

  /** Force all layers to rebuild (theme change, full layer toggle, etc.) */
  private markAllDirty(): void {
    this.dirtyLayers.add('*');
  }

  private isDirty(group: string): boolean {
    return this.dirtyLayers.has('*') || this.dirtyLayers.has(group);
  }

  /** Coalesce multiple data setter calls into a single render pass */
  public batchUpdate(fn: () => void): void {
    this._batchingUpdates = true;
    try {
      fn();
    } finally {
      this._batchingUpdates = false;
    }
    this.render();
  }

  /** Memoized filterByTime — skips re-iteration if data + timeRange unchanged */
  private cachedFilterByTime<T>(
    cacheKey: string,
    items: T[],
    getTime: (item: T) => Date | string | number | undefined | null
  ): T[] {
    if (this.state.timeRange === 'all') return items;
    const cached = this.timeFilterCache.get(cacheKey);
    if (cached && cached.dataLength === items.length && cached.timeRange === this.state.timeRange) {
      return cached.result as T[];
    }
    const result = this.filterByTime(items, getTime);
    this.timeFilterCache.set(cacheKey, { dataLength: items.length, timeRange: this.state.timeRange, result });
    return result;
  }

  /** Invalidate a specific time filter cache entry */
  private invalidateTimeCache(cacheKey: string): void {
    this.timeFilterCache.delete(cacheKey);
  }

  /** Invalidate all time filter cache entries (e.g. on time range change) */
  private invalidateAllTimeCache(): void {
    this.timeFilterCache.clear();
  }

  /** Filter data to current viewport bounds + padding (spec 06, §4.2) */
  private filterByViewport<T>(
    items: T[],
    getLat: (d: T) => number,
    getLon: (d: T) => number,
    padding = 5
  ): T[] {
    const bounds = this.maplibreMap?.getBounds();
    if (!bounds) return items;
    const south = bounds.getSouth() - padding;
    const north = bounds.getNorth() + padding;
    const west = bounds.getWest() - padding;
    const east = bounds.getEast() + padding;
    return items.filter(d => {
      const lat = getLat(d);
      const lon = getLon(d);
      return lat >= south && lat <= north && lon >= west && lon <= east;
    });
  }

  public resize(): void {
    this.maplibreMap?.resize();
  }

  private getSetSignature(set: Set<string>): string {
    return [...set].sort().join('|');
  }

  private hasRecentNews(now = Date.now()): boolean {
    for (const ts of this.newsLocationFirstSeen.values()) {
      if (now - ts < 30_000) return true;
    }
    return false;
  }

  private getTimeRangeMs(range: TimeRange = this.state.timeRange): number {
    const ranges: Record<TimeRange, number> = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '48h': 48 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      'all': Infinity,
    };
    return ranges[range];
  }

  private parseTime(value: Date | string | number | undefined | null): number | null {
    if (value == null) return null;
    const ts = value instanceof Date ? value.getTime() : new Date(value).getTime();
    return Number.isFinite(ts) ? ts : null;
  }

  private filterByTime<T>(
    items: T[],
    getTime: (item: T) => Date | string | number | undefined | null
  ): T[] {
    if (this.state.timeRange === 'all') return items;
    const cutoff = Date.now() - this.getTimeRangeMs();
    return items.filter((item) => {
      const ts = this.parseTime(getTime(item));
      return ts == null ? true : ts >= cutoff;
    });
  }

  private getFilteredProtests(): SocialUnrestEvent[] {
    return this.filterByTime(this.protests, (event) => event.time);
  }

  private filterMilitaryFlightClustersByTime(clusters: MilitaryFlightCluster[]): MilitaryFlightCluster[] {
    return clusters
      .map((cluster) => {
        const flights = this.filterByTime(cluster.flights ?? [], (flight) => flight.lastSeen);
        if (flights.length === 0) return null;
        return {
          ...cluster,
          flights,
          flightCount: flights.length,
        };
      })
      .filter((cluster): cluster is MilitaryFlightCluster => cluster !== null);
  }

  private filterMilitaryVesselClustersByTime(clusters: MilitaryVesselCluster[]): MilitaryVesselCluster[] {
    return clusters
      .map((cluster) => {
        const vessels = this.filterByTime(cluster.vessels ?? [], (vessel) => vessel.lastAisUpdate);
        if (vessels.length === 0) return null;
        return {
          ...cluster,
          vessels,
          vesselCount: vessels.length,
        };
      })
      .filter((cluster): cluster is MilitaryVesselCluster => cluster !== null);
  }

  private isLikelyMilitaryPosition(position: PositionSample): boolean {
    const callsign = (position.callsign || '').trim();
    if (callsign && identifyByCallsign(callsign)) return true;
    return Boolean(isKnownMilitaryHex(position.icao24));
  }

  private shouldShowConfirmedMilitaryAircraft(layers: MapLayers = this.state.layers): boolean {
    return layers.military || layers.militaryAircraftConfirmed;
  }

  private shouldShowUnknownAircraftActivity(layers: MapLayers = this.state.layers): boolean {
    return layers.militaryAircraftUnknown;
  }

  private shouldShowNavalActivity(layers: MapLayers = this.state.layers): boolean {
    return layers.military || layers.navalActivity;
  }

  private rebuildProtestSupercluster(source: SocialUnrestEvent[] = this.getFilteredProtests()): void {
    this.protestSuperclusterSource = source;
    if (this.mapClusterWorkerReady && this.mapClusterWorker) {
      this.mapClusterWorker.postMessage({ type: 'set-protests', source });
      this.lastSCZoom = -1; // force cluster re-fetch
      this.updateClusterData();
    }
  }

  private rebuildTechEventSupercluster(): void {
    if (this.mapClusterWorkerReady && this.mapClusterWorker) {
      this.mapClusterWorker.postMessage({ type: 'set-tech-events', source: this.techEvents });
      this.lastSCZoom = -1; // force cluster re-fetch
      this.updateClusterData();
    }
  }

  private rebuildDatacenterSupercluster(): void {
    if (this.mapClusterWorkerReady && this.mapClusterWorker) {
      this.lastSCZoom = -1; // force cluster re-fetch
      this.updateClusterData();
    }
  }

  private rebuildTechHQSupercluster(): void {
    if (this.mapClusterWorkerReady && this.mapClusterWorker) {
      this.lastSCZoom = -1; // force cluster re-fetch
      this.updateClusterData();
    }
  }

  private updateClusterData(): void {
    if (!this.mapClusterWorkerReady || !this.mapClusterWorker) return;
    const zoom = Math.floor(this.maplibreMap?.getZoom() ?? 2);
    const bounds = this.maplibreMap?.getBounds();
    if (!bounds) return;
    const bbox: [number, number, number, number] = [
      bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth(),
    ];
    const boundsKey = bbox.join(':');
    const layers = this.state.layers;
    const useProtests = layers.protests && this.protestSuperclusterSource.length > 0;
    const useTechHQ = SITE_VARIANT === 'tech' && layers.techHQs;
    const useTechEvents = SITE_VARIANT === 'tech' && layers.techEvents && this.techEvents.length > 0;
    const useDatacenterClusters = layers.datacenters && zoom < 5;
    const layerMask = `${Number(useProtests)}${Number(useTechHQ)}${Number(useTechEvents)}${Number(useDatacenterClusters)}`;
    if (zoom === this.lastSCZoom && boundsKey === this.lastSCBoundsKey && layerMask === this.lastSCMask) return;

    this.lastSCZoom = zoom;
    this.lastSCBoundsKey = boundsKey;
    this.lastSCMask = layerMask;

    this.mapClusterWorker.postMessage({
      type: 'get-clusters',
      bbox,
      zoom,
      layers: { protests: useProtests, techHQs: useTechHQ, techEvents: useTechEvents, datacenters: useDatacenterClusters }
    });
  }




  private isLayerVisible(layerKey: keyof MapLayers): boolean {
    const threshold = LAYER_ZOOM_THRESHOLDS[layerKey];
    if (!threshold) return true;
    const zoom = this.maplibreMap?.getZoom() || 2;
    return zoom >= threshold.minZoom;
  }

  // --- Optimization: Dirty-flag layer rebuilds (spec 06, §1.1) ---
  private getCachedLayer<T>(groupKey: string, cacheKey: string, createFn: () => T): T {
    if (this.isDirty(groupKey) || !this.layerCache.has(cacheKey)) {
      this.layerCache.set(cacheKey, createFn());
    }
    return this.layerCache.get(cacheKey) as T;
  }

  private buildLayers(): LayersList {
    const startTime = performance.now();
    // Refresh theme-aware overlay colors on each rebuild
    COLORS = getOverlayColors();
    const layers: (Layer | null | false)[] = [];
    const { layers: mapLayers } = this.state;
    // Memoized time filtering (spec 06, §1.3) — avoids re-iterating unchanged arrays
    const filteredEarthquakes = this.cachedFilterByTime('earthquakes', this.earthquakes, (eq) => eq.occurredAt);
    const filteredNaturalEvents = this.cachedFilterByTime('naturalEvents', this.naturalEvents, (event) => event.date);
    const filteredWeatherAlerts = this.cachedFilterByTime('weatherAlerts', this.weatherAlerts, (alert) => alert.onset);
    const filteredOutages = this.cachedFilterByTime('outages', this.outages, (outage) => outage.pubDate);
    const filteredCableAdvisories = this.cachedFilterByTime('cableAdvisories', this.cableAdvisories, (advisory) => advisory.reported);
    const filteredFlightDelays = this.cachedFilterByTime('flightDelays', this.flightDelays, (delay) => delay.updatedAt);
    const filteredMilitaryFlights = this.cachedFilterByTime('militaryFlights', this.militaryFlights, (flight) => flight.lastSeen);
    const filteredMilitaryVessels = this.cachedFilterByTime('militaryVessels', this.militaryVessels, (vessel) => vessel.lastAisUpdate);
    const filteredMilitaryFlightClusters = this.filterMilitaryFlightClustersByTime(this.militaryFlightClusters);
    const filteredMilitaryVesselClusters = this.filterMilitaryVesselClustersByTime(this.militaryVesselClusters);
    const confirmedMilitaryFlights = filteredMilitaryFlights;
    const confirmedMilitaryFlightClusters = filteredMilitaryFlightClusters;

    // === Step 1: Base infrastructure ===
    if (this.progressiveLoadStep >= 1) {
      // Day/night overlay (rendered first as background)
      if (mapLayers.dayNight) {
        if (!this.dayNightIntervalId) this.startDayNightTimer();
        layers.push(this.createDayNightLayer());
      } else {
        if (this.dayNightIntervalId) this.stopDayNightTimer();
        this.layerCache.delete('day-night-layer');
      }

      // Undersea cables layer
      if (mapLayers.cables) {
        layers.push(this.getCachedLayer('cables', 'cables-layer', () => this.createCablesLayer()));
      } else {
        this.layerCache.delete('cables-layer');
      }

      // Pipelines layer
      if (mapLayers.pipelines) {
        layers.push(this.getCachedLayer('pipelines', 'pipelines-layer', () => this.createPipelinesLayer()));
      } else {
        this.layerCache.delete('pipelines-layer');
      }

      // Conflict zones layer
      if (mapLayers.conflicts) {
        layers.push(this.getCachedLayer('baseInfra', 'conflict-zones-layer', () => this.createConflictZonesLayer()));
      }

      // Geopolitical boundaries layer
      if (mapLayers.geopoliticalBoundaries) {
        layers.push(this.createGeopoliticalBoundariesLayer());
      }

    }

    // === Step 2: Critical Assets ===
    if (this.progressiveLoadStep >= 2) {
      // Military bases layer — hidden at low zoom (E: progressive disclosure) + ghost + clusters
      if (mapLayers.bases && this.isLayerVisible('bases')) {
        layers.push(this.getCachedLayer('bases', 'bases-layer', () => this.createBasesLayer()));
        const baseClusters = this.getCachedLayer('bases', 'bases-cluster-group', () => this.createBasesClusterLayer() as any);
        layers.push(...((Array.isArray(baseClusters) ? baseClusters : [baseClusters]) as any));
      }

      // Nuclear facilities layer — hidden at low zoom + ghost
      if (mapLayers.nuclear && this.isLayerVisible('nuclear')) {
        layers.push(this.getCachedLayer('nuclear', 'nuclear-layer', () => this.createNuclearLayer()));
      }

      // Gamma irradiators layer — hidden at low zoom
      if (mapLayers.irradiators && this.isLayerVisible('irradiators')) {
        layers.push(this.getCachedLayer('nuclear', 'irradiators-layer', () => this.createIrradiatorsLayer()));
      }

      // Spaceports layer — hidden at low zoom
      if (mapLayers.spaceports && this.isLayerVisible('spaceports')) {
        layers.push(this.getCachedLayer('baseInfra', 'spaceports-layer', () => this.createSpaceportsLayer()));
      }

      // Hotspots layer (all hotspots including high/breaking, with pulse + ghost)
      if (mapLayers.hotspots) {
        layers.push(...this.createHotspotsLayers());
      }

      // Datacenters layer - SQUARE icons at zoom >= 5, cluster dots at zoom < 5
      const currentZoom = this.maplibreMap?.getZoom() || 2;
      if (mapLayers.datacenters) {
        if (currentZoom >= 5) {
          layers.push(this.getCachedLayer('datacenters', 'datacenters-layer', () => this.createDatacentersLayer()));
        } else {
          const dcClusters = this.getCachedLayer('datacenters', 'datacenter-cluster-group', () => this.createDatacenterClusterLayers() as any);
          layers.push(...((Array.isArray(dcClusters) ? dcClusters : [dcClusters]) as any));
        }
      }

    }

    // === Step 3: Natural & Live Events ===
    if (this.progressiveLoadStep >= 3) {
      // Earthquakes layer + ghost for easier picking
      if (mapLayers.natural && filteredEarthquakes.length > 0) {
        const eqLayers = this.getCachedLayer('earthquakes', 'earthquakes-group', () => [
          this.createEarthquakesLayer(filteredEarthquakes),
        ]);
        layers.push(...((Array.isArray(eqLayers) ? eqLayers : [eqLayers]) as any));
      }

      // Natural events layer
      if (mapLayers.natural && filteredNaturalEvents.length > 0) {
        layers.push(this.getCachedLayer('natural', 'natural-events-layer', () => this.createNaturalEventsLayer(filteredNaturalEvents)));
      }

      // Satellite fires layer (NASA FIRMS)
      if (mapLayers.fires && this.firmsFireData.length > 0) {
        layers.push(this.getCachedLayer('fires', 'fires-layer', () => this.createFiresLayer()));
      }

      // Iran events layer
      if (mapLayers.iranAttacks && this.iranEvents.length > 0) {
        layers.push(this.getCachedLayer('iranAttacks', 'iran-events-layer', () => this.createIranEventsLayer()));
      }

      // Weather alerts layer
      if (mapLayers.weather && filteredWeatherAlerts.length > 0) {
        layers.push(this.getCachedLayer('weather', 'weather-layer', () => this.createWeatherLayer(filteredWeatherAlerts)));
      }

      // Internet outages layer + ghost for easier picking
      if (mapLayers.outages && filteredOutages.length > 0) {
        layers.push(this.getCachedLayer('outages', 'outages-layer', () => this.createOutagesLayer(filteredOutages)));
      }

      // Cyber threat IOC layer
      if (mapLayers.cyberThreats && this.cyberThreats.length > 0) {
        layers.push(this.getCachedLayer('cyberThreats', 'cyber-threats-layer', () => this.createCyberThreatsLayer()));
      }

    }

    // === Step 4: Maritime & Flight infra ===
    if (this.progressiveLoadStep >= 4) {
      // AIS density layer
      if (mapLayers.ais && this.aisDensity.length > 0) {
        layers.push(this.getCachedLayer('ais', 'ais-density-layer', () => this.createAisDensityLayer()));
      }

      // AIS disruptions layer (spoofing/jamming)
      if (mapLayers.ais && this.aisDisruptions.length > 0) {
        layers.push(this.getCachedLayer('ais', 'ais-disruptions-layer', () => this.createAisDisruptionsLayer()));
      }

      // GPS/GNSS jamming layer
      if (mapLayers.gpsJamming && this.gpsJammingHexes.length > 0) {
        layers.push(this.getCachedLayer('gpsJamming', 'gps-jamming-layer', () => this.createGpsJammingLayer()));
      }

      // Strategic ports layer (shown with AIS)
      if (mapLayers.ais) {
        layers.push(this.getCachedLayer('baseInfra', 'ports-layer', () => this.createPortsLayer()));
      }

      // Cable advisories layer (shown with cables)
      if (mapLayers.cables && filteredCableAdvisories.length > 0) {
        layers.push(this.getCachedLayer('cables', 'cable-advisories-layer', () => this.createCableAdvisoriesLayer(filteredCableAdvisories)));
      }

      // Repair ships layer (shown with cables)
      if (mapLayers.cables && this.repairShips.length > 0) {
        layers.push(this.getCachedLayer('cables', 'repair-ships-layer', () => this.createRepairShipsLayer()));
      }

      // Flight delays layer
      if (mapLayers.flights && filteredFlightDelays.length > 0) {
        layers.push(this.getCachedLayer('flights', 'flight-delays-layer', () => this.createFlightDelaysLayer(filteredFlightDelays)));
      }

      // Aircraft positions layer (live tracking, under flights toggle)
      if (mapLayers.flights && this.aircraftPositions.length > 0) {
        layers.push(this.getCachedLayer('flights', 'aircraft-positions-layer', () => this.createAircraftPositionsLayer()));
      }

    }

    // === Step 5: Intel, Cyber, and Misc ===
    if (this.progressiveLoadStep >= 5) {
      // Protests layer (Supercluster-based deck.gl layers)
      if (mapLayers.protests && this.protests.length > 0) {
        const protestLayers = this.getCachedLayer('protests', 'protests-group', () => this.createProtestClusterLayers() as any);
        layers.push(...((Array.isArray(protestLayers) ? protestLayers : [protestLayers]) as any));
      }

      // Naval activity layer
      if (this.shouldShowNavalActivity(mapLayers) && filteredMilitaryVessels.length > 0) {
        const vesselLayers = this.getCachedLayer('navalActivity', 'naval-activity-vessels-group', () => this.createMilitaryVesselsLayer(filteredMilitaryVessels, {
          carrierLayerId: 'naval-activity-carriers-layer',
          vesselLayerId: 'naval-activity-vessels-layer',
        }) as any);
        layers.push(...((Array.isArray(vesselLayers) ? vesselLayers : [vesselLayers]) as any));
      }

      // Naval activity clusters layer
      if (this.shouldShowNavalActivity(mapLayers) && filteredMilitaryVesselClusters.length > 0) {
        layers.push(this.getCachedLayer('navalActivity', 'naval-activity-vessel-clusters-layer', () => this.createMilitaryVesselClustersLayer(filteredMilitaryVesselClusters, 'naval-activity-vessel-clusters-layer')));
      }

      // Naval snapshot layers (seeded vessels + strike groups)
      if (this.shouldShowNavalActivity(mapLayers) && this.navalSnapshot) {
        const snapshotLayers = this.getCachedLayer('navalActivity', 'naval-snapshot-group', () => this.createNavalSnapshotLayers(this.navalSnapshot!) as any);
        layers.push(...((Array.isArray(snapshotLayers) ? snapshotLayers : [snapshotLayers]) as any));
      }

      // Confirmed military aircraft layer
      if (this.shouldShowConfirmedMilitaryAircraft(mapLayers) && confirmedMilitaryFlights.length > 0) {
        const flightLayers = this.getCachedLayer('militaryAircraftConfirmed', 'confirmed-military-flights-group', () => this.createMilitaryFlightsLayer(confirmedMilitaryFlights, {
          iconLayerId: 'confirmed-military-flights-layer',
          interestingRingLayerId: 'confirmed-military-flights-interesting-ring',
        }) as any);
        layers.push(...((Array.isArray(flightLayers) ? flightLayers : [flightLayers]) as any));
      }

      // Confirmed military aircraft clusters layer
      if (this.shouldShowConfirmedMilitaryAircraft(mapLayers) && confirmedMilitaryFlightClusters.length > 0) {
        layers.push(this.getCachedLayer('militaryAircraftConfirmed', 'confirmed-military-flight-clusters-layer', () => this.createMilitaryFlightClustersLayer(confirmedMilitaryFlightClusters, 'confirmed-military-flight-clusters-layer')));
      }

      // Civilian aircraft activity layer (live positions)
      if (this.shouldShowUnknownAircraftActivity(mapLayers) && !mapLayers.flights && this.aircraftPositions.length > 0) {
        layers.push(this.getCachedLayer('militaryAircraftUnknown', 'unknown-aircraft-positions-layer', () => this.createAircraftPositionsLayer('unknown-aircraft-positions-layer')));
      }

      // Strategic waterways layer
      if (mapLayers.waterways) {
        layers.push(this.getCachedLayer('baseInfra', 'waterways-layer', () => this.createWaterwaysLayer()));
      }

      // Economic centers layer — hidden at low zoom
      if (mapLayers.economic && this.isLayerVisible('economic')) {
        layers.push(this.getCachedLayer('baseInfra', 'economic-centers-layer', () => this.createEconomicCentersLayer()));
      }

      // Finance variant layers
      if (mapLayers.stockExchanges) {
        layers.push(this.getCachedLayer('baseInfra', 'stock-exchanges-layer', () => this.createStockExchangesLayer()));
      }
      if (mapLayers.financialCenters) {
        layers.push(this.getCachedLayer('baseInfra', 'financial-centers-layer', () => this.createFinancialCentersLayer()));
      }
      if (mapLayers.centralBanks) {
        layers.push(this.getCachedLayer('baseInfra', 'central-banks-layer', () => this.createCentralBanksLayer()));
      }
      if (mapLayers.commodityHubs) {
        layers.push(this.getCachedLayer('baseInfra', 'commodity-hubs-layer', () => this.createCommodityHubsLayer()));
      }

      // Critical minerals layer
      if (mapLayers.minerals) {
        layers.push(this.getCachedLayer('baseInfra', 'minerals-layer', () => this.createMineralsLayer()));
      }

      // APT Groups layer (geopolitical variant only - always shown, no toggle)
      if (SITE_VARIANT !== 'tech' && SITE_VARIANT !== 'happy') {
        layers.push(this.getCachedLayer('baseInfra', 'apt-groups-layer', () => this.createAPTGroupsLayer()));
      }

      // UCDP georeferenced events layer — historical annual data, not time-filtered
      if (mapLayers.ucdpEvents && this.ucdpEvents.length > 0) {
        layers.push(this.getCachedLayer('ucdp', 'ucdp-events-layer', () => this.createUcdpEventsLayer(this.ucdpEvents)));
      }

      // Displacement flows arc layer
      if (mapLayers.displacement && this.displacementFlows.length > 0) {
        layers.push(this.getCachedLayer('displacement', 'displacement-arcs-layer', () => this.createDisplacementArcsLayer()));
      }

      // Climate anomalies heatmap layer
      if (mapLayers.climate && this.climateAnomalies.length > 0) {
        layers.push(this.getCachedLayer('climate', 'climate-heatmap-layer', () => this.createClimateHeatmapLayer()));
      }

      // Trade routes layer
      if (mapLayers.tradeRoutes) {
        layers.push(this.createTradeRoutesLayer());
        layers.push(this.createTradeChokepointsLayer());
      } else {
        this.layerCache.delete('trade-routes-layer');
        this.layerCache.delete('trade-chokepoints-layer');
      }

      // Tech variant layers (Supercluster-based deck.gl layers for HQs and events)
      if (SITE_VARIANT === 'tech') {
        if (mapLayers.startupHubs) {
          layers.push(this.getCachedLayer('baseInfra', 'startup-hubs-layer', () => this.createStartupHubsLayer()));
        }
        if (mapLayers.techHQs) {
          layers.push(...this.createTechHQClusterLayers());
        }
        if (mapLayers.accelerators) {
          layers.push(this.getCachedLayer('baseInfra', 'accelerators-layer', () => this.createAcceleratorsLayer()));
        }
        if (mapLayers.cloudRegions) {
          layers.push(this.getCachedLayer('baseInfra', 'cloud-regions-layer', () => this.createCloudRegionsLayer()));
        }
        if (mapLayers.techEvents && this.techEvents.length > 0) {
          layers.push(...this.createTechEventClusterLayers());
        }
      }

      // Gulf FDI investments layer
      if (mapLayers.gulfInvestments) {
        layers.push(this.getCachedLayer('baseInfra', 'gulf-investments-layer', () => this.createGulfInvestmentsLayer()));
      }

      // Positive events layer (happy variant)
      if (mapLayers.positiveEvents && this.positiveEvents.length > 0) {
        const posLayers = this.getCachedLayer('positiveEvents', 'positive-events-group', () => this.createPositiveEventsLayers() as any);
        layers.push(...((Array.isArray(posLayers) ? posLayers : [posLayers]) as any));
      }

      // Kindness layer (happy variant -- green baseline pulses + real kindness events)
      if (mapLayers.kindness && this.kindnessPoints.length > 0) {
        const kindLayers = this.getCachedLayer('kindness', 'kindness-group', () => this.createKindnessLayers() as any);
        layers.push(...((Array.isArray(kindLayers) ? kindLayers : [kindLayers]) as any));
      }

      // Phase 8: Happiness choropleth (rendered below point markers)
      if (mapLayers.happiness) {
        const choropleth = this.getCachedLayer('happiness', 'happiness-choropleth-layer', () => this.createHappinessChoroplethLayer());
        if (choropleth) layers.push(choropleth);
      }
      // CII choropleth (country instability heat-map)
      if (mapLayers.ciiChoropleth) {
        const ciiLayer = this.getCachedLayer('baseInfra', 'cii-choropleth-layer', () => this.createCIIChoroplethLayer());
        if (ciiLayer) layers.push(ciiLayer);
      }
      // Phase 8: Species recovery zones
      if (mapLayers.speciesRecovery && this.speciesRecoveryZones.length > 0) {
        layers.push(this.getCachedLayer('speciesRecovery', 'species-recovery-layer', () => this.createSpeciesRecoveryLayer()));
      }
      // Phase 8: Renewable energy installations
      if (mapLayers.renewableInstallations && this.renewableInstallations.length > 0) {
        layers.push(this.getCachedLayer('renewables', 'renewable-installations-layer', () => this.createRenewableInstallationsLayer()));
      }

      // News geo-locations (always shown if data exists)
      if (this.newsLocations.length > 0) {
        const newsLayers = this.getCachedLayer('news', 'news-locations-group', () => this.createNewsLocationsLayer() as any);
        layers.push(...((Array.isArray(newsLayers) ? newsLayers : [newsLayers]) as any));
      }

    } // End of Step 5

    const result = layers.filter(Boolean) as LayersList;
    // Clear dirty flags after build (spec 06, §1.1)
    this.dirtyLayers.clear();
    const elapsed = performance.now() - startTime;
    if (import.meta.env.DEV && elapsed > 16) {
      console.warn(`[DeckGLMap] buildLayers took ${elapsed.toFixed(2)}ms (>16ms budget), ${result.length} layers`);
    }
    return result;
  }

  // Layer creation methods
  private createCablesLayer(): PathLayer {
    const highlightedCables = this.highlightedAssets.cable;
    const cacheKey = 'cables-layer';
    const cached = this.layerCache.get(cacheKey) as PathLayer | undefined;
    const highlightSignature = this.getSetSignature(highlightedCables);
    const healthSignature = Object.keys(this.healthByCableId).sort().join(',');
    if (cached && highlightSignature === this.lastCableHighlightSignature && healthSignature === this.lastCableHealthSignature) return cached;

    const health = this.healthByCableId;
    const layer = new PathLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: cacheKey,
      data: this.renderableUnderseaCables,
      getPath: (d: UnderseaCable) => d.points,
      getColor: (d: UnderseaCable) => {
        if (highlightedCables.has(d.id)) return COLORS.cableHighlight;
        const h = health[d.id];
        if (h?.status === 'fault') return COLORS.cableFault;
        if (h?.status === 'degraded') return COLORS.cableDegraded;
        return COLORS.cable;
      },
      getWidth: (d: UnderseaCable) => {
        if (highlightedCables.has(d.id)) return 3;
        const h = health[d.id];
        if (h?.status === 'fault') return 2.5;
        if (h?.status === 'degraded') return 2;
        return 1;
      },
      widthMinPixels: 1,
      widthMaxPixels: 5,
      pickable: true,
      updateTriggers: { highlighted: highlightSignature, health: healthSignature },
    });

    this.lastCableHighlightSignature = highlightSignature;
    this.lastCableHealthSignature = healthSignature;
    this.layerCache.set(cacheKey, layer);
    return layer;
  }

  private createPipelinesLayer(): PathLayer {
    const highlightedPipelines = this.highlightedAssets.pipeline;
    const cacheKey = 'pipelines-layer';
    const cached = this.layerCache.get(cacheKey) as PathLayer | undefined;
    const highlightSignature = this.getSetSignature(highlightedPipelines);
    if (cached && highlightSignature === this.lastPipelineHighlightSignature) return cached;

    const layer = new PathLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: cacheKey,
      data: PIPELINES,
      getPath: (d) => d.points,
      getColor: (d) => {
        if (highlightedPipelines.has(d.id)) {
          return [255, 100, 100, 200] as [number, number, number, number];
        }
        const colorKey = d.type as keyof typeof PIPELINE_COLORS;
        const hex = PIPELINE_COLORS[colorKey] || '#666666';
        return this.hexToRgba(hex, 150);
      },
      getWidth: (d) => highlightedPipelines.has(d.id) ? 3 : 1.5,
      widthMinPixels: 1,
      widthMaxPixels: 4,
      pickable: true,
      updateTriggers: { highlighted: highlightSignature },
    });

    this.lastPipelineHighlightSignature = highlightSignature;
    this.layerCache.set(cacheKey, layer);
    return layer;
  }

  private createConflictZonesLayer(): GeoJsonLayer {
    const cacheKey = 'conflict-zones-layer';

    const layer = new GeoJsonLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: cacheKey,
      data: CONFLICT_ZONES_GEOJSON,
      filled: true,
      stroked: true,
      getFillColor: () => COLORS.conflict,
      getLineColor: () => getCurrentTheme() === 'light'
        ? [255, 0, 0, 120] as [number, number, number, number]
        : [255, 0, 0, 180] as [number, number, number, number],
      getLineWidth: 2,
      lineWidthMinPixels: 1,
      pickable: true,
    });
    return layer;
  }


  private getBasesData(): MilitaryBaseEnriched[] {
    return (this.serverBasesLoaded && this.serverBases.length > 0)
      ? this.serverBases
      : MILITARY_BASES as MilitaryBaseEnriched[];
  }

  private getBaseColor(type: string, a: number): [number, number, number, number] {
    switch (type) {
      case 'us-nato': return [130, 185, 255, a];
      case 'russia': return [255, 130, 130, a];
      case 'china': return [255, 185, 120, a];
      case 'uk': return [130, 210, 255, a];
      case 'france': return [90, 155, 225, a];
      case 'india': return [255, 195, 100, a];
      case 'japan': return [235, 90, 110, a];
      default: return [195, 195, 195, a];
    }
  }

  private createBasesLayer(): IconLayer {
    const highlightedBases = this.highlightedAssets.base;
    const zoom = this.maplibreMap?.getZoom() || 3;
    const alphaScale = Math.min(1, (zoom - 2.5) / 2.5);
    const a = Math.round(220 * Math.max(0.5, alphaScale));
    const data = this.getBasesData();

    return new IconLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'bases-layer',
      data,
      getPosition: (d) => [d.lon, d.lat],
      getIcon: () => 'compass',
      iconAtlas: MARKER_ICONS.compass,
      iconMapping: COMPASS_ICON_MAPPING,
      getSize: (d) => highlightedBases.has(d.id) ? 18 : 13,
      getColor: (d) => {
        if (highlightedBases.has(d.id)) {
          return [255, 100, 100, 220] as [number, number, number, number];
        }
        return this.getBaseColor(d.type, a);
      },
      sizeScale: 1,
      sizeMinPixels: 7,
      sizeMaxPixels: 18,
      pickable: true,
    });
  }

  private createBasesClusterLayer(): Layer[] {
    if (this.serverBaseClusters.length === 0) return [];
    const zoom = this.maplibreMap?.getZoom() || 3;
    const alphaScale = Math.min(1, (zoom - 2.5) / 2.5);
    const a = Math.round(180 * Math.max(0.3, alphaScale));

    const scatterLayer = new ScatterplotLayer<ServerBaseCluster>({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'bases-cluster-layer',
      data: this.serverBaseClusters,
      getPosition: (d) => [d.longitude, d.latitude],
      getRadius: (d) => Math.max(8000, Math.log2(d.count) * 6000),
      getFillColor: (d) => this.getBaseColor(d.dominantType, a),
      radiusMinPixels: 10,
      radiusMaxPixels: 40,
      pickable: true,
    });

    const textLayer = new TextLayer<ServerBaseCluster>({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'bases-cluster-text',
      data: this.serverBaseClusters,
      getPosition: (d) => [d.longitude, d.latitude],
      getText: (d) => String(d.count),
      getSize: 12,
      getColor: [255, 255, 255, 220],
      fontWeight: 'bold',
      getTextAnchor: 'middle',
      getAlignmentBaseline: 'center',
    });

    return [scatterLayer, textLayer];
  }

  private createNuclearLayer(): IconLayer {
    const highlightedNuclear = this.highlightedAssets.nuclear;
    const data = NUCLEAR_FACILITIES.filter(f => f.status !== 'decommissioned');

    // Nuclear: RADIATION icons - yellow/orange color, semi-transparent
    return new IconLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'nuclear-layer',
      data,
      getPosition: (d) => [d.lon, d.lat],
      getIcon: () => 'radiation',
      iconAtlas: MARKER_ICONS.radiation,
      iconMapping: RADIATION_ICON_MAPPING,
      getSize: (d) => highlightedNuclear.has(d.id) ? 17 : 13,
      getColor: (d) => {
        if (highlightedNuclear.has(d.id)) {
          return [255, 100, 100, 220] as [number, number, number, number];
        }
        if (d.status === 'contested') {
          return [255, 50, 50, 200] as [number, number, number, number];
        }
        return [255, 220, 0, 200] as [number, number, number, number]; // Semi-transparent yellow
      },
      sizeScale: 1,
      sizeMinPixels: 7,
      sizeMaxPixels: 17,
      pickable: true,
    });
  }

  private createIrradiatorsLayer(): IconLayer {
    return new IconLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'irradiators-layer',
      data: GAMMA_IRRADIATORS,
      getPosition: (d) => [d.lon, d.lat],
      getIcon: () => 'radiation',
      iconAtlas: MARKER_ICONS.radiation,
      iconMapping: RADIATION_ICON_MAPPING,
      getSize: 11,
      getColor: [200, 100, 255, 200] as [number, number, number, number], // Purple
      sizeScale: 1,
      sizeMinPixels: 6,
      sizeMaxPixels: 14,
      pickable: true,
    });
  }

  private createSpaceportsLayer(): ScatterplotLayer {
    return new ScatterplotLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'spaceports-layer',
      data: SPACEPORTS,
      getPosition: (d) => [d.lon, d.lat],
      getRadius: 10000,
      getFillColor: [200, 100, 255, 200] as [number, number, number, number], // Purple
      radiusMinPixels: 5,
      radiusMaxPixels: 12,
      pickable: true,
    });
  }

  private createPortsLayer(): ScatterplotLayer {
    return new ScatterplotLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'ports-layer',
      data: PORTS,
      getPosition: (d) => [d.lon, d.lat],
      getRadius: 6000,
      getFillColor: (d) => {
        // Color by port type (matching old Map.ts icons)
        switch (d.type) {
          case 'naval': return [100, 150, 255, 200] as [number, number, number, number]; // Blue - ⚓
          case 'oil': return [255, 140, 0, 200] as [number, number, number, number]; // Orange - 🛢️
          case 'lng': return [255, 200, 50, 200] as [number, number, number, number]; // Yellow - 🛢️
          case 'container': return [0, 200, 255, 180] as [number, number, number, number]; // Cyan - 🏭
          case 'mixed': return [150, 200, 150, 180] as [number, number, number, number]; // Green
          case 'bulk': return [180, 150, 120, 180] as [number, number, number, number]; // Brown
          default: return [0, 200, 255, 160] as [number, number, number, number];
        }
      },
      radiusMinPixels: 4,
      radiusMaxPixels: 10,
      pickable: true,
    });
  }

  private createFlightDelaysLayer(delays: AirportDelayAlert[]): IconLayer<AirportDelayAlert> {
    return new IconLayer<AirportDelayAlert>({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'flight-delays-layer',
      data: delays,
      getPosition: (d) => [d.lon, d.lat],
      getIcon: () => 'airport',
      iconAtlas: MARKER_ICONS.airport,
      iconMapping: AIRPORT_ICON_MAPPING,
      getColor: (d) => {
        if (d.severity === 'severe') return [255, 50, 50, 200] as [number, number, number, number];
        if (d.severity === 'major') return [255, 150, 0, 200] as [number, number, number, number];
        if (d.severity === 'moderate') return [255, 200, 100, 180] as [number, number, number, number];
        return [180, 180, 180, 150] as [number, number, number, number];
      },
      getSize: (d) => {
        if (d.severity === 'severe') return 26;
        if (d.severity === 'major') return 22;
        if (d.severity === 'moderate') return 18;
        return 16;
      },
      sizeMinPixels: 14,
      sizeMaxPixels: 30,
      billboard: false,
      pickable: true,
    });
  }

  private createAircraftPositionsLayer(layerId = 'aircraft-positions-layer'): IconLayer<PositionSample> {
    return new IconLayer<PositionSample>({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: layerId,
      data: this.aircraftPositions,
      getPosition: (d) => [d.lon, d.lat],
      getIcon: () => 'plane-civilian',
      iconAtlas: MARKER_ICONS.planeCivilian,
      iconMapping: CIVILIAN_AIRCRAFT_ICON_MAPPING,
      getSize: (d) => d.onGround ? 13 : 18,
      getColor: (d) => {
        if (d.onGround) return [110, 110, 110, 150] as [number, number, number, number];
        // Simulated data shown in amber so users can distinguish real vs demo
        if (d.source?.includes('simulated') || d.source?.includes('SIMULATED')) {
          return [255, 160, 40, 200] as [number, number, number, number];
        }
        return [160, 100, 255, 230] as [number, number, number, number]; // Purple = real OpenSky
      },
      getAngle: (d) => -(d.trackDeg ?? 0) +90,
      sizeMinPixels: 8,
      sizeMaxPixels: 28,
      sizeScale: 1,
      pickable: true,
      billboard: false,
      updateTriggers: {
        getColor: this.aircraftPositions.length,
        getSize: this.aircraftPositions.length,
        getAngle: this.aircraftPositions.length,
      },
    });
  }

  private createGeopoliticalBoundariesLayer(): PathLayer {
    const cached = this.layerCache.get('geopolitical-boundaries-layer') as PathLayer | undefined;
    if (cached) return cached;
    const layer = new PathLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'geopolitical-boundaries-layer',
      data: GEOPOLITICAL_BOUNDARIES,
      getPath: (d) => d.points,
      getColor: (d) => {
        switch (d.type) {
          case 'armistice': return [255, 215, 0, 210] as [number, number, number, number];  // gold
          case 'dmz':       return [255, 215, 0, 210] as [number, number, number, number];  // gold
          case 'contact-line': return [255, 50, 50, 220] as [number, number, number, number]; // red
          case 'ceasefire': return [255, 140, 0, 190] as [number, number, number, number];  // orange
          case 'disputed':  return [200, 100, 255, 180] as [number, number, number, number]; // purple
          default:          return [200, 200, 200, 160] as [number, number, number, number];
        }
      },
      getWidth: 2,
      widthMinPixels: 1,
      widthMaxPixels: 4,
      pickable: false,
    });
    this.layerCache.set('geopolitical-boundaries-layer', layer);
    return layer;
  }

  /** Empty sentinel layer — keeps a stable layer ID for deck.gl interleaved mode without rendering anything. */
  private createEmptyGhost(id: string): ScatterplotLayer {
    return new ScatterplotLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false }, id: `${id}-ghost`, data: [], getPosition: () => [0, 0], visible: false
    });
  }


  private createDatacentersLayer(): IconLayer {
    const highlightedDC = this.highlightedAssets.datacenter;
    const data = AI_DATA_CENTERS.filter(dc => dc.status !== 'decommissioned');

    // Datacenters: SQUARE icons - purple color, semi-transparent for layering
    return new IconLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'datacenters-layer',
      data,
      getPosition: (d) => [d.lon, d.lat],
      getIcon: () => 'square',
      iconAtlas: MARKER_ICONS.square,
      iconMapping: DATACENTER_ICON_MAPPING,
      getSize: (d) => highlightedDC.has(d.id) ? 14 : 10,
      getColor: (d) => {
        if (highlightedDC.has(d.id)) {
          return [255, 100, 100, 200] as [number, number, number, number];
        }
        if (d.status === 'planned') {
          return [136, 68, 255, 100] as [number, number, number, number]; // Transparent for planned
        }
        return [136, 68, 255, 140] as [number, number, number, number]; // ~55% opacity
      },
      sizeScale: 1,
      sizeMinPixels: 6,
      sizeMaxPixels: 14,
      pickable: true,
    });
  }

  private createEarthquakesLayer(earthquakes: Earthquake[]): ScatterplotLayer {
    return new ScatterplotLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'earthquakes-layer',
      data: earthquakes,
      getPosition: (d) => [d.location?.longitude ?? 0, d.location?.latitude ?? 0],
      getRadius: (d) => Math.pow(2, d.magnitude) * 1000,
      getFillColor: (d) => {
        const mag = d.magnitude;
        if (mag >= 6) return [255, 0, 0, 200] as [number, number, number, number];
        if (mag >= 5) return [255, 100, 0, 200] as [number, number, number, number];
        return COLORS.earthquake;
      },
      radiusMinPixels: 4,
      radiusMaxPixels: 30,
      pickable: true,
    });
  }

  private createNaturalEventsLayer(events: NaturalEvent[]): ScatterplotLayer {
    return new ScatterplotLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'natural-events-layer',
      data: events,
      getPosition: (d: NaturalEvent) => [d.lon, d.lat],
      getRadius: (d: NaturalEvent) => d.title.startsWith('🔴') ? 20000 : d.title.startsWith('🟠') ? 15000 : 8000,
      getFillColor: (d: NaturalEvent) => {
        if (d.title.startsWith('🔴')) return [255, 0, 0, 220] as [number, number, number, number];
        if (d.title.startsWith('🟠')) return [255, 140, 0, 200] as [number, number, number, number];
        return [255, 150, 50, 180] as [number, number, number, number];
      },
      radiusMinPixels: 5,
      radiusMaxPixels: 18,
      pickable: true,
    });
  }

  private createFiresLayer(): ScatterplotLayer {
    // Spec 06, §4.2: Viewport-aware data subsetting
    const viewPortFires = this.filterByViewport(
      this.firmsFireData,
      (d) => d.lat,
      (d) => d.lon
    );

    return new ScatterplotLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'fires-layer',
      data: viewPortFires,
      getPosition: (d: (typeof this.firmsFireData)[0]) => [d.lon, d.lat],
      getRadius: (d: (typeof this.firmsFireData)[0]) => Math.min(d.frp * 200, 30000) || 5000,
      getFillColor: (d: (typeof this.firmsFireData)[0]) => {
        if (d.brightness > 400) return [255, 30, 0, 220] as [number, number, number, number];
        if (d.brightness > 350) return [255, 140, 0, 200] as [number, number, number, number];
        return [255, 220, 50, 180] as [number, number, number, number];
      },
      radiusMinPixels: 3,
      radiusMaxPixels: 12,
      pickable: true,
    });
  }

  private createIranEventsLayer(): ScatterplotLayer {
    return new ScatterplotLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'iran-events-layer',
      data: this.iranEvents,
      getPosition: (d: IranEvent) => [d.longitude, d.latitude],
      getRadius: (d: IranEvent) => (d.severity === 'high' || d.severity === 'critical') ? 20000 : d.severity === 'medium' ? 15000 : 10000,
      getFillColor: (d: IranEvent) => {
        if (d.severity === 'critical' || d.category === 'military') return [255, 50, 50, 220] as [number, number, number, number];
        if (d.category === 'politics' || d.category === 'diplomacy') return [255, 165, 0, 200] as [number, number, number, number];
        return [255, 255, 0, 180] as [number, number, number, number];
      },
      radiusMinPixels: 4,
      radiusMaxPixels: 16,
      pickable: true,
    });
  }

  private createWeatherLayer(alerts: WeatherAlert[]): ScatterplotLayer {
    // Filter weather alerts that have centroid coordinates
    const alertsWithCoords = alerts.filter(a => a.centroid && a.centroid.length === 2);

    return new ScatterplotLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'weather-layer',
      data: alertsWithCoords,
      getPosition: (d) => d.centroid as [number, number], // centroid is [lon, lat]
      getRadius: 25000,
      getFillColor: (d) => {
        if (d.severity === 'Extreme') return [255, 0, 0, 200] as [number, number, number, number];
        if (d.severity === 'Severe') return [255, 100, 0, 180] as [number, number, number, number];
        if (d.severity === 'Moderate') return [255, 170, 0, 160] as [number, number, number, number];
        return COLORS.weather;
      },
      radiusMinPixels: 8,
      radiusMaxPixels: 20,
      pickable: true,
    });
  }

  private createOutagesLayer(outages: InternetOutage[]): ScatterplotLayer {
    return new ScatterplotLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'outages-layer',
      data: outages,
      getPosition: (d) => [d.lon, d.lat],
      getRadius: 20000,
      getFillColor: COLORS.outage,
      radiusMinPixels: 6,
      radiusMaxPixels: 18,
      pickable: true,
    });
  }

  private createCyberThreatsLayer(): ScatterplotLayer<CyberThreat> {
    return new ScatterplotLayer<CyberThreat>({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'cyber-threats-layer',
      data: this.cyberThreats,
      getPosition: (d) => [d.lon, d.lat],
      getRadius: (d) => {
        switch (d.severity) {
          case 'critical': return 22000;
          case 'high': return 17000;
          case 'medium': return 13000;
          default: return 9000;
        }
      },
      getFillColor: (d) => {
        switch (d.severity) {
          case 'critical': return [255, 61, 0, 225] as [number, number, number, number];
          case 'high': return [255, 102, 0, 205] as [number, number, number, number];
          case 'medium': return [255, 176, 0, 185] as [number, number, number, number];
          default: return [255, 235, 59, 170] as [number, number, number, number];
        }
      },
      radiusMinPixels: 6,
      radiusMaxPixels: 18,
      pickable: true,
      stroked: true,
      getLineColor: [255, 255, 255, 160] as [number, number, number, number],
      lineWidthMinPixels: 1,
    });
  }

  private createAisDensityLayer(): ScatterplotLayer {
    return new ScatterplotLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'ais-density-layer',
      data: this.aisDensity,
      getPosition: (d) => [d.lon, d.lat],
      getRadius: (d) => 4000 + d.intensity * 8000,
      getFillColor: (d) => {
        const intensity = Math.min(Math.max(d.intensity, 0.15), 1);
        const isCongested = (d.deltaPct || 0) >= 15;
        const alpha = Math.round(40 + intensity * 160);
        // Orange for congested areas, cyan for normal traffic
        if (isCongested) {
          return [255, 183, 3, alpha] as [number, number, number, number]; // #ffb703
        }
        return [0, 209, 255, alpha] as [number, number, number, number]; // #00d1ff
      },
      radiusMinPixels: 4,
      radiusMaxPixels: 12,
      pickable: true,
    });
  }

  private createGpsJammingLayer(): H3HexagonLayer {
    return new H3HexagonLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'gps-jamming-layer',
      data: this.gpsJammingHexes,
      getHexagon: (d: GpsJamHex) => d.h3,
      getFillColor: (d: GpsJamHex) => {
        if (d.level === 'high') return [255, 80, 80, 180] as [number, number, number, number];
        return [255, 180, 50, 140] as [number, number, number, number];
      },
      getElevation: 0,
      extruded: false,
      filled: true,
      stroked: true,
      getLineColor: [255, 255, 255, 80] as [number, number, number, number],
      getLineWidth: 1,
      lineWidthMinPixels: 1,
      pickable: true,
    });
  }

  private createAisDisruptionsLayer(): ScatterplotLayer {
    // AIS spoofing/jamming events
    return new ScatterplotLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'ais-disruptions-layer',
      data: this.aisDisruptions,
      getPosition: (d) => [d.lon, d.lat],
      getRadius: 12000,
      getFillColor: (d) => {
        // Color by severity/type
        if (d.severity === 'high' || d.type === 'spoofing') {
          return [255, 50, 50, 220] as [number, number, number, number]; // Red
        }
        if (d.severity === 'medium') {
          return [255, 150, 0, 200] as [number, number, number, number]; // Orange
        }
        return [255, 200, 100, 180] as [number, number, number, number]; // Yellow
      },
      radiusMinPixels: 6,
      radiusMaxPixels: 14,
      pickable: true,
      stroked: true,
      getLineColor: [255, 255, 255, 150] as [number, number, number, number],
      lineWidthMinPixels: 1,
    });
  }

  private createCableAdvisoriesLayer(advisories: CableAdvisory[]): ScatterplotLayer {
    // Cable fault/maintenance advisories
    return new ScatterplotLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'cable-advisories-layer',
      data: advisories,
      getPosition: (d) => [d.lon, d.lat],
      getRadius: 10000,
      getFillColor: (d) => {
        if (d.severity === 'fault') {
          return [255, 50, 50, 220] as [number, number, number, number]; // Red for faults
        }
        return [255, 200, 0, 200] as [number, number, number, number]; // Yellow for maintenance
      },
      radiusMinPixels: 5,
      radiusMaxPixels: 12,
      pickable: true,
      stroked: true,
      getLineColor: [0, 200, 255, 200] as [number, number, number, number], // Cyan outline (cable color)
      lineWidthMinPixels: 2,
    });
  }

  private createRepairShipsLayer(): ScatterplotLayer {
    // Cable repair ships
    return new ScatterplotLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'repair-ships-layer',
      data: this.repairShips,
      getPosition: (d) => [d.lon, d.lat],
      getRadius: 8000,
      getFillColor: [0, 255, 200, 200] as [number, number, number, number], // Teal
      radiusMinPixels: 4,
      radiusMaxPixels: 10,
      pickable: true,
    });
  }

  private createMilitaryVesselsLayer(
    vessels: MilitaryVessel[],
    layerIds: { carrierLayerId: string; vesselLayerId: string } = {
      carrierLayerId: 'military-carriers-layer',
      vesselLayerId: 'military-vessels-layer',
    },
  ): IconLayer<MilitaryVessel>[] {
    const TYPE_COLORS: Record<string, [number, number, number, number]> = {
      carrier:     [255,  68,  68, 230],
      destroyer:   [255, 136,   0, 230],
      submarine:   [136,  68, 255, 220],
      frigate:     [ 68, 170, 255, 220],
      amphibious:  [136, 255,  68, 220],
      support:     [180, 180, 180, 200],
    };
    const baseParams = {
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      getPosition: (d: MilitaryVessel) => [d.lon, d.lat] as [number, number],
      getColor: (d: MilitaryVessel) => {
        if (d.usniSource) return [255, 160, 60, 180] as [number, number, number, number];
        return TYPE_COLORS[d.vesselType] ?? COLORS.vesselMilitary;
      },
      getAngle: (d: MilitaryVessel) => -(d.heading ?? 0),
      sizeMinPixels: 6,
      sizeMaxPixels: 32,
      sizeScale: 1,
      billboard: false,
      pickable: true,
    };
    const carriers = vessels.filter(v => v.vesselType === 'carrier');
    const others = vessels.filter(v => v.vesselType !== 'carrier');
    const layers: IconLayer<MilitaryVessel>[] = [];
    if (carriers.length > 0) {
      layers.push(new IconLayer<MilitaryVessel>({
        ...baseParams,
        id: layerIds.carrierLayerId,
        data: carriers,
        getIcon: () => 'carrier',
        iconAtlas: MARKER_ICONS.carrier,
        iconMapping: CARRIER_ICON_MAPPING,
        getSize: 32,
        updateTriggers: { getColor: carriers.length, getAngle: carriers.length },
      }));
    }
    if (others.length > 0) {
      layers.push(new IconLayer<MilitaryVessel>({
        ...baseParams,
        id: layerIds.vesselLayerId,
        data: others,
        getIcon: () => 'ship',
        iconAtlas: MARKER_ICONS.ship,
        iconMapping: SHIP_ICON_MAPPING,
        getSize: 24,
        updateTriggers: { getColor: others.length, getAngle: others.length },
      }));
    }
    return layers;
  }

  private createMilitaryVesselClustersLayer(clusters: MilitaryVesselCluster[], layerId = 'military-vessel-clusters-layer'): ScatterplotLayer {
    return new ScatterplotLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: layerId,
      data: clusters,
      getPosition: (d) => [d.lon, d.lat],
      getRadius: (d) => 15000 + (d.vesselCount || 1) * 3000,
      getFillColor: (d) => {
        // Vessel types: 'exercise' | 'deployment' | 'transit' | 'unknown'
        const activity = d.activityType || 'unknown';
        if (activity === 'exercise' || activity === 'deployment') return [255, 100, 100, 200] as [number, number, number, number];
        if (activity === 'transit') return [255, 180, 100, 180] as [number, number, number, number];
        return [200, 150, 150, 160] as [number, number, number, number];
      },
      radiusMinPixels: 8,
      radiusMaxPixels: 25,
      pickable: true,
    });
  }

  private createNavalSnapshotLayers(snapshot: NavalActivitySnapshot): Layer[] {
    const layers: Layer[] = [];
    const TYPE_COLORS: Record<string, [number, number, number, number]> = {
      carrier:    [255,  68,  68, 230],
      destroyer:  [255, 136,   0, 230],
      submarine:  [136,  68, 255, 220],
      frigate:    [ 68, 170, 255, 220],
      amphibious: [136, 255,  68, 220],
      support:    [180, 180, 180, 200],
    };
    const baseParams = {
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
    };

    // Standalone seeded vessels (not part of a strike group)
    const standaloneVessels: SeededVessel[] = snapshot.vessels.filter(v => !('strikeGroupId' in v) || !v.strikeGroupId);
    if (standaloneVessels.length > 0) {
      layers.push(new IconLayer<SeededVessel>({
        ...baseParams,
        id: 'naval-seeded-vessels-layer',
        data: standaloneVessels,
        getPosition: (d: SeededVessel) => [d.lon, d.lat] as [number, number],
        getColor: (d: SeededVessel) => TYPE_COLORS[d.vesselType] ?? [180, 180, 180, 200],
        getIcon: () => 'ship',
        iconAtlas: MARKER_ICONS.ship,
        iconMapping: SHIP_ICON_MAPPING,
        getSize: 24,
        sizeMinPixels: 6,
        sizeMaxPixels: 28,
        sizeScale: 1,
        billboard: false,
        pickable: true,
      }));
    }

    // Naval strike groups (carrier as center point)
    if (snapshot.strikeGroups.length > 0) {
      layers.push(new IconLayer<NavalStrikeGroup>({
        ...baseParams,
        id: 'naval-csg-layer',
        data: snapshot.strikeGroups,
        getPosition: (d: NavalStrikeGroup) => [d.lon, d.lat] as [number, number],
        getColor: () => [255, 68, 68, 230] as [number, number, number, number],
        getIcon: () => 'carrier',
        iconAtlas: MARKER_ICONS.carrier,
        iconMapping: CARRIER_ICON_MAPPING,
        getSize: 32,
        sizeMinPixels: 8,
        sizeMaxPixels: 36,
        sizeScale: 1,
        billboard: false,
        pickable: true,
      }));
    }

    // Theater/regional clusters
    if (snapshot.clusters.length > 0) {
      layers.push(new ScatterplotLayer<NavalCluster>({
        ...baseParams,
        id: 'naval-snapshot-clusters-layer',
        data: snapshot.clusters,
        getPosition: (d: NavalCluster) => [d.lon, d.lat] as [number, number],
        getRadius: (d: NavalCluster) => 20000 + (d.vesselCount || 1) * 4000,
        getFillColor: (d: NavalCluster) => d.hasCarrier
          ? [255, 68, 68, 180] as [number, number, number, number]
          : [100, 160, 255, 160] as [number, number, number, number],
        radiusMinPixels: 8,
        radiusMaxPixels: 30,
        pickable: true,
      }) as ScatterplotLayer);
    }

    return layers;
  }

  private createMilitaryFlightsLayer(
    flights: MilitaryFlight[],
    layerIds: { iconLayerId: string; interestingRingLayerId: string } = {
      iconLayerId: 'military-flights-layer',
      interestingRingLayerId: 'military-flights-interesting-ring',
    },
    iconVariant: 'military' | 'civilian' = 'military',
  ): Layer[] {
    const TYPE_COLORS: Record<string, [number, number, number, number]> = {
      fighter:        [255,  50,  50, 230],
      bomber:         [255, 120,   0, 230],
      reconnaissance: [ 60, 160, 255, 220],
      awacs:          [ 60, 200, 255, 220],
      tanker:         [140, 255,  80, 220],
      transport:      [180, 180, 255, 210],
      helicopter:     [255, 255,  80, 210],
      drone:          [255,  80, 255, 210],
      patrol:         [ 80, 200, 200, 210],
      special_ops:    [255, 160,  40, 220],
      vip:            [220, 180, 255, 220],
    };
    // Interesting flights use a vivid amber-gold to stand out
    const INTERESTING_COLOR: [number, number, number, number] = [255, 210, 0, 255];
    const iconName = iconVariant === 'civilian' ? 'plane-civilian' : 'plane';
    const iconAtlas = iconVariant === 'civilian' ? MARKER_ICONS.planeCivilian : MARKER_ICONS.plane;
    const iconMapping = iconVariant === 'civilian' ? CIVILIAN_AIRCRAFT_ICON_MAPPING : AIRCRAFT_ICON_MAPPING;

    console.info(`Creating Military Flights Layer with ${flights.length} flights`, {
      sample: flights.slice(0, 5)
    });

    const layers: Layer[] = [];

    // Main icon layer for all flights
    layers.push(new IconLayer<MilitaryFlight>({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: layerIds.iconLayerId,
      data: flights,
      getPosition: (d) => [d.lon, d.lat],
      getIcon: () => iconName,
      iconAtlas,
      iconMapping,
      getSize: (d) => d.onGround ? 14 : 20,
      getColor: (d) => d.isInteresting ? INTERESTING_COLOR : (TYPE_COLORS[d.aircraftType] ?? COLORS.flightMilitary),
      getAngle: (d) => -(d.heading ?? 0) +90, // Rotate to match heading
      sizeMinPixels: 6,
      sizeMaxPixels: 24,
      billboard: false,
      pickable: true,
      updateTriggers: { getColor: flights.length, getAngle: flights.length, getSize: flights.length },
    }));

    // Static stroke ring for interesting flights
    const interesting = flights.filter(f => f.isInteresting);
    if (interesting.length > 0) {
      layers.push(new ScatterplotLayer<MilitaryFlight>({
        parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
        id: layerIds.interestingRingLayerId,
        data: interesting,
        getPosition: (d) => [d.lon, d.lat],
        getRadius: 18000,
        radiusMinPixels: 9,
        radiusMaxPixels: 28,
        stroked: false,
        filled: false,
        getLineColor: [255, 210, 0, 200],
        lineWidthMinPixels: 2,
        pickable: false,
      }));
    }

    return layers;
  }

  private createMilitaryFlightClustersLayer(clusters: MilitaryFlightCluster[], layerId = 'military-flight-clusters-layer'): ScatterplotLayer {
    return new ScatterplotLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: layerId,
      data: clusters,
      getPosition: (d) => [d.lon, d.lat],
      getRadius: (d) => 15000 + (d.flightCount || 1) * 3000,
      getFillColor: (d) => {
        const activity = d.activityType || 'unknown';
        if (activity === 'exercise' || activity === 'patrol') return [100, 150, 255, 200] as [number, number, number, number];
        if (activity === 'transport') return [255, 200, 100, 180] as [number, number, number, number];
        return [150, 150, 200, 160] as [number, number, number, number];
      },
      radiusMinPixels: 8,
      radiusMaxPixels: 25,
      pickable: true,
    });
  }

  private createWaterwaysLayer(): ScatterplotLayer {
    return new ScatterplotLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'waterways-layer',
      data: STRATEGIC_WATERWAYS,
      getPosition: (d) => [d.lon, d.lat],
      getRadius: 10000,
      getFillColor: [100, 150, 255, 180] as [number, number, number, number],
      radiusMinPixels: 5,
      radiusMaxPixels: 12,
      pickable: true,
    });
  }

  private createEconomicCentersLayer(): ScatterplotLayer {
    return new ScatterplotLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'economic-centers-layer',
      data: ECONOMIC_CENTERS,
      getPosition: (d) => [d.lon, d.lat],
      getRadius: 8000,
      getFillColor: [255, 215, 0, 180] as [number, number, number, number],
      radiusMinPixels: 4,
      radiusMaxPixels: 10,
      pickable: true,
    });
  }

  private createStockExchangesLayer(): ScatterplotLayer {
    return new ScatterplotLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'stock-exchanges-layer',
      data: STOCK_EXCHANGES,
      getPosition: (d) => [d.lon, d.lat],
      getRadius: (d) => d.tier === 'mega' ? 18000 : d.tier === 'major' ? 14000 : 11000,
      getFillColor: (d) => {
        if (d.tier === 'mega') return [255, 215, 80, 220] as [number, number, number, number];
        if (d.tier === 'major') return COLORS.stockExchange;
        return [140, 210, 255, 190] as [number, number, number, number];
      },
      radiusMinPixels: 5,
      radiusMaxPixels: 14,
      pickable: true,
    });
  }

  private createFinancialCentersLayer(): ScatterplotLayer {
    return new ScatterplotLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'financial-centers-layer',
      data: FINANCIAL_CENTERS,
      getPosition: (d) => [d.lon, d.lat],
      getRadius: (d) => d.type === 'global' ? 17000 : d.type === 'regional' ? 13000 : 10000,
      getFillColor: (d) => {
        if (d.type === 'global') return COLORS.financialCenter;
        if (d.type === 'regional') return [0, 190, 130, 185] as [number, number, number, number];
        return [0, 150, 110, 165] as [number, number, number, number];
      },
      radiusMinPixels: 4,
      radiusMaxPixels: 12,
      pickable: true,
    });
  }

  private createCentralBanksLayer(): ScatterplotLayer {
    return new ScatterplotLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'central-banks-layer',
      data: CENTRAL_BANKS,
      getPosition: (d) => [d.lon, d.lat],
      getRadius: (d) => d.type === 'major' ? 15000 : d.type === 'supranational' ? 17000 : 12000,
      getFillColor: (d) => {
        if (d.type === 'major') return COLORS.centralBank;
        if (d.type === 'supranational') return [255, 235, 140, 220] as [number, number, number, number];
        return [235, 180, 80, 185] as [number, number, number, number];
      },
      radiusMinPixels: 4,
      radiusMaxPixels: 12,
      pickable: true,
    });
  }

  private createCommodityHubsLayer(): ScatterplotLayer {
    return new ScatterplotLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'commodity-hubs-layer',
      data: COMMODITY_HUBS,
      getPosition: (d) => [d.lon, d.lat],
      getRadius: (d) => d.type === 'exchange' ? 14000 : d.type === 'port' ? 12000 : 10000,
      getFillColor: (d) => {
        if (d.type === 'exchange') return COLORS.commodityHub;
        if (d.type === 'port') return [80, 170, 255, 190] as [number, number, number, number];
        return [255, 110, 80, 185] as [number, number, number, number];
      },
      radiusMinPixels: 4,
      radiusMaxPixels: 11,
      pickable: true,
    });
  }

  private createAPTGroupsLayer(): ScatterplotLayer {
    // APT Groups - cyber threat actor markers (geopolitical variant only)
    // Made subtle to avoid visual clutter - small orange dots
    return new ScatterplotLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'apt-groups-layer',
      data: APT_GROUPS,
      getPosition: (d) => [d.lon, d.lat],
      getRadius: 6000,
      getFillColor: [255, 140, 0, 140] as [number, number, number, number], // Subtle orange
      radiusMinPixels: 4,
      radiusMaxPixels: 8,
      pickable: true,
      stroked: false, // No outline - cleaner look
    });
  }

  private createMineralsLayer(): ScatterplotLayer {
    // Critical minerals projects
    return new ScatterplotLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'minerals-layer',
      data: CRITICAL_MINERALS,
      getPosition: (d) => [d.lon, d.lat],
      getRadius: 8000,
      getFillColor: (d) => {
        // Color by mineral type
        switch (d.mineral) {
          case 'Lithium': return [0, 200, 255, 200] as [number, number, number, number]; // Cyan
          case 'Cobalt': return [100, 100, 255, 200] as [number, number, number, number]; // Blue
          case 'Rare Earths': return [255, 100, 200, 200] as [number, number, number, number]; // Pink
          case 'Nickel': return [100, 255, 100, 200] as [number, number, number, number]; // Green
          default: return [200, 200, 200, 200] as [number, number, number, number]; // Gray
        }
      },
      radiusMinPixels: 5,
      radiusMaxPixels: 12,
      pickable: true,
    });
  }

  // Tech variant layers
  private createStartupHubsLayer(): ScatterplotLayer {
    return new ScatterplotLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'startup-hubs-layer',
      data: STARTUP_HUBS,
      getPosition: (d) => [d.lon, d.lat],
      getRadius: 10000,
      getFillColor: COLORS.startupHub,
      radiusMinPixels: 5,
      radiusMaxPixels: 12,
      pickable: true,
    });
  }

  private createAcceleratorsLayer(): ScatterplotLayer {
    return new ScatterplotLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'accelerators-layer',
      data: ACCELERATORS,
      getPosition: (d) => [d.lon, d.lat],
      getRadius: 6000,
      getFillColor: COLORS.accelerator,
      radiusMinPixels: 3,
      radiusMaxPixels: 8,
      pickable: true,
    });
  }

  private createCloudRegionsLayer(): ScatterplotLayer {
    return new ScatterplotLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'cloud-regions-layer',
      data: CLOUD_REGIONS,
      getPosition: (d) => [d.lon, d.lat],
      getRadius: 12000,
      getFillColor: COLORS.cloudRegion,
      radiusMinPixels: 4,
      radiusMaxPixels: 12,
      pickable: true,
    });
  }

  private createProtestClusterLayers(): Layer[] {
    this.updateClusterData();
    const layers: Layer[] = [];

    layers.push(new ScatterplotLayer<MapProtestCluster>({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'protest-clusters-layer',
      data: this.protestClusters,
      getPosition: d => [d.lon, d.lat],
      getRadius: d => 15000 + d.count * 2000,
      radiusMinPixels: 6,
      radiusMaxPixels: 22,
      getFillColor: d => {
        if (d.hasRiot) return [220, 40, 40, 200] as [number, number, number, number];
        if (d.maxSeverity === 'high') return [255, 80, 60, 180] as [number, number, number, number];
        if (d.maxSeverity === 'medium') return [255, 160, 40, 160] as [number, number, number, number];
        return [255, 220, 80, 140] as [number, number, number, number];
      },
      pickable: true,
      updateTriggers: { getRadius: this.lastSCZoom, getFillColor: this.lastSCZoom },
    }));

    const multiClusters = this.protestClusters.filter(c => c.count > 1);
    if (multiClusters.length > 0) {
      layers.push(new TextLayer<MapProtestCluster>({
        parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
        id: 'protest-clusters-badge',
        data: multiClusters,
        getText: d => String(d.count),
        getPosition: d => [d.lon, d.lat],
        background: true,
        getBackgroundColor: [0, 0, 0, 180],
        backgroundPadding: [4, 2, 4, 2],
        getColor: [255, 255, 255, 255],
        getSize: 12,
        getPixelOffset: [0, -14],
        pickable: false,
        fontFamily: 'system-ui, sans-serif',
        fontWeight: 700,
      }));
    }

    const pulseClusters = this.protestClusters.filter(c => c.maxSeverity === 'high' || c.hasRiot);
    if (pulseClusters.length > 0) {
      const pulse = 1.0 + 0.8 * (0.5 + 0.5 * Math.sin((this.pulseTime || Date.now()) / 400));
      layers.push(new ScatterplotLayer<MapProtestCluster>({
        parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
        id: 'protest-clusters-pulse',
        data: pulseClusters,
        getPosition: d => [d.lon, d.lat],
        getRadius: d => 15000 + d.count * 2000,
        radiusScale: pulse,
        radiusMinPixels: 8,
        radiusMaxPixels: 30,
        stroked: true,
        filled: false,
        getLineColor: d => d.hasRiot ? [220, 40, 40, 120] as [number, number, number, number] : [255, 80, 60, 100] as [number, number, number, number],
        lineWidthMinPixels: 1.5,
        pickable: false,
        updateTriggers: { radiusScale: this.pulseTime },
      }));
    }

    layers.push(this.createEmptyGhost('protest-clusters-layer'));
    return layers;
  }

  private createTechHQClusterLayers(): Layer[] {
    this.updateClusterData();
    const layers: Layer[] = [];
    const zoom = this.maplibreMap?.getZoom() || 2;

    layers.push(new ScatterplotLayer<MapTechHQCluster>({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'tech-hq-clusters-layer',
      data: this.techHQClusters,
      getPosition: d => [d.lon, d.lat],
      getRadius: d => 10000 + d.count * 1500,
      radiusMinPixels: 5,
      radiusMaxPixels: 18,
      getFillColor: d => {
        if (d.primaryType === 'faang') return [0, 220, 120, 200] as [number, number, number, number];
        if (d.primaryType === 'unicorn') return [255, 100, 200, 180] as [number, number, number, number];
        return [80, 160, 255, 180] as [number, number, number, number];
      },
      pickable: true,
      updateTriggers: { getRadius: this.lastSCZoom },
    }));

    const multiClusters = this.techHQClusters.filter(c => c.count > 1);
    if (multiClusters.length > 0) {
      layers.push(new TextLayer<MapTechHQCluster>({
        parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
        id: 'tech-hq-clusters-badge',
        data: multiClusters,
        getText: d => String(d.count),
        getPosition: d => [d.lon, d.lat],
        background: true,
        getBackgroundColor: [0, 0, 0, 180],
        backgroundPadding: [4, 2, 4, 2],
        getColor: [255, 255, 255, 255],
        getSize: 12,
        getPixelOffset: [0, -14],
        pickable: false,
        fontFamily: 'system-ui, sans-serif',
        fontWeight: 700,
      }));
    }

    if (zoom >= 3) {
      const singles = this.techHQClusters.filter(c => c.count === 1);
      if (singles.length > 0) {
        layers.push(new TextLayer<MapTechHQCluster>({
          parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
          id: 'tech-hq-clusters-label',
          data: singles,
          getText: d => d.items[0]?.company ?? '',
          getPosition: d => [d.lon, d.lat],
          getSize: 11,
          getColor: [220, 220, 220, 200],
          getPixelOffset: [0, 12],
          pickable: false,
          fontFamily: 'system-ui, sans-serif',
        }));
      }
    }

    layers.push(this.createEmptyGhost('tech-hq-clusters-layer'));
    return layers;
  }

  private createTechEventClusterLayers(): Layer[] {
    this.updateClusterData();
    const layers: Layer[] = [];

    layers.push(new ScatterplotLayer<MapTechEventCluster>({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'tech-event-clusters-layer',
      data: this.techEventClusters,
      getPosition: d => [d.lon, d.lat],
      getRadius: d => 10000 + d.count * 1500,
      radiusMinPixels: 5,
      radiusMaxPixels: 18,
      getFillColor: d => {
        if (d.soonestDaysUntil <= 14) return [255, 220, 50, 200] as [number, number, number, number];
        return [80, 140, 255, 180] as [number, number, number, number];
      },
      pickable: true,
      updateTriggers: { getRadius: this.lastSCZoom },
    }));

    const multiClusters = this.techEventClusters.filter(c => c.count > 1);
    if (multiClusters.length > 0) {
      layers.push(new TextLayer<MapTechEventCluster>({
        parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
        id: 'tech-event-clusters-badge',
        data: multiClusters,
        getText: d => String(d.count),
        getPosition: d => [d.lon, d.lat],
        background: true,
        getBackgroundColor: [0, 0, 0, 180],
        backgroundPadding: [4, 2, 4, 2],
        getColor: [255, 255, 255, 255],
        getSize: 12,
        getPixelOffset: [0, -14],
        pickable: false,
        fontFamily: 'system-ui, sans-serif',
        fontWeight: 700,
      }));
    }

    layers.push(this.createEmptyGhost('tech-event-clusters-layer'));
    return layers;
  }

  private createDatacenterClusterLayers(): Layer[] {
    this.updateClusterData();
    const layers: Layer[] = [];

    layers.push(new ScatterplotLayer<MapDatacenterCluster>({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'datacenter-clusters-layer',
      data: this.datacenterClusters,
      getPosition: d => [d.lon, d.lat],
      getRadius: d => 15000 + d.count * 2000,
      radiusMinPixels: 6,
      radiusMaxPixels: 20,
      getFillColor: d => {
        if (d.majorityExisting) return [160, 80, 255, 180] as [number, number, number, number];
        return [80, 160, 255, 180] as [number, number, number, number];
      },
      pickable: true,
      updateTriggers: { getRadius: this.lastSCZoom },
    }));

    const multiClusters = this.datacenterClusters.filter(c => c.count > 1);
    if (multiClusters.length > 0) {
      layers.push(new TextLayer<MapDatacenterCluster>({
        parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
        id: 'datacenter-clusters-badge',
        data: multiClusters,
        getText: d => String(d.count),
        getPosition: d => [d.lon, d.lat],
        background: true,
        getBackgroundColor: [0, 0, 0, 180],
        backgroundPadding: [4, 2, 4, 2],
        getColor: [255, 255, 255, 255],
        getSize: 12,
        getPixelOffset: [0, -14],
        pickable: false,
        fontFamily: 'system-ui, sans-serif',
        fontWeight: 700,
      }));
    }

    layers.push(this.createEmptyGhost('datacenter-clusters-layer'));
    return layers;
  }

  private createHotspotsLayers(): Layer[] {
    const zoom = this.maplibreMap?.getZoom() || 2;
    const zoomScale = Math.min(1, (zoom - 1) / 3);
    const maxPx = 8 + Math.round(16 * zoomScale);
    const baseOpacity = zoom < 2.5 ? 0.5 : zoom < 4 ? 0.7 : 1.0;
    const layers: Layer[] = [];

    layers.push(new ScatterplotLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'hotspots-layer',
      data: this.hotspots,
      getPosition: (d) => [d.lon, d.lat],
      getRadius: (d) => {
        const score = d.escalationScore || 1;
        return 10000 + score * 5000;
      },
      getFillColor: (d) => {
        const score = d.escalationScore || 1;
        const a = Math.round((score >= 4 ? 200 : score >= 2 ? 200 : 180) * baseOpacity);
        if (score >= 4) return [255, 68, 68, a] as [number, number, number, number];
        if (score >= 2) return [255, 165, 0, a] as [number, number, number, number];
        return [255, 255, 0, a] as [number, number, number, number];
      },
      radiusMinPixels: 5,
      radiusMaxPixels: maxPx,
      pickable: true,
      stroked: true,
      getLineColor: (d) =>
        d.hasBreaking ? [255, 255, 255, 255] as [number, number, number, number] : [0, 0, 0, 0] as [number, number, number, number],
      lineWidthMinPixels: 2,
    }));

    const highHotspots = this.hotspots.filter(h => h.level === 'high' || h.hasBreaking);
    if (highHotspots.length > 0) {
      const pulse = 1.0 + 0.8 * (0.5 + 0.5 * Math.sin((this.pulseTime || Date.now()) / 400));
      layers.push(new ScatterplotLayer({
        parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
        id: 'hotspots-pulse',
        data: highHotspots,
        getPosition: (d) => [d.lon, d.lat],
        getRadius: (d) => {
          const score = d.escalationScore || 1;
          return 10000 + score * 5000;
        },
        radiusScale: pulse,
        radiusMinPixels: 8,
        radiusMaxPixels: 36,
        stroked: true,
        filled: false,
        getLineColor: (d) => {
          const a = Math.round(120 * baseOpacity);
          return d.hasBreaking ? [255, 50, 50, a] as [number, number, number, number] : [255, 165, 0, a] as [number, number, number, number];
        },
        lineWidthMinPixels: 1.5,
        pickable: false,
        updateTriggers: { radiusScale: this.pulseTime },
      }));

    }

    layers.push(this.createEmptyGhost('hotspots-layer'));
    return layers;
  }

  private createGulfInvestmentsLayer(): ScatterplotLayer {
    return new ScatterplotLayer<GulfInvestment>({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'gulf-investments-layer',
      data: GULF_INVESTMENTS,
      getPosition: (d: GulfInvestment) => [d.lon, d.lat],
      getRadius: (d: GulfInvestment) => {
        if (!d.investmentUSD) return 20000;
        if (d.investmentUSD >= 50000) return 70000;
        if (d.investmentUSD >= 10000) return 55000;
        if (d.investmentUSD >= 1000) return 40000;
        return 25000;
      },
      getFillColor: (d: GulfInvestment) =>
        d.investingCountry === 'SA' ? COLORS.gulfInvestmentSA : COLORS.gulfInvestmentUAE,
      getLineColor: [255, 255, 255, 80] as [number, number, number, number],
      lineWidthMinPixels: 1,
      radiusMinPixels: 5,
      radiusMaxPixels: 28,
      pickable: true,
    });
  }

  private pulseTime = 0;

  private canPulse(now = Date.now()): boolean {
    return now - this.startupTime > 60_000;
  }

  private hasRecentRiot(now = Date.now(), windowMs = 2 * 60 * 60 * 1000): boolean {
    const hasRecentClusterRiot = this.protestClusters.some(c =>
      c.hasRiot && c.latestRiotEventTimeMs != null && (now - c.latestRiotEventTimeMs) < windowMs
    );
    if (hasRecentClusterRiot) return true;

    // Fallback to raw protests because syncPulseAnimation can run before cluster data refreshes.
    return this.protests.some((p) => {
      if (p.eventType !== 'riot' || p.sourceType === 'gdelt') return false;
      const ts = p.time.getTime();
      return Number.isFinite(ts) && (now - ts) < windowMs;
    });
  }

  private needsPulseAnimation(now = Date.now()): boolean {
    return this.hasRecentNews(now)
      || this.hasRecentRiot(now)
      || this.hotspots.some(h => h.hasBreaking)
      || this.positiveEvents.some(e => e.count > 10)
      || this.kindnessPoints.some(p => p.type === 'real');
  }

  private syncPulseAnimation(now = Date.now()): void {
    if (this.renderPaused) {
      if (this.newsPulseIntervalId !== null) this.stopPulseAnimation();
      return;
    }
    const shouldPulse = this.canPulse(now) && this.needsPulseAnimation(now);
    if (shouldPulse && this.newsPulseIntervalId === null) {
      this.startPulseAnimation();
    } else if (!shouldPulse && this.newsPulseIntervalId !== null) {
      this.stopPulseAnimation();
    }
  }

  private startPulseAnimation(): void {
    if (this.newsPulseIntervalId !== null) return;
    const PULSE_UPDATE_INTERVAL_MS = 500;

    this.newsPulseIntervalId = setInterval(() => {
      const now = Date.now();
      if (!this.needsPulseAnimation(now)) {
        this.pulseTime = now;
        this.stopPulseAnimation();
        this.rafUpdateLayers();
        return;
      }
      this.pulseTime = now;
      this.rafUpdateLayers();
    }, PULSE_UPDATE_INTERVAL_MS);
  }

  private stopPulseAnimation(): void {
    if (this.newsPulseIntervalId !== null) {
      clearInterval(this.newsPulseIntervalId);
      this.newsPulseIntervalId = null;
    }
  }

  private createNewsLocationsLayer(): ScatterplotLayer[] {
    const zoom = this.maplibreMap?.getZoom() || 2;
    const alphaScale = zoom < 2.5 ? 0.4 : zoom < 4 ? 0.7 : 1.0;
    const filteredNewsLocations = this.filterByTime(this.newsLocations, (location) => location.timestamp);
    const THREAT_RGB: Record<string, [number, number, number]> = {
      critical: [239, 68, 68],
      high: [249, 115, 22],
      medium: [234, 179, 8],
      low: [34, 197, 94],
      info: [59, 130, 246],
    };
    const THREAT_ALPHA: Record<string, number> = {
      critical: 220,
      high: 190,
      medium: 160,
      low: 120,
      info: 80,
    };

    const now = this.pulseTime || Date.now();
    const PULSE_DURATION = 30_000;

    const layers: ScatterplotLayer[] = [
      new ScatterplotLayer({
        parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
        id: 'news-locations-layer',
        data: filteredNewsLocations,
        getPosition: (d) => [d.lon, d.lat],
        getRadius: 18000,
        getFillColor: (d) => {
          const rgb = THREAT_RGB[d.threatLevel] || [59, 130, 246];
          const a = Math.round((THREAT_ALPHA[d.threatLevel] || 120) * alphaScale);
          return [...rgb, a] as [number, number, number, number];
        },
        radiusMinPixels: 3,
        radiusMaxPixels: 12,
        pickable: true,
      }),
    ];

    const recentNews = filteredNewsLocations.filter(d => {
      const firstSeen = this.newsLocationFirstSeen.get(d.title);
      return firstSeen && (now - firstSeen) < PULSE_DURATION;
    });

    if (recentNews.length > 0) {
      const pulse = 1.0 + 1.5 * (0.5 + 0.5 * Math.sin(now / 318));

      layers.push(new ScatterplotLayer({
        parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
        id: 'news-pulse-layer',
        data: recentNews,
        getPosition: (d) => [d.lon, d.lat],
        getRadius: 18000,
        radiusScale: pulse,
        radiusMinPixels: 6,
        radiusMaxPixels: 30,
        pickable: false,
        stroked: true,
        filled: false,
        getLineColor: (d) => {
          const rgb = THREAT_RGB[d.threatLevel] || [59, 130, 246];
          const firstSeen = this.newsLocationFirstSeen.get(d.title) || now;
          const age = now - firstSeen;
          const fadeOut = Math.max(0, 1 - age / PULSE_DURATION);
          const a = Math.round(150 * fadeOut * alphaScale);
          return [...rgb, a] as [number, number, number, number];
        },
        lineWidthMinPixels: 1.5,
        updateTriggers: { pulseTime: now },
      }));
    }

    return layers;
  }

  private createPositiveEventsLayers(): Layer[] {
    const layers: Layer[] = [];

    const getCategoryColor = (category: string): [number, number, number, number] => {
      switch (category) {
        case 'nature-wildlife':
        case 'humanity-kindness':
          return [34, 197, 94, 200]; // green
        case 'science-health':
        case 'innovation-tech':
        case 'climate-wins':
          return [234, 179, 8, 200]; // gold
        case 'culture-community':
          return [139, 92, 246, 200]; // purple
        default:
          return [34, 197, 94, 200]; // green default
      }
    };

    // Dot layer (tooltip on hover via getTooltip)
    layers.push(new ScatterplotLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'positive-events-layer',
      data: this.positiveEvents,
      getPosition: (d: PositiveGeoEvent) => [d.lon, d.lat],
      getRadius: 12000,
      getFillColor: (d: PositiveGeoEvent) => getCategoryColor(d.category),
      radiusMinPixels: 5,
      radiusMaxPixels: 10,
      pickable: true,
    }));

    // Gentle pulse ring for significant events (count > 8)
    const significantEvents = this.positiveEvents.filter(e => e.count > 8);
    if (significantEvents.length > 0) {
      const pulse = 1.0 + 0.4 * (0.5 + 0.5 * Math.sin((this.pulseTime || Date.now()) / 800));
      layers.push(new ScatterplotLayer({
        parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
        id: 'positive-events-pulse',
        data: significantEvents,
        getPosition: (d: PositiveGeoEvent) => [d.lon, d.lat],
        getRadius: 15000,
        radiusScale: pulse,
        radiusMinPixels: 8,
        radiusMaxPixels: 24,
        stroked: true,
        filled: false,
        getLineColor: (d: PositiveGeoEvent) => getCategoryColor(d.category),
        lineWidthMinPixels: 1.5,
        pickable: false,
        updateTriggers: { radiusScale: this.pulseTime },
      }));
    }

    return layers;
  }

  private createKindnessLayers(): Layer[] {
    const layers: Layer[] = [];
    if (this.kindnessPoints.length === 0) return layers;

    // Dot layer (tooltip on hover via getTooltip)
    layers.push(new ScatterplotLayer<KindnessPoint>({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'kindness-layer',
      data: this.kindnessPoints,
      getPosition: (d: KindnessPoint) => [d.lon, d.lat],
      getRadius: 12000,
      getFillColor: [74, 222, 128, 200] as [number, number, number, number],
      radiusMinPixels: 5,
      radiusMaxPixels: 10,
      pickable: true,
    }));

    // Pulse for real events
    const pulse = 1.0 + 0.4 * (0.5 + 0.5 * Math.sin((this.pulseTime || Date.now()) / 800));
    layers.push(new ScatterplotLayer<KindnessPoint>({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'kindness-pulse',
      data: this.kindnessPoints,
      getPosition: (d: KindnessPoint) => [d.lon, d.lat],
      getRadius: 14000,
      radiusScale: pulse,
      radiusMinPixels: 6,
      radiusMaxPixels: 18,
      stroked: true,
      filled: false,
      getLineColor: [74, 222, 128, 80] as [number, number, number, number],
      lineWidthMinPixels: 1,
      pickable: false,
      updateTriggers: { radiusScale: this.pulseTime },
    }));

    return layers;
  }

  private createHappinessChoroplethLayer(): GeoJsonLayer | null {
    if (!this.countriesGeoJsonData || this.happinessScores.size === 0) return null;
    const scores = this.happinessScores;
    return new GeoJsonLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'happiness-choropleth-layer',
      data: this.countriesGeoJsonData,
      filled: true,
      stroked: true,
      getFillColor: (feature: { properties?: Record<string, unknown> }) => {
        const code = feature.properties?.['ISO3166-1-Alpha-2'] as string | undefined;
        const score = code ? scores.get(code) : undefined;
        if (score == null) return [0, 0, 0, 0] as [number, number, number, number];
        const t = score / 10;
        return [
          Math.round(40 + (1 - t) * 180),
          Math.round(180 + t * 60),
          Math.round(40 + (1 - t) * 100),
          140,
        ] as [number, number, number, number];
      },
      getLineColor: [100, 100, 100, 60] as [number, number, number, number],
      getLineWidth: 1,
      lineWidthMinPixels: 0.5,
      pickable: true,
      updateTriggers: { getFillColor: [scores.size] },
    });
  }

  private static readonly CII_LEVEL_COLORS: Record<string, [number, number, number, number]> = {
    low: [40, 180, 60, 130],
    normal: [220, 200, 50, 135],
    elevated: [240, 140, 30, 145],
    high: [220, 50, 20, 155],
    critical: [140, 10, 0, 170],
  };

  private static readonly CII_LEVEL_HEX: Record<string, string> = {
    critical: '#b91c1c', high: '#dc2626', elevated: '#f59e0b', normal: '#eab308', low: '#22c55e',
  };

  private createCIIChoroplethLayer(): GeoJsonLayer | null {
    if (!this.countriesGeoJsonData || this.ciiScoresMap.size === 0) return null;
    const scores = this.ciiScoresMap;
    const colors = DeckGLMap.CII_LEVEL_COLORS;
    return new GeoJsonLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'cii-choropleth-layer',
      data: this.countriesGeoJsonData,
      filled: true,
      stroked: true,
      getFillColor: (feature: { properties?: Record<string, unknown> }) => {
        const code = feature.properties?.['ISO3166-1-Alpha-2'] as string | undefined;
        const entry = code ? scores.get(code) : undefined;
        return entry ? (colors[entry.level] ?? [0, 0, 0, 0]) : [0, 0, 0, 0];
      },
      getLineColor: [80, 80, 80, 80] as [number, number, number, number],
      getLineWidth: 1,
      lineWidthMinPixels: 0.5,
      pickable: true,
      updateTriggers: { getFillColor: [this.ciiScoresVersion] },
    });
  }

  private createSpeciesRecoveryLayer(): ScatterplotLayer {
    return new ScatterplotLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'species-recovery-layer',
      data: this.speciesRecoveryZones,
      getPosition: (d: (typeof this.speciesRecoveryZones)[number]) => [d.recoveryZone.lon, d.recoveryZone.lat],
      getRadius: 50000,
      radiusMinPixels: 8,
      radiusMaxPixels: 25,
      getFillColor: [74, 222, 128, 120] as [number, number, number, number],
      stroked: true,
      getLineColor: [74, 222, 128, 200] as [number, number, number, number],
      lineWidthMinPixels: 1.5,
      pickable: true,
    });
  }

  private createRenewableInstallationsLayer(): ScatterplotLayer {
    const typeColors: Record<string, [number, number, number, number]> = {
      solar: [255, 200, 50, 200],
      wind: [100, 200, 255, 200],
      hydro: [0, 180, 180, 200],
      geothermal: [255, 150, 80, 200],
    };
    const typeLineColors: Record<string, [number, number, number, number]> = {
      solar: [255, 200, 50, 255],
      wind: [100, 200, 255, 255],
      hydro: [0, 180, 180, 255],
      geothermal: [255, 150, 80, 255],
    };
    return new ScatterplotLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'renewable-installations-layer',
      data: this.renewableInstallations,
      getPosition: (d: RenewableInstallation) => [d.lon, d.lat],
      getRadius: 30000,
      radiusMinPixels: 5,
      radiusMaxPixels: 18,
      getFillColor: (d: RenewableInstallation) => typeColors[d.type] ?? [200, 200, 200, 200] as [number, number, number, number],
      stroked: true,
      getLineColor: (d: RenewableInstallation) => typeLineColors[d.type] ?? [200, 200, 200, 255] as [number, number, number, number],
      lineWidthMinPixels: 1,
      pickable: true,
    });
  }

  private getTooltip(info: PickingInfo): { html: string } | null {
    if (!info.object) return null;

    const rawLayerId = info.layer?.id || '';
    const layerId = rawLayerId.endsWith('-ghost') ? rawLayerId.slice(0, -6) : rawLayerId;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = info.object as any;
    const text = (value: unknown): string => escapeHtml(String(value ?? ''));

    switch (layerId) {
      case 'hotspots-layer': {
        const hsKey = `geo.hotspots.${obj.id}`;
        const hsName = t(hsKey) !== hsKey ? t(hsKey) : text(obj.location || obj.name);
        const hsArea = obj.location ? text(getLocalizedGeoName(obj.location)) : '';
        const hsSubtext = obj.subtext ? `<br/><span style="opacity:.7">${text(obj.subtext)}</span>` : '';
        return { html: `<div class="deckgl-tooltip"><strong>${hsName}</strong>${hsArea && hsArea !== hsName ? `<br/>${hsArea}` : ''}${hsSubtext}</div>` };
      }
      case 'earthquakes-layer':
        return { html: `<div class="deckgl-tooltip"><strong>M${(obj.magnitude || 0).toFixed(1)} ${t('components.deckgl.tooltip.earthquake')}</strong><br/>${text(obj.place)}</div>` };
      case 'military-carriers-layer':
      case 'military-vessels-layer':
      case 'naval-activity-carriers-layer':
      case 'naval-activity-vessels-layer':
        return { html: `<div class="deckgl-tooltip"><strong>${text(obj.name)}</strong><br/>${text(getLocalizedGeoName(obj.operatorCountry))}</div>` };
      case 'military-flights-layer':
      case 'confirmed-military-flights-layer':
      case 'unknown-aircraft-flights-layer':
        return { html: `<div class="deckgl-tooltip"><strong>${text(obj.callsign || obj.registration || t('components.deckgl.tooltip.militaryAircraft'))}</strong><br/>${text(obj.aircraftType)}</div>` };
      case 'military-vessel-clusters-layer':
      case 'naval-activity-vessel-clusters-layer':
        return { html: `<div class="deckgl-tooltip"><strong>${text(obj.name || t('components.deckgl.tooltip.vesselCluster'))}</strong><br/>${obj.vesselCount || 0} ${t('components.deckgl.tooltip.vessels')}<br/>${text(obj.activityType)}</div>` };
      case 'military-flight-clusters-layer':
      case 'confirmed-military-flight-clusters-layer':
      case 'unknown-aircraft-flight-clusters-layer':
        return { html: `<div class="deckgl-tooltip"><strong>${text(obj.name || t('components.deckgl.tooltip.flightCluster'))}</strong><br/>${obj.flightCount || 0} ${t('components.deckgl.tooltip.aircraft')}<br/>${text(obj.activityType)}</div>` };
      case 'protests-layer':
        return { html: `<div class="deckgl-tooltip"><strong>${text(obj.title)}</strong><br/>${text(getLocalizedGeoName(obj.country))}</div>` };
      case 'protest-clusters-layer':
        if (obj.count === 1) {
          const item = obj.items?.[0];
          return { html: `<div class="deckgl-tooltip"><strong>${text(item?.title || t('components.deckgl.tooltip.protest'))}</strong><br/>${text(item?.city || item?.country || '')}</div>` };
        }
        return { html: `<div class="deckgl-tooltip"><strong>${t('components.deckgl.tooltip.protestsCount', { count: String(obj.count) })}</strong><br/>${text(getLocalizedGeoName(obj.country))}</div>` };
      case 'tech-hq-clusters-layer':
        if (obj.count === 1) {
          const hq = obj.items?.[0];
          return { html: `<div class="deckgl-tooltip"><strong>${text(hq?.company || '')}</strong><br/>${text(hq?.city || '')}</div>` };
        }
        return { html: `<div class="deckgl-tooltip"><strong>${t('components.deckgl.tooltip.techHQsCount', { count: String(obj.count) })}</strong><br/>${text(obj.city)}</div>` };
      case 'tech-event-clusters-layer':
        if (obj.count === 1) {
          const ev = obj.items?.[0];
          return { html: `<div class="deckgl-tooltip"><strong>${text(ev?.title || '')}</strong><br/>${text(ev?.location || '')}</div>` };
        }
        return { html: `<div class="deckgl-tooltip"><strong>${t('components.deckgl.tooltip.techEventsCount', { count: String(obj.count) })}</strong><br/>${text(obj.location)}</div>` };
      case 'datacenter-clusters-layer':
        if (obj.count === 1) {
          const dc = obj.items?.[0];
          return { html: `<div class="deckgl-tooltip"><strong>${text(dc?.name || '')}</strong><br/>${text(dc?.owner || '')}</div>` };
        }
        return { html: `<div class="deckgl-tooltip"><strong>${t('components.deckgl.tooltip.dataCentersCount', { count: String(obj.count) })}</strong><br/>${text(getLocalizedGeoName(obj.country))}</div>` };
      case 'bases-layer':
        return { html: `<div class="deckgl-tooltip"><strong>${text(obj.name)}</strong><br/>${text(getLocalizedGeoName(obj.country))}${obj.kind ? ` · ${text(obj.kind)}` : ''}</div>` };
      case 'bases-cluster-layer':
        return { html: `<div class="deckgl-tooltip"><strong>${t('components.deckgl.tooltip.basesCount', { count: String(obj.count) })}</strong></div>` };
      case 'nuclear-layer':
        return { html: `<div class="deckgl-tooltip"><strong>${text(obj.name)}</strong><br/>${text(obj.type)}</div>` };
      case 'datacenters-layer':
        return { html: `<div class="deckgl-tooltip"><strong>${text(obj.name)}</strong><br/>${text(obj.owner)}</div>` };
      case 'cables-layer':
        return { html: `<div class="deckgl-tooltip"><strong>${text(obj.name)}</strong><br/>${t('components.deckgl.tooltip.underseaCable')}</div>` };
      case 'pipelines-layer': {
        const pipelineType = String(obj.type || '').toLowerCase();
        const pipelineTypeLabel = pipelineType === 'oil'
          ? t('popups.pipeline.types.oil')
          : pipelineType === 'gas'
            ? t('popups.pipeline.types.gas')
            : pipelineType === 'products'
              ? t('popups.pipeline.types.products')
              : `${text(obj.type)} ${t('components.deckgl.tooltip.pipeline')}`;
        return { html: `<div class="deckgl-tooltip"><strong>${text(obj.name)}</strong><br/>${pipelineTypeLabel}</div>` };
      }
      case 'conflict-zones-layer': {
        const props = obj.properties || obj;
        const czKey = `geo.conflictZones.${props.id}`;
        const czName = t(czKey) !== czKey ? t(czKey) : text(props.name);
        return { html: `<div class="deckgl-tooltip"><strong>${czName}</strong><br/>${t('components.deckgl.tooltip.conflictZone')}</div>` };
      }

      case 'natural-events-layer':
        return { html: `<div class="deckgl-tooltip"><strong>${text(obj.title)}</strong><br/>${text(obj.category || t('components.deckgl.tooltip.naturalEvent'))}</div>` };
      case 'ais-density-layer':
        return { html: `<div class="deckgl-tooltip"><strong>${t('components.deckgl.layers.shipTraffic')}</strong><br/>${t('popups.intensity')}: ${text(obj.intensity)}</div>` };
      case 'waterways-layer':
        return { html: `<div class="deckgl-tooltip"><strong>${text(obj.name)}</strong><br/>${t('components.deckgl.layers.strategicWaterways')}</div>` };
      case 'economic-centers-layer':
        return { html: `<div class="deckgl-tooltip"><strong>${text(obj.name)}</strong><br/>${text(getLocalizedGeoName(obj.country))}</div>` };
      case 'stock-exchanges-layer':
        return { html: `<div class="deckgl-tooltip"><strong>${text(obj.shortName)}</strong><br/>${text(obj.city)}, ${text(getLocalizedGeoName(obj.country))}</div>` };
      case 'financial-centers-layer':
        return { html: `<div class="deckgl-tooltip"><strong>${text(obj.name)}</strong><br/>${text(obj.type)} ${t('components.deckgl.tooltip.financialCenter')}</div>` };
      case 'central-banks-layer':
        return { html: `<div class="deckgl-tooltip"><strong>${text(obj.shortName)}</strong><br/>${text(obj.city)}, ${text(getLocalizedGeoName(obj.country))}</div>` };
      case 'commodity-hubs-layer':
        return { html: `<div class="deckgl-tooltip"><strong>${text(obj.name)}</strong><br/>${text(obj.type)} · ${text(obj.city)}</div>` };
      case 'startup-hubs-layer':
        return { html: `<div class="deckgl-tooltip"><strong>${text(obj.city)}</strong><br/>${text(getLocalizedGeoName(obj.country))}</div>` };
      case 'tech-hqs-layer':
        return { html: `<div class="deckgl-tooltip"><strong>${text(obj.company)}</strong><br/>${text(obj.city)}</div>` };
      case 'accelerators-layer':
        return { html: `<div class="deckgl-tooltip"><strong>${text(obj.name)}</strong><br/>${text(obj.city)}</div>` };
      case 'cloud-regions-layer':
        return { html: `<div class="deckgl-tooltip"><strong>${text(obj.provider)}</strong><br/>${text(obj.region)}</div>` };
      case 'tech-events-layer':
        return { html: `<div class="deckgl-tooltip"><strong>${text(obj.title)}</strong><br/>${text(obj.location)}</div>` };
      case 'irradiators-layer':
        return { html: `<div class="deckgl-tooltip"><strong>${text(obj.name)}</strong><br/>${text(obj.type || t('components.deckgl.layers.gammaIrradiators'))}</div>` };
      case 'spaceports-layer':
        return { html: `<div class="deckgl-tooltip"><strong>${text(obj.name)}</strong><br/>${text(obj.country || t('components.deckgl.layers.spaceports'))}</div>` };
      case 'ports-layer': {
        const typeIcon = obj.type === 'naval' ? svgIcon('anchor', '#6496ff', 12) : obj.type === 'oil' || obj.type === 'lng' ? svgIcon('oil', '#ff8c00', 12) : svgIcon('factory', '#00c8ff', 12);
        return { html: `<div class="deckgl-tooltip"><strong>${typeIcon} ${text(obj.name)}</strong><br/>${text(obj.type || t('components.deckgl.tooltip.port'))} - ${text(getLocalizedGeoName(obj.country))}</div>` };
      }
      case 'flight-delays-layer':
        return { html: `<div class="deckgl-tooltip"><strong>${text(obj.name)} (${text(obj.iata)})</strong><br/>${text(obj.severity)}: ${text(obj.reason)}</div>` };
      case 'aircraft-positions-layer': {
        const acCallsign = text(obj.callsign || obj.icao24);
        const acAlt = obj.onGround ? t('popups.aircraft.ground') : obj.altitudeFt > 100
          ? `FL${Math.round(obj.altitudeFt / 100)} (${obj.altitudeFt.toLocaleString()} ft)`
          : `${obj.altitudeFt.toLocaleString()} ft`;
        const acSpd = obj.onGround ? '' : ` · ${Math.round(obj.groundSpeedKts)} kts`;
        const acHdg = obj.onGround ? '' : ` · ${Math.round(obj.trackDeg)}°`;
        return { html: `<div class="deckgl-tooltip"><strong>&#9992; ${acCallsign}</strong><br/>${acAlt}${acSpd}${acHdg}</div>` };
      }
      case 'apt-groups-layer':
        return { html: `<div class="deckgl-tooltip"><strong>${text(obj.name)}</strong><br/>${text(obj.aka)}<br/>${t('popups.sponsor')}: ${text(obj.sponsor)}</div>` };
      case 'minerals-layer':
        return { html: `<div class="deckgl-tooltip"><strong>${text(obj.name)}</strong><br/>${text(obj.mineral)} - ${text(getLocalizedGeoName(obj.country))}<br/>${text(obj.operator)}</div>` };
      case 'ais-disruptions-layer':
        return { html: `<div class="deckgl-tooltip"><strong>AIS ${text(obj.type || t('components.deckgl.tooltip.disruption'))}</strong><br/>${text(obj.severity)} ${t('popups.severity')}<br/>${text(obj.description)}</div>` };
      case 'gps-jamming-layer':
        return { html: `<div class="deckgl-tooltip"><strong>${t('popups.gpsJamming.title')}</strong><br/>${text(obj.level)} ${t('popups.gpsJamming.interference').toLowerCase()} (${obj.pct}%)<br/>H3: ${text(obj.h3)}</div>` };
      case 'cable-advisories-layer': {
        const cableName = UNDERSEA_CABLES.find(c => c.id === obj.cableId)?.name || obj.cableId;
        return { html: `<div class="deckgl-tooltip"><strong>${text(cableName)}</strong><br/>${text(obj.severity || t('components.deckgl.tooltip.advisory'))}<br/>${text(obj.description)}</div>` };
      }
      case 'repair-ships-layer':
        return { html: `<div class="deckgl-tooltip"><strong>${text(obj.name || t('components.deckgl.tooltip.repairShip'))}</strong><br/>${text(obj.status)}</div>` };
      case 'weather-layer': {
        const areaDesc = typeof obj.areaDesc === 'string' ? obj.areaDesc : '';
        const area = areaDesc ? `<br/><small>${text(areaDesc.slice(0, 50))}${areaDesc.length > 50 ? '...' : ''}</small>` : '';
        return { html: `<div class="deckgl-tooltip"><strong>${text(obj.event || t('components.deckgl.layers.weatherAlerts'))}</strong><br/>${text(obj.severity)}${area}</div>` };
      }
      case 'outages-layer':
        return { html: `<div class="deckgl-tooltip"><strong>${text(obj.asn || t('components.deckgl.tooltip.internetOutage'))}</strong><br/>${text(getLocalizedGeoName(obj.country))}</div>` };
      case 'cyber-threats-layer':
        return { html: `<div class="deckgl-tooltip"><strong>${t('popups.cyberThreat.title')}</strong><br/>${text(obj.severity || t('components.deckgl.tooltip.medium'))} · ${text(obj.country || t('popups.unknown'))}</div>` };
      case 'iran-events-layer':
        return { html: `<div class="deckgl-tooltip"><strong>${t('components.deckgl.layers.iranAttacks')}: ${text(obj.category || '')}</strong><br/>${text((obj.title || '').slice(0, 80))}</div>` };
      case 'news-locations-layer':
        return { html: `<div class="deckgl-tooltip"><strong>${svgIcon('news', '#aaaaaa', 12)} ${t('components.deckgl.tooltip.news')}</strong><br/>${text(obj.title?.slice(0, 80) || '')}</div>` };
      case 'positive-events-layer': {
        const catLabel = obj.category ? obj.category.replace(/-/g, ' & ') : t('components.deckgl.tooltip.positiveEvent');
        const countInfo = obj.count > 1 ? `<br/><span style="opacity:.7">${obj.count} ${t('components.deckgl.tooltip.sourcesReporting')}</span>` : '';
        return { html: `<div class="deckgl-tooltip"><strong>${text(obj.name)}</strong><br/><span style="text-transform:capitalize">${text(catLabel)}</span>${countInfo}</div>` };
      }
      case 'kindness-layer':
        return { html: `<div class="deckgl-tooltip"><strong>${text(obj.name)}</strong></div>` };
      case 'happiness-choropleth-layer': {
        const hcName = getLocalizedGeoName(obj.properties?.name ?? '');
        const hcCode = obj.properties?.['ISO3166-1-Alpha-2'];
        const hcScore = hcCode ? this.happinessScores.get(hcCode as string) : undefined;
        const hcScoreStr = hcScore != null ? hcScore.toFixed(1) : t('components.deckgl.tooltip.noData');
        return { html: `<div class="deckgl-tooltip"><strong>${text(hcName)}</strong><br/>${t('components.deckgl.tooltip.happiness')}: ${hcScoreStr}/10${hcScore != null ? `<br/><span style="opacity:.7">${text(this.happinessSource)} (${this.happinessYear})</span>` : ''}</div>` };
      }
      case 'cii-choropleth-layer': {
        const ciiName = getLocalizedGeoName(obj.properties?.name ?? '');
        const ciiCode = obj.properties?.['ISO3166-1-Alpha-2'];
        const ciiEntry = ciiCode ? this.ciiScoresMap.get(ciiCode as string) : undefined;
        if (!ciiEntry) return { html: `<div class="deckgl-tooltip"><strong>${text(ciiName)}</strong><br/><span style="opacity:.7">${t('components.deckgl.tooltip.noData')}</span></div>` };
        const levelColor = DeckGLMap.CII_LEVEL_HEX[ciiEntry.level] ?? '#888';
        return { html: `<div class="deckgl-tooltip"><strong>${text(ciiName)}</strong><br/>${t('components.deckgl.tooltip.cii')}: <span style="color:${levelColor};font-weight:600">${ciiEntry.score}/100</span><br/><span style="text-transform:capitalize;opacity:.7">${text(ciiEntry.level)}</span></div>` };
      }
      case 'species-recovery-layer': {
        return { html: `<div class="deckgl-tooltip"><strong>${text(obj.commonName)}</strong><br/>${text(obj.recoveryZone?.name ?? obj.region)}<br/><span style="opacity:.7">${t('components.deckgl.tooltip.status')}: ${text(obj.recoveryStatus)}</span></div>` };
      }
      case 'renewable-installations-layer': {
        const riTypeLabel = obj.type ? String(obj.type).charAt(0).toUpperCase() + String(obj.type).slice(1) : t('components.deckgl.tooltip.renewable');
        return { html: `<div class="deckgl-tooltip"><strong>${text(obj.name)}</strong><br/>${riTypeLabel} &middot; ${obj.capacityMW?.toLocaleString() ?? '?'} MW<br/><span style="opacity:.7">${text(getLocalizedGeoName(obj.country))} &middot; ${obj.year}</span></div>` };
      }
      case 'gulf-investments-layer': {
        const inv = obj as GulfInvestment;
        const flag = inv.investingCountry === 'SA' ? '🇸🇦' : '🇦🇪';
        const usd = inv.investmentUSD != null
          ? (inv.investmentUSD >= 1000 ? `$${(inv.investmentUSD / 1000).toFixed(1)}B` : `$${inv.investmentUSD}M`)
          : t('components.deckgl.tooltip.undisclosed');
        const stake = inv.stakePercent != null ? `<br/>${text(String(inv.stakePercent))}% ${t('components.deckgl.tooltip.stake')}` : '';
        return {
          html: `<div class="deckgl-tooltip">
            <strong>${flag} ${text(inv.assetName)}</strong><br/>
            <em>${text(inv.investingEntity)}</em><br/>
            ${text(getLocalizedGeoName(inv.targetCountry))} · ${text(inv.sector)}<br/>
            <strong>${usd}</strong>${stake}<br/>
            <span style="text-transform:capitalize">${text(inv.status)}</span>
          </div>`,
        };
      }
      default:
        return null;
    }
  }

  private handleClick(info: PickingInfo): void {
    if (!info.object) {
      // Empty map click → country detection
      if (info.coordinate && this.onCountryClick) {
        const [lon, lat] = info.coordinate as [number, number];
        const country = this.resolveCountryFromCoordinate(lon, lat);
        this.onCountryClick({
          lat,
          lon,
          ...(country ? { code: country.code, name: country.name } : {}),
        });
      }
      return;
    }

    const rawClickLayerId = info.layer?.id || '';
    const layerId = rawClickLayerId.endsWith('-ghost') ? rawClickLayerId.slice(0, -6) : rawClickLayerId;

    // Hotspots show popup with related news
    if (layerId === 'hotspots-layer') {
      const hotspot = info.object as Hotspot;
      const relatedNews = this.getRelatedNews(hotspot);
      this.popup.show({
        type: 'hotspot',
        data: hotspot,
        relatedNews,
        x: info.x,
        y: info.y,
      });
      this.popup.loadHotspotGdeltContext(hotspot);
      this.onHotspotClick?.(hotspot);
      return;
    }

    // Handle cluster layers with single/multi logic
    if (layerId === 'protest-clusters-layer') {
      const cluster = info.object as MapProtestCluster;
      if (cluster.items.length === 0 && cluster._clusterId != null && this.protestSC) {
        try {
          const leaves = this.protestSC.getLeaves(cluster._clusterId, DeckGLMap.MAX_CLUSTER_LEAVES);
          cluster.items = leaves.map((l: any) => this.protestSuperclusterSource[l.properties.index]).filter((x: any): x is SocialUnrestEvent => !!x);
          cluster.sampled = cluster.items.length < cluster.count;
        } catch (e) {
          console.warn('[DeckGLMap] stale protest cluster', cluster._clusterId, e);
          return;
        }
      }
      if (cluster.count === 1 && cluster.items[0]) {
        this.popup.show({ type: 'protest', data: cluster.items[0], x: info.x, y: info.y });
      } else {
        this.popup.show({
          type: 'protestCluster',
          data: {
            items: cluster.items,
            country: cluster.country,
            count: cluster.count,
            riotCount: cluster.riotCount,
            highSeverityCount: cluster.highSeverityCount,
            verifiedCount: cluster.verifiedCount,
            totalFatalities: cluster.totalFatalities,
            sampled: cluster.sampled,
          },
          x: info.x,
          y: info.y,
        });
      }
      return;
    }
    if (layerId === 'tech-hq-clusters-layer') {
      const cluster = info.object as MapTechHQCluster;
      if (cluster.items.length === 0 && cluster._clusterId != null && this.techHQSC) {
        try {
          const leaves = this.techHQSC.getLeaves(cluster._clusterId, DeckGLMap.MAX_CLUSTER_LEAVES);
          cluster.items = leaves.map((l: any) => TECH_HQS[l.properties.index]).filter(Boolean) as typeof TECH_HQS;
          cluster.sampled = cluster.items.length < cluster.count;
        } catch (e) {
          console.warn('[DeckGLMap] stale techHQ cluster', cluster._clusterId, e);
          return;
        }
      }
      if (cluster.count === 1 && cluster.items[0]) {
        this.popup.show({ type: 'techHQ', data: cluster.items[0], x: info.x, y: info.y });
      } else {
        this.popup.show({
          type: 'techHQCluster',
          data: {
            items: cluster.items,
            city: cluster.city,
            country: cluster.country,
            count: cluster.count,
            faangCount: cluster.faangCount,
            unicornCount: cluster.unicornCount,
            publicCount: cluster.publicCount,
            sampled: cluster.sampled,
          },
          x: info.x,
          y: info.y,
        });
      }
      return;
    }
    if (layerId === 'tech-event-clusters-layer') {
      const cluster = info.object as MapTechEventCluster;
      if (cluster.items.length === 0 && cluster._clusterId != null && this.techEventSC) {
        try {
          const leaves = this.techEventSC.getLeaves(cluster._clusterId, DeckGLMap.MAX_CLUSTER_LEAVES);
          cluster.items = leaves.map((l: any) => this.techEvents[l.properties.index]).filter((x: any): x is TechEventMarker => !!x);
          cluster.sampled = cluster.items.length < cluster.count;
        } catch (e) {
          console.warn('[DeckGLMap] stale techEvent cluster', cluster._clusterId, e);
          return;
        }
      }
      if (cluster.count === 1 && cluster.items[0]) {
        this.popup.show({ type: 'techEvent', data: cluster.items[0], x: info.x, y: info.y });
      } else {
        this.popup.show({
          type: 'techEventCluster',
          data: {
            items: cluster.items,
            location: cluster.location,
            country: cluster.country,
            count: cluster.count,
            soonCount: cluster.soonCount,
            sampled: cluster.sampled,
          },
          x: info.x,
          y: info.y,
        });
      }
      return;
    }
    if (layerId === 'datacenter-clusters-layer') {
      const cluster = info.object as MapDatacenterCluster;
      if (cluster.items.length === 0 && cluster._clusterId != null && this.datacenterSC) {
        try {
          const leaves = this.datacenterSC.getLeaves(cluster._clusterId, DeckGLMap.MAX_CLUSTER_LEAVES);
          cluster.items = leaves.map((l: any) => this.datacenterSCSource[l.properties.index]).filter((x: any): x is AIDataCenter => !!x);
          cluster.sampled = cluster.items.length < cluster.count;
        } catch (e) {
          console.warn('[DeckGLMap] stale datacenter cluster', cluster._clusterId, e);
          return;
        }
      }
      if (cluster.count === 1 && cluster.items[0]) {
        this.popup.show({ type: 'datacenter', data: cluster.items[0], x: info.x, y: info.y });
      } else {
        this.popup.show({
          type: 'datacenterCluster',
          data: {
            items: cluster.items,
            region: cluster.region || cluster.country,
            country: cluster.country,
            count: cluster.count,
            totalChips: cluster.totalChips,
            totalPowerMW: cluster.totalPowerMW,
            existingCount: cluster.existingCount,
            plannedCount: cluster.plannedCount,
            sampled: cluster.sampled,
          },
          x: info.x,
          y: info.y,
        });
      }
      return;
    }

    // Map layer IDs to popup types
    const layerToPopupType: Record<string, PopupType> = {
      'conflict-zones-layer': 'conflict',

      'bases-layer': 'base',
      'nuclear-layer': 'nuclear',
      'irradiators-layer': 'irradiator',
      'datacenters-layer': 'datacenter',
      'cables-layer': 'cable',
      'pipelines-layer': 'pipeline',
      'earthquakes-layer': 'earthquake',
      'weather-layer': 'weather',
      'outages-layer': 'outage',
      'cyber-threats-layer': 'cyberThreat',
      'iran-events-layer': 'iranEvent',
      'news-locations-layer': 'newsLocation',
      'protests-layer': 'protest',
      'military-flights-layer': 'militaryFlight',
      'confirmed-military-flights-layer': 'militaryFlight',
      'unknown-aircraft-flights-layer': 'militaryFlight',
      'military-carriers-layer': 'militaryVessel',
      'military-vessels-layer': 'militaryVessel',
      'naval-activity-carriers-layer': 'militaryVessel',
      'naval-activity-vessels-layer': 'militaryVessel',
      'military-vessel-clusters-layer': 'militaryVesselCluster',
      'naval-activity-vessel-clusters-layer': 'militaryVesselCluster',
      'naval-overlay-layer': 'navalCluster',
      'naval-seeded-vessels-layer': 'militaryVessel',
      'naval-csg-layer': 'navalStrikeGroup',
      'naval-snapshot-clusters-layer': 'navalCluster',
      'military-flight-clusters-layer': 'militaryFlightCluster',
      'confirmed-military-flight-clusters-layer': 'militaryFlightCluster',
      'unknown-aircraft-flight-clusters-layer': 'militaryFlightCluster',
      'natural-events-layer': 'natEvent',
      'waterways-layer': 'waterway',
      'economic-centers-layer': 'economic',
      'stock-exchanges-layer': 'stockExchange',
      'financial-centers-layer': 'financialCenter',
      'central-banks-layer': 'centralBank',
      'commodity-hubs-layer': 'commodityHub',
      'spaceports-layer': 'spaceport',
      'ports-layer': 'port',
      'flight-delays-layer': 'flight',
      'aircraft-positions-layer': 'aircraft',
      'unknown-aircraft-positions-layer': 'aircraft',
      'startup-hubs-layer': 'startupHub',
      'tech-hqs-layer': 'techHQ',
      'accelerators-layer': 'accelerator',
      'cloud-regions-layer': 'cloudRegion',
      'tech-events-layer': 'techEvent',
      'apt-groups-layer': 'apt',
      'minerals-layer': 'mineral',
      'ais-disruptions-layer': 'ais',
      'gps-jamming-layer': 'gpsJamming',
      'cable-advisories-layer': 'cable-advisory',
      'repair-ships-layer': 'repair-ship',
      'ucdp-events-layer': 'ucdpEvent',
    };

    const popupType = layerToPopupType[layerId];
    if (!popupType) return;

    // For GeoJSON layers, the data is in properties
    let data = info.object;
    if (layerId === 'conflict-zones-layer' && info.object.properties) {
      // Find the full conflict zone data from config
      const conflictId = info.object.properties.id;
      const fullConflict = CONFLICT_ZONES.find(c => c.id === conflictId);
      if (fullConflict) data = fullConflict;
    }

    // Enrich iran events with related events from same location
    if (popupType === 'iranEvent' && data.locationName) {
      const clickedId = data.id;
      const normalizedLoc = data.locationName.trim().toLowerCase();
      const related = this.iranEvents
        .filter(e => e.id !== clickedId && e.locationName && e.locationName.trim().toLowerCase() === normalizedLoc)
        .sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0))
        .slice(0, 5);
      data = { ...data, relatedEvents: related };
    }

    // Enrich civilian aircraft popups for the flight-delays aircraft stream only.
    if (popupType === 'aircraft' && layerId === 'aircraft-positions-layer') {
      data = this.enrichFlightLayerAircraftPopupData(data as PositionSample);
    }

    // Get click coordinates relative to container
    const x = info.x ?? 0;
    const y = info.y ?? 0;

    this.popup.show({
      type: popupType,
      data: data,
      x,
      y,
    });
  }

  private enrichFlightLayerAircraftPopupData(position: PositionSample): EnrichedAircraftPopupData {
    const nearestDelayAirport = this.findNearestDelayAirport(position);
    const inferredCountry = nearestDelayAirport?.country || getCountryAtCoordinates(position.lat, position.lon)?.name;
    const speedMach = !position.onGround && position.groundSpeedKts >= 250
      ? Number((position.groundSpeedKts / 661).toFixed(2))
      : null;

    return {
      ...position,
      popupContext: 'flight-delays-aircraft',
      phase: this.deriveCivilianFlightPhase(position),
      verticalTrend: position.verticalRate > 0.5
        ? 'climbing'
        : position.verticalRate < -0.5
          ? 'descending'
          : 'level',
      speedKmh: Math.round(position.groundSpeedKts * 1.852),
      speedMach,
      ageSeconds: Math.max(0, Math.round((Date.now() - position.observedAt.getTime()) / 1000)),
      inferredCountry: inferredCountry || undefined,
      nearestDelayAirport,
    };
  }

  private deriveCivilianFlightPhase(position: PositionSample): EnrichedAircraftPopupData['phase'] {
    if (position.onGround || position.altitudeFt < 100) return 'ground';
    if (position.altitudeFt < 3000) return Math.abs(position.verticalRate) > 0.8 ? 'climb' : 'taxi';
    if (position.verticalRate > 1.5) return 'climb';
    if (position.verticalRate < -1.5) return position.altitudeFt < 12000 ? 'approach' : 'descent';
    return 'cruise';
  }

  private findNearestDelayAirport(position: PositionSample): EnrichedAircraftPopupData['nearestDelayAirport'] {
    if (!this.flightDelays.length) return null;

    let nearest: AirportDelayAlert | null = null;
    let minDistanceKm = Number.POSITIVE_INFINITY;

    for (const delay of this.flightDelays) {
      if (delay.lat == null || delay.lon == null) continue;
      const distanceKm = haversineKm(position.lat, position.lon, delay.lat, delay.lon);
      if (distanceKm < minDistanceKm) {
        minDistanceKm = distanceKm;
        nearest = delay;
      }
    }

    if (!nearest || minDistanceKm > 350) return null;

    return {
      iata: nearest.iata,
      name: nearest.name,
      city: nearest.city,
      country: nearest.country,
      severity: nearest.severity,
      delayType: nearest.delayType,
      avgDelayMinutes: nearest.avgDelayMinutes,
      distanceKm: minDistanceKm,
    };
  }

  // Utility methods
  private hexToRgba(hex: string, alpha: number): [number, number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result && result[1] && result[2] && result[3]) {
      return [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
        alpha,
      ];
    }
    return [100, 100, 100, alpha];
  }

  // UI Creation methods
  private createControls(): void {
    const controls = document.createElement('div');
    controls.className = 'map-controls deckgl-controls';
    controls.innerHTML = `
      <div class="zoom-controls">
        <button class="map-btn zoom-in" title="${t('components.deckgl.zoomIn')}">+</button>
        <button class="map-btn zoom-out" title="${t('components.deckgl.zoomOut')}">-</button>
        <button class="map-btn zoom-reset" title="${t('components.deckgl.resetView')}">&#8962;</button>
      </div>
      <div class="view-selector">
        <select class="view-select">
          <option value="global">${t('components.deckgl.views.global')}</option>
          <option value="america">${t('components.deckgl.views.americas')}</option>
          <option value="mena">${t('components.deckgl.views.mena')}</option>
          <option value="eu">${t('components.deckgl.views.europe')}</option>
          <option value="asia">${t('components.deckgl.views.asia')}</option>
          <option value="latam">${t('components.deckgl.views.latam')}</option>
          <option value="africa">${t('components.deckgl.views.africa')}</option>
          <option value="oceania">${t('components.deckgl.views.oceania')}</option>
        </select>
      </div>
    `;

    this.container.appendChild(controls);

    // Bind events - use event delegation for reliability
    controls.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('zoom-in')) this.zoomIn();
      else if (target.classList.contains('zoom-out')) this.zoomOut();
      else if (target.classList.contains('zoom-reset')) this.resetView();
    });

    const viewSelect = controls.querySelector('.view-select') as HTMLSelectElement;
    viewSelect.value = this.state.view;
    viewSelect.addEventListener('change', () => {
      this.setView(viewSelect.value as DeckMapView);
    });
  }

  private createTimeSlider(): void {
    const slider = document.createElement('div');
    slider.className = 'time-slider deckgl-time-slider';
    slider.innerHTML = `
      <div class="time-options">
        <button class="time-btn ${this.state.timeRange === '1h' ? 'active' : ''}" data-range="1h">1h</button>
        <button class="time-btn ${this.state.timeRange === '6h' ? 'active' : ''}" data-range="6h">6h</button>
        <button class="time-btn ${this.state.timeRange === '24h' ? 'active' : ''}" data-range="24h">24h</button>
        <button class="time-btn ${this.state.timeRange === '48h' ? 'active' : ''}" data-range="48h">48h</button>
        <button class="time-btn ${this.state.timeRange === '7d' ? 'active' : ''}" data-range="7d">7d</button>
        <button class="time-btn ${this.state.timeRange === 'all' ? 'active' : ''}" data-range="all">${t('components.deckgl.timeAll')}</button>
      </div>
    `;

    this.container.appendChild(slider);

    slider.querySelectorAll('.time-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const range = (btn as HTMLElement).dataset.range as TimeRange;
        this.setTimeRange(range);
      });
    });
  }

  private updateTimeSliderButtons(): void {
    const slider = this.container.querySelector('.deckgl-time-slider');
    if (!slider) return;
    slider.querySelectorAll('.time-btn').forEach((btn) => {
      const range = (btn as HTMLElement).dataset.range as TimeRange | undefined;
      btn.classList.toggle('active', range === this.state.timeRange);
    });
  }

  private createLayerToggles(): void {
    const toggles = document.createElement('div');
    toggles.className = 'layer-toggles deckgl-layer-toggles';

    const layerDefs = getLayersForVariant((SITE_VARIANT || 'full') as MapVariant, 'flat');
    const layerConfig = layerDefs.map(def => ({
      key: def.key,
      label: resolveLayerLabel(def, t),
      icon: def.icon,
    }));

    toggles.innerHTML = `
      <div class="toggle-header">
        <span>${t('components.deckgl.layersTitle')}</span>
        <button class="layer-help-btn" title="${t('components.deckgl.layerGuide')}">?</button>
        <button class="toggle-collapse">&#9660;</button>
      </div>
      <div class="toggle-list" style="max-height: 32vh; overflow-y: auto; scrollbar-width: thin;">
        ${SHOW_NAVAL_DEV_OVERLAY ? `
          <label class="dev-overlay-toggle" title="Development only">
            <input type="checkbox" ${this.showNavalDevOverlay ? 'checked' : ''}>
            <span class="toggle-icon">DEV</span>
            <span class="toggle-label">Naval Overlay (Dev)</span>
          </label>
        ` : ''}
        ${layerConfig.map(({ key, label, icon }) => `
          <label class="layer-toggle" data-layer="${key}">
            <input type="checkbox" ${this.state.layers[key as keyof MapLayers] ? 'checked' : ''}>
            <span class="toggle-icon">${svgIcon(icon, '#8899aa', 14)}</span>
            <span class="toggle-label">${label}</span>
          </label>
        `).join('')}
      </div>
    `;

    const copyrightYear = new Date().getFullYear();
    const authorBadge = document.createElement('div');
    authorBadge.className = 'map-author-badge';
    authorBadge.textContent = `© Marsd ${copyrightYear}`;
    toggles.appendChild(authorBadge);

    this.container.appendChild(toggles);

    // Bind toggle events
    toggles.querySelectorAll('.layer-toggle input').forEach(input => {
      input.addEventListener('change', () => {
        const layer = (input as HTMLInputElement).closest('.layer-toggle')?.getAttribute('data-layer') as keyof MapLayers;
        if (layer) {
          this.state.layers[layer] = (input as HTMLInputElement).checked;
          if (layer === 'flights' || layer === 'militaryAircraftUnknown') {
            this.manageAircraftTimer(this.state.layers.flights || this.state.layers.militaryAircraftUnknown);
          }
          this.render();
          this.onLayerChange?.(layer, (input as HTMLInputElement).checked, 'user');
          if (layer === 'ciiChoropleth') {
            const ciiLeg = this.container.querySelector('#ciiChoroplethLegend') as HTMLElement | null;
            if (ciiLeg) ciiLeg.style.display = (input as HTMLInputElement).checked ? 'block' : 'none';
          }
          this.enforceLayerLimit();
        }
      });
    });
    this.enforceLayerLimit();

    const devOverlayInput = toggles.querySelector('.dev-overlay-toggle input') as HTMLInputElement | null;
    devOverlayInput?.addEventListener('change', () => {
      this.showNavalDevOverlay = devOverlayInput.checked;
      this.markDirty('navalActivity');
      this.updateNavalInfoOverlay();
      this.render();
    });

    // Help button
    const helpBtn = toggles.querySelector('.layer-help-btn');
    helpBtn?.addEventListener('click', () => this.showLayerHelp());

    // Collapse toggle
    const collapseBtn = toggles.querySelector('.toggle-collapse');
    const toggleList = toggles.querySelector('.toggle-list');

    // Manual scroll: intercept wheel, prevent map zoom, scroll the list ourselves
    if (toggleList) {
      toggles.addEventListener('wheel', (e) => {
        e.stopPropagation();
        e.preventDefault();
        toggleList.scrollTop += e.deltaY;
      }, { passive: false });
      toggles.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: false });
    }
    collapseBtn?.addEventListener('click', () => {
      toggleList?.classList.toggle('collapsed');
      if (collapseBtn) collapseBtn.innerHTML = toggleList?.classList.contains('collapsed') ? '&#9654;' : '&#9660;';
    });
  }

  /** Show layer help popup explaining each layer */
  private showLayerHelp(): void {
    const existing = this.container.querySelector('.layer-help-popup');
    if (existing) {
      existing.remove();
      return;
    }

    const popup = document.createElement('div');
    popup.className = 'layer-help-popup';

    const label = (layerKey: string): string => t(`components.deckgl.layers.${layerKey}`).toUpperCase();
    const staticLabel = (labelKey: string): string => t(`components.deckgl.layerHelp.labels.${labelKey}`).toUpperCase();
    const helpItem = (layerLabel: string, descriptionKey: string): string =>
      `<div class="layer-help-item"><span>${layerLabel}</span> ${t(`components.deckgl.layerHelp.descriptions.${descriptionKey}`)}</div>`;
    const helpSection = (titleKey: string, items: string[], noteKey?: string): string => `
      <div class="layer-help-section">
        <div class="layer-help-title">${t(`components.deckgl.layerHelp.sections.${titleKey}`)}</div>
        ${items.join('')}
        ${noteKey ? `<div class="layer-help-note">${t(`components.deckgl.layerHelp.notes.${noteKey}`)}</div>` : ''}
      </div>
    `;
    const helpHeader = `
      <div class="layer-help-header">
        <span>${t('components.deckgl.layerHelp.title')}</span>
        <button class="layer-help-close" aria-label="Close">×</button>
      </div>
    `;

    const techHelpContent = `
      ${helpHeader}
      <div class="layer-help-content">
        ${helpSection('techEcosystem', [
      helpItem(label('startupHubs'), 'techStartupHubs'),
      helpItem(label('cloudRegions'), 'techCloudRegions'),
      helpItem(label('techHQs'), 'techHQs'),
      helpItem(label('accelerators'), 'techAccelerators'),
      helpItem(label('techEvents'), 'techEvents'),
    ])}
        ${helpSection('infrastructure', [
      helpItem(label('underseaCables'), 'infraCables'),
      helpItem(label('aiDataCenters'), 'infraDatacenters'),
      helpItem(label('internetOutages'), 'infraOutages'),
      helpItem(label('cyberThreats'), 'techCyberThreats'),
    ])}
        ${helpSection('naturalEconomic', [
      helpItem(label('naturalEvents'), 'naturalEventsTech'),
      helpItem(label('fires'), 'techFires'),
      helpItem(staticLabel('countries'), 'countriesOverlay'),
      helpItem(label('dayNight'), 'dayNight'),
    ])}
      </div>
    `;

    const financeHelpContent = `
      ${helpHeader}
      <div class="layer-help-content">
        ${helpSection('financeCore', [
      helpItem(label('stockExchanges'), 'financeExchanges'),
      helpItem(label('financialCenters'), 'financeCenters'),
      helpItem(label('centralBanks'), 'financeCentralBanks'),
      helpItem(label('commodityHubs'), 'financeCommodityHubs'),
      helpItem(label('gulfInvestments'), 'financeGulfInvestments'),
    ])}
        ${helpSection('infrastructureRisk', [
      helpItem(label('underseaCables'), 'financeCables'),
      helpItem(label('pipelines'), 'financePipelines'),
      helpItem(label('internetOutages'), 'financeOutages'),
      helpItem(label('cyberThreats'), 'financeCyberThreats'),
      helpItem(label('tradeRoutes'), 'tradeRoutes'),
    ])}
        ${helpSection('macroContext', [
      helpItem(label('economicCenters'), 'economicCenters'),
      helpItem(label('strategicWaterways'), 'macroWaterways'),
      helpItem(label('weatherAlerts'), 'weatherAlertsMarket'),
      helpItem(label('naturalEvents'), 'naturalEventsMacro'),
      helpItem(label('dayNight'), 'dayNight'),
    ])}
      </div>
    `;

    const fullHelpContent = `
      ${helpHeader}
      <div class="layer-help-content">
        ${helpSection('timeFilter', [
      helpItem(staticLabel('timeRecent'), 'timeRecent'),
      helpItem(staticLabel('timeExtended'), 'timeExtended'),
    ], 'timeAffects')}
        ${helpSection('geopolitical', [
      helpItem(label('conflictZones'), 'geoConflicts'),

      helpItem(label('intelHotspots'), 'geoHotspots'),
      helpItem(staticLabel('sanctions'), 'geoSanctions'),
      helpItem(label('protests'), 'geoProtests'),
      helpItem(label('ucdpEvents'), 'geoUcdpEvents'),
      helpItem(label('displacementFlows'), 'geoDisplacement'),
    ])}
        ${helpSection('militaryStrategic', [
      helpItem(label('militaryBases'), 'militaryBases'),
      helpItem(label('nuclearSites'), 'militaryNuclear'),
      helpItem(label('gammaIrradiators'), 'militaryIrradiators'),
      helpItem(label('militaryActivity'), 'militaryActivity'),
      helpItem(label('spaceports'), 'militarySpaceports'),
    ])}
        ${helpSection('infrastructure', [
      helpItem(label('underseaCables'), 'infraCablesFull'),
      helpItem(label('pipelines'), 'infraPipelinesFull'),
      helpItem(label('internetOutages'), 'infraOutages'),
      helpItem(label('aiDataCenters'), 'infraDatacentersFull'),
      helpItem(label('cyberThreats'), 'infraCyberThreats'),
    ])}
        ${helpSection('transport', [
      helpItem(label('shipTraffic'), 'transportShipping'),
      helpItem(label('tradeRoutes'), 'tradeRoutes'),
      helpItem(label('flightDelays'), 'transportDelays'),
    ])}
        ${helpSection('naturalEconomic', [
      helpItem(label('naturalEvents'), 'naturalEventsFull'),
      helpItem(label('fires'), 'firesFull'),
      helpItem(label('weatherAlerts'), 'weatherAlerts'),
      helpItem(label('climateAnomalies'), 'climateAnomalies'),
      helpItem(label('economicCenters'), 'economicCenters'),
      helpItem(label('criticalMinerals'), 'mineralsFull'),
    ])}
        ${helpSection('overlays', [
      helpItem(label('dayNight'), 'dayNight'),
      helpItem(staticLabel('countries'), 'countriesOverlay'),
      helpItem(label('strategicWaterways'), 'waterwaysLabels'),
    ])}
      </div>
    `;

    popup.innerHTML = SITE_VARIANT === 'tech'
      ? techHelpContent
      : SITE_VARIANT === 'finance'
        ? financeHelpContent
        : fullHelpContent;

    popup.querySelector('.layer-help-close')?.addEventListener('click', () => popup.remove());

    // Prevent scroll events from propagating to map
    const content = popup.querySelector('.layer-help-content');
    if (content) {
      content.addEventListener('wheel', (e) => e.stopPropagation(), { passive: false });
      content.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: false });
    }

    // Close on click outside
    setTimeout(() => {
      const closeHandler = (e: MouseEvent) => {
        if (!popup.contains(e.target as Node)) {
          popup.remove();
          document.removeEventListener('click', closeHandler);
        }
      };
      document.addEventListener('click', closeHandler);
    }, 100);

    this.container.appendChild(popup);
  }

  private createLegend(): void {
    const legend = document.createElement('div');
    legend.className = 'map-legend deckgl-legend';

    // SVG shapes for different marker types
    const shapes = {
      circle: (color: string) => `<svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5" fill="${color}"/></svg>`,
      triangle: (color: string) => `<svg width="12" height="12" viewBox="0 0 12 12"><polygon points="6,1 11,10 1,10" fill="${color}"/></svg>`,
      square: (color: string) => `<svg width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="10" rx="1" fill="${color}"/></svg>`,
      hexagon: (color: string) => `<svg width="12" height="12" viewBox="0 0 12 12"><polygon points="6,1 10.5,3.5 10.5,8.5 6,11 1.5,8.5 1.5,3.5" fill="${color}"/></svg>`,
    };

    const isLight = getCurrentTheme() === 'light';
    const legendItems = SITE_VARIANT === 'tech'
      ? [
        { shape: shapes.circle(isLight ? 'rgb(22, 163, 74)' : 'rgb(0, 255, 150)'), label: t('components.deckgl.legend.startupHub') },
        { shape: shapes.circle('rgb(100, 200, 255)'), label: t('components.deckgl.legend.techHQ') },
        { shape: shapes.circle(isLight ? 'rgb(180, 120, 0)' : 'rgb(255, 200, 0)'), label: t('components.deckgl.legend.accelerator') },
        { shape: shapes.circle('rgb(150, 100, 255)'), label: t('components.deckgl.legend.cloudRegion') },
        { shape: shapes.square('rgb(136, 68, 255)'), label: t('components.deckgl.legend.datacenter') },
      ]
      : SITE_VARIANT === 'finance'
        ? [
          { shape: shapes.circle('rgb(255, 215, 80)'), label: t('components.deckgl.legend.stockExchange') },
          { shape: shapes.circle('rgb(0, 220, 150)'), label: t('components.deckgl.legend.financialCenter') },
          { shape: shapes.hexagon('rgb(255, 210, 80)'), label: t('components.deckgl.legend.centralBank') },
          { shape: shapes.square('rgb(255, 150, 80)'), label: t('components.deckgl.legend.commodityHub') },
          { shape: shapes.triangle('rgb(80, 170, 255)'), label: t('components.deckgl.legend.waterway') },
        ]
        : SITE_VARIANT === 'happy'
          ? [
            { shape: shapes.circle('rgb(34, 197, 94)'), label: 'Positive Event' },
            { shape: shapes.circle('rgb(234, 179, 8)'), label: 'Breakthrough' },
            { shape: shapes.circle('rgb(74, 222, 128)'), label: 'Act of Kindness' },
            { shape: shapes.circle('rgb(255, 100, 50)'), label: 'Natural Event' },
            { shape: shapes.square('rgb(34, 180, 100)'), label: 'Happy Country' },
            { shape: shapes.circle('rgb(74, 222, 128)'), label: 'Species Recovery Zone' },
            { shape: shapes.circle('rgb(255, 200, 50)'), label: 'Renewable Installation' },
            // { shape: shapes.circle('rgb(160, 100, 255)'), label: t('components.deckgl.legend.aircraft') },
          ]
          : [
            { shape: shapes.circle('rgb(255, 68, 68)'), label: t('components.deckgl.legend.highAlert') },
            { shape: shapes.circle('rgb(255, 165, 0)'), label: t('components.deckgl.legend.elevated') },
            { shape: shapes.circle(isLight ? 'rgb(180, 120, 0)' : 'rgb(255, 255, 0)'), label: t('components.deckgl.legend.monitoring') },
            // { shape: shapes.triangle('rgb(68, 136, 255)'), label: t('components.deckgl.legend.base') },
            // { shape: shapes.hexagon(isLight ? 'rgb(180, 120, 0)' : 'rgb(255, 220, 0)'), label: t('components.deckgl.legend.nuclear') },
            // { shape: shapes.square('rgb(136, 68, 255)'), label: t('components.deckgl.legend.datacenter') },
            // { shape: shapes.circle('rgb(160, 100, 255)'), label: t('components.deckgl.legend.aircraft') },
          ];

    legend.innerHTML = `
      <span class="legend-label-title">${t('components.deckgl.legend.title')}</span>
      ${legendItems.map(({ shape, label }) => `<span class="legend-item">${shape}<span class="legend-label">${label}</span></span>`).join('')}
    `;

    // CII choropleth gradient legend (shown when layer is active)
    const ciiLegend = document.createElement('div');
    ciiLegend.className = 'cii-choropleth-legend';
    ciiLegend.id = 'ciiChoroplethLegend';
    ciiLegend.style.display = this.state.layers.ciiChoropleth ? 'block' : 'none';
    ciiLegend.innerHTML = `
      <span class="legend-label-title" style="font-size:9px;letter-spacing:0.5px;">CII SCALE</span>
      <div style="display:flex;align-items:center;gap:2px;margin-top:2px;">
        <div style="width:100%;height:8px;border-radius:3px;background:linear-gradient(to right,#28b33e,#dcc030,#e87425,#dc2626,#7f1d1d);"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:8px;opacity:0.7;margin-top:1px;">
        <span>0</span><span>31</span><span>51</span><span>66</span><span>81</span><span>100</span>
      </div>
    `;
    legend.appendChild(ciiLegend);

    this.container.appendChild(legend);
  }

  // Public API methods (matching MapComponent interface)
  public render(): void {
    if (this._batchingUpdates) return; // Coalesced — will render after batch ends
    if (this.renderPaused) {
      this.renderPending = true;
      return;
    }
    if (this.renderScheduled) return;
    this.renderScheduled = true;

    requestAnimationFrame(() => {
      this.renderScheduled = false;
      this.updateLayers();
    });
  }

  public setRenderPaused(paused: boolean): void {
    if (this.renderPaused === paused) return;
    this.renderPaused = paused;
    if (paused) {
      this.stopPulseAnimation();
      this.stopDayNightTimer();
      return;
    }

    this.syncPulseAnimation();
    if (this.state.layers.dayNight) this.startDayNightTimer();
    if (!paused && this.renderPending) {
      this.renderPending = false;
      this.render();
    }
  }

  private updateLayers(): void {
    if (this.renderPaused || this.webglLost || !this.maplibreMap) return;
    // During rapid gestures, skip expensive layer rebuilds — MapLibre tiles keep updating
    if (this.gestureActive && this.dirtyLayers.size === 0) return;
    const startTime = performance.now();
    try {
      this.deckOverlay?.setProps({ layers: this.buildLayers() });
    } catch { /* map may be mid-teardown (null.getProjection) */ }
    this.maplibreMap.triggerRepaint();
    const elapsed = performance.now() - startTime;
    if (import.meta.env.DEV && elapsed > 16) {
      console.warn(`[DeckGLMap] updateLayers took ${elapsed.toFixed(2)}ms (>16ms budget)`);
    }
    this.updateZoomHints();
  }

  private updateZoomHints(): void {
    const toggleList = this.container.querySelector('.deckgl-layer-toggles .toggle-list');
    if (!toggleList) return;
    for (const [key, enabled] of Object.entries(this.state.layers)) {
      const toggle = toggleList.querySelector(`.layer-toggle[data-layer="${key}"]`) as HTMLElement | null;
      if (!toggle) continue;
      const zoomHidden = !!enabled && !this.isLayerVisible(key as keyof MapLayers);
      toggle.classList.toggle('zoom-hidden', zoomHidden);
    }
  }

  public setView(view: DeckMapView): void {
    const preset = VIEW_PRESETS[view];
    if (!preset) return;
    this.state.view = view;

    if (this.maplibreMap) {
      this.maplibreMap.flyTo({
        center: [preset.longitude, preset.latitude],
        zoom: preset.zoom,
        duration: 1000,
      });
    }

    const viewSelect = this.container.querySelector('.view-select') as HTMLSelectElement;
    if (viewSelect) viewSelect.value = view;

    this.onStateChange?.(this.state);
  }

  public setZoom(zoom: number): void {
    this.state.zoom = zoom;
    if (this.maplibreMap) {
      this.maplibreMap.setZoom(zoom);
    }
  }

  public setCenter(lat: number, lon: number, zoom?: number): void {
    if (this.maplibreMap) {
      this.maplibreMap.flyTo({
        center: [lon, lat],
        ...(zoom != null && { zoom }),
        duration: 500,
      });
    }
  }

  public fitCountry(code: string): void {
    const bbox = getCountryBbox(code);
    if (!bbox || !this.maplibreMap) return;
    const [minLon, minLat, maxLon, maxLat] = bbox;
    this.maplibreMap.fitBounds([[minLon, minLat], [maxLon, maxLat]], {
      padding: 40,
      duration: 800,
      maxZoom: 8,
    });
  }

  public getCenter(): { lat: number; lon: number } | null {
    if (this.maplibreMap) {
      const center = this.maplibreMap.getCenter();
      return { lat: center.lat, lon: center.lng };
    }
    return null;
  }

  public setTimeRange(range: TimeRange): void {
    this.state.timeRange = range;
    this.invalidateAllTimeCache(); // Time range changed — all cached filters stale
    this.markAllDirty();
    this.rebuildProtestSupercluster();
    this.onTimeRangeChange?.(range);
    this.updateTimeSliderButtons();
    this.render();
  }

  public getTimeRange(): TimeRange {
    return this.state.timeRange;
  }

  public setLayers(layers: MapLayers): void {
    this.state.layers = layers;
    this.markAllDirty(); // Layer toggle affects all groups
    this.updateNavalInfoOverlay();
    this.render();
    this.manageAircraftTimer(layers.flights || layers.militaryAircraftUnknown);
    this.render(); // Debounced

    // Update toggle checkboxes
    Object.entries(layers).forEach(([key, value]) => {
      const toggle = this.container.querySelector(`.layer-toggle[data-layer="${key}"] input`) as HTMLInputElement;
      if (toggle) toggle.checked = value;
    });
  }

  public getState(): DeckMapState {
    return { ...this.state };
  }

  // Zoom controls - public for external access
  public zoomIn(): void {
    if (this.maplibreMap) {
      this.maplibreMap.zoomIn();
    }
  }

  public zoomOut(): void {
    if (this.maplibreMap) {
      this.maplibreMap.zoomOut();
    }
  }

  private resetView(): void {
    this.setView('global');
  }

  private createUcdpEventsLayer(events: UcdpGeoEvent[]): ScatterplotLayer<UcdpGeoEvent> {
    return new ScatterplotLayer<UcdpGeoEvent>({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'ucdp-events-layer',
      data: events,
      getPosition: (d) => [d.longitude, d.latitude],
      getRadius: (d) => Math.max(4000, Math.sqrt(d.deaths_best || 1) * 3000),
      getFillColor: (d) => {
        switch (d.type_of_violence) {
          case 'state-based': return COLORS.ucdpStateBased;
          case 'non-state': return COLORS.ucdpNonState;
          case 'one-sided': return COLORS.ucdpOneSided;
          default: return COLORS.ucdpStateBased;
        }
      },
      radiusMinPixels: 3,
      radiusMaxPixels: 20,
      pickable: true,
    });
  }

  private createDisplacementArcsLayer(): ArcLayer<DisplacementFlow> {
    const withCoords = this.displacementFlows.filter(f => f.originLat != null && f.asylumLat != null);
    const top50 = withCoords.slice(0, 50);
    const maxCount = Math.max(1, ...top50.map(f => f.refugees));
    return new ArcLayer<DisplacementFlow>({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'displacement-arcs-layer',
      data: top50,
      getSourcePosition: (d) => [d.originLon!, d.originLat!],
      getTargetPosition: (d) => [d.asylumLon!, d.asylumLat!],
      getSourceColor: getCurrentTheme() === 'light' ? [50, 80, 180, 220] : [100, 150, 255, 180],
      getTargetColor: getCurrentTheme() === 'light' ? [20, 150, 100, 220] : [100, 255, 200, 180],
      getWidth: (d) => Math.max(1, (d.refugees / maxCount) * 8),
      widthMinPixels: 1,
      widthMaxPixels: 8,
      pickable: false,
    });
  }

  private createClimateHeatmapLayer(): HeatmapLayer<ClimateAnomaly> {
    return new HeatmapLayer<ClimateAnomaly>({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'climate-heatmap-layer',
      data: this.climateAnomalies,
      getPosition: (d) => [d.lon, d.lat],
      getWeight: (d) => Math.abs(d.tempDelta) + Math.abs(d.precipDelta) * 0.1,
      radiusPixels: 40,
      intensity: 0.6,
      threshold: 0.15,
      opacity: 0.45,
      colorRange: [
        [68, 136, 255],
        [100, 200, 255],
        [255, 255, 100],
        [255, 200, 50],
        [255, 100, 50],
        [255, 50, 50],
      ],
      pickable: false,
    });
  }

  private createTradeRoutesLayer(): ArcLayer<TradeRouteSegment> {
    const active: [number, number, number, number] = getCurrentTheme() === 'light' ? [30, 100, 180, 200] : [100, 200, 255, 160];
    const disrupted: [number, number, number, number] = getCurrentTheme() === 'light' ? [200, 40, 40, 220] : [255, 80, 80, 200];
    const highRisk: [number, number, number, number] = getCurrentTheme() === 'light' ? [200, 140, 20, 200] : [255, 180, 50, 180];
    const colorFor = (status: string): [number, number, number, number] =>
      status === 'disrupted' ? disrupted : status === 'high_risk' ? highRisk : active;

    return new ArcLayer<TradeRouteSegment>({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'trade-routes-layer',
      data: this.tradeRouteSegments,
      getSourcePosition: (d) => d.sourcePosition,
      getTargetPosition: (d) => d.targetPosition,
      getSourceColor: (d) => colorFor(d.status),
      getTargetColor: (d) => colorFor(d.status),
      getWidth: (d) => d.category === 'energy' ? 3 : 2,
      widthMinPixels: 1,
      widthMaxPixels: 6,
      greatCircle: true,
      pickable: false,
    });
  }

  private createTradeChokepointsLayer(): ScatterplotLayer {
    const routeWaypointIds = new Set<string>();
    for (const seg of this.tradeRouteSegments) {
      const route = TRADE_ROUTES_LIST.find(r => r.id === seg.routeId);
      if (route) for (const wp of route.waypoints) routeWaypointIds.add(wp);
    }
    const chokepoints = STRATEGIC_WATERWAYS.filter(w => routeWaypointIds.has(w.id));
    const isLight = getCurrentTheme() === 'light';

    return new ScatterplotLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'trade-chokepoints-layer',
      data: chokepoints,
      getPosition: (d: { lon: number; lat: number }) => [d.lon, d.lat],
      getFillColor: isLight ? [200, 140, 20, 200] : [255, 180, 50, 180],
      getLineColor: isLight ? [100, 70, 10, 255] : [255, 220, 120, 255],
      getRadius: 30000,
      stroked: true,
      lineWidthMinPixels: 1,
      radiusMinPixels: 4,
      radiusMaxPixels: 12,
      pickable: false,
    });
  }

  /**
   * Compute the solar terminator polygon (night side of the Earth).
   * Uses standard astronomical formulas to find the subsolar point,
   * then traces the terminator line and closes around the dark pole.
   */
  private computeNightPolygon(): [number, number][] {
    const now = new Date();
    const JD = now.getTime() / 86400000 + 2440587.5;
    const D = JD - 2451545.0; // Days since J2000.0

    // Solar mean anomaly (radians)
    const g = ((357.529 + 0.98560028 * D) % 360) * Math.PI / 180;

    // Solar ecliptic longitude (degrees)
    const q = (280.459 + 0.98564736 * D) % 360;
    const L = q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g);
    const LRad = L * Math.PI / 180;

    // Obliquity of ecliptic (radians)
    const eRad = (23.439 - 0.00000036 * D) * Math.PI / 180;

    // Solar declination (radians)
    const decl = Math.asin(Math.sin(eRad) * Math.sin(LRad));

    // Solar right ascension (radians)
    const RA = Math.atan2(Math.cos(eRad) * Math.sin(LRad), Math.cos(LRad));

    // Greenwich Mean Sidereal Time (degrees)
    const GMST = ((18.697374558 + 24.06570982441908 * D) % 24) * 15;

    // Sub-solar longitude (degrees, normalized to [-180, 180])
    let sunLng = RA * 180 / Math.PI - GMST;
    sunLng = ((sunLng % 360) + 540) % 360 - 180;

    // Trace terminator line (1° steps for smooth curve at high zoom)
    const tanDecl = Math.tan(decl);
    const points: [number, number][] = [];

    // Near equinox (|tanDecl| ≈ 0), the terminator is nearly a great circle
    // through the poles — use a vertical line at the subsolar meridian ±90°
    if (Math.abs(tanDecl) < 1e-6) {
      for (let lat = -90; lat <= 90; lat += 1) {
        points.push([sunLng + 90, lat]);
      }
      for (let lat = 90; lat >= -90; lat -= 1) {
        points.push([sunLng - 90, lat]);
      }
      return points;
    }

    for (let lng = -180; lng <= 180; lng += 1) {
      const ha = (lng - sunLng) * Math.PI / 180;
      const lat = Math.atan(-Math.cos(ha) / tanDecl) * 180 / Math.PI;
      points.push([lng, lat]);
    }

    // Close polygon around the dark pole
    const darkPoleLat = decl > 0 ? -90 : 90;
    points.push([180, darkPoleLat]);
    points.push([-180, darkPoleLat]);

    return points;
  }

  private createDayNightLayer(): PolygonLayer {
    const nightPolygon = this.cachedNightPolygon ?? (this.cachedNightPolygon = this.computeNightPolygon());
    const isLight = getCurrentTheme() === 'light';

    return new PolygonLayer({
      parameters: { depthCompare: 'always' as const, depthWriteEnabled: false },
      id: 'day-night-layer',
      data: [{ polygon: nightPolygon }],
      getPolygon: (d: { polygon: [number, number][] }) => d.polygon,
      getFillColor: isLight ? [0, 0, 40, 35] : [0, 0, 20, 55],
      filled: true,
      stroked: true,
      getLineColor: isLight ? [100, 100, 100, 40] : [200, 200, 255, 25],
      getLineWidth: 1,
      lineWidthUnits: 'pixels' as const,
      pickable: false,
    });
  }

  // Data setters — markDirty + invalidateTimeCache for targeted rebuilds (spec 06, §1.1)
  public setEarthquakes(earthquakes: Earthquake[]): void {
    this.earthquakes = earthquakes;
    this.invalidateTimeCache('earthquakes');
    this.markDirty('earthquakes');
    this.render();
  }

  public setWeatherAlerts(alerts: WeatherAlert[]): void {
    this.weatherAlerts = alerts;
    this.invalidateTimeCache('weatherAlerts');
    this.markDirty('weather');
    this.render();
  }

  public setOutages(outages: InternetOutage[]): void {
    this.outages = outages;
    this.invalidateTimeCache('outages');
    this.markDirty('outages');
    this.render();
  }

  public setCyberThreats(threats: CyberThreat[]): void {
    this.cyberThreats = threats;
    this.markDirty('cyberThreats');
    this.render();
  }

  public setIranEvents(events: IranEvent[]): void {
    this.iranEvents = events;
    this.markDirty('iranAttacks');
    this.render();
  }


  public setAisData(disruptions: AisDisruptionEvent[], density: AisDensityZone[]): void {
    this.aisDisruptions = disruptions;
    this.aisDensity = density;
    this.markDirty('ais');
    this.render();
  }

  public setCableActivity(advisories: CableAdvisory[], repairShips: RepairShip[]): void {
    this.cableAdvisories = advisories;
    this.repairShips = repairShips;
    this.invalidateTimeCache('cableAdvisories');
    this.markDirty('cables');
    this.render();
  }

  public setCableHealth(healthMap: Record<string, CableHealthRecord>): void {
    this.healthByCableId = healthMap;
    this.layerCache.delete('cables-layer');
    this.markDirty('cables');
    this.render();
  }

  public setProtests(events: SocialUnrestEvent[]): void {
    this.protests = events;
    this.rebuildProtestSupercluster();
    this.markDirty('protests');
    this.render();
    this.syncPulseAnimation();
  }

  public setFlightDelays(delays: AirportDelayAlert[]): void {
    this.flightDelays = delays;
    this.invalidateTimeCache('flightDelays');
    this.markDirty('flights', 'militaryAircraftUnknown');
    this.render();
  }

  public setAircraftPositions(positions: PositionSample[]): void {
    this.aircraftPositions = (positions ?? []).filter((position) => !this.isLikelyMilitaryPosition(position));
    this.markDirty('flights', 'militaryAircraftUnknown');
    this.render();
  }

  public setMilitaryFlights(flights: MilitaryFlight[], clusters: MilitaryFlightCluster[] = []): void {
    this.militaryFlights = flights;
    this.militaryFlightClusters = clusters;
    this.invalidateTimeCache('militaryFlights');
    this.markDirty('military', 'militaryAircraftConfirmed', 'militaryAircraftUnknown');
    this.render();
  }

  public setMilitaryVessels(vessels: MilitaryVessel[], clusters: MilitaryVesselCluster[] = []): void {
    this.militaryVessels = vessels;
    this.militaryVesselClusters = clusters;
    this.invalidateTimeCache('militaryVessels');
    this.markDirty('military', 'navalActivity');
    this.render();
  }

  public setNavalActivity(snapshot: NavalActivitySnapshot): void {
    this.navalSnapshot = snapshot;
    this.markDirty('navalActivity');
    this.updateNavalInfoOverlay();
    this.render();
  }

  private fetchServerBases(): void {
    if (!this.maplibreMap) return;
    const mapLayers = this.state.layers;
    if (!mapLayers.bases) return;
    const zoom = this.maplibreMap.getZoom();
    if (zoom < 3) return;
    const bounds = this.maplibreMap.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    fetchMilitaryBases(sw.lat, sw.lng, ne.lat, ne.lng, zoom).then((result) => {
      if (!result) return;
      this.serverBases = result.bases;
      this.serverBaseClusters = result.clusters;
      this.serverBasesLoaded = true;
      this.markDirty('bases');
      this.render();
    }).catch((err) => {
      console.error('[bases] fetch error', err);
    });
  }

  private manageAircraftTimer(enabled: boolean): void {
    if (enabled) {
      if (!this.aircraftFetchTimer) {
        this.aircraftFetchTimer = setInterval(() => {
          this.lastAircraftFetchCenter = null; // force refresh on poll
          this.fetchViewportAircraft();
        }, 120_000); // Match server cache TTL (120s anonymous OpenSky tier)
        this.debouncedFetchAircraft();
      }
    } else {
      if (this.aircraftFetchTimer) {
        clearInterval(this.aircraftFetchTimer);
        this.aircraftFetchTimer = null;
      }
      this.aircraftPositions = [];
    }
  }

  private hasAircraftViewportChanged(): boolean {
    if (!this.maplibreMap) return false;
    if (!this.lastAircraftFetchCenter) return true;
    const center = this.maplibreMap.getCenter();
    const zoom = this.maplibreMap.getZoom();
    if (Math.abs(zoom - this.lastAircraftFetchZoom) >= 1) return true;
    const [prevLng, prevLat] = this.lastAircraftFetchCenter;
    // Threshold scales with zoom — higher zoom = smaller movement triggers fetch
    const threshold = Math.max(0.1, 2 / Math.pow(2, Math.max(0, zoom - 3)));
    return Math.abs(center.lat - prevLat) > threshold || Math.abs(center.lng - prevLng) > threshold;
  }

  private fetchViewportAircraft(): void {
    if (!this.maplibreMap) return;
    if (!this.state.layers.flights && !this.state.layers.militaryAircraftUnknown) return;
    const zoom = this.maplibreMap.getZoom();
    if (zoom < 2) {
      if (this.aircraftPositions.length > 0) {
        this.aircraftPositions = [];
        this.render();
      }
      return;
    }
    if (!this.hasAircraftViewportChanged()) return;
    const bounds = this.maplibreMap.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const seq = ++this.aircraftFetchSeq;
    fetchAircraftPositions({
      swLat: sw.lat, swLon: sw.lng,
      neLat: ne.lat, neLon: ne.lng,
    }).then((positions) => {
      if (seq !== this.aircraftFetchSeq) return; // discard stale response
      const civilianOnlyPositions = (positions ?? []).filter((position) => !this.isLikelyMilitaryPosition(position));
      this.aircraftPositions = civilianOnlyPositions;
      this.onAircraftPositionsUpdate?.(civilianOnlyPositions);
      const center = this.maplibreMap?.getCenter();
      if (center) {
        this.lastAircraftFetchCenter = [center.lng, center.lat];
        this.lastAircraftFetchZoom = this.maplibreMap!.getZoom();
      }
      this.render();
    }).catch((err) => {
      console.error('[aircraft] fetch error', err);
    });
  }

  public setNaturalEvents(events: NaturalEvent[]): void {
    this.naturalEvents = events;
    this.invalidateTimeCache('naturalEvents');
    this.markDirty('natural');
    this.render();
  }

  public setFires(fires: Array<{ lat: number; lon: number; brightness: number; frp: number; confidence: number; region: string; acq_date: string; daynight: string }>): void {
    // Cap fire data to prevent unbounded GPU memory growth (spec 06, §3.4)
    if (fires.length > DeckGLMap.MAX_FIRE_POINTS) {
      fires = [...fires].sort((a, b) => b.frp - a.frp).slice(0, DeckGLMap.MAX_FIRE_POINTS);
    }
    this.firmsFireData = fires;
    this.markDirty('fires');
    this.render();
  }

  public setTechEvents(events: TechEventMarker[]): void {
    this.techEvents = events;
    this.rebuildTechEventSupercluster();
    this.markDirty('tech');
    this.render();
  }

  public setUcdpEvents(events: UcdpGeoEvent[]): void {
    this.ucdpEvents = events;
    this.invalidateTimeCache('ucdpEvents');
    this.markDirty('ucdp');
    this.render();
  }

  public setDisplacementFlows(flows: DisplacementFlow[]): void {
    this.displacementFlows = flows;
    this.markDirty('displacement');
    this.render();
  }

  public setClimateAnomalies(anomalies: ClimateAnomaly[]): void {
    this.climateAnomalies = anomalies;
    this.markDirty('climate');
    this.render();
  }

  public setGpsJamming(hexes: GpsJamHex[]): void {
    this.gpsJammingHexes = hexes;
    this.markDirty('gpsJamming');
    this.render();
  }


  public setNewsLocations(data: Array<{ lat: number; lon: number; title: string; threatLevel: string; timestamp?: Date }>): void {
    const now = Date.now();
    for (const d of data) {
      if (!this.newsLocationFirstSeen.has(d.title)) {
        this.newsLocationFirstSeen.set(d.title, now);
      }
    }
    for (const [key, ts] of this.newsLocationFirstSeen) {
      if (now - ts > 60_000) this.newsLocationFirstSeen.delete(key);
    }
    this.newsLocations = data;
    this.markDirty('news');
    this.render();

    this.syncPulseAnimation(now);
  }

  public setPositiveEvents(events: PositiveGeoEvent[]): void {
    this.positiveEvents = events;
    this.syncPulseAnimation();
    this.markDirty('positiveEvents');
    this.render();
  }

  public setKindnessData(points: KindnessPoint[]): void {
    this.kindnessPoints = points;
    this.syncPulseAnimation();
    this.markDirty('kindness');
    this.render();
  }

  public setHappinessScores(data: HappinessData): void {
    this.happinessScores = data.scores;
    this.happinessYear = data.year;
    this.happinessSource = data.source;
    this.markDirty('happiness');
    this.render();
  }

  public setCIIScores(scores: Array<{ code: string; score: number; level: string }>): void {
    this.ciiScoresMap = new Map(scores.map(s => [s.code, { score: s.score, level: s.level }]));
    this.ciiScoresVersion++;
    this.render();
  }

  public setSpeciesRecoveryZones(species: SpeciesRecovery[]): void {
    this.speciesRecoveryZones = species.filter(
      (s): s is SpeciesRecovery & { recoveryZone: { name: string; lat: number; lon: number } } =>
        s.recoveryZone != null
    );
    this.markDirty('speciesRecovery');
    this.render();
  }

  public setRenewableInstallations(installations: RenewableInstallation[]): void {
    this.renewableInstallations = installations;
    this.markDirty('renewables');
    this.render();
  }

  public updateHotspotActivity(news: NewsItem[]): void {
    this.news = news; // Store for related news lookup

    // Update hotspot "breaking" indicators based on recent news
    const breakingKeywords = new Set<string>();
    const recentNews = news.filter(n =>
      Date.now() - n.pubDate.getTime() < 2 * 60 * 60 * 1000 // Last 2 hours
    );

    // Count matches per hotspot for escalation tracking
    const matchCounts = new Map<string, number>();

    recentNews.forEach(item => {
      const tokens = tokenizeForMatch(item.title);
      this.hotspots.forEach(hotspot => {
        if (matchesAnyKeyword(tokens, hotspot.keywords)) {
          breakingKeywords.add(hotspot.id);
          matchCounts.set(hotspot.id, (matchCounts.get(hotspot.id) || 0) + 1);
        }
      });
    });

    this.hotspots.forEach(h => {
      h.hasBreaking = breakingKeywords.has(h.id);
      const matchCount = matchCounts.get(h.id) || 0;
      // Calculate a simple velocity metric (matches per hour normalized)
      const velocity = matchCount > 0 ? matchCount / 2 : 0; // 2 hour window
      updateHotspotEscalation(h.id, matchCount, h.hasBreaking || false, velocity);
    });

    this.markDirty('hotspots');
    this.render();
    this.syncPulseAnimation();
  }

  /** Get news items related to a hotspot by keyword matching */
  private getRelatedNews(hotspot: Hotspot): NewsItem[] {
    const conflictTopics = ['gaza', 'ukraine', 'ukrainian', 'russia', 'russian', 'israel', 'israeli', 'iran', 'iranian', 'china', 'chinese', 'taiwan', 'taiwanese', 'korea', 'korean', 'syria', 'syrian'];

    return this.news
      .map((item) => {
        const tokens = tokenizeForMatch(item.title);
        const matchedKeywords = findMatchingKeywords(tokens, hotspot.keywords);

        if (matchedKeywords.length === 0) return null;

        const conflictMatches = conflictTopics.filter(t =>
          matchKeyword(tokens, t) && !hotspot.keywords.some(k => k.toLowerCase().includes(t))
        );

        if (conflictMatches.length > 0) {
          const strongLocalMatch = matchedKeywords.some(kw =>
            kw.toLowerCase() === hotspot.name.toLowerCase() ||
            hotspot.agencies?.some(a => matchKeyword(tokens, a))
          );
          if (!strongLocalMatch) return null;
        }

        const score = matchedKeywords.length;
        return { item, score };
      })
      .filter((x): x is { item: NewsItem; score: number } => x !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(x => x.item);
  }

  public updateMilitaryForEscalation(flights: MilitaryFlight[], vessels: MilitaryVessel[]): void {
    setMilitaryData(flights, vessels);
  }

  public getHotspotDynamicScore(hotspotId: string) {
    return getHotspotEscalation(hotspotId);
  }

  /** Get military flight clusters for rendering/analysis */
  public getMilitaryFlightClusters(): MilitaryFlightCluster[] {
    return this.militaryFlightClusters;
  }

  /** Get military vessel clusters for rendering/analysis */
  public getMilitaryVesselClusters(): MilitaryVesselCluster[] {
    return this.militaryVesselClusters;
  }

  public highlightAssets(assets: RelatedAsset[] | null): void {
    // Clear previous highlights
    Object.values(this.highlightedAssets).forEach(set => set.clear());

    if (assets) {
      assets.forEach(asset => {
        if (asset?.type && this.highlightedAssets[asset.type]) {
          this.highlightedAssets[asset.type].add(asset.id);
        }
      });
    }

    this.markDirty('cables', 'pipelines', 'bases', 'nuclear', 'datacenters');
    this.render();
  }

  public setOnHotspotClick(callback: (hotspot: Hotspot) => void): void {
    this.onHotspotClick = callback;
  }

  public setOnTimeRangeChange(callback: (range: TimeRange) => void): void {
    this.onTimeRangeChange = callback;
  }

  public setOnLayerChange(callback: (layer: keyof MapLayers, enabled: boolean, source: 'user' | 'programmatic') => void): void {
    this.onLayerChange = callback;
  }

  public setOnStateChange(callback: (state: DeckMapState) => void): void {
    this.onStateChange = callback;
  }

  public setOnAircraftPositionsUpdate(callback: (positions: PositionSample[]) => void): void {
    this.onAircraftPositionsUpdate = callback;
  }

  public getHotspotLevels(): Record<string, string> {
    const levels: Record<string, string> = {};
    this.hotspots.forEach(h => {
      levels[h.name] = h.level || 'low';
    });
    return levels;
  }

  public setHotspotLevels(levels: Record<string, string>): void {
    this.hotspots.forEach(h => {
      if (levels[h.name]) {
        h.level = levels[h.name] as 'low' | 'elevated' | 'high';
      }
    });
    this.render(); // Debounced
  }

  public initEscalationGetters(): void {
    setCIIGetter(getCountryScore);
    setGeoAlertGetter(getAlertsNearLocation);
  }

  private enforceLayerLimit(): void {
    const MAX_FLAT_LAYERS = 9;
    const togglesEl = this.container.querySelector('.deckgl-layer-toggles');
    if (!togglesEl) return;
    const allToggles = Array.from(togglesEl.querySelectorAll<HTMLInputElement>('.layer-toggle input'))
      .filter(i => (i.closest('.layer-toggle') as HTMLElement)?.style.display !== 'none');
    const checked = allToggles.filter(i => i.checked);
    if (checked.length > MAX_FLAT_LAYERS) {
      const excess = checked.slice(MAX_FLAT_LAYERS);
      for (const inp of excess) {
        inp.checked = false;
        const layer = inp.closest('.layer-toggle')?.getAttribute('data-layer') as keyof MapLayers | null;
        if (layer) {
          this.state.layers[layer] = false;
          this.onLayerChange?.(layer, false, 'programmatic');
        }
      }
      this.manageAircraftTimer(this.state.layers.flights || this.state.layers.militaryAircraftUnknown);
      this.render();
    }
    const activeCount = allToggles.filter(i => i.checked).length;
    allToggles.forEach(i => {
      if (!i.checked) {
        i.disabled = activeCount >= MAX_FLAT_LAYERS;
        i.closest('.layer-toggle')?.classList.toggle('limit-reached', activeCount >= MAX_FLAT_LAYERS);
      } else {
        i.disabled = false;
        i.closest('.layer-toggle')?.classList.remove('limit-reached');
      }
    });
  }

  // UI visibility methods
  public hideLayerToggle(layer: keyof MapLayers): void {
    const toggle = this.container.querySelector(`.layer-toggle[data-layer="${layer}"]`);
    if (toggle) (toggle as HTMLElement).style.display = 'none';
  }

  public setLayerLoading(layer: keyof MapLayers, loading: boolean): void {
    const toggle = this.container.querySelector(`.layer-toggle[data-layer="${layer}"]`);
    if (toggle) toggle.classList.toggle('loading', loading);
  }

  public setLayerReady(layer: keyof MapLayers, hasData: boolean): void {
    const toggle = this.container.querySelector(`.layer-toggle[data-layer="${layer}"]`);
    if (!toggle) return;

    toggle.classList.remove('loading');
    // Match old Map.ts behavior: set 'active' only when layer enabled AND has data
    if (this.state.layers[layer] && hasData) {
      toggle.classList.add('active');
    } else {
      toggle.classList.remove('active');
    }
  }

  public flashAssets(assetType: AssetType, ids: string[]): void {
    if (!this.highlightedAssets[assetType]) return;
    ids.forEach(id => this.highlightedAssets[assetType].add(id));
    this.render();

    setTimeout(() => {
      ids.forEach(id => this.highlightedAssets[assetType]?.delete(id));
      this.render();
    }, 3000);
  }

  // Enable layer programmatically
  public enableLayer(layer: keyof MapLayers): void {
    if (!this.state.layers[layer]) {
      this.state.layers[layer] = true;
      const toggle = this.container.querySelector(`.layer-toggle[data-layer="${layer}"] input`) as HTMLInputElement;
      if (toggle) toggle.checked = true;
      this.render();
      this.onLayerChange?.(layer, true, 'programmatic');
      this.enforceLayerLimit();
    }
  }

  // Toggle layer on/off programmatically
  public toggleLayer(layer: keyof MapLayers): void {
    this.state.layers[layer] = !this.state.layers[layer];
    const toggle = this.container.querySelector(`.layer-toggle[data-layer="${layer}"] input`) as HTMLInputElement;
    if (toggle) toggle.checked = this.state.layers[layer];
    this.render();
    this.onLayerChange?.(layer, this.state.layers[layer], 'programmatic');
    this.enforceLayerLimit();
  }

  // Get center coordinates for programmatic popup positioning
  private getContainerCenter(): { x: number; y: number } {
    const rect = this.container.getBoundingClientRect();
    return { x: rect.width / 2, y: rect.height / 2 };
  }

  // Project lat/lon to screen coordinates without moving the map
  private projectToScreen(lat: number, lon: number): { x: number; y: number } | null {
    if (!this.maplibreMap) return null;
    const point = this.maplibreMap.project([lon, lat]);
    return { x: point.x, y: point.y };
  }

  // Trigger click methods - show popup at item location without moving the map
  public triggerHotspotClick(id: string): void {
    const hotspot = this.hotspots.find(h => h.id === id);
    if (!hotspot) return;

    // Get screen position for popup
    const screenPos = this.projectToScreen(hotspot.lat, hotspot.lon);
    const { x, y } = screenPos || this.getContainerCenter();

    // Get related news and show popup
    const relatedNews = this.getRelatedNews(hotspot);
    this.popup.show({
      type: 'hotspot',
      data: hotspot,
      relatedNews,
      x,
      y,
    });
    this.popup.loadHotspotGdeltContext(hotspot);
    this.onHotspotClick?.(hotspot);
  }

  public triggerConflictClick(id: string): void {
    const conflict = CONFLICT_ZONES.find(c => c.id === id);
    if (conflict) {
      // Don't pan - show popup at projected screen position or center
      const screenPos = this.projectToScreen(conflict.center[1], conflict.center[0]);
      const { x, y } = screenPos || this.getContainerCenter();
      this.popup.show({ type: 'conflict', data: conflict, x, y });
    }
  }

  public triggerBaseClick(id: string): void {
    const base = this.serverBases.find(b => b.id === id) || MILITARY_BASES.find(b => b.id === id);
    if (base) {
      const screenPos = this.projectToScreen(base.lat, base.lon);
      const { x, y } = screenPos || this.getContainerCenter();
      this.popup.show({ type: 'base', data: base, x, y });
    }
  }

  public triggerPipelineClick(id: string): void {
    const pipeline = PIPELINES.find(p => p.id === id);
    if (pipeline && pipeline.points.length > 0) {
      const midIdx = Math.floor(pipeline.points.length / 2);
      const midPoint = pipeline.points[midIdx];
      // Don't pan - show popup at projected screen position or center
      const screenPos = midPoint ? this.projectToScreen(midPoint[1], midPoint[0]) : null;
      const { x, y } = screenPos || this.getContainerCenter();
      this.popup.show({ type: 'pipeline', data: pipeline, x, y });
    }
  }

  public triggerCableClick(id: string): void {
    const cable = UNDERSEA_CABLES.find(c => c.id === id);
    if (cable && cable.points.length > 0) {
      const midIdx = Math.floor(cable.points.length / 2);
      const midPoint = cable.points[midIdx];
      // Don't pan - show popup at projected screen position or center
      const screenPos = midPoint ? this.projectToScreen(midPoint[1], midPoint[0]) : null;
      const { x, y } = screenPos || this.getContainerCenter();
      this.popup.show({ type: 'cable', data: cable, x, y });
    }
  }

  public triggerDatacenterClick(id: string): void {
    const dc = AI_DATA_CENTERS.find(d => d.id === id);
    if (dc) {
      // Don't pan - show popup at projected screen position or center
      const screenPos = this.projectToScreen(dc.lat, dc.lon);
      const { x, y } = screenPos || this.getContainerCenter();
      this.popup.show({ type: 'datacenter', data: dc, x, y });
    }
  }

  public triggerNuclearClick(id: string): void {
    const facility = NUCLEAR_FACILITIES.find(n => n.id === id);
    if (facility) {
      // Don't pan - show popup at projected screen position or center
      const screenPos = this.projectToScreen(facility.lat, facility.lon);
      const { x, y } = screenPos || this.getContainerCenter();
      this.popup.show({ type: 'nuclear', data: facility, x, y });
    }
  }

  public triggerIrradiatorClick(id: string): void {
    const irradiator = GAMMA_IRRADIATORS.find(i => i.id === id);
    if (irradiator) {
      // Don't pan - show popup at projected screen position or center
      const screenPos = this.projectToScreen(irradiator.lat, irradiator.lon);
      const { x, y } = screenPos || this.getContainerCenter();
      this.popup.show({ type: 'irradiator', data: irradiator, x, y });
    }
  }

  public flashLocation(lat: number, lon: number, durationMs = 2000): void {
    // Don't pan - project coordinates to screen position
    const screenPos = this.projectToScreen(lat, lon);
    if (!screenPos) return;

    // Flash effect by temporarily adding a highlight at the location
    const flashMarker = document.createElement('div');
    flashMarker.className = 'flash-location-marker';
    flashMarker.style.cssText = `
      position: absolute;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.5);
      border: 2px solid #fff;
      animation: flash-pulse 0.5s ease-out infinite;
      pointer-events: none;
      z-index: 1000;
      left: ${screenPos.x}px;
      top: ${screenPos.y}px;
      transform: translate(-50%, -50%);
    `;

    // Add animation keyframes if not present
    if (!document.getElementById('flash-animation-styles')) {
      const style = document.createElement('style');
      style.id = 'flash-animation-styles';
      style.textContent = `
        @keyframes flash-pulse {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    const wrapper = this.container.querySelector('.deckgl-map-wrapper');
    if (wrapper) {
      wrapper.appendChild(flashMarker);
      setTimeout(() => flashMarker.remove(), durationMs);
    }
  }

  // --- Country click + highlight ---

  public setOnCountryClick(cb: (country: CountryClickPayload) => void): void {
    this.onCountryClick = cb;
  }

  private resolveCountryFromCoordinate(lon: number, lat: number): { code: string; name: string } | null {
    const fromGeometry = getCountryAtCoordinates(lat, lon);
    if (fromGeometry) return fromGeometry;
    if (!this.maplibreMap || !this.countryGeoJsonLoaded) return null;
    try {
      const point = this.maplibreMap.project([lon, lat]);
      const features = this.maplibreMap.queryRenderedFeatures(point, { layers: ['country-interactive'] });
      const properties = (features?.[0]?.properties ?? {}) as Record<string, unknown>;
      const code = typeof properties['ISO3166-1-Alpha-2'] === 'string'
        ? properties['ISO3166-1-Alpha-2'].trim().toUpperCase()
        : '';
      const name = typeof properties.name === 'string'
        ? properties.name.trim()
        : '';
      if (!code || !name) return null;
      return { code, name };
    } catch {
      return null;
    }
  }

  private loadCountryBoundaries(): void {
    if (!this.maplibreMap || this.countryGeoJsonLoaded) return;
    this.countryGeoJsonLoaded = true;

    getCountriesGeoJson()
      .then((geojson) => {
        if (!this.maplibreMap || !geojson) return;
        this.countriesGeoJsonData = geojson;
        this.maplibreMap.addSource('country-boundaries', {
          type: 'geojson',
          data: geojson,
        });
        this.maplibreMap.addLayer({
          id: 'country-interactive',
          type: 'fill',
          source: 'country-boundaries',
          paint: {
            'fill-color': '#3b82f6',
            'fill-opacity': 0,
          },
        });
        this.maplibreMap.addLayer({
          id: 'country-hover-fill',
          type: 'fill',
          source: 'country-boundaries',
          paint: {
            'fill-color': '#3b82f6',
            'fill-opacity': 0.06,
          },
          filter: ['==', ['get', 'name'], ''],
        });
        this.maplibreMap.addLayer({
          id: 'country-highlight-fill',
          type: 'fill',
          source: 'country-boundaries',
          paint: {
            'fill-color': '#3b82f6',
            'fill-opacity': 0.12,
          },
          filter: ['==', ['get', 'ISO3166-1-Alpha-2'], ''],
        });
        this.maplibreMap.addLayer({
          id: 'country-highlight-border',
          type: 'line',
          source: 'country-boundaries',
          paint: {
            'line-color': '#3b82f6',
            'line-width': 1.5,
            'line-opacity': 0.5,
          },
          filter: ['==', ['get', 'ISO3166-1-Alpha-2'], ''],
        });

        if (!this.countryHoverSetup) this.setupCountryHover();
        this.updateCountryLayerPaint(getCurrentTheme());
        if (this.highlightedCountryCode) this.highlightCountry(this.highlightedCountryCode);
      })
      .catch((err) => console.warn('[DeckGLMap] Failed to load country boundaries:', err));
  }

  private setupCountryHover(): void {
    if (!this.maplibreMap || this.countryHoverSetup) return;
    this.countryHoverSetup = true;
    const map = this.maplibreMap;
    let hoveredName: string | null = null;

    map.on('mousemove', (e) => {
      if (!this.onCountryClick) return;
      const features = map.queryRenderedFeatures(e.point, { layers: ['country-interactive'] });
      const name = features?.[0]?.properties?.name as string | undefined;

      try {
        if (name && name !== hoveredName) {
          hoveredName = name;
          map.setFilter('country-hover-fill', ['==', ['get', 'name'], name]);
          map.getCanvas().style.cursor = 'pointer';
        } else if (!name && hoveredName) {
          hoveredName = null;
          map.setFilter('country-hover-fill', ['==', ['get', 'name'], '']);
          map.getCanvas().style.cursor = '';
        }
      } catch { /* style not done loading during theme switch */ }
    });

    map.on('mouseout', () => {
      if (hoveredName) {
        hoveredName = null;
        try {
          map.setFilter('country-hover-fill', ['==', ['get', 'name'], '']);
        } catch { /* style not done loading */ }
        map.getCanvas().style.cursor = '';
      }
    });
  }

  public highlightCountry(code: string): void {
    this.highlightedCountryCode = code;
    if (!this.maplibreMap || !this.countryGeoJsonLoaded) return;
    const filter = ['==', ['get', 'ISO3166-1-Alpha-2'], code] as maplibregl.FilterSpecification;
    try {
      this.maplibreMap.setFilter('country-highlight-fill', filter);
      this.maplibreMap.setFilter('country-highlight-border', filter);
    } catch { /* layer not ready yet */ }
  }

  public clearCountryHighlight(): void {
    this.highlightedCountryCode = null;
    if (!this.maplibreMap) return;
    const noMatch = ['==', ['get', 'ISO3166-1-Alpha-2'], ''] as maplibregl.FilterSpecification;
    try {
      this.maplibreMap.setFilter('country-highlight-fill', noMatch);
      this.maplibreMap.setFilter('country-highlight-border', noMatch);
    } catch { /* layer not ready */ }
  }

  private switchBasemap(theme: 'dark' | 'light'): void {
    if (!this.maplibreMap) return;
    const primary = theme === 'light' ? LIGHT_STYLE : DARK_STYLE;
    const fallback = theme === 'light' ? FALLBACK_LIGHT_STYLE : FALLBACK_DARK_STYLE;
    this.maplibreMap.setStyle(this.usedFallbackStyle ? fallback : primary);
    // setStyle() replaces all sources/layers — reset guard so country layers are re-added
    this.countryGeoJsonLoaded = false;
    this.maplibreMap.once('style.load', () => {
      localizeMapLabels(this.maplibreMap);
      this.loadCountryBoundaries();
      this.updateCountryLayerPaint(theme);
      // Re-render deck.gl overlay after style swap — interleaved layers need
      // the new MapLibre style to be loaded before they can re-insert.
      this.render();
    });
  }

  private updateCountryLayerPaint(theme: 'dark' | 'light'): void {
    if (!this.maplibreMap || !this.countryGeoJsonLoaded) return;
    const hoverOpacity = theme === 'light' ? 0.10 : 0.06;
    const highlightOpacity = theme === 'light' ? 0.18 : 0.12;
    try {
      this.maplibreMap.setPaintProperty('country-hover-fill', 'fill-opacity', hoverOpacity);
      this.maplibreMap.setPaintProperty('country-highlight-fill', 'fill-opacity', highlightOpacity);
    } catch { /* layers may not be ready */ }
  }

  public destroy(): void {
    window.removeEventListener('theme-changed', this.handleThemeChange);
    this.debouncedRebuildLayers.cancel();
    this.debouncedFetchBases.cancel();
    this.debouncedFetchAircraft.cancel();
    this.rafUpdateLayers.cancel();

    if (this.moveTimeoutId) {
      clearTimeout(this.moveTimeoutId);
      this.moveTimeoutId = null;
    }
    if (this.gestureEndTimeoutId) {
      clearTimeout(this.gestureEndTimeoutId);
      this.gestureEndTimeoutId = null;
    }

    if (this.styleLoadTimeoutId) {
      clearTimeout(this.styleLoadTimeoutId);
      this.styleLoadTimeoutId = null;
    }
    this.stopPulseAnimation();
    this.stopDayNightTimer();
    if (this.aircraftFetchTimer) {
      clearInterval(this.aircraftFetchTimer);
      this.aircraftFetchTimer = null;
    }

    this.layerCache.clear();

    this.deckOverlay?.finalize();
    this.deckOverlay = null;
    this.maplibreMap?.remove();
    this.maplibreMap = null;

    // Explicit data store cleanup for immediate GC (spec 06, §3.1)
    this.earthquakes = [];
    this.weatherAlerts = [];
    this.outages = [];
    this.cyberThreats = [];
    this.iranEvents = [];
    this.aisDisruptions = [];
    this.aisDensity = [];
    this.cableAdvisories = [];
    this.repairShips = [];
    this.healthByCableId = {};
    this.protests = [];
    this.militaryFlights = [];
    this.militaryFlightClusters = [];
    this.militaryVessels = [];
    this.militaryVesselClusters = [];
    this.serverBases = [];
    this.serverBaseClusters = [];
    this.naturalEvents = [];
    this.firmsFireData = [];
    this.techEvents = [];
    this.flightDelays = [];
    this.news = [];
    this.newsLocations = [];
    this.ucdpEvents = [];
    this.displacementFlows = [];
    this.climateAnomalies = [];
    this.tradeRouteSegments = [];
    this.positiveEvents = [];
    this.kindnessPoints = [];
    this.speciesRecoveryZones = [];
    this.renewableInstallations = [];
    this.hotspots = [];
    this.protestClusters = [];
    this.techHQClusters = [];
    this.techEventClusters = [];
    this.datacenterClusters = [];
    this.protestSuperclusterSource = [];
    if (this.mapClusterWorker) {
      this.mapClusterWorker.terminate();
      this.mapClusterWorker = null;
    }
    this.newsLocationFirstSeen.clear();
    this.happinessScores.clear();
    this.dirtyLayers.clear();
    this.navalInfoOverlayEl?.remove();
    this.navalInfoOverlayEl = null;
    this.timeFilterCache.clear();
    this.countriesGeoJsonData = null;

    // Clear callbacks
    this.onHotspotClick = undefined;
    this.onTimeRangeChange = undefined;
    this.onCountryClick = undefined;
    this.onLayerChange = undefined;
    this.onStateChange = undefined;

    this.container.innerHTML = '';
  }
}
