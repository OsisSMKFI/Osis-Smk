'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguage } from '@/contexts/LanguageContext';

interface Member {
  id: number;
  name: string;
  position: string;
  description: string;
  image: string;
  instagram_username?: string;
  kelas?: string;
  department?: string;
}

interface InteractiveMemberCardProps {
  member: Member;
  isLeader?: boolean;
  delay?: number;
}

// Portal wrapper for modal to ensure it renders at document body level
const ModalPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  if (!mounted) return null;
  
  return createPortal(children, document.body);
};

// Enhanced Modal Component for Member Details with premium design
const MemberDetailModal: React.FC<{
  member: Member;
  isLeader: boolean;
  isOpen: boolean;
  onClose: () => void;
}> = ({ member, isLeader, isOpen, onClose }) => {
  const { t } = useTranslation();
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  return (
    <ModalPortal>
      <AnimatePresence mode="wait">
        {isOpen && (
          <>
            {/* Backdrop with blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9998]"
              onClick={onClose}
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            
            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8 cursor-default"
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
              onClick={onClose}
            >
              {/* Modal Content with 3D entrance */}
              <motion.div
                initial={{ 
                  scale: 0.4, 
                  rotateX: 15,
                  rotateY: -30, 
                  opacity: 0,
                  y: 100
                }}
                animate={{ 
                  scale: 1, 
                  rotateX: 0,
                  rotateY: 0, 
                  opacity: 1,
                  y: 0
                }}
                exit={{ 
                  scale: 0.6, 
                  rotateX: -10,
                  rotateY: 20, 
                  opacity: 0,
                  y: 60
                }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 25,
                  mass: 0.8
                }}
                className="relative w-full max-w-2xl max-h-[85vh] overflow-auto rounded-2xl shadow-2xl cursor-auto"
                style={{ 
                  perspective: '1200px',
                  transformStyle: 'preserve-3d',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(249,250,251,0.99) 100%)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Glassmorphism overlay */}
                <div className="absolute inset-0 rounded-3xl overflow-hidden">
                  <div className={`absolute inset-0 opacity-20 ${
                    isLeader 
                      ? 'bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500' 
                      : 'bg-gradient-to-br from-blue-300 via-indigo-400 to-purple-500'
                  }`} />
                </div>
                
                {/* Premium animated background particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
                  {/* Floating orbs */}
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={`orb-${i}`}
                      className={`absolute rounded-full blur-xl ${
                        isLeader ? 'bg-yellow-400/30' : 'bg-blue-400/30'
                      }`}
                      style={{
                        width: 80 + i * 20,
                        height: 80 + i * 20,
                        left: `${10 + i * 15}%`,
                        top: `${20 + (i % 3) * 25}%`,
                      }}
                      animate={{ 
                        x: [0, 30, -20, 0],
                        y: [0, -20, 30, 0],
                        scale: [1, 1.2, 0.9, 1],
                        opacity: [0.3, 0.5, 0.3, 0.3]
                      }}
                      transition={{
                        duration: 8 + i * 2,
                        delay: i * 0.5,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                    />
                  ))}
                  
                  {/* Sparkle particles */}
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={`sparkle-${i}`}
                      className={`absolute rounded-full ${
                        isLeader 
                          ? i % 3 === 0 ? 'bg-yellow-400' : i % 3 === 1 ? 'bg-amber-400' : 'bg-orange-400'
                          : i % 3 === 0 ? 'bg-blue-400' : i % 3 === 1 ? 'bg-indigo-400' : 'bg-purple-400'
                      }`}
                      style={{
                        width: 3 + (i % 4),
                        height: 3 + (i % 4),
                        left: `${5 + (i * 4.5)}%`,
                        boxShadow: isLeader 
                          ? '0 0 8px rgba(251,191,36,0.8)' 
                          : '0 0 8px rgba(59,130,246,0.8)'
                      }}
                      initial={{ 
                        y: '100%',
                        opacity: 0,
                        scale: 0
                      }}
                      animate={{ 
                        y: '-100%',
                        opacity: [0, 1, 1, 0],
                        scale: [0, 1, 1, 0]
                      }}
                      transition={{
                        duration: 4 + (i % 3),
                        delay: i * 0.3,
                        repeat: Infinity,
                        ease: 'easeOut'
                      }}
                    />
                  ))}
                </div>
                
                {/* Close Button - Premium design */}
                <motion.button
                  className={`absolute top-4 right-4 z-30 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isLeader 
                      ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-slate-900 shadow-lg shadow-yellow-400/30' 
                      : 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-lg shadow-blue-400/30'
                  }`}
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
                
                <div className="relative flex flex-col md:flex-row dark:bg-slate-900/95">
                  {/* Image Section with premium effects */}
                  <motion.div 
                    className="relative w-full md:w-2/5 aspect-square md:aspect-auto min-h-[280px] md:min-h-[400px]"
                    initial={{ x: -80, opacity: 0, rotateY: -15 }}
                    animate={{ x: 0, opacity: 1, rotateY: 0 }}
                    transition={{ delay: 0.15, duration: 0.6, type: 'spring' }}
                  >
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/placeholder.svg';
                      }}
                    />
                    
                    {/* Premium gradient overlay */}
                    <div className={`absolute inset-0 ${
                      isLeader 
                        ? 'bg-gradient-to-t md:bg-gradient-to-r from-amber-900/60 via-transparent to-transparent' 
                        : 'bg-gradient-to-t md:bg-gradient-to-r from-indigo-900/60 via-transparent to-transparent'
                    }`} />
                    
                    {/* Shine effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent"
                      initial={{ x: '-100%', opacity: 0 }}
                      animate={{ x: '200%', opacity: 1 }}
                      transition={{ delay: 0.5, duration: 1.2, ease: 'easeOut' }}
                    />
                    
                    {/* Leader Crown Badge */}
                    {isLeader && (
                      <motion.div
                        className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-slate-900 px-5 py-2.5 rounded-full text-sm font-bold shadow-xl shadow-amber-500/40 flex items-center gap-2"
                        initial={{ scale: 0, rotate: -45, y: -20 }}
                        animate={{ scale: 1, rotate: 0, y: 0 }}
                        transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
                      >
                        <motion.span
                          animate={{ 
                            rotate: [0, -15, 15, 0],
                            scale: [1, 1.2, 1.2, 1]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="text-lg"
                        >
                          👑
                        </motion.span>
                        Leader
                      </motion.div>
                    )}
                  </motion.div>
                  
                  {/* Content Section with staggered animations */}
                  <motion.div 
                    className="flex-1 p-6 md:p-8 lg:p-10 relative z-10"
                    initial={{ x: 80, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                  >
                    {/* Name with gradient text */}
                    <motion.h2 
                      className={`text-3xl md:text-4xl font-black mb-3 ${
                        isLeader 
                          ? 'bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 bg-clip-text text-transparent' 
                          : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent'
                      }`}
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.35 }}
                    >
                      {member.name}
                    </motion.h2>
                    
                    {/* Position Badge with glow */}
                    <motion.div
                      className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold mb-5 ${
                        isLeader 
                          ? 'bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/40 text-amber-700 dark:text-amber-300 shadow-lg shadow-amber-200/50 dark:shadow-amber-900/30' 
                          : 'bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 text-indigo-700 dark:text-indigo-300 shadow-lg shadow-indigo-200/50 dark:shadow-indigo-900/30'
                      }`}
                      initial={{ scale: 0, x: -30 }}
                      animate={{ scale: 1, x: 0 }}
                      transition={{ delay: 0.45, type: 'spring' }}
                    >
                      <span className={`w-2 h-2 rounded-full ${isLeader ? 'bg-amber-500' : 'bg-indigo-500'}`} />
                      {member.position}
                    </motion.div>
                    
                    {/* Description with elegant typography */}
                    <motion.p
                      className="text-gray-600 dark:text-gray-300 leading-relaxed mb-7 text-base md:text-lg"
                      initial={{ y: 25, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.55 }}
                    >
                      {member.description || 'Anggota aktif OSIS yang berkontribusi untuk kemajuan sekolah dan mengembangkan potensi siswa.'}
                    </motion.p>
                    
                    {/* Premium Info Grid */}
                    <motion.div 
                      className="grid grid-cols-2 gap-4 mb-7"
                      initial={{ y: 25, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.65 }}
                    >
                      {member.kelas && (
                        <motion.div 
                          className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/80"
                          whileHover={{ scale: 1.02, y: -2 }}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isLeader ? 'bg-gradient-to-br from-yellow-400 to-amber-500' : 'bg-gradient-to-br from-blue-400 to-indigo-500'
                          }`}>
                            <span className="text-white text-lg">🎓</span>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Kelas</p>
                            <p className="font-bold text-gray-900 dark:text-white">{member.kelas}</p>
                          </div>
                        </motion.div>
                      )}
                      
                      {member.department && (
                        <motion.div 
                          className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/80"
                          whileHover={{ scale: 1.02, y: -2 }}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isLeader ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-indigo-400 to-purple-500'
                          }`}>
                            <span className="text-white text-lg">🏢</span>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Seksi Bidang</p>
                            <p className="font-bold text-gray-900 dark:text-white text-sm">{member.department}</p>
                          </div>
                        </motion.div>
                      )}
                      
                      <motion.div 
                        className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/80"
                        whileHover={{ scale: 1.02, y: -2 }}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isLeader ? 'bg-gradient-to-br from-orange-400 to-red-500' : 'bg-gradient-to-br from-purple-400 to-pink-500'
                        }`}>
                          <span className="text-white text-lg">📅</span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Periode</p>
                          <p className="font-bold text-gray-900 dark:text-white">2024-2025</p>
                        </div>
                      </motion.div>
                      
                      <motion.div 
                        className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/80"
                        whileHover={{ scale: 1.02, y: -2 }}
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-green-400 to-emerald-500">
                          <span className="text-white text-lg">✅</span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Status</p>
                          <p className="font-bold text-green-600 dark:text-green-400">Aktif</p>
                        </div>
                      </motion.div>
                    </motion.div>
                    
                    {/* Social Links with premium styling */}
                    <motion.div
                      className="flex flex-wrap gap-3"
                      initial={{ y: 25, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.75 }}
                    >
                      {member.instagram_username && (
                        <motion.a
                          href={`https://instagram.com/${member.instagram_username.replace(/^@/, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white rounded-full text-sm font-bold shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40 transition-all"
                          whileHover={{ scale: 1.05, y: -3 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                          @{member.instagram_username.replace(/^@/, '')}
                        </motion.a>
                      )}
                    </motion.div>
                  </motion.div>
                </div>
                
                {/* Bottom decorative gradient bar */}
                <motion.div
                  className={`h-1.5 ${
                    isLeader 
                      ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500' 
                      : 'bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500'
                  }`}
                  initial={{ scaleX: 0, originX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
                />
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </ModalPortal>
  );
};

const InteractiveMemberCard: React.FC<InteractiveMemberCardProps> = ({ 
  member, 
  isLeader = false, 
  delay = 0 
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const { language } = useLanguage();

  // 3D Tilt values with enhanced spring
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  const scale = useMotionValue(1);
  
  const springConfig = { stiffness: 400, damping: 25 };
  const rotateXSpring = useSpring(rotateX, springConfig);
  const rotateYSpring = useSpring(rotateY, springConfig);
  const scaleSpring = useSpring(scale, springConfig);
  
  // Transform glare position for dynamic effect
  const glareOpacity = useTransform(glareX, [0, 50, 100], [0.1, 0.3, 0.1]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isFlipping) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    const tiltIntensity = 15; // Increased for more dramatic effect
    rotateX.set(-(mouseY / (rect.height / 2)) * tiltIntensity);
    rotateY.set((mouseX / (rect.width / 2)) * tiltIntensity);
    
    glareX.set(((e.clientX - rect.left) / rect.width) * 100);
    glareY.set(((e.clientY - rect.top) / rect.height) * 100);
  }, [isFlipping, rotateX, rotateY, glareX, glareY]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    scale.set(1.02);
  }, [scale]);

  const handleMouseLeave = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
    scale.set(1);
    setIsHovered(false);
  }, [rotateX, rotateY, scale]);

  const handleClick = useCallback(() => {
    // Start flip animation then open modal
    setIsFlipping(true);
    
    // Open modal after flip animation
    setTimeout(() => {
      setIsModalOpen(true);
      setIsFlipping(false);
    }, 350);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const getImageSrc = () => {
    if (member.image === '/images/placeholder.svg') {
      return language === 'en' ? '/images/placeholder-en.svg' : '/images/placeholder.svg';
    }
    return member.image;
  };

  return (
    <>
      <motion.div
        ref={cardRef}
        className="relative cursor-pointer group"
        style={{ perspective: 1200 }}
        initial={{ opacity: 0, y: 60, scale: 0.85, rotateX: 10 }}
        whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ 
          duration: 0.6, 
          delay: delay * 0.08,
          type: 'spring',
          stiffness: 100
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        <motion.div
          className={`relative overflow-hidden rounded-2xl ${
            isLeader 
              ? 'bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-950/40 dark:via-amber-950/30 dark:to-slate-900' 
              : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-slate-900'
          }`}
          style={{
            rotateX: rotateXSpring,
            rotateY: rotateYSpring,
            scale: scaleSpring,
            transformStyle: 'preserve-3d',
            boxShadow: isHovered 
              ? isLeader 
                ? '0 25px 50px -12px rgba(251,191,36,0.35), 0 0 0 1px rgba(251,191,36,0.2)' 
                : '0 25px 50px -12px rgba(99,102,241,0.35), 0 0 0 1px rgba(99,102,241,0.2)'
              : '0 10px 30px -10px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)'
          }}
          animate={isFlipping ? { 
            rotateY: [0, 180, 360],
            scale: [1, 0.85, 1]
          } : {}}
          transition={isFlipping ? { duration: 0.5, ease: [0.4, 0, 0.2, 1] } : { duration: 0.3 }}
          whileTap={{ scale: 0.97 }}
        >
          {/* Animated border gradient */}
          <motion.div
            className={`absolute inset-0 rounded-2xl z-0 ${
              isLeader 
                ? 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500' 
                : 'bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-500'
            }`}
            style={{ padding: 2 }}
            animate={isHovered ? { 
              opacity: [0.5, 1, 0.5],
              background: isLeader 
                ? ['linear-gradient(135deg, #fbbf24, #f59e0b, #ea580c)', 'linear-gradient(225deg, #fbbf24, #f59e0b, #ea580c)', 'linear-gradient(135deg, #fbbf24, #f59e0b, #ea580c)']
                : ['linear-gradient(135deg, #3b82f6, #6366f1, #a855f7)', 'linear-gradient(225deg, #3b82f6, #6366f1, #a855f7)', 'linear-gradient(135deg, #3b82f6, #6366f1, #a855f7)']
            } : { opacity: 0.3 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
          
          {/* Inner card container */}
          <div className={`relative m-[2px] rounded-[14px] overflow-hidden ${
            isLeader 
              ? 'bg-gradient-to-br from-white via-yellow-50/50 to-amber-50/30 dark:from-slate-900 dark:via-yellow-950/20 dark:to-slate-900' 
              : 'bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/30 dark:from-slate-900 dark:via-blue-950/20 dark:to-slate-900'
          }`}>
            
            {/* Glare Effect - Enhanced */}
            <motion.div
              className="absolute inset-0 pointer-events-none z-30 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, transparent 30%, rgba(255,255,255,${isHovered ? 0.4 : 0}) ${glareX.get()}%, transparent 70%)`,
                opacity: isHovered ? 1 : 0,
              }}
            />
            
            {/* Sparkle particles on hover */}
            <AnimatePresence>
              {isHovered && (
                <>
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={`sparkle-${i}`}
                      className={`absolute w-1 h-1 rounded-full z-40 ${
                        isLeader ? 'bg-yellow-400' : 'bg-blue-400'
                      }`}
                      style={{
                        left: `${15 + i * 10}%`,
                        top: `${20 + (i % 4) * 20}%`,
                        boxShadow: isLeader 
                          ? '0 0 6px rgba(251,191,36,0.8)' 
                          : '0 0 6px rgba(59,130,246,0.8)'
                      }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: [0, 1.5, 0],
                        opacity: [0, 1, 0],
                        y: [0, -15, -30]
                      }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ 
                        duration: 1.2, 
                        delay: i * 0.1,
                        repeat: Infinity
                      }}
                    />
                  ))}
                </>
              )}
            </AnimatePresence>

            {/* Image Container - compact square */}
            <div className="relative aspect-square overflow-hidden">
              {!imageError ? (
                <motion.img
                  src={getImageSrc()}
                  alt={member.name}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                  animate={{ 
                    scale: isHovered ? 1.12 : 1,
                    filter: isHovered ? 'brightness(1.05)' : 'brightness(1)'
                  }}
                  transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                />
              ) : (
                <div className={`w-full h-full flex items-center justify-center ${
                  isLeader 
                    ? 'bg-gradient-to-br from-yellow-100 to-amber-200 dark:from-yellow-900/30 dark:to-amber-900/20' 
                    : 'bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900/30 dark:to-indigo-900/20'
                }`}>
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <svg className={`w-20 h-20 ${isLeader ? 'text-yellow-400' : 'text-blue-400'}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </motion.div>
                </div>
              )}
              
              {/* Premium gradient overlay */}
              <motion.div
                className={`absolute inset-0 ${
                  isLeader 
                    ? 'bg-gradient-to-t from-amber-900/80 via-amber-900/20 to-transparent' 
                    : 'bg-gradient-to-t from-indigo-900/80 via-indigo-900/20 to-transparent'
                }`}
                animate={{ opacity: isHovered ? 1 : 0.6 }}
                transition={{ duration: 0.3 }}
              />
              
              {/* Shine sweep effect on hover */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    className="absolute inset-0 z-20"
                    style={{
                      background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.3) 50%, transparent 80%)',
                    }}
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                  />
                )}
              </AnimatePresence>
              
              {/* Click indicator - Minimal */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center z-25"
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className={`w-10 h-10 rounded-xl backdrop-blur-md flex items-center justify-center ${
                    isLeader 
                      ? 'bg-yellow-500/40 border border-yellow-400/60' 
                      : 'bg-blue-500/40 border border-blue-400/60'
                  }`}
                  animate={isHovered ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </motion.div>
              </motion.div>

              {/* Leader Crown Badge - Enhanced */}
              {isLeader && (
                <motion.div
                  className="absolute top-3 right-3 z-30"
                  initial={{ scale: 0, rotate: -45, y: -20 }}
                  animate={{ scale: 1, rotate: 0, y: 0 }}
                  transition={{ delay: delay * 0.08 + 0.3, type: 'spring', stiffness: 300 }}
                >
                  <motion.div
                    className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-slate-900 px-3 py-1.5 rounded-full text-xs font-bold shadow-xl shadow-amber-500/40 flex items-center gap-1.5"
                    animate={{ 
                      boxShadow: [
                        '0 4px 20px rgba(251,191,36,0.4)',
                        '0 4px 30px rgba(251,191,36,0.6)',
                        '0 4px 20px rgba(251,191,36,0.4)'
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <motion.span
                      animate={{ rotate: [-5, 5, -5], scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      👑
                    </motion.span>
                    Leader
                  </motion.div>
                </motion.div>
              )}
              
              {/* Bottom info overlay - compact */}
              <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
                <motion.h3
                  className="font-bold text-sm text-white mb-0.5 drop-shadow-lg line-clamp-1"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
                  animate={{ x: isHovered ? 2 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {member.name}
                </motion.h3>
                
                <motion.p 
                  className={`text-xs font-medium line-clamp-1 ${
                    isLeader ? 'text-yellow-300' : 'text-blue-300'
                  }`}
                  animate={{ x: isHovered ? 2 : 0 }}
                  transition={{ duration: 0.3, delay: 0.03 }}
                >
                  {member.position}
                </motion.p>
              </div>
            </div>

            {/* Footer section - compact */}
            <div className={`px-3 py-2 relative z-10 ${
              isLeader 
                ? 'bg-gradient-to-r from-yellow-50/90 to-amber-50/90 dark:from-yellow-950/40 dark:to-amber-950/30' 
                : 'bg-gradient-to-r from-blue-50/90 to-indigo-50/90 dark:from-blue-950/40 dark:to-indigo-950/30'
            }`}>
              {/* Compact action row */}
              <motion.div 
                className="flex items-center justify-between"
                animate={isHovered ? { y: -1 } : { y: 0 }}
              >
                <div className="flex gap-0.5">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${
                        isLeader ? 'bg-yellow-400' : 'bg-blue-400'
                      }`}
                      animate={isHovered ? { 
                        y: [0, -4, 0],
                        scale: [1, 1.2, 1]
                      } : {}}
                      transition={{ 
                        duration: 0.5, 
                        delay: i * 0.08,
                        repeat: isHovered ? Infinity : 0
                      }}
                    />
                  ))}
                </div>
                
                <motion.div
                  className={`text-[10px] font-medium flex items-center gap-0.5 ${
                    isLeader ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400'
                  }`}
                  animate={{ opacity: isHovered ? 1 : 0.6 }}
                >
                  <span>Detail</span>
                  <motion.span
                    animate={isHovered ? { x: [0, 2, 0] } : {}}
                    transition={{ duration: 0.6, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Detail Modal */}
      <MemberDetailModal
        member={member}
        isLeader={isLeader}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
};

export default InteractiveMemberCard;
