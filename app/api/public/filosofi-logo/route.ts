import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { DEFAULT_FILOSOFI } from '@/lib/filosofiLogo';

// Color to gradient mapping
const colorToGradient: Record<string, string> = {
  '#22c55e': 'bg-gradient-to-r from-green-500 to-emerald-600',
  '#3b82f6': 'bg-gradient-to-r from-blue-500 to-indigo-600',
  '#f59e0b': 'bg-gradient-to-r from-amber-500 to-yellow-600',
  '#ef4444': 'bg-gradient-to-r from-red-500 to-rose-600',
  '#a855f7': 'bg-gradient-to-r from-purple-500 to-violet-600',
  '#10b981': 'bg-gradient-to-r from-emerald-500 to-teal-600',
  '#06b6d4': 'bg-gradient-to-r from-cyan-500 to-blue-600',
  '#f97316': 'bg-gradient-to-r from-orange-500 to-red-600',
  '#ec4899': 'bg-gradient-to-r from-pink-500 to-rose-600',
  '#8b5cf6': 'bg-gradient-to-r from-violet-500 to-purple-600',
};

// GET: Fetch filosofi logo elements
export async function GET() {
  try {
    // Try to fetch from database
    const { data, error } = await supabaseAdmin
      .from('page_content')
      .select('*')
      .eq('category', 'about_filosofi_logo')
      .eq('published', true);

    if (error) {
      console.error('[filosofi-logo] Database error:', error);
      return NextResponse.json({ 
        elements: DEFAULT_FILOSOFI, 
        source: 'default' 
      });
    }

    // If no data from database, return defaults
    if (!data || data.length === 0) {
      return NextResponse.json({ 
        elements: DEFAULT_FILOSOFI, 
        source: 'default' 
      });
    }

    // Parse database entries into filosofi elements
    const contentMap: Record<string, string> = {};
    data.forEach((item: any) => {
      contentMap[item.page_key] = item.content;
    });

    // Build elements from database
    const elements = [];
    for (let i = 1; i <= 5; i++) {
      const title = contentMap[`filosofi_logo_${i}_title`];
      const description = contentMap[`filosofi_logo_${i}_description`];
      
      // Only include if at least title exists
      if (title) {
        const color = contentMap[`filosofi_logo_${i}_color`] || DEFAULT_FILOSOFI[i - 1]?.color || '#22c55e';
        const gradient = colorToGradient[color] || `bg-gradient-to-r from-gray-500 to-gray-600`;
        
        elements.push({
          icon: contentMap[`filosofi_logo_${i}_icon`] || DEFAULT_FILOSOFI[i - 1]?.icon || '⭐',
          imageSrc: contentMap[`filosofi_logo_${i}_image`] || DEFAULT_FILOSOFI[i - 1]?.imageSrc,
          title,
          description: description || DEFAULT_FILOSOFI[i - 1]?.description || '',
          color,
          gradient,
        });
      }
    }

    // If we couldn't build any elements from DB, use defaults
    if (elements.length === 0) {
      return NextResponse.json({ 
        elements: DEFAULT_FILOSOFI, 
        source: 'default' 
      });
    }

    return NextResponse.json({ 
      elements, 
      source: 'database' 
    });
  } catch (error) {
    console.error('[filosofi-logo] Error:', error);
    return NextResponse.json({ 
      elements: DEFAULT_FILOSOFI, 
      source: 'error-fallback' 
    });
  }
}
