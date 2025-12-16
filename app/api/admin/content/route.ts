import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// API endpoint for managing page content
export async function GET(request: NextRequest) {
  try {
    console.log('[/api/admin/content] Fetching page content...');
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    let query = supabaseAdmin
      .from('page_content')
      .select('*');
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query
      .order('category', { ascending: true })
      .order('page_key', { ascending: true });

    if (error) {
      console.error('[/api/admin/content] Supabase error:', error);
      throw error;
    }

    console.log('[/api/admin/content] Fetched items:', data?.length || 0);

    // Transform data to match frontend expectations
    const formattedData = data?.map((item: any) => ({
      id: item.id,
      key: item.page_key,
      page_key: item.page_key,
      title: item.title || item.page_key.split('_').map((word: string) => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      content: item.content || '',
      category: item.category || 'general',
      content_type: item.content_type || 'text',
      published: item.published !== false,
      updated_at: item.updated_at || item.created_at
    })) || [];

    return NextResponse.json(formattedData);
  } catch (error: any) {
    console.error('[/api/admin/content] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch page content', details: error },
      { status: 500 }
    );
  }
}

// Create new content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { page_key, category, title, content, published } = body;
    
    if (!page_key) {
      return NextResponse.json({ error: 'page_key is required' }, { status: 400 });
    }
    
    const { data, error } = await supabaseAdmin
      .from('page_content')
      .insert({
        page_key,
        category: category || 'general',
        title: title || page_key,
        content: content || '',
        published: published !== false,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('[/api/admin/content] Insert error:', error);
      throw error;
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[/api/admin/content] POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update content
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, page_key, category, title, content, published } = body;
    
    if (!id && !page_key) {
      return NextResponse.json({ error: 'id or page_key is required' }, { status: 400 });
    }
    
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (category !== undefined) updateData.category = category;
    if (published !== undefined) updateData.published = published;
    
    let query = supabaseAdmin.from('page_content').update(updateData);
    
    if (id) {
      query = query.eq('id', id);
    } else {
      query = query.eq('page_key', page_key);
    }
    
    const { data, error } = await query.select().single();
    
    if (error) {
      console.error('[/api/admin/content] Update error:', error);
      throw error;
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[/api/admin/content] PUT Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete content
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const page_key = searchParams.get('page_key');
    
    if (!id && !page_key) {
      return NextResponse.json({ error: 'id or page_key is required' }, { status: 400 });
    }
    
    let query = supabaseAdmin.from('page_content').delete();
    
    if (id) {
      query = query.eq('id', id);
    } else {
      query = query.eq('page_key', page_key);
    }
    
    const { error } = await query;
    
    if (error) {
      console.error('[/api/admin/content] Delete error:', error);
      throw error;
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[/api/admin/content] DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
