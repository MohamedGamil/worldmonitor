import type { UnderseaCable } from '@/types';
import { haversineKm } from '@/utils/distance';

type LonLat = [number, number];
type IsLandFn = (lat: number, lon: number) => boolean;

const REVISIT_SPLIT_KM = 900;
const TELEPORT_SPLIT_KM = 5200;
const LAND_SAMPLE_STEP_KM = 250;
const LAND_SPLIT_RATIO = 0.55;
const LAND_SEGMENT_IGNORE_KM = 450;

function isFinitePoint(point: LonLat): boolean {
  return Number.isFinite(point[0]) && Number.isFinite(point[1]);
}

function splitCablePoints(points: LonLat[]): LonLat[][] {
  const clean = points.filter(isFinitePoint);
  if (clean.length < 2) return [];

  const segments: LonLat[][] = [];
  let current: LonLat[] = [clean[0]!];

  for (let index = 1; index < clean.length; index += 1) {
    const prev = clean[index - 1]!;
    const curr = clean[index]!;
    const stepKm = haversineKm(prev[1], prev[0], curr[1], curr[0]);

    // Some source rows encode multiple cable branches in one point array.
    // Split when a branch "restarts" near an earlier point or teleports.
    const revisitsEarlier =
      current.length >= 3 &&
      current.slice(0, -1).some((point) =>
        haversineKm(point[1], point[0], curr[1], curr[0]) <= REVISIT_SPLIT_KM,
      );
    const teleports = stepKm > TELEPORT_SPLIT_KM;

    if ((revisitsEarlier || teleports) && current.length >= 2) {
      segments.push(current);
      current = [curr];
      continue;
    }

    current.push(curr);
  }

  if (current.length >= 2) segments.push(current);
  return segments;
}

export function expandUnderseaCablePaths(cables: UnderseaCable[]): UnderseaCable[] {
  const expanded: UnderseaCable[] = [];

  for (const cable of cables) {
    const parts = splitCablePoints(cable.points);
    if (!parts.length) continue;
    for (const points of parts) {
      expanded.push({ ...cable, points });
    }
  }

  return expanded;
}

function sampleEdgeLandRatio(start: LonLat, end: LonLat, isLand: IsLandFn): number {
  const edgeKm = haversineKm(start[1], start[0], end[1], end[0]);
  if (edgeKm <= 0) return 0;

  const samples = Math.max(2, Math.min(10, Math.floor(edgeKm / LAND_SAMPLE_STEP_KM)));
  let landHits = 0;
  let total = 0;
  for (let i = 1; i <= samples; i += 1) {
    const t = i / (samples + 1);
    const lon = start[0] + (end[0] - start[0]) * t;
    const lat = start[1] + (end[1] - start[1]) * t;
    total += 1;
    if (isLand(lat, lon)) landHits += 1;
  }

  return total > 0 ? landHits / total : 0;
}

function clipSegmentToLikelyWater(points: LonLat[], isLand: IsLandFn): LonLat[][] {
  if (points.length < 2) return [];

  const parts: LonLat[][] = [];
  let current: LonLat[] = [points[0]!];

  for (let index = 1; index < points.length; index += 1) {
    const prev = points[index - 1]!;
    const curr = points[index]!;
    const edgeKm = haversineKm(prev[1], prev[0], curr[1], curr[0]);

    // Keep short near-shore hops even if they touch land (landing points).
    if (edgeKm <= LAND_SEGMENT_IGNORE_KM) {
      current.push(curr);
      continue;
    }

    const landRatio = sampleEdgeLandRatio(prev, curr, isLand);
    if (landRatio >= LAND_SPLIT_RATIO) {
      if (current.length >= 2) parts.push(current);
      current = [curr];
      continue;
    }

    current.push(curr);
  }

  if (current.length >= 2) parts.push(current);
  return parts;
}

export function constrainUnderseaCablesToWater(
  cables: UnderseaCable[],
  isLand: IsLandFn,
): UnderseaCable[] {
  const constrained: UnderseaCable[] = [];

  for (const cable of cables) {
    const clipped = clipSegmentToLikelyWater(cable.points, isLand);
    for (const points of clipped) {
      constrained.push({ ...cable, points });
    }
  }

  return constrained;
}
