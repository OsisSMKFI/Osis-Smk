'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleFieldProps {
  count?: number;
  color?: string;
  size?: number;
  speed?: number;
  spread?: number;
  className?: string;
}

function Particles({ 
  count = 500, 
  color = '#fbbf24', 
  size = 0.02,
  speed = 0.2,
  spread = 10 
}: Omit<ParticleFieldProps, 'className'>) {
  const points = useRef<THREE.Points>(null);
  
  const { positions, velocities } = useMemo(() => {
    const posArray = new Float32Array(count * 3);
    const velArray = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      posArray[i * 3] = (Math.random() - 0.5) * spread;
      posArray[i * 3 + 1] = (Math.random() - 0.5) * spread;
      posArray[i * 3 + 2] = (Math.random() - 0.5) * spread;
      velArray[i] = Math.random() * 0.5 + 0.5;
    }
    
    return { positions: posArray, velocities: velArray };
  }, [count, spread]);

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geom;
  }, [positions]);

  useFrame((state) => {
    if (points.current) {
      const posAttr = points.current.geometry.attributes.position;
      const posArray = posAttr.array as Float32Array;
      
      for (let i = 0; i < count; i++) {
        // Floating animation
        posArray[i * 3 + 1] += Math.sin(state.clock.elapsedTime * speed + i) * 0.001;
        
        // Slow rotation
        const x = posArray[i * 3];
        const z = posArray[i * 3 + 2];
        const angle = 0.0001 * velocities[i];
        posArray[i * 3] = x * Math.cos(angle) - z * Math.sin(angle);
        posArray[i * 3 + 2] = x * Math.sin(angle) + z * Math.cos(angle);
      }
      
      posAttr.needsUpdate = true;
      points.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Connecting Lines between nearby particles
function ConnectionLines({ count = 100, color = '#fbbf24', maxDistance = 2 }) {
  const linesRef = useRef<THREE.LineSegments>(null);
  
  const { geometry } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    
    // Calculate line connections
    const lines: number[] = [];
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const dx = positions[i * 3] - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (distance < maxDistance) {
          lines.push(
            positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
            positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]
          );
        }
      }
    }
    
    const linePositions = new Float32Array(lines);
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    
    return { geometry: geom };
  }, [count, maxDistance]);

  useFrame((state) => {
    if (linesRef.current) {
      linesRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      linesRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <lineSegments ref={linesRef} geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.15} />
    </lineSegments>
  );
}

export default function ParticleField({ 
  count = 500, 
  color = '#fbbf24', 
  size = 0.02,
  speed = 0.2,
  spread = 10,
  className = '' 
}: ParticleFieldProps) {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      <Canvas
        dpr={[1, 1.5]}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance'
        }}
        camera={{ position: [0, 0, 5], fov: 60 }}
        style={{ background: 'transparent' }}
      >
        <Particles count={count} color={color} size={size} speed={speed} spread={spread} />
        <ConnectionLines count={Math.min(count / 5, 80)} color={color} />
      </Canvas>
    </div>
  );
}
