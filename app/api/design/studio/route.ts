import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 DESIGN STUDIO API - Manage design overrides
// ═══════════════════════════════════════════════════════════════════════════════

// GET - List all design overrides
export async function GET(request: NextRequest) {
    try {
        const { data: designs, error } = await supabaseAdmin
            .from('page_content')
            .select('*')
            .eq('category', 'design')
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('[Design API] GET error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            designs: designs || [],
            count: designs?.length || 0,
        });
    } catch (error: any) {
        console.error('[Design API] GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Save or update a design override
export async function POST(request: NextRequest) {
    try {
        // Check auth
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const role = (session.user as any).role;
        if (role !== 'super_admin') {
            return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const { component, css, style, action } = body;

        if (!component) {
            return NextResponse.json({ error: 'Component name required' }, { status: 400 });
        }

        // Handle delete action
        if (action === 'delete') {
            const { error: deleteError } = await supabaseAdmin
                .from('page_content')
                .delete()
                .eq('page_key', `design_override_${component}`);

            if (deleteError) {
                return NextResponse.json({ error: deleteError.message }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                message: `Design for ${component} deleted`,
            });
        }

        // Save design
        const pageKey = `design_override_${component}`;
        const cssContent = css || '';

        const { data, error } = await supabaseAdmin
            .from('page_content')
            .upsert({
                page_key: pageKey,
                title: `Design: ${component} (${style || 'custom'})`,
                content: cssContent,
                category: 'design',
                published: true,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'page_key',
            })
            .select()
            .single();

        if (error) {
            console.error('[Design API] Save error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `Design saved for ${component}`,
            data,
        });
    } catch (error: any) {
        console.error('[Design API] POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE - Remove a design override
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const role = (session.user as any).role;
        if (role !== 'super_admin') {
            return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const component = searchParams.get('component');

        if (!component) {
            return NextResponse.json({ error: 'Component name required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('page_content')
            .delete()
            .eq('page_key', `design_override_${component}`);

        if (error) {
            console.error('[Design API] DELETE error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `Design for ${component} removed`,
        });
    } catch (error: any) {
        console.error('[Design API] DELETE error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
