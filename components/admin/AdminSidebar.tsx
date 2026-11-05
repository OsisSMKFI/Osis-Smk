'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  FaHome, FaNewspaper, FaCalendarAlt, FaImages, FaUsers,
  FaClipboardList, FaBullhorn, FaPoll, FaCog, FaSignOutAlt,
  FaChevronLeft, FaChevronRight, FaBars, FaEdit, FaDatabase,
  FaSitemap, FaUserFriends, FaGlobe, FaTools, FaTerminal,
  FaClipboardCheck, FaPaintBrush, FaTimes,
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
}

export default function AdminSidebar({ collapsed, setCollapsed }: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileOpen]);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const handleChange = () => {
      if (media.matches) setMobileOpen(false);
    };
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

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

  const renderItems = (items: MenuItem[]) => items.map((item) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        prefetch={false}
        onClick={() => setMobileOpen(false)}
        className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 overflow-hidden ${
          active
            ? 'bg-amber-400 text-slate-900'
            : 'text-gray-300 hover:bg-slate-700/50 hover:text-white'
        }`}
      >
        {active && <span className="absolute left-0 top-0 h-full w-1 bg-slate-900" />}
        <span className={`text-xl shrink-0 ${collapsed ? 'lg:mx-auto' : ''}`}>{item.icon}</span>
        <span className="flex-1 font-medium">{item.name}</span>
        {item.badge ? (
          <span className="px-2 py-1 text-xs font-bold bg-red-500 text-white rounded-full">
            {item.badge}
          </span>
        ) : null}
      </Link>
    );
  });

  return (
    <>
      {/* Tombol buka menu: selalu di atas konten pada layar ponsel */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-[120] flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400 text-slate-950 shadow-xl border-2 border-white"
        aria-label="Buka menu navigasi"
        aria-expanded={mobileOpen}
      >
        <FaBars className="text-xl" />
      </button>

      {/* Overlay di belakang sidebar */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Tutup menu navigasi"
          className="lg:hidden fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-[140] flex flex-col',
          'bg-slate-900 text-white shadow-2xl',
          'transition-transform duration-300 ease-in-out',
          'w-[min(18rem,85vw)]',
          'lg:w-auto',
          collapsed ? 'lg:w-20' : 'lg:w-72',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
        ].join(' ')}
        style={{ isolation: 'isolate' }}
      >
        {/* Header */}
        <div className="relative h-20 min-h-20 flex items-center justify-between px-4 sm:px-6 bg-amber-400 shadow-xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 shrink-0 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-amber-600">O</span>
            </div>
            <div className="lg:hidden">
              <h1 className="text-lg font-bold text-slate-900">OSIS Admin</h1>
              <p className="text-xs text-slate-700">Dashboard</p>
            </div>
            <div className="hidden lg:block">
              {!collapsed && (
                <>
                  <h1 className="text-lg font-bold text-slate-900">OSIS Admin</h1>
                  <p className="text-xs text-slate-700">Dashboard</p>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden relative z-[160] flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg border-2 border-white"
            aria-label="Tutup sidebar"
            title="Tutup menu"
          >
            <FaTimes className="text-xl" />
          </button>

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-8 h-8 items-center justify-center bg-white/20 rounded-lg hover:bg-white/30 text-slate-900"
            aria-label={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
          >
            {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 min-h-0 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          <Link
            href="/dashboard"
            prefetch={false}
            target="_blank"
            className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl bg-slate-700 text-white hover:bg-slate-600 shadow"
          >
            <FaGlobe className="text-xl shrink-0" />
            <span className="font-medium">View Public Website</span>
          </Link>

          <div className="border-t border-slate-700 my-3" />
          {renderItems(menuItems)}

          <div className="pt-4 pb-2 flex items-center gap-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <FaDatabase />
            <span>Data Management</span>
          </div>
          {renderItems(dataMenuItems)}

          <div className="pt-4 pb-2 flex items-center gap-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <FaCog />
            <span>System</span>
          </div>
          {renderItems(settingsItems)}
        </nav>

        {/* Footer */}
        <div className="shrink-0 p-4 bg-slate-800/80 border-t border-slate-700">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/', redirect: true })}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
          >
            <FaSignOutAlt className="text-xl" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(250, 204, 21, 0.3);
          border-radius: 10px;
        }
      `}</style>
    </>
  );
}
