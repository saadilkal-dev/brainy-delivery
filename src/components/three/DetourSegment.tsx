import { useMemo } from 'react';
import { CatmullRomCurve3, TubeGeometry, Vector3 } from 'three';
import { Html } from '@react-three/drei';
import type { DetourData } from '@/types/three';

interface DetourSegmentProps {
  data: DetourData;
  roadCurve: CatmullRomCurve3;
}

/**
 * Visual detour/deviation from the main road at blocked modules.
 * Rendered as a dimmer, thinner tube diverging from the main path.
 */
export function DetourSegment({ data }: DetourSegmentProps) {
  const { geometry, curve } = useMemo(() => {
    const c = new CatmullRomCurve3(data.controlPoints, false, 'catmullrom', 0.5);
    const g = new TubeGeometry(c, 40, 0.4, 8, false);
    return { geometry: g, curve: c };
  }, [data.controlPoints]);

  const midpoint = useMemo(() => curve.getPointAt(0.5), [curve]);

  return (
    <group>
      {/* Detour tube — dimmer, thinner */}
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#7c3aed"
          transparent
          opacity={0.2}
          roughness={0.6}
        />
      </mesh>

      {/* Dashed line effect — small spheres along the detour */}
      {Array.from({ length: 8 }).map((_, i) => {
        const t = (i + 1) / 9;
        const pt = curve.getPointAt(t);
        return (
          <mesh key={i} position={[pt.x, pt.y + 0.3, pt.z]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshStandardMaterial
              color="#ef4444"
              transparent
              opacity={0.35}
              emissive="#ef4444"
              emissiveIntensity={0.3}
            />
          </mesh>
        );
      })}

      {/* Blocker reason label */}
      <Html
        position={[midpoint.x - 3, 2, midpoint.z]}
        center
        distanceFactor={40}
        style={{ pointerEvents: 'none' }}
      >
        <div style={{
          background: 'rgba(239,68,68,0.08)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '4px',
          padding: '3px 8px',
          maxWidth: '140px',
        }}>
          <span style={{
            color: '#fca5a5',
            fontSize: '8px',
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 500,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            Blocked
          </span>
          <div style={{
            color: '#a1a1aa',
            fontSize: '9px',
            fontFamily: 'Inter, system-ui, sans-serif',
            marginTop: '2px',
            lineHeight: 1.3,
          }}>
            {data.reason.length > 50 ? data.reason.slice(0, 50) + '...' : data.reason}
          </div>
        </div>
      </Html>
    </group>
  );
}
