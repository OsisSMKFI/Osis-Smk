'use client';

import React, { useRef, useState, useEffect, Suspense } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

// Dynamic import for 3D canvas
const Canvas = dynamic(
  () => import('@react-three/fiber').then(mod => mod.Canvas),
  { ssr: false }
);

const Float = dynamic(
  () => import('@react-three/drei').then(mod => mod.Float),
  { ssr: false }
);

const OrbitControls = dynamic(
  () => import('@react-three/drei').then(mod => mod.OrbitControls),
  { ssr: false }
);

interface LogoElement {
  icon: string;
  title: string;
  description: string;
  color: string;
  gradient: string;
}

interface LogoReveal3DProps {
  logoSrc: string;
  logoAlt: string;
  sectionTitle: string;
  sectionSubtitle: string;
  elements: LogoElement[];
}

// 3D Floating Logo Component
function FloatingLogo3D({ imageUrl }: { imageUrl: string }) {
  const meshRef = useRef<any>(null);
  const [texture, setTexture] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('three').then(THREE => {
        const loader = new THREE.TextureLoader();
        loader.load(imageUrl, (loadedTexture) => {
          setTexture(loadedTexture);
        });
      });
    }
  }, [imageUrl]);

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={meshRef} scale={2.5}>
        <planeGeometry args={[2, 2]} />
        {texture && (
          <meshBasicMaterial map={texture} transparent alphaTest={0.5} />
        )}
      </mesh>
    </Float>
  );
}

// Animated Element Card with 3D effect
function ElementCard({ 
  element, 
  index, 
  isActive 
}: { 
  element: LogoElement; 
  index: number;
  isActive: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: false, amount: 0.5 });

  return (
    <motion.div
      ref={cardRef}
      className={`relative group ${isActive ? 'z-10' : 'z-0'}`}
      initial={{ opacity: 0, y: 100, rotateX: -15 }}
      animate={isInView ? { 
        opacity: 1, 
        y: 0, 
        rotateX: 0,
        scale: isActive ? 1.05 : 1
      } : { 
        opacity: 0, 
        y: 100, 
        rotateX: -15 
      }}
      transition={{ 
        duration: 0.8, 
        delay: index * 0.15,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      style={{ perspective: '1000px' }}
    >
      {/* Glow effect */}
      <div 
        className={`absolute -inset-2 rounded-3xl blur-xl transition-opacity duration-500 ${element.gradient} ${isActive ? 'opacity-40' : 'opacity-0 group-hover:opacity-30'}`}
      />
      
      {/* Card content */}
      <div className="relative bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-white/10 overflow-hidden transform-gpu transition-all duration-500 group-hover:border-white/20">
        {/* Background gradient */}
        <div className={`absolute inset-0 ${element.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-500`} />
        
        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-1 h-1 rounded-full ${element.gradient.replace('bg-gradient-to-r', 'bg').split(' ')[1]}`}
              style={{
                left: `${20 + i * 30}%`,
                top: `${30 + i * 20}%`,
              }}
              animate={{
                y: [-10, 10, -10],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* Icon with 3D effect */}
        <motion.div 
          className={`relative w-20 h-20 mb-6 rounded-2xl ${element.gradient} flex items-center justify-center shadow-2xl`}
          whileHover={{ 
            scale: 1.1, 
            rotateY: 15,
            rotateX: -10 
          }}
          transition={{ type: 'spring', stiffness: 300 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <span className="text-4xl transform-gpu" style={{ transform: 'translateZ(20px)' }}>
            {element.icon}
          </span>
          {/* Icon glow */}
          <div className={`absolute inset-0 rounded-2xl ${element.gradient} blur-md opacity-50`} />
        </motion.div>

        {/* Title */}
        <h3 className="relative text-xl md:text-2xl font-bold text-white mb-3 group-hover:text-yellow-400 transition-colors duration-300">
          {element.title}
        </h3>

        {/* Description */}
        <p className="relative text-gray-400 leading-relaxed text-sm md:text-base group-hover:text-gray-300 transition-colors duration-300">
          {element.description}
        </p>

        {/* Decorative line */}
        <motion.div 
          className={`absolute bottom-0 left-0 h-1 ${element.gradient}`}
          initial={{ width: 0 }}
          animate={isInView ? { width: '100%' } : { width: 0 }}
          transition={{ duration: 1, delay: index * 0.15 + 0.5 }}
        />
      </div>
    </motion.div>
  );
}

// Main Logo Reveal Component
export default function LogoReveal3D({ 
  logoSrc, 
  logoAlt, 
  sectionTitle, 
  sectionSubtitle,
  elements 
}: LogoReveal3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const [activeElement, setActiveElement] = useState(0);
  const [isWebGLSupported, setIsWebGLSupported] = useState(true);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start']
  });

  // Smooth spring animations
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  
  // Logo transformations based on scroll
  const logoScale = useTransform(smoothProgress, [0, 0.3, 0.5], [0.5, 1.2, 1]);
  const logoRotate = useTransform(smoothProgress, [0, 0.3], [180, 0]);
  const logoOpacity = useTransform(smoothProgress, [0, 0.2], [0, 1]);
  const logoY = useTransform(smoothProgress, [0, 0.3, 0.5], [100, 0, -50]);

  // Check WebGL support
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      setIsWebGLSupported(!!gl);
    } catch {
      setIsWebGLSupported(false);
    }
  }, []);

  // Update active element based on scroll
  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (value) => {
      const elementCount = elements.length;
      const threshold = 0.5; // Start showing elements after 50% scroll
      if (value > threshold) {
        const normalizedProgress = (value - threshold) / (1 - threshold);
        const newActive = Math.min(Math.floor(normalizedProgress * elementCount), elementCount - 1);
        setActiveElement(newActive);
      }
    });
    return () => unsubscribe();
  }, [scrollYProgress, elements.length]);

  return (
    <section 
      ref={containerRef}
      className="relative min-h-[300vh] bg-gray-900 overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-yellow-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-500/5 rounded-full blur-3xl" />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(251, 191, 36, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(251, 191, 36, 0.3) 1px, transparent 1px)`,
            backgroundSize: '100px 100px'
          }}
        />
      </div>

      {/* Sticky container for logo */}
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        <div className="relative w-full max-w-7xl mx-auto px-4">
          {/* Section Title */}
          <motion.div 
            className="absolute top-8 left-0 right-0 text-center z-20"
            style={{ opacity: useTransform(smoothProgress, [0, 0.1, 0.3], [0, 1, 1]) }}
          >
            <motion.span 
              className="inline-flex items-center gap-3 text-yellow-400 text-sm font-medium tracking-widest uppercase mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="w-12 h-px bg-yellow-400" />
              {sectionTitle}
              <span className="w-12 h-px bg-yellow-400" />
            </motion.span>
            <motion.p 
              className="text-gray-400 max-w-xl mx-auto"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              {sectionSubtitle}
            </motion.p>
          </motion.div>

          {/* 3D Logo Container */}
          <motion.div 
            ref={logoRef}
            className="relative flex justify-center items-center"
            style={{ 
              scale: logoScale,
              rotate: logoRotate,
              opacity: logoOpacity,
              y: logoY
            }}
          >
            {isWebGLSupported ? (
              <div className="w-80 h-80 md:w-96 md:h-96">
                <Suspense fallback={
                  <div className="w-full h-full flex items-center justify-center">
                    <img 
                      src={logoSrc} 
                      alt={logoAlt}
                      className="w-48 h-48 object-contain animate-pulse"
                    />
                  </div>
                }>
                  <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} />
                    <pointLight position={[-10, -10, -10]} intensity={0.5} color="#fbbf24" />
                    <FloatingLogo3D imageUrl={logoSrc} />
                    <OrbitControls 
                      enableZoom={false} 
                      enablePan={false}
                      autoRotate
                      autoRotateSpeed={1}
                    />
                  </Canvas>
                </Suspense>
              </div>
            ) : (
              <motion.img 
                src={logoSrc} 
                alt={logoAlt}
                className="w-48 h-48 md:w-64 md:h-64 object-contain"
                animate={{ 
                  rotateY: [0, 360],
                }}
                transition={{ 
                  duration: 20, 
                  repeat: Infinity, 
                  ease: 'linear' 
                }}
              />
            )}
            
            {/* Logo glow effect */}
            <div className="absolute inset-0 bg-gradient-radial from-yellow-400/20 to-transparent blur-2xl" />
          </motion.div>

          {/* Scroll indicator */}
          <motion.div 
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center text-gray-400"
            style={{ opacity: useTransform(smoothProgress, [0.1, 0.3], [1, 0]) }}
          >
            <span className="text-sm mb-2">Scroll untuk melihat detail</span>
            <motion.div
              className="w-6 h-10 rounded-full border-2 border-gray-400 flex justify-center pt-2"
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <motion.div
                className="w-1.5 h-1.5 bg-yellow-400 rounded-full"
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Element Cards - Scrolling section */}
      <div className="relative z-10 px-4 pb-32 -mt-[50vh]">
        <div className="max-w-6xl mx-auto">
          {/* Section header for elements */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Filosofi <span className="text-yellow-400">Logo</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Setiap elemen dalam logo kami memiliki makna yang mendalam dan mencerminkan nilai-nilai organisasi
            </p>
          </motion.div>

          {/* Elements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {elements.map((element, index) => (
              <ElementCard 
                key={index}
                element={element}
                index={index}
                isActive={index === activeElement}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none" />
    </section>
  );
}
