// ── Geopolitical Boundaries ──────────────────────────────────────────────────
// Active and frozen ceasefire lines, armistice boundaries, and disputed
// demarcation lines rendered as path overlays on the map.

export type GeopoliticalBoundaryType = 'ceasefire' | 'armistice' | 'dmz' | 'contact-line' | 'disputed';

export interface GeopoliticalBoundary {
  id: string;
  name: string;
  type: GeopoliticalBoundaryType;
  /** [lon, lat] pairs */
  points: [number, number][];
  status: 'active' | 'frozen' | 'contested';
  description?: string;
}

export const GEOPOLITICAL_BOUNDARIES: GeopoliticalBoundary[] = [
  {
    id: 'korean_mdl',
    name: 'Korean MDL / DMZ',
    type: 'armistice',
    status: 'active',
    description: '1953 Korean Armistice Agreement Military Demarcation Line',
    points: [
      [126.0955, 37.7876], [126.2448, 37.8175], [126.3927, 37.857], [126.5117, 37.9068],
      [126.6219, 37.9468], [126.6735, 37.9672], [126.775, 37.9875], [126.8936, 38.0173],
      [127.0409, 38.0665], [127.1676, 38.1351], [127.3004, 38.2363], [127.4476, 38.2679],
      [127.5784, 38.2679], [127.7175, 38.2879], [127.8476, 38.2979], [127.994, 38.3174],
      [128.1079, 38.3653], [128.1834, 38.4324], [128.262, 38.5312], [128.342, 38.6312],
    ],
  },
  {
    id: 'ukraine_frontline',
    name: 'Ukraine-Russia Contact Line',
    type: 'contact-line',
    status: 'active',
    description: 'Active frontline in eastern Ukraine (approximate 2025 position)',
    points: [
      [33.4, 46.3], [34.0, 46.7], [34.6, 47.1], [35.3, 47.5], [35.9, 47.8],
      [36.5, 48.0], [37.0, 48.1], [37.5, 48.2], [37.9, 48.5], [38.2, 48.8],
      [38.5, 49.0], [38.9, 49.2], [39.3, 49.4], [39.8, 49.6], [40.1, 49.8],
    ],
  },
  {
    id: 'kashmir_loc',
    name: 'Line of Control — Kashmir',
    type: 'ceasefire',
    status: 'contested',
    description: 'India-Pakistan ceasefire line through Kashmir, established 1949 (Karachi Agreement)',
    points: [
      [74.5, 32.8], [74.9, 33.2], [75.3, 33.6], [75.7, 34.0], [76.1, 34.4],
      [76.5, 34.8], [76.9, 35.1], [77.3, 35.4], [77.0, 35.7],
    ],
  },
  {
    id: 'cyprus_green_line',
    name: 'Cyprus Green Line (UN Buffer)',
    type: 'ceasefire',
    status: 'frozen',
    description: 'UN-patrolled ceasefire line dividing Cyprus since 1974',
    points: [
      [32.45, 35.09], [32.65, 35.12], [32.90, 35.18], [33.15, 35.24],
      [33.40, 35.28], [33.65, 35.33], [33.95, 35.38],
    ],
  },
  {
    id: 'blue_line_lebanon',
    name: 'Blue Line — Israel/Lebanon',
    type: 'ceasefire',
    status: 'active',
    description: 'UNIFIL demarcation line along the Israel-Lebanon border, established 2000',
    points: [
      [35.10, 33.07], [35.22, 33.10], [35.38, 33.13], [35.55, 33.16],
      [35.68, 33.20], [35.80, 33.25],
    ],
  },
  {
    id: 'abkhazia_loc',
    name: 'Abkhazia Line of Control',
    type: 'ceasefire',
    status: 'frozen',
    description: 'Administrative boundary between Georgia and Russian-occupied Abkhazia',
    points: [
      [41.55, 43.10], [41.80, 43.05], [42.10, 42.95], [42.40, 42.85],
      [42.70, 42.75], [42.95, 42.65],
    ],
  },
  {
    id: 'south_ossetia_loc',
    name: 'South Ossetia Administrative Boundary',
    type: 'ceasefire',
    status: 'frozen',
    description: 'Administrative boundary between Georgia and Russian-occupied South Ossetia',
    points: [
      [43.80, 42.25], [43.95, 42.40], [44.10, 42.55], [44.30, 42.65],
      [44.50, 42.68], [44.70, 42.55], [44.83, 42.40],
    ],
  },
  {
    id: 'taiwan_strait_median',
    name: 'Taiwan Strait Median Line',
    type: 'disputed',
    status: 'contested',
    description: 'Informal median line across the Taiwan Strait; no longer recognized by China (PRC) since 2023',
    points: [
      [120.6, 26.8], [120.8, 25.8], [121.0, 24.8], [121.2, 23.8],
      [121.3, 22.8], [121.4, 21.8],
    ],
  },
];
