import Supercluster from 'supercluster';
import { TECH_HQS, AI_DATA_CENTERS } from '@/config';
import type {
    SocialUnrestEvent,
    MapProtestCluster,
    MapTechHQCluster,
    MapTechEventCluster,
    MapDatacenterCluster,
    AIDataCenter
} from '@/types';
export interface TechEventMarker {
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

const MAX_CLUSTER_LEAVES = 200;

interface InitMessage { type: 'init'; }
interface SetProtestsMessage { type: 'set-protests'; source: SocialUnrestEvent[]; }
interface SetTechEventsMessage { type: 'set-tech-events'; source: TechEventMarker[]; }
interface GetClustersMessage {
    type: 'get-clusters';
    bbox: [number, number, number, number];
    zoom: number;
    layers: { protests: boolean; techHQs: boolean; techEvents: boolean; datacenters: boolean; };
}

export type WorkerMessage = InitMessage | SetProtestsMessage | SetTechEventsMessage | GetClustersMessage;

export interface GetClustersResult {
    type: 'clusters-result';
    bbox: [number, number, number, number];
    zoom: number;
    protestClusters?: MapProtestCluster[];
    techHQClusters?: MapTechHQCluster[];
    techEventClusters?: MapTechEventCluster[];
    datacenterClusters?: MapDatacenterCluster[];
}

let protestSC: Supercluster | null = null;
let techHQSC: Supercluster | null = null;
let techEventSC: Supercluster | null = null;
let datacenterSC: Supercluster | null = null;

let protestSuperclusterSource: SocialUnrestEvent[] = [];
let techEventsSource: TechEventMarker[] = [];

function rebuildProtestSupercluster(source: SocialUnrestEvent[]): void {
    protestSuperclusterSource = source;
    const points = source.map((p, i) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [p.lon, p.lat] as [number, number] },
        properties: {
            index: i,
            country: p.country,
            severity: p.severity,
            eventType: p.eventType,
            sourceType: p.sourceType,
            validated: Boolean(p.validated),
            fatalities: Number.isFinite(p.fatalities) ? Number(p.fatalities) : 0,
            timeMs: p.time.getTime(),
        },
    }));
    protestSC = new Supercluster({
        radius: 60,
        maxZoom: 14,
        map: (props: Record<string, unknown>) => ({
            index: Number(props.index ?? 0),
            country: String(props.country ?? ''),
            maxSeverityRank: props.severity === 'high' ? 2 : props.severity === 'medium' ? 1 : 0,
            riotCount: props.eventType === 'riot' ? 1 : 0,
            highSeverityCount: props.severity === 'high' ? 1 : 0,
            verifiedCount: props.validated ? 1 : 0,
            totalFatalities: Number(props.fatalities ?? 0) || 0,
            riotTimeMs: props.eventType === 'riot' && props.sourceType !== 'gdelt' && Number.isFinite(Number(props.timeMs)) ? Number(props.timeMs) : 0,
        }),
        reduce: (acc: Record<string, unknown>, props: Record<string, unknown>) => {
            acc.maxSeverityRank = Math.max(Number(acc.maxSeverityRank ?? 0), Number(props.maxSeverityRank ?? 0));
            acc.riotCount = Number(acc.riotCount ?? 0) + Number(props.riotCount ?? 0);
            acc.highSeverityCount = Number(acc.highSeverityCount ?? 0) + Number(props.highSeverityCount ?? 0);
            acc.verifiedCount = Number(acc.verifiedCount ?? 0) + Number(props.verifiedCount ?? 0);
            acc.totalFatalities = Number(acc.totalFatalities ?? 0) + Number(props.totalFatalities ?? 0);
            const accRiot = Number(acc.riotTimeMs ?? 0);
            const propRiot = Number(props.riotTimeMs ?? 0);
            acc.riotTimeMs = Number.isFinite(propRiot) ? Math.max(accRiot, propRiot) : accRiot;
            if (!acc.country && props.country) acc.country = props.country;
        },
    });
    protestSC.load(points);
}

function rebuildTechHQSupercluster(): void {
    const points = TECH_HQS.map((h, i) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [h.lon, h.lat] as [number, number] },
        properties: {
            index: i,
            city: h.city,
            country: h.country,
            type: h.type,
        },
    }));
    techHQSC = new Supercluster({
        radius: 50,
        maxZoom: 14,
        map: (props: Record<string, unknown>) => ({
            index: Number(props.index ?? 0),
            city: String(props.city ?? ''),
            country: String(props.country ?? ''),
            faangCount: props.type === 'faang' ? 1 : 0,
            unicornCount: props.type === 'unicorn' ? 1 : 0,
            publicCount: props.type === 'public' ? 1 : 0,
        }),
        reduce: (acc: Record<string, unknown>, props: Record<string, unknown>) => {
            acc.faangCount = Number(acc.faangCount ?? 0) + Number(props.faangCount ?? 0);
            acc.unicornCount = Number(acc.unicornCount ?? 0) + Number(props.unicornCount ?? 0);
            acc.publicCount = Number(acc.publicCount ?? 0) + Number(props.publicCount ?? 0);
            if (!acc.city && props.city) acc.city = props.city;
            if (!acc.country && props.country) acc.country = props.country;
        },
    });
    techHQSC.load(points);
}

function rebuildTechEventSupercluster(source: TechEventMarker[]): void {
    techEventsSource = source;
    const points = source.map((e, i) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [e.lng, e.lat] as [number, number] },
        properties: {
            index: i,
            location: e.location,
            country: e.country,
            daysUntil: e.daysUntil,
        },
    }));
    techEventSC = new Supercluster({
        radius: 50,
        maxZoom: 14,
        map: (props: Record<string, unknown>) => {
            const daysUntil = Number(props.daysUntil ?? Number.MAX_SAFE_INTEGER);
            return {
                index: Number(props.index ?? 0),
                location: String(props.location ?? ''),
                country: String(props.country ?? ''),
                soonestDaysUntil: Number.isFinite(daysUntil) ? daysUntil : Number.MAX_SAFE_INTEGER,
                soonCount: Number.isFinite(daysUntil) && daysUntil <= 14 ? 1 : 0,
            };
        },
        reduce: (acc: Record<string, unknown>, props: Record<string, unknown>) => {
            acc.soonestDaysUntil = Math.min(
                Number(acc.soonestDaysUntil ?? Number.MAX_SAFE_INTEGER),
                Number(props.soonestDaysUntil ?? Number.MAX_SAFE_INTEGER)
            );
            acc.soonCount = Number(acc.soonCount ?? 0) + Number(props.soonCount ?? 0);
            if (!acc.location && props.location) acc.location = props.location;
            if (!acc.country && props.country) acc.country = props.country;
        },
    });
    techEventSC.load(points);
}

function rebuildDatacenterSupercluster(): void {
    const activeDCs = AI_DATA_CENTERS.filter(dc => dc.status !== 'decommissioned');
    const points = activeDCs.map((dc, i) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [dc.lon, dc.lat] as [number, number] },
        properties: {
            index: i,
            country: dc.country,
            chipCount: dc.chipCount,
            powerMW: dc.powerMW ?? 0,
            status: dc.status,
        },
    }));
    datacenterSC = new Supercluster({
        radius: 70,
        maxZoom: 14,
        map: (props: Record<string, unknown>) => ({
            index: Number(props.index ?? 0),
            country: String(props.country ?? ''),
            totalChips: Number(props.chipCount ?? 0) || 0,
            totalPowerMW: Number(props.powerMW ?? 0) || 0,
            existingCount: props.status === 'existing' ? 1 : 0,
            plannedCount: props.status === 'planned' ? 1 : 0,
        }),
        reduce: (acc: Record<string, unknown>, props: Record<string, unknown>) => {
            acc.totalChips = Number(acc.totalChips ?? 0) + Number(props.totalChips ?? 0);
            acc.totalPowerMW = Number(acc.totalPowerMW ?? 0) + Number(props.totalPowerMW ?? 0);
            acc.existingCount = Number(acc.existingCount ?? 0) + Number(props.existingCount ?? 0);
            acc.plannedCount = Number(acc.plannedCount ?? 0) + Number(props.plannedCount ?? 0);
            if (!acc.country && props.country) acc.country = props.country;
        },
    });
    datacenterSC.load(points);
}

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
    const msg = event.data;
    switch (msg.type) {
        case 'init':
            rebuildTechHQSupercluster();
            rebuildDatacenterSupercluster();
            self.postMessage({ type: 'ready' });
            break;

        case 'set-protests':
            // Dates get stripped via postMessage, but we assume it's reconstructed if necessary
            // Actually, for protests, we look at time later for filtering
            // Reconstitute date objects
            rebuildProtestSupercluster(msg.source.map(p => ({
                ...p,
                time: new Date(p.time)
            })));
            break;

        case 'set-tech-events':
            rebuildTechEventSupercluster(msg.source);
            break;

        case 'get-clusters': {
            const { bbox, zoom, layers } = msg;

            let protestClusters: MapProtestCluster[] | undefined;
            let techHQClusters: MapTechHQCluster[] | undefined;
            let techEventClusters: MapTechEventCluster[] | undefined;
            let datacenterClusters: MapDatacenterCluster[] | undefined;

            if (layers.protests && protestSC && protestSuperclusterSource.length > 0) {
                protestClusters = protestSC.getClusters(bbox, zoom).map(f => {
                    const coords = f.geometry.coordinates as [number, number];
                    if (f.properties.cluster) {
                        const props = f.properties as Record<string, unknown>;
                        const leaves = protestSC!.getLeaves(f.properties.cluster_id as number, MAX_CLUSTER_LEAVES);
                        const items = leaves.map(l => protestSuperclusterSource[l.properties.index as number]).filter((x): x is SocialUnrestEvent => !!x);
                        const maxSeverityRank = Number(props.maxSeverityRank ?? 0);
                        const maxSev = maxSeverityRank >= 2 ? 'high' : maxSeverityRank === 1 ? 'medium' : 'low';
                        const riotCount = Number(props.riotCount ?? 0);
                        const highSeverityCount = Number(props.highSeverityCount ?? 0);
                        const verifiedCount = Number(props.verifiedCount ?? 0);
                        const totalFatalities = Number(props.totalFatalities ?? 0);
                        const clusterCount = Number(f.properties.point_count ?? items.length);
                        const riotTimeMs = Number(props.riotTimeMs ?? 0);
                        return {
                            id: `pc-${f.properties.cluster_id}`,
                            lat: coords[1], lon: coords[0],
                            count: clusterCount,
                            items,
                            country: String(props.country ?? items[0]?.country ?? ''),
                            maxSeverity: maxSev as 'low' | 'medium' | 'high',
                            hasRiot: riotCount > 0,
                            latestRiotEventTimeMs: riotTimeMs || undefined,
                            totalFatalities,
                            riotCount,
                            highSeverityCount,
                            verifiedCount,
                            sampled: items.length < clusterCount,
                        };
                    }
                    const item = protestSuperclusterSource[f.properties.index as number]!;
                    return {
                        id: `pp-${f.properties.index}`, lat: item.lat, lon: item.lon,
                        count: 1, items: [item], country: item.country,
                        maxSeverity: item.severity, hasRiot: item.eventType === 'riot',
                        latestRiotEventTimeMs:
                            item.eventType === 'riot' && item.sourceType !== 'gdelt' && Number.isFinite(item.time.getTime())
                                ? item.time.getTime()
                                : undefined,
                        totalFatalities: item.fatalities ?? 0,
                        riotCount: item.eventType === 'riot' ? 1 : 0,
                        highSeverityCount: item.severity === 'high' ? 1 : 0,
                        verifiedCount: item.validated ? 1 : 0,
                        sampled: false,
                    };
                });
            }

            if (layers.techHQs && techHQSC) {
                techHQClusters = techHQSC.getClusters(bbox, zoom).map(f => {
                    const coords = f.geometry.coordinates as [number, number];
                    if (f.properties.cluster) {
                        const props = f.properties as Record<string, unknown>;
                        const leaves = techHQSC!.getLeaves(f.properties.cluster_id as number, MAX_CLUSTER_LEAVES);
                        const items = leaves.map(l => TECH_HQS[l.properties.index as number]).filter(Boolean) as typeof TECH_HQS;
                        const faangCount = Number(props.faangCount ?? 0);
                        const unicornCount = Number(props.unicornCount ?? 0);
                        const publicCount = Number(props.publicCount ?? 0);
                        const clusterCount = Number(f.properties.point_count ?? items.length);
                        const primaryType = faangCount >= unicornCount && faangCount >= publicCount
                            ? 'faang'
                            : unicornCount >= publicCount
                                ? 'unicorn'
                                : 'public';
                        return {
                            id: `hc-${f.properties.cluster_id}`,
                            lat: coords[1], lon: coords[0],
                            count: clusterCount,
                            items,
                            city: String(props.city ?? items[0]?.city ?? ''),
                            country: String(props.country ?? items[0]?.country ?? ''),
                            primaryType,
                            faangCount,
                            unicornCount,
                            publicCount,
                            sampled: items.length < clusterCount,
                        };
                    }
                    const item = TECH_HQS[f.properties.index as number]!;
                    return {
                        id: `hp-${f.properties.index}`, lat: item.lat, lon: item.lon,
                        count: 1, items: [item], city: item.city, country: item.country,
                        primaryType: item.type,
                        faangCount: item.type === 'faang' ? 1 : 0,
                        unicornCount: item.type === 'unicorn' ? 1 : 0,
                        publicCount: item.type === 'public' ? 1 : 0,
                        sampled: false,
                    };
                });
            }

            if (layers.techEvents && techEventSC && techEventsSource.length > 0) {
                techEventClusters = techEventSC.getClusters(bbox, zoom).map(f => {
                    const coords = f.geometry.coordinates as [number, number];
                    if (f.properties.cluster) {
                        const props = f.properties as Record<string, unknown>;
                        const leaves = techEventSC!.getLeaves(f.properties.cluster_id as number, MAX_CLUSTER_LEAVES);
                        const items = leaves.map(l => techEventsSource[l.properties.index as number]).filter((x): x is TechEventMarker => !!x);
                        const clusterCount = Number(f.properties.point_count ?? items.length);
                        const soonestDaysUntil = Number(props.soonestDaysUntil ?? Number.MAX_SAFE_INTEGER);
                        const soonCount = Number(props.soonCount ?? 0);
                        return {
                            id: `ec-${f.properties.cluster_id}`,
                            lat: coords[1], lon: coords[0],
                            count: clusterCount,
                            items,
                            location: String(props.location ?? items[0]?.location ?? ''),
                            country: String(props.country ?? items[0]?.country ?? ''),
                            soonestDaysUntil: Number.isFinite(soonestDaysUntil) ? soonestDaysUntil : Number.MAX_SAFE_INTEGER,
                            soonCount,
                            sampled: items.length < clusterCount,
                        };
                    }
                    const item = techEventsSource[f.properties.index as number]!;
                    return {
                        id: `ep-${f.properties.index}`, lat: item.lat, lon: item.lng,
                        count: 1, items: [item], location: item.location, country: item.country,
                        soonestDaysUntil: item.daysUntil,
                        soonCount: item.daysUntil <= 14 ? 1 : 0,
                        sampled: false,
                    };
                });
            }

            if (layers.datacenters && datacenterSC) {
                const activeDCs = AI_DATA_CENTERS.filter(dc => dc.status !== 'decommissioned');
                datacenterClusters = datacenterSC.getClusters(bbox, zoom).map(f => {
                    const coords = f.geometry.coordinates as [number, number];
                    if (f.properties.cluster) {
                        const props = f.properties as Record<string, unknown>;
                        const leaves = datacenterSC!.getLeaves(f.properties.cluster_id as number, MAX_CLUSTER_LEAVES);
                        const items = leaves.map(l => activeDCs[l.properties.index as number]).filter((x): x is AIDataCenter => !!x);
                        const clusterCount = Number(f.properties.point_count ?? items.length);
                        const existingCount = Number(props.existingCount ?? 0);
                        const plannedCount = Number(props.plannedCount ?? 0);
                        const totalChips = Number(props.totalChips ?? 0);
                        const totalPowerMW = Number(props.totalPowerMW ?? 0);
                        return {
                            id: `dc-${f.properties.cluster_id}`,
                            lat: coords[1], lon: coords[0],
                            count: clusterCount,
                            items,
                            region: String(props.country ?? items[0]?.country ?? ''),
                            country: String(props.country ?? items[0]?.country ?? ''),
                            totalChips,
                            totalPowerMW,
                            majorityExisting: existingCount >= Math.max(1, clusterCount / 2),
                            existingCount,
                            plannedCount,
                            sampled: items.length < clusterCount,
                        };
                    }
                    const item = activeDCs[f.properties.index as number]!;
                    return {
                        id: `dp-${f.properties.index}`, lat: item.lat, lon: item.lon,
                        count: 1, items: [item], region: item.country, country: item.country,
                        totalChips: item.chipCount, totalPowerMW: item.powerMW ?? 0,
                        majorityExisting: item.status === 'existing',
                        existingCount: item.status === 'existing' ? 1 : 0,
                        plannedCount: item.status === 'planned' ? 1 : 0,
                        sampled: false,
                    };
                });
            }

            const result: GetClustersResult = {
                type: 'clusters-result',
                bbox,
                zoom,
                protestClusters,
                techHQClusters,
                techEventClusters,
                datacenterClusters
            };
            self.postMessage(result);
            break;
        }
    }
};
