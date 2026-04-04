import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Mesh, CatmullRomCurve3 } from 'three';

interface ProgressPulseProps {
  curve: CatmullRomCurve3;
  progress: number; // 0..1
}

/**
 * A clean glowing sphere that marks "you are here" on the road.
 * Bloom-friendly emissive material, subtle oscillating scale.
 */
export function ProgressPulse({ curve, progress }: ProgressPulseProps) {
  const meshRef = useRef<Mesh>(null);
  const ringRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current || !curve) return;
    const t = Math.min(Math.max(progress, 0.001), 0.999);
    const point = curve.getPointAt(t);

    // Position on the road
    meshRef.current.position.set(point.x, 1.5, point.z);

    // Subtle breathing scale
    const breath = 1 + 0.08 * Math.sin(clock.getElapsedTime() * 2.2);
    meshRef.current.scale.setScalar(breath);

    // Ring pulse
    if (ringRef.current) {
      ringRef.current.position.set(point.x, 0.15, point.z);
      const ringScale = 1 + 0.4 * Math.sin(clock.getElapsedTime() * 1.5);
      ringRef.current.scale.setScalar(ringScale);
      const mat = ringRef.current.material as any;
      if (mat.opacity !== undefined) {
        mat.opacity = 0.15 + 0.1 * Math.sin(clock.getElapsedTime() * 1.5);
      }
    }
  });

  const point = curve.getPointAt(Math.min(Math.max(progress, 0.001), 0.999));

  return (
    <>
      {/* Main pulse sphere */}
      <mesh ref={meshRef} position={[point.x, 1.5, point.z]}>
        <sphereGeometry args={[0.6, 24, 24]} />
        <meshStandardMaterial
          color="#7c3aed"
          emissive="#7c3aed"
          emissiveIntensity={0.8}
          roughness={0.2}
          metalness={0.3}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Ground ring — subtle halo */}
      <mesh
        ref={ringRef}
        position={[point.x, 0.15, point.z]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[2, 3, 32]} />
        <meshBasicMaterial
          color="#7c3aed"
          transparent
          opacity={0.15}
        />
      </mesh>

      {/* "You are here" label */}
      <Html
        position={[point.x, 3.5, point.z]}
        center
        distanceFactor={40}
        style={{ pointerEvents: 'none' }}
      >
        <div style={{
          background: 'rgba(124,58,237,0.12)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(124,58,237,0.25)',
          borderRadius: '4px',
          padding: '3px 8px',
          whiteSpace: 'nowrap',
        }}>
          <span style={{
            color: '#c4b5fd',
            fontSize: '9px',
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            Current Position
          </span>
        </div>
      </Html>
    </>
  );
}
