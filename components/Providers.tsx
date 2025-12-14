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

// Lazy load ExperienceProvider to prevent blocking initial render
const ExperienceProvider = lazy(() => 
  import('./experience/ExperienceProvider').catch(() => ({ 
    default: ({ children }: { children: React.ReactNode }) => <>{children}</> 
  }))
);

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');
  const isRegisterPage = pathname?.startsWith('/register');
  
  // Only show 3D experience on homepage and some public pages
  const show3DExperience = !isAdminPage && !isRegisterPage && pathname === '/';

  return (
    <SessionProvider>
      <SecurityAnalyzerProvider>
        <LanguageProvider>
          <ThemeProvider>
            <ToastProvider>
            <SmoothScroll>
              {/* 3D Experience - only on homepage */}
              {show3DExperience ? (
                <Suspense fallback={
                  <>
                    {!isAdminPage && !isRegisterPage && (
                      <ClientOnly><Navbar /></ClientOnly>
                    )}
                    <PageTransition>
                      <div style={!isAdminPage && !isRegisterPage ? { paddingTop: 'var(--nav-offset)' } : undefined}>
                        {children}
                      </div>
                    </PageTransition>
                    {!isAdminPage && !isRegisterPage && <Footer />}
                  </>
                }>
                  <ExperienceProvider showIntro={true} showCustomCursor={true}>
                    {!isAdminPage && !isRegisterPage && (
                      <ClientOnly><Navbar /></ClientOnly>
                    )}
                    <PageTransition>
                      <div style={!isAdminPage && !isRegisterPage ? { paddingTop: 'var(--nav-offset)' } : undefined}>
                        {children}
                      </div>
                    </PageTransition>
                    {!isAdminPage && !isRegisterPage && <Footer />}
                  </ExperienceProvider>
                </Suspense>
              ) : (
                <>
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
                      {children}
                    </div>
                  </PageTransition>
                  {/* Footer - hide on admin & register pages */}
                  {!isAdminPage && !isRegisterPage && <Footer />}
                </>
              )}
            </SmoothScroll>
          </ToastProvider>
        </ThemeProvider>
      </LanguageProvider>
      </SecurityAnalyzerProvider>
    </SessionProvider>
  );
}
