import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// Public API to fetch achievements data
export async function GET() {
  try {
    // First try to fetch from page_content table
    const { data: contentData, error: contentError } = await supabaseAdmin
      .from('page_content')
      .select('*')
      .like('page_key', 'achievement_%')
      .eq('published', true);

    if (!contentError && contentData && contentData.length > 0) {
      // Group by achievement number
      const achievementsMap: Record<string, any> = {};
      
      for (const item of contentData) {
        // Parse key like: achievement_1_title, achievement_1_desc, achievement_1_year, achievement_1_icon
        const match = item.page_key.match(/achievement_(\d+)_(\w+)/);
        if (match) {
          const num = match[1];
          const field = match[2];
          if (!achievementsMap[num]) {
            achievementsMap[num] = { id: parseInt(num) };
          }
          // Use 'content' column (actual table schema)
          achievementsMap[num][field] = item.content;
        }
      }
      
      // Convert to array and sort by id
      const achievements = Object.values(achievementsMap)
        .sort((a: any, b: any) => a.id - b.id)
        .map((item: any) => ({
          year: item.year || '2024',
          title: item.title || '',
          description: item.desc || item.description || '',
          icon: item.icon || '🎯',
        }));
      
      if (achievements.length > 0) {
        return NextResponse.json({
          source: 'database',
          achievements
        });
      }
    }

    // Fallback to default achievements
    return NextResponse.json({
      source: 'default',
      achievements: [
        {
          year: '2024',
          title: 'Terbentuknya OSIS Dirgantara',
          description: 'OSIS SMK Informatika resmi terbentuk dengan nama Dirgantara, membawa semangat baru dalam organisasi siswa.',
          icon: '🚀',
        },
        {
          year: '2024',
          title: 'Peluncuran Website Resmi',
          description: 'Website OSIS dengan fitur modern dan interaktif diluncurkan untuk memudahkan komunikasi dan informasi.',
          icon: '💻',
        },
        {
          year: '2025',
          title: 'Program Kerja Inovatif',
          description: 'Meluncurkan berbagai program kerja yang fokus pada pengembangan soft skill dan hard skill siswa.',
          icon: '🎯',
        },
      ]
    });
  } catch (error: any) {
    console.error('[/api/public/achievements] Error:', error);
    // Return default achievements on error
    return NextResponse.json({
      source: 'fallback',
      achievements: [
        {
          year: '2024',
          title: 'Terbentuknya OSIS Dirgantara',
          description: 'OSIS SMK Informatika resmi terbentuk dengan nama Dirgantara.',
          icon: '🚀',
        },
        {
          year: '2024',
          title: 'Peluncuran Website Resmi',
          description: 'Website OSIS dengan fitur modern dan interaktif diluncurkan.',
          icon: '💻',
        },
        {
          year: '2025',
          title: 'Program Kerja Inovatif',
          description: 'Berbagai program kerja fokus pada pengembangan skill siswa.',
          icon: '🎯',
        },
      ]
    });
  }
}
