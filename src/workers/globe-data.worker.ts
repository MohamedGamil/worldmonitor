/**
 * globe-data.worker.ts
 *
 * Offloads static dataset preparation for GlobeMap to a Web Worker.
 * Mirrors the pattern used by DeckGLMap's map-cluster.worker.ts.
 *
 * On 'init' message:
 *  - Filters and maps all static config arrays into globe marker shapes
 *  - Computes trade route segments
 *  - Builds cable + pipeline path arrays
 *  - Posts 'static-ready' with all prepared data
 */

import { MILITARY_BASES, NUCLEAR_FACILITIES, SPACEPORTS, ECONOMIC_CENTERS, STRATEGIC_WATERWAYS, CRITICAL_MINERALS, UNDERSEA_CABLES } from '@/config/geo';
import { GEOPOLITICAL_BOUNDARIES } from '@/config/geopolitical-boundaries';
import type { GeopoliticalBoundary } from '@/config/geopolitical-boundaries';
import { PIPELINES } from '@/config/pipelines';
import { GAMMA_IRRADIATORS } from '@/config/irradiators';
import { AI_DATA_CENTERS } from '@/config/ai-datacenters';
import { resolveTradeRouteSegments, type TradeRouteSegment } from '@/config/trade-routes';
import { expandUnderseaCablePaths } from '@/utils/undersea-cables';
import type { MilitaryBase, GammaIrradiator, Spaceport, EconomicCenter, StrategicWaterway, CriticalMineralProject, AIDataCenter, UnderseaCable, Pipeline } from '@/types';

// ─── Marker interfaces (mirror GlobeMap's private interfaces) ───────────────

interface BaseMarker {
    _kind: string;
    _lat: number;
    _lng: number;
}

export interface MilBaseMarker extends BaseMarker {
    _kind: 'milbase';
    id: string;
    name: string;
    type: string;
    country: string;
}

export interface NuclearSiteMarker extends BaseMarker {
    _kind: 'nuclearSite';
    id: string;
    name: string;
    type: string;
    status: string;
}

export interface IrradiatorSiteMarker extends BaseMarker {
    _kind: 'irradiator';
    id: string;
    city: string;
    country: string;
}

export interface SpaceportSiteMarker extends BaseMarker {
    _kind: 'spaceport';
    id: string;
    name: string;
    country: string;
    operator: string;
    launches: string;
}

export interface EconomicMarker extends BaseMarker {
    _kind: 'economic';
    id: string;
    name: string;
    type: string;
    country: string;
    description: string;
}

export interface DatacenterMarker extends BaseMarker {
    _kind: 'datacenter';
    id: string;
    name: string;
    owner: string;
    country: string;
    chipType: string;
}

export interface WaterwayMarker extends BaseMarker {
    _kind: 'waterway';
    id: string;
    name: string;
    description: string;
}

export interface MineralMarker extends BaseMarker {
    _kind: 'mineral';
    id: string;
    name: string;
    mineral: string;
    country: string;
    status: string;
}

export interface GlobePath {
    id: string;
    name: string;
    points: [number, number][];
    pathType: 'cable' | 'oil' | 'gas' | 'products' | 'boundary';
    status: string;
}

// ─── Worker message types ───────────────────────────────────────────────────

export interface GlobeStaticReadyMessage {
    type: 'static-ready';
    milBaseMarkers: MilBaseMarker[];
    nuclearSiteMarkers: NuclearSiteMarker[];
    irradiatorSiteMarkers: IrradiatorSiteMarker[];
    spaceportSiteMarkers: SpaceportSiteMarker[];
    economicMarkers: EconomicMarker[];
    datacenterMarkers: DatacenterMarker[];
    waterwayMarkers: WaterwayMarker[];
    mineralMarkers: MineralMarker[];
    tradeRouteSegments: TradeRouteSegment[];
    globePaths: GlobePath[];
}

// ─── Data preparation (same logic as GlobeMap.initStaticLayers) ─────────────

function prepareStaticData(): GlobeStaticReadyMessage {
    const milBaseMarkers: MilBaseMarker[] = (MILITARY_BASES as MilitaryBase[]).map(b => ({
        _kind: 'milbase' as const,
        _lat: b.lat,
        _lng: b.lon,
        id: b.id,
        name: b.name,
        type: b.type,
        country: b.country ?? '',
    }));

    const nuclearSiteMarkers: NuclearSiteMarker[] = (NUCLEAR_FACILITIES as any[])
        .filter(f => f.status !== 'decommissioned')
        .map(f => ({
            _kind: 'nuclearSite' as const,
            _lat: f.lat,
            _lng: f.lon,
            id: f.id,
            name: f.name,
            type: f.type,
            status: f.status,
        }));

    const irradiatorSiteMarkers: IrradiatorSiteMarker[] = (GAMMA_IRRADIATORS as GammaIrradiator[]).map(g => ({
        _kind: 'irradiator' as const,
        _lat: g.lat,
        _lng: g.lon,
        id: g.id,
        city: g.city,
        country: g.country,
    }));

    const spaceportSiteMarkers: SpaceportSiteMarker[] = (SPACEPORTS as Spaceport[])
        .filter(s => s.status === 'active')
        .map(s => ({
            _kind: 'spaceport' as const,
            _lat: s.lat,
            _lng: s.lon,
            id: s.id,
            name: s.name,
            country: s.country,
            operator: s.operator,
            launches: s.launches,
        }));

    const economicMarkers: EconomicMarker[] = (ECONOMIC_CENTERS as EconomicCenter[]).map(c => ({
        _kind: 'economic' as const,
        _lat: c.lat,
        _lng: c.lon,
        id: c.id,
        name: c.name,
        type: c.type,
        country: c.country,
        description: c.description ?? '',
    }));

    const datacenterMarkers: DatacenterMarker[] = (AI_DATA_CENTERS as AIDataCenter[])
        .filter(d => d.status !== 'decommissioned')
        .map(d => ({
            _kind: 'datacenter' as const,
            _lat: d.lat,
            _lng: d.lon,
            id: d.id,
            name: d.name,
            owner: d.owner,
            country: d.country,
            chipType: d.chipType,
        }));

    const waterwayMarkers: WaterwayMarker[] = (STRATEGIC_WATERWAYS as StrategicWaterway[]).map(w => ({
        _kind: 'waterway' as const,
        _lat: w.lat,
        _lng: w.lon,
        id: w.id,
        name: w.name,
        description: w.description ?? '',
    }));

    const mineralMarkers: MineralMarker[] = (CRITICAL_MINERALS as CriticalMineralProject[])
        .filter(m => m.status === 'producing' || m.status === 'development')
        .map(m => ({
            _kind: 'mineral' as const,
            _lat: m.lat,
            _lng: m.lon,
            id: m.id,
            name: m.name,
            mineral: m.mineral,
            country: m.country,
            status: m.status,
        }));

    const tradeRouteSegments = resolveTradeRouteSegments();

    const globePaths: GlobePath[] = [
        ...expandUnderseaCablePaths(UNDERSEA_CABLES as UnderseaCable[]).map(c => ({
            id: c.id,
            name: c.name,
            points: c.points,
            pathType: 'cable' as const,
            status: 'ok',
        })),
        ...(PIPELINES as Pipeline[]).map(p => ({
            id: p.id,
            name: p.name,
            points: p.points,
            pathType: p.type,
            status: p.status,
        })),
        ...(GEOPOLITICAL_BOUNDARIES as GeopoliticalBoundary[]).map(b => ({
            id: b.id,
            name: b.name,
            points: b.points,
            pathType: 'boundary' as const,
            status: b.status,
        })),
    ];

    return {
        type: 'static-ready',
        milBaseMarkers,
        nuclearSiteMarkers,
        irradiatorSiteMarkers,
        spaceportSiteMarkers,
        economicMarkers,
        datacenterMarkers,
        waterwayMarkers,
        mineralMarkers,
        tradeRouteSegments,
        globePaths,
    };
}

// ─── Message handler ────────────────────────────────────────────────────────

self.onmessage = (event: MessageEvent<{ type: string }>) => {
    if (event.data.type === 'init') {
        const result = prepareStaticData();
        self.postMessage(result);
    }
};
