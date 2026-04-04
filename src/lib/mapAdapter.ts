import { Vector3 } from 'three';
import type { Module } from '@/types';
import type { MapGeometry, LandmarkData, DetourData, TimeMarker, MeetingMarkerData } from '@/types/three';
import type { MeetingNote } from '@/api/mockMeetingNotes';

const ROAD_LENGTH = 220;

/**
 * Transforms module and dashboard data into 3D map geometry.
 * Each module maps to a position along a winding CatmullRomCurve3.
 */
export function buildMapGeometry(
  modules: Module[],
  completedCount: number,
  totalCount: number,
  meetingNotes?: MeetingNote[],
): MapGeometry {
  const sorted = [...modules].sort((a, b) => a.order - b.order);
  const n = sorted.length;

  // Build path control points — a winding road going forward (negative Z)
  const pathPoints: Vector3[] = [];
  const segments = Math.max(n + 1, 8);

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    // Multi-frequency organic curve — avoids mechanical sine regularity
    const x = Math.sin(t * Math.PI * 1.2) * 12
            + Math.sin(t * Math.PI * 3.7) * 4
            + Math.sin(t * Math.PI * 7.3) * 1.5;
    // Gentle elevation variation for depth
    const y = Math.sin(t * Math.PI * 2.1) * 2.5
            + Math.sin(t * Math.PI * 4.3) * 0.8;
    const z = -t * ROAD_LENGTH;
    pathPoints.push(new Vector3(x, y, z));
  }

  // Build landmarks — one per module, evenly spaced along the path
  const landmarks: LandmarkData[] = sorted.map((mod, idx) => {
    const t = n > 1 ? (idx + 0.5) / n : 0.5;
    const ptIdx = Math.round(t * segments);
    const pt = pathPoints[Math.min(ptIdx, segments)];

    const hours = mod.estimated_hours ?? 40;
    const height = Math.min(Math.max(hours / 10, 1.5), 8);

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

  // Detours — properly connected: start from road, arc out, rejoin road
  const detours: DetourData[] = sorted
    .filter((m) => m.status === 'blocked')
    .map((m) => {
      const lm = landmarks.find((l) => l.id === m.id);
      if (!lm) return null;

      // Find road positions just before and just after this module
      const tBefore = Math.max(0, lm.t - 0.12);
      const tAfter = Math.min(1, lm.t + 0.12);
      const idxBefore = Math.round(tBefore * segments);
      const idxAfter = Math.min(Math.round(tAfter * segments), segments);
      const ptBefore = pathPoints[idxBefore];
      const ptAfter = pathPoints[idxAfter];

      // Arc out to the left of the road at the midpoint
      const midX = lm.position.x - 14;
      const midZ = lm.position.z;

      return {
        id: `detour-${m.id}`,
        fromModuleId: m.id,
        toModuleId: m.id,
        reason: m.blocker_reason ?? 'Blocked',
        controlPoints: [
          new Vector3(ptBefore.x, 0, ptBefore.z),        // branch from road
          new Vector3(midX + 2, 0, ptBefore.z - 8),      // diverge outward
          new Vector3(midX, 0, midZ),                     // apex (widest deviation)
          new Vector3(midX + 2, 0, ptAfter.z + 8),       // converge back
          new Vector3(ptAfter.x, 0, ptAfter.z),          // rejoin road
        ],
      };
    })
    .filter(Boolean) as DetourData[];

  // Meeting notes as topography markers — alternating sides of the road
  const meetingMarkers: MeetingMarkerData[] = (meetingNotes ?? []).map((note, i) => {
    // Distribute meetings evenly along the first 60% of the road
    const t = n > 0 ? (i + 0.5) / Math.max(meetingNotes!.length, 1) * 0.65 : 0.2;
    const ptIdx = Math.round(t * segments);
    const pt = pathPoints[Math.min(ptIdx, segments)];

    // Alternate sides: left (negative x offset) and right (positive x offset)
    const side: 'left' | 'right' = i % 2 === 0 ? 'left' : 'right';
    const sideOffset = side === 'left' ? -11 : 11;

    return {
      id: note.id,
      meeting: note,
      position: new Vector3(pt.x + sideOffset, 0, pt.z),
      side,
    };
  });

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
    meetingMarkers,
    totalModules: totalCount,
    completedModules: completedCount,
  };
}
