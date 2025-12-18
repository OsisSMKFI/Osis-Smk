'use client';

import { useState, useCallback, useRef } from 'react';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🤖 USE COPILOT AI HOOK v2.0 - GitHub Copilot-like Client Integration
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * React hook for using the Copilot AI in Design Studio.
 * Features:
 * - Stateful session management
 * - Preview/Apply actions
 * - File change tracking
 * - Real-time narration
 */

interface CopilotChange {
    path: string;
    action: 'create' | 'modify' | 'delete' | 'read';
    content?: string;
    diff?: { find: string; replace: string };
}

interface CopilotResponse {
    status: 'acknowledged' | 'applied' | 'no-changes' | 'rejected' | 'preview-ready' | 'error';
    changeset: {
        summary: string;
        files: CopilotChange[];
    };
    preview: {
        available: boolean;
        type: 'local' | 'conceptual' | 'n/a';
        route: string;
        html?: string;
    };
    narration?: string[];
    error?: string;
}

interface UseCopilotOptions {
    sessionId?: string;
    onFileChange?: (files: CopilotChange[]) => void;
    onPreviewReady?: (preview: CopilotResponse['preview']) => void;
    onApplied?: (files: string[]) => void;
    onError?: (error: string) => void;
}

interface CopilotMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    changes?: CopilotChange[];
    narration?: string[];
}

export function useCopilotAI(options: UseCopilotOptions = {}) {
    const sessionId = useRef(options.sessionId || `session-${Date.now()}`);
    const [messages, setMessages] = useState<CopilotMessage[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: `👋 **Design Studio AI - Copilot Mode**

I can help you with:
• **Reading & searching files** - Find code in your project
• **Editing files** - Make real changes to source code
• **Generating previews** - See changes before applying
• **Code generation** - Create new components

Try asking me to:
- "Show me the Navbar component"
- "Edit the footer email address"
- "Create a new button component"
- "Search for glassmorphism styles"`,
            timestamp: new Date()
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [pendingChanges, setPendingChanges] = useState<CopilotChange[]>([]);
    const [previewAvailable, setPreviewAvailable] = useState(false);
    const [lastResponse, setLastResponse] = useState<CopilotResponse | null>(null);

    /**
     * Send a message to the Copilot AI
     */
    const sendMessage = useCallback(async (
        message: string,
        openFile?: { path: string; content: string }
    ): Promise<CopilotResponse | null> => {
        if (!message.trim() && !openFile) return null;
        
        // Add user message
        const userMessage: CopilotMessage = {
            id: `msg-${Date.now()}`,
            role: 'user',
            content: message,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        
        try {
            const response = await fetch('/api/ai/copilot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    sessionId: sessionId.current,
                    openFile,
                    action: 'chat'
                })
            });
            
            const data: CopilotResponse = await response.json();
            setLastResponse(data);
            
            // Handle response based on status
            if (data.status === 'error') {
                const errorMessage: CopilotMessage = {
                    id: `error-${Date.now()}`,
                    role: 'system',
                    content: `❌ Error: ${data.error || 'Unknown error'}`,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, errorMessage]);
                options.onError?.(data.error || 'Unknown error');
                return data;
            }
            
            // Build assistant message
            let assistantContent = data.changeset.summary;
            
            if (data.narration && data.narration.length > 0) {
                assistantContent += '\n\n**Actions taken:**\n' + data.narration.map(n => `• ${n}`).join('\n');
            }
            
            if (data.changeset.files.length > 0) {
                assistantContent += '\n\n**Files affected:**\n' + 
                    data.changeset.files.map(f => `• \`${f.path}\` (${f.action})`).join('\n');
            }
            
            if (data.preview.available) {
                assistantContent += '\n\n✨ **Preview available!** Click "Preview" to see changes before applying.';
                setPreviewAvailable(true);
                options.onPreviewReady?.(data.preview);
            }
            
            const assistantMessage: CopilotMessage = {
                id: `response-${Date.now()}`,
                role: 'assistant',
                content: assistantContent,
                timestamp: new Date(),
                changes: data.changeset.files,
                narration: data.narration
            };
            setMessages(prev => [...prev, assistantMessage]);
            
            // Update pending changes
            if (data.changeset.files.length > 0) {
                setPendingChanges(data.changeset.files);
                options.onFileChange?.(data.changeset.files);
            }
            
            return data;
            
        } catch (err) {
            const errorMessage: CopilotMessage = {
                id: `error-${Date.now()}`,
                role: 'system',
                content: `❌ Network error: ${err instanceof Error ? err.message : 'Unknown'}`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
            options.onError?.(err instanceof Error ? err.message : 'Unknown error');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [options]);

    /**
     * Request a preview of pending changes
     */
    const requestPreview = useCallback(async (): Promise<CopilotResponse | null> => {
        if (pendingChanges.length === 0) {
            const noChangesMessage: CopilotMessage = {
                id: `no-preview-${Date.now()}`,
                role: 'system',
                content: '⚠️ No pending changes to preview. Generate code first.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, noChangesMessage]);
            return null;
        }
        
        setIsLoading(true);
        
        try {
            const response = await fetch('/api/ai/copilot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: sessionId.current,
                    action: 'preview'
                })
            });
            
            const data: CopilotResponse = await response.json();
            setLastResponse(data);
            
            if (data.status === 'rejected') {
                const rejectMessage: CopilotMessage = {
                    id: `reject-${Date.now()}`,
                    role: 'system',
                    content: `⚠️ ${data.error || 'No previewable changes exist.'}`,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, rejectMessage]);
            } else if (data.preview.available) {
                options.onPreviewReady?.(data.preview);
            }
            
            return data;
            
        } catch (err) {
            options.onError?.(err instanceof Error ? err.message : 'Preview failed');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [pendingChanges, options]);

    /**
     * Apply pending changes
     */
    const applyChanges = useCallback(async (): Promise<boolean> => {
        if (pendingChanges.length === 0) {
            const noChangesMessage: CopilotMessage = {
                id: `no-apply-${Date.now()}`,
                role: 'system',
                content: '⚠️ No pending changes to apply. Generate code first.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, noChangesMessage]);
            return false;
        }
        
        setIsLoading(true);
        
        try {
            const response = await fetch('/api/ai/copilot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: sessionId.current,
                    action: 'apply'
                })
            });
            
            const data: CopilotResponse = await response.json();
            setLastResponse(data);
            
            if (data.status === 'applied') {
                const appliedFiles = data.changeset.files.map(f => f.path);
                const successMessage: CopilotMessage = {
                    id: `applied-${Date.now()}`,
                    role: 'system',
                    content: `✅ **Changes applied successfully!**\n\n${appliedFiles.map(f => `• \`${f}\``).join('\n')}\n\n🔄 Refresh to see changes.`,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, successMessage]);
                setPendingChanges([]);
                setPreviewAvailable(false);
                options.onApplied?.(appliedFiles);
                return true;
            } else if (data.status === 'rejected') {
                const rejectMessage: CopilotMessage = {
                    id: `reject-${Date.now()}`,
                    role: 'system',
                    content: `⚠️ ${data.error || 'No changes to apply.'}`,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, rejectMessage]);
                return false;
            } else if (data.status === 'error') {
                const errorMessage: CopilotMessage = {
                    id: `error-${Date.now()}`,
                    role: 'system',
                    content: `❌ Apply failed: ${data.error}`,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, errorMessage]);
                options.onError?.(data.error || 'Apply failed');
                return false;
            }
            
            return false;
            
        } catch (err) {
            options.onError?.(err instanceof Error ? err.message : 'Apply failed');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [pendingChanges, options]);

    /**
     * Clear pending changes
     */
    const clearPendingChanges = useCallback(() => {
        setPendingChanges([]);
        setPreviewAvailable(false);
        const clearMessage: CopilotMessage = {
            id: `clear-${Date.now()}`,
            role: 'system',
            content: '🗑️ Pending changes cleared.',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, clearMessage]);
    }, []);

    /**
     * Reset the session
     */
    const resetSession = useCallback(() => {
        sessionId.current = `session-${Date.now()}`;
        setMessages([{
            id: 'reset',
            role: 'system',
            content: '🔄 Session reset. Start fresh!',
            timestamp: new Date()
        }]);
        setPendingChanges([]);
        setPreviewAvailable(false);
        setLastResponse(null);
    }, []);

    return {
        // State
        messages,
        isLoading,
        pendingChanges,
        previewAvailable,
        lastResponse,
        sessionId: sessionId.current,
        
        // Actions
        sendMessage,
        requestPreview,
        applyChanges,
        clearPendingChanges,
        resetSession,
        
        // Computed
        hasPendingChanges: pendingChanges.length > 0,
        canPreview: previewAvailable && pendingChanges.length > 0,
        canApply: pendingChanges.length > 0
    };
}

export default useCopilotAI;
