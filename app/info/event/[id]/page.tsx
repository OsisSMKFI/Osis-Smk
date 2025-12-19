import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { generatePageMetadata, SITE_URL } from '@/lib/metadata-helper';
import { notFound, redirect } from 'next/navigation';
import EventDetailClient from './EventDetailClient';

// Create Supabase client for server-side
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getEvent(id: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return data;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);
  
  if (!event) {
    return generatePageMetadata({
      title: 'Event Tidak Ditemukan',
      description: 'Event yang Anda cari tidak ditemukan.',
    });
  }
  
  const eventDate = event.event_date 
    ? new Date(event.event_date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : '';
  
  return generatePageMetadata({
    title: `${event.title} - Event OSIS`,
    description: event.description || `Event ${event.title} ${eventDate ? `pada ${eventDate}` : ''} ${event.location ? `di ${event.location}` : ''}. OSIS SMK Informatika 2 Fithrah Insani.`,
    url: `/info/event/${id}`,
    type: 'article',
    eventId: id,
    publishedTime: event.created_at,
    modifiedTime: event.updated_at,
  });
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const event = await getEvent(id);
  
  if (!event) {
    notFound();
  }
  
  return <EventDetailClient event={event} />;
}
