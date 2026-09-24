'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FaHeart, FaComment, FaShare, FaQrcode, FaLink, FaWhatsapp, FaFacebook, FaTwitter, FaTimes, FaEye } from 'react-icons/fa';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/contexts/ToastContext';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { cachedGetJson } from '@/lib/clientCache';

const CommentSectionEnhanced = dynamic(() => import('./CommentSectionEnhanced'), { ssr: false });

// Generate a simple fingerprint for anonymous users
function getFingerprint(): string {
  if (typeof window === 'undefined') return 'ssr';
  const nav = window.navigator;
  const screen = window.screen;
  const data = [
    nav.userAgent,
    nav.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset()
  ].join('|');
  // Simple hash
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'fp_' + Math.abs(hash).toString(36);
}

interface ContentInteractionsProps {
  contentId: string;
  contentType: 'post' | 'event' | 'poll' | 'announcement' | 'news';
  contentTitle: string;
  contentUrl: string;
  initialLikes?: number;
  initialComments?: number;
  isLiked?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  className?: string;
  /** list = skip stats/view fetch (card lists); detail = full tracking (default) */
  mode?: 'list' | 'detail';
}

const VIEW_COOLDOWN_MS = 60_000;
const STATS_TTL_MS = 60_000;

function canTrackView(contentId: string): boolean {
  try {
    const key = `osis:viewed:${contentId}`;
    const last = Number(sessionStorage.getItem(key) || 0);
    if (Date.now() - last < VIEW_COOLDOWN_MS) return false;
    sessionStorage.setItem(key, String(Date.now()));
    return true;
  } catch {
    return true;
  }
}

export default function ContentInteractions({
  contentId,
  contentType,
  contentTitle,
  contentUrl,
  initialLikes = 0,
  initialComments = 0,
  isLiked = false,
  onLike,
  onComment,
  className = '',
  mode = 'detail'
}: ContentInteractionsProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { data: session } = useSession();
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const [liked, setLiked] = useState(isLiked);
  const [likes, setLikes] = useState(initialLikes);
  const [views, setViews] = useState(0);
  const [comments, setComments] = useState(initialComments);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [fullUrl, setFullUrl] = useState('');
  const [statsLoaded, setStatsLoaded] = useState(mode === 'list');
  const [liking, setLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const commentSectionRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const viewTracked = useRef(false);

  // Detail only: fetch stats (cached 60s) + track view (60s cooldown) off critical path
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setFullUrl(window.location.origin + contentUrl);
    if (mode === 'list') return;

    let cancelled = false;
    const run = async () => {
      if (cancelled || viewTracked.current) return;
      viewTracked.current = true;
      try {
        const userId = (sessionRef.current?.user as any)?.id || '';
        const data = await cachedGetJson<{
          stats?: { likes: number; views: number; comments: number; isLiked: boolean };
        }>(`/api/interactions?contentId=${contentId}&contentType=${contentType}&userId=${userId}`, {
          ttlMs: STATS_TTL_MS,
          persist: false
        });
        if (data.stats && !cancelled) {
          setLikes(data.stats.likes);
          setViews(data.stats.views);
          setComments(data.stats.comments);
          setLiked(data.stats.isLiked);
        }
      } catch (error) {
        console.error('[ContentInteractions] Failed to fetch stats:', error);
      } finally {
        if (!cancelled) setStatsLoaded(true);
      }
      if (!canTrackView(contentId)) return;
      try {
        const fingerprint = getFingerprint();
        const userId = (sessionRef.current?.user as any)?.id || null;
        await fetch('/api/interactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentId,
            contentType,
            action: 'view',
            userId,
            fingerprint
          })
        });
      } catch (error) {
        console.error('[ContentInteractions] Failed to track view:', error);
      }
    };

    const idle = (cb: () => void) => {
      if (typeof requestIdleCallback === 'function') requestIdleCallback(cb, { timeout: 4000 });
      else setTimeout(cb, 1200);
    };
    idle(() => { void run(); });

    return () => { cancelled = true; };
  }, [contentUrl, contentId, contentType, mode]);

  // Generate QR Code when modal opens (lazy-load qrcode lib)
  useEffect(() => {
    if (!showQRModal || !qrCanvasRef.current || !fullUrl) return;
    let cancelled = false;
    import('qrcode').then((QRCode) => {
      if (cancelled || !qrCanvasRef.current) return;
      QRCode.toCanvas(qrCanvasRef.current, fullUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).catch((err: Error) => {
        console.error('QR Code generation error:', err);
      });
    });
    return () => { cancelled = true; };
  }, [showQRModal, fullUrl]);

  const handleLike = async () => {
    const userId = (session?.user as any)?.id;
    
    if (!userId) {
      showToast('Login untuk menyukai konten', 'warning');
      return;
    }

    if (liking) return;
    setLiking(true);

    // Optimistic update
    const wasLiked = liked;
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);

    try {
      const res = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          contentType,
          action: 'like',
          userId
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLikes(data.likes);
        setLiked(data.liked);
        showToast(data.liked ? 'Konten disukai!' : 'Like dibatalkan', 'success');
      } else {
        // Revert on error
        setLiked(wasLiked);
        setLikes(wasLiked ? likes : likes - 1);
        showToast('Gagal menyukai konten', 'error');
      }
    } catch (error) {
      // Revert on error
      setLiked(wasLiked);
      setLikes(wasLiked ? likes : likes - 1);
      console.error('[ContentInteractions] Like error:', error);
    } finally {
      setLiking(false);
    }
    
    onLike?.();
  };

  const handleComment = () => {
    onComment?.();
    setShowComments(true);
    // Scroll to comment section and trigger open
    if (commentSectionRef.current) {
      commentSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Trigger click on toggle button after scroll
      setTimeout(() => {
        const toggleButton = commentSectionRef.current?.querySelector('button');
        if (toggleButton) {
          toggleButton.click();
        }
      }, 500);
    }
  };

  const handleShareClick = () => {
    setShowShareModal(true);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: contentTitle,
          text: `Lihat ${contentType}: ${contentTitle}`,
          url: fullUrl
        });
        showToast('Berhasil dibagikan!', 'success');
        setShowShareModal(false);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share error:', err);
        }
      }
    } else {
      showToast('Browser tidak mendukung fitur share', 'warning');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl).then(() => {
      showToast('Link disalin ke clipboard!', 'success');
      setShowShareModal(false);
    }).catch(() => {
      showToast('Gagal menyalin link', 'error');
    });
  };

  const handleShareVia = (platform: string) => {
    let shareUrl = '';
    const encodedUrl = encodeURIComponent(fullUrl);
    const encodedTitle = encodeURIComponent(contentTitle);

    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      showToast(`Dibagikan via ${platform}!`, 'success');
      setShowShareModal(false);
    }
  };

  const handleShowQR = () => {
    setShowShareModal(false);
    setShowQRModal(true);
  };

  return (
    <>
      {/* Interaction Buttons */}
      <div className={`flex items-center gap-4 sm:gap-6 ${className}`}>
        {/* Views Counter — detail only (list skips stats fetch) */}
        {mode === 'detail' && (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <FaEye className="text-lg sm:text-xl" />
            <span className="text-sm sm:text-base">
              {statsLoaded ? views : '...'}
            </span>
          </div>
        )}

        {/* Like Button */}
        <button
          onClick={handleLike}
          disabled={liking}
          className={`flex items-center gap-2 transition-all duration-300 group ${
            liked 
              ? 'text-red-500' 
              : 'text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-500'
          } ${liking ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label={liked ? 'Unlike' : 'Like'}
        >
          <FaHeart 
            className={`text-xl sm:text-2xl transition-transform duration-300 ${
              liked ? 'scale-110' : 'group-hover:scale-110'
            }`}
          />
          <span className="text-sm sm:text-base font-semibold">
            {likes > 0 ? likes : ''}
          </span>
        </button>

        {/* Comment Button */}
        <button
          onClick={handleComment}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-all duration-300 group"
          aria-label="Comment"
        >
          <FaComment className="text-xl sm:text-2xl group-hover:scale-110 transition-transform duration-300" />
          <span className="text-sm sm:text-base font-semibold">
            {comments > 0 ? comments : ''}
          </span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShareClick}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 transition-all duration-300 group"
          aria-label="Share"
        >
          <FaShare className="text-xl sm:text-2xl group-hover:scale-110 transition-transform duration-300" />
          <span className="text-sm sm:text-base font-semibold">Share</span>
        </button>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
          onClick={() => setShowShareModal(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Bagikan Konten
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <FaTimes className="text-2xl" />
              </button>
            </div>

            {/* Share Options */}
            <div className="space-y-3">
              {/* Native Share (Mobile) */}
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={handleNativeShare}
                  className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  <FaShare className="text-xl" />
                  <span className="font-semibold">Bagikan</span>
                </button>
              )}

              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                <FaLink className="text-xl" />
                <span className="font-semibold">Salin Link</span>
              </button>

              {/* Show QR Code */}
              <button
                onClick={handleShowQR}
                className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                <FaQrcode className="text-xl" />
                <span className="font-semibold">Tampilkan QR Code</span>
              </button>

              {/* Divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    Bagikan via
                  </span>
                </div>
              </div>

              {/* Social Media Share */}
              <div className="grid grid-cols-3 gap-3">
                {/* WhatsApp */}
                <button
                  onClick={() => handleShareVia('whatsapp')}
                  className="flex flex-col items-center gap-2 p-4 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  <FaWhatsapp className="text-2xl" />
                  <span className="text-xs font-semibold">WhatsApp</span>
                </button>

                {/* Facebook */}
                <button
                  onClick={() => handleShareVia('facebook')}
                  className="flex flex-col items-center gap-2 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  <FaFacebook className="text-2xl" />
                  <span className="text-xs font-semibold">Facebook</span>
                </button>

                {/* Twitter */}
                <button
                  onClick={() => handleShareVia('twitter')}
                  className="flex flex-col items-center gap-2 p-4 bg-sky-500 hover:bg-sky-600 text-white rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  <FaTwitter className="text-2xl" />
                  <span className="text-xs font-semibold">Twitter</span>
                </button>
              </div>
            </div>

            {/* URL Preview */}
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">URL:</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 font-mono break-all">
                {fullUrl}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
          onClick={() => setShowQRModal(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl max-w-sm w-full p-4 sm:p-6 transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FaQrcode className="text-yellow-500" />
                QR Code
              </h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <FaTimes className="text-2xl" />
              </button>
            </div>

            {/* QR Code */}
            <div className="bg-white p-6 rounded-xl shadow-lg border-4 border-yellow-400/20 mb-4">
              <canvas 
                ref={qrCanvasRef}
                className="w-full h-auto"
              />
            </div>

            {/* Instructions */}
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Scan QR Code ini untuk mengakses konten
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {contentTitle}
              </p>
            </div>

            {/* Back Button */}
            <button
              onClick={() => {
                setShowQRModal(false);
                setShowShareModal(true);
              }}
              className="w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Kembali ke Opsi Share
            </button>
          </div>
        </div>
      )}

      {/* Comment Section — mount only when user opens comments */}
      <div ref={commentSectionRef}>
        {showComments && (
          <CommentSectionEnhanced
            contentId={contentId}
            contentType={contentType}
            onCommentCountChange={setComments}
          />
        )}
      </div>
    </>
  );
}
