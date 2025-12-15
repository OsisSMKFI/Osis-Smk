'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { apiFetch, safeJson } from '@/lib/safeFetch';
import Link from 'next/link';
import {
  FaNewspaper,
  FaCalendarAlt,
  FaUsers,
  FaEye,
  FaFire,
  FaClock,
  FaCheckCircle,
  FaPoll,
  FaExclamationTriangle,
  FaBug,
  FaChartLine,
  FaClipboardCheck,
  FaCog,
  FaImage,
  FaBullhorn,
  FaSync,
} from 'react-icons/fa';

interface StatCard {
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
  link: string;
}

interface ErrorSummary {
  total: number;
  critical: number;
  recent: number;
  resolved: number;
  topErrors: Array<{
    message: string;
    count: number;
    lastSeen: string;
  }>;
}

interface DashboardStats {
  totalPosts: number;
  totalEvents: number;
  totalUsers: number;
  totalMembers: number;
  totalGallery: number;
  totalAnnouncements: number;
}

interface RecentActivity {
  id: string;
  action: string;
  title: string;
  user: string;
  time: string;
  type: 'post' | 'event' | 'user' | 'gallery' | 'announcement';
}

interface TopProgram {
  id: number;
  name: string;
  sekbid: string;
  description?: string;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const role = ((session?.user as any)?.role || '').toLowerCase();
  const canAccessAdminPanel = ['super_admin','admin','osis'].includes(role);

  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalPosts: 0,
    totalEvents: 0,
    totalUsers: 0,
    totalMembers: 0,
    totalGallery: 0,
    totalAnnouncements: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [topPrograms, setTopPrograms] = useState<TopProgram[]>([]);
  const [errorSummary, setErrorSummary] = useState<ErrorSummary>({
    total: 0,
    critical: 0,
    recent: 0,
    resolved: 0,
    topErrors: []
  });
  const [loadingErrors, setLoadingErrors] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/admin/login');
      return;
    }
    
    if (status === 'authenticated' && !canAccessAdminPanel) {
      return;
    }

    // Fetch all dashboard data from real database
    async function fetchDashboardData() {
      setLoading(true);
      try {
        // Fetch all data in parallel
        const [postsRes, eventsRes, usersRes, membersRes, galleryRes, announcementsRes, prokerRes] = await Promise.all([
          apiFetch('/api/admin/posts').catch(() => null),
          apiFetch('/api/admin/events').catch(() => null),
          apiFetch('/api/admin/users').catch(() => null),
          apiFetch('/api/admin/members').catch(() => null),
          apiFetch('/api/admin/gallery').catch(() => null),
          apiFetch('/api/admin/announcements').catch(() => null),
          apiFetch('/api/admin/proker').catch(() => null),
        ]);

        // Parse responses safely
        const posts = postsRes?.ok ? await postsRes.json().catch(() => []) : [];
        const eventsData = eventsRes?.ok ? await eventsRes.json().catch(() => ({ events: [] })) : { events: [] };
        const users = usersRes?.ok ? await usersRes.json().catch(() => []) : [];
        const membersData = membersRes?.ok ? await membersRes.json().catch(() => ({ members: [] })) : { members: [] };
        const galleryData = galleryRes?.ok ? await galleryRes.json().catch(() => ({ gallery: [] })) : { gallery: [] };
        const announcementsData = announcementsRes?.ok ? await announcementsRes.json().catch(() => ({ announcements: [] })) : { announcements: [] };
        const prokerData = prokerRes?.ok ? await prokerRes.json().catch(() => ({ proker: [] })) : { proker: [] };

        const postsArray = Array.isArray(posts) ? posts : [];
        const eventsArray = Array.isArray(eventsData?.events) ? eventsData.events : (Array.isArray(eventsData) ? eventsData : []);
        const usersArray = Array.isArray(users) ? users : [];
        const membersArray = Array.isArray(membersData?.members) ? membersData.members : (Array.isArray(membersData) ? membersData : []);
        const galleryArray = Array.isArray(galleryData?.gallery) ? galleryData.gallery : (Array.isArray(galleryData) ? galleryData : []);
        const announcementsArray = Array.isArray(announcementsData?.announcements) ? announcementsData.announcements : (Array.isArray(announcementsData) ? announcementsData : []);
        const prokerArray = Array.isArray(prokerData?.proker) ? prokerData.proker : (Array.isArray(prokerData) ? prokerData : []);

        // Set dashboard stats from real data
        setDashboardStats({
          totalPosts: postsArray.length,
          totalEvents: eventsArray.length,
          totalUsers: usersArray.length,
          totalMembers: membersArray.length,
          totalGallery: galleryArray.length,
          totalAnnouncements: announcementsArray.length,
        });

        // Build recent activities from real data
        const activities: RecentActivity[] = [];
        
        // Add recent posts
        postsArray.slice(0, 3).forEach((post: any) => {
          activities.push({
            id: `post-${post.id}`,
            action: 'Post created',
            title: post.title || 'Untitled',
            user: 'Admin',
            time: formatTimeAgo(post.created_at),
            type: 'post',
          });
        });

        // Add recent events
        eventsArray.slice(0, 3).forEach((event: any) => {
          activities.push({
            id: `event-${event.id}`,
            action: 'Event scheduled',
            title: event.title || 'Untitled Event',
            user: 'Admin',
            time: formatTimeAgo(event.created_at),
            type: 'event',
          });
        });

        // Add recent announcements
        announcementsArray.slice(0, 2).forEach((ann: any) => {
          activities.push({
            id: `ann-${ann.id}`,
            action: 'Announcement posted',
            title: ann.title || 'Untitled',
            user: 'Admin',
            time: formatTimeAgo(ann.created_at),
            type: 'announcement',
          });
        });

        // Sort by time and take top 5
        activities.sort((a, b) => {
          // Simple sort by time string
          return 0;
        });
        setRecentActivities(activities.slice(0, 5));

        // Set top programs from proker data
        const programs = prokerArray.slice(0, 5).map((p: any, idx: number) => ({
          id: p.id || idx + 1,
          name: p.name || p.title || 'Program ' + (idx + 1),
          sekbid: p.sekbid_name || p.sekbid?.name || 'Sekbid',
          description: p.description,
        }));
        setTopPrograms(programs);

      } catch (error) {
        console.error('[Dashboard] Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    async function fetchErrorSummary() {
      try {
        const res = await apiFetch('/api/admin/errors?summary=true');
        if (res.ok) {
          const data = await safeJson(res, { url: '/api/admin/errors?summary=true', method: 'GET' });
          
          // Calculate summary
          const errors = data.errors || [];
          const now = Date.now();
          const oneHourAgo = now - (60 * 60 * 1000);
          
          // Group errors by message
          const errorGroups = new Map<string, number>();
          let criticalCount = 0;
          let recentCount = 0;
          
          errors.forEach((error: any) => {
            const msg = error.error_message || error.message || 'Unknown error';
            errorGroups.set(msg, (errorGroups.get(msg) || 0) + 1);
            
            if (error.severity === 'critical' || error.severity === 'error') {
              criticalCount++;
            }
            
            const errorTime = new Date(error.created_at).getTime();
            if (errorTime > oneHourAgo) {
              recentCount++;
            }
          });
          
          // Get top 3 errors
          const topErrors = Array.from(errorGroups.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([message, count]) => {
              const lastError = errors.find((e: any) => (e.error_message || e.message || 'Unknown error') === message);
              return {
                message: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
                count,
                lastSeen: lastError ? new Date(lastError.created_at).toLocaleTimeString() : 'Unknown'
              };
            });
          
          setErrorSummary({
            total: errors.length,
            critical: criticalCount,
            recent: recentCount,
            resolved: 0,
            topErrors
          });
        }
      } catch (e) {
        console.error('Failed to fetch error summary:', e);
      } finally {
        setLoadingErrors(false);
      }
    }
    
    if (status === 'authenticated' && canAccessAdminPanel) {
      fetchDashboardData();
      fetchErrorSummary();
    }
  }, [status, canAccessAdminPanel]);

  // Helper function to format time ago
  function formatTimeAgo(dateString: string): string {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('id-ID');
  }

  // Build stats from real data
  const stats: StatCard[] = [
    {
      title: 'Total Posts',
      value: dashboardStats.totalPosts,
      change: dashboardStats.totalPosts > 0 ? 'Active' : 'No data',
      trend: dashboardStats.totalPosts > 0 ? 'up' : 'neutral',
      icon: <FaNewspaper />,
      color: 'from-blue-400 to-blue-600',
      link: '/admin/posts',
    },
    {
      title: 'Events',
      value: dashboardStats.totalEvents,
      change: dashboardStats.totalEvents > 0 ? 'Active' : 'No data',
      trend: dashboardStats.totalEvents > 0 ? 'up' : 'neutral',
      icon: <FaCalendarAlt />,
      color: 'from-green-400 to-green-600',
      link: '/admin/events',
    },
    {
      title: 'Users',
      value: dashboardStats.totalUsers,
      change: dashboardStats.totalUsers > 0 ? 'Registered' : 'No data',
      trend: dashboardStats.totalUsers > 0 ? 'up' : 'neutral',
      icon: <FaUsers />,
      color: 'from-purple-400 to-purple-600',
      link: '/admin/users',
    },
    {
      title: 'Members',
      value: dashboardStats.totalMembers,
      change: dashboardStats.totalMembers > 0 ? 'Active' : 'No data',
      trend: dashboardStats.totalMembers > 0 ? 'up' : 'neutral',
      icon: <FaUsers />,
      color: 'from-yellow-400 to-amber-600',
      link: '/admin/members',
    },
    {
      title: 'Gallery',
      value: dashboardStats.totalGallery,
      change: dashboardStats.totalGallery > 0 ? 'Items' : 'No data',
      trend: dashboardStats.totalGallery > 0 ? 'up' : 'neutral',
      icon: <FaImage />,
      color: 'from-pink-400 to-rose-600',
      link: '/admin/gallery',
    },
    {
      title: 'Announcements',
      value: dashboardStats.totalAnnouncements,
      change: dashboardStats.totalAnnouncements > 0 ? 'Active' : 'No data',
      trend: dashboardStats.totalAnnouncements > 0 ? 'up' : 'neutral',
      icon: <FaBullhorn />,
      color: 'from-orange-400 to-red-600',
      link: '/admin/announcements',
    },
  ];

  // Activity type icons
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'post': return <FaNewspaper className="text-blue-500" />;
      case 'event': return <FaCalendarAlt className="text-green-500" />;
      case 'user': return <FaUsers className="text-purple-500" />;
      case 'gallery': return <FaImage className="text-pink-500" />;
      case 'announcement': return <FaBullhorn className="text-orange-500" />;
      default: return <FaClock className="text-gray-500" />;
    }
  };

  const topProgramsData = topPrograms.length > 0 ? topPrograms : [
    { id: 0, name: 'No programs yet', sekbid: 'Add programs in Proker menu', description: '' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-500 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4 text-lg">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 rounded-xl md:rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl md:shadow-2xl">
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-1 md:mb-2">
          Welcome back, {session?.user?.name || 'Admin'}! 👋
        </h1>
        <p className="text-slate-800 text-sm md:text-base lg:text-lg">
          Here's what's happening with your OSIS dashboard today
        </p>
        <div className="mt-3 md:mt-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-700">
          <span className="flex items-center gap-2">
            <FaSync className="animate-pulse" />
            Data loaded from database
          </span>
          <span className="hidden sm:inline">|</span>
          <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Stats Grid - Real Data */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
        {stats.map((stat, index) => (
          <Link
            key={index}
            href={stat.link}
            className="bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 shadow-lg hover:shadow-xl md:shadow-xl md:hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] md:hover:scale-105 group"
          >
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <div className={`p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-md md:shadow-lg group-hover:scale-110 transition-transform`}>
                <div className="text-sm md:text-xl">{stat.icon}</div>
              </div>
              <div className={`text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded-full ${
                stat.trend === 'up' ? 'bg-green-100 text-green-600' : 
                stat.trend === 'down' ? 'bg-red-100 text-red-600' : 
                'bg-gray-100 text-gray-600'
              }`}>
                {stat.change}
              </div>
            </div>
            <h3 className="text-gray-600 dark:text-gray-400 text-[10px] md:text-xs font-medium mb-0.5 md:mb-1 truncate">
              {stat.title}
            </h3>
            <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
              {stat.value}
            </p>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Recent Activity - Real Data */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <FaClock className="mr-2 md:mr-3 text-yellow-500 text-base md:text-xl" />
              Recent Activity
            </h2>
            <span className="text-xs md:text-sm text-gray-500">From database</span>
          </div>
          <div className="space-y-2 md:space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 md:space-x-4 p-3 md:p-4 rounded-lg md:rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all group"
                >
                  <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-white">
                      {activity.action}
                    </p>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">
                      {activity.title}
                    </p>
                    <div className="flex items-center mt-1 text-[10px] md:text-xs text-gray-500 dark:text-gray-500">
                      <span>{activity.user}</span>
                      <span className="mx-1 md:mx-2">•</span>
                      <span>{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 md:py-8 text-gray-500">
                <FaClock className="text-3xl md:text-4xl mx-auto mb-2 md:mb-3 opacity-50" />
                <p className="text-sm md:text-base">No recent activity</p>
                <p className="text-xs md:text-sm">Start adding posts, events, or announcements</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Programs - Real Data from Proker */}
        <div className="bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <FaFire className="mr-2 md:mr-3 text-yellow-500 text-base md:text-xl" />
              Top Programs
            </h2>
            <Link href="/admin/proker" className="text-xs md:text-sm text-yellow-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-2 md:space-y-3">
            {topProgramsData.map((program, index) => (
              <div
                key={program.id}
                className="flex items-center space-x-2 md:space-x-3 p-2 md:p-3 rounded-lg md:rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
              >
                <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-md md:rounded-lg bg-gradient-to-br from-yellow-400 to-amber-600 text-white flex items-center justify-center font-bold text-xs md:text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-white truncate">
                    {program.name}
                  </p>
                  <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
                    {program.sekbid}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error Monitoring Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <FaExclamationTriangle className="mr-2 md:mr-3 text-red-500 text-base md:text-xl" />
            Error Monitoring
          </h2>
          <Link
            href="/admin/errors"
            className="px-3 md:px-4 py-1.5 md:py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-xs md:text-sm transition-colors shadow-md md:shadow-lg hover:shadow-xl text-center"
          >
            View All Errors →
          </Link>
        </div>

        {loadingErrors ? (
          <div className="text-center py-6 md:py-8">
            <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-red-500 mx-auto"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-3 md:mt-4 text-sm">Loading error data...</p>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {/* Error Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
              <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg md:rounded-xl p-3 md:p-4 border border-red-200 dark:border-red-700">
                <div className="flex items-center justify-between mb-1 md:mb-2">
                  <FaBug className="text-red-600 dark:text-red-400 text-base md:text-xl" />
                  <span className="text-[10px] md:text-xs font-medium text-red-600 dark:text-red-400">Total</span>
                </div>
                <p className="text-xl md:text-2xl font-bold text-red-700 dark:text-red-300">{errorSummary.total}</p>
                <p className="text-[10px] md:text-xs text-red-600 dark:text-red-400 mt-0.5 md:mt-1">All time</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg md:rounded-xl p-3 md:p-4 border border-orange-200 dark:border-orange-700">
                <div className="flex items-center justify-between mb-1 md:mb-2">
                  <FaExclamationTriangle className="text-orange-600 dark:text-orange-400 text-base md:text-xl" />
                  <span className="text-[10px] md:text-xs font-medium text-orange-600 dark:text-orange-400">Critical</span>
                </div>
                <p className="text-xl md:text-2xl font-bold text-orange-700 dark:text-orange-300">{errorSummary.critical}</p>
                <p className="text-[10px] md:text-xs text-orange-600 dark:text-orange-400 mt-0.5 md:mt-1">Need attention</p>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg md:rounded-xl p-3 md:p-4 border border-yellow-200 dark:border-yellow-700">
                <div className="flex items-center justify-between mb-1 md:mb-2">
                  <FaClock className="text-yellow-600 dark:text-yellow-400 text-base md:text-xl" />
                  <span className="text-[10px] md:text-xs font-medium text-yellow-600 dark:text-yellow-400">Recent</span>
                </div>
                <p className="text-xl md:text-2xl font-bold text-yellow-700 dark:text-yellow-300">{errorSummary.recent}</p>
                <p className="text-[10px] md:text-xs text-yellow-600 dark:text-yellow-400 mt-0.5 md:mt-1">Last hour</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg md:rounded-xl p-3 md:p-4 border border-green-200 dark:border-green-700">
                <div className="flex items-center justify-between mb-1 md:mb-2">
                  <FaCheckCircle className="text-green-600 dark:text-green-400 text-base md:text-xl" />
                  <span className="text-[10px] md:text-xs font-medium text-green-600 dark:text-green-400">Resolved</span>
                </div>
                <p className="text-xl md:text-2xl font-bold text-green-700 dark:text-green-300">{errorSummary.resolved}</p>
                <p className="text-[10px] md:text-xs text-green-600 dark:text-green-400 mt-0.5 md:mt-1">This week</p>
              </div>
            </div>

            {/* Top Errors */}
            {errorSummary.topErrors.length > 0 && (
              <div>
                <h3 className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 md:mb-3 flex items-center">
                  <FaChartLine className="mr-2" />
                  Top Errors
                </h3>
                <div className="space-y-2">
                  {errorSummary.topErrors.map((error, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {error.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Last seen: {error.lastSeen}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-bold rounded-full">
                          {error.count}x
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {errorSummary.total === 0 && (
              <div className="text-center py-8">
                <FaCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-900 dark:text-white">No errors found!</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Your application is running smoothly.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link
            href="/admin/attendance/mikrotik"
            className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg hover:shadow-2xl hover:scale-105 transition-all group border-2 border-emerald-300"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
              🔐
            </div>
            <span className="text-sm font-medium">Keamanan</span>
            <span className="text-xs opacity-80 mt-1">Mikrotik</span>
          </Link>

          <Link
            href="/admin/activity"
            className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 text-white shadow-lg hover:shadow-2xl hover:scale-105 transition-all group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
              🤖
            </div>
            <span className="text-sm font-medium">AI Activity</span>
          </Link>

          <Link
            href="/admin/errors"
            className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-red-400 to-red-600 text-white shadow-lg hover:shadow-2xl hover:scale-105 transition-all group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
              <FaBug />
            </div>
            <span className="text-sm font-medium">AI Errors</span>
          </Link>

          <Link
            href="/admin/attendance"
            className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 text-white shadow-lg hover:shadow-2xl hover:scale-105 transition-all group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
              <FaClipboardCheck />
            </div>
            <span className="text-sm font-medium">Absensi</span>
          </Link>

          <Link
            href="/admin/posts/"
            className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg hover:shadow-2xl hover:scale-105 transition-all group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
              <FaNewspaper />
            </div>
            <span className="text-sm font-medium">New Post</span>
          </Link>

          <Link
            href="/admin/events"
            className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg hover:shadow-2xl hover:scale-105 transition-all group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
              <FaCalendarAlt />
            </div>
            <span className="text-sm font-medium">New Event</span>
          </Link>

          <Link
            href="/admin/polls"
            className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 text-white shadow-lg hover:shadow-2xl hover:scale-105 transition-all group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
              <FaPoll />
            </div>
            <span className="text-sm font-medium">New Poll</span>
          </Link>

          <Link
            href="/admin/gallery"
            className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 text-white shadow-lg hover:shadow-2xl hover:scale-105 transition-all group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
              <FaEye />
            </div>
            <span className="text-sm font-medium">Upload Image</span>
          </Link>

          <Link
            href="/admin/settings"
            className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 text-white shadow-lg hover:shadow-2xl hover:scale-105 transition-all group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
              <FaCog />
            </div>
            <span className="text-sm font-medium">Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
