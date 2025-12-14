'use client';

import React, { useEffect, useRef, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  Float, 
  Text3D, 
  Center, 
  Environment, 
  Stars,
  Sparkles,
  MeshDistortMaterial,
  MeshWobbleMaterial
} from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';

// Floating logo sphere
function LogoSphere({ isActive }: { isActive: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      
      // Scale animation
      const scale = isActive ? 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1 : 0;
      meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, scale, 0.1));
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh 
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <icosahedronGeometry args={[1.5, 4]} />
        <MeshDistortMaterial
          color={hovered ? "#fbbf24" : "#f59e0b"}
          emissive="#f59e0b"
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.8}
          distort={0.4}
          speed={2}
        />
      </mesh>
    </Float>
  );
}

// Orbiting particles
function OrbitingParticles() {
  const groupRef = useRef<THREE.Group>(null);
  const particleCount = 100;
  
  const positions = React.useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = 3 + Math.random() * 2;
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          color="#fbbf24"
          transparent
          opacity={0.8}
          sizeAttenuation
        />
      </points>
    </group>
  );
}

// Animated rings
function AnimatedRings() {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * 0.5;
      ring1Ref.current.rotation.y = t * 0.3;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = -t * 0.4;
      ring2Ref.current.rotation.z = t * 0.2;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.y = t * 0.6;
      ring3Ref.current.rotation.z = -t * 0.3;
    }
  });

  return (
    <>
      <mesh ref={ring1Ref}>
        <torusGeometry args={[2.5, 0.02, 16, 100]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.5} />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[3, 0.02, 16, 100]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.3} />
      </mesh>
      <mesh ref={ring3Ref}>
        <torusGeometry args={[3.5, 0.02, 16, 100]} />
        <meshBasicMaterial color="#a78bfa" transparent opacity={0.2} />
      </mesh>
    </>
  );
}

// Camera animation
function CameraRig({ isExiting }: { isExiting: boolean }) {
  const { camera } = useThree();
  
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    
    if (isExiting) {
      // Zoom out on exit
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, 20, 0.05);
    } else {
      // Subtle camera movement
      camera.position.x = Math.sin(t * 0.2) * 0.5;
      camera.position.y = Math.cos(t * 0.3) * 0.3;
    }
    
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// Scene content
function Scene({ isActive, isExiting }: { isActive: boolean; isExiting: boolean }) {
  return (
    <>
      <color attach="background" args={['#0f172a']} />
      <fog attach="fog" args={['#0f172a', 5, 25]} />
      
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#fbbf24" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#60a5fa" />
      
      <CameraRig isExiting={isExiting} />
      
      <LogoSphere isActive={isActive} />
      <AnimatedRings />
      <OrbitingParticles />
      
      <Stars 
        radius={50} 
        depth={50} 
        count={2000} 
        factor={4} 
        saturation={0} 
        fade 
        speed={1}
      />
      
      <Sparkles 
        count={100}
        scale={10}
        size={2}
        speed={0.5}
        color="#fbbf24"
      />
    </>
  );
}

// Main component
interface WebGLIntroProps {
  onComplete: () => void;
  minDuration?: number;
}

export default function WebGLIntro({ onComplete, minDuration = 3000 }: WebGLIntroProps) {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const startTime = useRef(Date.now());

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(prev => {
        const elapsed = Date.now() - startTime.current;
        const targetProgress = Math.min((elapsed / minDuration) * 100, 100);
        const newProgress = prev + (targetProgress - prev) * 0.1;
        
        if (newProgress >= 99) {
          clearInterval(interval);
          return 100;
        }
        return newProgress;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [minDuration]);

  useEffect(() => {
    if (progress >= 100) {
      // Start exit animation
      setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          setIsVisible(false);
          onComplete();
        }, 1000);
      }, 500);
    }
  }, [progress, onComplete]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] bg-slate-900"
        initial={{ opacity: 1 }}
        animate={{ opacity: isExiting ? 0 : 1 }}
        transition={{ duration: 1 }}
      >
        {/* 3D Canvas */}
        <Canvas
          camera={{ position: [0, 0, 8], fov: 60 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <Scene isActive={!isExiting} isExiting={isExiting} />
          </Suspense>
        </Canvas>

        {/* Overlay Content */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          {/* Logo */}
          <motion.div
            className="mb-8"
            animate={{ 
              scale: isExiting ? 0.5 : [1, 1.05, 1],
              opacity: isExiting ? 0 : 1
            }}
            transition={{ 
              scale: { duration: 2, repeat: isExiting ? 0 : Infinity },
              opacity: { duration: 0.5 }
            }}
          >
            <img
              src="/images/logo-2.png"
              alt="OSIS Logo"
              className="w-20 h-20 md:w-24 md:h-24 rounded-full shadow-2xl"
            />
          </motion.div>

          {/* Title */}
          <motion.h1
            className="text-3xl md:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent"
            animate={{ opacity: isExiting ? 0 : 1, y: isExiting ? -20 : 0 }}
            transition={{ duration: 0.5 }}
          >
            OSIS SMK INFORMATIKA
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-yellow-400/80 mb-8"
            animate={{ opacity: isExiting ? 0 : 1, y: isExiting ? -20 : 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Dirgantara 2025
          </motion.p>

          {/* Progress bar */}
          <motion.div
            className="w-64 md:w-80 h-1 bg-slate-700 rounded-full overflow-hidden"
            animate={{ opacity: isExiting ? 0 : 1, scaleX: isExiting ? 0 : 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </motion.div>

          {/* Loading text */}
          <motion.p
            className="mt-4 text-slate-400 text-sm"
            animate={{ opacity: isExiting ? 0 : 1 }}
          >
            {progress < 100 ? 'Loading experience...' : 'Welcome!'}
          </motion.p>
        </motion.div>

        {/* Click to skip (after 1 second) */}
        <motion.button
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-500 text-sm hover:text-slate-300 transition-colors pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: isExiting ? 0 : 1 }}
          transition={{ delay: 1 }}
          onClick={() => {
            setIsExiting(true);
            setTimeout(() => {
              setIsVisible(false);
              onComplete();
            }, 1000);
          }}
        >
          Click to skip
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
}
