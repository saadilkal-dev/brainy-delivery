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
    scene.background = new Color('#f4f3f0');
    scene.fog = new FogExp2('#f4f3f0', 0.006);
    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [scene]);

  return (
    <>
      {/* Ambient fill — bright for light scene */}
      <ambientLight intensity={0.8} color="#ffffff" />

      {/* Key light — warm white from above-right */}
      <directionalLight
        position={[30, 60, 20]}
        intensity={1.2}
        color="#ffffff"
      />

      {/* Fill light — very subtle violet tint from left */}
      <directionalLight
        position={[-20, 30, -10]}
        intensity={0.08}
        color="#7c3aed"
      />

      {/* Ground plane — warm light gray */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, -110]} receiveShadow>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial
          color="#e8e6e1"
          roughness={0.95}
          metalness={0.0}
        />
      </mesh>
    </>
  );
}
