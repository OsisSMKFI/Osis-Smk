'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars, Sparkles, MeshDistortMaterial } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';

// Simple floating sphere
function LogoSphere({ isActive }: { isActive: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      
      const targetScale = isActive ? 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1 : 0;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.5, 4]} />
        <MeshDistortMaterial
          color="#f59e0b"
          emissive="#f59e0b"
          emissiveIntensity={0.3}
          roughness={0.2}
          metalness={0.8}
          distort={0.3}
          speed={2}
        />
      </mesh>
    </Float>
  );
}

// Animated rings
function AnimatedRings() {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

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
    </>
  );
}

// Scene content
function Scene({ isActive }: { isActive: boolean }) {
  return (
    <>
      <color attach="background" args={['#0f172a']} />
      <fog attach="fog" args={['#0f172a', 5, 25]} />
      
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#fbbf24" />
      
      <LogoSphere isActive={isActive} />
      <AnimatedRings />
      
      <Stars 
        radius={50} 
        depth={50} 
        count={1000} 
        factor={4} 
        saturation={0} 
        fade 
        speed={1}
      />
      
      <Sparkles 
        count={50}
        scale={10}
        size={2}
        speed={0.5}
        color="#fbbf24"
      />
    </>
  );
}

// Fallback loading
function LoadingFallback() {
  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-yellow-400">Loading...</p>
      </div>
    </div>
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
  const [hasError, setHasError] = useState(false);
  const startTime = useRef(Date.now());

  useEffect(() => {
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

  // Handle error state - auto-complete after timeout
  useEffect(() => {
    if (hasError) {
      const timer = setTimeout(() => {
        onComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [hasError, onComplete]);

  useEffect(() => {
    if (progress >= 100) {
      setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          setIsVisible(false);
          onComplete();
        }, 800);
      }, 300);
    }
  }, [progress, onComplete]);

  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 500);
  };

  // If WebGL fails, show simple fallback
  if (hasError) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <img src="/images/logo-2.png" alt="Logo" className="w-20 h-20 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-yellow-400 mb-2">OSIS SMK INFORMATIKA</h2>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] bg-slate-900"
        initial={{ opacity: 1 }}
        animate={{ opacity: isExiting ? 0 : 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* 3D Canvas */}
        <Suspense fallback={<LoadingFallback />}>
          <Canvas
            camera={{ position: [0, 0, 8], fov: 60 }}
            gl={{ antialias: true, alpha: true, failIfMajorPerformanceCaveat: true }}
            dpr={[1, 2]}
            onCreated={() => setHasError(false)}
            onError={() => setHasError(true)}
          >
            <Scene isActive={!isExiting} />
          </Canvas>
        </Suspense>

        {/* Overlay Content */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <motion.div
            className="mb-6"
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
              className="w-16 h-16 md:w-20 md:h-20 rounded-full shadow-2xl"
            />
          </motion.div>

          <motion.h1
            className="text-2xl md:text-4xl font-bold text-center mb-3 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent"
            animate={{ opacity: isExiting ? 0 : 1, y: isExiting ? -20 : 0 }}
          >
            OSIS SMK INFORMATIKA
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-yellow-400/80 mb-6"
            animate={{ opacity: isExiting ? 0 : 1 }}
          >
            Raveka Sena 2025-2026
          </motion.p>

          {/* Progress bar */}
          <motion.div
            className="w-48 md:w-64 h-1 bg-slate-700 rounded-full overflow-hidden"
            animate={{ opacity: isExiting ? 0 : 1 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </motion.div>

          <motion.p
            className="mt-3 text-slate-500 text-sm"
            animate={{ opacity: isExiting ? 0 : 1 }}
          >
            {progress < 100 ? 'Loading...' : 'Welcome!'}
          </motion.p>
        </motion.div>

        {/* Skip button */}
        <motion.button
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-slate-500 text-sm hover:text-slate-300 transition-colors pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: isExiting ? 0 : 1 }}
          transition={{ delay: 1 }}
          onClick={handleSkip}
        >
          Click to skip
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
}
