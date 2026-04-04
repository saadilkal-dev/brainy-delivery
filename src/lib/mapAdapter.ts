import { Vector3 } from 'three';
import type { Module } from '@/types';
import type { MapGeometry, LandmarkData, DetourData, TimeMarker } from '@/types/three';

const ROAD_LENGTH = 200;
const CURVE_AMPLITUDE = 12;

/**
 * Transforms module and dashboard data into 3D map geometry.
 * Each module maps to a position along a winding CatmullRomCurve3.
 */
export function buildMapGeometry(
  modules: Module[],
  completedCount: number,
  totalCount: number,
): MapGeometry {
  const sorted = [...modules].sort((a, b) => a.order - b.order);
  const n = sorted.length;

  // Build path control points — a winding road going forward (negative Z)
  const pathPoints: Vector3[] = [];
  const segments = Math.max(n + 1, 8);

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = Math.sin(t * Math.PI * 1.8) * CURVE_AMPLITUDE;
    const y = 0;
    const z = -t * ROAD_LENGTH;
    pathPoints.push(new Vector3(x, y, z));
  }

  // Build landmarks — one per module, evenly spaced along the path
  const landmarks: LandmarkData[] = sorted.map((mod, idx) => {
    const t = n > 1 ? (idx + 0.5) / n : 0.5;
    const ptIdx = Math.round(t * segments);
    const pt = pathPoints[Math.min(ptIdx, segments)];

    // Height proportional to estimated_hours, capped
    const hours = mod.estimated_hours ?? 40;
    const height = Math.min(Math.max(hours / 10, 1.5), 8);

    // Opacity based on status: complete = 1, in_progress = 0.85, not_started = 0.35, blocked = 0.6
    const opacityMap: Record<string, number> = {
      complete: 1,
      in_progress: 0.85,
      blocked: 0.6,
      not_started: 0.35,
    };

    return {
      id: mod.id,
      module: mod,
      position: new Vector3(pt.x, 0, pt.z),
      t,
      height,
      opacity: opacityMap[mod.status] ?? 0.35,
    };
  });

  // Pulse position — ratio of completed modules
  const pulseT = totalCount > 0 ? completedCount / totalCount : 0;

  // Detours from blocked modules
  const detours: DetourData[] = sorted
    .filter((m) => m.status === 'blocked')
    .map((m) => {
      const lm = landmarks.find((l) => l.id === m.id);
      if (!lm) return null;
      const offset = CURVE_AMPLITUDE * 0.6;
      return {
        id: `detour-${m.id}`,
        fromModuleId: m.id,
        toModuleId: m.id,
        reason: m.blocker_reason ?? 'Blocked',
        controlPoints: [
          new Vector3(lm.position.x - offset, 0, lm.position.z + 8),
          new Vector3(lm.position.x - offset * 1.5, 0, lm.position.z),
          new Vector3(lm.position.x - offset, 0, lm.position.z - 8),
        ],
      };
    })
    .filter(Boolean) as DetourData[];

  // Time markers — every few modules
  const timeMarkers: TimeMarker[] = [];
  const step = Math.max(1, Math.floor(n / 4));
  for (let i = 0; i < n; i += step) {
    const lm = landmarks[i];
    if (lm) {
      timeMarkers.push({
        label: `Module ${i + 1}`,
        t: lm.t,
        position: new Vector3(lm.position.x, 0, lm.position.z),
      });
    }
  }

  return {
    pathPoints,
    landmarks,
    pulseT,
    detours,
    timeMarkers,
    totalModules: totalCount,
    completedModules: completedCount,
  };
}
