import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// ═══════════════════════════════════════════════════════════════════════════════
// ⚡ AI EXECUTE ACTION API - Real Action Execution
// ═══════════════════════════════════════════════════════════════════════════════
// This API allows AI to actually execute actions, not just talk about them.
// Actions: apply_design, send_notification, forward_message, etc.
// ═══════════════════════════════════════════════════════════════════════════════

interface ActionResult {
  success: boolean;
  action: string;
  details: string;
  timestamp: string;
  data?: any;
}

// Pre-defined design templates for common requests
const DESIGN_TEMPLATES = {
  chat_input_neumorphism: `
/* Neumorphism Design for Chat Input */
.chat-input-container {
  background: linear-gradient(145deg, #f0f0f3, #cacace);
  border-radius: 16px;
  padding: 12px 16px;
  box-shadow: 
    8px 8px 16px #b8b8bb,
    -8px -8px 16px #ffffff,
    inset 2px 2px 4px rgba(255,255,255,0.5),
    inset -2px -2px 4px rgba(0,0,0,0.05);
  border: none;
  transition: all 0.3s ease;
}

.chat-input-container:focus-within {
  box-shadow: 
    4px 4px 8px #b8b8bb,
    -4px -4px 8px #ffffff,
    inset 4px 4px 8px rgba(0,0,0,0.1),
    inset -4px -4px 8px rgba(255,255,255,0.9);
}

.chat-input {
  background: transparent;
  border: none;
  outline: none;
  font-size: 14px;
  color: #333;
  width: 100%;
  resize: none;
}

.chat-input::placeholder {
  color: #888;
}

.chat-send-button {
  background: linear-gradient(145deg, #4f46e5, #6366f1);
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  color: white;
  cursor: pointer;
  box-shadow: 
    4px 4px 8px rgba(79, 70, 229, 0.3),
    -2px -2px 6px rgba(255,255,255,0.2);
  transition: all 0.2s ease;
}

.chat-send-button:hover {
  transform: translateY(-2px);
  box-shadow: 
    6px 6px 12px rgba(79, 70, 229, 0.4),
    -2px -2px 8px rgba(255,255,255,0.3);
}

.chat-send-button:active {
  transform: translateY(0);
  box-shadow: 
    inset 2px 2px 4px rgba(0,0,0,0.2),
    inset -2px -2px 4px rgba(255,255,255,0.1);
}
`,

  chat_input_glassmorphism: `
/* Glassmorphism Design for Chat Input */
.chat-input-container {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.chat-input-container:focus-within {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.4);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.chat-input {
  background: transparent;
  border: none;
  outline: none;
  font-size: 14px;
  color: #1a1a2e;
  width: 100%;
  resize: none;
}

.chat-send-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.chat-send-button:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}
`,

  chat_input_modern_minimal: `
/* Modern Minimal Design for Chat Input */
.chat-input-container {
  background: #ffffff;
  border-radius: 24px;
  padding: 12px 20px;
  border: 2px solid #e5e7eb;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.chat-input-container:focus-within {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.chat-input {
  background: transparent;
  border: none;
  outline: none;
  font-size: 15px;
  color: #1f2937;
  width: 100%;
  resize: none;
  line-height: 1.5;
}

.chat-input::placeholder {
  color: #9ca3af;
}

.chat-send-button {
  background: #6366f1;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.chat-send-button:hover {
  background: #4f46e5;
  transform: scale(1.1);
}
`,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params, sessionId } = body;

    if (!action) {
      return NextResponse.json({ 
        success: false, 
        error: 'Action is required' 
      }, { status: 400 });
    }

    const result: ActionResult = {
      success: false,
      action,
      details: '',
      timestamp: new Date().toISOString(),
    };

    console.log(`[AI Execute] 🚀 Executing action: ${action}`, params);

    switch (action) {
      // ═══════════════════════════════════════════════════════════════════════
      // 🎨 APPLY DESIGN - Actually apply design changes
      // ═══════════════════════════════════════════════════════════════════════
      case 'apply_design': {
        const { component, designType, customCss } = params || {};
        
        if (!component) {
          result.details = 'Component name required';
          return NextResponse.json(result, { status: 400 });
        }

        // Get CSS from templates or custom
        let cssCode = customCss;
        if (!cssCode && designType) {
          const templateKey = `${component}_${designType}` as keyof typeof DESIGN_TEMPLATES;
          cssCode = DESIGN_TEMPLATES[templateKey];
        }

        if (!cssCode) {
          // Default to neumorphism for chat input
          if (component === 'chat_input') {
            cssCode = DESIGN_TEMPLATES.chat_input_neumorphism;
          } else {
            result.details = `No design template found for ${component}. Available: chat_input_neumorphism, chat_input_glassmorphism, chat_input_modern_minimal`;
            return NextResponse.json(result, { status: 400 });
          }
        }

        // Store design in page_content table (always available)
        const { error: insertError } = await supabaseAdmin
          .from('page_content')
          .upsert({
            page_key: `design_override_${component}`,
            content_type: 'css',
            content_value: cssCode,
            category: 'design',
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'page_key',
          });

        if (insertError) {
          console.error('[AI Execute] Design save error:', insertError);
          result.details = `Failed to save design: ${insertError.message}`;
          return NextResponse.json(result, { status: 500 });
        }

        // Log the action
        await logAIAction(sessionId, 'apply_design', {
          component,
          designType,
          cssLength: cssCode.length,
        });

        result.success = true;
        result.details = `Design ${designType || 'custom'} untuk ${component} berhasil diterapkan! CSS (${cssCode.length} chars) disimpan ke database. Refresh halaman untuk melihat perubahan.`;
        result.data = { cssApplied: true, component, designType };
        
        console.log(`[AI Execute] ✅ Design applied: ${component}`);
        break;
      }

      // ═══════════════════════════════════════════════════════════════════════
      // 📨 SEND NOTIFICATION - Send notification to user/admin
      // ═══════════════════════════════════════════════════════════════════════
      case 'send_notification': {
        const { targetSessionId, message, title, type } = params || {};
        
        if (!message) {
          result.details = 'Message is required';
          return NextResponse.json(result, { status: 400 });
        }

        // Store notification in database
        const { error: notifError } = await supabaseAdmin
          .from('admin_notifications')
          .insert({
            type: type || 'ai_notification',
            title: title || 'Notifikasi dari AI',
            message,
            target_role: 'all',
            session_id: targetSessionId || sessionId,
            is_read: false,
            created_at: new Date().toISOString(),
          });

        if (notifError) {
          console.error('[AI Execute] Notification error:', notifError);
          result.details = `Failed to send notification: ${notifError.message}`;
          return NextResponse.json(result, { status: 500 });
        }

        result.success = true;
        result.details = `Notifikasi berhasil dikirim: "${message.slice(0, 50)}..."`;
        
        console.log(`[AI Execute] ✅ Notification sent`);
        break;
      }

      // ═══════════════════════════════════════════════════════════════════════
      // 🔔 PROGRESS UPDATE - Send progress update to user
      // ═══════════════════════════════════════════════════════════════════════
      case 'progress_update': {
        const { progress, estimatedTime, status, taskId } = params || {};
        
        // Store progress in a dedicated table or page_content
        const progressData = {
          taskId: taskId || `task_${Date.now()}`,
          progress: progress || 0,
          status: status || 'in_progress',
          estimatedTime: estimatedTime || 'Unknown',
          updatedAt: new Date().toISOString(),
        };

        const { error: progressError } = await supabaseAdmin
          .from('page_content')
          .upsert({
            page_key: `ai_task_${sessionId || 'default'}`,
            content_type: 'json',
            content_value: JSON.stringify(progressData),
            category: 'ai_progress',
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'page_key',
          });

        if (progressError) {
          result.details = `Failed to update progress: ${progressError.message}`;
          return NextResponse.json(result, { status: 500 });
        }

        result.success = true;
        result.details = `Progress updated: ${progress}% - ${status}`;
        result.data = progressData;
        
        console.log(`[AI Execute] ✅ Progress updated: ${progress}%`);
        break;
      }

      // ═══════════════════════════════════════════════════════════════════════
      // 📋 GET STATUS - Get current task status
      // ═══════════════════════════════════════════════════════════════════════
      case 'get_status': {
        const { taskSessionId } = params || {};
        
        const { data: statusData, error: statusError } = await supabaseAdmin
          .from('page_content')
          .select('content_value, updated_at')
          .eq('page_key', `ai_task_${taskSessionId || sessionId || 'default'}`)
          .single();

        if (statusError || !statusData) {
          result.details = 'No active task found';
          return NextResponse.json(result);
        }

        result.success = true;
        result.details = 'Task status retrieved';
        result.data = JSON.parse(statusData.content_value);
        break;
      }

      default:
        result.details = `Unknown action: ${action}. Available actions: apply_design, send_notification, progress_update, get_status`;
        return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[AI Execute] Error:', error);
    return NextResponse.json({
      success: false,
      action: 'unknown',
      details: `Error: ${error.message}`,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// Helper: Log AI action
async function logAIAction(sessionId: string | undefined, action: string, details: any) {
  try {
    await supabaseAdmin
      .from('page_content')
      .upsert({
        page_key: `ai_action_log_${Date.now()}`,
        content_type: 'json',
        content_value: JSON.stringify({
          sessionId,
          action,
          details,
          timestamp: new Date().toISOString(),
        }),
        category: 'ai_logs',
        updated_at: new Date().toISOString(),
      });
  } catch (e) {
    console.error('[AI Execute] Failed to log action:', e);
  }
}

// GET - Get available actions and templates
export async function GET() {
  return NextResponse.json({
    availableActions: [
      {
        action: 'apply_design',
        description: 'Apply design changes to a component',
        params: {
          component: 'Component name (e.g., chat_input)',
          designType: 'Design template (neumorphism, glassmorphism, modern_minimal)',
          customCss: 'Optional custom CSS code',
        },
      },
      {
        action: 'send_notification',
        description: 'Send notification to user',
        params: {
          targetSessionId: 'Target session ID (optional)',
          message: 'Notification message',
          title: 'Notification title (optional)',
          type: 'Notification type (optional)',
        },
      },
      {
        action: 'progress_update',
        description: 'Update task progress',
        params: {
          progress: 'Progress percentage (0-100)',
          status: 'Status text',
          estimatedTime: 'Estimated completion time',
          taskId: 'Task ID (optional)',
        },
      },
      {
        action: 'get_status',
        description: 'Get current task status',
        params: {
          taskSessionId: 'Session ID to check (optional)',
        },
      },
    ],
    designTemplates: Object.keys(DESIGN_TEMPLATES),
  });
}
