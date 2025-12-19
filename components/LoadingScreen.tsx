'use client';

import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  isVisible: boolean;
  progress?: number;
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  isVisible, 
  progress = 0, 
  message = "Memuat halaman..." 
}) => {
  const [dots, setDots] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Sync with system/stored theme
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark' || storedTheme === 'light') {
      setTheme(storedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  // Theme-aware colors
  const bgClass = theme === 'dark' 
    ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
    : 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50';
  const textClass = theme === 'dark' ? 'text-gray-300' : 'text-gray-600';
  const progressBgClass = theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-300/50';
  const progressTextClass = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`fixed inset-0 z-[9999] ${bgClass} flex items-center justify-center`} suppressHydrationWarning>
      {/* Background Animation - Simplified for performance */}
      <div className="absolute inset-0 overflow-hidden" suppressHydrationWarning>
        {/* Simplified Gradient Orbs - reduced blur for performance */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-yellow-400/10 to-amber-500/10 rounded-full blur-2xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-blue-400/10 to-indigo-500/10 rounded-full blur-2xl" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center">
        {/* Logo */}
        <div className="mb-8">
            <div className="relative inline-block">
            <img
              src="/images/logo-2.png"
              alt="OSIS Logo"
              className="w-24 h-24 rounded-full shadow-2xl animate-pulse-glow mx-auto"
            />
            
            {/* Rotating Rings */}
            <div className="absolute inset-0 border-2 border-yellow-400/30 rounded-full animate-spin" 
                 style={{ animationDuration: '3s' }} />
            <div className="absolute -inset-4 border border-blue-400/20 rounded-full animate-spin" 
                 style={{ animationDuration: '4s', animationDirection: 'reverse' }} />
          </div>
        </div>

        {/* Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent mb-2">
            OSIS SMK INFORMATIKA FITHRAH INSANI
          </h2>
          <p className="text-yellow-400 font-medium text-lg">Raveka Sena 2025-2026</p>
        </div>

        {/* Loading Animation - Simplified */}
        <div className="mb-6">
          <div className="flex justify-center space-x-2 mb-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-3 h-8 bg-gradient-to-t from-yellow-400 to-amber-500 rounded-full animate-bounce"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
          
          {/* Loading Text */}
          <p className={`${textClass} text-lg`}>
            {message}{dots}
          </p>
        </div>

        {/* Progress Bar */}
        {progress > 0 && (
          <div className="w-80 mx-auto">
            <div className={`${progressBgClass} rounded-full h-2 overflow-hidden`}>
              <div
                className="bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <p className={`${progressTextClass} text-sm mt-2`}>
              {Math.round(progress)}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;