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

// Public pages that should have 3D experience
const PUBLIC_PAGES_WITH_3D = [
  '/',
  '/home',
  '/beranda',
  '/about',
  '/bidang',
  '/gallery',
  '/info',
  '/people',
  '/sekbid',
  '/activity',
  '/our-social-media',
  '/posts',
];

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');
  const isRegisterPage = pathname?.startsWith('/register');
  
  // Show 3D experience on all public pages (not admin, register, or special pages)
  const isPublicPage = !isAdminPage && !isRegisterPage;
  const show3DExperience = isPublicPage && PUBLIC_PAGES_WITH_3D.some(p => 
    pathname === p || pathname?.startsWith(p + '/')
  );
  // Only show intro on homepage
  const showIntro = pathname === '/' || pathname === '/home' || pathname === '/beranda';

  return (
    <SessionProvider>
      <SecurityAnalyzerProvider>
        <LanguageProvider>
          <ThemeProvider>
            <ToastProvider>
            <SmoothScroll>
              {/* 3D Experience - on all public pages */}
              {show3DExperience ? (
                <Suspense fallback={
                  <>
                    {isPublicPage && (
                      <ClientOnly><Navbar /></ClientOnly>
                    )}
                    <PageTransition>
                      <div style={isPublicPage ? { paddingTop: 'var(--nav-offset)' } : undefined}>
                        {children}
                      </div>
                    </PageTransition>
                    {isPublicPage && <Footer />}
                  </>
                }>
                  <ExperienceProvider showIntro={showIntro} showCustomCursor={true}>
                    {isPublicPage && (
                      <ClientOnly><Navbar /></ClientOnly>
                    )}
                    <PageTransition>
                      <div style={isPublicPage ? { paddingTop: 'var(--nav-offset)' } : undefined}>
                        {children}
                      </div>
                    </PageTransition>
                    {isPublicPage && <Footer />}
                  </ExperienceProvider>
                </Suspense>
              ) : (
                <>
                  {/* Navbar - hide on admin & register pages */}
                  {isPublicPage && (
                    <ClientOnly>
                      <Navbar />
                    </ClientOnly>
                  )}
                  <PageTransition>
                    <div 
                      className={isPublicPage ? '' : ''} 
                      style={isPublicPage ? { paddingTop: 'var(--nav-offset)' } : undefined}
                      suppressHydrationWarning
                    >
                      {children}
                    </div>
                  </PageTransition>
                  {/* Footer - hide on admin & register pages */}
                  {isPublicPage && <Footer />}
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
