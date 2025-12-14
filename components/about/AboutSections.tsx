'use client';

import React, { Suspense, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  TextReveal, 
  WordReveal, 
  Reveal, 
  Counter, 
  StaggerContainer, 
  StaggerItem,
  FloatingElement,
  MagneticButton,
  ScrollSection
} from './ScrollAnimations';
import type { TeamMember, SymbolItem } from './types';

// Dynamic imports for 3D components (client-side only)
const Scene3D = dynamic(() => import('./Scene3D'), { 
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black" />
});

const ParticleField = dynamic(() => import('./ParticleField'), { 
  ssr: false,
  loading: () => null
});

interface HeroSection3DProps {
  title: string;
  subtitle: string;
  scrollText?: string;
}

export function HeroSection3D({ title, subtitle, scrollText = 'Scroll untuk menjelajahi' }: HeroSection3DProps) {
  const [isWebGLSupported, setIsWebGLSupported] = useState(true);
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);
  const scale = useTransform(scrollY, [0, 400], [1, 0.8]);
  const y = useTransform(scrollY, [0, 400], [0, 100]);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      setIsWebGLSupported(!!gl);
    } catch {
      setIsWebGLSupported(false);
    }
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 3D Background */}
      {isWebGLSupported ? (
        <Suspense fallback={<div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-black" />}>
          <Scene3D variant="hero" className="z-0" />
        </Suspense>
      ) : (
        // Fallback for non-WebGL browsers
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-black">
          <div className="absolute inset-0 bg-[url('/images/stars-bg.png')] opacity-50" />
        </div>
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/60 z-10" />

      {/* Hero Content */}
      <motion.div 
        className="relative z-20 text-center px-4 max-w-6xl mx-auto"
        style={{ opacity, scale, y }}
      >
        {/* Decorative Line */}
        <Reveal direction="scale" delay={0.2}>
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-yellow-400" />
          </div>
        </Reveal>

        {/* Main Title */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6">
          <TextReveal text={title} className="inline-block" delay={0.3} />
        </h1>

        {/* Subtitle */}
        <Reveal direction="up" delay={0.8}>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-12">
            {subtitle}
          </p>
        </Reveal>

        {/* Stats */}
        <StaggerContainer className="flex flex-wrap justify-center gap-8 md:gap-16 mb-16" delay={1}>
          <StaggerItem>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-yellow-400">
                <Counter to={2024} suffix="" />
              </div>
              <div className="text-gray-400 mt-2">Tahun Berdiri</div>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-yellow-400">
                <Counter to={50} suffix="+" />
              </div>
              <div className="text-gray-400 mt-2">Anggota Aktif</div>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-yellow-400">
                <Counter to={6} />
              </div>
              <div className="text-gray-400 mt-2">Seksi Bidang</div>
            </div>
          </StaggerItem>
        </StaggerContainer>

        {/* Scroll Indicator */}
        <Reveal direction="up" delay={1.5}>
          <div className="flex flex-col items-center text-gray-400">
            <span className="text-sm mb-4">{scrollText}</span>
            <motion.div
              className="w-6 h-10 rounded-full border-2 border-gray-400 flex justify-center pt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
            >
              <motion.div
                className="w-1.5 h-1.5 bg-yellow-400 rounded-full"
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          </div>
        </Reveal>
      </motion.div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-gray-900 to-transparent z-20" />
    </section>
  );
}

// Story Section - "Cerita Dirgantara"
interface StorySectionProps {
  title: string;
  highlightTitle: string;
  philosophyTitle: string;
  philosophyHighlight: string;
  philosophyContent: {
    part1: string;
    nameHighlight: string;
    part2: string;
    skyHighlight: string;
    part3: string;
  };
  descriptions: string[];
}

export function StorySection({ 
  title, 
  highlightTitle, 
  philosophyTitle,
  philosophyHighlight,
  philosophyContent,
  descriptions 
}: StorySectionProps) {
  const [isWebGLSupported, setIsWebGLSupported] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      setIsWebGLSupported(!!gl);
    } catch {
      setIsWebGLSupported(false);
    }
  }, []);

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background Particles */}
      {isWebGLSupported && (
        <Suspense fallback={null}>
          <ParticleField count={300} color="#fbbf24" size={0.015} spread={15} />
        </Suspense>
      )}

      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-amber-50/30 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4">
        {/* Section Title */}
        <ScrollSection className="text-center mb-20">
          <Reveal direction="scale">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="text-4xl">✨</span>
              <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400 tracking-widest uppercase">
                Kisah Kami
              </span>
            </div>
          </Reveal>

          <h2 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6">
            <TextReveal text={title} delay={0.2} />
            <br />
            <span className="text-yellow-500">
              <TextReveal text={highlightTitle} delay={0.5} />
            </span>
          </h2>

          <Reveal direction="up" delay={0.8}>
            <div className="flex items-center justify-center gap-4 mt-8">
              <div className="h-1 w-20 bg-gradient-to-r from-transparent to-yellow-400 rounded-full" />
              <div className="w-4 h-4 rounded-full bg-yellow-400 animate-pulse" />
              <div className="h-1 w-20 bg-gradient-to-l from-transparent to-yellow-400 rounded-full" />
            </div>
          </Reveal>
        </ScrollSection>

        {/* Philosophy Card */}
        <ScrollSection parallaxOffset={30}>
          <FloatingElement intensity={5} className="max-w-4xl mx-auto">
            <div className="relative group">
              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition duration-500" />
              
              <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-yellow-200/50 dark:border-yellow-700/30 shadow-2xl">
                {/* Sun Icon */}
                <Reveal direction="scale" delay={0.2}>
                  <div className="flex justify-center mb-8">
                    <motion.div 
                      className="relative"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    >
                      <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-400/30">
                        <span className="text-4xl">☀️</span>
                      </div>
                      {/* Orbiting dot */}
                      <motion.div
                        className="absolute w-3 h-3 bg-yellow-300 rounded-full"
                        style={{ top: -6, left: '50%', marginLeft: -6 }}
                        animate={{ rotate: -360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      />
                    </motion.div>
                  </div>
                </Reveal>

                {/* Philosophy Title */}
                <Reveal direction="up" delay={0.3}>
                  <h3 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-8">
                    {philosophyTitle}{' '}
                    <span className="text-yellow-500">{philosophyHighlight}</span>
                  </h3>
                </Reveal>

                {/* Philosophy Content */}
                <div className="space-y-6 text-center">
                  <Reveal direction="up" delay={0.4}>
                    <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
                      <WordReveal 
                        text={`${philosophyContent.part1} `}
                        highlightWords={[]}
                      />
                      <span className="font-bold text-yellow-600 dark:text-yellow-400">
                        {philosophyContent.nameHighlight}
                      </span>
                      {` ${philosophyContent.part2} `}
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        {philosophyContent.skyHighlight}
                      </span>
                      {philosophyContent.part3}
                    </p>
                  </Reveal>

                  {descriptions.map((desc, index) => (
                    <Reveal key={index} direction="up" delay={0.5 + index * 0.1}>
                      <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                        {desc}
                      </p>
                    </Reveal>
                  ))}
                </div>

                {/* Decorative Bottom */}
                <Reveal direction="scale" delay={0.8}>
                  <div className="flex justify-center items-center mt-10 space-x-4">
                    <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-yellow-400 rounded-full" />
                    <motion.div 
                      className="w-3 h-3 bg-yellow-400 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <div className="w-16 h-0.5 bg-gradient-to-l from-transparent to-yellow-400 rounded-full" />
                  </div>
                </Reveal>
              </div>
            </div>
          </FloatingElement>
        </ScrollSection>
      </div>
    </section>
  );
}

// Symbol Section with 3D hover effects
// SymbolItem type is imported from ./types

interface SymbolSectionProps {
  title: string;
  highlightTitle: string;
  subtitle: string;
  logoSrc: string;
  logoAlt: string;
  logoCaption: string;
  logoTitle: string;
  symbols: SymbolItem[];
}

export function SymbolSection({
  title,
  highlightTitle,
  subtitle,
  logoSrc,
  logoAlt,
  logoCaption,
  logoTitle,
  symbols
}: SymbolSectionProps) {
  return (
    <section className="relative py-32 overflow-hidden bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <ScrollSection className="text-center mb-20">
          <Reveal direction="scale">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="text-4xl">🎨</span>
              <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400 tracking-widest uppercase">
                Identitas Visual
              </span>
            </div>
          </Reveal>

          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            <TextReveal text={title} delay={0.2} />
            <span className="text-yellow-500">
              <TextReveal text={` ${highlightTitle}`} delay={0.4} />
            </span>
          </h2>

          <Reveal direction="up" delay={0.6}>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {subtitle}
            </p>
          </Reveal>
        </ScrollSection>

        {/* Logo and Symbols Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Logo Display */}
          <ScrollSection parallaxOffset={20}>
            <FloatingElement intensity={8}>
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400/20 to-amber-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition duration-500" />
                <div className="relative bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-gray-800 dark:to-gray-700 rounded-3xl p-12 border border-yellow-200/50 dark:border-yellow-700/30">
                  <motion.img 
                    src={logoSrc}
                    alt={logoAlt}
                    className="w-64 h-64 mx-auto object-contain drop-shadow-2xl"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  />
                  <p className="text-center text-gray-600 dark:text-gray-400 mt-6 font-medium">
                    {logoCaption}
                  </p>
                </div>
              </div>
            </FloatingElement>
          </ScrollSection>

          {/* Symbols List */}
          <div className="space-y-4">
            <Reveal direction="right" delay={0.2}>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-8">
                {logoTitle}
              </h3>
            </Reveal>

            <StaggerContainer staggerDelay={0.1}>
              {symbols.map((symbol, index) => (
                <StaggerItem key={index}>
                  <MagneticButton strength={0.1}>
                    <div className="group flex items-start gap-4 p-4 rounded-2xl hover:bg-white/80 dark:hover:bg-gray-700/50 transition-all duration-300 cursor-default">
                      <div className={`flex-shrink-0 w-14 h-14 ${symbol.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <span className="text-2xl">{symbol.icon}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                          {symbol.title}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                          {symbol.description}
                        </p>
                      </div>
                    </div>
                  </MagneticButton>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </div>
      </div>
    </section>
  );
}

// Team Member Card with 3D hover effect
// TeamMember type is imported from ./types

interface TeamCardProps {
  member: TeamMember;
  index: number;
  onClick: (member: TeamMember) => void;
  colorIndex?: number;
}

export function TeamCard3D({ member, index, onClick, colorIndex }: TeamCardProps) {
  const gradients = [
    'from-yellow-400 to-amber-500',
    'from-blue-400 to-blue-600',
    'from-green-400 to-green-600',
    'from-purple-400 to-purple-600',
    'from-red-400 to-red-600',
    'from-orange-400 to-orange-600',
    'from-cyan-400 to-cyan-600',
  ];

  const gradient = gradients[colorIndex ?? index % gradients.length];

  return (
    <Reveal direction="up" delay={index * 0.1}>
      <FloatingElement intensity={10}>
        <div className="group relative cursor-pointer" onClick={() => onClick(member)}>
          {/* Glow Effect */}
          <div className={`absolute -inset-1 bg-gradient-to-r ${gradient} rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300`} />
          
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50">
            {/* Image Container */}
            <div className="relative h-80 overflow-hidden">
              <motion.img 
                src={member.image}
                alt={member.name}
                className="w-full h-full object-cover"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.5 }}
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white text-sm font-medium">Klik untuk detail</p>
                </div>
              </div>

              {/* View Button */}
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/20 backdrop-blur-sm border-2 border-white/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-white text-2xl">👤</span>
              </motion.div>
            </div>

            {/* Info */}
            <div className="p-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors mb-2">
                {member.name}
              </h4>
              <p className="text-yellow-600 dark:text-yellow-400 font-medium text-sm mb-3">
                {member.position}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                {member.description}
              </p>

              {/* Bottom Decoration */}
              <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                <div className={`w-10 h-1 bg-gradient-to-r ${gradient} rounded-full mx-auto opacity-60 group-hover:opacity-100 transition-opacity`} />
              </div>
            </div>
          </div>
        </div>
      </FloatingElement>
    </Reveal>
  );
}

// Team Section
interface TeamSectionProps {
  title: string;
  highlightTitle: string;
  subtitle: string;
  warningText?: string;
  warningColor?: 'yellow' | 'blue';
  members: TeamMember[];
  onMemberClick: (member: TeamMember) => void;
  gridCols?: 2 | 3 | 4;
  colorVariant?: boolean;
}

export function TeamSection({
  title,
  highlightTitle,
  subtitle,
  warningText,
  warningColor = 'yellow',
  members,
  onMemberClick,
  gridCols = 4,
  colorVariant = false
}: TeamSectionProps) {
  const [isWebGLSupported, setIsWebGLSupported] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      setIsWebGLSupported(!!gl);
    } catch {
      setIsWebGLSupported(false);
    }
  }, []);

  const gridClassName = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  }[gridCols];

  const warningStyles = {
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-600 text-yellow-800 dark:text-yellow-300',
    blue: 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600 text-blue-800 dark:text-blue-300'
  };

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background Particles */}
      {isWebGLSupported && (
        <Suspense fallback={null}>
          <ParticleField count={200} color="#fbbf24" size={0.01} spread={20} className="opacity-30" />
        </Suspense>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <ScrollSection className="text-center mb-16">
          <Reveal direction="scale">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="text-4xl">👥</span>
              <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400 tracking-widest uppercase">
                Tim Kami
              </span>
            </div>
          </Reveal>

          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            <TextReveal text={title} delay={0.2} />
            <span className="text-yellow-500">
              <TextReveal text={` ${highlightTitle}`} delay={0.4} />
            </span>
          </h2>

          <Reveal direction="up" delay={0.6}>
            <div className="flex justify-center items-center space-x-4 mb-8">
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-yellow-400" />
              <div className="w-4 h-4 bg-yellow-400 rounded-full" />
              <div className="w-16 h-0.5 bg-gradient-to-l from-transparent to-yellow-400" />
            </div>
          </Reveal>

          <Reveal direction="up" delay={0.7}>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
              {subtitle}
            </p>
          </Reveal>

          {warningText && (
            <Reveal direction="up" delay={0.8}>
              <div className={`inline-block px-6 py-3 border-2 rounded-lg ${warningStyles[warningColor]}`}>
                <p className="text-base font-medium">
                  {warningText}
                </p>
              </div>
            </Reveal>
          )}
        </ScrollSection>

        {/* Team Grid */}
        {members && members.length > 0 ? (
          <div className={`grid ${gridClassName} gap-8 max-w-6xl mx-auto`}>
            {members.map((member, index) => (
              <TeamCard3D
                key={member.id}
                member={member}
                index={index}
                onClick={onMemberClick}
                colorIndex={colorVariant ? index : 0}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Memuat data...</p>
          </div>
        )}
      </div>
    </section>
  );
}

// Export all components
export { Scene3D, ParticleField };
