import { ShaderMaterial, Color } from 'three';

/**
 * Custom shader for the project road.
 * - Completed section: light gray
 * - Active pulse: soft violet glow
 * - Upcoming: dark charcoal
 *
 * Uses vUv.x as the "along the tube" coordinate (0 = start, 1 = end).
 */
export function createRoadMaterial(progress: number, time: number) {
  return new ShaderMaterial({
    uniforms: {
      uProgress: { value: progress },
      uTime: { value: time },
      uCompletedColor: { value: new Color('#d4d4d8') }, // zinc-300
      uPulseColor: { value: new Color('#7c3aed') },     // violet
      uUpcomingColor: { value: new Color('#27272a') },   // zinc-800
      uBaseColor: { value: new Color('#18181b') },       // zinc-900
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
        float t = vUv.x; // along the road

        // Pulse band around the progress point
        float pulseWidth = 0.04;
        float pulse = smoothstep(pulseWidth, 0.0, abs(t - uProgress));
        pulse *= 0.7 + 0.3 * sin(uTime * 3.0);

        // Base color: completed vs upcoming
        vec3 color = t < uProgress ? uCompletedColor : uUpcomingColor;

        // Blend pulse
        color = mix(color, uPulseColor, pulse);

        // Edge fade for tube cross-section — subtle vignette on the tube sides
        float edge = smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.85, vUv.y);
        color = mix(uBaseColor, color, edge * 0.9 + 0.1);

        gl_FragColor = vec4(color, 1.0);
      }
    `,
    transparent: false,
  });
}
