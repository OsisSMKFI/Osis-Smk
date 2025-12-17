import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * API to load ALL design overrides from database
 * Returns combined CSS for all components that have been redesigned by AI
 */
export async function GET() {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // Fetch all design overrides from page_content table
        // Using correct column names: page_key, content, category
        const { data: designs, error } = await supabase
            .from('page_content')
            .select('page_key, content, updated_at')
            .like('page_key', 'design_override_%')
            .eq('category', 'design')
            .order('updated_at', { ascending: true });

        if (error) {
            console.error('Failed to load designs:', error);
            return NextResponse.json({ css: '', components: [], error: error.message });
        }

        if (!designs || designs.length === 0) {
            return NextResponse.json({ css: '', components: [], count: 0 });
        }

        // Combine all CSS with component comments
        const allCSS = designs.map(d => {
            const componentName = d.page_key.replace('design_override_', '');
            return `
/* ════════════════════════════════════════
   Component: ${componentName}
   Updated: ${d.updated_at || 'unknown'}
   ════════════════════════════════════════ */
${d.content}
`;
        }).join('\n');

        const componentNames = designs.map(d => d.page_key.replace('design_override_', ''));

        return NextResponse.json({
            css: allCSS,
            components: componentNames,
            count: designs.length,
            updatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error in load-all designs:', error);
        return NextResponse.json({ 
            css: '', 
            components: [], 
            error: 'Failed to load designs: ' + (error as Error).message 
        });
    }
}
