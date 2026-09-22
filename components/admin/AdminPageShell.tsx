"use client";
import React from 'react';

// Simple classnames utility
const clsx = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

interface AdminPageShellProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  gradient?: string; // tailwind gradient classes e.g. from-slate-900 to-slate-800
  children: React.ReactNode;
  padded?: boolean;
}

// Reusable shell providing consistent header + container spacing.
export default function AdminPageShell({
  icon,
  title,
  subtitle,
  actions,
  gradient = 'from-slate-900 to-slate-800',
  children,
  padded = true
}: AdminPageShellProps) {
  return (
    <div className={clsx('min-h-screen', padded && 'pb-6 md:pb-8')}>      
      <div className={clsx('rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-4 sm:p-6 md:p-8 mb-4 md:mb-8 text-white bg-gradient-to-r', gradient)}>
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="flex items-start sm:items-center space-x-3 md:space-x-4">
            {icon && (
              <div className="p-2 md:p-3 bg-white/20 rounded-lg md:rounded-xl backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight truncate">{title}</h1>
              {subtitle && <p className="text-slate-300 mt-0.5 md:mt-1 max-w-2xl text-xs sm:text-sm md:text-base line-clamp-2">{subtitle}</p>}
            </div>
          </div>
          {actions && (
            <div className="flex items-center flex-wrap gap-2 md:gap-3 w-full md:w-auto">
              {actions}
            </div>
          )}
        </div>
      </div>
      <div className="space-y-4 md:space-y-6">{children}</div>
    </div>
  );
}
