// components/admin/SocialMediaHealthDashboard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface HealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    instagram: {
      status: 'connected' | 'disconnected' | 'error';
      lastSync: string | null;
      followers: number;
      posts: number;
      error?: string;
      responseTime?: number;
    };
    youtube: {
      status: 'connected' | 'disconnected' | 'error';
      lastSync: string | null;
      videos: number;
      error?: string;
      responseTime?: number;
    };
  };
  environment: {
    hasInstagramToken: boolean;
    hasInstagramUserId: boolean;
    hasYouTubeApiKey: boolean;
    nodeEnv: string;
  };
}

export const SocialMediaHealthDashboard: React.FC = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/social-media/health');
      const data = await response.json();
      setHealth(data);
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();

    if (autoRefresh) {
      const interval = setInterval(fetchHealth, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected': return 'text-green-500 bg-green-100 dark:bg-green-900';
      case 'degraded': return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900';
      case 'unhealthy':
      case 'error':
      case 'disconnected': return 'text-red-500 bg-red-100 dark:bg-red-900';
      default: return 'text-gray-500 bg-gray-100 dark:bg-gray-900';
    }
  };

  const formatTimeAgo = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="p-6">
        <div className="text-red-500">Failed to load health data</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Social Media Health Monitor
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              autoRefresh 
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>
          <button
            onClick={fetchHealth}
            className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Overall Status */}
      <div className={`p-4 rounded-lg ${getStatusColor(health.status)}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Overall Status</h3>
            <p className="text-sm opacity-75">Last checked: {formatTimeAgo(health.timestamp)}</p>
          </div>
          <div className="text-2xl font-bold uppercase">{health.status}</div>
        </div>
      </div>

      {/* Service Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Instagram */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <i className="fab fa-instagram text-pink-500 text-xl"></i>
              <h3 className="font-semibold">Instagram</h3>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(health.services.instagram.status)}`}>
              {health.services.instagram.status}
            </span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Followers:</span>
              <span className="font-medium">{health.services.instagram.followers.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Posts:</span>
              <span className="font-medium">{health.services.instagram.posts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Last Sync:</span>
              <span className="font-medium">{formatTimeAgo(health.services.instagram.lastSync)}</span>
            </div>
            {health.services.instagram.responseTime && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Response Time:</span>
                <span className="font-medium">{health.services.instagram.responseTime}ms</span>
              </div>
            )}
          </div>

          {health.services.instagram.error && (
            <div className="mt-3 p-2 bg-red-100 dark:bg-red-900 rounded text-xs text-red-700 dark:text-red-300">
              {health.services.instagram.error}
            </div>
          )}
        </div>

        {/* YouTube */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <i className="fab fa-youtube text-red-500 text-xl"></i>
              <h3 className="font-semibold">YouTube</h3>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(health.services.youtube.status)}`}>
              {health.services.youtube.status}
            </span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Videos:</span>
              <span className="font-medium">{health.services.youtube.videos}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Last Sync:</span>
              <span className="font-medium">{formatTimeAgo(health.services.youtube.lastSync)}</span>
            </div>
            {health.services.youtube.responseTime && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Response Time:</span>
                <span className="font-medium">{health.services.youtube.responseTime}ms</span>
              </div>
            )}
          </div>

          {health.services.youtube.error && (
            <div className="mt-3 p-2 bg-red-100 dark:bg-red-900 rounded text-xs text-red-700 dark:text-red-300">
              {health.services.youtube.error}
            </div>
          )}
        </div>
      </div>

      {/* Environment Status */}
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
        <h3 className="font-semibold mb-3">Environment Configuration</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${health.environment.hasInstagramToken ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>Instagram Token</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${health.environment.hasInstagramUserId ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>Instagram User ID</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${health.environment.hasYouTubeApiKey ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>YouTube API Key</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${health.environment.nodeEnv === 'production' ? 'bg-blue-500' : 'bg-yellow-500'}`}></div>
            <span>{health.environment.nodeEnv}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
