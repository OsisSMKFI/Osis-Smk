'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  FaHome,
  FaNewspaper,
  FaCalendarAlt,
  FaImages,
  FaUsers,
  FaClipboardList,
  FaBullhorn,
  FaPoll,
  FaCog,
  FaSignOutAlt,
  FaChevronLeft,
  FaChevronRight,
  FaBars,
  FaEdit,
  FaDatabase,
  FaSitemap,
  FaUserFriends,
  FaGlobe,
  FaTools,
  FaTerminal,
  FaClipboardCheck,
  FaPaintBrush,
} from 'react-icons/fa';
import { Shield } from 'lucide-react';

interface MenuItem {
  name: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

interface AdminSidebarProps {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function AdminSidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}: AdminSidebarProps) {
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen, setMobileOpen]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => {
      if (mq.matches) setMobileOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [setMobileOpen]);

  const menuItems: MenuItem[] = [
    { name: 'Dashboard', icon: <FaHome />, href: '/admin' },
    { name: 'Content', icon: <FaEdit />, href: '/admin/content' },
    { name: 'Posts', icon: <FaNewspaper />, href: '/admin/posts' },
    { name: 'Events', icon: <FaCalendarAlt />, href: '/admin/events' },
    { name: 'Gallery', icon: <FaImages />, href: '/admin/gallery' },
    { name: 'Anggota (Members)', icon: <FaUserFriends />, href: '/admin/data/members' },
    { name: 'Users', icon: <FaUsers />, href: '/admin/users' },
  ];

  const dataMenuItems: MenuItem[] = [
    { name: 'Sekbid', icon: <FaSitemap />, href: '/admin/data/sekbid' },
    { name: 'Anggota (Members)', icon: <FaUserFriends />, href: '/admin/data/members' },
    { name: 'Absensi', icon: <FaClipboardCheck />, href: '/admin/attendance' },
    { name: 'Re-enrollment Requests', icon: <Shield className="w-5 h-5" />, href: '/admin/re-enrollment' },
    { name: 'Program Kerja', icon: <FaClipboardList />, href: '/admin/proker' },
    { name: 'Announcements', icon: <FaBullhorn />, href: '/admin/announcements' },
    { name: 'Polls', icon: <FaPoll />, href: '/admin/polls' },
  ];

  const settingsItems: MenuItem[] = [
    { name: 'Design Studio', icon: <FaPaintBrush />, href: '/admin/design-studio' },
    { name: 'Settings', icon: <FaCog />, href: '/admin/settings' },
    { name: 'Tools', icon: <FaTools />, href: '/admin/tools' },
    { name: 'Terminal', icon: <FaTerminal />, href: '/admin/terminal' },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Mobile toggle stays above both overlay and sidebar, so it remains clickable. */}
      <button
        type="button"
        onClick={() => setMobileOpen((previous) => !previous)}
        className="lg:hidden fixed top-4 left-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400 text-slate-900 shadow-xl border-2 border-white"
        style={{ zIndex: 70, pointerEvents: 'auto' }}
        aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
        aria-expanded={mobileOpen}
        aria-controls="admin-sidebar"
      >
        {mobileOpen ? (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <FaBars className="text-xl" />
        )}
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm"
          style={{ zIndex: 50 }}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        id="admin-sidebar"
        className={[
          'fixed top-0 left-0 h-dvh bg-slate-900',
          'text-white shadow-2xl transition-transform duration-300 ease-in-out',
          'w-72 lg:max-w-none',
          collapsed ? 'lg:w-20' : 'lg:w-72',
          'lg:translate-x-0 lg:pointer-events-auto',
          mobileOpen
            ? 'translate-x-0 pointer-events-auto'
            : '-translate-x-full pointer-events-none lg:translate-x-0 lg:pointer-events-auto',
          'max-w-[85vw]',
        ].join(' ')}
        style={{ zIndex: 60, isolation: 'isolate' }}
        suppressHydrationWarning
      >
        <div className="relative h-20 flex items-center justify-between pl-16 pr-4 sm:pr-6 lg:px-4 bg-amber-400 shadow-xl">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-amber-600">O</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">OSIS Admin</h1>
                <p className="text-xs text-slate-700">Dashboard</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden w-8 h-8 flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-all text-slate-900"
              aria-label="Close menu"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex w-8 h-8 items-center justify-center bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-all text-slate-900"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <FaChevronRight className="text-sm" /> : <FaChevronLeft className="text-sm" />}
            </button>
          </div>
        </div>

        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100dvh-160px)] custom-scrollbar">
          <Link
            href="/dashboard"
            prefetch={false}
            target="_blank"
            onClick={() => setMobileOpen(false)}
            className="group relative flex items-center space-x-3 px-4 py-3 rounded-xl bg-slate-700 text-white hover:bg-slate-600 shadow transition-all duration-200 mb-4"
          >
            <FaGlobe className={`text-xl ${collapsed ? 'mx-auto' : ''}`} />
            {!collapsed && <span className="flex-1 font-medium">View Public Website</span>}
            {collapsed && (
              <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                View Public Website
              </div>
            )}
          </Link>

          <div className="border-t border-slate-700 my-3" />

          {menuItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onClick={() => setMobileOpen(false)}
                className={`group relative flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 overflow-hidden ${
                  active
                    ? 'bg-amber-400 text-slate-900'
                    : 'hover:bg-slate-700/50 text-gray-300 hover:text-white'
                }`}
              >
                {active && <div className="absolute left-0 top-0 h-full w-1 bg-slate-900" />}
                <div className={`text-xl ${collapsed ? 'mx-auto' : ''}`}>{item.icon}</div>
                {!collapsed && (
                  <>
                    <span className="flex-1 font-medium">{item.name}</span>
                    {item.badge && (
                      <span className="px-2 py-1 text-xs font-bold bg-red-500 text-white rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}

          {!collapsed && (
            <div className="pt-4 pb-2">
              <div className="flex items-center gap-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <FaDatabase className="text-sm" />
                <span>Data Management</span>
              </div>
            </div>
          )}

          {dataMenuItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onClick={() => setMobileOpen(false)}
                className={`group relative flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 overflow-hidden ${
                  active
                    ? 'bg-amber-400 text-slate-900'
                    : 'hover:bg-slate-700/50 text-gray-300 hover:text-white'
                }`}
              >
                {active && <div className="absolute left-0 top-0 h-full w-1 bg-slate-900" />}
                <div className={`text-xl ${collapsed ? 'mx-auto' : ''}`}>{item.icon}</div>
                {!collapsed && (
                  <>
                    <span className="flex-1 font-medium">{item.name}</span>
                    {item.badge && (
                      <span className="px-2 py-1 text-xs font-bold bg-red-500 text-white rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}

          {!collapsed && (
            <div className="pt-4 pb-2">
              <div className="flex items-center gap-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <FaCog className="text-sm" />
                <span>System</span>
              </div>
            </div>
          )}

          {settingsItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onClick={() => setMobileOpen(false)}
                className={`group relative flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 overflow-hidden ${
                  active
                    ? 'bg-amber-400 text-slate-900'
                    : 'hover:bg-slate-700/50 text-gray-300 hover:text-white'
                }`}
              >
                {active && <div className="absolute left-0 top-0 h-full w-1 bg-slate-900" />}
                <div className={`text-xl ${collapsed ? 'mx-auto' : ''}`}>{item.icon}</div>
                {!collapsed && <span className="flex-1 font-medium">{item.name}</span>}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-800/50 backdrop-blur-sm border-t border-slate-700">
          <button
            onClick={() => signOut({ callbackUrl: '/', redirect: true })}
            className={`group w-full flex items-center space-x-3 px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all duration-200 ${
              collapsed ? 'justify-center' : ''
            }`}
            suppressHydrationWarning
          >
            <FaSignOutAlt className="text-xl" />
            {!collapsed && <span className="font-medium">Logout</span>}
            {collapsed && (
              <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Logout
              </div>
            )}
          </button>
        </div>
      </aside>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(250, 204, 21, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(250, 204, 21, 0.5);
        }
      `}</style>
    </>
  );
}
