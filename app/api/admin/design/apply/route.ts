import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 APPLY DESIGN API - Super Admin Premium v5.0
// ═══════════════════════════════════════════════════════════════════════════════
// Actually apply design changes to components
// Stores CSS in database for realtime application
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    // Check super admin authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ 
        error: 'Hanya Super Admin yang bisa apply design changes' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { component, cssCode, styles, preset, description } = body;

    if (!component || !cssCode) {
      return NextResponse.json({ 
        error: 'Component dan CSS code required' 
      }, { status: 400 });
    }

    // Store design in database
    const designData = {
      component,
      css_code: cssCode,
      styles: styles || {},
      preset: preset || 'custom',
      description: description || `Design update for ${component}`,
      applied_by: session.user.id,
      applied_at: new Date().toISOString(),
      is_active: true,
    };

    // Check if design_overrides table exists, if not provide instructions
    const { error: checkError } = await supabaseAdmin
      .from('design_overrides')
      .select('id')
      .limit(1);

    if (checkError?.code === '42P01') {
      // Table doesn't exist - create it
      return NextResponse.json({
        success: false,
        needsSetup: true,
        sqlToRun: `
-- Create design_overrides table
CREATE TABLE IF NOT EXISTS public.design_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component TEXT NOT NULL,
  css_code TEXT NOT NULL,
  styles JSONB DEFAULT '{}',
  preset TEXT DEFAULT 'custom',
  description TEXT,
  applied_by UUID REFERENCES auth.users(id),
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.design_overrides ENABLE ROW LEVEL SECURITY;

-- Policy for super admin
CREATE POLICY "Super admins can manage design_overrides"
ON public.design_overrides
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

-- Policy for reading (all authenticated users)
CREATE POLICY "Anyone can read active designs"
ON public.design_overrides
FOR SELECT
USING (is_active = true);
`,
        message: 'Table design_overrides belum ada. Jalankan SQL di atas atau gunakan command /sql untuk membuat table.'
      });
    }

    // Deactivate old designs for same component
    await supabaseAdmin
      .from('design_overrides')
      .update({ is_active: false })
      .eq('component', component)
      .eq('is_active', true);

    // Insert new design
    const { data, error } = await supabaseAdmin
      .from('design_overrides')
      .insert(designData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      design: data,
      message: `✅ Design untuk "${component}" berhasil di-apply! Perubahan akan terlihat setelah refresh.`,
      cssApplied: cssCode,
    });

  } catch (error: any) {
    console.error('Apply design error:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}

// GET - Get active design overrides
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const component = searchParams.get('component');

    let query = supabaseAdmin
      .from('design_overrides')
      .select('*')
      .eq('is_active', true)
      .order('applied_at', { ascending: false });

    if (component) {
      query = query.eq('component', component);
    }

    const { data, error } = await query;

    if (error) {
      // Graceful degradation if table doesn't exist
      if (error.code === '42P01') {
        return NextResponse.json({
          designs: [],
          message: 'Design system belum disetup'
        });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      designs: data || [],
      count: data?.length || 0,
    });

  } catch (error: any) {
    console.error('Get designs error:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}

// DELETE - Remove design override
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const component = searchParams.get('component');

    if (!id && !component) {
      return NextResponse.json({ 
        error: 'ID atau component name required' 
      }, { status: 400 });
    }

    let query = supabaseAdmin
      .from('design_overrides')
      .update({ is_active: false });

    if (id) {
      query = query.eq('id', id);
    } else if (component) {
      query = query.eq('component', component);
    }

    const { error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: `Design override berhasil dihapus`,
    });

  } catch (error: any) {
    console.error('Delete design error:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}
