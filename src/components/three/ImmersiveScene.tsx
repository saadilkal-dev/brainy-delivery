import { useMemo, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { CatmullRomCurve3 } from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { SkyEnvironment } from './SkyEnvironment';
import { ProjectRoad } from './ProjectRoad';
import { ModuleLandmark } from './ModuleLandmark';
import { ProgressPulse } from './ProgressPulse';
import { CameraController } from './CameraController';
import { DetourSegment } from './DetourSegment';
import { MeetingMarker } from './MeetingMarker';
import { MapHUD } from './MapHUD';
import type { MapGeometry, CameraMode } from '@/types/three';

interface ImmersiveSceneProps {
  geometry: MapGeometry;
  driftDays?: number;
  targetDate?: string;
}

function SceneContent({ geometry, cameraMode, setCameraMode, focusId, setFocusId }: {
  geometry: MapGeometry;
  cameraMode: CameraMode;
  setCameraMode: (m: CameraMode) => void;
  focusId: string | null;
  setFocusId: (id: string | null) => void;
}) {
  const curve = useMemo(
    () => new CatmullRomCurve3(geometry.pathPoints, false, 'catmullrom', 0.5),
    [geometry.pathPoints],
  );

  const focusPos = focusId
    ? geometry.landmarks.find((l) => l.id === focusId)?.position ?? null
    : null;

  const handleLandmarkClick = (id: string) => {
    if (focusId === id) {
      setFocusId(null);
      setCameraMode('overview');
    } else {
      setFocusId(id);
      setCameraMode('focus');
    }
  };

  return (
    <>
      <SkyEnvironment />

      <ProjectRoad pathPoints={geometry.pathPoints} progress={geometry.pulseT} />

      {geometry.landmarks.map((lm) => (
        <ModuleLandmark
          key={lm.id}
          data={lm}
          onClick={handleLandmarkClick}
        />
      ))}

      <ProgressPulse curve={curve} progress={geometry.pulseT} />

      {geometry.detours.map((d) => (
        <DetourSegment key={d.id} data={d} roadCurve={curve} />
      ))}

      {/* Meeting notes as terrain hillocks */}
      {(geometry.meetingMarkers ?? []).map((mm) => (
        <MeetingMarker key={mm.id} data={mm} />
      ))}

      <CameraController
        mode={cameraMode}
        curve={curve}
        progress={geometry.pulseT}
        focusPosition={focusPos}
      />

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.6}
          luminanceSmoothing={0.4}
          intensity={1.2}
        />
      </EffectComposer>
    </>
  );
}

/**
 * Main 3D scene wrapper. Renders the Canvas + HTML HUD overlay.
 */
export function ImmersiveScene({ geometry, driftDays, targetDate }: ImmersiveSceneProps) {
  const [cameraMode, setCameraMode] = useState<CameraMode>('overview');
  const [focusId, setFocusId] = useState<string | null>(null);

  return (
    <div className="relative w-full h-full bg-[#f4f3f0]">
      <Canvas
        camera={{ position: [0, 65, 40], fov: 55, near: 0.5, far: 500 }}
        dpr={[1, 2]}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Suspense fallback={null}>
          <SceneContent
            geometry={geometry}
            cameraMode={cameraMode}
            setCameraMode={setCameraMode}
            focusId={focusId}
            setFocusId={setFocusId}
          />
        </Suspense>
      </Canvas>

      <MapHUD
        completedModules={geometry.completedModules}
        totalModules={geometry.totalModules}
        driftDays={driftDays}
        targetDate={targetDate}
        cameraMode={cameraMode}
        onCameraMode={(m) => {
          setCameraMode(m);
          if (m !== 'focus') setFocusId(null);
        }}
      />
    </div>
  );
}
