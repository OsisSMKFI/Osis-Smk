'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Code, Eye, Save, Undo, Redo, 
    MessageSquare, Palette, RefreshCw,
    ChevronDown, ChevronRight, Play, Check,
    Trash2, Plus, Search, X, Send,
    Monitor, Smartphone, Tablet, Moon, Sun,
    File, Folder, FolderOpen, FileCode, FilePlus,
    Columns, AlertCircle, Loader2, Copy,
    Paintbrush, Settings, PanelLeftClose, PanelLeft,
    Maximize2, MoreHorizontal, Zap
} from 'lucide-react';
import { DESIGN_REGISTRY } from '@/lib/design-registry';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 DESIGN STUDIO PRO v3.0 - Full VS Code-like Experience
// ═══════════════════════════════════════════════════════════════════════════════

interface DesignOverride {
    page_key: string;
    title: string;
    content: string;
    category: string;
    updated_at: string;
    id?: number;
}

interface HistoryEntry {
    css: string;
    timestamp: number;
    action: string;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    cssCode?: string;
}

// CSS Templates
const CSS_TEMPLATES: Record<string, { name: string; css: string; color: string }> = {
    neumorphism: {
        name: 'Neumorphism',
        color: '#e0e5ec',
        css: `/* Neumorphism Style */
background: #e0e5ec;
border-radius: 16px;
box-shadow: 
    8px 8px 16px #b8bec7,
    -8px -8px 16px #ffffff;
padding: 24px;`
    },
    glassmorphism: {
        name: 'Glassmorphism',
        color: 'rgba(255,255,255,0.2)',
        css: `/* Glassmorphism Style */
background: rgba(255, 255, 255, 0.1);
backdrop-filter: blur(16px);
-webkit-backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.2);
border-radius: 16px;
padding: 24px;`
    },
    gradient: {
        name: 'Gradient',
        color: 'linear-gradient(135deg, #667eea, #764ba2)',
        css: `/* Gradient Style */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
color: white;
border-radius: 12px;
padding: 24px;
box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);`
    },
    dark: {
        name: 'Dark Mode',
        color: '#1a1a2e',
        css: `/* Dark Theme */
background: #1a1a2e;
color: #eaeaea;
border: 1px solid rgba(255,255,255,0.1);
border-radius: 12px;
padding: 24px;`
    },
    neon: {
        name: 'Neon Glow',
        color: '#00ff88',
        css: `/* Neon Glow Style */
background: #0a0a0a;
color: #00ff88;
border: 2px solid #00ff88;
border-radius: 8px;
padding: 24px;
box-shadow: 
    0 0 10px #00ff88,
    0 0 20px rgba(0, 255, 136, 0.3),
    inset 0 0 30px rgba(0, 255, 136, 0.1);
text-shadow: 0 0 10px currentColor;`
    },
    minimal: {
        name: 'Minimal',
        color: '#fafafa',
        css: `/* Minimal Clean */
background: #fafafa;
border: 1px solid #eee;
border-radius: 4px;
padding: 20px;`
    },
    retro: {
        name: 'Retro',
        color: '#f4e4ba',
        css: `/* Retro Style */
background: #f4e4ba;
color: #2d2d2d;
border: 3px solid #2d2d2d;
font-family: 'Courier New', monospace;
padding: 20px;
box-shadow: 4px 4px 0 #2d2d2d;`
    },
    cyberpunk: {
        name: 'Cyberpunk',
        color: '#ff0080',
        css: `/* Cyberpunk Style */
background: linear-gradient(135deg, #0c0c0c 0%, #1a0a20 100%);
color: #ff0080;
border: 1px solid #ff0080;
border-radius: 0;
padding: 24px;
box-shadow: 
    0 0 20px rgba(255, 0, 128, 0.5),
    inset 0 0 60px rgba(255, 0, 128, 0.1);
clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px));`
    }
};

export default function DesignStudioPage() {
    // ═══════════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════════
    
    // UI State
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [chatOpen, setChatOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'split' | 'code' | 'preview'>('split');
    const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    const [darkMode, setDarkMode] = useState(true);
    
    // Data State
    const [designs, setDesigns] = useState<DesignOverride[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Editor State
    const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
    const [code, setCode] = useState('');
    const [originalCode, setOriginalCode] = useState('');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    
    // History (Undo/Redo)
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    
    // Search & Filter
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<string[]>(['active', 'templates', 'layout', 'button', 'card']);
    
    // Chat
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        { id: '0', role: 'system', content: 'Halo! Saya AI Design Assistant. Tanyakan apa saja tentang CSS atau minta saya generate style untuk komponen yang dipilih.', timestamp: new Date() }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [isAILoading, setIsAILoading] = useState(false);
    
    // Notification
    const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    
    // Refs
    const editorRef = useRef<HTMLTextAreaElement>(null);
    const chatScrollRef = useRef<HTMLDivElement>(null);
    const historyDebounceRef = useRef<NodeJS.Timeout | null>(null);

    // ═══════════════════════════════════════════════════════════════════════════
    // EFFECTS
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Load designs on mount
    useEffect(() => {
        loadDesigns();
    }, []);
    
    // Track unsaved changes
    useEffect(() => {
        setHasUnsavedChanges(code !== originalCode);
    }, [code, originalCode]);
    
    // Auto-scroll chat
    useEffect(() => {
        chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [chatMessages]);
    
    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (hasUnsavedChanges) saveDesign();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
                e.preventDefault();
                redo();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [hasUnsavedChanges, history, historyIndex]);

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════
    
    const loadDesigns = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/design/studio');
            const data = await res.json();
            if (data.success) {
                setDesigns(data.designs || []);
                notify('info', `${data.designs?.length || 0} design overrides loaded`);
            } else {
                notify('error', data.error || 'Failed to load');
            }
        } catch (err) {
            console.error(err);
            notify('error', 'Connection error');
        } finally {
            setIsLoading(false);
        }
    };

    const notify = (type: 'success' | 'error' | 'info', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // FILE OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════════
    
    const openDesign = (pageKey: string) => {
        if (hasUnsavedChanges) {
            if (!confirm('You have unsaved changes. Discard?')) return;
        }
        
        const design = designs.find(d => d.page_key === pageKey);
        const componentName = pageKey.replace('design_override_', '');
        
        setSelectedComponent(componentName);
        const cssContent = design?.content || generateDefaultCSS(componentName);
        setCode(cssContent);
        setOriginalCode(design?.content || '');
        
        // Reset history
        setHistory([{ css: cssContent, timestamp: Date.now(), action: 'opened' }]);
        setHistoryIndex(0);
    };

    const createNewDesign = (componentName: string) => {
        if (hasUnsavedChanges) {
            if (!confirm('You have unsaved changes. Discard?')) return;
        }
        
        setSelectedComponent(componentName);
        const defaultCSS = generateDefaultCSS(componentName);
        setCode(defaultCSS);
        setOriginalCode('');
        setHistory([{ css: defaultCSS, timestamp: Date.now(), action: 'created' }]);
        setHistoryIndex(0);
    };

    const generateDefaultCSS = (name: string): string => {
        const info = DESIGN_REGISTRY[name];
        const selectors = info?.selectors || [`.${name}`];
        return `/* ${info?.displayName || name} - Custom Styles */
/* Created: ${new Date().toLocaleString('id-ID')} */

${selectors[0]} {
    /* Base styles */
    
}

${selectors[0]}:hover {
    /* Hover state */
    
}`;
    };

    const saveDesign = async () => {
        if (!selectedComponent) return;
        
        setIsSaving(true);
        try {
            const res = await fetch('/api/design/studio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    component: selectedComponent,
                    css: code,
                    style: 'custom'
                })
            });
            
            const data = await res.json();
            if (data.success) {
                setOriginalCode(code);
                setHasUnsavedChanges(false);
                await loadDesigns();
                notify('success', `Saved: ${selectedComponent}`);
                
                // Trigger global refresh
                window.dispatchEvent(new CustomEvent('design-updated', { detail: { component: selectedComponent } }));
            } else {
                notify('error', data.error || 'Save failed');
            }
        } catch (err) {
            notify('error', 'Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    const deleteDesign = async (pageKey: string) => {
        if (!confirm('Delete this design override?')) return;
        
        try {
            const componentName = pageKey.replace('design_override_', '');
            const res = await fetch('/api/design/studio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ component: componentName, action: 'delete' })
            });
            
            if ((await res.json()).success) {
                if (selectedComponent === componentName) {
                    setSelectedComponent(null);
                    setCode('');
                    setOriginalCode('');
                }
                await loadDesigns();
                notify('success', 'Deleted');
            }
        } catch (err) {
            notify('error', 'Delete failed');
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // HISTORY (UNDO/REDO)
    // ═══════════════════════════════════════════════════════════════════════════
    
    const addToHistory = useCallback((css: string, action: string) => {
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push({ css, timestamp: Date.now(), action });
            return newHistory.slice(-50); // Max 50 entries
        });
        setHistoryIndex(prev => Math.min(prev + 1, 49));
    }, [historyIndex]);

    const handleCodeChange = (newCode: string) => {
        setCode(newCode);
        
        // Debounce history
        if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
        historyDebounceRef.current = setTimeout(() => {
            if (newCode !== history[historyIndex]?.css) {
                addToHistory(newCode, 'edit');
            }
        }, 1000);
    };

    const undo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setCode(history[newIndex].css);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setCode(history[newIndex].css);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // TEMPLATE APPLICATION
    // ═══════════════════════════════════════════════════════════════════════════
    
    const applyTemplate = (templateKey: string) => {
        if (!selectedComponent) {
            notify('error', 'Select a component first');
            return;
        }
        
        const template = CSS_TEMPLATES[templateKey];
        if (!template) return;
        
        const info = DESIGN_REGISTRY[selectedComponent];
        const selector = info?.selectors?.[0] || `.${selectedComponent}`;
        
        const newCSS = `/* ${template.name} Style for ${selectedComponent} */
/* Applied: ${new Date().toLocaleString('id-ID')} */

${selector} {
    ${template.css}
}`;
        
        setCode(newCSS);
        addToHistory(newCSS, `template:${templateKey}`);
        notify('info', `Applied: ${template.name}`);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // AI CHAT
    // ═══════════════════════════════════════════════════════════════════════════
    
    const sendChatMessage = async () => {
        if (!chatInput.trim() || isAILoading) return;
        
        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: chatInput,
            timestamp: new Date()
        };
        
        setChatMessages(prev => [...prev, userMessage]);
        setChatInput('');
        setIsAILoading(true);
        
        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: chatInput,
                    context: 'design_studio',
                    selectedComponent,
                    currentCSS: code,
                    mode: 'admin'
                })
            });
            
            const data = await res.json();
            
            // Extract CSS from response
            let cssCode: string | undefined;
            const cssMatch = data.reply?.match(/```css\n([\s\S]*?)```/);
            if (cssMatch) {
                cssCode = cssMatch[1].trim();
            }
            
            const aiMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.reply?.replace(/```css\n[\s\S]*?```/g, '[CSS Code - Click Apply]') || 'Maaf, terjadi kesalahan.',
                timestamp: new Date(),
                cssCode
            };
            
            setChatMessages(prev => [...prev, aiMessage]);
        } catch (err) {
            setChatMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '❌ Gagal terhubung ke AI. Coba lagi.',
                timestamp: new Date()
            }]);
        } finally {
            setIsAILoading(false);
        }
    };

    const applyCSSFromChat = (css: string) => {
        if (!selectedComponent) {
            notify('error', 'Select a component first');
            return;
        }
        setCode(css);
        addToHistory(css, 'ai-generated');
        notify('success', 'CSS applied from AI');
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // GROUPING & FILTERING
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Group active overrides by category
    const activeOverrides = designs.reduce((acc, d) => {
        const name = d.page_key.replace('design_override_', '');
        const info = DESIGN_REGISTRY[name];
        const cat = info?.category || 'other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push({ ...d, componentName: name, info });
        return acc;
    }, {} as Record<string, (DesignOverride & { componentName: string; info?: typeof DESIGN_REGISTRY[string] })[]>);

    // Group all components by category
    const allComponents = Object.entries(DESIGN_REGISTRY).reduce((acc, [key, info]) => {
        if (!acc[info.category]) acc[info.category] = [];
        acc[info.category].push({ key, ...info });
        return acc;
    }, {} as Record<string, ({ key: string } & typeof DESIGN_REGISTRY[string])[]>);

    // Filter by search
    const filterBySearch = (name: string) => {
        if (!searchQuery) return true;
        return name.toLowerCase().includes(searchQuery.toLowerCase());
    };

    const toggleCategory = (cat: string) => {
        setExpandedCategories(prev => 
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // PREVIEW COMPONENT
    // ═══════════════════════════════════════════════════════════════════════════
    
    const PreviewPane = () => {
        const info = selectedComponent ? DESIGN_REGISTRY[selectedComponent] : null;
        const deviceWidth = previewDevice === 'mobile' ? '375px' : previewDevice === 'tablet' ? '768px' : '100%';
        
        return (
            <div className="h-full flex flex-col">
                {/* Preview Toolbar */}
                <div className={`h-10 flex items-center justify-between px-3 border-b ${
                    darkMode ? 'bg-[#252526] border-gray-700' : 'bg-gray-100 border-gray-300'
                }`}>
                    <div className="flex items-center gap-2 text-sm">
                        <Eye className="w-4 h-4 text-green-500" />
                        <span>Live Preview</span>
                    </div>
                    <div className="flex items-center gap-1">
                        {(['desktop', 'tablet', 'mobile'] as const).map(device => (
                            <button
                                key={device}
                                onClick={() => setPreviewDevice(device)}
                                className={`p-1.5 rounded ${previewDevice === device ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'}`}
                            >
                                {device === 'desktop' ? <Monitor className="w-4 h-4" /> : 
                                 device === 'tablet' ? <Tablet className="w-4 h-4" /> : 
                                 <Smartphone className="w-4 h-4" />}
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Preview Content */}
                <div className={`flex-1 overflow-auto p-6 ${darkMode ? 'bg-[#1e1e1e]' : 'bg-gray-50'}`}>
                    {/* Inject CSS */}
                    <style dangerouslySetInnerHTML={{ __html: code }} />
                    
                    <div style={{ maxWidth: deviceWidth, margin: '0 auto' }}>
                        {selectedComponent ? (
                            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
                                <div className="text-sm text-gray-500 mb-4">
                                    Preview: <span className="font-mono text-blue-400">{selectedComponent}</span>
                                </div>
                                
                                {/* Dynamic Preview based on category */}
                                {info?.category === 'button' && (
                                    <div className="space-y-4">
                                        <button className={selectedComponent}>Primary Button</button>
                                        <button className={selectedComponent} disabled style={{ opacity: 0.5 }}>Disabled</button>
                                        <button className={`${selectedComponent} ml-4`}>Another Button</button>
                                    </div>
                                )}
                                
                                {info?.category === 'card' && (
                                    <div className={selectedComponent}>
                                        <h3 className="text-lg font-bold mb-2">Card Title</h3>
                                        <p className="text-sm opacity-70 mb-4">This is sample card content to preview your design changes in real-time.</p>
                                        <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm">Action</button>
                                    </div>
                                )}
                                
                                {info?.category === 'form' && (
                                    <form className={selectedComponent} onSubmit={e => e.preventDefault()}>
                                        <div className="mb-4">
                                            <label className="block text-sm mb-1">Email</label>
                                            <input type="email" placeholder="you@example.com" className="w-full px-3 py-2 border rounded bg-transparent" />
                                        </div>
                                        <div className="mb-4">
                                            <label className="block text-sm mb-1">Password</label>
                                            <input type="password" placeholder="••••••••" className="w-full px-3 py-2 border rounded bg-transparent" />
                                        </div>
                                        <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded">Submit</button>
                                    </form>
                                )}
                                
                                {info?.category === 'navigation' && (
                                    <nav className={selectedComponent}>
                                        <div className="flex gap-4 p-3">
                                            <a href="#" className="hover:text-blue-500">Home</a>
                                            <a href="#" className="hover:text-blue-500">About</a>
                                            <a href="#" className="hover:text-blue-500">Services</a>
                                            <a href="#" className="hover:text-blue-500">Contact</a>
                                        </div>
                                    </nav>
                                )}
                                
                                {info?.category === 'chat' && (
                                    <div className={selectedComponent}>
                                        <div className="space-y-3 mb-4">
                                            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg max-w-[80%]">
                                                Hello! How can I help you today?
                                            </div>
                                            <div className="bg-blue-600 text-white p-3 rounded-lg max-w-[80%] ml-auto">
                                                I need help with design
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <input placeholder="Type a message..." className="flex-1 px-3 py-2 border rounded bg-transparent" />
                                            <button className="px-4 py-2 bg-blue-600 text-white rounded">Send</button>
                                        </div>
                                    </div>
                                )}
                                
                                {info?.category === 'layout' && (
                                    <div className={selectedComponent}>
                                        <div className="border-2 border-dashed border-gray-400 p-8 text-center rounded">
                                            <div className="text-xl font-bold mb-2">{info.displayName}</div>
                                            <div className="text-sm opacity-70">{info.description}</div>
                                            <div className="mt-4 text-xs font-mono text-gray-500">
                                                Selectors: {info.selectors.slice(0, 2).join(', ')}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {(!info || !['button', 'card', 'form', 'navigation', 'chat', 'layout'].includes(info.category)) && (
                                    <div className={selectedComponent}>
                                        <div className="border-2 border-dashed border-gray-400 p-8 text-center rounded">
                                            <div className="text-xl font-bold mb-2">{info?.displayName || selectedComponent}</div>
                                            <div className="text-sm opacity-70">{info?.description || 'Custom component'}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500">
                                <div className="text-center">
                                    <Eye className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                    <p className="text-lg">Select a component to preview</p>
                                    <p className="text-sm mt-1">Choose from the sidebar or create new</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════════

    return (
        <div className={`fixed inset-0 flex flex-col ${darkMode ? 'bg-[#1e1e1e] text-gray-200' : 'bg-white text-gray-800'}`} style={{ zIndex: 50 }}>
            {/* ═══════════ TITLE BAR ═══════════ */}
            <header className={`h-9 flex items-center justify-between px-3 text-sm select-none ${
                darkMode ? 'bg-[#3c3c3c]' : 'bg-gray-200'
            }`}>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Paintbrush className="w-4 h-4 text-purple-500" />
                        <span className="font-semibold">Design Studio</span>
                    </div>
                    {selectedComponent && (
                        <>
                            <span className="text-gray-500">—</span>
                            <span className={hasUnsavedChanges ? 'text-orange-400' : ''}>
                                {selectedComponent}.css
                                {hasUnsavedChanges && ' •'}
                            </span>
                        </>
                    )}
                </div>
                
                <div className="flex items-center gap-2">
                    <button onClick={() => setDarkMode(!darkMode)} className="p-1 hover:bg-gray-500/30 rounded" title="Toggle Theme">
                        {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                    <a href="/admin" className="p-1 hover:bg-gray-500/30 rounded" title="Back to Admin">
                        <X className="w-4 h-4" />
                    </a>
                </div>
            </header>

            {/* ═══════════ MENU BAR ═══════════ */}
            <div className={`h-10 flex items-center gap-1 px-2 border-b ${
                darkMode ? 'bg-[#252526] border-gray-700' : 'bg-gray-100 border-gray-300'
            }`}>
                {/* Left: Sidebar & Actions */}
                <button 
                    onClick={() => setSidebarOpen(!sidebarOpen)} 
                    className={`p-2 rounded ${sidebarOpen ? 'bg-gray-600' : 'hover:bg-gray-600'}`}
                    title="Toggle Sidebar"
                >
                    {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
                </button>
                
                <div className={`w-px h-5 mx-1 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
                
                {/* Save */}
                <button 
                    onClick={saveDesign} 
                    disabled={!hasUnsavedChanges || isSaving}
                    className={`p-2 rounded flex items-center gap-1 text-sm ${
                        hasUnsavedChanges ? 'text-orange-400 hover:bg-gray-600' : 'opacity-40'
                    }`}
                    title="Save (Ctrl+S)"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span className="hidden sm:inline">Save</span>
                </button>
                
                {/* Undo/Redo */}
                <button onClick={undo} disabled={historyIndex <= 0} className={`p-2 rounded ${historyIndex > 0 ? 'hover:bg-gray-600' : 'opacity-40'}`} title="Undo (Ctrl+Z)">
                    <Undo className="w-4 h-4" />
                </button>
                <button onClick={redo} disabled={historyIndex >= history.length - 1} className={`p-2 rounded ${historyIndex < history.length - 1 ? 'hover:bg-gray-600' : 'opacity-40'}`} title="Redo (Ctrl+Y)">
                    <Redo className="w-4 h-4" />
                </button>
                
                <div className={`w-px h-5 mx-1 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
                
                {/* View Mode */}
                <button onClick={() => setViewMode('split')} className={`p-2 rounded ${viewMode === 'split' ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'}`} title="Split View">
                    <Columns className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('code')} className={`p-2 rounded ${viewMode === 'code' ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'}`} title="Code Only">
                    <Code className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('preview')} className={`p-2 rounded ${viewMode === 'preview' ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'}`} title="Preview Only">
                    <Eye className="w-4 h-4" />
                </button>
                
                <div className="flex-1" />
                
                {/* Right: Chat & Refresh */}
                <button 
                    onClick={() => setChatOpen(!chatOpen)} 
                    className={`p-2 rounded flex items-center gap-1 ${chatOpen ? 'bg-purple-600 text-white' : 'hover:bg-gray-600'}`}
                    title="AI Assistant"
                >
                    <Zap className="w-4 h-4" />
                    <span className="hidden sm:inline">AI</span>
                </button>
                
                <button onClick={loadDesigns} className="p-2 rounded hover:bg-gray-600" title="Refresh">
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* ═══════════ MAIN CONTENT ═══════════ */}
            <div className="flex-1 flex overflow-hidden">
                {/* ═══════════ SIDEBAR ═══════════ */}
                <AnimatePresence>
                    {sidebarOpen && (
                        <motion.aside
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 280, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`flex-shrink-0 flex flex-col border-r overflow-hidden ${
                                darkMode ? 'bg-[#252526] border-gray-700' : 'bg-gray-50 border-gray-300'
                            }`}
                        >
                            {/* Search */}
                            <div className="p-2">
                                <div className={`flex items-center gap-2 px-2 py-1.5 rounded ${
                                    darkMode ? 'bg-[#3c3c3c]' : 'bg-white border'
                                }`}>
                                    <Search className="w-4 h-4 text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="Search components..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="flex-1 bg-transparent outline-none text-sm"
                                    />
                                    {searchQuery && (
                                        <button onClick={() => setSearchQuery('')}>
                                            <X className="w-3 h-3 text-gray-500" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {/* Explorer */}
                            <div className="flex-1 overflow-y-auto text-sm">
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                                    </div>
                                ) : (
                                    <>
                                        {/* ACTIVE OVERRIDES */}
                                        <div className="mb-2">
                                            <button
                                                onClick={() => toggleCategory('active')}
                                                className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-500/20 font-medium"
                                            >
                                                {expandedCategories.includes('active') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                <FolderOpen className="w-4 h-4 text-yellow-500" />
                                                <span>Active Overrides</span>
                                                <span className="ml-auto text-xs bg-yellow-500/20 text-yellow-500 px-1.5 rounded">{designs.length}</span>
                                            </button>
                                            
                                            {expandedCategories.includes('active') && (
                                                <div className="ml-4">
                                                    {designs.length === 0 ? (
                                                        <div className="px-3 py-2 text-gray-500 text-xs">No overrides yet. Create one below.</div>
                                                    ) : (
                                                        Object.entries(activeOverrides).map(([cat, items]) => (
                                                            <div key={cat}>
                                                                <div className="px-3 py-1 text-xs uppercase text-gray-500 tracking-wider">{cat}</div>
                                                                {items.filter(d => filterBySearch(d.componentName)).map(design => (
                                                                    <div
                                                                        key={design.page_key}
                                                                        className={`group px-3 py-1.5 flex items-center gap-2 cursor-pointer rounded-sm mx-1 ${
                                                                            selectedComponent === design.componentName 
                                                                                ? 'bg-blue-600/30 text-blue-300' 
                                                                                : 'hover:bg-gray-500/20'
                                                                        }`}
                                                                        onClick={() => openDesign(design.page_key)}
                                                                    >
                                                                        <FileCode className="w-4 h-4 text-purple-400" />
                                                                        <span className="flex-1 truncate">{design.componentName}</span>
                                                                        <button
                                                                            onClick={e => { e.stopPropagation(); deleteDesign(design.page_key); }}
                                                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-600 rounded"
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* TEMPLATES */}
                                        <div className="mb-2">
                                            <button
                                                onClick={() => toggleCategory('templates')}
                                                className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-500/20 font-medium"
                                            >
                                                {expandedCategories.includes('templates') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                <Palette className="w-4 h-4 text-pink-500" />
                                                <span>Style Templates</span>
                                            </button>
                                            
                                            {expandedCategories.includes('templates') && (
                                                <div className="ml-4 grid grid-cols-2 gap-1 px-2 py-1">
                                                    {Object.entries(CSS_TEMPLATES).map(([key, tmpl]) => (
                                                        <button
                                                            key={key}
                                                            onClick={() => applyTemplate(key)}
                                                            className={`px-2 py-1.5 text-xs rounded flex items-center gap-1.5 hover:bg-gray-500/30 ${
                                                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                                            }`}
                                                            title={`Apply ${tmpl.name}`}
                                                        >
                                                            <div className="w-3 h-3 rounded-sm" style={{ background: tmpl.color }} />
                                                            {tmpl.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* ALL COMPONENTS BY CATEGORY */}
                                        {Object.entries(allComponents).map(([category, components]) => (
                                            <div key={category} className="mb-1">
                                                <button
                                                    onClick={() => toggleCategory(category)}
                                                    className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-500/20"
                                                >
                                                    {expandedCategories.includes(category) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                    <Folder className="w-4 h-4 text-blue-400" />
                                                    <span className="capitalize">{category}</span>
                                                    <span className="ml-auto text-xs text-gray-500">{components.length}</span>
                                                </button>
                                                
                                                {expandedCategories.includes(category) && (
                                                    <div className="ml-4">
                                                        {components.filter(c => filterBySearch(c.displayName) || filterBySearch(c.key)).map(comp => {
                                                            const hasOverride = designs.some(d => d.page_key === `design_override_${comp.key}`);
                                                            const isSelected = selectedComponent === comp.key;
                                                            
                                                            return (
                                                                <div
                                                                    key={comp.key}
                                                                    className={`group px-3 py-1.5 flex items-center gap-2 cursor-pointer rounded-sm mx-1 ${
                                                                        isSelected 
                                                                            ? 'bg-blue-600/30 text-blue-300' 
                                                                            : 'hover:bg-gray-500/20'
                                                                    }`}
                                                                    onClick={() => hasOverride ? openDesign(`design_override_${comp.key}`) : createNewDesign(comp.key)}
                                                                >
                                                                    <File className={`w-4 h-4 ${hasOverride ? 'text-green-400' : 'text-gray-500'}`} />
                                                                    <span className="flex-1 truncate">{comp.displayName}</span>
                                                                    {hasOverride && <Check className="w-3 h-3 text-green-400" />}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* ═══════════ EDITOR & PREVIEW ═══════════ */}
                <main className="flex-1 flex overflow-hidden">
                    {/* CODE EDITOR */}
                    {(viewMode === 'split' || viewMode === 'code') && (
                        <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} flex flex-col border-r ${
                            darkMode ? 'border-gray-700' : 'border-gray-300'
                        }`}>
                            {/* Tab Bar */}
                            {selectedComponent && (
                                <div className={`h-9 flex items-center border-b ${
                                    darkMode ? 'bg-[#2d2d2d] border-gray-700' : 'bg-gray-200 border-gray-300'
                                }`}>
                                    <div className={`h-full flex items-center gap-2 px-4 border-t-2 border-blue-500 ${
                                        darkMode ? 'bg-[#1e1e1e]' : 'bg-white'
                                    }`}>
                                        <FileCode className="w-4 h-4 text-orange-400" />
                                        <span className="text-sm">{selectedComponent}.css</span>
                                        {hasUnsavedChanges && (
                                            <span className="w-2 h-2 bg-orange-400 rounded-full" />
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {/* Editor */}
                            <div className="flex-1 relative overflow-hidden">
                                {selectedComponent ? (
                                    <div className="absolute inset-0 flex font-mono text-sm">
                                        {/* Line Numbers */}
                                        <div className={`w-14 flex-shrink-0 text-right pr-4 pt-2 select-none ${
                                            darkMode ? 'bg-[#1e1e1e] text-gray-600' : 'bg-gray-50 text-gray-400'
                                        }`}>
                                            {code.split('\n').map((_, i) => (
                                                <div key={i} className="h-6 leading-6">{i + 1}</div>
                                            ))}
                                        </div>
                                        
                                        {/* Code Area */}
                                        <textarea
                                            ref={editorRef}
                                            value={code}
                                            onChange={e => handleCodeChange(e.target.value)}
                                            className={`flex-1 p-2 resize-none outline-none leading-6 ${
                                                darkMode ? 'bg-[#1e1e1e] text-gray-100 caret-white' : 'bg-white text-gray-800'
                                            }`}
                                            spellCheck={false}
                                            style={{ tabSize: 2 }}
                                            placeholder="/* Write your CSS here... */"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-500">
                                        <div className="text-center">
                                            <Code className="w-20 h-20 mx-auto mb-4 opacity-20" />
                                            <p className="text-lg">No file open</p>
                                            <p className="text-sm mt-1">Select a component from the sidebar</p>
                                            <p className="text-sm mt-4 text-gray-600">Shortcuts: Ctrl+S (Save), Ctrl+Z (Undo), Ctrl+Y (Redo)</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Status Bar */}
                            <div className={`h-6 flex items-center justify-between px-4 text-xs ${
                                darkMode ? 'bg-[#007acc] text-white' : 'bg-blue-600 text-white'
                            }`}>
                                <div className="flex items-center gap-4">
                                    <span>{selectedComponent ? 'CSS' : 'Ready'}</span>
                                    {history.length > 0 && (
                                        <span>History: {historyIndex + 1}/{history.length}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-4">
                                    {hasUnsavedChanges && <span className="text-orange-300">● Unsaved</span>}
                                    <span>UTF-8</span>
                                    <span>LF</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PREVIEW */}
                    {(viewMode === 'split' || viewMode === 'preview') && (
                        <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} flex flex-col`}>
                            <PreviewPane />
                        </div>
                    )}
                </main>

                {/* ═══════════ CHAT PANEL ═══════════ */}
                <AnimatePresence>
                    {chatOpen && (
                        <motion.aside
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 350, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`flex-shrink-0 flex flex-col border-l overflow-hidden ${
                                darkMode ? 'bg-[#252526] border-gray-700' : 'bg-gray-50 border-gray-300'
                            }`}
                        >
                            {/* Chat Header */}
                            <div className={`h-10 flex items-center justify-between px-3 border-b ${
                                darkMode ? 'border-gray-700' : 'border-gray-300'
                            }`}>
                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-purple-400" />
                                    <span className="font-medium text-sm">AI Design Assistant</span>
                                </div>
                                <button onClick={() => setChatOpen(false)} className="p-1 hover:bg-gray-600 rounded">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            
                            {/* Chat Messages */}
                            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
                                {chatMessages.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[90%] px-3 py-2 rounded-lg text-sm ${
                                            msg.role === 'user' 
                                                ? 'bg-blue-600 text-white' 
                                                : msg.role === 'system'
                                                    ? darkMode ? 'bg-purple-900/30 text-purple-300 border border-purple-700' : 'bg-purple-100 text-purple-800'
                                                    : darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                        }`}>
                                            <div className="whitespace-pre-wrap">{msg.content}</div>
                                            {msg.cssCode && (
                                                <button 
                                                    onClick={() => applyCSSFromChat(msg.cssCode!)}
                                                    className="mt-2 flex items-center gap-1 text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-500"
                                                >
                                                    <Play className="w-3 h-3" /> Apply CSS
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                
                                {isAILoading && (
                                    <div className="flex justify-start">
                                        <div className={`px-4 py-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                                                <span className="text-sm">Thinking...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Chat Input */}
                            <div className={`p-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                                <div className={`flex items-center gap-2 p-2 rounded-lg ${
                                    darkMode ? 'bg-gray-700' : 'bg-white border'
                                }`}>
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={e => setChatInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
                                        placeholder="Ask AI... (e.g., 'make it glassmorphism')"
                                        className="flex-1 bg-transparent outline-none text-sm"
                                    />
                                    <button 
                                        onClick={sendChatMessage}
                                        disabled={!chatInput.trim() || isAILoading}
                                        className="p-1.5 bg-purple-600 text-white rounded hover:bg-purple-500 disabled:opacity-50"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="mt-2 text-xs text-gray-500">
                                    Try: "glassmorphism style", "add hover effect", "dark theme"
                                </div>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>
            </div>

            {/* ═══════════ NOTIFICATION ═══════════ */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 z-[100] ${
                            notification.type === 'success' ? 'bg-green-600 text-white' :
                            notification.type === 'error' ? 'bg-red-600 text-white' : 
                            'bg-blue-600 text-white'
                        }`}
                    >
                        {notification.type === 'success' && <Check className="w-5 h-5" />}
                        {notification.type === 'error' && <AlertCircle className="w-5 h-5" />}
                        {notification.type === 'info' && <AlertCircle className="w-5 h-5" />}
                        <span>{notification.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
