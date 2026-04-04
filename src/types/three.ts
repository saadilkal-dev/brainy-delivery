import type { Vector3 } from 'three';
import type { Module } from './index';

export interface LandmarkData {
  id: string;
  module: Module;
  position: Vector3;
  t: number; // 0..1 position on the curve
  height: number;
  opacity: number;
}

export interface DetourData {
  id: string;
  fromModuleId: string;
  toModuleId: string;
  reason: string;
  controlPoints: Vector3[];
}

export interface TimeMarker {
  label: string;
  t: number;
  position: Vector3;
}

export interface MapGeometry {
  pathPoints: Vector3[];
  landmarks: LandmarkData[];
  pulseT: number; // 0..1 progress on the curve
  detours: DetourData[];
  timeMarkers: TimeMarker[];
  totalModules: number;
  completedModules: number;
}

export type CameraMode = 'overview' | 'follow' | 'focus';

export interface CameraState {
  mode: CameraMode;
  focusLandmarkId?: string;
}
