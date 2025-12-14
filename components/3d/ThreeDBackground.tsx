'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

// Floating particles
function ParticleField({ count = 2000, color = '#fbbf24' }: { count?: number; color?: string }) {
  const ref = useRef<THREE.Points>(null);
  const { mouse } = useThree();

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.02;
      ref.current.rotation.y = state.clock.elapsedTime * 0.03;
      
      // React to mouse
      ref.current.rotation.x += mouse.y * 0.01;
      ref.current.rotation.y += mouse.x * 0.01;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={color}
        size={0.05}
        sizeAttenuation
        depthWrite={false}
        opacity={0.6}
      />
    </Points>
  );
}

// Animated sphere wireframe
function WireframeSphere() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.1;
      ref.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  return (
    <Float speed={1} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={ref}>
        <icosahedronGeometry args={[5, 2]} />
        <meshBasicMaterial
          color="#fbbf24"
          wireframe
          transparent
          opacity={0.1}
        />
      </mesh>
    </Float>
  );
}

// Floating geometric shapes
function FloatingShapes() {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  const shapes = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      position: [
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
      ] as [number, number, number],
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0] as [number, number, number],
      scale: 0.1 + Math.random() * 0.3,
      type: Math.floor(Math.random() * 3),
    }));
  }, []);

  return (
    <group ref={group}>
      {shapes.map((shape, i) => (
        <Float key={i} speed={1 + Math.random()} rotationIntensity={0.5} floatIntensity={0.5}>
          <mesh position={shape.position} rotation={shape.rotation} scale={shape.scale}>
            {shape.type === 0 && <octahedronGeometry args={[1]} />}
            {shape.type === 1 && <tetrahedronGeometry args={[1]} />}
            {shape.type === 2 && <dodecahedronGeometry args={[1]} />}
            <meshBasicMaterial
              color={i % 2 === 0 ? '#fbbf24' : '#60a5fa'}
              wireframe
              transparent
              opacity={0.3}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

// Moving grid lines
function GridLines() {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.z = (state.clock.elapsedTime * 2) % 10;
    }
  });

  return (
    <group ref={ref} position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <gridHelper args={[50, 50, '#fbbf24', '#1e293b']} />
    </group>
  );
}

// Main 3D background component
interface ThreeDBackgroundProps {
  variant?: 'particles' | 'wireframe' | 'shapes' | 'grid' | 'full';
  className?: string;
  opacity?: number;
}

export default function ThreeDBackground({ 
  variant = 'full', 
  className = '',
  opacity = 1 
}: ThreeDBackgroundProps) {
  return (
    <div 
      className={`fixed inset-0 -z-10 ${className}`}
      style={{ opacity }}
    >
      <Canvas
        camera={{ position: [0, 0, 15], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={['transparent']} />
        <fog attach="fog" args={['#0f172a', 10, 50]} />
        
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />

        {(variant === 'particles' || variant === 'full') && (
          <ParticleField count={1500} />
        )}
        
        {(variant === 'wireframe' || variant === 'full') && (
          <WireframeSphere />
        )}
        
        {(variant === 'shapes' || variant === 'full') && (
          <FloatingShapes />
        )}
        
        {(variant === 'grid' || variant === 'full') && (
          <GridLines />
        )}
      </Canvas>
    </div>
  );
}

// Lightweight particle background (for better performance)
export function LightParticleBackground({ color = '#fbbf24' }: { color?: string }) {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        gl={{ antialias: false, alpha: true }}
        dpr={1}
      >
        <color attach="background" args={['transparent']} />
        <ParticleField count={500} color={color} />
      </Canvas>
    </div>
  );
}
