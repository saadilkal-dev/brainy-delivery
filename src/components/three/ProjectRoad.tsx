import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { CatmullRomCurve3, BufferGeometry, Float32BufferAttribute, ShaderMaterial, Color } from 'three';
import type { Vector3 } from 'three';

interface ProjectRoadProps {
  pathPoints: Vector3[];
  progress: number; // 0..1
}

const ROAD_WIDTH = 5.5;
const ROAD_SEGMENTS = 400;

/**
 * Builds a flat ribbon road geometry following the curve.
 * Each segment is a quad with two triangles, lying flat on the terrain.
 */
function buildRoadRibbon(curve: CatmullRomCurve3): BufferGeometry {
  const points = curve.getPoints(ROAD_SEGMENTS);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];

  const hw = ROAD_WIDTH / 2;

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];

    // Tangent direction (XZ plane only, road stays flat relative to ground)
    const tx = p2.x - p1.x;
    const tz = p2.z - p1.z;
    const tlen = Math.sqrt(tx * tx + tz * tz) || 1;

    // Right-perpendicular in XZ plane (rotated 90° CW)
    const rx = tz / tlen;
    const rz = -tx / tlen;

    // Road surface slightly above the curve's y
    const y1 = p1.y + 0.06;
    const y2 = p2.y + 0.06;

    // 4 corners: left-current, right-current, left-next, right-next
    positions.push(
      p1.x - rx * hw, y1, p1.z - rz * hw,  // 0 left-curr
      p1.x + rx * hw, y1, p1.z + rz * hw,  // 1 right-curr
      p2.x - rx * hw, y2, p2.z - rz * hw,  // 2 left-next
      p2.x + rx * hw, y2, p2.z + rz * hw,  // 3 right-next
    );

    // Normals point straight up
    normals.push(0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0);

    // UV: x = progress along road (0→1), y = 0(left edge)→1(right edge)
    const t1 = i / (points.length - 1);
    const t2 = (i + 1) / (points.length - 1);
    uvs.push(t1, 0,  t1, 1,  t2, 0,  t2, 1);

    const b = i * 4;
    indices.push(b, b + 1, b + 2,  b + 1, b + 3, b + 2);
  }

  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

export function ProjectRoad({ pathPoints, progress }: ProjectRoadProps) {
  const materialRef = useRef<ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const curve = new CatmullRomCurve3(pathPoints, false, 'catmullrom', 0.5);
    return buildRoadRibbon(curve);
  }, [pathPoints]);

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
          uProgress:      { value: progress },
          uTime:          { value: 0 },
          uCompletedColor: { value: new Color('#252422') }, // dark asphalt
          uPulseColor:    { value: new Color('#7c3aed') },  // violet
          uUpcomingColor: { value: new Color('#afa99f') },  // warm gravel
          uMarkingColor:  { value: new Color('#e8e3d8') },  // road markings
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
          uniform vec3 uMarkingColor;
          varying vec2 vUv;

          void main() {
            float t = vUv.x;  // progress along road 0→1
            float w = vUv.y;  // width 0(left)→1(right)

            // Base road color
            vec3 color = t < uProgress ? uCompletedColor : uUpcomingColor;

            // Violet pulse glow at current position
            float pulse = smoothstep(0.07, 0.0, abs(t - uProgress));
            pulse *= 0.7 + 0.3 * sin(uTime * 2.5);
            color = mix(color, uPulseColor, pulse);

            // Edge stripes — both sides
            float edgeMask = step(w, 0.055) + step(1.0 - 0.055, w);
            edgeMask = clamp(edgeMask, 0.0, 1.0);
            vec3 edgeColor = t < uProgress ? uMarkingColor * 0.55 : uMarkingColor * 0.85;
            color = mix(color, edgeColor, edgeMask * 0.8);

            // Center dashed line on the upcoming (un-driven) section
            if (t > uProgress + 0.005) {
              float centerDist = abs(w - 0.5);
              float dashPhase = mod(t * 50.0 - uTime * 0.05, 1.0);
              float isDash = step(centerDist, 0.022) * step(0.5, dashPhase);
              color = mix(color, uMarkingColor, isDash * 0.65);
            }

            gl_FragColor = vec4(color, 1.0);
          }
        `,
        side: 2, // DoubleSide — visible from below during tilted camera
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <mesh
      geometry={geometry}
      material={material}
      ref={(mesh) => {
        if (mesh) materialRef.current = mesh.material as ShaderMaterial;
      }}
      receiveShadow
    />
  );
}
