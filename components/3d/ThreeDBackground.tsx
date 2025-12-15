'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
import * as THREE from 'three';

// Check if device is low-end
function useIsLowEndDevice() {
  const [isLowEnd, setIsLowEnd] = useState(false);
  
  useEffect(() => {
    // Check for low-end indicators
    const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
    const hasLowMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4;
    const hasSlowCPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    setIsLowEnd(isMobile || hasLowMemory || hasSlowCPU || prefersReducedMotion);
  }, []);
  
  return isLowEnd;
}

// Wireframe sphere - optimized
function WireframeSphere({ isLowEnd }: { isLowEnd: boolean }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current && !isLowEnd) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.1;
      ref.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  return (
    <Float speed={isLowEnd ? 0.5 : 1} rotationIntensity={isLowEnd ? 0.2 : 0.5} floatIntensity={isLowEnd ? 0.2 : 0.5}>
      <mesh ref={ref}>
        <icosahedronGeometry args={[5, isLowEnd ? 1 : 2]} />
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

// Simple scene - optimized
function Scene({ isLowEnd }: { isLowEnd: boolean }) {
  return (
    <>
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={0.3} />
      
      <WireframeSphere isLowEnd={isLowEnd} />
      
      <Stars 
        radius={50} 
        depth={50} 
        count={isLowEnd ? 200 : 500} 
        factor={4} 
        saturation={0} 
        fade 
        speed={isLowEnd ? 0.2 : 0.5}
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
  const isLowEnd = useIsLowEndDevice();
  const [shouldRender, setShouldRender] = useState(true);
  
  useEffect(() => {
    // Don't render on very low-end devices or if reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setShouldRender(false);
    }
  }, []);
  
  if (!shouldRender) return null;
  
  return (
    <div 
      className={`fixed inset-0 -z-10 pointer-events-none ${className}`}
      style={{ opacity: isLowEnd ? opacity * 0.5 : opacity }}
    >
      <Canvas
        camera={{ position: [0, 0, 15], fov: 60 }}
        gl={{ 
          antialias: !isLowEnd, 
          alpha: true,
          powerPreference: isLowEnd ? 'low-power' : 'default',
          failIfMajorPerformanceCaveat: true
        }}
        dpr={isLowEnd ? 1 : Math.min(window.devicePixelRatio, 2)}
        frameloop={isLowEnd ? 'demand' : 'always'}
      >
        <Scene isLowEnd={isLowEnd} />
      </Canvas>
    </div>
  );
}
