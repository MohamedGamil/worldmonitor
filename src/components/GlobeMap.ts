/**
 * GlobeMap - 3D interactive globe using globe.gl
 *
 * Matches Marsd's MapContainer API so it can be used as a drop-in
 * replacement within MapContainer when the user enables globe mode.
 *
 * Architecture mirrors Sentinel (sentinel.axonia.us):
 *  - globe.gl v2 (new Globe(element, config))
 *  - Earth texture: /textures/earth-topo-bathy.jpg
 *  - Night sky background: /textures/night-sky.png
 *  - Specular/water map: /textures/earth-water.png
 *  - Atmosphere: #4466cc glow via built-in Fresnel shader
 *  - All markers via htmlElementsData (single merged array with _kind discriminator)
 *  - Auto-rotate after 60 s of inactivity
 */

import Globe from 'globe.gl';
import { isDesktopRuntime } from '@/services/runtime';
import type { GlobeInstance, ConfigOptions } from 'globe.gl';
import { INTEL_HOTSPOTS, CONFLICT_ZONES, MILITARY_BASES, NUCLEAR_FACILITIES } from '@/config/geo';
import { t } from '@/services/i18n';
import { svgIcon } from '@/utils/icons';
import { SITE_VARIANT } from '@/config/variant';
import { getGlobeRenderScale, resolveGlobePixelRatio, resolvePerformanceProfile, subscribeGlobeRenderScaleChange, getGlobeTexture, GLOBE_TEXTURE_URLS, subscribeGlobeTextureChange, type GlobeRenderScale, type GlobePerformanceProfile } from '@/services/globe-render-settings';
import { getLayersForVariant, resolveLayerLabel, type MapVariant } from '@/config/map-layer-definitions';
import type { TradeRouteSegment } from '@/config/trade-routes';
import type { GlobeStaticReadyMessage } from '@/workers/globe-data.worker';
import { getCountryBbox, getCountriesGeoJson } from '@/services/country-geometry';
import { escapeHtml } from '@/utils/sanitize';
import { getNaturalEventIcon } from '@/services/eonet';
import type { NaturalEventCategory } from '@/types';
import { getLocalizedGeoName } from '@/services/i18n';
import { identifyByCallsign, isConfirmedMilitaryFlightRecord, isKnownMilitaryHex } from '@/config/military';
import type { FeatureCollection, Geometry } from 'geojson';
import type { MapLayers, Hotspot, MilitaryFlight, MilitaryVessel, NaturalEvent, InternetOutage, CyberThreat, SocialUnrestEvent, UcdpGeoEvent, CableAdvisory, RepairShip, AisDisruptionEvent, AisDensityZone, AisDisruptionType } from '@/types';
import type { Earthquake } from '@/services/earthquakes';
import type { AirportDelayAlert, PositionSample } from '@/services/aviation';
import { fetchAircraftPositions } from '@/services/aviation';
import type { MapContainerState, MapView, TimeRange } from './MapContainer';
import type { CountryClickPayload } from './DeckGLMap';
import type { WeatherAlert } from '@/services/weather';
import type { IranEvent } from '@/services/conflict';
import type { DisplacementFlow } from '@/services/displacement';
import type { ClimateAnomaly } from '@/services/climate';
import type { GpsJamHex } from '@/services/gps-interference';
import { MapPopup } from './MapPopup';

// ─── Marker discriminated union ─────────────────────────────────────────────
interface BaseMarker {
  _kind: string;
  _lat: number;
  _lng: number;
}
interface ConflictMarker extends BaseMarker {
  _kind: 'conflict';
  id: string;
  fatalities: number;
  eventType: string;
  location: string;
}
interface HotspotMarker extends BaseMarker {
  _kind: 'hotspot';
  id: string;
  name: string;
  escalationScore: number;
}
interface FlightMarker extends BaseMarker {
  _kind: 'flight';
  id: string;
  callsign: string;
  type: string;
  heading: number;
  isInteresting?: boolean;
  isCivilian?: boolean;
}
interface VesselMarker extends BaseMarker {
  _kind: 'vessel';
  id: string;
  name: string;
  type: string;
}
interface WeatherMarker extends BaseMarker {
  _kind: 'weather';
  id: string;
  severity: string;
  headline: string;
}
interface NaturalMarker extends BaseMarker {
  _kind: 'natural';
  id: string;
  category: string;
  title: string;
}
interface IranMarker extends BaseMarker {
  _kind: 'iran';
  id: string;
  title: string;
  category: string;
  severity: string;
  location: string;
}
interface OutageMarker extends BaseMarker {
  _kind: 'outage';
  id: string;
  title: string;
  severity: string;
  country: string;
}
interface CyberMarker extends BaseMarker {
  _kind: 'cyber';
  id: string;
  indicator: string;
  severity: string;
  type: string;
}
interface FireMarker extends BaseMarker {
  _kind: 'fire';
  id: string;
  region: string;
  brightness: number;
}
interface ProtestMarker extends BaseMarker {
  _kind: 'protest';
  id: string;
  title: string;
  eventType: string;
  country: string;
}
interface UcdpMarker extends BaseMarker {
  _kind: 'ucdp';
  id: string;
  sideA: string;
  sideB: string;
  deaths: number;
  country: string;
  dateStart: string;
  dateEnd: string;
  typeOfViolence: 'state-based' | 'non-state' | 'one-sided';
  sourceOriginal: string;
}
interface DisplacementMarker extends BaseMarker {
  _kind: 'displacement';
  id: string;
  origin: string;
  asylum: string;
  refugees: number;
}
interface ClimateMarker extends BaseMarker {
  _kind: 'climate';
  id: string;
  zone: string;
  type: string;
  severity: string;
  tempDelta: number;
}
interface GpsJamMarker extends BaseMarker {
  _kind: 'gpsjam';
  id: string;
  level: string;
  pct: number;
}
interface TechMarker extends BaseMarker {
  _kind: 'tech';
  id: string;
  title: string;
  country: string;
  daysUntil: number;
}
interface ConflictZoneMarker extends BaseMarker {
  _kind: 'conflictZone';
  id: string;
  name: string;
  intensity: string;
  parties: string[];
  casualties?: string;
}
interface MilBaseMarker extends BaseMarker {
  _kind: 'milbase';
  id: string;
  name: string;
  type: string;
  country: string;
}
interface NuclearSiteMarker extends BaseMarker {
  _kind: 'nuclearSite';
  id: string;
  name: string;
  type: string;
  status: string;
}
interface IrradiatorSiteMarker extends BaseMarker {
  _kind: 'irradiator';
  id: string;
  city: string;
  country: string;
}
interface SpaceportSiteMarker extends BaseMarker {
  _kind: 'spaceport';
  id: string;
  name: string;
  country: string;
  operator: string;
  launches: string;
}
interface EarthquakeMarker extends BaseMarker {
  _kind: 'earthquake';
  id: string;
  place: string;
  magnitude: number;
}
interface EconomicMarker extends BaseMarker {
  _kind: 'economic';
  id: string;
  name: string;
  type: string;
  country: string;
  description: string;
}
interface DatacenterMarker extends BaseMarker {
  _kind: 'datacenter';
  id: string;
  name: string;
  owner: string;
  country: string;
  chipType: string;
}
interface WaterwayMarker extends BaseMarker {
  _kind: 'waterway';
  id: string;
  name: string;
  description: string;
}
interface MineralMarker extends BaseMarker {
  _kind: 'mineral';
  id: string;
  name: string;
  mineral: string;
  country: string;
  status: string;
}
interface FlightDelayMarker extends BaseMarker {
  _kind: 'flightDelay';
  id: string;
  iata: string;
  name: string;
  city: string;
  country: string;
  severity: string;
  delayType: string;
  avgDelayMinutes: number;
  reason: string;
}
interface AircraftPositionMarker extends BaseMarker {
  _kind: 'aircraftPos';
  icao24: string;
  callsign: string;
  altitudeFt: number;
  groundSpeedKts: number;
  trackDeg: number;
  verticalRate: number;
  onGround: boolean;
  source: string;
  observedAt: Date;
}
interface NewsLocationMarker extends BaseMarker {
  _kind: 'newsLocation';
  id: string;
  title: string;
  threatLevel: string;
  timestamp?: Date;
}
interface FlashMarker extends BaseMarker {
  _kind: 'flash';
  id: string;
}
interface CableAdvisoryMarker extends BaseMarker {
  _kind: 'cableAdvisory';
  id: string;
  cableId: string;
  title: string;
  severity: string;
  impact: string;
  repairEta: string;
}
interface RepairShipMarker extends BaseMarker {
  _kind: 'repairShip';
  id: string;
  name: string;
  status: string;
  eta: string;
  operator: string;
}
interface AisDisruptionMarker extends BaseMarker {
  _kind: 'aisDisruption';
  id: string;
  name: string;
  type: AisDisruptionType;
  severity: AisDisruptionEvent['severity'];
  description: string;
}
interface GlobePath {
  id: string;
  name: string;
  points: [number, number][];
  pathType: 'cable' | 'oil' | 'gas' | 'products' | 'boundary';
  status: string;
}
interface GlobePolygon {
  coords: number[][][];
  name: string;
  id?: string;
  _kind: 'cii' | 'conflict';
  level?: string;
  score?: number;

  intensity?: string;
  parties?: string[];
  casualties?: string;
}
type GlobeMarker =
  | ConflictMarker | HotspotMarker | FlightMarker | VesselMarker
  | WeatherMarker | NaturalMarker | IranMarker | OutageMarker
  | CyberMarker | FireMarker | ProtestMarker
  | UcdpMarker | DisplacementMarker | ClimateMarker | GpsJamMarker | TechMarker
  | ConflictZoneMarker | MilBaseMarker | NuclearSiteMarker | IrradiatorSiteMarker | SpaceportSiteMarker
  | EarthquakeMarker | EconomicMarker | DatacenterMarker | WaterwayMarker | MineralMarker
  | FlightDelayMarker | CableAdvisoryMarker | RepairShipMarker | AisDisruptionMarker
  | NewsLocationMarker | FlashMarker | AircraftPositionMarker;

interface GlobeControlsLike {
  autoRotate: boolean;
  autoRotateSpeed: number;
  enablePan: boolean;
  enableZoom: boolean;
  zoomSpeed: number;
  minDistance: number;
  maxDistance: number;
  enableDamping: boolean;
}

export class GlobeMap {
  private static readonly MAX_GLOBE_ZOOM_LEVEL = 4;
  private static readonly MIN_ALTITUDE_FOR_MAX_ZOOM = 0.5;

  private container: HTMLElement;
  private globe: GlobeInstance | null = null;
  private unsubscribeGlobeQuality: (() => void) | null = null;
  private unsubscribeGlobeTexture: (() => void) | null = null;
  private controls: GlobeControlsLike | null = null;
  private renderPaused = false;
  private outerGlow: any = null;
  private innerGlow: any = null;
  private starField: any = null;
  private cyanLight: any = null;
  private satOrbits: Array<{ group: any; sprite: any; r: number; phase: number; speed: number }> = [];
  private extrasAnimFrameId: number | null = null;
  private pendingFlushWhilePaused = false;
  private globeDataWorker: Worker | null = null;
  private workerStaticReady = false;
  private controlsAutoRotateBeforePause: boolean | null = null;
  private controlsDampingBeforePause: boolean | null = null;
  private adaptiveQualityIntervalId: ReturnType<typeof setTimeout> | null = null;
  private lastAdaptiveQualityBucket: 'far' | 'mid' | 'near' | null = null;
  private lastAppliedPixelRatio: number | null = null;
  private lastAppliedRenderWidth = 0;
  private lastAppliedRenderHeight = 0;
  private debugOverlayEl: HTMLElement | null = null;
  private debugOverlayIntervalId: ReturnType<typeof setTimeout> | null = null;

  private initialized = false;
  private destroyed = false;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private flushMaxTimer: ReturnType<typeof setTimeout> | null = null;
  private _pulseEnabled = true;
  private reversedRingCache = new Map<string, number[][][]>();

  // Current data
  private hotspots: HotspotMarker[] = [];
  private confirmedMilitaryFlights: FlightMarker[] = [];
  private unknownAircraftFlights: FlightMarker[] = [];
  private vessels: VesselMarker[] = [];
  /** Full source objects, keyed by id — used to supply complete data to MapPopup */
  private flightDataMap = new Map<string, MilitaryFlight>();
  private vesselDataMap = new Map<string, MilitaryVessel>();
  private weatherMarkers: WeatherMarker[] = [];
  private naturalMarkers: NaturalMarker[] = [];
  private iranMarkers: IranMarker[] = [];
  private outageMarkers: OutageMarker[] = [];
  private cyberMarkers: CyberMarker[] = [];
  private fireMarkers: FireMarker[] = [];
  private protestMarkers: ProtestMarker[] = [];
  private ucdpMarkers: UcdpMarker[] = [];
  private displacementMarkers: DisplacementMarker[] = [];
  private climateMarkers: ClimateMarker[] = [];
  private gpsJamMarkers: GpsJamMarker[] = [];
  private techMarkers: TechMarker[] = [];
  private conflictZoneMarkers: ConflictZoneMarker[] = [];
  private milBaseMarkers: MilBaseMarker[] = [];
  private nuclearSiteMarkers: NuclearSiteMarker[] = [];
  private irradiatorSiteMarkers: IrradiatorSiteMarker[] = [];
  private spaceportSiteMarkers: SpaceportSiteMarker[] = [];
  private earthquakeMarkers: EarthquakeMarker[] = [];
  private economicMarkers: EconomicMarker[] = [];
  private datacenterMarkers: DatacenterMarker[] = [];
  private waterwayMarkers: WaterwayMarker[] = [];
  private mineralMarkers: MineralMarker[] = [];
  private flightDelayMarkers: FlightDelayMarker[] = [];
  private aircraftPositionMarkers: AircraftPositionMarker[] = [];
  private aircraftFetchTimer: ReturnType<typeof setTimeout> | null = null;
  private aircraftFetchSeq = 0;
  private newsLocationMarkers: NewsLocationMarker[] = [];
  private flashMarkers: FlashMarker[] = [];
  private cableAdvisoryMarkers: CableAdvisoryMarker[] = [];
  private repairShipMarkers: RepairShipMarker[] = [];
  private aisMarkers: AisDisruptionMarker[] = [];
  private tradeRouteSegments: TradeRouteSegment[] = [];
  private globePaths: GlobePath[] = [];
  private cableFaultIds = new Set<string>();
  private cableDegradedIds = new Set<string>();
  private ciiScoresMap: Map<string, { score: number; level: string }> = new Map();
  private countriesGeoData: FeatureCollection<Geometry> | null = null;

  // Current layers state
  private layers: MapLayers;
  private timeRange: TimeRange;
  private currentView: MapView = 'global';

  // Click callbacks
  private onHotspotClickCb: ((h: Hotspot) => void) | null = null;

  // Auto-rotate timer (like Sentinel: resume after 60 s idle)
  private autoRotateTimer: ReturnType<typeof setTimeout> | null = null;

  // Overlay UI elements
  private layerTogglesEl: HTMLElement | null = null;
  private popup!: MapPopup;
  private hoverTooltipEl: HTMLElement | null = null;
  private loadingOverlayEl: HTMLElement | null = null;
  private loadingOverlayFallbackTimer: ReturnType<typeof setTimeout> | null = null;
  private spinToggleBtnEl: HTMLButtonElement | null = null;
  private autoSpinEnabled = false;

  // Callbacks
  private onLayerChangeCb: ((layer: keyof MapLayers, enabled: boolean, source: 'user' | 'programmatic') => void) | null = null;

  constructor(container: HTMLElement, initialState: MapContainerState) {
    this.container = container;
    this.layers = { ...initialState.layers };
    this.timeRange = initialState.timeRange;
    this.currentView = initialState.view;

    this.container.classList.add('globe-mode');
    this.container.style.cssText = 'width:100%;height:100%;background:#000;position:relative;direction:ltr;';
    this.popup = new MapPopup(this.container);

    // Initialize worker to prepare static datasets off the main thread
    this.globeDataWorker = new Worker(
      new URL('@/workers/globe-data.worker.ts', import.meta.url),
      { type: 'module' },
    );
    this.globeDataWorker.onmessage = (e: MessageEvent<GlobeStaticReadyMessage>) => {
      if (e.data.type === 'static-ready' && !this.destroyed) {
        this.milBaseMarkers = e.data.milBaseMarkers;
        this.nuclearSiteMarkers = e.data.nuclearSiteMarkers;
        this.irradiatorSiteMarkers = e.data.irradiatorSiteMarkers;
        this.spaceportSiteMarkers = e.data.spaceportSiteMarkers;
        this.economicMarkers = e.data.economicMarkers;
        this.datacenterMarkers = e.data.datacenterMarkers;
        this.waterwayMarkers = e.data.waterwayMarkers;
        this.mineralMarkers = e.data.mineralMarkers;
        this.tradeRouteSegments = e.data.tradeRouteSegments;
        this.globePaths = e.data.globePaths;
        this.workerStaticReady = true;
        // Only flush if globe is already initialized;
        // otherwise initGlobe() will flush after it finishes.
        if (this.initialized) {
          this.flushMarkers();
          this.flushArcs();
          this.flushPaths();
        }
      }
    };
    this.globeDataWorker.postMessage({ type: 'init' });

    this.initGlobe().catch(err => {
      console.error('[GlobeMap] Init failed:', err);
    });
  }

  private async initGlobe(): Promise<void> {
    if (this.destroyed) return;

    const desktop = isDesktopRuntime();
    const initialScale = getGlobeRenderScale();
    const initialPixelRatio = desktop
      ? Math.min(resolveGlobePixelRatio(initialScale), 1.25)
      : resolveGlobePixelRatio(initialScale);
    const config: ConfigOptions = {
      animateIn: false,
      rendererConfig: {
        // Desktop (Tauri/WebView2) can fall back to software rendering on some machines.
        // Keep defaults conservative to avoid 1fps reports (see #930).
        powerPreference: desktop ? 'high-performance' : 'default',
        logarithmicDepthBuffer: !desktop,
        antialias: initialPixelRatio > 1,
      },
    };

    const globe = new Globe(this.container, config) as GlobeInstance;

    if (this.destroyed) {
      globe._destructor();
      return;
    }

    this.unsubscribeGlobeQuality?.();
    this.unsubscribeGlobeQuality = subscribeGlobeRenderScaleChange((scale) => {
      this.applyRenderQuality(scale);
      this.applyPerformanceProfile(resolvePerformanceProfile(scale));
    });

    this.startAdaptiveQualityMonitor();

    // Initial sizing: use container dimensions, fall back to window if not yet laid out
    const initW = this.container.clientWidth || window.innerWidth;
    const initH = this.container.clientHeight || window.innerHeight;

    const initialTexture = getGlobeTexture();

    // Preload the texture via a plain <img> to prime the browser cache before
    // globe.gl's TextureLoader requests it — reduces the race window that causes
    // the white-sphere glitch on first load.
    const _preloadImg = new Image();
    _preloadImg.src = GLOBE_TEXTURE_URLS[initialTexture];

    globe
      .globeImageUrl(GLOBE_TEXTURE_URLS[initialTexture])
      .backgroundImageUrl('')
      .atmosphereColor('#4466cc')
      .atmosphereAltitude(0.18)
      .width(initW)
      .height(initH)
      .pathTransitionDuration(0);

    // Dismiss loading overlay once the globe mesh + texture have rendered for the first time.
    // rAF ensures at least one browser paint cycle shows the overlay (handles cached-texture
    // scenarios where onGlobeReady fires synchronously before the first frame is painted).
    (globe as any).onGlobeReady(() => {
      requestAnimationFrame(() => { if (!this.destroyed) this.hideLoadingOverlay(); });
    });

    // Orbit controls — match Sentinel's settings
    const controls = globe.controls() as GlobeControlsLike;
    this.controls = controls;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0.3;
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.zoomSpeed = 1.4;
    // globe.gl radius is ~100 world units; distance 150 ~= altitude 0.5 (zoom level 4 cap)
    controls.minDistance = 150;
    controls.maxDistance = 600;
    controls.enableDamping = !desktop;

    // Force the canvas to visually fill the container so it expands with CSS transitions.
    // globe.gl sets explicit width/height attributes; we override the CSS so the canvas
    // always covers the full container even before the next renderer resize fires.
    const glCanvas = this.container.querySelector('canvas');
    if (glCanvas) {
      (glCanvas as HTMLElement).style.cssText =
        'position:absolute;top:0;left:0;width:100% !important;height:100% !important;';

      // Re-apply texture after a WebGL context restore (GPU crash, tab background, etc.)
      // Without this the sphere stays white until a manual texture change.
      glCanvas.addEventListener('webglcontextrestored', () => {
        if (this.globe && !this.destroyed) {
          this.globe.globeImageUrl(GLOBE_TEXTURE_URLS[getGlobeTexture()]);
        }
      });
    }

    // Globe attribution (texture + OpenStreetMap data)
    const attribution = document.createElement('div');
    attribution.className = 'map-attribution';
    attribution.innerHTML = '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> © <a href="https://www.naturalearthdata.com" target="_blank" rel="noopener">Natural Earth</a>';
    this.container.appendChild(attribution);

    // Upgrade material to MeshStandardMaterial + add scene enhancements
    setTimeout(async () => {
      try {
        const THREE = await import('three');
        const scene = globe.scene();

        // --- Material: MeshStandardMaterial with emissive glow ---
        const oldMat = globe.globeMaterial();
        if (oldMat) {
          const stdMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.8,
            metalness: 0.1,
            emissive: new THREE.Color(0x0a1f2e),
            emissiveIntensity: 0.3,
          });
          // Copy texture map if it already finished loading; then always re-apply
          // the URL so globe.gl re-loads it into the new material. This guards
          // against the race where the texture is still in-flight at swap time,
          // which would otherwise leave the sphere white.
          if ((oldMat as any).map) stdMat.map = (oldMat as any).map;
          (globe as any).globeMaterial(stdMat);
          globe.globeImageUrl(GLOBE_TEXTURE_URLS[getGlobeTexture()]);
        }

        // --- Lighting: cyan backlight ---
        this.cyanLight = new THREE.PointLight(0x00d4ff, 0.3);
        this.cyanLight.position.set(-10, -10, -10);
        scene.add(this.cyanLight);

        // --- Dual atmosphere glow layers ---
        const outerGeo = new THREE.SphereGeometry(2.15, 64, 64);
        const outerMat = new THREE.MeshBasicMaterial({
          color: 0x00d4ff,
          side: THREE.BackSide,
          transparent: true,
          opacity: 0.15,
        });
        this.outerGlow = new THREE.Mesh(outerGeo, outerMat);
        scene.add(this.outerGlow);

        const innerGeo = new THREE.SphereGeometry(2.08, 64, 64);
        const innerMat = new THREE.MeshBasicMaterial({
          color: 0x00a8cc,
          side: THREE.BackSide,
          transparent: true,
          opacity: 0.1,
        });
        this.innerGlow = new THREE.Mesh(innerGeo, innerMat);
        scene.add(this.innerGlow);

        // --- Procedural starfield ---
        // Keep stars on a much larger shell than the globe radius (100)
        // so they read as deep background space.
        const starCount = 3300;
        const starPositions = new Float32Array(starCount * 3);
        const starColors = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount; i++) {
          const r = 320 + Math.random() * 520;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
          starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
          starPositions[i * 3 + 2] = r * Math.cos(phi);
          const brightness = 0.68 + Math.random() * 0.32;
          starColors[i * 3] = brightness;
          starColors[i * 3 + 1] = brightness;
          starColors[i * 3 + 2] = brightness;
        }
        const starGeo = new THREE.BufferGeometry();
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
        const starMat = new THREE.PointsMaterial({
          size: 0.20,
          sizeAttenuation: true,
          vertexColors: true,
          transparent: true,
          opacity: 0.95,
          depthWrite: false,
          depthTest: true,
        });
        this.starField = new THREE.Points(starGeo, starMat);
        // Draw stars first as background so the globe always appears in front.
        this.starField.renderOrder = -100;
        this.starField.frustumCulled = false;
        scene.add(this.starField);

        // --- Orbiting satellite sprites ---
        // Globe.gl GLOBE_RADIUS = 100 in Three.js world units.
        // Satellites orbit at r=110–130 (10–30 % above the surface).
        const satCanvas = document.createElement('canvas');
        satCanvas.width = 64;
        satCanvas.height = 64;
        const satCtx = satCanvas.getContext('2d')!;
        // Scale 64×64 canvas to match SVG viewBox (24×24)
        satCtx.scale(64 / 24, 64 / 24);
        satCtx.fillStyle = 'rgba(255,255,255,0.95)';
        // SVG path from satellite-3-f-svgrepo-com.svg
        satCtx.fill(new Path2D(
          'M1 9H0a15.018 15.018 0 0 0 15 15v-1A14.015 14.015 0 0 1 1 9zm4 0H4a11.007 11.007 0 0 0 11 11v-1A10.016 10.016 0 0 1 5 9zm4 0H8a7.008 7.008 0 0 0 7 7v-1a6.005 6.005 0 0 1-6-6zm15 5.29l-4.5-4.5-1 1-1.29-1.29 2-2-2.71-2.71-2 2-1.29-1.29 1-1L9.71 0h-.42l-2.5 2.5 4.71 4.71 1-1 1.29 1.29-2 2 2.71 2.71 2-2 1.29 1.29-1 1 4.71 4.71 2.5-2.5z'
        ));
        const satTex = new THREE.CanvasTexture(satCanvas);

        // 5 orbital planes: ISS-like, SSO, equatorial, Molniya-like, polar
        // Globe surface = 100 world units. Low-to-mid orbit: r=102–105 (2–5% above surface).
        // Slow angular speeds (rad/s) to convey vast Earth-scale distances.
        const SAT_ORBIT_CONFIGS = [
          { r: 102.5, incl: 51.6, raan:   0, phase: 0.0, speed: 0.008 },
          { r: 104.0, incl: 98.0, raan:  72, phase: 1.2, speed: 0.006 },
          { r: 101.8, incl: 10.0, raan: 360, phase: 2.5, speed: 0.010 },
          { r: 103.2, incl: 63.4, raan: 216, phase: 0.8, speed: 0.005 },
          { r: 102.0, incl: 90.0, raan: 288, phase: 3.7, speed: 0.007 },
        ] as const;

        for (const orb of SAT_ORBIT_CONFIGS) {
          const spriteMat = new THREE.SpriteMaterial({
            map: satTex,
            transparent: true,
            opacity: 0.90,
            depthWrite: false,
            // depthTest: true (default) — satellites are occluded by the globe
            // on the far hemisphere and reappear on the near side, giving true
            // 3D orbital behaviour identical to how globe.gl HTML markers work.
          });
          const sprite = new THREE.Sprite(spriteMat);
          sprite.scale.set(1.3, 1.3, 1);
          const group = new THREE.Group();
          group.rotation.order = 'YXZ';
          // rotation.y = RAAN: rotates the node around the polar (Y) axis
          group.rotation.y = orb.raan * (Math.PI / 180);
          // rotation.x = inclination: tilts the orbital plane away from equatorial (XZ) plane
          group.rotation.x = orb.incl * (Math.PI / 180);
          sprite.position.set(orb.r, 0, 0);
          group.add(sprite);
          scene.add(group);
          this.satOrbits.push({ group, sprite, r: orb.r, phase: orb.phase, speed: orb.speed });
        }

        const animateExtras = () => {
          if (this.destroyed) return;
          if (this.outerGlow) this.outerGlow.rotation.y += 0.0003;
          if (this.starField) this.starField.rotation.y += 0.00005;
          const tSec = Date.now() * 0.001;
          for (const sat of this.satOrbits) {
            const angle = sat.phase + tSec * sat.speed;
            sat.sprite.position.set(sat.r * Math.cos(angle), 0, sat.r * Math.sin(angle));
          }
          this.extrasAnimFrameId = requestAnimationFrame(animateExtras);
        };
        animateExtras();
      } catch {
        // enhancements are cosmetic — ignore
      }
    }, 800);

    // Subscribe to texture changes
    this.unsubscribeGlobeTexture = subscribeGlobeTextureChange((texture) => {
      if (this.globe) {
        this.globe.globeImageUrl(GLOBE_TEXTURE_URLS[texture]);
        // Re-tune sampling after texture swaps to keep quality consistent.
        this.applyAdaptiveTextureSampling();
      }
    });

    // Pause auto-rotate on user interaction; resume after 60 s idle (like Sentinel)
    const pauseAutoRotate = () => {
      if (this.renderPaused) return;
      controls.autoRotate = false;
      if (this.autoRotateTimer) clearTimeout(this.autoRotateTimer);
    };
    const scheduleResumeAutoRotate = () => {
      if (this.renderPaused) return;
      if (!this.autoSpinEnabled) return;
      if (this.autoRotateTimer) clearTimeout(this.autoRotateTimer);
      this.autoRotateTimer = setTimeout(() => {
        if (!this.renderPaused) controls.autoRotate = this.autoSpinEnabled;
      }, 60_000);
    };

    const canvas = this.container.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('mousedown', pauseAutoRotate);
      canvas.addEventListener('touchstart', pauseAutoRotate, { passive: true });
      canvas.addEventListener('mouseup', scheduleResumeAutoRotate);
      canvas.addEventListener('touchend', scheduleResumeAutoRotate);
    }

    // Wire HTML marker layer
    globe
      .htmlElementsData([])
      .htmlLat((d: object) => (d as GlobeMarker)._lat)
      .htmlLng((d: object) => (d as GlobeMarker)._lng)
      .htmlAltitude((d: object) => {
        const m = d as GlobeMarker;
        if (m._kind === 'flight' || m._kind === 'vessel') return 0.012;
        if (m._kind === 'aircraftPos') return (m as AircraftPositionMarker).onGround ? 0.001 : 0.009;
        if (m._kind === 'hotspot') return 0.005;
        return 0.003;
      })
      .htmlElement((d: object) => this.buildMarkerElement(d as GlobeMarker));

    // Arc accessors — set once, only data changes on flush

    (globe as any)
      .arcStartLat((d: TradeRouteSegment) => d.sourcePosition[1])
      .arcStartLng((d: TradeRouteSegment) => d.sourcePosition[0])
      .arcEndLat((d: TradeRouteSegment) => d.targetPosition[1])
      .arcEndLng((d: TradeRouteSegment) => d.targetPosition[0])
      .arcColor((d: TradeRouteSegment) => {
        if (d.status === 'disrupted') return ['rgba(255,32,32,0.1)', 'rgba(255,32,32,0.8)', 'rgba(255,32,32,0.1)'];
        if (d.status === 'high_risk') return ['rgba(255,180,0,0.1)', 'rgba(255,180,0,0.7)', 'rgba(255,180,0,0.1)'];
        if (d.category === 'energy') return ['rgba(255,140,0,0.05)', 'rgba(255,140,0,0.6)', 'rgba(255,140,0,0.05)'];
        if (d.category === 'container') return ['rgba(68,136,255,0.05)', 'rgba(68,136,255,0.6)', 'rgba(68,136,255,0.05)'];
        return ['rgba(68,204,136,0.05)', 'rgba(68,204,136,0.6)', 'rgba(68,204,136,0.05)'];
      })
      .arcAltitudeAutoScale(0.3)
      .arcStroke(0.5)
      .arcDashLength(0.9)
      .arcDashGap(4)
      .arcDashAnimateTime(5000)
      .arcLabel((d: TradeRouteSegment) => `${d.routeName} · ${d.volumeDesc}`);

    // Path accessors — set once
    (globe as any)
      .pathPoints((d: GlobePath) => d.points)
      .pathPointLat((p: [number, number]) => p[1])
      .pathPointLng((p: [number, number]) => p[0])
      .pathColor((d: GlobePath) => {
        if (d.pathType === 'cable') {
          if (this.cableFaultIds.has(d.id)) return '#ff3030';
          if (this.cableDegradedIds.has(d.id)) return '#ff8800';
          return 'rgba(0,200,255,0.65)';
        }
        if (d.pathType === 'boundary') return 'rgba(255,215,0,0.75)';
        if (d.pathType === 'oil') return 'rgba(255,140,0,0.6)';
        if (d.pathType === 'gas') return 'rgba(80,220,120,0.6)';
        return 'rgba(180,160,255,0.6)';
      })
      .pathStroke((d: GlobePath) => d.pathType === 'cable' ? 0.3 : d.pathType === 'boundary' ? 0.9 : 0.6)
      .pathDashLength((d: GlobePath) => d.pathType === 'cable' ? 1 : d.pathType === 'boundary' ? 0.4 : 0.6)
      .pathDashGap((d: GlobePath) => d.pathType === 'cable' ? 0 : d.pathType === 'boundary' ? 0.2 : 0.25)
      .pathDashAnimateTime((d: GlobePath) => (d.pathType === 'cable' || d.pathType === 'boundary') ? 0 : 5000)
      .pathLabel((d: GlobePath) => d.name);

    // Polygon accessors — set once
    (globe as any)
      .polygonGeoJsonGeometry((d: GlobePolygon) => ({ type: 'Polygon', coordinates: d.coords }))
      .polygonCapColor((d: GlobePolygon) => {
        if (d._kind === 'cii') return GlobeMap.CII_GLOBE_COLORS[d.level!] ?? 'rgba(0,0,0,0)';
        if (d._kind === 'conflict') return GlobeMap.CONFLICT_CAP[d.intensity!] ?? GlobeMap.CONFLICT_CAP.low;
        return 'rgba(255,60,60,0.15)';
      })
      .polygonSideColor((d: GlobePolygon) => {
        if (d._kind === 'cii') return 'rgba(0,0,0,0)';
        if (d._kind === 'conflict') return GlobeMap.CONFLICT_SIDE[d.intensity!] ?? GlobeMap.CONFLICT_SIDE.low;
        return 'rgba(255,60,60,0.08)';
      })
      .polygonStrokeColor((d: GlobePolygon) => {
        if (d._kind === 'cii') return 'rgba(80,80,80,0.3)';
        if (d._kind === 'conflict') return GlobeMap.CONFLICT_STROKE[d.intensity!] ?? GlobeMap.CONFLICT_STROKE.low;
        return '#ff4444';
      })
      .polygonAltitude((d: GlobePolygon) => {
        if (d._kind === 'cii') return 0.002;
        if (d._kind === 'conflict') return GlobeMap.CONFLICT_ALT[d.intensity!] ?? GlobeMap.CONFLICT_ALT.low;
        return 0.005;
      })
      .polygonLabel((d: GlobePolygon) => {
        if (d._kind === 'cii') {
          const locName = getLocalizedGeoName(d.name) || d.name;
          return `<b>${escapeHtml(locName)}</b><br/>CII: ${d.score}/100 (${escapeHtml(d.level ?? '')})`;
        }
        if (d._kind === 'conflict') {
          const czKey = `geo.conflictZones.${d.id}`;
          const czName = t(czKey) !== czKey ? t(czKey) : d.name;
          let label = `<b>${escapeHtml(czName)}</b>`;
          if (d.parties?.length) label += `<br/>${escapeHtml(t('popups.ucdpEvent.parties'))}: ${d.parties.map(p => escapeHtml(p)).join(', ')}`;
          if (d.casualties) label += `<br/>${escapeHtml(t('popups.casualties'))}: ${escapeHtml(d.casualties)}`;
          return label;
        }
        return escapeHtml(d.name);
      });

    this.globe = globe;
    this.initialized = true;

    // Apply initial render quality + performance profile
    this.applyRenderQuality(initialScale);
    this.applyPerformanceProfile(resolvePerformanceProfile(initialScale));

    // Add overlay UI (zoom controls + layer panel)
    this.createControls();
    this.createLayerToggles();

    // Loading overlay must be appended AFTER all globe.gl and UI elements so it is
    // the last DOM child — guaranteeing it sits on top in paint order.
    this.createLoadingOverlay();
    this.createDebugOverlay();

    // Load static datasets (hotspots + conflict zones loaded synchronously;
    // remaining static layers arrive asynchronously from globe-data.worker)
    this.setHotspots(INTEL_HOTSPOTS);
    this.setConflictZones();

    // Navigate to initial view
    this.setView(this.currentView);

    // dayNight toggle excluded by catalog (renderers: ['flat'])

    // Flush any data that arrived before init completed
    this.flushMarkers();
    this.flushArcs();
    this.flushPaths();
    this.flushPolygons();

    // If worker static data already arrived during init, ensure it's flushed now
    if (this.workerStaticReady) {
      this.flushMarkers();
      this.flushArcs();
      this.flushPaths();
    }

    // Load countries GeoJSON for CII choropleth
    getCountriesGeoJson().then(geojson => {
      if (geojson && !this.destroyed) {
        this.countriesGeoData = geojson;
        this.reversedRingCache.clear();
        this.flushPolygons();
      }
    }).catch(err => { if (import.meta.env.DEV) console.warn('[GlobeMap] Failed to load countries GeoJSON', err); });
  }

  // ─── Marker element builder ────────────────────────────────────────────────

  private pulseStyle(duration: string): string {
    return this._pulseEnabled ? `animation:globe-pulse ${duration} ease-out infinite;` : 'animation:none;';
  }

  private isConfirmedMilitaryFlight(flight: MilitaryFlight): boolean {
    return isConfirmedMilitaryFlightRecord(flight);
  }

  private isLikelyMilitaryPosition(position: PositionSample): boolean {
    const callsign = (position.callsign || '').trim();
    if (callsign && identifyByCallsign(callsign)) return true;
    return Boolean(isKnownMilitaryHex(position.icao24));
  }

  private buildMarkerElement(d: GlobeMarker): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = 'pointer-events:auto;cursor:pointer;user-select:none;';

    if (d._kind === 'conflict') {
      const size = Math.min(12, 6 + (d.fatalities ?? 0) * 0.4);
      el.innerHTML = `
        <div style="position:relative;width:${size}px;height:${size}px;">
          <div style="
            position:absolute;inset:0;border-radius:50%;
            background:rgba(255,50,50,0.85);
            border:1.5px solid rgba(255,120,120,0.9);
            box-shadow:0 0 6px 2px rgba(255,50,50,0.5);
          "></div>
          <div style="
            position:absolute;inset:-4px;border-radius:50%;
            background:rgba(255,50,50,0.2);
            ${this.pulseStyle('2s')}
          "></div>
        </div>`;
      el.title = `${d.location}`;
    } else if (d._kind === 'hotspot') {
      const colors: Record<number, string> = { 5: '#ff2020', 4: '#ff6600', 3: '#ffaa00', 2: '#ffdd00', 1: '#88ff44' };
      const c = colors[d.escalationScore] ?? '#ffaa00';
      el.innerHTML = svgIcon('hotspot', c, 15);
      const hsKey = `geo.hotspots.${d.id}`;
      el.title = t(hsKey) !== hsKey ? t(hsKey) : d.name;
    } else if (d._kind === 'flight') {
      const heading = (d.heading ?? 0) - 90; // SVG points right, so subtract 90 to align with north-up heading
      const typeColors: Record<string, string> = {
        fighter:        '#ff4444',
        bomber:         '#ff8800',
        reconnaissance: '#44aaff',
        awacs:          '#3ce0ff',
        tanker:         '#88ff44',
        transport:      '#aaaaff',
        helicopter:     '#ffff44',
        drone:          '#ff44ff',
        patrol:         '#44ffcc',
        special_ops:    '#ffa040',
        vip:            '#dd99ff',
        unknown:        '#cccccc',
      };
      const isInteresting = (d as unknown as { isInteresting?: boolean }).isInteresting;
      const color = isInteresting ? '#ffd200' : (typeColors[d.type] ?? '#cccccc');
      const iconHtml = svgIcon(d.isCivilian ? 'plane-civilian' : 'plane', color, isInteresting ? 17 : 15);
      const strokeRing = isInteresting
        ? `<div style="position:absolute;inset:-5px;border-radius:50%;"></div>`
        : '';
      el.innerHTML = `<div style="position:relative;display:inline-block;line-height:0;">${strokeRing}<div style="transform:rotate(${heading}deg);display:inline-block;line-height:0;">${iconHtml}</div></div>`;
      el.title = `${d.callsign} (${d.type})${isInteresting ? ' ★' : ''}`;
    } else if (d._kind === 'vessel') {
      const typeColors: Record<string, string> = {
        carrier: '#ff4444', destroyer: '#ff8800', submarine: '#8844ff',
        frigate: '#44aaff', amphibious: '#88ff44', support: '#aaaaaa',
      };
      const c = typeColors[d.type] ?? '#44aaff';
      el.innerHTML = d.type === 'carrier' ? svgIcon('carrier', c, 32) : svgIcon('vessel', c, 28);
      el.title = `${d.name} (${d.type})`;
    } else if (d._kind === 'weather') {
      const severityColors: Record<string, string> = {
        Extreme: '#ff0044', Severe: '#ff6600', Moderate: '#ffaa00', Minor: '#88aaff',
      };
      const c = severityColors[d.severity] ?? '#88aaff';
      el.innerHTML = svgIcon('lightning', c, 11);
      el.title = d.headline;
    } else if (d._kind === 'natural') {
      el.innerHTML = getNaturalEventIcon(d.category as NaturalEventCategory, 12);
      el.title = d.title;
    } else if (d._kind === 'iran') {
      const sc = (d.severity === 'high' || d.severity === 'critical') ? '#ff3030' : d.severity === 'medium' ? '#ff8800' : '#ffcc00';
      el.innerHTML = `
        <div style="position:relative;width:9px;height:9px;">
          <div style="position:absolute;inset:0;border-radius:50%;background:${sc};border:1.5px solid rgba(255,255,255,0.5);box-shadow:0 0 5px 2px ${sc}88;"></div>
          <div style="position:absolute;inset:-4px;border-radius:50%;background:${sc}33;${this.pulseStyle('2s')}"></div>
        </div>`;
      el.title = d.title;
    } else if (d._kind === 'outage') {
      const sc = d.severity === 'total' ? '#ff2020' : d.severity === 'major' ? '#ff8800' : '#ffcc00';
      el.innerHTML = svgIcon('satellite-dish', sc, 12);
      el.title = `${d.country}: ${d.title}`;
    } else if (d._kind === 'cyber') {
      const sc = d.severity === 'critical' ? '#ff0044' : d.severity === 'high' ? '#ff4400' : d.severity === 'medium' ? '#ffaa00' : '#44aaff';
      el.innerHTML = svgIcon('shield', sc, 11);
      el.title = `${d.type}: ${d.indicator}`;
    } else if (d._kind === 'fire') {
      const intensity = d.brightness > 400 ? '#ff2020' : d.brightness > 330 ? '#ff6600' : '#ffaa00';
      el.innerHTML = svgIcon('fire', intensity, 11);
      el.title = `${t('components.satelliteFires.fires')} — ${d.region}`;
    } else if (d._kind === 'protest') {
      const typeColors: Record<string, string> = {
        riot: '#ff3030', protest: '#ffaa00', strike: '#44aaff',
        demonstration: '#88ff44', civil_unrest: '#ff6600',
      };
      const c = typeColors[d.eventType] ?? '#ffaa00';
      el.innerHTML = svgIcon('megaphone', c, 12);
      el.title = d.title;
    } else if (d._kind === 'ucdp') {
      const size = Math.min(10, 5 + (d.deaths || 0) * 0.3);
      el.innerHTML = `
        <div style="position:relative;width:${size}px;height:${size}px;">
          <div style="position:absolute;inset:0;border-radius:50%;background:rgba(255,100,0,0.85);border:1.5px solid rgba(255,160,80,0.9);box-shadow:0 0 5px 2px rgba(255,100,0,0.5);"></div>
        </div>`;
      el.title = `${d.sideA} ${t('common.vs')} ${d.sideB}`;
    } else if (d._kind === 'displacement') {
      el.innerHTML = svgIcon('people', '#88bbff', 12);
      el.title = `${d.origin} → ${d.asylum}`;
    } else if (d._kind === 'climate') {
      const typeColors: Record<string, string> = { warm: '#ff4400', cold: '#44aaff', wet: '#00ccff', dry: '#ff8800', mixed: '#88ff88' };
      const c = typeColors[d.type] ?? '#88ff88';
      el.innerHTML = svgIcon('thermometer', c, 11);
      el.title = `${d.zone} (${d.type})`;
    } else if (d._kind === 'gpsjam') {
      const c = d.level === 'high' ? '#ff2020' : '#ff8800';
      el.innerHTML = svgIcon('satellite-dish', c, 11);
      el.title = `${t('popups.gpsJamming.title')} (${d.level})`;
    } else if (d._kind === 'tech') {
      el.innerHTML = svgIcon('laptop', '#44aaff', 11);
      el.title = d.title;
    } else if (d._kind === 'conflictZone') {
      const intColor = d.intensity === 'high' ? '#ff2020' : d.intensity === 'medium' ? '#ff8800' : '#ffcc00';
      el.innerHTML = `
        <div style="position:relative;width:20px;height:20px;">
          <div style="
            position:absolute;inset:0;border-radius:50%;
            background:${intColor}33;
            border:1.5px solid ${intColor}99;
            box-shadow:0 0 6px 2px ${intColor}44;
          "></div>
          <div style="
            position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
            line-height:0;
          ">${svgIcon('conflict', intColor, 9)}</div>
        </div>`;
      const czKey = `geo.conflictZones.${d.id}`;
      el.title = t(czKey) !== czKey ? t(czKey) : d.name;
    } else if (d._kind === 'milbase') {
      const typeColors: Record<string, string> = {
        'us-nato': '#4488ff', uk: '#4488ff', france: '#4488ff',
        russia: '#ff4444', china: '#ff8844', india: '#ff8844',
        other: '#aaaaaa',
      };
      const c = typeColors[d.type] ?? '#aaaaaa';
      el.innerHTML = svgIcon('compass', c, 14);
      el.title = `${d.name}${d.country ? ' · ' + d.country : ''}`;
    } else if (d._kind === 'nuclearSite') {
      el.innerHTML = svgIcon('nuclear', '#ffd700', 15);
      el.title = `${d.name} (${d.type})`;
    } else if (d._kind === 'irradiator') {
      el.innerHTML = svgIcon('nuclear', '#cc88ff', 13);
      el.title = `${d.city}, ${d.country}`;
    } else if (d._kind === 'spaceport') {
      el.innerHTML = svgIcon('rocket', '#88ddff', 12);
      el.title = `${d.name} (${d.operator})`;
    } else if (d._kind === 'earthquake') {
      const mc = d.magnitude >= 6 ? '#ff2020' : d.magnitude >= 4 ? '#ff8800' : '#ffcc00';
      const sz = Math.max(8, Math.min(18, Math.round(d.magnitude * 2.5)));
      el.innerHTML = `<div style="width:${sz}px;height:${sz}px;border-radius:50%;background:${mc}44;border:2px solid ${mc};box-shadow:0 0 6px 2px ${mc}55;"></div>`;
      el.title = `M${d.magnitude.toFixed(1)} — ${d.place}`;
    } else if (d._kind === 'economic') {
      const ec = d.type === 'exchange' ? '#ffd700' : d.type === 'central-bank' ? '#4488ff' : '#44cc88';
      el.innerHTML = svgIcon('coin', ec, 12);
      el.title = `${d.name} · ${d.country}`;
    } else if (d._kind === 'datacenter') {
      el.innerHTML = svgIcon('server', '#88aaff', 11);
      el.title = `${d.name} (${d.owner})`;
    } else if (d._kind === 'waterway') {
      el.innerHTML = svgIcon('anchor', '#44aadd', 11);
      el.title = d.name;
    } else if (d._kind === 'mineral') {
      el.innerHTML = svgIcon('diamond', '#cc88ff', 11);
      el.title = `${d.mineral} — ${d.name}`;
    } else if (d._kind === 'flightDelay') {
      const sc = d.severity === 'severe' ? '#ff2020' : d.severity === 'major' ? '#ff6600' : d.severity === 'moderate' ? '#ffaa00' : '#ffee44';
      el.innerHTML = svgIcon('plane-civilian', sc, 12);
      el.title = `${d.iata} — ${d.severity}`;
    } else if (d._kind === 'cableAdvisory') {
      const sc = d.severity === 'fault' ? '#ff2020' : '#ff8800';
      el.innerHTML = svgIcon('plug', sc, 12);
      el.title = `${d.title} (${d.severity})`;
    } else if (d._kind === 'repairShip') {
      const sc = d.status === 'on-station' ? '#44ff88' : '#44aaff';
      el.innerHTML = svgIcon('repair-ship', sc, 12);
      el.title = d.name;
    } else if (d._kind === 'newsLocation') {
      const tc = d.threatLevel === 'critical' ? '#ff2020'
        : d.threatLevel === 'high' ? '#ff6600'
          : d.threatLevel === 'elevated' ? '#ffaa00'
            : '#44aaff';
      el.innerHTML = `
        <div style="position:relative;width:16px;height:16px;">
          <div style="position:absolute;inset:0;border-radius:50%;background:${tc}44;border:1.5px solid ${tc};box-shadow:0 0 5px 2px ${tc}55;"></div>
          <div style="position:absolute;inset:-5px;border-radius:50%;background:${tc}22;${this.pulseStyle('1.8s')}"></div>
        </div>`;
      el.title = d.title;
    } else if (d._kind === 'aisDisruption') {
      const sc = d.severity === 'high' ? '#ff2020' : d.severity === 'elevated' ? '#ff8800' : '#44aaff';
      el.innerHTML = svgIcon('anchor', sc, 12);
      el.title = d.name;
    } else if (d._kind === 'aircraftPos') {
      const acColor = d.onGround ? '#777777' : '#a064ff';
      const acSize = d.onGround ? 12 : 16;
      el.innerHTML = `
        <div style="transform:rotate(${(d.trackDeg ?? 0) +90}deg);display:inline-block;line-height:0;transition:transform 0.3s;filter:drop-shadow(0 0 5px ${acColor}99);">
          ${svgIcon('plane-civilian', acColor, acSize)}
        </div>`;
      el.title = d.callsign ? `${d.callsign} (${d.icao24})` : d.icao24;
    } else if (d._kind === 'flash') {
      el.style.pointerEvents = 'none';
      el.innerHTML = `
        <div style="position:relative;width:0;height:0;">
          <div style="position:absolute;width:44px;height:44px;border-radius:50%;
            border:2px solid rgba(255,255,255,0.9);background:rgba(255,255,255,0.2);
            left:-22px;top:-22px;
            ${this.pulseStyle('0.7s')}"></div>
        </div>`;
    }

    if (d._kind !== 'flash') {
      el.addEventListener('mouseenter', () => this.showHoverTooltip(d, el));
      el.addEventListener('mouseleave', () => this.hideHoverTooltip());
    }

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideHoverTooltip();
      this.handleMarkerClick(d, el, e as MouseEvent);
    });

    return el;
  }

  private handleMarkerClick(d: GlobeMarker, _anchor: HTMLElement, e: MouseEvent): void {
    if (d._kind === 'hotspot' && this.onHotspotClickCb) {
      this.onHotspotClickCb({
        id: d.id,
        name: d.name,
        lat: d._lat,
        lon: d._lng,
        keywords: [],
        escalationScore: d.escalationScore as Hotspot['escalationScore'],
      });
    }
    this.showMarkerPopup(d, e);
  }

  private showMarkerPopup(d: GlobeMarker, e: MouseEvent): void {
    if (d._kind === 'flash') return;

    const cr = this.container.getBoundingClientRect();
    // Use the raw click-event viewport coordinates (same approach as DeckGL's info.x/y)
    const x = e.clientX - cr.left;
    const y = e.clientY - cr.top;

    switch (d._kind) {
      case 'conflict': {
        const zone = CONFLICT_ZONES.find(z => z.id === d.id);
        if (zone) {
          this.popup.show({ type: 'conflict', data: zone as any, x, y });
        } else {
          this.popup.show({ type: 'conflict', data: { id: d.id, name: d.location, intensity: d.eventType as any, center: [d._lng, d._lat] as [number, number], startDate: '', parties: [], keyDevelopments: [] } as any, x, y });
        }
        break;
      }
      case 'hotspot': {
        const hs = INTEL_HOTSPOTS.find(h => h.id === d.id);
        const hotspot = (hs ?? d) as any;
        this.popup.show({ type: 'hotspot', data: hotspot, x, y });
        if (hs) void this.popup.loadHotspotGdeltContext(hs);
        break;
      }
      case 'conflictZone': {
        const zone = CONFLICT_ZONES.find(z => z.id === d.id);
        if (zone) {
          this.popup.show({ type: 'conflict', data: zone as any, x, y });
        } else {
          this.popup.show({ type: 'conflict', data: { id: d.id, name: d.name, intensity: d.intensity as any, center: [d._lng, d._lat] as [number, number], startDate: '', parties: d.parties, keyDevelopments: [], casualties: d.casualties } as any, x, y });
        }
        break;
      }
      case 'flight': {
        const fullFlight = this.flightDataMap.get(d.id);
        this.popup.show({ type: 'militaryFlight', data: (fullFlight ?? {
          id: d.id, callsign: d.callsign, hexCode: '', aircraftType: d.type as any,
          operator: 'other' as any, operatorCountry: '', lat: d._lat, lon: d._lng,
          altitude: 0, heading: d.heading, speed: 0, onGround: false,
          lastSeen: new Date(), confidence: 'low' as const,
        }) as any, x, y });
        break;
      }
      case 'vessel': {
        const fullVessel = this.vesselDataMap.get(d.id);
        this.popup.show({ type: 'militaryVessel', data: (fullVessel ?? {
          id: d.id, mmsi: '', name: d.name, vesselType: d.type as any,
          operator: 'other' as any, operatorCountry: '', lat: d._lat, lon: d._lng,
          heading: 0, speed: 0, lastAisUpdate: new Date(), confidence: 'low' as const,
        }) as any, x, y });
        break;
      }
      case 'milbase': {
        const base = (MILITARY_BASES as any[]).find(b => b.id === d.id);
        this.popup.show({ type: 'base', data: (base ?? {
          id: d.id, name: d.name, lat: d._lat, lon: d._lng, type: d.type, country: d.country,
        }) as any, x, y });
        break;
      }
      case 'nuclearSite': {
        const facility = (NUCLEAR_FACILITIES as any[]).find(f => f.id === d.id);
        this.popup.show({ type: 'nuclear', data: (facility ?? {
          id: d.id, name: d.name, lat: d._lat, lon: d._lng, type: d.type, status: d.status,
        }) as any, x, y });
        break;
      }
      case 'irradiator':    this.popup.show({ type: 'irradiator', data: d as any, x, y }); break;
      case 'spaceport':     this.popup.show({ type: 'spaceport', data: d as any, x, y }); break;
      case 'flightDelay':   this.popup.show({ type: 'flight', data: d as any, x, y }); break;
      case 'cableAdvisory': this.popup.show({ type: 'cable-advisory', data: d as any, x, y }); break;
      case 'repairShip':    this.popup.show({ type: 'repair-ship', data: d as any, x, y }); break;
      case 'aisDisruption': this.popup.show({ type: 'ais', data: d as any, x, y }); break;
      case 'gpsjam':        this.popup.show({ type: 'gpsJamming', data: { h3: d.id, lat: d._lat, lon: d._lng, level: d.level, pct: d.pct, good: 0, bad: 0, total: 0 } as any, x, y }); break;
      case 'newsLocation':  this.popup.show({ type: 'newsLocation', data: { title: d.title, lat: d._lat, lon: d._lng, threatLevel: d.threatLevel, timestamp: d.timestamp }, x, y }); break;
      case 'tech':          this.popup.show({ type: 'techEvent', data: d as any, x, y }); break;
      case 'aircraftPos':   this.popup.show({ type: 'aircraft', data: d as any, x, y }); break;
      case 'ucdp': {
        const ucdpData = d as UcdpMarker;
        this.popup.show({
          type: 'ucdpEvent',
          data: {
            id: ucdpData.id,
            date_start: ucdpData.dateStart,
            date_end: ucdpData.dateEnd,
            latitude: ucdpData._lat,
            longitude: ucdpData._lng,
            country: ucdpData.country,
            side_a: ucdpData.sideA,
            side_b: ucdpData.sideB,
            deaths_best: ucdpData.deaths,
            deaths_low: 0,
            deaths_high: 0,
            type_of_violence: ucdpData.typeOfViolence,
            source_original: ucdpData.sourceOriginal,
          } as any,
          x,
          y,
        });
        break;
      }
      // Types without a dedicated PopupType — use minimal fallback tooltip
      default:              this.showFallbackTooltip(d, e); break;
    }
  }

  /** Inject a loading overlay that hides the blank/loading globe until textures are ready. */
  private createLoadingOverlay(): void {
    const overlay = document.createElement('div');
    overlay.className = 'globe-loading-overlay';
    overlay.innerHTML = [
      '<div class="globe-loading-spinner"></div>',
      `<div class="globe-loading-text should-rtl">${t('components.globe.loadingGlobe')}</div>`,
    ].join('');
    this.container.appendChild(overlay);
    this.loadingOverlayEl = overlay;
    // Safety fallback: dismiss after 15 s even if onGlobeReady never fires (e.g. network failure)
    this.loadingOverlayFallbackTimer = setTimeout(() => this.hideLoadingOverlay(), 15_000);
  }

  private hideLoadingOverlay(): void {
    if (this.loadingOverlayFallbackTimer) {
      clearTimeout(this.loadingOverlayFallbackTimer);
      this.loadingOverlayFallbackTimer = null;
    }
    const el = this.loadingOverlayEl;
    if (!el) return;
    this.loadingOverlayEl = null;
    el.classList.add('globe-loading-fade');
    // Remove from DOM after the CSS transition completes
    setTimeout(() => el.remove(), 700);
  }

  /** Lightweight hover tooltip that appears when the user mouses over a globe marker. */
  private showHoverTooltip(d: GlobeMarker, anchor: HTMLElement): void {
    if (d._kind === 'flash') return;
    const text = anchor.title;
    if (!text) return;

    this.hideHoverTooltip();
    const el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'background:rgba(10,12,16,0.92)',
      'border:1px solid rgba(60,120,60,0.5)',
      'padding:5px 10px',
      'border-radius:3px',
      'font-size:11px',
      'font-family:monospace',
      'color:#d4d4d4',
      'max-width:260px',
      'z-index:10001',
      'pointer-events:none',
      'line-height:1.5',
      'white-space:pre-line',
      'word-break:break-word',
    ].join(';');
    el.textContent = text;

    const ar = anchor.getBoundingClientRect();
    const left = Math.min(ar.right + 8, window.innerWidth - 270);
    const top = Math.max(4, ar.top - 4);
    el.style.left = left + 'px';
    el.style.top = top + 'px';
    document.body.appendChild(el);
    this.hoverTooltipEl = el;
  }

  private hideHoverTooltip(): void {
    this.hoverTooltipEl?.remove();
    this.hoverTooltipEl = null;
  }

  /** Minimal inline tooltip for marker kinds that lack a MapPopup template (fire, ucdp, displacement, climate). */
  private showFallbackTooltip(d: GlobeMarker, e: MouseEvent): void {
    let html = '';
    if (d._kind === 'fire') {
      html = `<span style="color:#ff6600;font-weight:bold;">${svgIcon('fire', '#ff6600', 12)} ${t('components.deckgl.tooltip.wildfire')}</span>` +
        `<br><span style="opacity:.7;">${escapeHtml(d.region)}</span>` +
        `<br><span style="opacity:.5;">${t('components.deckgl.tooltip.brightness')}: ${d.brightness.toFixed(0)} K</span>`;
    } else if (d._kind === 'ucdp') {
      html = `<span style="color:#ff6400;font-weight:bold;">${svgIcon('conflict', '#ff6400', 12)} ${escapeHtml(d.country)}</span>` +
        `<br><span style="opacity:.7;">${escapeHtml(d.sideA)} ${t('components.deckgl.tooltip.vsLabel')} ${escapeHtml(d.sideB)}</span>` +
        (d.deaths ? `<br><span style="opacity:.5;">${t('components.deckgl.tooltip.deaths')}: ${d.deaths}</span>` : '');
    } else if (d._kind === 'displacement') {
      html = `<span style="color:#88bbff;font-weight:bold;">${svgIcon('people', '#88bbff', 12)} ${t('components.deckgl.tooltip.displacement')}</span>` +
        `<br><span style="opacity:.7;">${escapeHtml(d.origin)} → ${escapeHtml(d.asylum)}</span>` +
        `<br><span style="opacity:.5;">${t('components.deckgl.tooltip.refugees')}: ${d.refugees.toLocaleString()}</span>`;
    } else if (d._kind === 'climate') {
      const tc = d.type === 'warm' ? '#ff4400' : d.type === 'cold' ? '#44aaff' : '#88ff88';
      html = `<span style="color:${tc};font-weight:bold;">${svgIcon('thermometer', tc, 12)} ${escapeHtml(d.type.toUpperCase())}</span>` +
        `<br><span style="opacity:.7;">${escapeHtml(d.zone)}</span>` +
        `<br><span style="opacity:.5;">ΔT: ${d.tempDelta > 0 ? '+' : ''}${d.tempDelta.toFixed(1)}°C · ${escapeHtml(d.severity)}</span>`;
    } else if (d._kind === 'newsLocation') {
      const tc = d.threatLevel === 'critical' ? '#ff2020' : d.threatLevel === 'high' ? '#ff6600' : d.threatLevel === 'elevated' ? '#ffaa00' : '#44aaff';
      html = `<span style="color:${tc};font-weight:bold;">${svgIcon('news', tc, 12)} ${escapeHtml(d.title.slice(0, 60))}</span>` +
        `<br><span style="opacity:.5;">${escapeHtml(d.threatLevel)}</span>`;
    }
    if (!html) return;

    const el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'background:rgba(10,12,16,0.95)',
      'border:1px solid rgba(60,120,60,0.6)',
      'padding:8px 12px',
      'border-radius:3px',
      'font-size:11px',
      'font-family:monospace',
      'color:#d4d4d4',
      'max-width:240px',
      'z-index:10001',
      'pointer-events:none',
      'line-height:1.5',
    ].join(';');
    el.innerHTML = html;
    const left = Math.min(e.clientX + 14, window.innerWidth - 248);
    const top = Math.max(4, Math.min(e.clientY - 8, window.innerHeight - 80));
    el.style.left = left + 'px';
    el.style.top = top + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  // ─── Overlay UI: zoom controls & layer panel ─────────────────────────────

  private createControls(): void {
    const beta$ = t('common.beta');
    const el = document.createElement('div');
    el.className = 'map-controls deckgl-controls';
    el.innerHTML = `
      <span class="globe-beta-badge">${beta$}</span>
      <div class="zoom-controls">
        <button class="map-btn zoom-in"    title="Zoom in">+</button>
        <button class="map-btn zoom-out"   title="Zoom out">-</button>
        <button class="map-btn zoom-reset" title="Reset view">&#8962;</button>
        <button class="map-btn spin-toggle" title="Enable auto-spin" aria-label="Enable auto-spin" aria-pressed="false">${svgIcon('globe', '#8899aa', 13)}</button>
      </div>`;
    this.container.appendChild(el);
    this.spinToggleBtnEl = el.querySelector('.spin-toggle') as HTMLButtonElement | null;
    this.updateSpinToggleButton();
    el.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('zoom-in')) this.zoomInGlobe();
      else if (target.classList.contains('zoom-out')) this.zoomOutGlobe();
      else if (target.classList.contains('zoom-reset')) this.setView(this.currentView);
      else if (target.classList.contains('spin-toggle') || target.closest('.spin-toggle')) this.toggleAutoSpin();
    });
  }

  private updateSpinToggleButton(): void {
    if (!this.spinToggleBtnEl) return;
    const enabled = this.autoSpinEnabled;
    this.spinToggleBtnEl.classList.toggle('active', enabled);
    this.spinToggleBtnEl.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    this.spinToggleBtnEl.title = enabled ? 'Disable auto-spin' : 'Enable auto-spin';
    this.spinToggleBtnEl.setAttribute('aria-label', this.spinToggleBtnEl.title);
    this.spinToggleBtnEl.innerHTML = svgIcon('globe', enabled ? '#44aaff' : '#8899aa', 13);
  }

  private toggleAutoSpin(): void {
    this.autoSpinEnabled = !this.autoSpinEnabled;
    if (this.autoRotateTimer) {
      clearTimeout(this.autoRotateTimer);
      this.autoRotateTimer = null;
    }
    if (this.controls) {
      this.controls.autoRotate = this.autoSpinEnabled && !this.renderPaused;
    }
    this.updateSpinToggleButton();
  }

  private zoomInGlobe(): void {
    if (!this.globe) return;
    const pov = this.globe.pointOfView();
    if (!pov) return;
    const alt = this.clampAltitudeForMaxZoom((pov.altitude ?? 1.8) * 0.6);
    this.globe.pointOfView({ lat: pov.lat, lng: pov.lng, altitude: alt }, 500);
  }

  private zoomOutGlobe(): void {
    if (!this.globe) return;
    const pov = this.globe.pointOfView();
    if (!pov) return;
    const alt = Math.min(4.0, (pov.altitude ?? 1.8) * 1.6);
    this.globe.pointOfView({ lat: pov.lat, lng: pov.lng, altitude: alt }, 500);
  }

  private createLayerToggles(): void {
    const layerDefs = getLayersForVariant((SITE_VARIANT || 'full') as MapVariant, 'globe');
    const layers = layerDefs.map(def => ({
      key: def.key,
      label: resolveLayerLabel(def, t),
      icon: def.icon,
    }));

    const el = document.createElement('div');
    el.className = 'layer-toggles deckgl-layer-toggles';
    // Override deckgl-layer-toggles CSS which places at bottom; globe needs top-left
    el.style.bottom = 'auto';
    el.style.top = '10px';
    el.innerHTML = `
      <div class="toggle-header">
        <span>${t('components.deckgl.layersTitle')}</span>
        <button class="toggle-collapse">&#9660;</button>
      </div>
      <div class="toggle-list" style="max-height:32vh;overflow-y:auto;scrollbar-width:thin;">
        ${layers.map(({ key, label, icon }) => `
          <label class="layer-toggle" data-layer="${key}">
            <input type="checkbox" ${this.layers[key] ? 'checked' : ''}>
            <span class="toggle-icon">${svgIcon(icon, '#8899aa', 14)}</span>
            <span class="toggle-label">${label}</span>
          </label>`).join('')}
      </div>`;

    const copyrightYear = new Date().getFullYear();
    const authorBadge = document.createElement('div');
    authorBadge.className = 'map-author-badge';
    authorBadge.textContent = `© Marsd ${copyrightYear}`;
    el.appendChild(authorBadge);
    this.container.appendChild(el);

    el.querySelectorAll('.layer-toggle input').forEach(input => {
      input.addEventListener('change', () => {
        const layer = (input as HTMLInputElement).closest('.layer-toggle')?.getAttribute('data-layer') as keyof MapLayers | null;
        if (layer) {
          const checked = (input as HTMLInputElement).checked;
          this.layers[layer] = checked;
          this.flushLayerChannels(layer);
          this.onLayerChangeCb?.(layer, checked, 'user');
          this.enforceLayerLimit();
        }
      });
    });
    this.enforceLayerLimit();

    const collapseBtn = el.querySelector('.toggle-collapse');
    const list = el.querySelector('.toggle-list') as HTMLElement | null;
    let collapsed = false;
    collapseBtn?.addEventListener('click', () => {
      collapsed = !collapsed;
      if (list) list.style.display = collapsed ? 'none' : '';
      if (collapseBtn) (collapseBtn as HTMLElement).innerHTML = collapsed ? '&#9654;' : '&#9660;';
    });

    // Intercept wheel on layer panel — scroll list, don't zoom globe
    el.addEventListener('wheel', (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (list) list.scrollTop += e.deltaY;
    }, { passive: false });

    this.layerTogglesEl = el;
  }

  // ─── Flush all current data to globe ──────────────────────────────────────

  private flushMarkers(): void {
    if (!this.globe || !this.initialized || this.destroyed) return;
    if (this.renderPaused) { this.pendingFlushWhilePaused = true; return; }

    if (!this.flushMaxTimer) {
      this.flushMaxTimer = setTimeout(() => {
        this.flushMaxTimer = null;
        if (this.flushTimer) { clearTimeout(this.flushTimer); this.flushTimer = null; }
        this.flushMarkersImmediate();
      }, 300);
    }
    if (this.flushTimer) clearTimeout(this.flushTimer);
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      if (this.flushMaxTimer) { clearTimeout(this.flushMaxTimer); this.flushMaxTimer = null; }
      this.flushMarkersImmediate();
    }, 100);
  }

  private flushMarkersImmediate(): void {
    if (!this.globe || !this.initialized || this.destroyed) return;

    const markers: GlobeMarker[] = [];
    if (this.layers.hotspots) markers.push(...this.hotspots);
    if (this.layers.conflicts) markers.push(...this.conflictZoneMarkers);
    if (this.layers.bases) markers.push(...this.milBaseMarkers);
    if (this.layers.nuclear) markers.push(...this.nuclearSiteMarkers);
    if (this.layers.irradiators) markers.push(...this.irradiatorSiteMarkers);
    if (this.layers.spaceports) markers.push(...this.spaceportSiteMarkers);
    if (this.layers.military || this.layers.militaryAircraftConfirmed) {
      markers.push(...this.confirmedMilitaryFlights);
    }
    if (this.layers.military || this.layers.militaryAircraftUnknown) {
      markers.push(...this.unknownAircraftFlights);
    }
    if (this.layers.military || this.layers.navalActivity) {
      markers.push(...this.vessels);
    }
    if (this.layers.weather) markers.push(...this.weatherMarkers);
    if (this.layers.natural) {
      markers.push(...this.naturalMarkers);
      markers.push(...this.earthquakeMarkers);
    }
    if (this.layers.economic) markers.push(...this.economicMarkers);
    if (this.layers.datacenters) markers.push(...this.datacenterMarkers);
    if (this.layers.waterways) markers.push(...this.waterwayMarkers);
    if (this.layers.minerals) markers.push(...this.mineralMarkers);
    if (this.layers.flights) markers.push(...this.flightDelayMarkers);
    if (this.layers.flights) markers.push(...this.aircraftPositionMarkers);
    if (this.layers.ais) markers.push(...this.aisMarkers);
    if (this.layers.iranAttacks) markers.push(...this.iranMarkers);
    if (this.layers.outages) markers.push(...this.outageMarkers);
    if (this.layers.cyberThreats) markers.push(...this.cyberMarkers);
    if (this.layers.fires) markers.push(...this.fireMarkers);
    if (this.layers.protests) markers.push(...this.protestMarkers);
    if (this.layers.ucdpEvents) markers.push(...this.ucdpMarkers);
    if (this.layers.displacement) markers.push(...this.displacementMarkers);
    if (this.layers.climate) markers.push(...this.climateMarkers);
    if (this.layers.gpsJamming) markers.push(...this.gpsJamMarkers);
    if (this.layers.techEvents) markers.push(...this.techMarkers);
    if (this.layers.cables) {
      markers.push(...this.cableAdvisoryMarkers);
      markers.push(...this.repairShipMarkers);
    }
    markers.push(...this.newsLocationMarkers);
    markers.push(...this.flashMarkers);

    try {
      this.globe.htmlElementsData(markers);
    } catch (err) { if (import.meta.env.DEV) console.warn('[GlobeMap] flush error', err); }
  }

  private flushArcs(): void {
    if (!this.globe || !this.initialized || this.destroyed) return;
    const segments = this.layers.tradeRoutes ? this.tradeRouteSegments : [];
    (this.globe as any).arcsData(segments);
  }

  private flushPaths(): void {
    if (!this.globe || !this.initialized || this.destroyed) return;
    const showCables = this.layers.cables;
    const showPipelines = this.layers.pipelines;
    const showBoundaries = this.layers.geopoliticalBoundaries;
    const paths = this.globePaths.filter(p => {
      if (p.pathType === 'cable') return showCables;
      if (p.pathType === 'boundary') return showBoundaries;
      return showPipelines; // oil, gas, products
    });
    (this.globe as any).pathsData(paths);
  }

  private static readonly CII_GLOBE_COLORS: Record<string, string> = {
    low: 'rgba(40, 180, 60, 0.35)',
    normal: 'rgba(220, 200, 50, 0.35)',
    elevated: 'rgba(240, 140, 30, 0.40)',
    high: 'rgba(220, 50, 20, 0.45)',
    critical: 'rgba(140, 10, 0, 0.50)',
  };
  private static readonly CONFLICT_CAP: Record<string, string> = { high: 'rgba(255,40,40,0.25)', medium: 'rgba(255,120,0,0.20)', low: 'rgba(255,200,0,0.15)' };
  private static readonly CONFLICT_SIDE: Record<string, string> = { high: 'rgba(255,40,40,0.12)', medium: 'rgba(255,120,0,0.08)', low: 'rgba(255,200,0,0.06)' };
  private static readonly CONFLICT_STROKE: Record<string, string> = { high: '#ff3030', medium: '#ff8800', low: '#ffcc00' };
  private static readonly CONFLICT_ALT: Record<string, number> = { high: 0.006, medium: 0.004, low: 0.003 };

  private getReversedRing(zoneId: string, countryIso: string, ringIdx: number, ring: number[][][]): number[][][] {
    const key = `${zoneId}:${countryIso}:${ringIdx}`;
    let cached = this.reversedRingCache.get(key);
    if (!cached) {
      cached = ring.map((r: number[][]) => [...r].reverse());
      this.reversedRingCache.set(key, cached);
    }
    return cached;
  }

  private flushPolygons(): void {
    if (!this.globe || !this.initialized || this.destroyed) return;
    const polys: GlobePolygon[] = [];

    if (this.layers.conflicts) {
      const CONFLICT_ISO: Record<string, string[]> = {
        iran: ['IR'], ukraine: ['UA'], gaza: ['PS', 'IL'], sudan: ['SD'], myanmar: ['MM'],
      };
      for (const z of CONFLICT_ZONES) {
        const isoCodes = CONFLICT_ISO[z.id];
        if (isoCodes && this.countriesGeoData) {
          for (const feat of this.countriesGeoData.features) {
            const code = feat.properties?.['ISO3166-1-Alpha-2'] as string | undefined;
            if (!code || !isoCodes.includes(code)) continue;
            const geom = feat.geometry;
            if (!geom) continue;
            const rings = geom.type === 'Polygon' ? [geom.coordinates] : geom.type === 'MultiPolygon' ? geom.coordinates : [];
            for (let ri = 0; ri < rings.length; ri++) {
              polys.push({
                coords: this.getReversedRing(z.id, code, ri, rings[ri] as number[][][]),
                name: z.name,
                id: z.id,
                _kind: 'conflict',
                intensity: z.intensity ?? 'low',
                parties: z.parties,
                casualties: z.casualties,
              });
            }
          }
        }
      }
    }

    if (this.layers.ciiChoropleth && this.countriesGeoData) {
      for (const feat of this.countriesGeoData.features) {
        const code = feat.properties?.['ISO3166-1-Alpha-2'] as string | undefined;
        const entry = code ? this.ciiScoresMap.get(code) : undefined;
        if (!entry || !code) continue;
        const geom = feat.geometry;
        if (!geom) continue;
        const rings = geom.type === 'Polygon' ? [geom.coordinates] : geom.type === 'MultiPolygon' ? geom.coordinates : [];
        const name = (feat.properties?.name as string) ?? code;
        for (const ring of rings) {
          polys.push({ coords: ring, name, _kind: 'cii', level: entry.level, score: entry.score });
        }
      }
    }

    (this.globe as any).polygonsData(polys);
  }

  // ─── Public data setters ──────────────────────────────────────────────────

  public setCIIScores(scores: Array<{ code: string; score: number; level: string }>): void {
    this.ciiScoresMap = new Map(scores.map(s => [s.code, { score: s.score, level: s.level }]));
    this.flushPolygons();
  }

  public setHotspots(hotspots: Hotspot[]): void {
    this.hotspots = hotspots.map(h => ({
      _kind: 'hotspot' as const,
      _lat: h.lat,
      _lng: h.lon,
      id: h.id,
      name: h.name,
      escalationScore: h.escalationScore ?? 1,
    }));
    this.flushMarkers();
  }

  private setConflictZones(): void {
    this.conflictZoneMarkers = CONFLICT_ZONES.map(z => ({
      _kind: 'conflictZone' as const,
      _lat: z.center[1],
      _lng: z.center[0],
      id: z.id,
      name: z.name,
      intensity: z.intensity ?? 'low',
      parties: z.parties ?? [],
      casualties: z.casualties,
    }));
    this.flushMarkers();
  }

  // initStaticLayers() removed — data preparation offloaded to globe-data.worker.ts

  public setMilitaryFlights(flights: MilitaryFlight[]): void {
    this.flightDataMap.clear();
    const confirmed: FlightMarker[] = [];
    const unknown: FlightMarker[] = [];
    flights.forEach(f => {
      this.flightDataMap.set(f.id, f);
      const marker: FlightMarker = {
        _kind: 'flight' as const,
        _lat: f.lat,
        _lng: f.lon,
        id: f.id,
        callsign: f.callsign ?? '',
        type: (f as any).aircraftType ?? (f as any).type ?? 'fighter',
        heading: (f as any).heading ?? 0,
        isInteresting: f.isInteresting ?? false,
      };
      if (this.isConfirmedMilitaryFlight(f)) confirmed.push(marker);
      else unknown.push({ ...marker, isCivilian: true });
    });
    this.confirmedMilitaryFlights = confirmed;
    this.unknownAircraftFlights = unknown;
    this.flushMarkers();
  }

  public setMilitaryVessels(vessels: MilitaryVessel[]): void {
    this.vesselDataMap.clear();
    this.vessels = vessels.map(v => {
      this.vesselDataMap.set(v.id, v);
      return {
        _kind: 'vessel' as const,
        _lat: v.lat,
        _lng: v.lon,
        id: v.id,
        name: (v as any).name ?? 'vessel',
        type: (v as any).vesselType ?? 'destroyer',
      };
    });
    this.flushMarkers();
  }

  public setWeatherAlerts(alerts: WeatherAlert[]): void {
    this.weatherMarkers = (alerts ?? [])
      .filter(a => a.centroid != null)
      .map(a => ({
        _kind: 'weather' as const,
        _lat: a.centroid![1],   // centroid is [lon, lat]
        _lng: a.centroid![0],
        id: a.id,
        severity: a.severity ?? 'Minor',
        headline: a.headline ?? a.event ?? '',
      }));
    this.flushMarkers();
  }

  public setNaturalEvents(events: NaturalEvent[]): void {
    this.naturalMarkers = (events ?? []).map(e => ({
      _kind: 'natural' as const,
      _lat: e.lat,
      _lng: e.lon,
      id: e.id,
      category: e.category ?? '',
      title: e.title ?? '',
    }));
    this.flushMarkers();
  }

  // ─── Layer control ────────────────────────────────────────────────────────

  private static readonly LAYER_CHANNELS: Map<string, { markers: boolean; arcs: boolean; paths: boolean; polygons: boolean }> = new Map([
    ['militaryAircraftConfirmed', { markers: true, arcs: false, paths: false, polygons: false }],
    ['militaryAircraftUnknown', { markers: true, arcs: false, paths: false, polygons: false }],
    ['navalActivity', { markers: true, arcs: false, paths: false, polygons: false }],
    ['military', { markers: true, arcs: false, paths: false, polygons: false }],
    ['ciiChoropleth', { markers: false, arcs: false, paths: false, polygons: true }],
    ['tradeRoutes', { markers: false, arcs: true, paths: false, polygons: false }],
    ['pipelines', { markers: false, arcs: false, paths: true, polygons: false }],
    ['conflicts', { markers: true, arcs: false, paths: false, polygons: true }],
    ['cables', { markers: true, arcs: false, paths: true, polygons: false }],
    ['geopoliticalBoundaries', { markers: false, arcs: false, paths: true, polygons: false }],
  ]);

  private flushLayerChannels(layer: keyof MapLayers): void {
    const ch = GlobeMap.LAYER_CHANNELS.get(layer);
    if (!ch) { this.flushMarkers(); return; }
    if (ch.markers) this.flushMarkers();
    if (ch.arcs) this.flushArcs();
    if (ch.paths) this.flushPaths();
    if (ch.polygons) this.flushPolygons();
  }

  public setLayers(layers: MapLayers): void {
    const prev = this.layers;
    this.layers = { ...layers };
    let needMarkers = false, needArcs = false, needPaths = false, needPolygons = false;
    for (const k of Object.keys(layers) as (keyof MapLayers)[]) {
      if (prev[k] === layers[k]) continue;
      const ch = GlobeMap.LAYER_CHANNELS.get(k);
      if (!ch) { needMarkers = true; continue; }
      if (ch.markers) needMarkers = true;
      if (ch.arcs) needArcs = true;
      if (ch.paths) needPaths = true;
      if (ch.polygons) needPolygons = true;
    }
    if (needMarkers) this.flushMarkers();
    if (needArcs) this.flushArcs();
    if (needPaths) this.flushPaths();
    if (needPolygons) this.flushPolygons();
    // Manage aircraft polling timer when flights layer toggled
    if (prev.flights !== this.layers.flights) this.manageAircraftTimer(this.layers.flights);
  }

  public enableLayer(layer: keyof MapLayers): void {
    if (this.layers[layer]) return;
    (this.layers as any)[layer] = true;
    const toggle = this.layerTogglesEl?.querySelector(`.layer-toggle[data-layer="${layer}"] input`) as HTMLInputElement | null;
    if (toggle) toggle.checked = true;
    this.flushLayerChannels(layer);
    this.enforceLayerLimit();
    if (layer === 'flights') this.manageAircraftTimer(true);
  }

  private enforceLayerLimit(): void {
    if (!this.layerTogglesEl) return;
    const MAX_GLOBE_LAYERS = 6;
    const allToggles = Array.from(this.layerTogglesEl.querySelectorAll<HTMLInputElement>('.layer-toggle input'));
    const checked = allToggles.filter(i => i.checked);
    if (checked.length > MAX_GLOBE_LAYERS) {
      const excess = checked.slice(MAX_GLOBE_LAYERS);
      for (const inp of excess) {
        inp.checked = false;
        const layer = inp.closest('.layer-toggle')?.getAttribute('data-layer') as keyof MapLayers | null;
        if (layer) {
          this.layers[layer] = false;
          this.flushLayerChannels(layer);
        }
      }
    }
    const activeCount = allToggles.filter(i => i.checked).length;
    allToggles.forEach(i => {
      if (!i.checked) {
        i.disabled = activeCount >= MAX_GLOBE_LAYERS;
        i.closest('.layer-toggle')?.classList.toggle('limit-reached', activeCount >= MAX_GLOBE_LAYERS);
      } else {
        i.disabled = false;
        i.closest('.layer-toggle')?.classList.remove('limit-reached');
      }
    });
  }

  // ─── Camera / navigation ──────────────────────────────────────────────────

  private static readonly VIEW_POVS: Record<MapView, { lat: number; lng: number; altitude: number }> = {
    global: { lat: 20, lng: 0, altitude: 1.8 },
    america: { lat: 20, lng: -90, altitude: 1.5 },
    mena: { lat: 25, lng: 40, altitude: 1.2 },
    eu: { lat: 50, lng: 10, altitude: 1.2 },
    asia: { lat: 35, lng: 105, altitude: 1.5 },
    latam: { lat: -15, lng: -60, altitude: 1.5 },
    africa: { lat: 5, lng: 20, altitude: 1.5 },
    oceania: { lat: -25, lng: 140, altitude: 1.5 },
  };

  public setView(view: MapView): void {
    this.currentView = view;
    if (!this.globe) return;
    const pov = GlobeMap.VIEW_POVS[view] ?? GlobeMap.VIEW_POVS.global;
    this.globe.pointOfView(pov, 1200);
    this.applyRenderQuality();
  }

  public setCenter(lat: number, lon: number, zoom?: number): void {
    if (!this.globe) return;
    // Map deck.gl zoom levels → globe.gl altitude
    // deck.gl: 2=world, 3=continent, 4=country (max zoom for globe mode)
    // globe.gl altitude: 1.8=full globe, 0.5=country
    let altitude = 1.2;
    if (zoom !== undefined) {
      if (zoom >= GlobeMap.MAX_GLOBE_ZOOM_LEVEL) altitude = 0.5;
      else if (zoom >= 3) altitude = 0.8;
      else altitude = 1.5;
    }
    this.globe.pointOfView({ lat, lng: lon, altitude: this.clampAltitudeForMaxZoom(altitude) }, 1200);
    this.applyRenderQuality();
  }

  public getCenter(): { lat: number; lon: number } | null {
    if (!this.globe) return null;
    const pov = this.globe.pointOfView();
    return pov ? { lat: pov.lat, lon: pov.lng } : null;
  }

  // ─── Resize ────────────────────────────────────────────────────────────────

  public resize(): void {
    if (!this.globe || this.destroyed) return;
    this.applyRenderQuality(undefined, this.container.clientWidth, this.container.clientHeight);
  }

  // ─── State API ────────────────────────────────────────────────────────────

  public getState(): MapContainerState {
    return {
      zoom: 1,
      pan: { x: 0, y: 0 },
      view: this.currentView,
      layers: this.layers,
      timeRange: this.timeRange,
    };
  }

  public setTimeRange(range: TimeRange): void {
    this.timeRange = range;
  }

  public getTimeRange(): TimeRange {
    return this.timeRange;
  }

  // ─── Callback setters ─────────────────────────────────────────────────────

  public setOnHotspotClick(cb: (h: Hotspot) => void): void {
    this.onHotspotClickCb = cb;
  }

  public setOnCountryClick(_cb: (c: CountryClickPayload) => void): void {
    // Globe country click not yet implemented — no-op
  }

  // ─── No-op stubs (keep MapContainer happy) ────────────────────────────────
  public render(): void {
    if (!this.globe || this.destroyed) return;
    this.resize();
  }

  public setIsResizing(_isResizing: boolean): void {
    if (!this.globe || this.destroyed || _isResizing) return;
    this.resize();
  }

  public setZoom(_z: number): void { }
  public setRenderPaused(paused: boolean): void {
    if (this.renderPaused === paused) return;
    this.renderPaused = paused;

    if (paused) {
      if (this.flushTimer) { clearTimeout(this.flushTimer); this.flushTimer = null; }
      if (this.flushMaxTimer) { clearTimeout(this.flushMaxTimer); this.flushMaxTimer = null; }
      this.pendingFlushWhilePaused = true;
      if (this.autoRotateTimer) {
        clearTimeout(this.autoRotateTimer);
        this.autoRotateTimer = null;
      }
      if (this.adaptiveQualityIntervalId) {
        clearTimeout(this.adaptiveQualityIntervalId);
        this.adaptiveQualityIntervalId = null;
      }
    }

    if (this.controls) {
      if (paused) {
        this.controlsAutoRotateBeforePause = this.controls.autoRotate;
        this.controlsDampingBeforePause = this.controls.enableDamping;
        this.controls.autoRotate = false;
        this.controls.enableDamping = false;
      } else {
        if (this.controlsAutoRotateBeforePause !== null) {
          this.controls.autoRotate = this.controlsAutoRotateBeforePause && this.autoSpinEnabled;
        }
        if (this.controlsDampingBeforePause !== null) {
          this.controls.enableDamping = this.controlsDampingBeforePause;
        }
        this.controlsAutoRotateBeforePause = null;
        this.controlsDampingBeforePause = null;
      }
    }

    if (!paused && this.pendingFlushWhilePaused) {
      this.pendingFlushWhilePaused = false;
      this.flushMarkers();
    }

    if (!paused) {
      this.startAdaptiveQualityMonitor();
      this.applyRenderQuality();
    }
    this.updateSpinToggleButton();
  }
  public updateHotspotActivity(_news: any[]): void { }
  public updateMilitaryForEscalation(_f: any[], _v: any[]): void { }
  public getHotspotDynamicScore(_id: string) { return undefined; }
  public getHotspotLevels() { return {} as Record<string, string>; }
  public setHotspotLevels(_l: Record<string, string>): void { }
  public initEscalationGetters(): void { }
  public highlightAssets(_assets: any): void { }
  public setOnLayerChange(cb: (layer: keyof MapLayers, enabled: boolean, source: 'user' | 'programmatic') => void): void {
    this.onLayerChangeCb = cb;
  }
  public setOnTimeRangeChange(_cb: any): void { }
  public hideLayerToggle(layer: keyof MapLayers): void {
    this.layerTogglesEl?.querySelector(`.layer-toggle[data-layer="${layer}"]`)?.remove();
  }
  public setLayerLoading(layer: keyof MapLayers, loading: boolean): void {
    this.layerTogglesEl?.querySelector(`.layer-toggle[data-layer="${layer}"]`)?.classList.toggle('loading', loading);
  }
  public setLayerReady(layer: keyof MapLayers, hasData: boolean): void {
    this.layerTogglesEl?.querySelector(`.layer-toggle[data-layer="${layer}"]`)?.classList.toggle('no-data', !hasData);
  }
  public flashAssets(_type: string, _ids: string[]): void { }
  public flashLocation(lat: number, lon: number, durationMs = 2000): void {
    if (!this.globe || !this.initialized) return;
    const id = `flash-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this.flashMarkers.push({ _kind: 'flash', id, _lat: lat, _lng: lon });
    this.flushMarkers();
    setTimeout(() => {
      this.flashMarkers = this.flashMarkers.filter(m => m.id !== id);
      this.flushMarkers();
    }, durationMs);
  }
  public triggerHotspotClick(_id: string): void { }
  public triggerConflictClick(_id: string): void { }
  public triggerBaseClick(_id: string): void { }
  public triggerPipelineClick(_id: string): void { }
  public triggerCableClick(_id: string): void { }
  public triggerDatacenterClick(_id: string): void { }
  public triggerNuclearClick(_id: string): void { }
  public triggerIrradiatorClick(_id: string): void { }
  public fitCountry(code: string): void {
    if (!this.globe) return;
    const bbox = getCountryBbox(code);
    if (!bbox) return;
    const [minLon, minLat, maxLon, maxLat] = bbox;
    const lat = (minLat + maxLat) / 2;
    const lng = (minLon + maxLon) / 2;
    const span = Math.max(maxLat - minLat, maxLon - minLon);
    // Map geographic span → altitude: large country (Russia ~170°) vs small (Luxembourg ~0.5°)
    const altitude = span > 60 ? 1.0 : span > 20 ? 0.7 : span > 8 ? 0.45 : span > 3 ? 0.25 : 0.12;
    this.globe.pointOfView({ lat, lng, altitude: this.clampAltitudeForMaxZoom(altitude) }, 1200);
  }
  public highlightCountry(_code: string): void { }
  public clearCountryHighlight(): void { }
  public setEarthquakes(earthquakes: Earthquake[]): void {
    this.earthquakeMarkers = (earthquakes ?? [])
      .filter(e => e.location != null)
      .map(e => ({
        _kind: 'earthquake' as const,
        _lat: e.location!.latitude,
        _lng: e.location!.longitude,
        id: e.id,
        place: e.place ?? '',
        magnitude: e.magnitude ?? 0,
      }));
    this.flushMarkers();
  }
  public setOutages(outages: InternetOutage[]): void {
    this.outageMarkers = (outages ?? []).filter(o => o.lat != null && o.lon != null).map(o => ({
      _kind: 'outage' as const,
      _lat: o.lat,
      _lng: o.lon,
      id: o.id,
      title: o.title ?? '',
      severity: o.severity ?? 'partial',
      country: o.country ?? '',
    }));
    this.flushMarkers();
  }
  public setAisData(disruptions: AisDisruptionEvent[], _density: AisDensityZone[]): void {
    // AisDensityZone requires a heatmap layer — render disruption events only
    this.aisMarkers = (disruptions ?? [])
      .filter(d => d.lat != null && d.lon != null)
      .map(d => ({
        _kind: 'aisDisruption' as const,
        _lat: d.lat,
        _lng: d.lon,
        id: d.id,
        name: d.name,
        type: d.type,
        severity: d.severity,
        description: d.description ?? '',
      }));
    this.flushMarkers();
  }
  public setCableActivity(advisories: CableAdvisory[], repairShips: RepairShip[]): void {
    this.cableAdvisoryMarkers = (advisories ?? [])
      .filter(a => a.lat != null && a.lon != null)
      .map(a => ({
        _kind: 'cableAdvisory' as const,
        _lat: a.lat,
        _lng: a.lon,
        id: a.id,
        cableId: a.cableId,
        title: a.title ?? '',
        severity: a.severity,
        impact: a.impact ?? '',
        repairEta: a.repairEta ?? '',
      }));
    this.repairShipMarkers = (repairShips ?? [])
      .filter(r => r.lat != null && r.lon != null)
      .map(r => ({
        _kind: 'repairShip' as const,
        _lat: r.lat,
        _lng: r.lon,
        id: r.id,
        name: r.name ?? '',
        status: r.status,
        eta: r.eta ?? '',
        operator: r.operator ?? '',
      }));
    this.cableFaultIds = new Set((advisories ?? []).filter(a => a.severity === 'fault').map(a => a.cableId));
    this.cableDegradedIds = new Set((advisories ?? []).filter(a => a.severity === 'degraded').map(a => a.cableId));
    this.flushMarkers();
    this.flushPaths();
  }
  public setCableHealth(_m: any): void { }
  public setProtests(events: SocialUnrestEvent[]): void {
    this.protestMarkers = (events ?? []).filter(e => e.lat != null && e.lon != null).map(e => ({
      _kind: 'protest' as const,
      _lat: e.lat,
      _lng: e.lon,
      id: e.id,
      title: e.title ?? '',
      eventType: e.eventType ?? 'protest',
      country: e.country ?? '',
    }));
    this.flushMarkers();
  }
  public setFlightDelays(delays: AirportDelayAlert[]): void {
    this.flightDelayMarkers = (delays ?? [])
      .filter(d => d.lat != null && d.lon != null && d.severity !== 'normal')
      .map(d => ({
        _kind: 'flightDelay' as const,
        _lat: d.lat,
        _lng: d.lon,
        id: d.id,
        iata: d.iata,
        name: d.name,
        city: d.city,
        country: d.country,
        severity: d.severity,
        delayType: d.delayType,
        avgDelayMinutes: d.avgDelayMinutes,
        reason: d.reason ?? '',
      }));
    this.flushMarkers();
  }
  public setAircraftPositions(positions: PositionSample[]): void {
    const civilianOnly = (positions ?? []).filter((position) => !this.isLikelyMilitaryPosition(position));
    this.aircraftPositionMarkers = civilianOnly.slice(0, 500).map(p => ({
      _kind: 'aircraftPos' as const,
      _lat: p.lat,
      _lng: p.lon,
      icao24: p.icao24,
      callsign: p.callsign,
      altitudeFt: p.altitudeFt,
      groundSpeedKts: p.groundSpeedKts,
      trackDeg: p.trackDeg,
      verticalRate: p.verticalRate ?? 0,
      onGround: p.onGround,
      source: p.source,
      observedAt: p.observedAt,
    }));
    this.flushMarkers();
  }

  private manageAircraftTimer(enabled: boolean): void {
    if (enabled) {
      if (!this.aircraftFetchTimer) {
        this.scheduleAircraftFetch(0); // immediate fetch on enable
      }
    } else {
      if (this.aircraftFetchTimer) {
        clearTimeout(this.aircraftFetchTimer);
        this.aircraftFetchTimer = null;
      }
      if (this.aircraftPositionMarkers.length > 0) {
        this.aircraftPositionMarkers = [];
        this.flushMarkers();
      }
    }
  }

  private scheduleAircraftFetch(delayMs: number): void {
    if (this.destroyed || !this.layers.flights) return;
    if (this.aircraftFetchTimer) return;

    this.aircraftFetchTimer = setTimeout(async () => {
      this.aircraftFetchTimer = null;
      if (this.destroyed || !this.layers.flights) return;

      await this.fetchViewportAircraft();
      this.scheduleAircraftFetch(120_000);
    }, Math.max(0, delayMs));
  }

  private async fetchViewportAircraft(): Promise<void> {
    if (!this.globe || !this.layers.flights || this.destroyed) return;
    const pov = this.globe.pointOfView() as { lat: number; lng: number; altitude: number };
    const alt = pov?.altitude ?? 1.5;
    // Skip fetch when zoomed far out — too many positions
    if (alt > 2.2) {
      if (this.aircraftPositionMarkers.length > 0) {
        this.aircraftPositionMarkers = [];
        this.flushMarkers();
      }
      return;
    }
    // Estimate visible region from globe POV altitude
    const degSpan = Math.min(160, alt * 100 + 20);
    const lat = pov?.lat ?? 0;
    const lng = pov?.lng ?? 0;
    const swLat = Math.max(-85, lat - degSpan / 2);
    const neLat = Math.min(85, lat + degSpan / 2);
    const swLon = Math.max(-180, lng - degSpan);
    const neLon = Math.min(180, lng + degSpan);
    const seq = ++this.aircraftFetchSeq;
    try {
      const positions = await fetchAircraftPositions({ swLat, swLon, neLat, neLon });
      if (seq !== this.aircraftFetchSeq || this.destroyed) return;
      this.setAircraftPositions(positions);
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[GlobeMap] aircraft fetch error', err);
    }
  }

  public setNewsLocations(data: Array<{ lat: number; lon: number; title: string; threatLevel: string; timestamp?: Date }>): void {
    this.newsLocationMarkers = (data ?? [])
      .filter(d => d.lat != null && d.lon != null)
      .map((d, i) => ({
        _kind: 'newsLocation' as const,
        _lat: d.lat,
        _lng: d.lon,
        id: `news-${i}-${d.title.slice(0, 20)}`,
        title: d.title,
        threatLevel: d.threatLevel ?? 'info',
        timestamp: d.timestamp,
      }));
    this.flushMarkers();
  }
  public setPositiveEvents(_events: any[]): void { }
  public setKindnessData(_points: any[]): void { }
  public setHappinessScores(_data: any): void { }
  public setSpeciesRecoveryZones(_zones: any[]): void { }
  public setRenewableInstallations(_installations: any[]): void { }
  public setCyberThreats(threats: CyberThreat[]): void {
    this.cyberMarkers = (threats ?? []).filter(t => t.lat != null && t.lon != null).map(t => ({
      _kind: 'cyber' as const,
      _lat: t.lat,
      _lng: t.lon,
      id: t.id,
      indicator: t.indicator ?? '',
      severity: t.severity ?? 'low',
      type: t.type ?? 'malware_host',
    }));
    this.flushMarkers();
  }
  public setIranEvents(events: IranEvent[]): void {
    this.iranMarkers = (events ?? []).filter(e => e.latitude != null && e.longitude != null).map(e => ({
      _kind: 'iran' as const,
      _lat: e.latitude,
      _lng: e.longitude,
      id: e.id,
      title: e.title ?? '',
      category: e.category ?? '',
      severity: e.severity ?? 'medium',
      location: e.locationName ?? '',
    }));
    this.flushMarkers();
  }
  public setFires(fires: Array<{ lat: number; lon: number; brightness: number; region: string;[key: string]: any }>): void {
    this.fireMarkers = (fires ?? []).filter(f => f.lat != null && f.lon != null).map(f => ({
      _kind: 'fire' as const,
      _lat: f.lat,
      _lng: f.lon,
      id: (f.id as string | undefined) ?? `${f.lat},${f.lon}`,
      region: f.region ?? '',
      brightness: f.brightness ?? 330,
    }));
    this.flushMarkers();
  }
  public setUcdpEvents(events: UcdpGeoEvent[]): void {
    this.ucdpMarkers = (events ?? []).filter(e => e.latitude != null && e.longitude != null).map(e => ({
      _kind: 'ucdp' as const,
      _lat: e.latitude,
      _lng: e.longitude,
      id: e.id,
      sideA: e.side_a ?? '',
      sideB: e.side_b ?? '',
      deaths: e.deaths_best ?? 0,
      country: e.country ?? '',
      dateStart: e.date_start ?? '',
      dateEnd: e.date_end ?? '',
      typeOfViolence: (e.type_of_violence ?? 'state-based') as 'state-based' | 'non-state' | 'one-sided',
      sourceOriginal: e.source_original ?? '',
    }));
    this.flushMarkers();
  }
  public setDisplacementFlows(flows: DisplacementFlow[]): void {
    this.displacementMarkers = (flows ?? [])
      .filter(f => f.originLat != null && f.originLon != null)
      .map(f => ({
        _kind: 'displacement' as const,
        _lat: f.originLat!,
        _lng: f.originLon!,
        id: `${f.originCode}-${f.asylumCode}`,
        origin: f.originName ?? f.originCode,
        asylum: f.asylumName ?? f.asylumCode,
        refugees: f.refugees ?? 0,
      }));
    this.flushMarkers();
  }
  public setClimateAnomalies(anomalies: ClimateAnomaly[]): void {
    this.climateMarkers = (anomalies ?? []).filter(a => a.lat != null && a.lon != null).map(a => ({
      _kind: 'climate' as const,
      _lat: a.lat,
      _lng: a.lon,
      id: `${a.zone}-${a.period}`,
      zone: a.zone ?? '',
      type: a.type ?? 'mixed',
      severity: a.severity ?? 'normal',
      tempDelta: a.tempDelta ?? 0,
    }));
    this.flushMarkers();
  }
  public setGpsJamming(hexes: GpsJamHex[]): void {
    this.gpsJamMarkers = (hexes ?? []).filter(h => h.lat != null && h.lon != null).map(h => ({
      _kind: 'gpsjam' as const,
      _lat: h.lat,
      _lng: h.lon,
      id: h.h3,
      level: h.level,
      pct: h.pct ?? 0,
    }));
    this.flushMarkers();
  }
  public setTechEvents(events: Array<{ id: string; title: string; lat: number; lng: number; country: string; daysUntil: number;[key: string]: any }>): void {
    this.techMarkers = (events ?? []).filter(e => e.lat != null && e.lng != null).map(e => ({
      _kind: 'tech' as const,
      _lat: e.lat,
      _lng: e.lng,
      id: e.id,
      title: e.title ?? '',
      country: e.country ?? '',
      daysUntil: e.daysUntil ?? 0,
    }));
    this.flushMarkers();
  }
  public onHotspotClicked(cb: (h: Hotspot) => void): void { this.onHotspotClickCb = cb; }
  public onTimeRangeChanged(_cb: (r: TimeRange) => void): void { }
  public onStateChanged(_cb: (s: MapContainerState) => void): void { }
  public setOnCountry(_cb: any): void { }
  public getHotspotLevel(_id: string) { return 'low'; }

  // ─── Render quality & performance profile ────────────────────────────────

  private applyRenderQuality(scale?: GlobeRenderScale, width?: number, height?: number): void {
    if (!this.globe) return;
    try {
      const desktop = isDesktopRuntime();
      const basePr = desktop
        ? Math.min(resolveGlobePixelRatio(scale ?? getGlobeRenderScale()), 1.25)
        : resolveGlobePixelRatio(scale ?? getGlobeRenderScale());
      const altitude = this.globe.pointOfView()?.altitude ?? 1.2;
      const adaptivePr = this.getAdaptivePixelRatio(basePr, altitude, desktop);
      const renderer = this.globe.renderer();
      if (this.lastAppliedPixelRatio !== adaptivePr) {
        renderer.setPixelRatio(adaptivePr);
        this.lastAppliedPixelRatio = adaptivePr;
      }
      this.applyAdaptiveTextureSampling(altitude);

      const shouldApplySize = width !== undefined || height !== undefined || this.lastAppliedRenderWidth === 0 || this.lastAppliedRenderHeight === 0;
      if (shouldApplySize) {
        const w = (width ?? this.container.clientWidth) || window.innerWidth;
        const h = (height ?? this.container.clientHeight) || window.innerHeight;
        if (w > 0 && h > 0 && (w !== this.lastAppliedRenderWidth || h !== this.lastAppliedRenderHeight)) {
          this.globe.width(w).height(h);
          this.lastAppliedRenderWidth = w;
          this.lastAppliedRenderHeight = h;
        }
      }
      this.updateDebugOverlay();
    } catch { /* best-effort */ }
  }

  private createDebugOverlay(): void {
    if (!import.meta.env.DEV || this.debugOverlayEl || this.destroyed) return;

    const el = document.createElement('div');
    el.className = 'globe-debug-overlay';
    el.style.cssText = [
      'position:absolute',
      'right:10px',
      'bottom:10px',
      'z-index:10030',
      'pointer-events:none',
      'font:11px/1.35 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace',
      'color:#d9ecff',
      'background:rgba(7,12,18,0.78)',
      'border:1px solid rgba(90,145,205,0.45)',
      'border-radius:6px',
      'padding:8px 10px',
      'white-space:pre',
      'backdrop-filter:blur(2px)',
    ].join(';');

    this.container.appendChild(el);
    this.debugOverlayEl = el;
    this.updateDebugOverlay();

    this.scheduleDebugOverlayUpdate();
  }

  private scheduleDebugOverlayUpdate(): void {
    if (!import.meta.env.DEV || this.destroyed || !this.debugOverlayEl) return;
    if (this.debugOverlayIntervalId) return;

    this.debugOverlayIntervalId = setTimeout(() => {
      this.debugOverlayIntervalId = null;
      this.updateDebugOverlay();
      this.scheduleDebugOverlayUpdate();
    }, 500);
  }

  private updateDebugOverlay(): void {
    if (!import.meta.env.DEV || !this.debugOverlayEl || !this.globe) return;

    const pov = this.globe.pointOfView();
    const altitude = pov?.altitude ?? 1.2;
    const zoomLevel = this.getApproximateZoomLevel(altitude);
    const bucket = this.getAdaptiveQualityBucket(altitude);
    const material = this.globe.globeMaterial() as { map?: { anisotropy?: number } } | null;
    const anisotropy = material?.map?.anisotropy ?? 0;
    const pixelRatio = this.lastAppliedPixelRatio ?? 0;
    const texture = getGlobeTexture();

    this.debugOverlayEl.textContent = [
      'Globe DEV Quality',
      `texture: ${texture}`,
      `zoom: ${zoomLevel.toFixed(1)}`,
      `alt: ${altitude.toFixed(3)} (${bucket})`,
      `pixelRatio: ${pixelRatio.toFixed(2)} (device ${window.devicePixelRatio.toFixed(2)})`,
      `anisotropy: ${anisotropy}`,
      `size: ${this.lastAppliedRenderWidth}x${this.lastAppliedRenderHeight}`,
      `paused: ${this.renderPaused ? 'yes' : 'no'}`,
    ].join('\n');
  }

  private getApproximateZoomLevel(altitude: number): number {
    const zoomStops = [
      { altitude: 1.8, zoom: 1 },
      { altitude: 1.5, zoom: 2 },
      { altitude: 0.8, zoom: 3 },
      { altitude: 0.5, zoom: 4 },
    ];
    const firstStop = zoomStops[0]!;
    const lastStop = zoomStops[zoomStops.length - 1]!;

    if (altitude >= firstStop.altitude) return firstStop.zoom;
    if (altitude <= lastStop.altitude) return lastStop.zoom;

    for (let index = 0; index < zoomStops.length - 1; index += 1) {
      const current = zoomStops[index]!;
      const next = zoomStops[index + 1]!;

      if (altitude <= current.altitude && altitude >= next.altitude) {
        const progress = (current.altitude - altitude) / (current.altitude - next.altitude);
        return current.zoom + progress * (next.zoom - current.zoom);
      }
    }

    return GlobeMap.MAX_GLOBE_ZOOM_LEVEL;
  }

  private clampAltitudeForMaxZoom(altitude: number): number {
    return Math.max(GlobeMap.MIN_ALTITUDE_FOR_MAX_ZOOM, altitude);
  }

  private getAdaptivePixelRatio(basePr: number, altitude: number, desktop: boolean): number {
    const maxPr = desktop ? 1.5 : 1.5;
    const minPr = desktop ? 1 : 1;
    let multiplier = 1;

    // Boost close-up rendering where texture detail matters most.
    if (altitude <= 0.55) multiplier = 1.2;
    else if (altitude <= 0.8) multiplier = 1.1;
    else if (altitude >= 2.2) multiplier = 0.92;
    else if (altitude >= 1.6) multiplier = 0.96;

    const nextPr = basePr * multiplier;
    return Math.max(minPr, Math.min(maxPr, nextPr));
  }

  private getAdaptiveQualityBucket(altitude: number): 'far' | 'mid' | 'near' {
    if (altitude <= 0.55) return 'near';
    if (altitude <= 1.4) return 'mid';
    return 'far';
  }

  private applyAdaptiveTextureSampling(altitude?: number): void {
    if (!this.globe) return;
    try {
      const material = this.globe.globeMaterial() as { map?: { anisotropy?: number; needsUpdate?: boolean; generateMipmaps?: boolean } } | null;
      const map = material?.map;
      if (!map) return;

      const effectiveAltitude = altitude ?? (this.globe.pointOfView()?.altitude ?? 1.2);
      const bucket = this.getAdaptiveQualityBucket(effectiveAltitude);
      const maxAnisotropy = Math.max(1, this.globe.renderer().capabilities.getMaxAnisotropy());

      let targetAnisotropy = 2;
      if (bucket === 'near') targetAnisotropy = Math.min(maxAnisotropy, 16);
      else if (bucket === 'mid') targetAnisotropy = Math.min(maxAnisotropy, 4);

      if (map.generateMipmaps !== true) {
        map.generateMipmaps = true;
        map.needsUpdate = true;
      }
      if (map.anisotropy !== targetAnisotropy) {
        map.anisotropy = targetAnisotropy;
        map.needsUpdate = true;
      }
    } catch {
      // Best effort only; texture internals vary across renderers.
    }
  }

  private startAdaptiveQualityMonitor(): void {
    if (this.adaptiveQualityIntervalId || this.destroyed) return;
    this.adaptiveQualityIntervalId = setTimeout(() => {
      this.adaptiveQualityIntervalId = null;
      if (!this.globe || this.destroyed || this.renderPaused) return;
      const altitude = this.globe.pointOfView()?.altitude ?? 1.2;
      const bucket = this.getAdaptiveQualityBucket(altitude);
      if (bucket !== this.lastAdaptiveQualityBucket) {
        this.lastAdaptiveQualityBucket = bucket;
        this.applyRenderQuality();
      }
      this.startAdaptiveQualityMonitor();
    }, 300);
  }

  private applyPerformanceProfile(profile: GlobePerformanceProfile): void {
    if (!this.globe || !this.initialized || this.destroyed) return;

    const prevPulse = this._pulseEnabled;
    this._pulseEnabled = !profile.disablePulseAnimations;

    if (profile.disableDashAnimations) {
      (this.globe as any).arcDashAnimateTime(0);
      (this.globe as any).pathDashAnimateTime(0);
    } else {
      (this.globe as any).arcDashAnimateTime(5000);
      (this.globe as any).pathDashAnimateTime((d: GlobePath) => (d.pathType === 'cable' || d.pathType === 'boundary') ? 0 : 5000);
    }

    if (profile.disableAtmosphere) {
      this.globe.atmosphereAltitude(0);
      if (this.outerGlow) this.outerGlow.visible = false;
      if (this.innerGlow) this.innerGlow.visible = false;
    } else {
      this.globe.atmosphereAltitude(0.18);
      if (this.outerGlow) this.outerGlow.visible = true;
      if (this.innerGlow) this.innerGlow.visible = true;
    }
    for (const sat of this.satOrbits) sat.group.visible = true;

    if (prevPulse !== this._pulseEnabled) {
      this.flushMarkers();
    }
  }

  // ─── Destroy ──────────────────────────────────────────────────────────────

  public destroy(): void {
    this.unsubscribeGlobeQuality?.();
    this.unsubscribeGlobeQuality = null;
    this.unsubscribeGlobeTexture?.();
    this.unsubscribeGlobeTexture = null;
    this.destroyed = true;
    if (this.extrasAnimFrameId != null) {
      cancelAnimationFrame(this.extrasAnimFrameId);
      this.extrasAnimFrameId = null;
    }
    const scene = this.globe?.scene();
    for (const obj of [this.outerGlow, this.innerGlow, this.starField, this.cyanLight]) {
      if (!obj) continue;
      if (scene) scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    }
    if (this.globe) {
      const mat = this.globe.globeMaterial();
      if (mat && (mat as any).isMeshStandardMaterial) mat.dispose();
    }
    this.outerGlow = null;
    this.innerGlow = null;
    this.starField = null;
    this.cyanLight = null;
    for (const sat of this.satOrbits) {
      if (scene) scene.remove(sat.group);
      (sat.sprite.material as any).map?.dispose();
      (sat.sprite.material as any).dispose();
    }
    this.satOrbits = [];
    if (this.flushTimer) { clearTimeout(this.flushTimer); this.flushTimer = null; }
    if (this.flushMaxTimer) { clearTimeout(this.flushMaxTimer); this.flushMaxTimer = null; }
    if (this.aircraftFetchTimer) { clearTimeout(this.aircraftFetchTimer); this.aircraftFetchTimer = null; }
    if (this.adaptiveQualityIntervalId) { clearTimeout(this.adaptiveQualityIntervalId); this.adaptiveQualityIntervalId = null; }
    if (this.debugOverlayIntervalId) { clearTimeout(this.debugOverlayIntervalId); this.debugOverlayIntervalId = null; }
    if (this.autoRotateTimer) clearTimeout(this.autoRotateTimer);
    if (this.globeDataWorker) {
      this.globeDataWorker.terminate();
      this.globeDataWorker = null;
    }
    this.reversedRingCache.clear();
    this.flightDataMap.clear();
    this.vesselDataMap.clear();
    if (this.loadingOverlayFallbackTimer) {
      clearTimeout(this.loadingOverlayFallbackTimer);
      this.loadingOverlayFallbackTimer = null;
    }
    this.loadingOverlayEl?.remove();
    this.loadingOverlayEl = null;
    this.popup.hide();
    this.hideHoverTooltip();
    this.controls = null;
    this.controlsAutoRotateBeforePause = null;
    this.controlsDampingBeforePause = null;
    this.lastAdaptiveQualityBucket = null;
    this.lastAppliedPixelRatio = null;
    this.lastAppliedRenderWidth = 0;
    this.lastAppliedRenderHeight = 0;
    this.debugOverlayEl?.remove();
    this.debugOverlayEl = null;
    this.layerTogglesEl = null;
    this.spinToggleBtnEl = null;
    if (this.globe) {
      try { this.globe._destructor(); } catch { /* ignore */ }
      this.globe = null;
    }
    this.container.innerHTML = '';
    this.container.classList.remove('globe-mode');
    this.container.style.cssText = '';
  }
}
