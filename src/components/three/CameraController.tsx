import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3, CatmullRomCurve3 } from 'three';
import type { CameraMode } from '@/types/three';

interface CameraControllerProps {
  mode: CameraMode;
  curve: CatmullRomCurve3;
  progress: number;
  focusPosition?: Vector3 | null;
  onModeChange?: (mode: CameraMode) => void;
}

const OVERVIEW_POS = new Vector3(0, 65, 40);
const OVERVIEW_TARGET = new Vector3(0, 0, -80);

/**
 * Camera controller with three modes:
 * - overview: bird's-eye view of the entire road
 * - follow: camera tracks behind the pulse
 * - focus: fly to a specific landmark
 */
export function CameraController({
  mode,
  curve,
  progress,
  focusPosition,
}: CameraControllerProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const targetRef = useRef(new Vector3());
  const posRef = useRef(new Vector3());

  // Set initial camera position
  useEffect(() => {
    camera.position.copy(OVERVIEW_POS);
    camera.lookAt(OVERVIEW_TARGET);
  }, [camera]);

  useFrame(() => {
    const lerpSpeed = 0.03;

    if (mode === 'overview') {
      posRef.current.lerp(OVERVIEW_POS, lerpSpeed);
      targetRef.current.lerp(OVERVIEW_TARGET, lerpSpeed);
    } else if (mode === 'follow') {
      const t = Math.min(Math.max(progress, 0.01), 0.98);
      const pulsePoint = curve.getPointAt(t);
      // Camera behind and above the pulse
      const lookAhead = Math.min(t + 0.05, 0.99);
      const aheadPoint = curve.getPointAt(lookAhead);
      const dir = aheadPoint.clone().sub(pulsePoint).normalize();

      posRef.current.lerp(
        new Vector3(
          pulsePoint.x - dir.x * 25 + 8,
          25,
          pulsePoint.z - dir.z * 25,
        ),
        lerpSpeed,
      );
      targetRef.current.lerp(
        new Vector3(pulsePoint.x, 2, pulsePoint.z - 15),
        lerpSpeed,
      );
    } else if (mode === 'focus' && focusPosition) {
      posRef.current.lerp(
        new Vector3(focusPosition.x + 12, 20, focusPosition.z + 18),
        lerpSpeed * 1.5,
      );
      targetRef.current.lerp(focusPosition, lerpSpeed * 1.5);
    }

    camera.position.lerp(posRef.current, 0.08);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetRef.current, 0.08);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      maxPolarAngle={Math.PI / 2.2}
      minDistance={10}
      maxDistance={150}
      enablePan
      panSpeed={0.5}
    />
  );
}
