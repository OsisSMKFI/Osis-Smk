'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Paintbrush, Code, Eye, Save, Undo, Redo, 
    MessageSquare, Layers, Settings, Palette, 
    Layout, Type, Box, Image, MousePointer,
    Sparkles, Wand2, RefreshCw, Download, Upload,
    ChevronDown, ChevronRight, Play, Copy, Check,
    Trash2, Plus, Search, Filter, History, X, Send,
    Monitor, Smartphone, Tablet, Moon, Sun, Zap,
    Command, Terminal, Database, AlertCircle, Info
} from 'lucide-react';
import { DESIGN_REGISTRY, getAllComponentNames, findComponent } from '@/lib/design-registry';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 DESIGN STUDIO PRO - Full Access AI-Powered Design System
// ═══════════════════════════════════════════════════════════════════════════════
// Features:
// - Full AI Access (same as LiveChat)
// - Inline CSS Editor with Live Preview
// - Command Palette with all AI commands
// - Real-time Design Application
// - Component Tree Navigator
// ═══════════════════════════════════════════════════════════════════════════════

interface DesignOverride {
    page_key: string;
    title: string;
    content: string;
    category: string;
    updated_at: string;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    action?: {
        type: string;
        component?: string;
        status: 'pending' | 'success' | 'failed';
    };
    cssCode?: string;
}

// AI Command definitions (same as LiveChat)
const AI_COMMANDS = [
    { cmd: '/help', desc: 'Daftar perintah lengkap' },
    { cmd: '/design', desc: '🎨 Redesign komponen', template: '/design <component> <style>' },
    { cmd: '/preview', desc: '👁️ Preview CSS untuk komponen', template: '/preview <component>' },
    { cmd: '/apply', desc: '✅ Terapkan design langsung', template: '/apply <component> <css>' },
    { cmd: '/template', desc: '📋 Gunakan template style', template: '/template <style> <component>' },
    { cmd: '/reset', desc: '🔄 Reset ke default', template: '/reset <component>' },
    { cmd: '/list', desc: '📝 List semua override aktif', template: '/list' },
    { cmd: '/export', desc: '📦 Export semua CSS', template: '/export' },
    { cmd: '/sql', desc: '🔍 Query database', template: '/sql SELECT * FROM page_content WHERE category=\'design\'' },
    { cmd: '/generate', desc: '🖼️ Generate design dengan AI', template: '/generate <deskripsi>' },
    { cmd: '/analyze', desc: '🔬 Analyze komponen', template: '/analyze <component>' },
    { cmd: '/clear', desc: '🗑️ Hapus chat history' },
];

const DESIGN_STYLES = [
    { id: 'neumorphism', name: 'Neumorphism', desc: '3D soft shadows', preview: 'box-shadow: 8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff; border-radius: 12px;' },
    { id: 'glassmorphism', name: 'Glassmorphism', desc: 'Frosted glass effect', preview: 'background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2);' },
    { id: 'modern', name: 'Modern', desc: 'Clean minimal design', preview: 'background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);' },
    { id: 'dark', name: 'Dark', desc: 'Dark theme', preview: 'background: #1a1a2e; color: #eee; border: 1px solid #333;' },
    { id: 'gradient', name: 'Gradient', desc: 'Colorful gradients', preview: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;' },
    { id: 'minimal', name: 'Minimal', desc: 'Simple and clean', preview: 'background: #fafafa; border: 1px solid #eee; border-radius: 4px;' },
    { id: 'neon', name: 'Neon', desc: 'Glowing effects', preview: 'background: #0a0a0a; box-shadow: 0 0 20px #00ff88, inset 0 0 20px rgba(0,255,136,0.1); border: 1px solid #00ff88;' },
    { id: 'retro', name: 'Retro', desc: 'Vintage look', preview: 'background: #f4e4ba; border: 3px solid #2d2d2d; font-family: monospace;' },
];

export default function DesignStudioPage() {
    // State
    const [activeTab, setActiveTab] = useState<'visual' | 'code' | 'chat'>('chat');
    const [selectedComponent, setSelectedComponent] = useState<string>('');
    const [selectedStyle, setSelectedStyle] = useState<string>('modern');
    const [customCSS, setCustomCSS] = useState<string>('');
    const [designs, setDesigns] = useState<DesignOverride[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    const [darkMode, setDarkMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<string[]>(['layout', 'form', 'chat', 'button', 'card']);
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [showPreview, setShowPreview] = useState(true);
    const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    
    // Command palette state
    const [showCommands, setShowCommands] = useState(false);
    const [commandFilter, setCommandFilter] = useState('');
    
    // Chat state - now with enhanced AI capabilities
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            role: 'assistant',
            content: `🎨 **Selamat datang di Design Studio Pro!**

Saya AI Design Assistant dengan **full access** untuk:

• **Redesign komponen** - "/design button glassmorphism"
• **Preview CSS** - "/preview chat_input"  
• **Apply langsung** - "/apply card .card { ... }"
• **Template siap pakai** - "/template neon sidebar"
• **Query database** - "/sql SELECT * FROM page_content"

Ketik \`/help\` untuk daftar lengkap perintah.

**Quick Start:** Pilih komponen dari sidebar, lalu ketik gaya yang diinginkan!`,
            timestamp: new Date(),
        }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [isAITyping, setIsAITyping] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Load existing designs
    useEffect(() => {
        loadDesigns();
    }, []);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    // Load component CSS when selected
    useEffect(() => {
        if (selectedComponent) {
            const existing = designs.find(d => d.page_key === `design_override_${selectedComponent}`);
            if (existing) {
                setCustomCSS(existing.content);
                addSystemMessage(`📂 Loaded CSS for **${selectedComponent}** (${existing.content.length} chars)`);
            } else {
                setCustomCSS('');
            }
        }
    }, [selectedComponent]);
    
    // Show command suggestions
    useEffect(() => {
        if (chatInput.startsWith('/')) {
            setShowCommands(true);
            setCommandFilter(chatInput.slice(1).toLowerCase());
        } else {
            setShowCommands(false);
        }
    }, [chatInput]);

    const addSystemMessage = (content: string) => {
        setChatMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content,
            timestamp: new Date(),
        }]);
    };

    const loadDesigns = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/design/load-all');
            const data = await res.json();
            if (data.components) {
                // Fetch full design data
                const designRes = await fetch('/api/admin/content?category=design');
                const designData = await designRes.json();
                if (designData.data) {
                    setDesigns(designData.data);
                }
            }
        } catch (error) {
            console.error('Failed to load designs:', error);
            showNotification('error', 'Gagal memuat design');
        } finally {
            setIsLoading(false);
        }
    };

    const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    const applyDesign = async (component: string, style: string, css?: string) => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/ai/execute-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'apply_design',
                    params: {
                        component,
                        designType: style,
                        customCss: css,
                    },
                }),
            });

            const result = await res.json();
            
            if (result.success) {
                showNotification('success', `Design ${style} untuk ${component} berhasil diterapkan!`);
                await loadDesigns();
                
                // Add to history
                setHistory(prev => [...prev.slice(0, historyIndex + 1), customCSS]);
                setHistoryIndex(prev => prev + 1);
                
                // Trigger global design reload
                if (typeof window !== 'undefined' && (window as any).reloadDesigns) {
                    (window as any).reloadDesigns();
                }
            } else {
                showNotification('error', result.details || 'Gagal menerapkan design');
            }
        } catch (error) {
            console.error('Apply design error:', error);
            showNotification('error', 'Terjadi kesalahan saat menerapkan design');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveCSS = async () => {
        if (!selectedComponent) {
            showNotification('error', 'Pilih komponen terlebih dahulu');
            return;
        }
        await applyDesign(selectedComponent, 'custom', customCSS);
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(prev => prev - 1);
            setCustomCSS(history[historyIndex - 1]);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(prev => prev + 1);
            setCustomCSS(history[historyIndex + 1]);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // 🤖 ENHANCED AI CHAT HANDLER - Full Access Commands
    // ═══════════════════════════════════════════════════════════════════════════
    const handleSendMessage = async () => {
        if (!chatInput.trim() || isAITyping) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: chatInput,
            timestamp: new Date(),
        };

        const inputText = chatInput.trim();
        setChatMessages(prev => [...prev, userMessage]);
        setChatInput('');
        setShowCommands(false);
        setIsAITyping(true);

        try {
            // Handle slash commands locally first
            if (inputText.startsWith('/')) {
                const handled = await handleSlashCommand(inputText);
                if (handled) {
                    setIsAITyping(false);
                    return;
                }
            }

            // Send to AI chat API with enhanced context
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: inputText,
                    context: 'design_studio',
                    selectedComponent,
                    mode: 'admin',
                    history: chatMessages.slice(-10).map(m => ({
                        role: m.role,
                        content: m.content,
                    })),
                }),
            });

            const data = await res.json();
            
            const aiMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.reply || 'Maaf, terjadi kesalahan.',
                timestamp: new Date(),
                action: data.designApplied ? {
                    type: 'apply_design',
                    component: data.component,
                    status: 'success',
                } : undefined,
                cssCode: data.cssCode,
            };

            setChatMessages(prev => [...prev, aiMessage]);
            
            // If CSS code was generated, update editor
            if (data.cssCode && selectedComponent) {
                setCustomCSS(data.cssCode);
                setActiveTab('code');
            }
            
            // If design was applied, reload
            if (data.designApplied) {
                await loadDesigns();
                if (typeof window !== 'undefined' && (window as any).reloadDesigns) {
                    (window as any).reloadDesigns();
                }
                showNotification('success', `Design untuk ${data.component} berhasil diterapkan!`);
            }
        } catch (error) {
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '⚠️ Terjadi kesalahan. Silakan coba lagi.',
                timestamp: new Date(),
            };
            setChatMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsAITyping(false);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // ⚡ SLASH COMMAND HANDLER - Full Access Commands
    // ═══════════════════════════════════════════════════════════════════════════
    const handleSlashCommand = async (input: string): Promise<boolean> => {
        const parts = input.slice(1).split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1).join(' ');

        switch (cmd) {
            case 'help':
                addSystemMessage(`📚 **Design Studio Commands**

**Design Commands:**
• \`/design <component> <style>\` - Apply design template
• \`/preview <component>\` - Show current CSS
• \`/apply <component> <css>\` - Apply custom CSS directly
• \`/template <style> <component>\` - Use preset template
• \`/reset <component>\` - Remove custom design

**Data Commands:**
• \`/list\` - Show all active overrides
• \`/export\` - Export all CSS as file
• \`/sql <query>\` - Run database query

**AI Commands:**
• \`/generate <desc>\` - AI generate design
• \`/analyze <component>\` - Analyze component

**Other:**
• \`/clear\` - Clear chat history

**Available Styles:** ${DESIGN_STYLES.map(s => s.id).join(', ')}`);
                return true;

            case 'clear':
                setChatMessages([{
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: '🗑️ Chat history cleared. Ready for new commands!',
                    timestamp: new Date(),
                }]);
                return true;

            case 'list':
                const activeDesigns = designs.filter(d => d.page_key.startsWith('design_override_'));
                if (activeDesigns.length === 0) {
                    addSystemMessage('📝 No active design overrides found.');
                } else {
                    const list = activeDesigns.map(d => {
                        const name = d.page_key.replace('design_override_', '');
                        return `• **${name}** - ${d.content.length} chars (${new Date(d.updated_at).toLocaleDateString()})`;
                    }).join('\n');
                    addSystemMessage(`📝 **Active Design Overrides (${activeDesigns.length}):**\n\n${list}`);
                }
                return true;

            case 'preview':
                const previewComp = args || selectedComponent;
                if (!previewComp) {
                    addSystemMessage('⚠️ Please specify a component: `/preview button`');
                    return true;
                }
                const previewDesign = designs.find(d => d.page_key === `design_override_${previewComp}`);
                if (previewDesign) {
                    addSystemMessage(`👁️ **CSS for ${previewComp}:**\n\n\`\`\`css\n${previewDesign.content}\n\`\`\``);
                    setSelectedComponent(previewComp);
                    setCustomCSS(previewDesign.content);
                } else {
                    addSystemMessage(`ℹ️ No custom CSS found for **${previewComp}**`);
                }
                return true;

            case 'reset':
                const resetComp = args || selectedComponent;
                if (!resetComp) {
                    addSystemMessage('⚠️ Please specify component: `/reset button`');
                    return true;
                }
                try {
                    const res = await fetch('/api/design/studio', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ component: resetComp }),
                    });
                    if (res.ok) {
                        addSystemMessage(`✅ Design reset for **${resetComp}**`);
                        await loadDesigns();
                        setCustomCSS('');
                    } else {
                        addSystemMessage(`❌ Failed to reset ${resetComp}`);
                    }
                } catch (e) {
                    addSystemMessage(`❌ Error resetting design`);
                }
                return true;

            case 'design':
            case 'template':
                const [comp, style] = args.split(' ').filter(Boolean);
                if (!comp || !style) {
                    addSystemMessage(`⚠️ Usage: \`/${cmd} <component> <style>\`\n\nStyles: ${DESIGN_STYLES.map(s => s.id).join(', ')}`);
                    return true;
                }
                const styleInfo = DESIGN_STYLES.find(s => s.id === style.toLowerCase());
                if (!styleInfo) {
                    addSystemMessage(`⚠️ Unknown style: ${style}\n\nAvailable: ${DESIGN_STYLES.map(s => s.id).join(', ')}`);
                    return true;
                }
                addSystemMessage(`⏳ Applying **${styleInfo.name}** to **${comp}**...`);
                await applyDesign(comp, style);
                addSystemMessage(`✅ **${styleInfo.name}** applied to **${comp}**!\n\nPreview: \`${styleInfo.preview}\``);
                setSelectedComponent(comp);
                return true;

            case 'apply':
                const applyMatch = args.match(/^(\S+)\s+(.+)$/s);
                if (!applyMatch) {
                    addSystemMessage('⚠️ Usage: `/apply <component> <css>`\n\nExample: `/apply button .btn { background: blue; }`');
                    return true;
                }
                const [, applyComp, applyCss] = applyMatch;
                addSystemMessage(`⏳ Applying custom CSS to **${applyComp}**...`);
                await applyDesign(applyComp, 'custom', applyCss);
                addSystemMessage(`✅ Custom CSS applied to **${applyComp}**!`);
                setSelectedComponent(applyComp);
                setCustomCSS(applyCss);
                return true;

            case 'export':
                const allCss = designs
                    .filter(d => d.page_key.startsWith('design_override_'))
                    .map(d => `/* ${d.page_key} */\n${d.content}`)
                    .join('\n\n');
                if (allCss) {
                    navigator.clipboard.writeText(allCss);
                    addSystemMessage(`📦 **All CSS exported to clipboard!** (${allCss.length} chars)`);
                } else {
                    addSystemMessage('📦 No design overrides to export');
                }
                return true;

            case 'sql':
                if (!args) {
                    addSystemMessage('⚠️ Usage: `/sql SELECT * FROM page_content WHERE category=\'design\'`');
                    return true;
                }
                addSystemMessage(`🔍 Executing query...\n\n\`${args}\``);
                try {
                    const sqlRes = await fetch('/api/ai/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message: `/sql ${args}`,
                            mode: 'admin',
                        }),
                    });
                    const sqlData = await sqlRes.json();
                    addSystemMessage(sqlData.reply || '❌ Query failed');
                } catch (e) {
                    addSystemMessage('❌ SQL query error');
                }
                return true;

            case 'analyze':
                const analyzeComp = args || selectedComponent;
                if (!analyzeComp) {
                    addSystemMessage('⚠️ Usage: `/analyze <component>`');
                    return true;
                }
                const compInfo = findComponent(analyzeComp);
                if (compInfo) {
                    const existing = designs.find(d => d.page_key === `design_override_${analyzeComp}`);
                    addSystemMessage(`🔬 **Component Analysis: ${compInfo.displayName}**

**Category:** ${compInfo.category}
**CSS Selectors:** ${compInfo.selectors.join(', ')}
**Has Override:** ${existing ? 'Yes (' + existing.content.length + ' chars)' : 'No'}
**Description:** ${compInfo.description}`);
                } else {
                    addSystemMessage(`⚠️ Component not found: ${analyzeComp}`);
                }
                return true;

            case 'generate':
                // Let AI handle generation
                return false;

            default:
                // Unknown command, let AI handle it
                return false;
        }
    };

    // Quick apply design from chat
    const handleQuickApply = async (component: string, style: string) => {
        const msg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: `Terapkan design ${style} untuk ${component}`,
            timestamp: new Date(),
        };
        setChatMessages(prev => [...prev, msg]);
        
        setIsAITyping(true);
        await applyDesign(component, style);
        
        const successMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `✅ Design **${style}** berhasil diterapkan untuk **${component}**! Refresh halaman untuk melihat perubahan.`,
            timestamp: new Date(),
            action: { type: 'apply_design', component, status: 'success' },
        };
        setChatMessages(prev => [...prev, successMsg]);
        setIsAITyping(false);
    };

    // Group components by category
    const groupedComponents = Object.entries(DESIGN_REGISTRY).reduce((acc, [key, info]) => {
        if (!acc[info.category]) acc[info.category] = [];
        acc[info.category].push({ key, ...info });
        return acc;
    }, {} as Record<string, any[]>);

    // Filter components
    const filteredComponents = searchQuery
        ? Object.values(DESIGN_REGISTRY).filter(c => 
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.displayName.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : null;

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            {/* Header */}
            <header className={`sticky top-0 z-50 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                            <Paintbrush className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Design Studio</h1>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                AI-Powered Design System
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Preview mode */}
                        <div className={`flex rounded-lg p-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <button
                                onClick={() => setPreviewMode('desktop')}
                                className={`p-2 rounded ${previewMode === 'desktop' ? 'bg-white shadow text-purple-600' : ''}`}
                            >
                                <Monitor className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPreviewMode('tablet')}
                                className={`p-2 rounded ${previewMode === 'tablet' ? 'bg-white shadow text-purple-600' : ''}`}
                            >
                                <Tablet className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPreviewMode('mobile')}
                                className={`p-2 rounded ${previewMode === 'mobile' ? 'bg-white shadow text-purple-600' : ''}`}
                            >
                                <Smartphone className="w-4 h-4" />
                            </button>
                        </div>

                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                        >
                            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>

                        <button
                            onClick={loadDesigns}
                            className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                            disabled={isLoading}
                        >
                            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex px-4 gap-1">
                    {[
                        { id: 'visual', icon: Layers, label: 'Visual Editor' },
                        { id: 'code', icon: Code, label: 'Code Editor' },
                        { id: 'chat', icon: MessageSquare, label: 'AI Assistant' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-all ${
                                activeTab === tab.id
                                    ? darkMode
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-gray-50 text-purple-600'
                                    : darkMode
                                        ? 'text-gray-400 hover:text-gray-300'
                                        : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            {/* Notification */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
                            notification.type === 'success'
                                ? 'bg-green-500 text-white'
                                : 'bg-red-500 text-white'
                        }`}
                    >
                        {notification.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex h-[calc(100vh-120px)]">
                {/* Sidebar - Component List */}
                <aside className={`w-72 border-r ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} overflow-y-auto`}>
                    {/* Search */}
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <Search className="w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari komponen..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent border-none outline-none text-sm"
                            />
                        </div>
                    </div>

                    {/* Component Tree */}
                    <div className="p-2">
                        {filteredComponents ? (
                            <div className="space-y-1">
                                {filteredComponents.map((comp) => (
                                    <button
                                        key={comp.name}
                                        onClick={() => setSelectedComponent(comp.name)}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all ${
                                            selectedComponent === comp.name
                                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                                : darkMode
                                                    ? 'hover:bg-gray-700'
                                                    : 'hover:bg-gray-100'
                                        }`}
                                    >
                                        <Box className="w-4 h-4" />
                                        <span>{comp.displayName}</span>
                                        {designs.some(d => d.page_key === `design_override_${comp.name}`) && (
                                            <span className="ml-auto w-2 h-2 bg-green-500 rounded-full" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            Object.entries(groupedComponents).map(([category, components]) => (
                                <div key={category} className="mb-2">
                                    <button
                                        onClick={() => setExpandedCategories(prev =>
                                            prev.includes(category)
                                                ? prev.filter(c => c !== category)
                                                : [...prev, category]
                                        )}
                                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold uppercase tracking-wider ${
                                            darkMode ? 'text-gray-400' : 'text-gray-500'
                                        }`}
                                    >
                                        {expandedCategories.includes(category) ? (
                                            <ChevronDown className="w-4 h-4" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4" />
                                        )}
                                        {category}
                                        <span className="ml-auto text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full">
                                            {components.length}
                                        </span>
                                    </button>
                                    
                                    {expandedCategories.includes(category) && (
                                        <div className="ml-2 space-y-1">
                                            {components.map((comp) => (
                                                <button
                                                    key={comp.key}
                                                    onClick={() => setSelectedComponent(comp.key)}
                                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all ${
                                                        selectedComponent === comp.key
                                                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                                            : darkMode
                                                                ? 'hover:bg-gray-700'
                                                                : 'hover:bg-gray-100'
                                                    }`}
                                                >
                                                    <Box className="w-4 h-4 opacity-50" />
                                                    <span>{comp.displayName}</span>
                                                    {designs.some(d => d.page_key === `design_override_${comp.key}`) && (
                                                        <span className="ml-auto w-2 h-2 bg-green-500 rounded-full" title="Has custom design" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </aside>

                {/* Main Panel */}
                <main className="flex-1 flex flex-col overflow-hidden">
                    {activeTab === 'visual' && (
                        <VisualEditor
                            selectedComponent={selectedComponent}
                            selectedStyle={selectedStyle}
                            setSelectedStyle={setSelectedStyle}
                            onApply={applyDesign}
                            isSaving={isSaving}
                            darkMode={darkMode}
                            previewMode={previewMode}
                        />
                    )}

                    {activeTab === 'code' && (
                        <CodeEditor
                            selectedComponent={selectedComponent}
                            customCSS={customCSS}
                            setCustomCSS={setCustomCSS}
                            onSave={handleSaveCSS}
                            onUndo={handleUndo}
                            onRedo={handleRedo}
                            canUndo={historyIndex > 0}
                            canRedo={historyIndex < history.length - 1}
                            isSaving={isSaving}
                            darkMode={darkMode}
                        />
                    )}

                    {activeTab === 'chat' && (
                        <ChatPanel
                            messages={chatMessages}
                            input={chatInput}
                            setInput={setChatInput}
                            onSend={handleSendMessage}
                            isTyping={isAITyping}
                            darkMode={darkMode}
                            chatEndRef={chatEndRef}
                            onQuickApply={handleQuickApply}
                            selectedComponent={selectedComponent}
                            showCommands={showCommands}
                            commandFilter={commandFilter}
                        />
                    )}
                </main>

                {/* Preview Panel */}
                {showPreview && (
                    <aside className={`w-96 border-l ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} overflow-hidden flex flex-col`}>
                        <div className={`flex items-center justify-between px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                <span className="font-medium">Live Preview</span>
                            </div>
                            <button onClick={() => setShowPreview(false)}>
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-1 p-4 overflow-auto">
                            <LivePreview
                                component={selectedComponent}
                                css={customCSS}
                                previewMode={previewMode}
                                darkMode={darkMode}
                            />
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 VISUAL EDITOR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
function VisualEditor({
    selectedComponent,
    selectedStyle,
    setSelectedStyle,
    onApply,
    isSaving,
    darkMode,
    previewMode,
}: {
    selectedComponent: string;
    selectedStyle: string;
    setSelectedStyle: (style: string) => void;
    onApply: (component: string, style: string) => void;
    isSaving: boolean;
    darkMode: boolean;
    previewMode: string;
}) {
    const componentInfo = selectedComponent ? findComponent(selectedComponent) : null;

    if (!selectedComponent) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <Layers className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h2 className="text-xl font-semibold mb-2">Pilih Komponen</h2>
                    <p className="text-gray-500">Pilih komponen dari sidebar untuk mulai mendesain</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto p-6">
            <div className="max-w-4xl mx-auto">
                {/* Component Info */}
                <div className={`mb-6 p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-white'} shadow`}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Box className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">{componentInfo?.displayName || selectedComponent}</h2>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {componentInfo?.description}
                            </p>
                        </div>
                    </div>
                    
                    <div className="mt-3 flex flex-wrap gap-2">
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded">
                            Category: {componentInfo?.category}
                        </span>
                        {componentInfo?.selectors.slice(0, 3).map((sel, i) => (
                            <code key={i} className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded">
                                {sel}
                            </code>
                        ))}
                    </div>
                </div>

                {/* Style Selection */}
                <h3 className="font-semibold mb-3">Pilih Style</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                    {DESIGN_STYLES.map((style) => (
                        <button
                            key={style.id}
                            onClick={() => setSelectedStyle(style.id)}
                            className={`p-4 rounded-xl border-2 transition-all text-left ${
                                selectedStyle === style.id
                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                    : darkMode
                                        ? 'border-gray-600 hover:border-gray-500 bg-gray-700'
                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                        >
                            <Palette className={`w-5 h-5 mb-2 ${selectedStyle === style.id ? 'text-purple-500' : ''}`} />
                            <div className="font-medium">{style.name}</div>
                            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {style.desc}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Apply Button */}
                <button
                    onClick={() => onApply(selectedComponent, selectedStyle)}
                    disabled={isSaving}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {isSaving ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                        <Wand2 className="w-5 h-5" />
                    )}
                    {isSaving ? 'Menerapkan...' : 'Terapkan Design'}
                </button>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 💻 CODE EDITOR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
function CodeEditor({
    selectedComponent,
    customCSS,
    setCustomCSS,
    onSave,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    isSaving,
    darkMode,
}: {
    selectedComponent: string;
    customCSS: string;
    setCustomCSS: (css: string) => void;
    onSave: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    isSaving: boolean;
    darkMode: boolean;
}) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(customCSS);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!selectedComponent) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <Code className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h2 className="text-xl font-semibold mb-2">Pilih Komponen</h2>
                    <p className="text-gray-500">Pilih komponen untuk mengedit CSS</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className={`flex items-center justify-between px-4 py-2 border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onUndo}
                        disabled={!canUndo}
                        className={`p-2 rounded ${canUndo ? 'hover:bg-gray-200 dark:hover:bg-gray-700' : 'opacity-50'}`}
                    >
                        <Undo className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onRedo}
                        disabled={!canRedo}
                        className={`p-2 rounded ${canRedo ? 'hover:bg-gray-200 dark:hover:bg-gray-700' : 'opacity-50'}`}
                    >
                        <Redo className="w-4 h-4" />
                    </button>
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />
                    <button
                        onClick={handleCopy}
                        className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {selectedComponent}.css
                    </span>
                    <button
                        onClick={onSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        Simpan
                    </button>
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-hidden">
                <textarea
                    value={customCSS}
                    onChange={(e) => setCustomCSS(e.target.value)}
                    placeholder={`/* CSS untuk ${selectedComponent} */\n\n.${selectedComponent} {\n  /* tambahkan style di sini */\n}`}
                    className={`w-full h-full p-4 font-mono text-sm resize-none outline-none ${
                        darkMode
                            ? 'bg-gray-900 text-gray-100'
                            : 'bg-white text-gray-800'
                    }`}
                    style={{ tabSize: 2 }}
                    spellCheck={false}
                />
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 💬 CHAT PANEL COMPONENT - Enhanced with Command Palette
// ═══════════════════════════════════════════════════════════════════════════════
function ChatPanel({
    messages,
    input,
    setInput,
    onSend,
    isTyping,
    darkMode,
    chatEndRef,
    onQuickApply,
    selectedComponent,
    showCommands,
    commandFilter,
}: {
    messages: ChatMessage[];
    input: string;
    setInput: (val: string) => void;
    onSend: () => void;
    isTyping: boolean;
    darkMode: boolean;
    chatEndRef: React.RefObject<HTMLDivElement | null>;
    onQuickApply: (component: string, style: string) => void;
    selectedComponent: string;
    showCommands?: boolean;
    commandFilter?: string;
}) {
    const [selectedCmdIndex, setSelectedCmdIndex] = useState(0);
    
    const filteredCommands = AI_COMMANDS.filter(c => 
        !commandFilter || c.cmd.toLowerCase().includes(commandFilter) || c.desc.toLowerCase().includes(commandFilter)
    );
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showCommands && filteredCommands.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedCmdIndex(prev => (prev + 1) % filteredCommands.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedCmdIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
            } else if (e.key === 'Tab' || (e.key === 'Enter' && filteredCommands.length > 0)) {
                e.preventDefault();
                const cmd = filteredCommands[selectedCmdIndex];
                setInput(cmd.template || cmd.cmd + ' ');
            }
        } else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };
    
    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Command Palette */}
            {showCommands && filteredCommands.length > 0 && (
                <div className={`absolute bottom-20 left-4 right-4 z-50 rounded-xl shadow-2xl overflow-hidden ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                    <div className={`px-3 py-2 text-xs font-medium ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                        <Command className="w-3 h-3 inline mr-1" /> AI Commands
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {filteredCommands.map((cmd, i) => (
                            <button
                                key={cmd.cmd}
                                onClick={() => setInput(cmd.template || cmd.cmd + ' ')}
                                className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                                    i === selectedCmdIndex
                                        ? darkMode ? 'bg-purple-900/50' : 'bg-purple-50'
                                        : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                                }`}
                            >
                                <code className="text-purple-500 font-mono text-sm">{cmd.cmd}</code>
                                <span className={`flex-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{cmd.desc}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Actions Bar */}
            <div className={`flex items-center gap-2 px-4 py-2 border-b overflow-x-auto ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-purple-50 border-purple-100'}`}>
                <span className="text-xs font-medium whitespace-nowrap opacity-60">Quick:</span>
                {selectedComponent ? (
                    <>
                        {DESIGN_STYLES.slice(0, 5).map((style) => (
                            <button
                                key={style.id}
                                onClick={() => onQuickApply(selectedComponent, style.id)}
                                className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-700 rounded-full text-xs border border-gray-200 dark:border-gray-600 hover:border-purple-400 whitespace-nowrap transition-colors"
                            >
                                <Sparkles className="w-3 h-3" />
                                {style.name}
                            </button>
                        ))}
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => setInput('/help')}
                            className="px-2 py-1 bg-white dark:bg-gray-700 rounded-full text-xs border border-gray-200 dark:border-gray-600 hover:border-purple-400"
                        >
                            /help
                        </button>
                        <button
                            onClick={() => setInput('/list')}
                            className="px-2 py-1 bg-white dark:bg-gray-700 rounded-full text-xs border border-gray-200 dark:border-gray-600 hover:border-purple-400"
                        >
                            /list
                        </button>
                        <button
                            onClick={() => setInput('/design button ')}
                            className="px-2 py-1 bg-white dark:bg-gray-700 rounded-full text-xs border border-gray-200 dark:border-gray-600 hover:border-purple-400"
                        >
                            /design
                        </button>
                    </>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                                msg.role === 'user'
                                    ? 'bg-purple-600 text-white rounded-br-md'
                                    : darkMode
                                        ? 'bg-gray-700 rounded-bl-md'
                                        : 'bg-gray-100 rounded-bl-md'
                            }`}
                        >
                            <div className="whitespace-pre-wrap text-sm" dangerouslySetInnerHTML={{
                                __html: msg.content
                                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-black/10 rounded text-xs font-mono">$1</code>')
                                    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="mt-2 p-2 bg-black/20 rounded text-xs overflow-x-auto"><code>$2</code></pre>')
                                    .replace(/\n/g, '<br/>')
                            }} />
                            {msg.action && (
                                <div className={`mt-2 pt-2 border-t ${msg.role === 'user' ? 'border-purple-400' : 'border-gray-300 dark:border-gray-600'} flex items-center gap-2 text-xs`}>
                                    {msg.action.status === 'success' ? (
                                        <Check className="w-4 h-4 text-green-400" />
                                    ) : (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    )}
                                    <span>Design applied: {msg.action.component}</span>
                                </div>
                            )}
                            {msg.cssCode && (
                                <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                                    <button 
                                        onClick={() => navigator.clipboard.writeText(msg.cssCode!)}
                                        className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
                                    >
                                        <Copy className="w-3 h-3" /> Copy CSS
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                
                {isTyping && (
                    <div className="flex justify-start">
                        <div className={`px-4 py-3 rounded-2xl rounded-bl-md ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Enhanced Input */}
            <div className={`p-4 border-t ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className={`flex items-end gap-2 p-2 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={selectedComponent 
                            ? `Design ${selectedComponent}... (cth: buat glassmorphism)` 
                            : "Ketik / untuk commands atau tanya AI..."
                        }
                        rows={1}
                        className="flex-1 bg-transparent border-none outline-none px-2 resize-none max-h-32 min-h-[40px]"
                        style={{ height: 'auto' }}
                    />
                    <button
                        onClick={onSend}
                        disabled={!input.trim() || isTyping}
                        className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                        {isTyping ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <span>Tip: Ketik <code className="px-1 bg-gray-200 dark:bg-gray-600 rounded">/</code> untuk commands</span>
                    <span>•</span>
                    <span>Enter untuk kirim</span>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 👁️ LIVE PREVIEW COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
function LivePreview({
    component,
    css,
    previewMode,
    darkMode,
}: {
    component: string;
    css: string;
    previewMode: string;
    darkMode: boolean;
}) {
    const getPreviewContent = () => {
        const componentInfo = component ? findComponent(component) : null;
        
        if (!component) {
            return (
                <div className="text-center py-12 text-gray-400">
                    <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Pilih komponen untuk preview</p>
                </div>
            );
        }

        // Generate preview based on component type
        switch (componentInfo?.category) {
            case 'button':
                return (
                    <div className="space-y-4">
                        <button className="btn">Primary Button</button>
                        <button className="btn btn-secondary">Secondary</button>
                        <button className="btn" disabled>Disabled</button>
                    </div>
                );
            case 'card':
                return (
                    <div className="card">
                        <div className="card-header">Card Header</div>
                        <div className="card-body">
                            <p>This is the card body content.</p>
                        </div>
                        <div className="card-footer">Card Footer</div>
                    </div>
                );
            case 'form':
                return (
                    <form className="space-y-4">
                        <div>
                            <label>Name</label>
                            <input type="text" placeholder="Enter name..." className="input" />
                        </div>
                        <div>
                            <label>Email</label>
                            <input type="email" placeholder="Enter email..." className="input" />
                        </div>
                        <textarea placeholder="Message..." className="textarea" rows={3} />
                        <button type="submit" className="btn">Submit</button>
                    </form>
                );
            case 'chat':
                return (
                    <div className="chat-widget space-y-3">
                        <div className="chat-message">Hello! How can I help?</div>
                        <div className="chat-message user">I need help with design</div>
                        <div className="chat-input-container">
                            <input type="text" placeholder="Type a message..." className="chat-input" />
                            <button className="chat-button">Send</button>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className={`p-4 rounded-lg border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Component: {componentInfo?.displayName || component}
                        </div>
                        <div className="mt-2">
                            <code className="text-xs">{componentInfo?.selectors.join(', ')}</code>
                        </div>
                    </div>
                );
        }
    };

    const getPreviewWidth = () => {
        switch (previewMode) {
            case 'mobile': return 'max-w-[320px]';
            case 'tablet': return 'max-w-[768px]';
            default: return 'w-full';
        }
    };

    return (
        <div className="h-full">
            {/* Inject custom CSS */}
            {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
            
            <div className={`${getPreviewWidth()} mx-auto transition-all duration-300`}>
                {getPreviewContent()}
            </div>
        </div>
    );
}
