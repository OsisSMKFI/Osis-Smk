import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { handleAdminCommand } from '@/lib/adminChatCommands';
import { getAIKnowledge, getConversationSkills } from '@/lib/aiAutoLearn';
import { getAdminAIPrompt, getRecentErrors } from '@/lib/aiContext';

// ═══════════════════════════════════════════════════════════════════════════
// 🔥 WEBOSIS ADMIN AI API - PREMIUM v4.0
// ═══════════════════════════════════════════════════════════════════════════
// Features:
// - Admin command processing (/errors, /analyze, /fix, etc.)
// - AI-powered error analysis
// - Natural language to command translation
// - Real database integration
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, provider, sessionId, action } = body;

    if (!prompt && !action) {
      return NextResponse.json({ error: 'Prompt or action required' }, { status: 400 });
    }

    // ═══════════════════════════════════════════════════════════════════
    // 📋 ACTION HANDLERS
    // ═══════════════════════════════════════════════════════════════════
    
    // Get AI knowledge action
    if (action === 'get-knowledge') {
      const knowledge = getAIKnowledge();
      const skills = getConversationSkills();
      return NextResponse.json({
        success: true,
        knowledge,
        skills,
        version: 'Premium v4.0',
      });
    }
    
    // Get recent errors action
    if (action === 'get-errors') {
      const errors = await getRecentErrors();
      return NextResponse.json({
        success: true,
        errors,
        source: 'database:error_logs',
      });
    }
    
    // Get admin AI prompt
    if (action === 'get-prompt') {
      const adminPrompt = getAdminAIPrompt();
      return NextResponse.json({
        success: true,
        prompt: adminPrompt,
        maxTokens: 4000,
        version: 'Super Admin Premium v4.0',
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🤖 COMMAND PROCESSING
    // ═══════════════════════════════════════════════════════════════════
    
    // Check if it's an admin command
    const trimmedPrompt = (prompt || '').trim();
    if (trimmedPrompt.startsWith('/')) {
      const origin = request.headers.get('origin') || '';
      const result = await handleAdminCommand({
        input: trimmedPrompt,
        sessionId: sessionId || 'api-session',
        origin,
      });
      
      return NextResponse.json({
        success: true,
        response: result.text,
        type: 'command',
        command: trimmedPrompt.split(' ')[0],
        provider: 'admin-ai',
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🗣️ NATURAL LANGUAGE PROCESSING
    // ═══════════════════════════════════════════════════════════════════
    
    // Translate natural language to commands (Indonesian support)
    const nlpCommands: { pattern: RegExp; command: string }[] = [
      { pattern: /analisis(kan)?\s*(semua)?\s*error/i, command: '/analyze all' },
      { pattern: /perbaik(i|an)?\s*(semua)?\s*error/i, command: '/fix all' },
      { pattern: /lihat\s*(daftar)?\s*error/i, command: '/errors' },
      { pattern: /tampilkan\s*schema/i, command: '/schema' },
      { pattern: /statistik\s*(sistem)?/i, command: '/stats' },
      { pattern: /bantuan|help|perintah/i, command: '/help' },
    ];
    
    for (const { pattern, command } of nlpCommands) {
      if (pattern.test(trimmedPrompt)) {
        const origin = request.headers.get('origin') || '';
        const result = await handleAdminCommand({
          input: command,
          sessionId: sessionId || 'api-session',
          origin,
        });
        return NextResponse.json({
          success: true,
          response: result.text,
          type: 'nlp-command',
          detectedCommand: command,
          provider: 'admin-ai',
        });
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 💬 FALLBACK AI RESPONSE
    // ═══════════════════════════════════════════════════════════════════
    
    // For non-command queries, provide helpful AI response
    const knowledge = getAIKnowledge();
    const helpfulResponse = `🤖 **WEBOSIS Admin AI v4.0**

Saya bisa membantu Anda dengan:

**🔍 Error Management:**
• Ketik \`/errors\` - Lihat daftar error
• Ketik \`/analyze all\` - Analisis semua error dengan AI
• Ketik \`/fix all\` - Auto-fix semua error

**📊 Database:**
• Ketik \`/schema\` - Lihat struktur database
• Ketik \`/stats\` - Statistik sistem

**🗣️ Natural Language:**
Anda juga bisa bertanya dalam bahasa Indonesia seperti:
• "analisiskan semua error"
• "tampilkan schema database"
• "berapa total member"

Ketik \`/help\` untuk daftar perintah lengkap.

---
💡 *Query Anda: "${trimmedPrompt.slice(0, 100)}"*
Saya tidak mengenali ini sebagai perintah. Gunakan format command atau natural language di atas.`;

    return NextResponse.json({
      success: true,
      response: helpfulResponse,
      type: 'help',
      provider: 'admin-ai',
      version: 'Premium v4.0',
    });
    
  } catch (error: any) {
    console.error('Admin AI Error:', error);
    return NextResponse.json({ 
      error: error.message,
      suggestion: 'Coba ketik /help untuk bantuan'
    }, { status: 500 });
  }
}

// GET endpoint for status check
export async function GET() {
  return NextResponse.json({
    status: 'active',
    version: 'Premium v4.0',
    features: [
      'Admin command processing',
      'AI error analysis',
      'Natural language support (Indonesian)',
      'Real database integration',
      'Smart error categorization',
      'Auto-fix recommendations',
    ],
    commands: [
      '/help', '/errors', '/analyze', '/fix',
      '/schema', '/stats', '/config'
    ],
  });
}
