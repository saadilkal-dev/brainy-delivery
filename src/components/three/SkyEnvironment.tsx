import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { Color, FogExp2 } from 'three';

/**
 * Minimal dark environment: charcoal gradient ground + fog for depth.
 * No stars, no particles — premium minimalism.
 */
export function SkyEnvironment() {
  const { scene } = useThree();

  useEffect(() => {
    scene.background = new Color('#0a0a0b');
    scene.fog = new FogExp2('#0a0a0b', 0.004);
    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [scene]);

  return (
    <>
      {/* Ambient fill — very dim */}
      <ambientLight intensity={0.15} color="#e4e4e7" />

      {/* Key light — cool white from above-right */}
      <directionalLight
        position={[30, 60, 20]}
        intensity={0.6}
        color="#fafafa"
      />

      {/* Fill light — dim violet tint from left */}
      <directionalLight
        position={[-20, 30, -10]}
        intensity={0.12}
        color="#7c3aed"
      />

      {/* Ground plane — dark, extends to fog */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, -100]} receiveShadow>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial
          color="#111113"
          roughness={0.95}
          metalness={0.05}
        />
      </mesh>
    </>
  );
}
