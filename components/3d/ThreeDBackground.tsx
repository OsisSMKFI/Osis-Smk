'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
import * as THREE from 'three';

// Wireframe sphere
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

// Simple scene
function Scene() {
  return (
    <>
      <color attach="background" args={['transparent']} />
      <ambientLight intensity={0.3} />
      
      <WireframeSphere />
      
      <Stars 
        radius={50} 
        depth={50} 
        count={500} 
        factor={4} 
        saturation={0} 
        fade 
        speed={0.5}
      />
    </>
  );
}

interface ThreeDBackgroundProps {
  variant?: 'particles' | 'wireframe' | 'full';
  className?: string;
  opacity?: number;
}

export default function ThreeDBackground({ 
  className = '',
  opacity = 0.5 
}: ThreeDBackgroundProps) {
  return (
    <div 
      className={`fixed inset-0 -z-10 pointer-events-none ${className}`}
      style={{ opacity }}
    >
      <Canvas
        camera={{ position: [0, 0, 15], fov: 60 }}
        gl={{ antialias: false, alpha: true }}
        dpr={1}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
