'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaHeart, FaQrcode, FaShareAlt } from 'react-icons/fa';
import { InstagramIcon, SpotifyIcon, TiktokIcon, YoutubeIcon } from './icons/SocialIcons';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/contexts/ToastContext';
import { SOCIAL_MEDIA_CONFIG } from '@/lib/socialMediaConfig';
import OptimizedLogo from './OptimizedLogo';
import QRCode from 'qrcode';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [showQR, setShowQR] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  // Generate QR Code
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (showQR && qrCanvasRef.current && currentUrl) {
      QRCode.toCanvas(qrCanvasRef.current, currentUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).catch((err: Error) => {
        console.error('QR Code generation error:', err);
      });
    }
  }, [showQR, currentUrl]);

  const handleShareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'OSIS SMK Fithrah Insani',
          text: 'Kunjungi website OSIS SMK Fithrah Insani - Raveka Sena',
          url: currentUrl
        });
        showToast('Link berhasil dibagikan!', 'success');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentUrl).then(() => {
      showToast('Link disalin ke clipboard!', 'success');
    }).catch(() => {
      showToast('Gagal menyalin link', 'error');
    });
  };
  
  return (
    <footer
      data-component="footer"
      className="relative overflow-hidden text-gray-600 dark:text-gray-300 transition-colors duration-300"
      style={{
        background: 'var(--gradient-bg)'
      }}
    >
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-400/5 dark:bg-yellow-400/3 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/5 dark:bg-blue-400/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-10 sm:mb-12">
            {/* Brand Section */}
            <div className="sm:col-span-2 lg:col-span-2">
              <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                <OptimizedLogo 
                  size="md"
                  alt={t('navbar.logoAlt')} 
                  className="rounded-full w-10 h-10 sm:w-12 sm:h-12" 
                />
                <div>
                  <h3 className="heading-secondary text-xl sm:text-2xl text-gray-800 dark:text-white">
                    {t('navbar.brandName')}
                  </h3>
                  <p className="text-yellow-600 dark:text-yellow-400 font-medium text-sm sm:text-base">{t('home.subtitle')}</p>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 max-w-md leading-relaxed text-sm sm:text-base">
                {t('footer.aboutDesc')}
              </p>

              {/* Social Media */}
              <div className="flex space-x-3 sm:space-x-4">
                {[
                  { 
                    icon: InstagramIcon, 
                    href: SOCIAL_MEDIA_CONFIG.instagram.url, 
                    name: "Instagram",
                    available: SOCIAL_MEDIA_CONFIG.instagram.isActive
                  },
                  { 
                    icon: SpotifyIcon, 
                    href: SOCIAL_MEDIA_CONFIG.spotify.url, 
                    name: "Spotify",
                    available: SOCIAL_MEDIA_CONFIG.spotify.isActive
                  },
                  { 
                    icon: TiktokIcon, 
                    href: SOCIAL_MEDIA_CONFIG.tiktok.url, 
                    name: "TikTok",
                    available: SOCIAL_MEDIA_CONFIG.tiktok.isActive
                  },
                  { 
                    icon: YoutubeIcon, 
                    href: SOCIAL_MEDIA_CONFIG.youtube.url, 
                    name: "YouTube",
                    available: SOCIAL_MEDIA_CONFIG.youtube.isActive
                  }
                ].map((social, index) => (
                  <div key={index} className="relative group">
                    {social.available ? (
                      <a 
                        href={social.href} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-white/20 dark:bg-white/10 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-white hover:bg-white/30 transition-all duration-200 hover:scale-105 focus-ring"
                        aria-label={`${t('footer.followUsOn')} ${social.name}`}
                      >
                        <social.icon size={24} className="sm:w-[26px] sm:h-[26px] lg:w-[28px] lg:h-[28px]" />
                      </a>
                    ) : (
                      <button 
                        onClick={(e) => { e.preventDefault(); showToast(t('toast.linkNotActive'), 'warning'); }}
                        className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center text-gray-400 dark:text-gray-500 transition-all duration-200 hover:bg-white/15 focus-ring opacity-60 cursor-not-allowed"
                        aria-label={`${social.name} - ${t('socialMediaPage.notAvailable')}`}
                      >
                        <social.icon size={22} className="opacity-70" />
                      </button>
                    )}
                    
                    {/* Tooltip */}
                    <div
                      className="absolute -top-12 left-1/2 transform -translate-x-1/2 px-3 py-1 text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none"
                      style={{ background: 'var(--overlay-soft)', color: 'var(--text-primary)' }}
                    >
                      {social.name}
                      <div
                        className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45"
                        style={{ background: 'var(--overlay-soft)' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
              <div>
              <h4 className="heading-secondary text-base sm:text-lg text-gray-800 dark:text-white mb-6">{t('footer.quickLinks')}</h4>
              <ul className="space-y-3">
                {[
                  { href: "/", label: t('navbar.home'), available: true },
                  { href: "/about", label: t('navbar.about'), available: true },
                  { href: "/info", label: "📰 Pusat Informasi", available: true },
                  { href: "/bidang", label: "Program Kerja", available: true },
                  { href: "/gallery", label: "Galeri", available: true },
                  { href: "/our-social-media", label: t('navbar.socialMedia'), available: true }
                ].map((link, index) => (
                  <li key={index}>
                    {link.available ? (
                      <Link 
                        href={link.href} 
                        className="text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors duration-300 flex items-center group"
                      >
                        <span className="w-2 h-2 bg-yellow-400 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        {link.label}
                      </Link>
                    ) : (
                      <button
                        onClick={() => showToast(t('toast.featureNotAvailable'), 'info')}
                        className="text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors duration-300 flex items-center group w-full text-left"
                      >
                        <span className="w-2 h-2 bg-yellow-400 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        {link.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="heading-secondary text-base sm:text-lg text-gray-800 dark:text-white mb-6">{t('footer.contact')}</h4>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <FaMapMarkerAlt className="mr-3 text-yellow-400 mt-1 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    SMK Informatika Fithrah Insani<br />
                    Jl. H. Gofur No. 10 Tanimulya<br />
                    Ngamprah, Kab. Bandung Barat
                  </span>
                </li>
                <li className="flex items-center">
                  <FaPhone className="mr-3 text-yellow-400" />
                  <span className="text-gray-600 dark:text-gray-400">(022) 87805564</span>
                </li>
                <li className="flex items-center">
                  <FaEnvelope className="mr-3 text-yellow-400" />
                  <span className="text-gray-600 dark:text-gray-400">osissmkinformatika2.fi@gmail.com</span>
                </li>
              </ul>
            </div>

            {/* QR Code Share Section */}
            <div>
              <h4 className="heading-secondary text-base sm:text-lg text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <FaQrcode className="text-yellow-400" />
                Share Website
              </h4>
              
              <div className="space-y-4">
                {/* QR Code Toggle Button */}
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <FaQrcode className="text-lg" />
                  {showQR ? 'Sembunyikan QR' : 'Tampilkan QR Code'}
                </button>

                {/* QR Code Display with Animation */}
                <div 
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    showQR ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-xl border-2 border-yellow-400/20">
                    <canvas 
                      ref={qrCanvasRef}
                      className="w-full h-auto rounded-lg"
                    />
                    <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-3">
                      Scan QR Code untuk mengakses website
                    </p>
                  </div>
                </div>

                {/* Share Button */}
                <button
                  onClick={handleShareLink}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <FaShareAlt className="text-lg" />
                  Bagikan Link
                </button>

                {/* Current URL Display */}
                {currentUrl && (
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 backdrop-blur-sm">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Website URL:</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-mono break-all">
                      {currentUrl}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-300 dark:border-gray-700/50 pt-6 mt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 gap-4">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex flex-col sm:flex-row items-center text-center sm:text-left">
                <span>&copy; {new Date().getFullYear()} OSIS SMK Fithrah Insani - Raveka Sena.</span>
                <span className="flex items-center mt-1 sm:mt-0 sm:ml-2">
                  {t('footer.madeWith')} <FaHeart className="text-red-400 mx-1" /> {t('footer.forEducation')}
                </span>
              </p>
              
              <div className="flex space-x-4 sm:space-x-6 text-xs sm:text-sm">
                <button 
                  onClick={() => showToast(t('toast.featureNotAvailable'), 'info')}
                  className="text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors duration-300"
                >
                  {t('footer.privacyPolicy')}
                </button>
                <button 
                  onClick={() => showToast(t('toast.featureNotAvailable'), 'info')}
                  className="text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors duration-300"
                >
                  {t('footer.termsOfService')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;