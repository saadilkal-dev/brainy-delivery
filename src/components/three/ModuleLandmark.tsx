import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Mesh } from 'three';
import type { LandmarkData } from '@/types/three';

interface ModuleLandmarkProps {
  data: LandmarkData;
  onClick?: (id: string) => void;
}

/**
 * Minimal monolith/slab per module.
 * Status conveyed through opacity + brightness, not color.
 * Blocked modules get a subtle pulsing dim effect.
 */
export function ModuleLandmark({ data, onClick }: ModuleLandmarkProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { module: mod, position, height, opacity } = data;

  const isBlocked = mod.status === 'blocked';
  const isComplete = mod.status === 'complete';
  const isActive = mod.status === 'in_progress';

  // Base brightness: complete = bright white, active = medium, others = dim
  const brightness = isComplete ? 0.9 : isActive ? 0.7 : isBlocked ? 0.35 : 0.25;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as any;

    // Hover scale
    const targetScale = hovered ? 1.08 : 1;
    meshRef.current.scale.x += (targetScale - meshRef.current.scale.x) * 0.1;
    meshRef.current.scale.z += (targetScale - meshRef.current.scale.z) * 0.1;

    // Blocked: subtle pulse
    if (isBlocked && mat.opacity !== undefined) {
      mat.opacity = opacity * (0.8 + 0.2 * Math.sin(clock.getElapsedTime() * 2));
    }
  });

  return (
    <group position={[position.x, 0, position.z]}>
      {/* The monolith slab */}
      <mesh
        ref={meshRef}
        position={[0, height / 2, 0]}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerLeave={() => setHovered(false)}
        onClick={(e) => { e.stopPropagation(); onClick?.(data.id); }}
        castShadow
      >
        <boxGeometry args={[1.6, height, 0.6]} />
        <meshStandardMaterial
          color={`hsl(0, 0%, ${brightness * 100}%)`}
          transparent
          opacity={opacity}
          roughness={0.4}
          metalness={0.1}
          emissive={isActive ? '#7c3aed' : '#000000'}
          emissiveIntensity={isActive ? 0.15 : 0}
        />
      </mesh>

      {/* Thin base line */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.4, 1]} />
        <meshStandardMaterial
          color="#27272a"
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Label — HTML overlay for clean typography */}
      <Html
        position={[0, height + 1.2, 0]}
        center
        distanceFactor={40}
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            background: hovered ? 'rgba(24,24,27,0.92)' : 'rgba(24,24,27,0.7)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(113,113,122,0.15)',
            borderRadius: '6px',
            padding: '6px 10px',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease',
            transform: hovered ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          <div style={{
            color: isComplete ? '#e4e4e7' : isActive ? '#c4b5fd' : '#71717a',
            fontSize: '11px',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 500,
            letterSpacing: '0.02em',
          }}>
            {mod.name}
          </div>
          {hovered && (
            <div style={{
              color: '#52525b',
              fontSize: '9px',
              fontFamily: 'JetBrains Mono, monospace',
              marginTop: '2px',
            }}>
              {mod.owner ?? 'Unassigned'} · {mod.progress_pct}%
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}
