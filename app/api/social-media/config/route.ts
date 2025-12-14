import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { SOCIAL_MEDIA_CONFIG as defaultConfig } from '@/lib/socialMediaConfig';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Fetch social media settings from admin_settings
    const { data: settings, error } = await supabaseAdmin
      .from('admin_settings')
      .select('key, value')
      .like('key', 'SOCIAL_%');

    if (error) {
      console.error('[Social Media Config API] Error fetching settings:', error);
      return NextResponse.json({ config: defaultConfig });
    }

    // Convert to map
    const settingsMap: Record<string, string> = {};
    (settings || []).forEach((row: any) => {
      settingsMap[row.key] = row.value;
    });

    // Build config object with database values falling back to defaults
    const config = {
      instagram: {
        username: settingsMap['SOCIAL_INSTAGRAM_USERNAME'] || defaultConfig.instagram.username,
        url: settingsMap['SOCIAL_INSTAGRAM_URL'] || defaultConfig.instagram.url,
        followers: parseInt(settingsMap['SOCIAL_INSTAGRAM_FOLLOWERS'] || '0') || defaultConfig.instagram.followers,
        targetFollowers: defaultConfig.instagram.targetFollowers,
        isActive: Boolean(settingsMap['SOCIAL_INSTAGRAM_URL']) || defaultConfig.instagram.isActive,
      },
      youtube: {
        channelName: settingsMap['SOCIAL_YOUTUBE_CHANNEL'] || defaultConfig.youtube.channelName,
        url: settingsMap['SOCIAL_YOUTUBE_URL'] || defaultConfig.youtube.url,
        subscribers: parseInt(settingsMap['SOCIAL_YOUTUBE_SUBSCRIBERS'] || '0') || defaultConfig.youtube.subscribers,
        followers: parseInt(settingsMap['SOCIAL_YOUTUBE_SUBSCRIBERS'] || '0') || defaultConfig.youtube.subscribers, // alias
        targetFollowers: defaultConfig.youtube.targetSubscribers,
        targetSubscribers: defaultConfig.youtube.targetSubscribers,
        isActive: Boolean(settingsMap['SOCIAL_YOUTUBE_URL']) || defaultConfig.youtube.isActive,
      },
      tiktok: {
        username: settingsMap['SOCIAL_TIKTOK_USERNAME'] || defaultConfig.tiktok.username,
        url: settingsMap['SOCIAL_TIKTOK_URL'] || defaultConfig.tiktok.url,
        followers: parseInt(settingsMap['SOCIAL_TIKTOK_FOLLOWERS'] || '0') || defaultConfig.tiktok.followers,
        targetFollowers: defaultConfig.tiktok.targetFollowers,
        isActive: Boolean(settingsMap['SOCIAL_TIKTOK_URL'] && settingsMap['SOCIAL_TIKTOK_URL'] !== '#') || defaultConfig.tiktok.isActive,
      },
      spotify: {
        username: settingsMap['SOCIAL_SPOTIFY_NAME'] || defaultConfig.spotify.username,
        url: settingsMap['SOCIAL_SPOTIFY_URL'] || defaultConfig.spotify.url,
        followers: parseInt(settingsMap['SOCIAL_SPOTIFY_FOLLOWERS'] || '0') || defaultConfig.spotify.followers,
        targetFollowers: defaultConfig.spotify.targetFollowers,
        isActive: Boolean(settingsMap['SOCIAL_SPOTIFY_URL'] && settingsMap['SOCIAL_SPOTIFY_URL'] !== '#') || defaultConfig.spotify.isActive,
      },
    };

    return NextResponse.json({ 
      config,
      source: Object.keys(settingsMap).length > 0 ? 'database' : 'default',
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Social Media Config API] Error:', error);
    return NextResponse.json({ 
      config: defaultConfig, 
      source: 'default',
      error: error.message 
    });
  }
}
