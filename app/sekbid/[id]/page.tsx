import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { generatePageMetadata } from '@/lib/metadata-helper';
import SekbidDetailClient from './SekbidDetailClient';

interface PageProps {
    params: Promise<{ id: string }>;
}

async function parseSekbidId(raw: string): Promise<number | null> {
    const sekbidId = parseInt(raw, 10);
    if (!Number.isFinite(sekbidId) || sekbidId <= 0 || String(sekbidId) !== raw.trim()) {
        return null;
    }
    return sekbidId;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const resolvedParams = await params;
    const sekbidId = await parseSekbidId(resolvedParams.id);
    if (sekbidId === null) {
        return generatePageMetadata({
            title: 'Sekbid Tidak Ditemukan',
            description: 'Seksi bidang tidak ditemukan.',
            url: '/sekbid',
        });
    }

    let sekbidName = `Sekbid ${sekbidId}`;
    let sekbidDescription = 'Seksi Bidang OSIS SMK Informatika 2 Fithrah Insani';

    try {
        const { data } = await supabaseAdmin
            .from('sekbid')
            .select('id, name, description')
            .eq('id', sekbidId)
            .maybeSingle();

        if (data) {
            sekbidName = (data.name || '').trim() || sekbidName;
            sekbidDescription = (data.description || '').trim() || sekbidDescription;
        }
    } catch {
        // keep generic fallback
    }

    return generatePageMetadata({
        title: `${sekbidName} - OSIS SMK Informatika 2 FI`,
        description: sekbidDescription,
        url: `/sekbid/${sekbidId}`,
        type: 'article',
        sekbidId,
    });
}

export default async function SekbidDetailPage({ params }: PageProps) {
    const resolvedParams = await params;
    const sekbidId = await parseSekbidId(resolvedParams.id);
    if (sekbidId === null) {
        notFound();
    }
    return <SekbidDetailClient sekbidId={sekbidId} />;
}
