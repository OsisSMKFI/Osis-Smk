'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  text, 
  className = ''
}: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-[3px]',
    lg: 'w-16 h-16 border-4',
    xl: 'w-24 h-24 border-[5px]',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className={`${sizes[size]} border-yellow-400 border-t-transparent rounded-full animate-spin`} />
      {text && (
        <p className={`${size === 'xl' ? 'text-lg' : size === 'lg' ? 'text-base' : 'text-sm'} font-medium text-gray-600 dark:text-gray-300`}>
          {text}
        </p>
      )}
    </div>
  );
}

export function LoadingOverlay({ text = 'Memuat...' }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <LoadingSpinner size="xl" text={text} />
    </div>
  );
}

export function LoadingSection({ text = 'Memuat data...', className = '' }: { text?: string; className?: string }) {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

export default LoadingSpinner;
