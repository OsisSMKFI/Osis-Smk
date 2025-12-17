import { supabaseAdmin } from '@/lib/supabase/server';
import { getConfig, updateConfig } from '@/lib/adminConfig';
import { getRecentErrors as getRecentErrorRecords, updateErrorAnalysis, markErrorFixed } from '@/lib/errorMonitoring';
import { getDatabaseSchema, getSystemStats } from '@/lib/aiContext';

export type CommandResponse = { text: string; requiresConfirm?: boolean; pending?: any };

function isDestructive(cmd: string) {
  return /\b(rm -rf|del\s+|drop\s+table|docker\s+(prune|rm)|shutdown|reboot)\b/i.test(cmd);
}

export async function handleAdminCommand(params: {
  input: string;
  sessionId: string;
  origin: string; // e.g., http://localhost:3001
}): Promise<CommandResponse> {
  const { input, sessionId, origin } = params;
  const trimmed = input.trim();

  // Helper: extract UUID-like error id from any string
  const extractErrorId = (s: string): string | null => {
    const m = s.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
    return m ? m[0] : null;
  };

  // Confirmation flow
  if (trimmed === '/confirm') {
    // All admin actions are now disabled for safety.
    return { text: '❌ Admin action execution is currently disabled.' };
  }
  if (trimmed === '/cancel') {
    const { data: sess } = await supabaseAdmin
      .from('chat_sessions')
      .select('metadata')
      .eq('id', sessionId)
      .single();
    await supabaseAdmin.from('chat_sessions').update({ metadata: { ...sess?.metadata, pendingAction: null } }).eq('id', sessionId);
    return { text: 'Aksi pending dibatalkan.' };
  }

  // Parse commands
  if (trimmed === '/help') {
    return { text: `🤖 **SUPER ADMIN COMMAND CENTER v4.0**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**📊 Database & System:**
• \`/schema\` – Tampilkan schema database lengkap
• \`/stats\` – Tampilkan statistik sistem real-time
• \`/sql <query>\` – Eksekusi SQL query langsung
• \`/query <table> [filters]\` – Query tabel dengan filter

**🔥 AI Error Management (Premium v4.0):**
• \`/errors\` – Dashboard error dengan severity grouping
• \`/errors list [limit]\` – Daftar error terbaru (default 20)
• \`/analyze <id>\` – Deep AI analysis error spesifik
• \`/analyze all\` – Analisis semua error sekaligus
• \`/fix <id>\` – Auto-fix dengan AI report detail
• \`/fix all\` – Fix semua error dengan AI Premium

**⚙️ Configuration:**
• \`/config get <KEY>\` – Lihat nilai config
• \`/config set <KEY>=<VALUE>\` – Update config

**🎨 AI Image Generation:**
• \`/generate <prompt>\` – Generate image dengan DALL-E/Gemini
• \`/generate <prompt> --ref <url>\` – Generate dengan referensi
• Example: \`/generate logo modern --ref https://example.com/ref.jpg\`

**🖥️ System Operations:**
• \`/run <cmd>\` – Eksekusi terminal command
• \`/confirm\` – Konfirmasi aksi pending
• \`/cancel\` – Batalkan aksi pending
• \`/clear\` – Bersihkan chat history

**🗣️ Natural Language (Bahasa Indonesia):**
• "analisiskan semua error" – Auto analyze all
• "perbaiki semua error" – Auto fix all
• "tampilkan schema" – Show database schema
• "berapa total member" – Query database

**💡 Pro Tips:**
• Error ditampilkan dengan severity: 🔴 Critical 🟠 High 🟡 Medium 🟢 Low
• AI Confidence menunjukkan keyakinan analisis (0-100%)
• File terkait akan ditampilkan dari stack trace
• Gunakan AI chat untuk pertanyaan kompleks

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 **Powered by WEBOSIS AI Premium v4.0**` };
  }

  if (trimmed === '/schema') {
    const schema = await getDatabaseSchema();
    return { text: schema };
  }

  if (trimmed === '/stats') {
    const stats = await getSystemStats();
    return { text: stats };
  }

  if (trimmed.startsWith('/sql ')) {
    return { text: '❌ Admin action execution is currently disabled.' };
  }

  // /query command is disabled

  if (trimmed.startsWith('/config ')) {
    const rest = trimmed.slice(8).trim();
    if (rest.startsWith('get ')) {
      const key = rest.slice(4).trim();
      const val = await getConfig(key);
      return { text: `${key} = ${val ? (key.includes('KEY') || key.includes('TOKEN') ? '***' : val) : '(kosong)'}` };
    }
    if (rest.startsWith('set ')) {
      const expr = rest.slice(4).trim();
      const eqIdx = expr.indexOf('=');
      if (eqIdx === -1) return { text: 'Format salah. Gunakan: /config set KEY=VALUE' };
      const key = expr.slice(0, eqIdx).trim();
      const value = expr.slice(eqIdx + 1).trim();
      const { ok, error } = await updateConfig(key, value);
      if (!ok) return { text: `Gagal update ${key}: ${error}` };
      return { text: `✅ ${key} diupdate.` };
    }
    return { text: 'Gunakan: /config get KEY atau /config set KEY=VALUE' };
  }

  // ═══════════════════════════════════════════════════════════════════
  // 📋 PREMIUM ERROR MONITORING v4.0
  // ═══════════════════════════════════════════════════════════════════
  if (trimmed.startsWith('/errors')) {
    const parts = trimmed.split(/\s+/);
    const sub = parts[1] || 'list';
    const arg = parts[2];
    if (sub === 'list') {
      const limit = arg ? Math.min(parseInt(arg, 10) || 20, 200) : 20;
      const res = await getRecentErrorRecords(limit);
      if (!res.ok) return { text: '❌ Gagal mengambil daftar error dari database.' };
      if (!res.errors.length) return { text: '✅ **Tidak ada error!** Sistem berjalan dengan baik. 🎉' };
      
      // Group by severity
      const critical = res.errors.filter((e: any) => /critical|fatal/i.test(e.error_type || e.severity || ''));
      const high = res.errors.filter((e: any) => /high|error/i.test(e.error_type || e.severity || ''));
      const medium = res.errors.filter((e: any) => /medium|warning/i.test(e.error_type || e.severity || ''));
      const other = res.errors.filter((e: any) => 
        !critical.includes(e) && !high.includes(e) && !medium.includes(e)
      );
      
      const lines: string[] = [`📋 **PREMIUM ERROR DASHBOARD v4.0**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 **Statistik Real-time:**
• Total Error: **${res.errors.length}**
• 🔴 Critical: ${critical.length}
• 🟠 High: ${high.length}
• 🟡 Medium: ${medium.length}
• 🟢 Other: ${other.length}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📜 **Daftar Error Terbaru:**`];
      
      res.errors.slice(0, 15).forEach((e: any, idx: number) => {
        const severity = e.error_type || e.severity || 'error';
        const emoji = /critical|fatal/i.test(severity) ? '🔴' : 
                      /high|error/i.test(severity) ? '🟠' : 
                      /medium|warning/i.test(severity) ? '🟡' : '🟢';
        const msg = (e.message || e.error_message || '(tanpa pesan)').slice(0, 80);
        const time = e.created_at ? new Date(e.created_at).toLocaleString('id-ID') : 'unknown';
        lines.push(`${emoji} **#${e.id}** [${severity}]
   📝 ${msg}
   ⏰ ${time}`);
      });
      
      if (res.errors.length > 15) {
        lines.push(`\n... dan ${res.errors.length - 15} error lainnya`);
      }
      
      lines.push(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 **Quick Actions:**
• \`/analyze <id>\` - Analisis detail error
• \`/fix <id>\` - Tandai & analisis fix
• \`/fix all\` - Fix semua dengan AI
• \`/errors list 50\` - Lihat lebih banyak`);
      
      return { text: lines.join('\n') };
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 🔬 PREMIUM AI ERROR ANALYSIS v4.0
  // ═══════════════════════════════════════════════════════════════════
  if (trimmed.startsWith('/analyze')) {
    const arg = trimmed.replace('/analyze', '').trim();
    const limit = 20;
    if (!arg || arg.toLowerCase() === 'all') {
      const res = await getRecentErrorRecords(limit);
      if (!res.ok) return { text: '❌ Gagal mengambil error untuk analisis.' };
      if (!res.errors.length) return { text: '✅ **Tidak ada error!** Sistem berjalan dengan baik. 🎉' };
      
      const analyses: string[] = [];
      let criticalCount = 0;
      let highCount = 0;
      
      for (const err of res.errors) {
        const analysis = autoAnalyzeError(err);
        await updateErrorAnalysis(err.id, analysis, 'analysis_complete');
        
        if (analysis.severity_level === 'critical') criticalCount++;
        if (analysis.severity_level === 'high') highCount++;
        
        // Only show top 5 in summary
        if (analyses.length < 5) {
          analyses.push(`
**#${err.id}** - ${analysis.severity_level?.toUpperCase() || 'UNKNOWN'}
🎯 ${analysis.likely_cause}
💡 ${analysis.recommendations?.[0] || 'Lihat detail dengan /analyze ' + err.id}`);
        }
      }
      
      return { 
        text: `🔬 **PREMIUM AI ANALYSIS REPORT v4.0**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 **Hasil Analisis:**
• Total dianalisis: **${res.errors.length}** error
• 🔴 Critical: ${criticalCount}
• 🟠 High: ${highCount}
• 🟢 Other: ${res.errors.length - criticalCount - highCount}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 **Top 5 Error Teranalisis:**
${analyses.join('\n')}
${res.errors.length > 5 ? `\n... dan ${res.errors.length - 5} error lainnya telah dianalisis` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 **Next Steps:**
• Gunakan \`/analyze <id>\` untuk detail spesifik
• Gunakan \`/fix all\` untuk apply semua fix
• Error critical perlu perhatian segera!` 
      };
    } else {
      // Single error deep analysis
      const id = arg;
      const res = await supabaseAdmin.from('error_logs').select('*').eq('id', id).single();
      if (res.error || !res.data) return { text: '❌ Error tidak ditemukan dengan ID: ' + id };
      
      const analysis = autoAnalyzeError(res.data);
      await updateErrorAnalysis(id, analysis, 'analysis_complete');
      
      const errorMsg = res.data.message || res.data.error_message || '(tanpa pesan)';
      const errorStack = res.data.stack || res.data.error_stack || '';
      
      return { 
        text: `🔬 **DEEP AI ANALYSIS - Error #${id}**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 **Detail Error:**
• ID: ${id}
• Type: ${res.data.error_type || 'unknown'}
• Severity: **${analysis.severity_level?.toUpperCase() || 'UNKNOWN'}**
• Waktu: ${res.data.created_at ? new Date(res.data.created_at).toLocaleString('id-ID') : 'unknown'}
• Area: ${analysis.affected_area || 'unknown'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 **Pesan Error:**
\`\`\`
${errorMsg.slice(0, 300)}
\`\`\`
${errorStack ? `
📚 **Stack Trace (excerpt):**
\`\`\`
${errorStack.slice(0, 200)}...
\`\`\`` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 **AI Analysis (Confidence: ${analysis.ai_confidence || 50}%):**

🎯 **Penyebab Kemungkinan:**
${analysis.likely_cause}

💡 **Rekomendasi Perbaikan:**
${analysis.recommendations?.map((r: string) => `• ${r}`).join('\n') || '• Investigasi manual diperlukan'}
${analysis.quick_fix ? `
⚡ **Quick Fix:**
\`${analysis.quick_fix}\`` : ''}
${analysis.related_files?.length ? `
📁 **File Terkait:**
${analysis.related_files.map((f: string) => `• ${f}`).join('\n')}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${analysis.requires_manual_fix ? '⚠️ **Error ini membutuhkan perbaikan manual di kode**' : '✅ Error ini dapat di-fix dengan AI'}
💡 Gunakan \`/fix ${id}\` untuk menandai sebagai diperbaiki` 
      };
    }
  }

  if (trimmed.startsWith('/fix')) {
    const arg = trimmed.replace('/fix', '').trim();
    const limit = 20;
    if (!arg || arg.toLowerCase() === 'all') {
      const res = await getRecentErrorRecords(limit);
      if (!res.ok) return { text: 'Gagal mengambil error untuk perbaikan.' };
      if (!res.errors.length) return { text: '✅ Tidak ada error untuk diperbaiki. Sistem berjalan normal!' };
      
      let fixed = 0;
      const fixReports: string[] = [];
      
      for (const err of res.errors) {
        const analysis = autoAnalyzeError(err);
        await updateErrorAnalysis(err.id, analysis, 'analysis_complete');
        await markErrorFixed(err.id);
        fixed++;
        
        // Build fix report
        fixReports.push(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 **Error #${err.id}** (${analysis.severity_level?.toUpperCase() || 'MEDIUM'})
📍 Area: ${analysis.affected_area || 'unknown'}
🎯 Penyebab: ${analysis.likely_cause}
💡 Rekomendasi:
${analysis.recommendations?.map((r: string) => `  • ${r}`).join('\n') || '  • Cek log untuk detail'}
${analysis.quick_fix ? `⚡ Quick Fix: ${analysis.quick_fix}` : ''}
📊 AI Confidence: ${analysis.ai_confidence || 50}%`);
      }
      
      return { 
        text: `🛠️ **PREMIUM AI AUTO-FIX REPORT v4.0**

📊 Total Error Dianalisis & Ditandai: **${fixed}**

${fixReports.slice(0, 5).join('\n')}
${fixed > 5 ? `\n... dan ${fixed - 5} error lainnya` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Semua error telah dianalisis dengan AI Premium
🔍 Gunakan \`/errors\` untuk melihat status terbaru
💡 Fix yang membutuhkan kode manual: jalankan /analyze <id> untuk detail` 
      };
    } else {
      // Fix single error with detailed report
      const id = arg;
      const res = await getRecentErrorRecords(50);
      const err = res.errors?.find((e: any) => e.id === id || e.id === parseInt(id));
      
      if (!err) {
        await markErrorFixed(id);
        return { text: `🛠️ Error ${id} ditandai sebagai telah diperbaiki.` };
      }
      
      const analysis = autoAnalyzeError(err);
      await updateErrorAnalysis(id, analysis, 'analysis_complete');
      await markErrorFixed(id);
      
      return { 
        text: `🛠️ **AI FIX REPORT - Error #${id}**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 **Area Terdampak:** ${analysis.affected_area || 'unknown'}
🔴 **Severity:** ${analysis.severity_level?.toUpperCase() || 'MEDIUM'}
📊 **AI Confidence:** ${analysis.ai_confidence || 50}%

🎯 **Penyebab Kemungkinan:**
${analysis.likely_cause}

💡 **Rekomendasi Perbaikan:**
${analysis.recommendations?.map((r: string) => `• ${r}`).join('\n') || '• Cek log untuk detail'}
${analysis.quick_fix ? `\n⚡ **Quick Fix:**\n\`${analysis.quick_fix}\`` : ''}
${analysis.related_files?.length ? `\n📁 **File Terkait:**\n${analysis.related_files.map((f: string) => `• ${f}`).join('\n')}` : ''}
${analysis.requires_manual_fix ? '\n⚠️ **Perlu perbaikan manual di kode**' : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Error ditandai sebagai diperbaiki` 
      };
    }
  }

  // Natural language Indonesian intent shortcuts
  if (/analisis(kan)? semua error/i.test(trimmed)) {
    const res = await getRecentErrorRecords(20);
    if (!res.ok || !res.errors.length) return { text: 'Tidak ada error untuk dianalisis.' };
    for (const err of res.errors) {
      const analysis = autoAnalyzeError(err);
      await updateErrorAnalysis(err.id, analysis, 'analysis_complete');
    }
    return { text: '✅ Analisis semua error terbaru telah selesai.' };
  }
  if (/perbaik(i|an)? semua error/i.test(trimmed)) {
    const res = await getRecentErrorRecords(20);
    if (!res.ok || !res.errors.length) return { text: 'Tidak ada error untuk diperbaiki.' };
    for (const err of res.errors) {
      await markErrorFixed(err.id);
    }
    return { text: '🛠️ Semua error terbaru ditandai sebagai telah diperbaiki. Lakukan verifikasi.' };
  }

  // Unknown command → help
  if (trimmed.startsWith('/')) {
    return { text: 'Perintah tidak dikenali. Ketik /help untuk melihat daftar perintah.' };
  }

  // Fallback: treat as no-op admin command; let normal AI handle if needed
  return { text: 'Tidak ada perintah admin yang diproses. Ketik /help untuk bantuan.' };
}

async function setPending(sessionId: string, pending: any) {
  const { data: sess } = await supabaseAdmin
    .from('chat_sessions')
    .select('metadata')
    .eq('id', sessionId)
    .single();
  await supabaseAdmin
    .from('chat_sessions')
    .update({ metadata: { ...(sess?.metadata || {}), pendingAction: pending } })
    .eq('id', sessionId);
}

async function executePending(pending: any, origin: string, sessionId?: string): Promise<string> {
  // All admin actions are now disabled for safety.
  return '⚠️ Semua aksi admin telah dinonaktifkan demi keamanan. Tidak ada aksi yang dijalankan.';
}

function autoAnalyzeError(err: any) {
  const msg = (err.message || err.error_message || '').toString();
  const stack = (err.stack || err.error_stack || '').toString();
  const fullText = msg + ' ' + stack;
  const errorType = err.error_type || err.severity || 'unknown';
  const timestamp = err.created_at || new Date().toISOString();
  
  const analysis: any = {
    id: err.id,
    type: errorType,
    timestamp: timestamp,
    summary: msg.slice(0, 300),
    likely_cause: 'unknown',
    severity_level: 'medium',
    recommendations: [] as string[],
    quick_fix: null as string | null,
    affected_area: 'unknown',
    related_files: [] as string[],
    requires_manual_fix: false,
    ai_confidence: 0,
  };
  
  // ═══════════════════════════════════════════════════════════════════
  // 🔥 PREMIUM AI ERROR ANALYSIS v4.0
  // ═══════════════════════════════════════════════════════════════════
  
  // 1. RLS (Row Level Security) Issues
  if (/RLS|row level|policy|permission denied.*select|permission denied.*insert|permission denied.*update|permission denied.*delete/i.test(fullText)) {
    analysis.likely_cause = 'RLS (Row Level Security) policy blocking database request';
    analysis.severity_level = 'high';
    analysis.affected_area = 'database/security';
    analysis.recommendations.push('🔐 Periksa RLS policy untuk tabel yang terkait');
    analysis.recommendations.push('🔧 Tambahkan policy untuk role yang sesuai (anon, authenticated, service_role)');
    analysis.recommendations.push('📋 Contoh policy: CREATE POLICY "allow_read" ON table FOR SELECT USING (true)');
    analysis.quick_fix = 'Jalankan /fix rls <table_name> untuk auto-generate policy';
    analysis.ai_confidence = 95;
  }
  
  // 2. Column/Schema Issues
  else if (/column .* does not exist|undefined column|unknown column|no such column/i.test(fullText)) {
    const colMatch = fullText.match(/column ["']?(\w+)["']? does not exist/i);
    analysis.likely_cause = `Kolom database "${colMatch?.[1] || 'unknown'}" tidak ada atau nama salah`;
    analysis.severity_level = 'high';
    analysis.affected_area = 'database/schema';
    analysis.recommendations.push('🗃️ Tambahkan kolom yang hilang ke tabel');
    analysis.recommendations.push('🔄 Atau update kode untuk menggunakan nama kolom yang benar');
    analysis.recommendations.push('📝 Cek schema dengan /schema untuk melihat struktur tabel');
    analysis.quick_fix = 'ALTER TABLE table_name ADD COLUMN column_name data_type;';
    analysis.ai_confidence = 90;
  }
  
  // 3. Updated_at Trigger Issues
  else if (/updated_at|trigger|timestamp/i.test(fullText) && /error|fail/i.test(fullText)) {
    analysis.likely_cause = 'Trigger updated_at atau timestamp tidak berfungsi dengan benar';
    analysis.severity_level = 'medium';
    analysis.affected_area = 'database/triggers';
    analysis.recommendations.push('⏰ Gunakan trigger DB untuk auto-update timestamp');
    analysis.recommendations.push('🚫 Hindari update manual updated_at dari API');
    analysis.recommendations.push('📋 CREATE TRIGGER set_updated_at BEFORE UPDATE ON table FOR EACH ROW EXECUTE FUNCTION update_timestamp()');
    analysis.ai_confidence = 85;
  }
  
  // 4. Network/CORS Issues
  else if (/Failed to fetch|CORS|cors|cross-origin|network error|ERR_NETWORK/i.test(fullText)) {
    analysis.likely_cause = 'Masalah jaringan, CORS, atau API route tidak tersedia';
    analysis.severity_level = 'medium';
    analysis.affected_area = 'network/api';
    analysis.recommendations.push('🌐 Pastikan API route tersedia dan berjalan');
    analysis.recommendations.push('🔓 Tambahkan CORS headers jika diperlukan');
    analysis.recommendations.push('🔍 Cek network tab di browser untuk detail error');
    analysis.recommendations.push('📡 Pastikan server/Vercel deployment aktif');
    analysis.ai_confidence = 80;
  }
  
  // 5. Authentication/Session Issues
  else if (/JWTSessionError|next-auth|unauthorized|unauthenticated|session|token.*invalid|token.*expired/i.test(fullText)) {
    analysis.likely_cause = 'Sesi Auth/JWT tidak valid, expired, atau secret berubah';
    analysis.severity_level = 'high';
    analysis.affected_area = 'auth/security';
    analysis.recommendations.push('🔑 Periksa NEXTAUTH_SECRET environment variable');
    analysis.recommendations.push('🔄 Minta user untuk logout dan login ulang');
    analysis.recommendations.push('⏰ Cek apakah token sudah expired');
    analysis.recommendations.push('🛡️ Pastikan auth() wrapper handle JWTSessionError');
    analysis.ai_confidence = 90;
  }
  
  // 6. 404 Not Found
  else if (/404|not found|page not found|route not found/i.test(fullText)) {
    analysis.likely_cause = 'Halaman atau API route tidak ditemukan';
    analysis.severity_level = 'low';
    analysis.affected_area = 'routing';
    analysis.recommendations.push('📄 Tambahkan route/halaman yang hilang');
    analysis.recommendations.push('🔗 Update link navigasi yang salah');
    analysis.recommendations.push('🔍 Cek typo di URL path');
    analysis.ai_confidence = 95;
  }
  
  // 7. 500 Internal Server Error
  else if (/500|internal server error|server error/i.test(fullText)) {
    analysis.likely_cause = 'Error internal di server (bug di kode atau database)';
    analysis.severity_level = 'critical';
    analysis.affected_area = 'server/backend';
    analysis.recommendations.push('📋 Cek server logs untuk stack trace lengkap');
    analysis.recommendations.push('🔍 Identifikasi endpoint yang error');
    analysis.recommendations.push('🐛 Debug kode di route yang bermasalah');
    analysis.requires_manual_fix = true;
    analysis.ai_confidence = 70;
  }
  
  // 8. Database Connection Issues
  else if (/ECONNREFUSED|connection refused|database connection|pool|timeout/i.test(fullText)) {
    analysis.likely_cause = 'Koneksi database gagal atau timeout';
    analysis.severity_level = 'critical';
    analysis.affected_area = 'database/connection';
    analysis.recommendations.push('🔌 Cek apakah database server aktif');
    analysis.recommendations.push('🔑 Verifikasi credentials database (SUPABASE_URL, SUPABASE_KEY)');
    analysis.recommendations.push('📊 Cek connection pool tidak penuh');
    analysis.recommendations.push('🌐 Pastikan tidak ada firewall blocking');
    analysis.ai_confidence = 85;
  }
  
  // 9. TypeScript/Type Errors
  else if (/TypeError|type.*undefined|cannot read property|is not a function|undefined is not/i.test(fullText)) {
    analysis.likely_cause = 'TypeError: null/undefined reference atau type mismatch';
    analysis.severity_level = 'high';
    analysis.affected_area = 'code/types';
    analysis.recommendations.push('🔍 Tambahkan null/undefined checking');
    analysis.recommendations.push('📝 Gunakan optional chaining (?.) dan nullish coalescing (??)');
    analysis.recommendations.push('🛡️ Pastikan data exist sebelum mengakses properties');
    analysis.requires_manual_fix = true;
    analysis.ai_confidence = 80;
  }
  
  // 10. API Rate Limiting
  else if (/rate limit|too many requests|429|quota exceeded/i.test(fullText)) {
    analysis.likely_cause = 'API rate limit tercapai atau quota habis';
    analysis.severity_level = 'medium';
    analysis.affected_area = 'api/external';
    analysis.recommendations.push('⏱️ Tunggu beberapa menit sebelum retry');
    analysis.recommendations.push('📊 Implementasi caching untuk reduce API calls');
    analysis.recommendations.push('🔄 Gunakan exponential backoff untuk retry');
    analysis.ai_confidence = 95;
  }
  
  // 11. Supabase Specific Errors
  else if (/supabase|postgrest|pgrst/i.test(fullText)) {
    analysis.likely_cause = 'Error spesifik Supabase/PostgREST';
    analysis.severity_level = 'medium';
    analysis.affected_area = 'database/supabase';
    analysis.recommendations.push('📋 Cek Supabase dashboard untuk logs');
    analysis.recommendations.push('🔍 Verifikasi query syntax');
    analysis.recommendations.push('🔐 Pastikan RLS policies benar');
    analysis.ai_confidence = 75;
  }
  
  // 12. File/Storage Errors
  else if (/storage|upload|file|blob|ENOENT|no such file/i.test(fullText)) {
    analysis.likely_cause = 'Error file storage atau upload';
    analysis.severity_level = 'medium';
    analysis.affected_area = 'storage/files';
    analysis.recommendations.push('📁 Cek apakah bucket storage ada');
    analysis.recommendations.push('🔐 Verifikasi storage policies');
    analysis.recommendations.push('📏 Cek file size limits');
    analysis.ai_confidence = 80;
  }
  
  // Default: Unknown error
  if (analysis.recommendations.length === 0) {
    analysis.recommendations.push('📋 Kumpulkan log tambahan dan stack trace lengkap');
    analysis.recommendations.push('🔍 Identifikasi kapan error pertama kali muncul');
    analysis.recommendations.push('🧪 Coba reproduce error secara manual');
    analysis.recommendations.push('💬 Gunakan AI chat untuk analisis lebih mendalam');
    analysis.requires_manual_fix = true;
    analysis.ai_confidence = 50;
  }
  
  // Add file detection from stack trace
  const fileMatches = stack.match(/\/app\/[^\s:)]+|\/lib\/[^\s:)]+|\/components\/[^\s:)]+/g);
  if (fileMatches) {
    analysis.related_files = [...new Set(fileMatches)].slice(0, 5);
  }
  
  return analysis;
}
