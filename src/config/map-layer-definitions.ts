import type { MapLayers } from '@/types';
import type { IconName } from '@/utils/icons';

export type MapRenderer = 'flat' | 'globe';
export type MapVariant = 'full' | 'tech' | 'finance' | 'happy';

export interface LayerDefinition {
  key: keyof MapLayers;
  icon: IconName;
  i18nSuffix: string;
  fallbackLabel: string;
  renderers: MapRenderer[];
}

const def = (
  key: keyof MapLayers,
  icon: IconName,
  i18nSuffix: string,
  fallbackLabel: string,
  renderers: MapRenderer[] = ['flat', 'globe'],
): LayerDefinition => ({ key, icon, i18nSuffix, fallbackLabel, renderers });

export const LAYER_REGISTRY: Record<keyof MapLayers, LayerDefinition> = {
  iranAttacks: def('iranAttacks', 'crosshair', 'iranAttacks', 'Iran Attacks'),
  hotspots: def('hotspots', 'hotspot', 'intelHotspots', 'Intel Hotspots'),
  conflicts: def('conflicts', 'sword', 'conflictZones', 'Conflict Zones'),
  militaryAircraftConfirmed: def('militaryAircraftConfirmed', 'plane', 'militaryAircraftConfirmed', 'Confirmed Military Aircraft'),
  militaryAircraftUnknown: def('militaryAircraftUnknown', 'plane-civilian', 'militaryAircraftUnknown', 'Unknown / Possible Civilian Aircraft'),
  navalActivity: def('navalActivity', 'vessel', 'navalActivity', 'Naval Activity'),
  military: def('military', 'plane', 'militaryActivity', 'Military Activity', []),

  bases: def('bases', 'target', 'militaryBases', 'Military Bases'),
  nuclear: def('nuclear', 'nuclear', 'nuclearSites', 'Nuclear Sites'),
  irradiators: def('irradiators', 'radiation', 'gammaIrradiators', 'Gamma Irradiators'),
  spaceports: def('spaceports', 'rocket', 'spaceports', 'Spaceports'),
  cables: def('cables', 'cable', 'underseaCables', 'Undersea Cables'),
  pipelines: def('pipelines', 'oil', 'pipelines', 'Pipelines'),
  datacenters: def('datacenters', 'server', 'aiDataCenters', 'AI Data Centers'),
  ais: def('ais', 'vessel', 'shipTraffic', 'Ship Traffic'),
  tradeRoutes: def('tradeRoutes', 'anchor', 'tradeRoutes', 'Trade Routes'),
  flights: def('flights', 'plane', 'flightDelays', 'Flight Delays'),
  protests: def('protests', 'megaphone', 'protests', 'Protests'),
  ucdpEvents: def('ucdpEvents', 'conflict', 'ucdpEvents', 'Armed Conflict Events'),
  displacement: def('displacement', 'people', 'displacementFlows', 'Displacement Flows'),
  climate: def('climate', 'thermometer', 'climateAnomalies', 'Climate Anomalies'),
  weather: def('weather', 'storm', 'weatherAlerts', 'Weather Alerts'),
  outages: def('outages', 'satellite-dish', 'internetOutages', 'Internet Outages'),
  cyberThreats: def('cyberThreats', 'shield', 'cyberThreats', 'Cyber Threats'),
  natural: def('natural', 'volcano', 'naturalEvents', 'Natural Events'),
  fires: def('fires', 'fire', 'fires', 'Fires'),
  waterways: def('waterways', 'anchor', 'strategicWaterways', 'Strategic Waterways'),
  economic: def('economic', 'coin', 'economicCenters', 'Economic Centers'),
  minerals: def('minerals', 'diamond', 'criticalMinerals', 'Critical Minerals'),
  gpsJamming: def('gpsJamming', 'lightning', 'gpsJamming', 'GPS Jamming'),
  ciiChoropleth: def('ciiChoropleth', 'globe', 'ciiChoropleth', 'CII Instability'),
  geopoliticalBoundaries: def('geopoliticalBoundaries', 'globe', 'geopoliticalBoundaries', 'Geopolitical Boundaries'),
  dayNight: def('dayNight', 'sun', 'dayNight', 'Day/Night', ['flat']),
  sanctions: def('sanctions', 'stop', 'sanctions', 'Sanctions', []),
  startupHubs: def('startupHubs', 'lightbulb', 'startupHubs', 'Startup Hubs'),
  techHQs: def('techHQs', 'building', 'techHQs', 'Tech HQs'),
  accelerators: def('accelerators', 'lightning', 'accelerators', 'Accelerators'),
  cloudRegions: def('cloudRegions', 'server', 'cloudRegions', 'Cloud Regions'),
  techEvents: def('techEvents', 'chart', 'techEvents', 'Tech Events'),
  stockExchanges: def('stockExchanges', 'exchange', 'stockExchanges', 'Stock Exchanges'),
  financialCenters: def('financialCenters', 'bank', 'financialCenters', 'Financial Centers'),
  centralBanks: def('centralBanks', 'bank', 'centralBanks', 'Central Banks'),
  commodityHubs: def('commodityHubs', 'package', 'commodityHubs', 'Commodity Hubs'),
  gulfInvestments: def('gulfInvestments', 'coin', 'gulfInvestments', 'GCC Investments'),
  positiveEvents: def('positiveEvents', 'flag', 'positiveEvents', 'Positive Events'),
  kindness: def('kindness', 'heart', 'kindness', 'Acts of Kindness'),
  happiness: def('happiness', 'globe', 'happiness', 'World Happiness'),
  speciesRecovery: def('speciesRecovery', 'leaf', 'speciesRecovery', 'Species Recovery'),
  renewableInstallations: def('renewableInstallations', 'lightning', 'renewableInstallations', 'Clean Energy'),
};

const VARIANT_LAYER_ORDER: Record<MapVariant, Array<keyof MapLayers>> = {
  full: [
    // Disabled layers that are not fully ready or have data issues:
    'iranAttacks',
    // 'fires',

    'hotspots', 'conflicts',
    'militaryAircraftConfirmed', 'militaryAircraftUnknown', 'navalActivity',
    'ucdpEvents', 'displacement',
    'bases',
    'nuclear', 'irradiators', 'spaceports',
    'cables', 'pipelines', 'datacenters',
    'ais', 'tradeRoutes', 'flights', 'protests',
    'climate', 'weather',
    'cyberThreats',
    'outages', 'natural',
    'waterways', 'economic', 'minerals', 'gpsJamming',
    'ciiChoropleth', 'geopoliticalBoundaries', 'dayNight',
  ],
  tech: [
    'startupHubs', 'techHQs', 'accelerators', 'cloudRegions',
    'datacenters', 'cables', 'outages', 'cyberThreats',
    'techEvents', 'natural', 'fires', 'dayNight',
  ],
  finance: [
    'stockExchanges', 'financialCenters', 'centralBanks', 'commodityHubs',
    'gulfInvestments', 'tradeRoutes', 'cables', 'pipelines',
    'outages', 'weather', 'economic', 'waterways',
    'natural', 'cyberThreats', 'dayNight',
  ],
  happy: [
    'positiveEvents', 'kindness', 'happiness',
    'speciesRecovery', 'renewableInstallations',
  ],
};

const I18N_PREFIX = 'components.deckgl.layers.';

export function getLayersForVariant(variant: MapVariant, renderer: MapRenderer): LayerDefinition[] {
  const keys = VARIANT_LAYER_ORDER[variant] ?? VARIANT_LAYER_ORDER.full;
  return keys
    .map(k => LAYER_REGISTRY[k])
    .filter(d => d.renderers.includes(renderer));
}

export function resolveLayerLabel(def: LayerDefinition, tFn?: (key: string) => string): string {
  if (tFn) {
    const translated = tFn(I18N_PREFIX + def.i18nSuffix);
    if (translated && translated !== I18N_PREFIX + def.i18nSuffix) return translated;
  }
  return def.fallbackLabel;
}
