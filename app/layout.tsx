import './globals.css';
import './globals-mobile.css';
import '@/lib/fontawesome';

import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';

import LocationServiceProvider from '@/components/LocationServiceProvider';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

import AIMonitorClient from '../components/AIMonitorClient';
import BackgroundSync from '../components/BackgroundSync';
import ClientRole from '../components/ClientRole';
import DynamicStyles from '../components/DynamicStyles';
import GlobalDesignLoader from '../components/GlobalDesignLoader';
import Providers from '../components/Providers';
import ScrollToTop from '../components/ScrollToTop';

const dmSans = DM_Sans({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap"
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://osissmktest.biezz.my.id';

export const metadata: Metadata = {
    title: {
        default: "OSIS SMK Informatika 2 Fithrah Insani",
        template: "%s | OSIS SMK Informatika 2 FI",
    },
    description: "Website Resmi OSIS SMK Informatika 2 Fithrah Insani - Organisasi Siswa Intra Sekolah yang aktif dalam kegiatan keislaman, kepemimpinan, dan kreativitas siswa.",
    keywords: ['OSIS', 'SMK Informatika 2', 'Fithrah Insani', 'Bandung', 'Sekolah Islam', 'Organisasi Siswa'],
    authors: [{ name: 'OSIS SMK Informatika 2 FI' }],
    icons: {
        icon: '/images/logo-2.png',
        shortcut: '/images/logo-2.png',
        apple: '/images/logo-2.png',
    },
    openGraph: {
        title: 'OSIS SMK Informatika 2 Fithrah Insani',
        description: 'Website Resmi OSIS SMK Informatika 2 Fithrah Insani - Organisasi Siswa Intra Sekolah yang aktif dalam kegiatan keislaman, kepemimpinan, dan kreativitas siswa.',
        url: SITE_URL,
        siteName: 'OSIS SMK Informatika 2 Fithrah Insani',
        locale: 'id_ID',
        type: 'website',
        images: [
            {
                url: `${SITE_URL}/images/logo.png`,
                width: 1200,
                height: 630,
                alt: 'OSIS SMK Informatika 2 Fithrah Insani',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'OSIS SMK Informatika 2 Fithrah Insani',
        description: 'Website Resmi OSIS SMK Informatika 2 Fithrah Insani',
        images: [`${SITE_URL}/images/logo.png`],
        creator: '@osissmkinformatika2fi',
    },
    robots: {
        index: true,
        follow: true,
    },
    metadataBase: new URL(SITE_URL),
};

// Layout is static/ISR by default for fast navigation.
// Background is applied client-side by BackgroundSync; role is read client-side in ClientRole.

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    const chatDisabled = process.env.NEXT_PUBLIC_DISABLE_CHAT === '1';

    const appContent = (
        <LocationServiceProvider>
        <Providers>
            <ScrollToTop />
            <BackgroundSync />
            <AIMonitorClient />
            <DynamicStyles />
            <GlobalDesignLoader />
            {children}
            {!chatDisabled && <ClientRole />}
            <SpeedInsights />
            <Analytics />
        </Providers>
        </LocationServiceProvider>
    );

    return (
        <html lang="id" className="scroll-smooth h-full" data-scroll-behavior="smooth" suppressHydrationWarning>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
                <meta name="theme-color" content="#ffffff" />
                {/* Font Awesome - non-blocking load (used on sekbid pages) */}
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
                    integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    media="print"
                />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `document.querySelectorAll('link[href*="font-awesome"]').forEach(function(l){l.media='all';});`
                    }}
                />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            // Prevent flash of unstyled content - Apply theme IMMEDIATELY
                            (function() {
                                const theme = localStorage.getItem('theme') || 
                                             (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                                document.documentElement.classList.remove('light', 'dark');
                                document.documentElement.classList.add(theme);
                                
                                const lang = localStorage.getItem('language') || 'id';
                                document.documentElement.lang = lang;
                                
                                // Ensure body background uses CSS variable (not inline style)
                                if (document.body) {
                                    document.body.style.removeProperty('background');
                                }
                            })();
                        `
                    }}
                />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            // Enable client-side error logging
                            (function() {
                                // Log uncaught errors
                                window.addEventListener('error', function(event) {
                                    fetch('/api/log-error', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            error_type: 'runtime_error',
                                            error_message: event.message || 'Uncaught error',
                                            error_stack: event.error?.stack,
                                            url: window.location.href,
                                            user_agent: navigator.userAgent,
                                            context: {
                                                filename: event.filename,
                                                lineno: event.lineno,
                                                colno: event.colno,
                                            },
                                        }),
                                    }).catch(function() {});
                                });
                                
                                // Log unhandled promise rejections
                                window.addEventListener('unhandledrejection', function(event) {
                                    fetch('/api/log-error', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            error_type: 'runtime_error',
                                            error_message: 'Unhandled Promise Rejection: ' + String(event.reason),
                                            error_stack: event.reason?.stack,
                                            url: window.location.href,
                                            user_agent: navigator.userAgent,
                                            context: { reason: String(event.reason) },
                                        }),
                                    }).catch(function() {});
                                });
                            })();
                        `
                    }}
                />
            </head>
            <body
                className={`${dmSans.className} antialiased min-h-screen`}
                suppressHydrationWarning
            >
                {/* Content wrapper */}
                <div 
                    className="relative w-full" 
                    style={{ 
                        position: 'relative', 
                        zIndex: 1
                    }} 
                    suppressHydrationWarning
                >
                    {appContent}
                </div>
            </body>
        </html>
    );
}