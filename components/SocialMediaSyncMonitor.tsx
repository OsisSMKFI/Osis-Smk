// components/SocialMediaSyncMonitor.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useSocialMediaAutoSync } from '@/lib/hooks/useSocialMediaAutoSync';

interface SyncMonitorProps {
  showInDev?: boolean;
}

export const SocialMediaSyncMonitor: React.FC<SyncMonitorProps> = ({ 
  showInDev = process.env.NODE_ENV === 'development' 
}) => {
  const { syncStatus, isAutoSyncEnabled, syncAll } = useSocialMediaAutoSync();

  if (!showInDev) return null;

  const formatTimeAgo = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getStatusColor = (status: 'success' | 'error' | 'syncing') => {
    switch (status) {
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      case 'syncing': return 'text-yellow-500 animate-pulse';
      default: return 'text-gray-500';
    }
  };

  const getPlatformStatus = (platform: 'instagram' | 'youtube') => {
    const status = syncStatus[platform];
    if (status.isSyncing) return 'syncing';
    if (status.error) return 'error';
    return 'success';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 bg-gray-900/95 backdrop-blur-sm rounded-lg p-4 shadow-xl border border-gray-700 z-50 max-w-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold text-sm">Social Media Sync</h3>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isAutoSyncEnabled ? 'bg-green-500' : 'bg-gray-500'}`} />
          <span className="text-xs text-gray-400">
            {isAutoSyncEnabled ? 'Auto' : 'Manual'}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {/* Instagram Status */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <i className="fab fa-instagram text-pink-500" />
            <span className="text-gray-300">Instagram</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">
              {syncStatus.instagram.followers} followers
            </span>
            <span className={`text-xs ${getStatusColor(getPlatformStatus('instagram'))}`}>
              {syncStatus.instagram.isSyncing ? 'Syncing...' : 
               syncStatus.instagram.error ? 'Error' : '✓'}
            </span>
          </div>
        </div>

        {/* YouTube Status */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <i className="fab fa-youtube text-red-500" />
            <span className="text-gray-300">YouTube</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">
              {syncStatus.youtube.videos} videos
            </span>
            <span className={`text-xs ${getStatusColor(getPlatformStatus('youtube'))}`}>
              {syncStatus.youtube.isSyncing ? 'Syncing...' : 
               syncStatus.youtube.error ? 'Error' : '✓'}
            </span>
          </div>
        </div>
      </div>

      {/* Last Sync Times */}
      <div className="mt-3 pt-3 border-t border-gray-700 space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Last sync:</span>
          <span className="text-gray-300">
            {formatTimeAgo(syncStatus.instagram.lastSync)}
          </span>
        </div>
      </div>

      {/* Manual Sync Button */}
      <button
        onClick={syncAll}
        className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded transition-colors"
      >
        Sync Now
      </button>

      {/* Error Display */}
      {(syncStatus.instagram.error || syncStatus.youtube.error) && (
        <div className="mt-2 p-2 bg-red-900/50 rounded text-xs text-red-300">
          {syncStatus.instagram.error && (
            <div>IG: {syncStatus.instagram.error}</div>
          )}
          {syncStatus.youtube.error && (
            <div>YT: {syncStatus.youtube.error}</div>
          )}
        </div>
      )}
    </motion.div>
  );
};
