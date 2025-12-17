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
    Monitor, Smartphone, Tablet, Moon, Sun
} from 'lucide-react';
import { DESIGN_REGISTRY, getAllComponentNames, findComponent } from '@/lib/design-registry';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 DESIGN STUDIO - Complete Design Panel for Super Admin
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
}

const DESIGN_STYLES = [
    { id: 'neumorphism', name: 'Neumorphism', desc: '3D soft shadows' },
    { id: 'glassmorphism', name: 'Glassmorphism', desc: 'Frosted glass effect' },
    { id: 'modern', name: 'Modern', desc: 'Clean minimal design' },
    { id: 'dark', name: 'Dark', desc: 'Dark theme' },
    { id: 'gradient', name: 'Gradient', desc: 'Colorful gradients' },
    { id: 'minimal', name: 'Minimal', desc: 'Simple and clean' },
];

export default function DesignStudioPage() {
    // State
    const [activeTab, setActiveTab] = useState<'visual' | 'code' | 'chat'>('visual');
    const [selectedComponent, setSelectedComponent] = useState<string>('');
    const [selectedStyle, setSelectedStyle] = useState<string>('modern');
    const [customCSS, setCustomCSS] = useState<string>('');
    const [designs, setDesigns] = useState<DesignOverride[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    const [darkMode, setDarkMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<string[]>(['layout', 'form', 'chat']);
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [showPreview, setShowPreview] = useState(true);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    
    // Chat state
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Halo! Saya AI Design Assistant. Saya bisa membantu Anda:\n\n• **Redesign komponen** - misal: "ubah button jadi glassmorphism"\n• **Edit CSS langsung** - misal: "tambahkan shadow pada card"\n• **Preview perubahan** - semua perubahan real-time\n\nKomponen apa yang ingin Anda desain ulang?',
            timestamp: new Date(),
        }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [isAITyping, setIsAITyping] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

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
            } else {
                setCustomCSS('');
            }
        }
    }, [selectedComponent, designs]);

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

    const showNotification = (type: 'success' | 'error', message: string) => {
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

    // AI Chat handler
    const handleSendMessage = async () => {
        if (!chatInput.trim() || isAITyping) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: chatInput,
            timestamp: new Date(),
        };

        setChatMessages(prev => [...prev, userMessage]);
        setChatInput('');
        setIsAITyping(true);

        try {
            // Send to AI chat API
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: chatInput,
                    context: 'design_studio',
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
            };

            setChatMessages(prev => [...prev, aiMessage]);
            
            // If design was applied, reload
            if (data.designApplied) {
                await loadDesigns();
                if (typeof window !== 'undefined' && (window as any).reloadDesigns) {
                    (window as any).reloadDesigns();
                }
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
// 💬 CHAT PANEL COMPONENT
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
}) {
    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Quick Actions */}
            {selectedComponent && (
                <div className={`flex items-center gap-2 px-4 py-2 border-b overflow-x-auto ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-purple-50 border-purple-100'}`}>
                    <span className="text-sm font-medium whitespace-nowrap">Quick Apply:</span>
                    {DESIGN_STYLES.slice(0, 4).map((style) => (
                        <button
                            key={style.id}
                            onClick={() => onQuickApply(selectedComponent, style.id)}
                            className="flex items-center gap-1 px-3 py-1 bg-white dark:bg-gray-700 rounded-full text-sm border border-gray-200 dark:border-gray-600 hover:border-purple-400 whitespace-nowrap"
                        >
                            <Sparkles className="w-3 h-3" />
                            {style.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] px-4 py-3 rounded-2xl ${
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
                        </div>
                    </div>
                ))}
                
                {isTyping && (
                    <div className="flex justify-start">
                        <div className={`px-4 py-3 rounded-2xl rounded-bl-md ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className={`p-4 border-t ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className={`flex items-center gap-2 p-2 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onSend()}
                        placeholder="Ketik perintah design... (contoh: ubah button jadi glassmorphism)"
                        className="flex-1 bg-transparent border-none outline-none px-2"
                    />
                    <button
                        onClick={onSend}
                        disabled={!input.trim() || isTyping}
                        className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                    >
                        <Send className="w-5 h-5" />
                    </button>
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
