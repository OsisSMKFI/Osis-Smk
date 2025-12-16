/**
 * AI Auto-Learning System v2.0
 * Complete data access + Time-aware context + Professional analysis
 * Automatically analyze, understand, and index all website data for AI providers
 */

import { supabaseAdmin } from '@/lib/supabase/server';
import { fetchSiteSnapshot } from '@/lib/aiSiteFetcher';

// In-memory knowledge base (auto-refreshed every 3 minutes for fresher data)
let knowledgeBase: string | null = null;
let lastUpdate: number = 0;
const UPDATE_INTERVAL = 3 * 60 * 1000; // 3 minutes for more responsive updates

/**
 * Get formatted date strings for temporal awareness
 */
function getTemporalContext(): { today: string; yesterday: string; tomorrow: string; weekAgo: string; weekLater: string; currentTime: string; dayName: string } {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const weekLater = new Date(now);
  weekLater.setDate(weekLater.getDate() + 7);
  
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  
  const dayName = dayNames[now.getDay()];
  const formattedDate = `${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} WIB`;
  
  return {
    today,
    yesterday: yesterday.toISOString().split('T')[0],
    tomorrow: tomorrow.toISOString().split('T')[0],
    weekAgo: weekAgo.toISOString().split('T')[0],
    weekLater: weekLater.toISOString().split('T')[0],
    currentTime: `${dayName}, ${formattedDate} - ${currentTime}`,
    dayName
  };
}

/**
 * Categorize events by temporal relevance
 */
function categorizeEventByDate(eventDate: string, temporal: ReturnType<typeof getTemporalContext>): 'past' | 'yesterday' | 'today' | 'tomorrow' | 'upcoming' | 'future' {
  if (!eventDate) return 'future';
  const date = eventDate.split('T')[0];
  if (date === temporal.today) return 'today';
  if (date === temporal.yesterday) return 'yesterday';
  if (date === temporal.tomorrow) return 'tomorrow';
  if (date < temporal.weekAgo) return 'past';
  if (date > temporal.today && date <= temporal.weekLater) return 'upcoming';
  return 'future';
}

/**
 * Build comprehensive knowledge base from all database tables
 */
async function buildKnowledgeBase(): Promise<string> {
  const kb: string[] = [];
  const temporal = getTemporalContext();
  
  kb.push('╔════════════════════════════════════════════════════════════════════════════╗');
  kb.push('║     🤖 AI KNOWLEDGE BASE - OSIS SMK INFORMATIKA FITHRAH INSANI            ║');
  kb.push('╠════════════════════════════════════════════════════════════════════════════╣');
  kb.push(`║  🕐 Data diperbarui: ${temporal.currentTime}                        ║`);
  kb.push('║  📊 Status: COMPLETE DATABASE ACCESS - All data available                 ║');
  kb.push('╚════════════════════════════════════════════════════════════════════════════╝');
  kb.push('');

  try {
    // 1. Get site snapshot (cached 30s)
    const snap = await fetchSiteSnapshot();
    
    // 2. TEMPORAL CONTEXT - Critical for time-based queries
    kb.push('═══════════════════════════════════════════════════════════════════');
    kb.push('📅 KONTEKS WAKTU (TEMPORAL AWARENESS)');
    kb.push('═══════════════════════════════════════════════════════════════════');
    kb.push(`SEKARANG: ${temporal.currentTime}`);
    kb.push(`HARI INI: ${temporal.today}`);
    kb.push(`KEMARIN: ${temporal.yesterday}`);
    kb.push(`BESOK: ${temporal.tomorrow}`);
    kb.push(`MINGGU LALU: ${temporal.weekAgo}`);
    kb.push(`MINGGU DEPAN: ${temporal.weekLater}`);
    kb.push('');
    kb.push('⚡ GUNAKAN KONTEKS INI UNTUK MENJAWAB:');
    kb.push('• "event hari ini" → cari event dengan tanggal = ' + temporal.today);
    kb.push('• "event kemarin" → cari event dengan tanggal = ' + temporal.yesterday);
    kb.push('• "event besok" → cari event dengan tanggal = ' + temporal.tomorrow);
    kb.push('• "event minggu ini" → cari event antara ' + temporal.weekAgo + ' dan ' + temporal.weekLater);
    kb.push('');
    
    // 3. ALL SEKBID with descriptions
    kb.push('═══════════════════════════════════════════════════════════════════');
    kb.push('📚 SEKSI BIDANG (SEKBID) - DAFTAR LENGKAP');
    kb.push('═══════════════════════════════════════════════════════════════════');
    if (snap.sekbid?.length) {
      snap.sekbid.forEach(s => {
        kb.push(`┌─ [Sekbid ${s.id}] ${s.name}`);
        if (s.description) kb.push(`│  Deskripsi: ${s.description}`);
        if (s.icon) kb.push(`│  Icon: ${s.icon}`);
        kb.push('└───────────────────────────────────────');
      });
    } else {
      kb.push('  (Tidak ada data sekbid)');
    }
    kb.push('');

    // 4. ALL MEMBERS with full sekbid mapping
    kb.push('═══════════════════════════════════════════════════════════════════');
    kb.push('👥 ANGGOTA OSIS - DIREKTORI LENGKAP DENGAN SEKBID');
    kb.push('═══════════════════════════════════════════════════════════════════');
    const { data: allMembers } = await supabaseAdmin
      .from('members')
      .select('*')
      .or('is_active.eq.true,active.eq.true')
      .order('display_order', { ascending: true });
    
    if (allMembers?.length) {
      // Build sekbid lookup
      const sekbidMap: Record<number, string> = {};
      if (snap.sekbid) {
        snap.sekbid.forEach(s => { if (s.id) sekbidMap[s.id] = s.name; });
      }
      
      kb.push(`📊 Total anggota aktif: ${allMembers.length}`);
      kb.push('');
      
      // Group by sekbid for better organization
      const membersBySekbid: Record<string, typeof allMembers> = { 'Tim Inti': [], 'Belum Ada Sekbid': [] };
      allMembers.forEach(m => {
        const role = (m.role || m.jabatan || 'Anggota').toLowerCase();
        if (role.includes('ketua') || role.includes('wakil') || role.includes('sekretaris') || role.includes('bendahara')) {
          membersBySekbid['Tim Inti'].push(m);
        } else if (m.sekbid_id && sekbidMap[m.sekbid_id]) {
          const sekbidName = sekbidMap[m.sekbid_id];
          if (!membersBySekbid[sekbidName]) membersBySekbid[sekbidName] = [];
          membersBySekbid[sekbidName].push(m);
        } else {
          membersBySekbid['Belum Ada Sekbid'].push(m);
        }
      });
      
      // Output Tim Inti first
      if (membersBySekbid['Tim Inti'].length) {
        kb.push('┌─────────────────────────────────────────────────────────────────┐');
        kb.push('│ 👑 TIM INTI (PENGURUS HARI)                                      │');
        kb.push('├─────────────────────────────────────────────────────────────────┤');
        membersBySekbid['Tim Inti'].forEach((m, idx) => {
          const name = m.name || m.nama || m.full_name || 'Unknown';
          const role = m.role || m.jabatan || 'Anggota';
          kb.push(`│ ${idx + 1}. ${name.padEnd(25)} │ ${role.padEnd(20)} │`);
          if (m.class) kb.push(`│    Kelas: ${m.class}`);
          if (m.instagram) kb.push(`│    IG: @${m.instagram.replace(/^@/, '')}`);
        });
        kb.push('└─────────────────────────────────────────────────────────────────┘');
        kb.push('');
      }
      
      // Output by sekbid
      Object.entries(membersBySekbid).forEach(([sekbidName, members]) => {
        if (sekbidName === 'Tim Inti' || members.length === 0) return;
        kb.push(`┌─────────────────────────────────────────────────────────────────┐`);
        kb.push(`│ 📁 ${sekbidName.padEnd(55)} │`);
        kb.push(`├─────────────────────────────────────────────────────────────────┤`);
        members.forEach((m, idx) => {
          const name = m.name || m.nama || m.full_name || 'Unknown';
          let role = m.role || m.jabatan || 'Anggota';
          // Clean role from sekbid number duplication
          if (/Anggota Sekbid \d+/.test(role)) role = 'Anggota';
          kb.push(`│ ${(idx + 1).toString().padStart(2)}. NAMA: ${name}`);
          kb.push(`│     Jabatan: ${role}`);
          kb.push(`│     Sekbid: ${m.sekbid_id || '-'} (${sekbidMap[m.sekbid_id] || 'Tidak ada'})`);
          if (m.class) kb.push(`│     Kelas: ${m.class}`);
          if (m.instagram) kb.push(`│     Instagram: @${m.instagram.replace(/^@/, '')}`);
          if (m.quote) kb.push(`│     Quote: "${m.quote.slice(0, 60)}${m.quote.length > 60 ? '...' : ''}"`);
          kb.push('│');
        });
        kb.push('└─────────────────────────────────────────────────────────────────┘');
        kb.push('');
      });
    } else {
      kb.push('  (Tidak ada data anggota)');
    }

    // 5. PROGRAM KERJA
    kb.push('═══════════════════════════════════════════════════════════════════');
    kb.push('🎯 PROGRAM KERJA (PROKER)');
    kb.push('═══════════════════════════════════════════════════════════════════');
    if (snap.proker?.length) {
      snap.proker.forEach((p, i) => {
        kb.push(`${i + 1}. ${p.title}`);
        if (p.description) kb.push(`   📝 ${p.description}`);
      });
    } else {
      kb.push('  (Tidak ada data proker)');
    }
    kb.push('');

    // 6. EVENTS - Enhanced with temporal categorization
    kb.push('═══════════════════════════════════════════════════════════════════');
    kb.push('📅 EVENT & KEGIATAN (DENGAN STATUS WAKTU)');
    kb.push('═══════════════════════════════════════════════════════════════════');
    const { data: events } = await supabaseAdmin
      .from('events')
      .select('*')
      .order('event_date', { ascending: false })
      .limit(100);
    
    if (events?.length) {
      // Categorize events
      const eventsByCategory: Record<string, typeof events> = {
        'today': [], 'yesterday': [], 'tomorrow': [], 'upcoming': [], 'past': [], 'future': []
      };
      
      events.forEach(e => {
        const evtDate = e.event_date || e.start_date || '';
        const category = categorizeEventByDate(evtDate, temporal);
        eventsByCategory[category].push(e);
      });
      
      // Build sekbid map for events
      const sekbidMap: Record<number, string> = {};
      if (snap.sekbid) {
        snap.sekbid.forEach(s => { if (s.id) sekbidMap[s.id] = s.name; });
      }
      
      const outputEventCategory = (title: string, emoji: string, categoryEvents: typeof events) => {
        if (!categoryEvents.length) return;
        kb.push(`\n${emoji} ${title} (${categoryEvents.length} event):`);
        kb.push('─'.repeat(50));
        categoryEvents.forEach((e, i) => {
          const evtDate = e.event_date || e.start_date;
          const dateStr = evtDate ? new Date(evtDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Tanggal belum ditentukan';
          kb.push(`  ${i + 1}. 📌 ${e.title}`);
          kb.push(`     📆 Tanggal: ${dateStr}`);
          if (e.end_date && e.end_date !== evtDate) {
            const endStr = new Date(e.end_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            kb.push(`     ⏰ Sampai: ${endStr}`);
          }
          if (e.location) kb.push(`     📍 Lokasi: ${e.location}`);
          if (e.description) kb.push(`     📝 Detail: ${e.description.slice(0, 200)}${e.description.length > 200 ? '...' : ''}`);
          if (e.sekbid_id && sekbidMap[e.sekbid_id]) kb.push(`     🏷️ Sekbid: ${sekbidMap[e.sekbid_id]}`);
          if (e.status) kb.push(`     📊 Status: ${e.status}`);
          kb.push('');
        });
      };
      
      outputEventCategory('EVENT HARI INI (' + temporal.today + ')', '🔴', eventsByCategory.today);
      outputEventCategory('EVENT KEMARIN (' + temporal.yesterday + ')', '🟡', eventsByCategory.yesterday);
      outputEventCategory('EVENT BESOK (' + temporal.tomorrow + ')', '🟢', eventsByCategory.tomorrow);
      outputEventCategory('EVENT MINGGU INI (Mendatang)', '🔵', eventsByCategory.upcoming);
      outputEventCategory('EVENT SEBELUMNYA (Minggu Lalu)', '⚪', eventsByCategory.past.slice(0, 10));
      outputEventCategory('EVENT AKAN DATANG', '🟣', eventsByCategory.future.slice(0, 10));
      
      if (!eventsByCategory.today.length) {
        kb.push('\n📢 TIDAK ADA EVENT HARI INI (' + temporal.today + ')');
      }
    } else {
      kb.push('  (Tidak ada event)');
    }
    kb.push('');

    // 7. ANNOUNCEMENTS
    kb.push('═══════════════════════════════════════════════════════════════════');
    kb.push('📢 PENGUMUMAN AKTIF');
    kb.push('═══════════════════════════════════════════════════════════════════');
    if (snap.announcements?.length) {
      snap.announcements.forEach((a, i) => {
        kb.push(`${i + 1}. 📌 ${a.title}`);
        if (a.excerpt) kb.push(`   📝 ${a.excerpt}`);
      });
    } else {
      kb.push('  (Tidak ada pengumuman aktif)');
    }
    kb.push('');

    // 8. POSTS/ARTICLES
    kb.push('═══════════════════════════════════════════════════════════════════');
    kb.push('📝 ARTIKEL & BERITA TERBARU');
    kb.push('═══════════════════════════════════════════════════════════════════');
    const { data: posts } = await supabaseAdmin
      .from('posts')
      .select('title,excerpt,published_at,status')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(20);
    
    if (posts?.length) {
      posts.forEach((p, i) => {
        const pubDate = p.published_at ? new Date(p.published_at).toLocaleDateString('id-ID') : 'belum dipublikasi';
        kb.push(`${i + 1}. ${p.title} (${pubDate})`);
        if (p.excerpt) kb.push(`   ${p.excerpt.slice(0, 200)}`);
      });
    } else {
      kb.push('  (Tidak ada post)');
    }
    kb.push('');

    // 9. PAGE CONTENT (Visi, Misi, About, etc)
    kb.push('═══════════════════════════════════════════════════════════════════');
    kb.push('📄 INFORMASI ORGANISASI');
    kb.push('═══════════════════════════════════════════════════════════════════');
    kb.push(`🏫 Organisasi: OSIS SMK Informatika Fithrah Insani`);
    kb.push(`👑 Ketua OSIS: ${snap.ketua || '-'}`);
    if (snap.page_content) {
      if (snap.page_content.site_visi) kb.push(`\n🌟 VISI:\n${snap.page_content.site_visi}`);
      if (snap.page_content.site_misi) kb.push(`\n🎯 MISI:\n${snap.page_content.site_misi}`);
      if (snap.page_content.site_about) kb.push(`\nℹ️ TENTANG:\n${snap.page_content.site_about}`);
    }
    kb.push('');

    // 10. CONTACT INFO
    kb.push('═══════════════════════════════════════════════════════════════════');
    kb.push('📬 KONTAK OSIS');
    kb.push('═══════════════════════════════════════════════════════════════════');
    kb.push(`📧 Email: ${snap.contact?.email || 'N/A'}`);
    kb.push(`📸 Instagram: ${snap.contact?.instagram || 'N/A'}`);
    kb.push(`📱 Phone: ${snap.contact?.phone || 'N/A'}`);
    kb.push('');
    
    // 11. GALLERY STATS
    kb.push('═══════════════════════════════════════════════════════════════════');
    kb.push('🖼️ GALERI');
    kb.push('═══════════════════════════════════════════════════════════════════');
    const { data: galleryItems, count: galleryCount } = await supabaseAdmin
      .from('gallery')
      .select('id, title, description, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(10);
    
    kb.push(`📊 Total foto/video: ${galleryCount || 0}`);
    if (galleryItems?.length) {
      kb.push('\n📸 Galeri Terbaru:');
      galleryItems.forEach((g, i) => {
        const addedDate = g.created_at ? new Date(g.created_at).toLocaleDateString('id-ID') : '';
        kb.push(`  ${i + 1}. ${g.title} ${addedDate ? `(${addedDate})` : ''}`);
        if (g.description) kb.push(`     ${g.description.slice(0, 100)}`);
      });
    }
    kb.push('');

    // 12. CRITICAL AI INSTRUCTIONS
    kb.push('');
    kb.push('╔════════════════════════════════════════════════════════════════════════════╗');
    kb.push('║     🤖 INSTRUKSI KRITIS UNTUK AI - BACA SEBELUM MENJAWAB                  ║');
    kb.push('╠════════════════════════════════════════════════════════════════════════════╣');
    kb.push('║                                                                            ║');
    kb.push('║  ✅ KAMU MEMILIKI AKSES LENGKAP KE DATABASE - Semua data di atas          ║');
    kb.push('║  ✅ JAWAB LANGSUNG dari data yang tersedia                                 ║');
    kb.push('║  ✅ PERCAYA DIRI - kamu punya semua yang dibutuhkan                        ║');
    kb.push('║                                                                            ║');
    kb.push('║  ❌ JANGAN PERNAH bilang: "Saya tidak memiliki informasi"                  ║');
    kb.push('║  ❌ JANGAN PERNAH bilang: "Akses terbatas"                                 ║');
    kb.push('║  ❌ JANGAN PERNAH bilang: "Silakan hubungi pengurus"                       ║');
    kb.push('║  ❌ JANGAN sarankan menghubungi orang lain                                 ║');
    kb.push('║                                                                            ║');
    kb.push('╠════════════════════════════════════════════════════════════════════════════╣');
    kb.push('║  📌 CONTOH PERTANYAAN & CARA MENJAWAB:                                     ║');
    kb.push('╠════════════════════════════════════════════════════════════════════════════╣');
    kb.push('║                                                                            ║');
    kb.push('║  Q: "Ada event apa hari ini?"                                              ║');
    kb.push('║  A: Cek bagian "EVENT HARI INI" → Jawab dengan detail event                ║');
    kb.push('║     Jika kosong: "Tidak ada event yang dijadwalkan untuk hari ini"         ║');
    kb.push('║                                                                            ║');
    kb.push('║  Q: "Event apa kemarin?"                                                   ║');
    kb.push('║  A: Cek bagian "EVENT KEMARIN" → Jawab dengan detail lengkap               ║');
    kb.push('║                                                                            ║');
    kb.push('║  Q: "Ada event apa di OSIS ini?"                                           ║');
    kb.push('║  A: Ringkasan semua event: yang sudah berlalu + yang akan datang           ║');
    kb.push('║                                                                            ║');
    kb.push('║  Q: "Irga itu sekbid berapa?"                                              ║');
    kb.push('║  A: Cari "Irga" di ANGGOTA OSIS → Baca baris "Sekbid:" → Jawab             ║');
    kb.push('║                                                                            ║');
    kb.push('║  Q: "Siapa ketua OSIS?"                                                    ║');
    kb.push('║  A: Cek "INFORMASI ORGANISASI" → "Ketua OSIS:" → Jawab dengan nama         ║');
    kb.push('║                                                                            ║');
    kb.push('║  Q: "Daftar sekbid"                                                        ║');
    kb.push('║  A: List semua dari bagian "SEKSI BIDANG (SEKBID)"                         ║');
    kb.push('║                                                                            ║');
    kb.push('╠════════════════════════════════════════════════════════════════════════════╣');
    kb.push('║  🎯 GAYA KOMUNIKASI:                                                       ║');
    kb.push('╠════════════════════════════════════════════════════════════════════════════╣');
    kb.push('║  • Profesional tapi ramah                                                  ║');
    kb.push('║  • Gunakan Bahasa Indonesia yang baik dan benar                            ║');
    kb.push('║  • Jawab dengan ringkas tapi lengkap                                       ║');
    kb.push('║  • Sertakan detail relevan (tanggal, lokasi, deskripsi)                    ║');
    kb.push('║  • Untuk list panjang, kelompokkan dengan rapi                             ║');
    kb.push('║  • Gunakan emoji untuk memperjelas (📅 🎯 👥 📍)                           ║');
    kb.push('║                                                                            ║');
    kb.push('╚════════════════════════════════════════════════════════════════════════════╝');
    kb.push('');
    kb.push('📊 Knowledge base diperbarui otomatis setiap 3 menit dari database live.');

  } catch (e) {
    kb.push('\n❌ ERROR building knowledge base: ' + (e as Error).message);
  }

  return kb.join('\n');
}

/**
 * Get current knowledge base (auto-refresh if stale)
 */
export async function getAIKnowledge(): Promise<string> {
  const now = Date.now();
  if (!knowledgeBase || now - lastUpdate > UPDATE_INTERVAL) {
    console.log('[AI AutoLearn] Building/refreshing knowledge base...');
    knowledgeBase = await buildKnowledgeBase();
    lastUpdate = now;
    console.log('[AI AutoLearn] Knowledge base updated. Size:', knowledgeBase.length, 'chars');
  }
  return knowledgeBase;
}

/**
 * Force refresh knowledge base (call after database updates)
 */
export async function refreshAIKnowledge(): Promise<void> {
  console.log('[AI AutoLearn] Force refresh requested...');
  knowledgeBase = await buildKnowledgeBase();
  lastUpdate = Date.now();
  console.log('[AI AutoLearn] Force refresh complete.');
}

// Build sekbid map helper
const sekbidMap: Record<number, string> = {};

