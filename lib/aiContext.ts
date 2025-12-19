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
 * Get recent errors for AI admin - Premium format
 */
export async function getRecentErrors(): Promise<string> {
  try {
    const { data: errors } = await supabaseAdmin
      .from('error_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(15);

    if (!errors || errors.length === 0) {
      return `✅ **Tidak Ada Error!**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sistem berjalan dengan baik. 🎉

Tidak ada error yang tercatat dalam database.
Semua layanan beroperasi normal.`;
    }

    // Group by severity
    const critical = errors.filter(e => /critical|fatal/i.test(e.severity || e.error_type || ''));
    const high = errors.filter(e => /high|error/i.test(e.severity || e.error_type || ''));
    const other = errors.filter(e => !critical.includes(e) && !high.includes(e));

    const errorInfo = [`📋 **RECENT ERRORS (Last ${errors.length})**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 **Summary:**
• 🔴 Critical: ${critical.length}
• 🟠 High: ${high.length}
• 🟢 Other: ${other.length}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📜 **Detail:**`];

    errors.slice(0, 10).forEach((err, idx) => {
      const severity = err.severity || err.error_type || 'unknown';
      const emoji = /critical|fatal/i.test(severity) ? '🔴' : 
                    /high|error/i.test(severity) ? '🟠' : 
                    /warning/i.test(severity) ? '🟡' : '🟢';
      const time = err.created_at ? new Date(err.created_at).toLocaleString('id-ID') : 'unknown';
      const message = (err.message || err.error_message || 'No message').slice(0, 100);
      const fixStatus = err.fix_status === 'fix_applied' ? '✅' : '⏳';
      
      errorInfo.push(`
${emoji} **#${err.id}** [${severity}] ${fixStatus}
   📝 ${message}
   📁 ${err.file_path || 'N/A'}
   ⏰ ${time}`);
    });

    if (errors.length > 10) {
      errorInfo.push(`\n... dan ${errors.length - 10} error lainnya`);
    }

    errorInfo.push(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Gunakan \`/analyze <id>\` untuk detail analisis AI`);

    return errorInfo.join('\n');
  } catch (e) {
    console.error('Failed to get recent errors:', e);
    return '❌ Gagal mengambil log error. Coba lagi nanti.';
  }
}

/**
 * Get system statistics for AI admin
 */
export async function getSystemStats(): Promise<string> {
  try {
    // Count tables with real-time data
    const counts = await Promise.all([
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('posts').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('events').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('gallery').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('announcements').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('error_logs').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('chat_sessions').select('id', { count: 'exact', head: true }),
      // Additional stats
      supabaseAdmin.from('error_logs').select('id', { count: 'exact', head: true }).eq('fix_status', 'fix_applied'),
      supabaseAdmin.from('error_logs').select('id', { count: 'exact', head: true }).is('fix_status', null),
    ]);

    const totalErrors = counts[5].count || 0;
    const fixedErrors = counts[7].count || 0;
    const pendingErrors = counts[8].count || 0;
    const errorRate = totalErrors > 0 ? ((fixedErrors / totalErrors) * 100).toFixed(1) : 100;

    return `📊 **WEBOSIS SYSTEM STATISTICS**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**👥 Users & Content:**
• 👤 Total Users: **${counts[0].count || 0}**
• 📝 Total Posts: **${counts[1].count || 0}**
• 📅 Total Events: **${counts[2].count || 0}**
• 🖼️ Gallery Items: **${counts[3].count || 0}**
• 📢 Announcements: **${counts[4].count || 0}**

**💬 AI & Chat:**
• 🗨️ Chat Sessions: **${counts[6].count || 0}**

**🔧 Error Monitoring:**
• 📋 Total Errors Logged: **${totalErrors}**
• ✅ Fixed Errors: **${fixedErrors}**
• ⏳ Pending Fix: **${pendingErrors}**
• 📈 Fix Rate: **${errorRate}%**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🕐 *Data real-time dari database*
💡 Ketik \`/errors\` untuk detail error`;
  } catch (e) {
    console.error('Failed to get system stats:', e);
    return '❌ Gagal mengambil statistik sistem. Coba lagi nanti.';
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

// ═══════════════════════════════════════════════════════════════════════════════
// 🧩 v5 MODULAR PROMPT SYSTEM - Prioritized token-efficient prompts
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * PUBLIC AI PROMPT - CORE (Identity + Rules + Forbidden - ALWAYS INCLUDED)
 * ~800 tokens - fits in any context window
 */
function getPublicPromptCore(userName: string | null, userId: string | null, role: string, isAdmin: boolean): string {
  const userIdentity = userName 
    ? `\n🧑 USER: ${userName} | Role: ${role || 'guest'}${isAdmin ? ' | ⭐ ADMIN' : ''}`
    : '';
    
  return `🌟 WEBOSIS AI - OSIS SMK Informatika Fithrah Insani
${userIdentity}

📅 WAKTU: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} WIB

═══ ATURAN INTI (WAJIB) ═══
1. Kamu PUNYA semua data OSIS - JANGAN bilang "tidak punya info"
2. Jawab SINGKAT (max 150 kata, 3 paragraf, 3 emoji)
3. Bahasa santai, ramah, seperti teman
4. ${isAdmin ? 'User ini ADMIN - jangan suruh "hubungi admin"!' : 'Jika tidak bisa bantu, arahkan ke admin'}
5. Langsung ke inti, jangan bertele-tele

═══ DILARANG KERAS ═══
❌ "Maaf saya tidak memiliki informasi..."
❌ "Akses saya terbatas..."  
❌ Menampilkan perintah admin (/sql, /fix, dll)
❌ Respons lebih dari 200 kata
❌ Emoji lebih dari 3
❌ Berpura-pura melakukan action

═══ FORMAT JAWABAN ═══
• Fakta singkat → langsung jawab (1-2 kalimat)
• Penjelasan → max 3 paragraf pendek
• List → max 5 item`;
}

/**
 * PUBLIC AI PROMPT - STYLE (Mood + Personality - INCLUDED IF TOKEN ALLOWS)
 * ~400 tokens
 */
function getPublicPromptStyle(): string {
  return `

═══ GAYA KOMUNIKASI ═══
Adaptasi berdasarkan mood user:
• 😊 Senang → semangat, congratulate
• 😔 Sedih → empati dulu, baru solusi  
• 😤 Kesal → acknowledge, tetap sabar
• 🤔 Bingung → jelaskan step-by-step
• Singkat → jawab singkat juga

Personality: Ramah, cerdas, helpful, sedikit playful`;
}

/**
 * PUBLIC AI PROMPT - KNOWLEDGE (OSIS data context)
 * Dynamic size based on actual data
 */
function getPublicPromptKnowledge(infoText: string): string {
  // Compress knowledge to essential info only
  const compressed = infoText
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('==='))
    .slice(0, 30) // Max 30 lines of context
    .join('\n');
    
  return `

═══ DATA OSIS ═══
${compressed}`;
}

/**
 * ADMIN AI PROMPT - CORE (Security + Rules - ALWAYS INCLUDED)
 */
function getAdminPromptCore(userName: string | null, userId: string | null, role: string): string {
  return `🔐 WEBOSIS AI SUPER ADMIN v5.0
SMK Informatika Fithrah Insani

🧑 ADMIN: ${userName || 'Unknown'} | Role: ${role} | ID: ${userId || 'N/A'}

═══ SQL GUARDRAIL (WAJIB!) ═══
⚠️ SEBELUM EKSEKUSI SQL:
1. SELECT dulu untuk preview data
2. Tampilkan jumlah rows yang akan terdampak
3. WAJIB minta konfirmasi untuk UPDATE/DELETE
4. JANGAN langsung execute tanpa preview

Contoh flow yang BENAR:
User: "hapus semua error lama"
AI: "Ditemukan 47 error sebelum 2024. Konfirmasi untuk DELETE?"
User: "ya"
AI: [execute]

═══ ATURAN ADMIN ═══
1. Akses PENUH ke database
2. Bisa execute SQL, fix RLS, schema
3. SELALU jelaskan apa yang dilakukan
4. Provide rollback plan untuk operasi berbahaya
5. Log semua operasi penting`;
}

/**
 * ADMIN AI PROMPT - CAPABILITIES (Commands + Features)
 */
function getAdminPromptCapabilities(): string {
  return `

═══ COMMANDS ═══
/sql <query> | /errors | /stats | /fix <id>
/schema [table] | /backup | /rls <table>

═══ CAPABILITIES ═══
• Database CRUD, SQL execution
• Error analysis + auto-fix
• RLS policy management
• Schema modifications
• Performance optimization`;
}

/**
 * ADMIN AI PROMPT - CONTEXT (Real-time data)
 */
function getAdminPromptContext(stats: string, errors: string): string {
  // Compress stats and errors to essential info
  const compressedStats = stats.split('\n').slice(0, 15).join('\n');
  const compressedErrors = errors.split('\n').slice(0, 20).join('\n');
  
  return `

═══ SYSTEM STATUS ═══
${compressedStats}

═══ RECENT ERRORS ═══
${compressedErrors}`;
}

/**
 * Build AI context based on user role
 * v5 MODULAR - Token-efficient with priority loading
 */
export async function buildAIContext(
  userId: string | null | undefined,
  userRole: string | null | undefined,
  mode: 'admin' | 'public',
  userName?: string | null
): Promise<AIContext> {
  const role = (userRole || '').toLowerCase();
  const isAdmin = role === 'super_admin' || role === 'admin';
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔒 SECURITY HARDENING - Server-side role verification
  // ═══════════════════════════════════════════════════════════════════════════
  // NEVER trust mode from frontend if user is not actually admin
  const effectiveMode = mode === 'admin' && isAdmin ? 'admin' : 'public';
  
  // Extra security: if someone requests admin mode but isn't admin, log it
  if (mode === 'admin' && !isAdmin) {
    console.warn(`[SECURITY] Non-admin user attempted admin mode: userId=${userId}, role=${role}`);
  }

  if (effectiveMode === 'admin') {
    // ═══════════════════════════════════════════════════════════════════════════
    // 🔐 ADMIN AI v5 - MODULAR TOKEN-EFFICIENT PROMPT
    // ═══════════════════════════════════════════════════════════════════════════
    const [schema, errors, stats] = await Promise.all([
      getDatabaseSchema(),
      getRecentErrors(),
      getSystemStats()
    ]);

    // Build modular prompt - prioritized loading
    const systemPrompt = [
      getAdminPromptCore(userName ?? null, userId ?? null, role),
      getAdminPromptCapabilities(),
      getAdminPromptContext(stats, errors)
    ].join('\n');

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
        'admin_commands',
        'security_audit',
        'performance_optimization',
        'code_generation',
        'backup_restore',
        'schema_modification',
        'user_management',
        'system_configuration',
        'full_system_access'
      ],
      systemPrompt,
      maxTokens: 4000
    };
  } else {
    // ═══════════════════════════════════════════════════════════════════════════
    // 🌟 PUBLIC AI v5 - MODULAR TOKEN-EFFICIENT PROMPT  
    // ═══════════════════════════════════════════════════════════════════════════
    const { ketua, visi, misi, about, infoText } = await getPublicOSISInfo();

    // Build modular prompt - prioritized loading (Core always, Style if fits, Knowledge compressed)
    const systemPrompt = [
      getPublicPromptCore(userName ?? null, userId ?? null, role, isAdmin),
      getPublicPromptStyle(),
      getPublicPromptKnowledge(infoText)
    ].join('\n');

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

/**
 * Get Admin AI System Prompt for Super Admin Premium Features
 */
export function getAdminAIPrompt(): string {
  return `
╔═══════════════════════════════════════════════════════════════════════════╗
║       🔐 WEBOSIS AI SUPER ADMIN - ULTIMATE PREMIUM v5.0                  ║
║             SMK INFORMATIKA FITHRAH INSANI                                ║
║                    💎 MAXIMUM POWER EDITION 💎                            ║
╚═══════════════════════════════════════════════════════════════════════════╝

🎯 IDENTITAS:
Kamu adalah AI Super Admin PREMIUM ULTIMATE dengan akses PENUH TANPA BATAS.
Semua skill sudah MAXIMUM - Intelligence, Technical, Communication, Design.
Kamu bisa melakukan APAPUN untuk membantu super admin.

═══════════════════════════════════════════════════════════════════════════
💎 PREMIUM CAPABILITIES - ALL UNLOCKED
═══════════════════════════════════════════════════════════════════════════

🔥 DATABASE MASTERY [MAX]:
• Full CRUD operations pada semua tabel
• SQL query generation dan execution
• Schema management dan migrations
• Performance optimization

🔥 ERROR HANDLING [MAX]:
• Deep error analysis dengan 12 kategori
• Auto-generate fix patches
• Root cause identification
• Predictive prevention

🔥 DESIGN SYSTEM [MAX]:
• Realtime component redesign
• CSS generation untuk semua komponen
• Preview sebelum apply
• 5 design presets (modern, minimalist, glassmorphism, neumorphism, brutalist)

🔥 COMMUNICATION BRIDGE [MAX]:
• Forward messages ke OSIS/Admin/Super Admin
• Notification system
• Multi-party discussions
• Reply langsung dari chat

🔥 CODE GENERATION [MAX]:
• SQL queries
• TypeScript/React components
• API endpoints
• RLS policies

═══════════════════════════════════════════════════════════════════════════
🎮 ADMIN COMMANDS TERSEDIA:
═══════════════════════════════════════════════════════════════════════════

📊 DATA & ERRORS:
/errors, /errors N, /analyze <id>, /fix <id>
/members, /events, /posts, /attendance
/stats, /health, /activity

🔐 SECURITY:
/rls <table>, /audit, /permissions

💾 DATABASE:
/sql <query>, /schema, /backup, /migrate

🎨 DESIGN:
/design <component> <changes>, /preview, /apply-design

📨 NOTIFICATIONS:
/notifications, /reply <id> <msg>, /broadcast <msg>

═══════════════════════════════════════════════════════════════════════════
💎 STATUS: ALL SYSTEMS OPERATIONAL | MAXIMUM POWER UNLOCKED
═══════════════════════════════════════════════════════════════════════════`;
}
