
'use client';

import React, { useEffect, useState } from 'react';
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
}

export default function AdminSidebar({
  collapsed,
  setCollapsed,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close sidebar after navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent background scrolling when mobile sidebar is open
  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  // Close sidebar with Escape key
  useEffect(() => {
    if (!mobileOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [mobileOpen]);

  // Close mobile menu when switching to desktop
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');

    const handleResize = () => {
      if (mediaQuery.matches) {
        setMobileOpen(false);
      }
    };

    mediaQuery.addEventListener('change', handleResize);

    return () => {
      mediaQuery.removeEventListener('change', handleResize);
    };
  }, []);

  const menuItems: MenuItem[] = [
    { name: 'Dashboard', icon: <FaHome />, href: '/admin' },
    { name: 'Content', icon: <FaEdit />, href: '/admin/content' },
    { name: 'Posts', icon: <FaNewspaper />, href: '/admin/posts' },
    { name: 'Events', icon: <FaCalendarAlt />, href: '/admin/events' },
    { name: 'Gallery', icon: <FaImages />, href: '/admin/gallery' },
    {
      name: 'Anggota (Members)',
      icon: <FaUserFriends />,
      href: '/admin/data/members',
    },
    { name: 'Users', icon: <FaUsers />, href: '/admin/users' },
  ];

  const dataMenuItems: MenuItem[] = [
    { name: 'Sekbid', icon: <FaSitemap />, href: '/admin/data/sekbid' },
    {
      name: 'Anggota (Members)',
      icon: <FaUserFriends />,
      href: '/admin/data/members',
    },
    {
      name: 'Absensi',
      icon: <FaClipboardCheck />,
      href: '/admin/attendance',
    },
    {
      name: 'Re-enrollment Requests',
      icon: <Shield className="w-5 h-5" />,
      href: '/admin/re-enrollment',
    },
    {
      name: 'Program Kerja',
      icon: <FaClipboardList />,
      href: '/admin/proker',
    },
    {
      name: 'Announcements',
      icon: <FaBullhorn />,
      href: '/admin/announcements',
    },
    { name: 'Polls', icon: <FaPoll />, href: '/admin/polls' },
  ];

  const settingsItems: MenuItem[] = [
    {
      name: 'Design Studio',
      icon: <FaPaintBrush />,
      href: '/admin/design-studio',
    },
    { name: 'Settings', icon: <FaCog />, href: '/admin/settings' },
    { name: 'Tools', icon: <FaTools />, href: '/admin/tools' },
    { name: 'Terminal', icon: <FaTerminal />, href: '/admin/terminal' },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }

    return pathname?.startsWith(href);
  };

  const renderMenuItems = (items: MenuItem[]) =>
    items.map((item) => {
      const active = isActive(item.href);

      return (
        <Link
          key={item.href}
          href={item.href}
          prefetch={false}
          onClick={() => setMobileOpen(false)}
          className={`
            group relative flex items-center gap-3
            px-4 py-3 rounded-xl
            transition-all duration-200
            overflow-hidden
            ${
              active
                ? 'bg-amber-400 text-slate-900'
                : 'text-gray-300 hover:bg-slate-700/50 hover:text-white'
            }
          `}
        >
          {active && (
            <div className="absolute left-0 top-0 h-full w-1 bg-slate-900" />
          )}

          <div className="text-xl flex-shrink-0">
            {item.icon}
          </div>

          <span className="flex-1 font-medium text-sm sm:text-base">
            {item.name}
          </span>

          {item.badge !== undefined && item.badge > 0 && (
            <span className="px-2 py-1 text-xs font-bold bg-red-500 text-white rounded-full">
              {item.badge}
            </span>
          )}
        </Link>
      );
    });

  return (
    <>
      {/* MOBILE MENU TOGGLE */}
      <button
        type="button"
        onClick={() => setMobileOpen((previous) => !previous)}
        className="
          lg:hidden fixed top-4 left-4
          w-12 h-12
          flex items-center justify-center
          rounded-xl
          bg-amber-400 text-slate-900
          shadow-xl
          hover:bg-amber-500
          active:scale-95
          transition-all duration-200
        "
        style={{
          zIndex: 130,
          pointerEvents: 'auto',
        }}
        aria-label={mobileOpen ? 'Close sidebar' : 'Open sidebar'}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <FaBars className="text-xl" />
        )}
      </button>

      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="
            lg:hidden fixed inset-0
            bg-black/60 backdrop-blur-sm
          "
          style={{ zIndex: 110 }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed top-0 left-0
          h-[100dvh]
          flex flex-col
          bg-slate-900 text-white
          shadow-2xl
          transition-transform duration-300 ease-in-out

          w-[min(18rem,85vw)]

          ${
            mobileOpen
              ? 'translate-x-0 pointer-events-auto'
              : '-translate-x-full pointer-events-none'
          }

          lg:translate-x-0 lg:pointer-events-auto
          ${collapsed ? 'lg:w-20' : 'lg:w-72'}

        `}
        style={{
          zIndex: 115,
          isolation: 'isolate',
        }}
      >
        {/* SIDEBAR HEADER */}
        <div
          className="
            relative flex-shrink-0
            h-20
            flex items-center justify-between
            pl-16 pr-4 lg:px-4
            bg-amber-400
            shadow-xl
          "
        >
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="
                w-10 h-10
                bg-white rounded-xl
                flex items-center justify-center
                shadow-lg
              ">
                <span className="text-2xl font-bold text-amber-600">
                  O
                </span>
              </div>

              <div>
                <h1 className="text-lg font-bold text-slate-900">
                  OSIS Admin
                </h1>

                <p className="text-xs text-slate-700">
                  Dashboard
                </p>
              </div>
            </div>
          )}

          {/* DESKTOP COLLAPSE BUTTON */}
          <button
            type="button"
            onClick={() => setCollapsed((previous) => !previous)}
            className="
              hidden lg:flex
              w-9 h-9
              items-center justify-center
              rounded-lg
              bg-white/20
              hover:bg-white/40
              text-slate-900
              transition-all
            "
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <FaChevronRight />
            ) : (
              <FaChevronLeft />
            )}
          </button>
        </div>

        {/* NAVIGATION */}
        <nav
          className="
            flex-1 min-h-0
            p-4 space-y-2
            overflow-y-auto
            custom-scrollbar
          "
        >
          {/* PUBLIC WEBSITE */}
          <Link
            href="/dashboard"
            prefetch={false}
            target="_blank"
            onClick={() => setMobileOpen(false)}
            className="
              flex items-center gap-3
              px-4 py-3
              rounded-xl
              bg-slate-700
              text-white
              hover:bg-slate-600
              shadow
              transition-all
              mb-4
            "
          >
            <FaGlobe className="text-xl flex-shrink-0" />

            <span className="font-medium">
              View Public Website
            </span>
          </Link>

          <div className="border-t border-slate-700 my-3" />

          {/* MAIN MENU */}
          {renderMenuItems(menuItems)}

          {/* DATA MANAGEMENT */}
          <div className="pt-5 pb-2">
            <div className="flex items-center gap-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <FaDatabase className="text-sm" />
              <span>Data Management</span>
            </div>
          </div>

          {renderMenuItems(dataMenuItems)}

          {/* SYSTEM */}
          <div className="pt-5 pb-2">
            <div className="flex items-center gap-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <FaCog className="text-sm" />
              <span>System</span>
            </div>
          </div>

          {renderMenuItems(settingsItems)}
        </nav>

        {/* SIDEBAR FOOTER */}
        <div className="
          flex-shrink-0
          p-4
          bg-slate-800/80
          border-t border-slate-700
        ">
          <button
            type="button"
            onClick={() => {
              signOut({
                callbackUrl: '/',
                redirect: true,
              });
            }}
            className="
              w-full
              flex items-center gap-3
              px-4 py-3
              rounded-xl
              bg-red-500/10
              text-red-400
              hover:bg-red-500
              hover:text-white
              transition-all duration-200
            "
          >
            <FaSignOutAlt className="text-xl flex-shrink-0" />

            <span className="font-medium">
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* CUSTOM SCROLLBAR */}
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
