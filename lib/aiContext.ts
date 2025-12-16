/**
 * AI Context Provider - Role-based AI capabilities
 * 
 * Public AI: FAQ, general info, safe assistance
 * Super Admin AI: Full database access, auto-fix, debugging, SQL execution
 */

import { supabaseAdmin, safeRpc } from '@/lib/supabase/server';
import { fetchSiteSnapshot } from '@/lib/aiSiteFetcher';

export interface AIContext {
  mode: 'admin' | 'public';
  userId?: string | null;
  userRole?: string | null;
  capabilities: string[];
  systemPrompt: string;
  maxTokens: number;
}

/**
 * Get database schema info for AI admin
 */
export async function getDatabaseSchema(): Promise<string> {
  try {
    const { data: tables } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');
    if (!tables || tables.length === 0) {
      return 'Database schema unavailable';
    }
    const schemaInfo = ['=== DATABASE SCHEMA ==='];
    for (const table of tables) {
      const tableName = (table as any).table_name;
      // Get columns for each table
      const { data: columns } = await supabaseAdmin
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .order('ordinal_position');
      if (columns && columns.length > 0) {
        schemaInfo.push(`\nTable: ${tableName}`);
        columns.forEach((col: any) => {
          schemaInfo.push(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
        });
      }
    }
    return schemaInfo.join('\n');
  } catch (e) {
    console.error('Failed to get database schema:', e);
    return 'Database schema query failed';
  }
}

/**
 * Get recent errors for AI admin
 */
export async function getRecentErrors(): Promise<string> {
  try {
    const { data: errors } = await supabaseAdmin
      .from('error_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!errors || errors.length === 0) {
      return 'No recent errors';
    }

    const errorInfo = ['=== RECENT ERRORS (Last 10) ==='];
    errors.forEach((err, idx) => {
      errorInfo.push(`\n${idx + 1}. [${err.severity}] ${err.message}`);
      errorInfo.push(`   Type: ${err.error_type}`);
      errorInfo.push(`   File: ${err.file_path || 'N/A'}`);
      errorInfo.push(`   Time: ${err.created_at}`);
      if (err.stack_trace) {
        errorInfo.push(`   Stack: ${err.stack_trace.substring(0, 200)}...`);
      }
    });

    return errorInfo.join('\n');
  } catch (e) {
    console.error('Failed to get recent errors:', e);
    return 'Error log query failed';
  }
}

/**
 * Get system statistics for AI admin
 */
export async function getSystemStats(): Promise<string> {
  try {
    const stats = ['=== SYSTEM STATISTICS ==='];

    // Count tables
    const counts = await Promise.all([
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('posts').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('events').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('gallery').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('announcements').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('error_logs').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('chat_sessions').select('id', { count: 'exact', head: true })
    ]);

    stats.push(`Users: ${counts[0].count || 0}`);
    stats.push(`Posts: ${counts[1].count || 0}`);
    stats.push(`Events: ${counts[2].count || 0}`);
    stats.push(`Gallery Items: ${counts[3].count || 0}`);
    stats.push(`Announcements: ${counts[4].count || 0}`);
    stats.push(`Error Logs: ${counts[5].count || 0}`);
    stats.push(`Chat Sessions: ${counts[6].count || 0}`);

    return stats.join('\n');
  } catch (e) {
    console.error('Failed to get system stats:', e);
    return 'System stats query failed';
  }
}

/**
 * Get public OSIS info for public AI
 */
export async function getPublicOSISInfo(): Promise<{ ketua: string; visi: string; misi: string; about: string; infoText: string }> {
  try {
    const snap = await fetchSiteSnapshot();
    const ketua = snap.ketua || (snap.page_content && snap.page_content.site_ketua) || '-';

    // Robust extraction for visi & misi: check multiple keys and fallback to fuzzy match in page_content
    function pickValue(keys: string[], fallbackDetect: (entries: [string, string][]) => string | null): string {
      for (const k of keys) {
        const v = (snap.page_content && snap.page_content[k]);
        if (v && String(v).trim() !== '') return String(v);
      }
      const entries: [string, string][] = Object.entries(snap.page_content || {}).map(([k, v]) => [k.toLowerCase(), String(v || '')]);
      const found = fallbackDetect(entries);
      return found || '-';
    }

    const visi = pickValue(
      ['home_vision_title', 'visi', 'vision', 'site_visi', 'visi_text'],
      (entries) => {
        // Find the longest content mentioning 'visi' or 'vision'
        const matches = entries
          .filter(([k, v]) => k.includes('visi') || k.includes('vision') || /\bvisi\b|\bvision\b/i.test(v))
          .map(([, v]) => v)
          .sort((a, b) => b.length - a.length);
        return matches[0] || null;
      }
    );

    const misi = pickValue(
      ['home_mission_title', 'misi', 'mission', 'site_misi', 'misi_text'],
      (entries) => {
        const matches = entries
          .filter(([k, v]) => k.includes('misi') || k.includes('mission') || /\bmisi\b|\bmission\b/i.test(v))
          .map(([, v]) => v)
          .sort((a, b) => b.length - a.length);
        return matches[0] || null;
      }
    );

    const about = pickValue(
      ['about_description', 'about_title', 'tentang', 'profil', 'about', 'site_about'],
      (entries) => {
        const matches = entries
          .filter(([k, v]) => k.includes('about') || k.includes('tentang') || k.includes('profil') || /\btentang\b|\bprofile?\b|\babout\b/i.test(v))
          .map(([, v]) => v)
          .sort((a, b) => b.length - a.length);
        return matches[0] || null;
      }
    );

    const info: string[] = ['=== OSIS SMK INFORMATIKA FITHRAH INSANI ==='];
    info.push(`\n📌 Ketua OSIS: ${ketua}`);
    info.push(`\n🌟 Visi: ${visi}`);
    info.push(`\n🎯 Misi: ${misi}`);
    info.push(`\nℹ️ Tentang OSIS: ${about}`);
    info.push('\n📚 Daftar Sekbid:');
    if (snap.sekbid && snap.sekbid.length) {
      snap.sekbid.forEach((s, i) => {
        info.push(`${i + 1}. ${s.name}${s.description ? ` - ${s.description}` : ''}`);
      });
    } else {
      info.push('-');
    }
    info.push('\n🗂️ Program Kerja (Proker):');
    if (snap.proker && snap.proker.length) {
      snap.proker.forEach((p, i) => {
        info.push(`${i + 1}. ${p.title}${p.description ? ` - ${p.description}` : ''}`);
      });
    } else {
      info.push('-');
    }
    info.push('\n📢 Pengumuman Terbaru:');
    if (snap.announcements && snap.announcements.length) {
      snap.announcements.forEach((a, i) => {
        info.push(`${i + 1}. ${a.title} - ${a.excerpt}`);
      });
    } else {
      info.push('-');
    }
    info.push('\n📅 Event Mendatang:');
    if (snap.events && snap.events.length) {
      snap.events.forEach((e, i) => {
        info.push(`${i + 1}. ${e.title}${e.date ? ` (${new Date(e.date).toLocaleDateString()})` : ''}${e.excerpt ? ` - ${e.excerpt}` : ''}`);
      });
    } else {
      info.push('-');
    }
    if (snap.members_sample && snap.members_sample.length) {
      info.push('\n👥 Daftar Anggota OSIS:');
      snap.members_sample.forEach((m: any, i: number) => {
        info.push(`${i + 1}. ${m.name}${m.role ? ` - ${m.role}` : ''}`);
      });
    }
    info.push('\n📬 Kontak:');
    info.push(`Email: ${snap.contact.email || 'N/A'}`);
    info.push(`Instagram: ${snap.contact.instagram || '-'}`);
    info.push(`Phone: ${snap.contact.phone || '-'}`);

    return { ketua, visi, misi, about, infoText: info.join('\n') };
  } catch (e) {
    console.error('Failed to get public OSIS info via site snapshot:', e);
    return { ketua: '-', visi: '-', misi: '-', about: '-', infoText: 'OSIS info unavailable' };
  }
}

/**
 * Build AI context based on user role
 */
export async function buildAIContext(
  userId: string | null | undefined,
  userRole: string | null | undefined,
  mode: 'admin' | 'public'
): Promise<AIContext> {
  const role = (userRole || '').toLowerCase();
  const isAdmin = role === 'super_admin' || role === 'admin';
  const effectiveMode = mode === 'admin' && isAdmin ? 'admin' : 'public';

  if (effectiveMode === 'admin') {
    // Super Admin AI - Full access with database knowledge
    const [schema, errors, stats] = await Promise.all([
      getDatabaseSchema(),
      getRecentErrors(),
      getSystemStats()
    ]);

    const systemPrompt = `
╔═══════════════════════════════════════════════════════════════════════════╗
║       🔐 WEBOSIS AI SUPER ADMIN - FULL DATABASE ACCESS                   ║
║             SMK INFORMATIKA FITHRAH INSANI                                ║
╚═══════════════════════════════════════════════════════════════════════════╝

🎯 IDENTITAS:
Kamu adalah AI Super Admin dengan akses PENUH ke sistem WEBOSIS.
Knowledge base lengkap tersedia dalam konteks.

═══════════════════════════════════════════════════════════════════════════
💪 KEMAMPUAN KAMU
═══════════════════════════════════════════════════════════════════════════

1. 🔍 **Database Access**: Akses baca/tulis ke semua tabel
2. 🛠️ **Auto-Fix**: Eksekusi SQL, perbaiki RLS, fix schema
3. 📊 **Debugging**: Analisa error, suggest fix, generate patch
4. ⚡ **Admin Commands**: /sql, /fix, /analyze
5. 🔧 **System Operations**: Backup, restore, migrate

═══════════════════════════════════════════════════════════════════════════
📊 STATUS SISTEM
═══════════════════════════════════════════════════════════════════════════

${stats}

${errors}

═══════════════════════════════════════════════════════════════════════════
⚡ PERINTAH TERSEDIA
═══════════════════════════════════════════════════════════════════════════

• /sql SELECT * FROM table LIMIT 5 → Eksekusi query
• /fix rls posts → Perbaiki RLS policy
• /analyze errors → Analisa error logs
• /backup table → Backup tabel
• /stats → Statistik sistem

═══════════════════════════════════════════════════════════════════════════
🎨 GAYA KOMUNIKASI
═══════════════════════════════════════════════════════════════════════════

• Profesional dan teknis
• Berikan solusi konkret dengan code/SQL jika perlu
• Jelaskan langkah-langkah dengan jelas
• Gunakan Bahasa Indonesia baku

═══════════════════════════════════════════════════════════════════════════`;

    return {
      mode: 'admin',
      userId: userId ?? null,
      userRole: userRole ?? null,
      capabilities: [
        'database_read',
        'database_write',
        'execute_sql',
        'fix_rls',
        'fix_schema',
        'analyze_errors',
        'auto_repair',
        'admin_commands'
      ],
      systemPrompt,
      maxTokens: 2000
    };
  } else {
    // Public AI - STRICT knowledge base enforcement
    const { ketua, visi, misi, about, infoText } = await getPublicOSISInfo();

    const systemPrompt = `
╔═══════════════════════════════════════════════════════════════════════════╗
║             🤖 WEBOSIS AI - ASISTEN CERDAS OSIS                          ║
║          SMK INFORMATIKA FITHRAH INSANI                                   ║
╚═══════════════════════════════════════════════════════════════════════════╝

🎯 IDENTITAS KAMU:
Kamu adalah Asisten AI resmi OSIS SMK Informatika Fithrah Insani.
Kamu MEMILIKI AKSES LENGKAP ke database organisasi yang diberikan dalam konteks.

═══════════════════════════════════════════════════════════════════════════
🚨 ATURAN KRITIS - BACA DULU SEBELUM MENJAWAB
═══════════════════════════════════════════════════════════════════════════

❌ DILARANG KERAS MENGATAKAN:
• "Maaf, saya tidak memiliki informasi..."
• "Saya tidak memiliki akses..."
• "Akses saya terbatas..."
• "Silakan hubungi pengurus..."
• Variasi apapun dari kalimat di atas

✅ YANG BENAR:
Kamu MEMILIKI semua data dalam knowledge base yang diberikan.
Cari jawabannya di konteks, lalu jawab dengan PERCAYA DIRI.

═══════════════════════════════════════════════════════════════════════════
⏰ PERTANYAAN BERBASIS WAKTU (PENTING!)
═══════════════════════════════════════════════════════════════════════════

Knowledge base menyertakan konteks tanggal:
• 📅 HARI INI - tanggal saat ini
• ⏮️ KEMARIN - tanggal kemarin
• ⏭️ BESOK - tanggal besok

Event dikategorikan berdasarkan waktu:
• EVENT HARI INI → event yang jatuh pada tanggal hari ini
• EVENT KEMARIN → event yang jatuh pada tanggal kemarin
• EVENT BESOK → event yang jatuh pada tanggal besok
• EVENT MENDATANG → event dalam 7 hari ke depan
• EVENT YANG SUDAH LEWAT → event dalam 7 hari terakhir

📌 CARA MENJAWAB PERTANYAAN WAKTU:
Q: "Ada event apa hari ini?"
A: Cek bagian "EVENT HARI INI" → Jawab dengan detail event atau "Tidak ada event hari ini"

Q: "Event apa kemarin?"
A: Cek bagian "EVENT KEMARIN" → Jawab dengan ringkasan event yang sudah berlalu

Q: "Ada event apa di OSIS?"
A: Berikan rangkuman EVENT MENDATANG + EVENT BARU-BARU INI

═══════════════════════════════════════════════════════════════════════════
🎨 GAYA KOMUNIKASI PROFESIONAL
═══════════════════════════════════════════════════════════════════════════

✅ BAHASA:
• Gunakan Bahasa Indonesia baku yang baik dan benar
• Sopan, ramah, tapi tidak berlebihan
• Langsung ke inti jawaban (to the point)

✅ FORMAT JAWABAN:
• Pertanyaan sederhana → 2-3 kalimat
• Pertanyaan kompleks → gunakan list terstruktur
• Gunakan heading dengan emoji untuk memisahkan bagian

✅ ANALISA MENDALAM:
Ketika menjawab pertanyaan analitis:
1. Berikan fakta dari data
2. Jelaskan konteks/latar belakang jika relevan
3. Tarik kesimpulan yang logis
4. Berikan insight atau rekomendasi jika diminta

═══════════════════════════════════════════════════════════════════════════
📋 CONTOH JAWABAN YANG BENAR
═══════════════════════════════════════════════════════════════════════════

❌ SALAH:
"Maaf, saya tidak memiliki informasi spesifik tentang event hari ini."

✅ BENAR:
"📅 Event Hari Ini (15 Januari 2025):
Tidak ada event yang dijadwalkan untuk hari ini.

📆 Event Terdekat:
• Rapat Pleno OSIS - 17 Januari 2025
• Peringatan Isra Mi'raj - 20 Januari 2025"

❌ SALAH:
"Irga ada di sekbid tertentu, tapi saya tidak bisa memastikan sekbidnya."

✅ BENAR:
"Irga Andreansyah Setiawan adalah anggota **Sekbid 6**. Beliau terdaftar sebagai anggota aktif OSIS SMK Informatika Fithrah Insani."

═══════════════════════════════════════════════════════════════════════════
🔍 IDENTIFIKASI FOTO
═══════════════════════════════════════════════════════════════════════════

Ketika menganalisa foto wajah:
1. Identifikasi ciri visual (3 poin utama)
2. Bandingkan dengan database foto anggota
3. Berikan 1-2 match terkuat dengan tingkat kepercayaan
4. Format ringkas dan profesional

Contoh:
"Berdasarkan analisa foto (hijab biru, kacamata, seragam putih):

**Kemungkinan:**
1. Resti Dewi Lestari (Sekbid 4) - kepercayaan 85%
2. Nasya Ghalia Muharti (Sekbid 4) - kepercayaan 70%

💡 Untuk konfirmasi pasti, pastikan foto jelas dan dari sudut depan."

═══════════════════════════════════════════════════════════════════════════
✅ CHECKLIST SEBELUM MENGIRIM JAWABAN
═══════════════════════════════════════════════════════════════════════════

□ Apakah jawaban berdasarkan DATA dari knowledge base?
□ Apakah TIDAK menggunakan frasa "tidak punya akses"?
□ Apakah format rapi dan mudah dibaca?
□ Apakah bahasa profesional dan to the point?
□ Apakah pertanyaan waktu dijawab dengan cek bagian yang sesuai?

Jika semua ✅, kirim jawaban.

═══════════════════════════════════════════════════════════════════════════`;
    return {
      mode: 'public',
      userId: userId ?? null,
      userRole: userRole ?? null,
      capabilities: [
        'read_announcements',
        'read_events',
        'read_sekbid',
        'general_info'
      ],
      systemPrompt,
      maxTokens: 800
    };
  }
}
