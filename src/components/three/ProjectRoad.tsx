import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { CatmullRomCurve3, TubeGeometry, ShaderMaterial, Color } from 'three';
import type { Vector3 } from 'three';

interface ProjectRoadProps {
  pathPoints: Vector3[];
  progress: number; // 0..1
}

/**
 * Renders the project road as a tube following a CatmullRomCurve3.
 * Custom shader: completed = light gray, pulse = soft violet, upcoming = dark.
 */
export function ProjectRoad({ pathPoints, progress }: ProjectRoadProps) {
  const materialRef = useRef<ShaderMaterial>(null);

  const { curve, geometry } = useMemo(() => {
    const c = new CatmullRomCurve3(pathPoints, false, 'catmullrom', 0.5);
    const g = new TubeGeometry(c, 200, 1.2, 12, false);
    return { curve: c, geometry: g };
  }, [pathPoints]);

  // Animate the pulse shader
  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uProgress.value = progress;
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uProgress: { value: progress },
          uTime: { value: 0 },
          uCompletedColor: { value: new Color('#a1a1aa') }, // zinc-400
          uPulseColor: { value: new Color('#7c3aed') },
          uUpcomingColor: { value: new Color('#27272a') }, // zinc-800
          uBaseColor: { value: new Color('#18181b') },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uProgress;
          uniform float uTime;
          uniform vec3 uCompletedColor;
          uniform vec3 uPulseColor;
          uniform vec3 uUpcomingColor;
          uniform vec3 uBaseColor;
          varying vec2 vUv;
          void main() {
            float t = vUv.x;
            float pulse = smoothstep(0.05, 0.0, abs(t - uProgress));
            pulse *= 0.6 + 0.4 * sin(uTime * 2.5);
            vec3 color = t < uProgress ? uCompletedColor : uUpcomingColor;
            color = mix(color, uPulseColor, pulse);
            float edge = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
            color = mix(uBaseColor, color, edge * 0.85 + 0.15);
            gl_FragColor = vec4(color, 1.0);
          }
        `,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <mesh geometry={geometry} material={material} ref={(mesh) => {
      if (mesh) materialRef.current = mesh.material as ShaderMaterial;
    }} />
  );
}
