'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { apiFetch, safeJson } from '@/lib/safeFetch';
import { FaBell, FaUser, FaChevronDown, FaMoon, FaSun, FaSearch, FaReply, FaCheck, FaExternalLinkAlt, FaExclamationTriangle, FaInbox, FaComment, FaTimesCircle, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageToggle from '@/components/LanguageToggle';
import RoleBadge from '@/components/RoleBadge';
import Image from 'next/image';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface Notification {
  id: string;
  type: string;
  target: string;
  title: string;
  message: string;
  sender_name?: string;
  session_id?: string;
  is_urgent?: boolean;
  read: boolean;
  link?: string;
  action?: string;
  status: string;
  payload?: {
    message?: string;
    sender?: string;
    urgent?: boolean;
  };
  created_at: string;
}

export default function AdminHeader() {
  const { data: session } = useSession();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const notifFetchRef = useRef(false);

  const fetchNotifications = useCallback(async () => {
    if (notifFetchRef.current) return;
    notifFetchRef.current = true;
    setLoadingNotifs(true);
    try {
      const res = await apiFetch('/api/admin/notifications', { credentials: 'include' } as any);
      if (!res.ok) return;
      const j = await safeJson(res, { url: '/api/admin/notifications', method: 'GET' }).catch(() => ({}));
      // Support both formats
      const notifList = j?.notifications || j?.actions || [];
      if (Array.isArray(notifList)) {
        setNotifications(notifList);
      }
    } catch (e) {
      // ignore
    } finally {
      notifFetchRef.current = false;
      setLoadingNotifs(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const iv = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(iv);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read && n.status !== 'reviewed').length;

  // Mark notification as read
  const markAsRead = async (notifId: string) => {
    try {
      await apiFetch(`/api/admin/notifications?id=${notifId}`, {
        method: 'PUT',
        credentials: 'include',
      } as any);
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true, status: 'reviewed' } : n));
    } catch (e) {
      console.error('Failed to mark as read:', e);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await apiFetch('/api/admin/notifications?markAllRead=true', {
        method: 'PUT',
        credentials: 'include',
      } as any);
      setNotifications(prev => prev.map(n => ({ ...n, read: true, status: 'reviewed' })));
    } catch (e) {
      console.error('Failed to mark all as read:', e);
    }
  };

  // Handle reply to user message
  const handleReply = (notif: Notification) => {
    setSelectedNotif(notif);
    setReplyText('');
    setShowReplyModal(true);
    setShowNotifications(false);
  };

  // Send reply
  const sendReply = async () => {
    if (!selectedNotif || !replyText.trim()) return;
    setSendingReply(true);
    try {
      // Store reply in database and mark original as read
      await apiFetch('/api/admin/notifications/reply', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalNotifId: selectedNotif.id,
          sessionId: selectedNotif.session_id,
          message: replyText,
          senderName: session?.user?.name || 'Admin',
        }),
      } as any);
      
      // Mark as read
      await markAsRead(selectedNotif.id);
      
      setShowReplyModal(false);
      setSelectedNotif(null);
      setReplyText('');
      
      // Refresh notifications
      fetchNotifications();
    } catch (e) {
      console.error('Failed to send reply:', e);
    } finally {
      setSendingReply(false);
    }
  };

  // Navigate to link
  const handleNavigate = (notif: Notification) => {
    if (notif.link) {
      markAsRead(notif.id);
      window.location.href = notif.link;
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/', redirect: true });
  };

  // User display data from session
  const userName = session?.user?.name || 'Admin';
  const userEmail = session?.user?.email || 'admin@osis.com';
  const userRole = session?.user?.role || 'User';
  const userPhoto = session?.user?.image || '';
  const userInitial = userName.charAt(0).toUpperCase();

  // Get notification icon based on type
  const getNotifIcon = (notif: Notification) => {
    if (notif.type === 'user_message') return <FaComment className="text-base text-amber-500" />;
    if (notif.is_urgent) return <FaExclamationTriangle className="text-base text-red-500" />;
    if (notif.type === 'error') return <FaTimesCircle className="text-base text-red-500" />;
    if (notif.type === 'warning') return <FaExclamationCircle className="text-base text-amber-500" />;
    if (notif.type === 'success') return <FaCheckCircle className="text-base text-emerald-500" />;
    return <FaBell className="text-base text-slate-500" />;
  };

  return (
    <>
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-800 shadow-md border-b border-gray-200 dark:border-slate-700" suppressHydrationWarning>
      <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 md:py-4 ml-12 lg:ml-0">
        {/* Search Bar - hide on mobile */}
        <div className="hidden sm:block flex-1 max-w-xs md:max-w-md lg:max-w-xl">
          <div className="relative">
            <FaSearch className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-9 md:pl-12 pr-3 md:pr-4 py-2 md:py-3 rounded-xl border text-sm focus:outline-none transition-all"
              style={{
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                borderColor: 'var(--input-border)',
              }}
              suppressHydrationWarning
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 ml-auto">
          {/* Global Language Toggle - hide on small mobile */}
          <div className="hidden xs:block">
            <LanguageToggle />
          </div>

          {/* Global Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 md:p-3 rounded-xl bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-all"
            >
              <FaBell className="text-gray-600 dark:text-gray-300 text-lg md:text-xl" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-red-500 text-white text-[10px] md:text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden z-50">
                <div className="p-3 md:p-4 bg-slate-900 text-white flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-base md:text-lg">Notifications</h3>
                    <p className="text-xs md:text-sm opacity-80">{unreadCount} unread</p>
                  </div>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg transition-all flex items-center gap-1"
                    >
                      <FaCheck className="text-[10px]" /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 md:max-h-[400px] overflow-y-auto">
                  {loadingNotifs && (
                    <div className="p-6 text-center">
                      <div className="animate-spin w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-sm text-gray-500">Loading...</p>
                    </div>
                  )}
                  {!loadingNotifs && notifications.length === 0 && (
                    <div className="p-8 text-center">
                      <FaInbox className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">When users send messages, they'll appear here</p>
                    </div>
                  )}
                  {!loadingNotifs && notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 md:p-4 border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all ${
                        !notif.read ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''
                      } ${notif.is_urgent ? 'border-l-4 border-l-red-500' : ''}`}
                    >
                      {/* Notification Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 dark:bg-slate-700">{getNotifIcon(notif)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                              {notif.title || notif.action}
                            </p>
                            {notif.sender_name && notif.type === 'user_message' && (
                              <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                                From: {notif.sender_name}
                              </p>
                            )}
                          </div>
                        </div>
                        {!notif.read && (
                          <span className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      
                      {/* Message Content */}
                      <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                        {notif.message || notif.payload?.message || ''}
                      </p>
                      
                      {/* Timestamp */}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        {new Date(notif.created_at).toLocaleString('id-ID', { 
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
                        })}
                      </p>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-2">
                        {/* Reply button for user messages */}
                        {notif.type === 'user_message' && (
                          <button
                            onClick={() => handleReply(notif)}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition-all"
                          >
                            <FaReply className="text-[10px]" /> Reply
                          </button>
                        )}
                        
                        {/* Link button if has link */}
                        {notif.link && (
                          <button
                            onClick={() => handleNavigate(notif)}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all"
                          >
                            <FaExternalLinkAlt className="text-[10px]" /> View
                          </button>
                        )}
                        
                        {/* Mark as read button */}
                        {!notif.read && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all"
                          >
                            <FaCheck className="text-[10px]" /> Read
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-gray-50 dark:bg-slate-700 text-center border-t border-gray-200 dark:border-slate-600">
                  <a href="/admin/notifications" className="text-sm text-yellow-600 dark:text-yellow-400 font-medium hover:underline">
                    View all notifications →
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center space-x-3 p-2 pr-4 rounded-xl bg-amber-400 hover:bg-amber-500 transition-colors shadow-md"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-inner text-xl font-bold overflow-hidden" style={{ background: 'var(--card-bg)', border: `1px solid var(--card-border)` }}>
                {userPhoto ? (
                  <Image
                    src={userPhoto}
                    alt={userName}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  userInitial
                )}
              </div>
              <div className="text-left hidden sm:block">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-900">{userName}</p>
                  <RoleBadge role={userRole} size="sm" showLabel={false} />
                </div>
                <p className="text-xs text-slate-700">{userRole} · {language.toUpperCase()} · {theme === 'dark' ? 'Dark' : 'Light'}</p>
              </div>
              <FaChevronDown className="text-slate-900 text-sm" />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfile && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-2xl overflow-hidden" style={{ background: 'var(--surface-alt)', border: `1px solid var(--border)` }}>
                <div className="p-4 bg-amber-400">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-slate-900">{userName}</p>
                    <RoleBadge role={userRole} size="sm" />
                  </div>
                  <p className="text-sm text-slate-700">{userEmail}</p>
                </div>
                <div className="p-2">
                  <a
                    href="/admin/profile"
                    className="block px-4 py-2 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-slate-700"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    My Profile
                  </a>
                  <a
                    href="/admin/settings"
                    className="block px-4 py-2 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-slate-700"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Settings
                  </a>
                  <hr className="my-2" style={{ borderColor: 'var(--border-alt)' }} />
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>

    {/* Reply Modal */}
    {showReplyModal && selectedNotif && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
          {/* Modal Header */}
          <div className="p-4 bg-slate-900 text-white">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <FaReply /> Reply to Message
            </h3>
            <p className="text-sm opacity-80">
              Replying to: {selectedNotif.sender_name || 'User'}
            </p>
          </div>

          {/* Original Message */}
          <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Original message:</p>
            <p className="text-sm text-gray-800 dark:text-white italic">
              "{selectedNotif.message || selectedNotif.payload?.message}"
            </p>
          </div>

          {/* Reply Input */}
          <div className="p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Reply:
            </label>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply here..."
              className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all resize-none"
              rows={4}
              autoFocus
            />
            <p className="text-xs text-gray-400 mt-1">
              This reply will be stored and associated with the user's session.
            </p>
          </div>

          {/* Modal Actions */}
          <div className="p-4 bg-gray-50 dark:bg-slate-700 flex justify-end gap-3">
            <button
              onClick={() => {
                setShowReplyModal(false);
                setSelectedNotif(null);
                setReplyText('');
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              onClick={sendReply}
              disabled={!replyText.trim() || sendingReply}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-500 disabled:bg-gray-400 text-slate-900 rounded-lg transition-all flex items-center gap-2"
            >
              {sendingReply ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full"></div>
                  Sending...
                </>
              ) : (
                <>
                  <FaReply /> Send Reply
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
