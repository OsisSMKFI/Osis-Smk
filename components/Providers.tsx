'use client';

import React, { lazy, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ToastProvider } from '@/contexts/ToastContext';
import Navbar from './Navbar';
import Footer from './Footer';
import PageTransition from './PageTransition';
import SmoothScroll from './SmoothScroll';
import ClientOnly from './ClientOnly';
import { SessionProvider } from 'next-auth/react';
import { SecurityAnalyzerProvider } from './SecurityAnalyzerProvider';

// Lazy load experience provider to avoid SSR issues
const ExperienceProvider = lazy(() => import('./experience/ExperienceProvider'));

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');
  const isRegisterPage = pathname?.startsWith('/register');

  // Only show 3D experience on main pages, not admin
  const showExperience = !isAdminPage && !isRegisterPage;

  return (
    <SessionProvider>
      <SecurityAnalyzerProvider>
        <LanguageProvider>
          <ThemeProvider>
            <ToastProvider>
            <SmoothScroll>
              {/* Navbar - hide on admin & register pages */}
              {!isAdminPage && !isRegisterPage && (
                <ClientOnly>
                  <Navbar />
                </ClientOnly>
              )}
              <PageTransition>
                <div 
                  className={!isAdminPage && !isRegisterPage ? '' : ''} 
                  style={!isAdminPage && !isRegisterPage ? { paddingTop: 'var(--nav-offset)' } : undefined}
                  suppressHydrationWarning
                >
                  {showExperience ? (
                    <Suspense fallback={<>{children}</>}>
                      <ExperienceProvider 
                        showIntro={pathname === '/'} 
                        show3DBackground={true}
                        showCustomCursor={true}
                        backgroundVariant="particles"
                      >
                        {children}
                      </ExperienceProvider>
                    </Suspense>
                  ) : (
                    children
                  )}
                </div>
              </PageTransition>
              {/* Footer - hide on admin & register pages */}
              {!isAdminPage && !isRegisterPage && <Footer />}
            </SmoothScroll>
          </ToastProvider>
        </ThemeProvider>
      </LanguageProvider>
      </SecurityAnalyzerProvider>
    </SessionProvider>
  );
}
