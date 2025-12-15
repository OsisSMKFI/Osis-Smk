'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  variant?: 'default' | 'dots' | 'pulse' | 'orbit' | 'gradient';
  className?: string;
}

/**
 * Modern, elegant loading spinner with multiple variants
 */
export function LoadingSpinner({ 
  size = 'md', 
  text, 
  variant = 'default',
  className = ''
}: LoadingSpinnerProps) {
  
  const sizes = {
    sm: { container: 'w-8 h-8', text: 'text-xs', dots: 'w-2 h-2' },
    md: { container: 'w-12 h-12', text: 'text-sm', dots: 'w-2.5 h-2.5' },
    lg: { container: 'w-16 h-16', text: 'text-base', dots: 'w-3 h-3' },
    xl: { container: 'w-24 h-24', text: 'text-lg', dots: 'w-4 h-4' },
  };

  // Variant: Gradient Ring
  if (variant === 'gradient') {
    return (
      <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
        <div className={`relative ${sizes[size].container}`}>
          {/* Outer glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 blur-md opacity-40 animate-pulse" />
          
          {/* Main spinner */}
          <div className="relative w-full h-full">
            <svg className="w-full h-full animate-spin" viewBox="0 0 50 50">
              <defs>
                <linearGradient id="spinnerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FBBF24" />
                  <stop offset="50%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
              </defs>
              <circle
                className="opacity-20"
                cx="25"
                cy="25"
                r="20"
                fill="none"
                stroke="url(#spinnerGradient)"
                strokeWidth="4"
              />
              <circle
                cx="25"
                cy="25"
                r="20"
                fill="none"
                stroke="url(#spinnerGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="80, 200"
                strokeDashoffset="0"
              />
            </svg>
          </div>
          
          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 animate-pulse" />
          </div>
        </div>
        
        {text && (
          <p className={`${sizes[size].text} font-medium text-gray-600 dark:text-gray-300 animate-pulse`}>
            {text}
          </p>
        )}
      </div>
    );
  }

  // Variant: Orbit (3 dots orbiting)
  if (variant === 'orbit') {
    return (
      <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
        <div className={`relative ${sizes[size].container}`}>
          {/* Orbiting dots */}
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '1.5s' }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 shadow-lg shadow-yellow-500/50" />
          </div>
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '1.5s', animationDelay: '0.5s' }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-lg shadow-amber-500/50" />
          </div>
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '1.5s', animationDelay: '1s' }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gradient-to-r from-orange-400 to-red-500 shadow-lg shadow-orange-500/50" />
          </div>
          
          {/* Center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-200 dark:to-slate-400" />
          </div>
        </div>
        
        {text && (
          <p className={`${sizes[size].text} font-medium text-gray-600 dark:text-gray-300`}>
            {text}
          </p>
        )}
      </div>
    );
  }

  // Variant: Pulse (pulsing circles)
  if (variant === 'pulse') {
    return (
      <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
        <div className={`relative ${sizes[size].container}`}>
          {/* Ripple effects */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400/30 to-amber-500/30 animate-ping" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-r from-yellow-400/40 to-amber-500/40 animate-ping" style={{ animationDelay: '0.3s' }} />
          <div className="absolute inset-4 rounded-full bg-gradient-to-r from-yellow-400/50 to-amber-500/50 animate-ping" style={{ animationDelay: '0.6s' }} />
          
          {/* Center solid */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 shadow-lg shadow-yellow-500/50" />
          </div>
        </div>
        
        {text && (
          <p className={`${sizes[size].text} font-medium text-gray-600 dark:text-gray-300`}>
            {text}
          </p>
        )}
      </div>
    );
  }

  // Variant: Dots (bouncing dots)
  if (variant === 'dots') {
    return (
      <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`${sizes[size].dots} rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 shadow-md shadow-yellow-500/30 animate-bounce`}
              style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.6s' }}
            />
          ))}
        </div>
        
        {text && (
          <p className={`${sizes[size].text} font-medium text-gray-600 dark:text-gray-300`}>
            {text}
          </p>
        )}
      </div>
    );
  }

  // Default variant (modern spinning ring)
  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <div className={`relative ${sizes[size].container}`}>
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 opacity-20 blur-lg animate-pulse" />
        
        {/* Background ring */}
        <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700" />
        
        {/* Spinning gradient ring */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-yellow-400 border-r-amber-500 animate-spin" 
          style={{ animationDuration: '0.8s' }} 
        />
        
        {/* Inner glow */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-yellow-400/10 to-amber-500/10" />
      </div>
      
      {text && (
        <p className={`${sizes[size].text} font-medium text-gray-600 dark:text-gray-300 animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );
}

/**
 * Full page loading overlay
 */
export function LoadingOverlay({ 
  text = 'Memuat...', 
  variant = 'gradient' 
}: { 
  text?: string; 
  variant?: 'default' | 'dots' | 'pulse' | 'orbit' | 'gradient';
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <LoadingSpinner size="xl" text={text} variant={variant} />
    </div>
  );
}

/**
 * Inline loading for sections
 */
export function LoadingSection({ 
  text = 'Memuat data...', 
  variant = 'gradient',
  className = ''
}: { 
  text?: string; 
  variant?: 'default' | 'dots' | 'pulse' | 'orbit' | 'gradient';
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <LoadingSpinner size="lg" text={text} variant={variant} />
    </div>
  );
}

export default LoadingSpinner;
