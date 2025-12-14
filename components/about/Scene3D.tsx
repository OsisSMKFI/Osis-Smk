'use client';

import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  Float, 
  Stars, 
  Sphere, 
  MeshDistortMaterial,
  Text3D,
  Center,
  Environment,
  PerspectiveCamera,
  useTexture
} from '@react-three/drei';
import * as THREE from 'three';

// Floating Orb Component - Represents "Dirgantara" (Sky/Space)
function FloatingOrb({ position, color, size = 1, speed = 1 }: { 
  position: [number, number, number]; 
  color: string; 
  size?: number;
  speed?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.3;
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <Sphere ref={meshRef} args={[size, 64, 64]} position={position}>
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
}

// Particle Ring - Orbiting particles
function ParticleRing({ count = 100, radius = 3, color = '#fbbf24' }) {
  const points = useRef<THREE.Points>(null);
  
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5;
      const y = (Math.random() - 0.5) * 0.5;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5;
      positions.set([x, y, z], i * 3);
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geom;
  }, [count, radius]);

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y = state.clock.elapsedTime * 0.1;
      points.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        size={0.05}
        color={color}
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}

// Mouse-following light
function MouseLight() {
  const light = useRef<THREE.PointLight>(null);
  const { viewport, mouse } = useThree();

  useFrame(() => {
    if (light.current) {
      light.current.position.x = (mouse.x * viewport.width) / 2;
      light.current.position.y = (mouse.y * viewport.height) / 2;
    }
  });

  return <pointLight ref={light} intensity={2} color="#fbbf24" distance={10} />;
}

// Animated Grid Floor
function AnimatedGrid() {
  const gridRef = useRef<THREE.GridHelper>(null);

  useFrame((state) => {
    if (gridRef.current) {
      gridRef.current.position.z = (state.clock.elapsedTime * 0.5) % 1;
    }
  });

  return (
    <gridHelper
      ref={gridRef}
      args={[30, 30, '#fbbf24', '#1f2937']}
      position={[0, -3, 0]}
      rotation={[0, 0, 0]}
    />
  );
}

// Floating Geometric Shapes
function FloatingShapes() {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <group ref={group}>
      {/* Icosahedron */}
      <Float speed={1.5} rotationIntensity={2} floatIntensity={1}>
        <mesh position={[-4, 1, -2]}>
          <icosahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial color="#f59e0b" wireframe />
        </mesh>
      </Float>

      {/* Octahedron */}
      <Float speed={2} rotationIntensity={1.5} floatIntensity={0.8}>
        <mesh position={[4, -1, -3]}>
          <octahedronGeometry args={[0.4, 0]} />
          <meshStandardMaterial color="#eab308" wireframe />
        </mesh>
      </Float>

      {/* Torus */}
      <Float speed={1} rotationIntensity={1} floatIntensity={1.2}>
        <mesh position={[3, 2, -4]}>
          <torusGeometry args={[0.3, 0.1, 16, 32]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
        </mesh>
      </Float>

      {/* Dodecahedron */}
      <Float speed={1.8} rotationIntensity={1.2} floatIntensity={0.6}>
        <mesh position={[-3, -2, -2]}>
          <dodecahedronGeometry args={[0.35, 0]} />
          <meshStandardMaterial color="#d97706" wireframe />
        </mesh>
      </Float>
    </group>
  );
}

// Main 3D Scene Component
interface Scene3DProps {
  className?: string;
  variant?: 'hero' | 'story' | 'minimal';
}

export default function Scene3D({ className = '', variant = 'hero' }: Scene3DProps) {
  return (
    <div className={`absolute inset-0 ${className}`}>
      <Canvas
        dpr={[1, 2]}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance'
        }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45} />
          
          {/* Lighting */}
          <ambientLight intensity={0.3} />
          <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
          <pointLight position={[-10, -10, -5]} intensity={0.5} color="#fbbf24" />
          <MouseLight />

          {/* Stars Background */}
          <Stars 
            radius={100} 
            depth={50} 
            count={variant === 'hero' ? 5000 : 2000} 
            factor={4} 
            saturation={0} 
            fade 
            speed={1} 
          />

          {/* Main Content based on variant */}
          {variant === 'hero' && (
            <>
              {/* Central Orb - "Matahari" (Sun) */}
              <FloatingOrb position={[0, 0, 0]} color="#fbbf24" size={1.5} speed={0.5} />
              
              {/* Orbiting Particles */}
              <ParticleRing count={150} radius={3} color="#fbbf24" />
              <ParticleRing count={100} radius={4.5} color="#f59e0b" />
              
              {/* Floating Shapes */}
              <FloatingShapes />
              
              {/* Animated Grid */}
              <AnimatedGrid />
            </>
          )}

          {variant === 'story' && (
            <>
              <FloatingOrb position={[2, 0, -2]} color="#f59e0b" size={1} speed={0.8} />
              <FloatingOrb position={[-2, 1, -3]} color="#fbbf24" size={0.6} speed={1.2} />
              <ParticleRing count={80} radius={5} color="#eab308" />
            </>
          )}

          {variant === 'minimal' && (
            <>
              <ParticleRing count={50} radius={6} color="#fbbf24" />
            </>
          )}

          <Environment preset="night" />
        </Suspense>
      </Canvas>
    </div>
  );
}

// WebGL Support Check Component
export function WebGLCheck({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) {
  const [isSupported, setIsSupported] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      setIsSupported(!!gl);
    } catch {
      setIsSupported(false);
    }
  }, []);

  if (isSupported === null) return null;
  return <>{isSupported ? children : fallback}</>;
}
