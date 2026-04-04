import { useState, useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import type { MeetingMarkerData } from '@/types/three';

interface MeetingMarkerProps {
  data: MeetingMarkerData;
}

/**
 * Meeting note rendered as a terrain hill beside the road.
 * Click the hill or label to expand meeting details.
 */
export function MeetingMarker({ data }: MeetingMarkerProps) {
  const { meeting, position, side } = data;
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const target = hovered ? 1.08 : 1.0;
    groupRef.current.scale.x += (target - groupRef.current.scale.x) * 0.12;
    groupRef.current.scale.z += (target - groupRef.current.scale.z) * 0.12;
  });

  // Label offset toward road center
  const popupOffset: [number, number, number] = side === 'left' ? [8, 0, 0] : [-8, 0, 0];

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Hill dome — scaled sphere, bottom half only */}
      <group ref={groupRef}>
        <mesh
          scale={[4, 1.8, 4]}
          onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); }}
          onPointerLeave={() => setHovered(false)}
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        >
          {/* Upper hemisphere only */}
          <sphereGeometry args={[1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color={hovered ? '#ccc7bb' : '#bfbbb0'}
            roughness={1.0}
            metalness={0}
          />
        </mesh>

        {/* Subtle base ring to ground the hill */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[3.8, 4.2, 32]} />
          <meshStandardMaterial
            color="#a8a39a"
            transparent
            opacity={0.3}
          />
        </mesh>
      </group>

      {/* Marker post — thin rod rising from hill apex */}
      <mesh position={[0, 2.2, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 2.8, 8]} />
        <meshStandardMaterial color="#9ca3af" roughness={0.5} />
      </mesh>
      {/* Post cap */}
      <mesh position={[0, 3.65, 0]}>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshStandardMaterial color="#7c3aed" emissive="#7c3aed" emissiveIntensity={0.4} />
      </mesh>

      {/* Floating label above post */}
      <Html position={[0, 5.0, 0]} center distanceFactor={55}>
        <div
          onClick={() => setExpanded(!expanded)}
          style={{
            cursor: 'pointer',
            userSelect: 'none',
            background: expanded ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${expanded ? 'rgba(124,58,237,0.35)' : 'rgba(0,0,0,0.09)'}`,
            borderRadius: '6px',
            padding: '4px 9px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{
            fontSize: '8px',
            fontFamily: 'JetBrains Mono, monospace',
            color: '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: '1px',
          }}>
            {meeting.date}
          </div>
          <div style={{
            fontSize: '10px',
            fontFamily: 'Inter, system-ui, sans-serif',
            color: expanded ? '#5b21b6' : '#374151',
            fontWeight: 500,
            maxWidth: '150px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {meeting.title.length > 36 ? meeting.title.slice(0, 36) + '…' : meeting.title}
          </div>
        </div>
      </Html>

      {/* Expanded detail card — opens toward road center */}
      {expanded && (
        <Html
          position={popupOffset}
          center
          distanceFactor={42}
          style={{ pointerEvents: 'auto' }}
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.97)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.09)',
              borderRadius: '12px',
              padding: '14px 16px',
              width: '240px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(124,58,237,0.1)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div style={{
                fontSize: '8px',
                fontFamily: 'JetBrains Mono, monospace',
                color: '#7c3aed',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
              }}>
                {meeting.date}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  fontSize: '14px',
                  lineHeight: 1,
                  padding: '0 2px',
                }}
              >
                ×
              </button>
            </div>

            <div style={{
              fontSize: '12px',
              fontFamily: 'Inter, system-ui, sans-serif',
              color: '#111827',
              fontWeight: 600,
              marginBottom: '6px',
              lineHeight: 1.35,
            }}>
              {meeting.title}
            </div>

            <div style={{
              fontSize: '10.5px',
              color: '#6b7280',
              marginBottom: '10px',
              lineHeight: 1.45,
              fontStyle: 'italic',
            }}>
              {meeting.summary}
            </div>

            {/* Key points */}
            <div style={{ marginBottom: '10px' }}>
              {meeting.keyPoints.map((kp, i) => (
                <div key={i} style={{ display: 'flex', gap: '7px', marginBottom: '4px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#7c3aed', fontSize: '9px', marginTop: '2px', flexShrink: 0 }}>▸</span>
                  <span style={{ fontSize: '10px', color: '#374151', lineHeight: 1.4 }}>{kp}</span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{
              paddingTop: '8px',
              borderTop: '1px solid rgba(0,0,0,0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: 'rgba(124,58,237,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: '8px', color: '#7c3aed' }}>👤</span>
              </div>
              <div style={{ fontSize: '9px', color: '#9ca3af', fontFamily: 'JetBrains Mono, monospace' }}>
                {meeting.attendees.length} attendees · {meeting.attendees[0]?.split(' (')[0]}
                {meeting.attendees.length > 1 ? ` +${meeting.attendees.length - 1}` : ''}
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
