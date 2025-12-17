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
    Command, Terminal, Database, AlertCircle, Info,
    File, Folder, FolderOpen, FileCode, FilePlus,
    Split, Maximize2, Minimize2, RotateCcw, Clock,
    PanelLeft, PanelRight, Columns
} from 'lucide-react';
import { DESIGN_REGISTRY, getAllComponentNames, findComponent } from '@/lib/design-registry';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 DESIGN STUDIO PRO v2.0 - VS Code-like Design Editor
// ═══════════════════════════════════════════════════════════════════════════════
// Features:
// - VS Code-like interface with file explorer
// - Monaco-style code editor with syntax highlighting
// - Split view: Code + Live Preview
// - Full undo/redo history
// - Load existing designs from database
// - AI Chat integration
// - Real-time preview
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
    timestamp: Date;
    description: string;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    cssCode?: string;
}

const DESIGN_TEMPLATES: Record<string, string> = {
    neumorphism: `/* Neumorphism Style */
.component {
    background: #e0e5ec;
    border-radius: 12px;
    box-shadow: 
        8px 8px 16px #b8bec7,
        -8px -8px 16px #ffffff;
    padding: 20px;
}`,
    glassmorphism: `/* Glassmorphism Style */
.component {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    padding: 20px;
}`,
    modern: `/* Modern Clean Style */
.component {
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    padding: 20px;
    transition: all 0.2s ease;
}
.component:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
}`,
    dark: `/* Dark Theme Style */
.component {
    background: #1a1a2e;
    color: #eaeaea;
    border: 1px solid #333;
    border-radius: 8px;
    padding: 20px;
}`,
    gradient: `/* Gradient Style */
.component {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}`,
    neon: `/* Neon Glow Style */
.component {
    background: #0a0a0a;
    color: #00ff88;
    border: 1px solid #00ff88;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 
        0 0 10px #00ff88,
        0 0 20px rgba(0, 255, 136, 0.3),
        inset 0 0 20px rgba(0, 255, 136, 0.1);
}`,
    retro: `/* Retro Style */
.component {
    background: #f4e4ba;
    color: #2d2d2d;
    border: 3px solid #2d2d2d;
    font-family: 'Courier New', monospace;
    padding: 20px;
    box-shadow: 4px 4px 0 #2d2d2d;
}`,
    minimal: `/* Minimal Style */
.component {
    background: #fafafa;
    border: 1px solid #eee;
    border-radius: 4px;
    padding: 16px;
}`,
};

export default function DesignStudioPage() {
    // ═══════════════════════════════════════════════════════════════════════════
    // STATE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Layout state
    const [showSidebar, setShowSidebar] = useState(true);
    const [showChatPanel, setShowChatPanel] = useState(false);
    const [activeView, setActiveView] = useState<'split' | 'code' | 'preview'>('split');
    const [darkMode, setDarkMode] = useState(true);
    const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    
    // File explorer state
    const [designs, setDesigns] = useState<DesignOverride[]>([]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [expandedFolders, setExpandedFolders] = useState<string[]>(['active', 'templates']);
    const [isLoading, setIsLoading] = useState(true);
    
    // Editor state
    const [code, setCode] = useState<string>('');
    const [originalCode, setOriginalCode] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    
    // History state (Undo/Redo)
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const MAX_HISTORY = 50;
    
    // Chat state
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isAITyping, setIsAITyping] = useState(false);
    
    // Notification
    const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    
    // Refs
    const editorRef = useRef<HTMLTextAreaElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA LOADING
    // ═══════════════════════════════════════════════════════════════════════════
    
    useEffect(() => {
        loadDesigns();
    }, []);
    
    useEffect(() => {
        setHasChanges(code !== originalCode);
    }, [code, originalCode]);

    const loadDesigns = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/design/studio');
            const data = await res.json();
            
            if (data.success && data.designs) {
                setDesigns(data.designs);
                showNotification('info', `Loaded ${data.designs.length} design overrides`);
            }
        } catch (error) {
            console.error('Failed to load designs:', error);
            showNotification('error', 'Failed to load designs');
        } finally {
            setIsLoading(false);
        }
    };

    const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // FILE OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════════
    
    const openFile = (pageKey: string) => {
        if (hasChanges && selectedFile) {
            if (!confirm('You have unsaved changes. Discard them?')) {
                return;
            }
        }
        
        const design = designs.find(d => d.page_key === pageKey);
        if (design) {
            setSelectedFile(pageKey);
            setCode(design.content || '');
            setOriginalCode(design.content || '');
            setHistory([{ css: design.content || '', timestamp: new Date(), description: 'Loaded from database' }]);
            setHistoryIndex(0);
            showNotification('info', `Opened: ${design.title || pageKey}`);
        }
    };

    const createNewFile = (componentName: string) => {
        if (hasChanges && selectedFile) {
            if (!confirm('You have unsaved changes. Discard them?')) {
                return;
            }
        }
        
        const template = `/* CSS Override for ${componentName} */
/* Created: ${new Date().toLocaleString()} */

.${componentName} {
    /* Add your styles here */
}`;
        
        setSelectedFile(`design_override_${componentName}`);
        setCode(template);
        setOriginalCode('');
        setHistory([{ css: template, timestamp: new Date(), description: 'New file created' }]);
        setHistoryIndex(0);
    };

    const saveFile = async () => {
        if (!selectedFile) return;
        
        setIsSaving(true);
        try {
            const componentName = selectedFile.replace('design_override_', '');
            
            const res = await fetch('/api/design/studio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    component: componentName,
                    css: code,
                    style: 'custom',
                }),
            });

            const data = await res.json();
            
            if (data.success) {
                setOriginalCode(code);
                setHasChanges(false);
                await loadDesigns();
                showNotification('success', `Saved: ${componentName}`);
                
                // Trigger global reload
                if (typeof window !== 'undefined' && (window as any).reloadDesigns) {
                    (window as any).reloadDesigns();
                }
            } else {
                showNotification('error', data.error || 'Failed to save');
            }
        } catch (error) {
            console.error('Save error:', error);
            showNotification('error', 'Failed to save file');
        } finally {
            setIsSaving(false);
        }
    };

    const deleteFile = async (pageKey: string) => {
        if (!confirm('Delete this design override?')) return;
        
        try {
            const componentName = pageKey.replace('design_override_', '');
            
            const res = await fetch('/api/design/studio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    component: componentName,
                    action: 'delete',
                }),
            });

            if ((await res.json()).success) {
                if (selectedFile === pageKey) {
                    setSelectedFile(null);
                    setCode('');
                    setOriginalCode('');
                }
                await loadDesigns();
                showNotification('success', 'Deleted');
            }
        } catch (error) {
            showNotification('error', 'Failed to delete');
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // UNDO/REDO SYSTEM
    // ═══════════════════════════════════════════════════════════════════════════
    
    const addToHistory = useCallback((css: string, description: string) => {
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push({ css, timestamp: new Date(), description });
            if (newHistory.length > MAX_HISTORY) newHistory.shift();
            return newHistory;
        });
        setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
    }, [historyIndex]);

    const handleCodeChange = (newCode: string) => {
        setCode(newCode);
    };
    
    // Debounced history
    useEffect(() => {
        if (code && code !== history[historyIndex]?.css) {
            const timeout = setTimeout(() => {
                addToHistory(code, 'Code edit');
            }, 1500);
            return () => clearTimeout(timeout);
        }
    }, [code]);

    const undo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(prev => prev - 1);
            setCode(history[historyIndex - 1].css);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(prev => prev + 1);
            setCode(history[historyIndex + 1].css);
        }
    };

    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;

    // ═══════════════════════════════════════════════════════════════════════════
    // TEMPLATE APPLICATION
    // ═══════════════════════════════════════════════════════════════════════════
    
    const applyTemplate = (templateName: string) => {
        if (!selectedFile) {
            showNotification('error', 'Select or create a file first');
            return;
        }
        
        const template = DESIGN_TEMPLATES[templateName];
        if (template) {
            const componentName = selectedFile.replace('design_override_', '');
            const customizedTemplate = template.replace(/\.component/g, `.${componentName}`);
            setCode(customizedTemplate);
            addToHistory(customizedTemplate, `Applied ${templateName} template`);
            showNotification('info', `Applied ${templateName} template`);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // AI CHAT
    // ═══════════════════════════════════════════════════════════════════════════
    
    const handleChatSubmit = async () => {
        if (!chatInput.trim() || isAITyping) return;
        
        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: chatInput,
            timestamp: new Date(),
        };
        
        setChatMessages(prev => [...prev, userMsg]);
        setChatInput('');
        setIsAITyping(true);
        
        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: chatInput,
                    context: 'design_studio',
                    selectedComponent: selectedFile?.replace('design_override_', ''),
                    currentCSS: code,
                    mode: 'admin',
                }),
            });
            
            const data = await res.json();
            
            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.reply || 'Sorry, something went wrong.',
                timestamp: new Date(),
                cssCode: data.cssCode,
            };
            
            setChatMessages(prev => [...prev, aiMsg]);
            
            if (data.cssCode && selectedFile) {
                setCode(data.cssCode);
                addToHistory(data.cssCode, 'AI generated CSS');
            }
        } catch (error) {
            setChatMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '❌ Error connecting to AI.',
                timestamp: new Date(),
            }]);
        } finally {
            setIsAITyping(false);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // KEYBOARD SHORTCUTS
    // ═══════════════════════════════════════════════════════════════════════════
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                saveFile();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                redo();
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [code, history, historyIndex, selectedFile]);

    // ═══════════════════════════════════════════════════════════════════════════
    // GROUP DESIGNS BY CATEGORY
    // ═══════════════════════════════════════════════════════════════════════════
    
    const groupedDesigns = designs.reduce((acc, d) => {
        const componentName = d.page_key.replace('design_override_', '');
        const componentInfo = findComponent(componentName);
        const category = componentInfo?.category || 'other';
        
        if (!acc[category]) acc[category] = [];
        acc[category].push(d);
        return acc;
    }, {} as Record<string, DesignOverride[]>);

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════════

    return (
        <div className={`h-screen flex flex-col ${darkMode ? 'bg-[#1e1e1e] text-gray-200' : 'bg-white text-gray-800'}`}>
            {/* TITLE BAR */}
            <header className={`h-8 flex items-center justify-between px-2 text-xs ${darkMode ? 'bg-[#323233]' : 'bg-gray-100'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2">
                    <Paintbrush className="w-4 h-4 text-purple-500" />
                    <span className="font-medium">Design Studio</span>
                    {selectedFile && (
                        <>
                            <span className="text-gray-500">—</span>
                            <span className={hasChanges ? 'text-orange-400' : ''}>{selectedFile.replace('design_override_', '')}{hasChanges ? ' •' : ''}</span>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => setDarkMode(!darkMode)} className="p-1 hover:bg-gray-600 rounded" title="Toggle Theme">
                        {darkMode ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                    </button>
                </div>
            </header>

            {/* TOOLBAR */}
            <div className={`h-10 flex items-center justify-between px-2 border-b ${darkMode ? 'bg-[#252526] border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-1">
                    <button onClick={() => setShowSidebar(!showSidebar)} className={`p-1.5 rounded ${showSidebar ? 'bg-purple-600 text-white' : 'hover:bg-gray-600'}`} title="Toggle Explorer">
                        <PanelLeft className="w-4 h-4" />
                    </button>
                    <div className={`w-px h-5 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
                    
                    <button onClick={saveFile} disabled={!hasChanges || isSaving} className={`p-1.5 rounded ${hasChanges ? 'text-orange-400 hover:bg-gray-600' : 'opacity-50'}`} title="Save (Ctrl+S)">
                        {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </button>
                    
                    <button onClick={undo} disabled={!canUndo} className={`p-1.5 rounded ${canUndo ? 'hover:bg-gray-600' : 'opacity-30'}`} title="Undo (Ctrl+Z)">
                        <Undo className="w-4 h-4" />
                    </button>
                    <button onClick={redo} disabled={!canRedo} className={`p-1.5 rounded ${canRedo ? 'hover:bg-gray-600' : 'opacity-30'}`} title="Redo (Ctrl+Y)">
                        <Redo className="w-4 h-4" />
                    </button>
                    
                    <div className={`w-px h-5 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
                    
                    <button onClick={() => setActiveView('split')} className={`p-1.5 rounded ${activeView === 'split' ? 'bg-purple-600 text-white' : 'hover:bg-gray-600'}`} title="Split View">
                        <Columns className="w-4 h-4" />
                    </button>
                    <button onClick={() => setActiveView('code')} className={`p-1.5 rounded ${activeView === 'code' ? 'bg-purple-600 text-white' : 'hover:bg-gray-600'}`} title="Code Only">
                        <Code className="w-4 h-4" />
                    </button>
                    <button onClick={() => setActiveView('preview')} className={`p-1.5 rounded ${activeView === 'preview' ? 'bg-purple-600 text-white' : 'hover:bg-gray-600'}`} title="Preview Only">
                        <Eye className="w-4 h-4" />
                    </button>
                </div>
                
                <div className="flex items-center gap-1">
                    <button onClick={() => setPreviewMode('desktop')} className={`p-1.5 rounded ${previewMode === 'desktop' ? 'bg-purple-600 text-white' : 'hover:bg-gray-600'}`}>
                        <Monitor className="w-4 h-4" />
                    </button>
                    <button onClick={() => setPreviewMode('tablet')} className={`p-1.5 rounded ${previewMode === 'tablet' ? 'bg-purple-600 text-white' : 'hover:bg-gray-600'}`}>
                        <Tablet className="w-4 h-4" />
                    </button>
                    <button onClick={() => setPreviewMode('mobile')} className={`p-1.5 rounded ${previewMode === 'mobile' ? 'bg-purple-600 text-white' : 'hover:bg-gray-600'}`}>
                        <Smartphone className="w-4 h-4" />
                    </button>
                    
                    <div className={`w-px h-5 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
                    
                    <button onClick={() => setShowChatPanel(!showChatPanel)} className={`p-1.5 rounded ${showChatPanel ? 'bg-purple-600 text-white' : 'hover:bg-gray-600'}`} title="AI Assistant">
                        <MessageSquare className="w-4 h-4" />
                    </button>
                    
                    <button onClick={loadDesigns} className="p-1.5 rounded hover:bg-gray-600" title="Refresh">
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex overflow-hidden">
                {/* SIDEBAR */}
                {showSidebar && (
                    <aside className={`w-64 flex flex-col border-r ${darkMode ? 'bg-[#252526] border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                        <div className={`px-3 py-2 text-xs uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'} flex items-center justify-between`}>
                            <span>Explorer</span>
                            <button onClick={() => {
                                const name = prompt('Component name:');
                                if (name) createNewFile(name);
                            }} className="p-1 hover:bg-gray-600 rounded" title="New File">
                                <FilePlus className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto text-sm">
                            {isLoading ? (
                                <div className="px-3 py-2 text-gray-500">Loading...</div>
                            ) : (
                                <>
                                    {/* Active Overrides */}
                                    <div>
                                        <button
                                            onClick={() => setExpandedFolders(prev => 
                                                prev.includes('active') ? prev.filter(f => f !== 'active') : [...prev, 'active']
                                            )}
                                            className="w-full px-2 py-1 flex items-center gap-1 hover:bg-gray-600/30"
                                        >
                                            {expandedFolders.includes('active') ? <FolderOpen className="w-4 h-4 text-yellow-500" /> : <Folder className="w-4 h-4 text-yellow-500" />}
                                            <span>Active Overrides</span>
                                            <span className="ml-auto text-xs text-gray-500">{designs.length}</span>
                                        </button>
                                        
                                        {expandedFolders.includes('active') && (
                                            <div className="ml-4">
                                                {Object.entries(groupedDesigns).map(([category, categoryDesigns]) => (
                                                    <div key={category}>
                                                        <div className={`px-2 py-0.5 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} uppercase`}>{category}</div>
                                                        {categoryDesigns.map((design) => {
                                                            const name = design.page_key.replace('design_override_', '');
                                                            const isSelected = selectedFile === design.page_key;
                                                            return (
                                                                <div
                                                                    key={design.page_key}
                                                                    className={`group px-2 py-1 flex items-center gap-2 cursor-pointer ${isSelected ? 'bg-purple-600/30' : 'hover:bg-gray-600/30'}`}
                                                                    onClick={() => openFile(design.page_key)}
                                                                >
                                                                    <FileCode className="w-4 h-4 text-purple-400" />
                                                                    <span className="flex-1 truncate">{name}</span>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); deleteFile(design.page_key); }}
                                                                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-600 rounded"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ))}
                                                {designs.length === 0 && (
                                                    <div className="px-2 py-1 text-gray-500 text-xs">No overrides yet</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Templates */}
                                    <div className="mt-2">
                                        <button
                                            onClick={() => setExpandedFolders(prev => 
                                                prev.includes('templates') ? prev.filter(f => f !== 'templates') : [...prev, 'templates']
                                            )}
                                            className="w-full px-2 py-1 flex items-center gap-1 hover:bg-gray-600/30"
                                        >
                                            {expandedFolders.includes('templates') ? <FolderOpen className="w-4 h-4 text-blue-500" /> : <Folder className="w-4 h-4 text-blue-500" />}
                                            <span>Templates</span>
                                        </button>
                                        
                                        {expandedFolders.includes('templates') && (
                                            <div className="ml-4">
                                                {Object.keys(DESIGN_TEMPLATES).map((template) => (
                                                    <div
                                                        key={template}
                                                        onClick={() => applyTemplate(template)}
                                                        className="px-2 py-1 flex items-center gap-2 cursor-pointer hover:bg-gray-600/30"
                                                    >
                                                        <Palette className="w-4 h-4 text-cyan-400" />
                                                        <span className="capitalize">{template}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* All Components */}
                                    <div className="mt-2">
                                        <button
                                            onClick={() => setExpandedFolders(prev => 
                                                prev.includes('components') ? prev.filter(f => f !== 'components') : [...prev, 'components']
                                            )}
                                            className="w-full px-2 py-1 flex items-center gap-1 hover:bg-gray-600/30"
                                        >
                                            {expandedFolders.includes('components') ? <FolderOpen className="w-4 h-4 text-green-500" /> : <Folder className="w-4 h-4 text-green-500" />}
                                            <span>All Components</span>
                                            <span className="ml-auto text-xs text-gray-500">{Object.keys(DESIGN_REGISTRY).length}</span>
                                        </button>
                                        
                                        {expandedFolders.includes('components') && (
                                            <div className="ml-4 max-h-64 overflow-y-auto">
                                                {Object.entries(DESIGN_REGISTRY).map(([key, info]) => {
                                                    const hasOverride = designs.some(d => d.page_key === `design_override_${key}`);
                                                    return (
                                                        <div
                                                            key={key}
                                                            onClick={() => createNewFile(key)}
                                                            className="px-2 py-1 flex items-center gap-2 cursor-pointer hover:bg-gray-600/30"
                                                        >
                                                            <Box className={`w-4 h-4 ${hasOverride ? 'text-green-400' : 'text-gray-500'}`} />
                                                            <span className="truncate">{info.displayName}</span>
                                                            {hasOverride && <Check className="w-3 h-3 text-green-400" />}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </aside>
                )}

                {/* MAIN EDITOR */}
                <main className="flex-1 flex overflow-hidden">
                    {/* Code Editor */}
                    {(activeView === 'split' || activeView === 'code') && (
                        <div className={`${activeView === 'split' ? 'w-1/2' : 'w-full'} flex flex-col border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            {selectedFile && (
                                <div className={`h-9 flex items-center px-2 ${darkMode ? 'bg-[#2d2d2d]' : 'bg-gray-100'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <div className={`flex items-center gap-2 px-3 py-1 ${darkMode ? 'bg-[#1e1e1e]' : 'bg-white'} border-t-2 border-purple-500`}>
                                        <FileCode className="w-4 h-4 text-purple-400" />
                                        <span className="text-sm">{selectedFile.replace('design_override_', '')}.css</span>
                                        {hasChanges && <span className="w-2 h-2 bg-orange-400 rounded-full" />}
                                    </div>
                                </div>
                            )}
                            
                            <div className="flex-1 relative overflow-hidden">
                                {selectedFile ? (
                                    <div className="absolute inset-0 flex font-mono text-sm">
                                        <div className={`w-12 flex-shrink-0 text-right pr-3 pt-2 select-none ${darkMode ? 'bg-[#1e1e1e] text-gray-600' : 'bg-gray-50 text-gray-400'}`}>
                                            {code.split('\n').map((_, i) => (
                                                <div key={i} className="h-6 leading-6">{i + 1}</div>
                                            ))}
                                        </div>
                                        
                                        <textarea
                                            ref={editorRef}
                                            value={code}
                                            onChange={(e) => handleCodeChange(e.target.value)}
                                            className={`flex-1 p-2 resize-none outline-none leading-6 ${darkMode ? 'bg-[#1e1e1e] text-gray-200 caret-white' : 'bg-white text-gray-800'}`}
                                            spellCheck={false}
                                            style={{ tabSize: 2 }}
                                            placeholder="/* Start typing CSS here... */"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-500">
                                        <div className="text-center">
                                            <FileCode className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                            <p>Select a file from Explorer</p>
                                            <p className="text-sm mt-1">or create a new one</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className={`h-6 flex items-center justify-between px-3 text-xs ${darkMode ? 'bg-[#007acc] text-white' : 'bg-blue-600 text-white'}`}>
                                <div className="flex items-center gap-3">
                                    <span>{selectedFile ? 'CSS' : 'No file'}</span>
                                    {history.length > 0 && <span>History: {historyIndex + 1}/{history.length}</span>}
                                </div>
                                <div className="flex items-center gap-3">
                                    {hasChanges && <span className="text-orange-300">● Modified</span>}
                                    <span>UTF-8</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Live Preview */}
                    {(activeView === 'split' || activeView === 'preview') && (
                        <div className={`${activeView === 'split' ? 'w-1/2' : 'w-full'} flex flex-col`}>
                            <div className={`h-9 flex items-center justify-between px-3 ${darkMode ? 'bg-[#2d2d2d]' : 'bg-gray-100'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                <div className="flex items-center gap-2">
                                    <Eye className="w-4 h-4" />
                                    <span className="text-sm">Live Preview</span>
                                </div>
                                <div className="text-xs text-gray-500">{previewMode}</div>
                            </div>
                            
                            <div className={`flex-1 overflow-auto p-4 ${darkMode ? 'bg-[#1e1e1e]' : 'bg-gray-50'}`}>
                                <style dangerouslySetInnerHTML={{ __html: code }} />
                                
                                <div className={`mx-auto transition-all ${
                                    previewMode === 'mobile' ? 'max-w-[375px]' : 
                                    previewMode === 'tablet' ? 'max-w-[768px]' : 'max-w-full'
                                }`}>
                                    <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                        {selectedFile ? (
                                            <PreviewContent componentName={selectedFile.replace('design_override_', '')} />
                                        ) : (
                                            <div className="text-center text-gray-500 py-8">
                                                <Eye className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                                <p>Select a component to preview</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {/* AI CHAT PANEL */}
                {showChatPanel && (
                    <aside className={`w-80 flex flex-col border-l ${darkMode ? 'bg-[#252526] border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                        <div className={`px-3 py-2 flex items-center justify-between border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-purple-400" />
                                <span className="font-medium text-sm">AI Assistant</span>
                            </div>
                            <button onClick={() => setShowChatPanel(false)} className="p-1 hover:bg-gray-600 rounded">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-3 space-y-3">
                            {chatMessages.length === 0 && (
                                <div className="text-center text-gray-500 text-sm py-8">
                                    <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p>Ask AI to help with design</p>
                                    <p className="text-xs mt-1">Example: "Make it glassmorphism"</p>
                                </div>
                            )}
                            
                            {chatMessages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[90%] px-3 py-2 rounded-lg text-sm ${
                                        msg.role === 'user' 
                                            ? 'bg-purple-600 text-white' 
                                            : darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                    }`}>
                                        {msg.content}
                                        {msg.cssCode && (
                                            <button 
                                                onClick={() => {
                                                    if (selectedFile) {
                                                        setCode(msg.cssCode!);
                                                        addToHistory(msg.cssCode!, 'Applied from chat');
                                                    }
                                                }}
                                                className="mt-2 flex items-center gap-1 text-xs text-purple-300 hover:text-purple-200"
                                            >
                                                <Play className="w-3 h-3" /> Apply CSS
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            
                            {isAITyping && (
                                <div className="flex justify-start">
                                    <div className={`px-3 py-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                                            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                        
                        <div className={`p-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <div className={`flex items-center gap-2 p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white border'}`}>
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                                    placeholder="Ask AI..."
                                    className="flex-1 bg-transparent outline-none text-sm"
                                />
                                <button onClick={handleChatSubmit} disabled={!chatInput.trim() || isAITyping} className="p-1 text-purple-400 hover:text-purple-300 disabled:opacity-50">
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </aside>
                )}
            </div>

            {/* NOTIFICATION */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
                            notification.type === 'success' ? 'bg-green-600' :
                            notification.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
                        } text-white`}
                    >
                        {notification.type === 'success' && <Check className="w-4 h-4" />}
                        {notification.type === 'error' && <AlertCircle className="w-4 h-4" />}
                        {notification.type === 'info' && <Info className="w-4 h-4" />}
                        {notification.message}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PREVIEW CONTENT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function PreviewContent({ componentName }: { componentName: string }) {
    const componentInfo = findComponent(componentName);
    
    switch (componentInfo?.category) {
        case 'button':
            return (
                <div className="space-y-4">
                    <h3 className="font-bold mb-4">Button Preview</h3>
                    <button className={`${componentName} px-4 py-2 rounded`}>Primary Button</button>
                    <button className={`${componentName} px-4 py-2 rounded ml-2`} disabled>Disabled</button>
                </div>
            );
        case 'card':
            return (
                <div className={`${componentName} p-4`}>
                    <h3 className="font-bold">Card Title</h3>
                    <p className="mt-2 text-sm opacity-70">Sample card content to preview your design.</p>
                    <button className="mt-4 px-3 py-1 bg-purple-600 text-white rounded text-sm">Action</button>
                </div>
            );
        case 'form':
            return (
                <div className={`${componentName} space-y-3`}>
                    <div>
                        <label className="block text-sm mb-1">Email</label>
                        <input type="email" placeholder="you@example.com" className="w-full px-3 py-2 border rounded" />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Password</label>
                        <input type="password" placeholder="••••••" className="w-full px-3 py-2 border rounded" />
                    </div>
                    <button className="w-full py-2 bg-purple-600 text-white rounded">Submit</button>
                </div>
            );
        case 'chat':
            return (
                <div className={`${componentName} space-y-2`}>
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg max-w-[80%]">
                        Hello! How can I help?
                    </div>
                    <div className="bg-purple-600 text-white p-3 rounded-lg max-w-[80%] ml-auto">
                        I need help with design
                    </div>
                    <div className="flex gap-2 mt-2">
                        <input placeholder="Type here..." className="flex-1 px-3 py-2 border rounded" />
                        <button className="px-4 py-2 bg-purple-600 text-white rounded">Send</button>
                    </div>
                </div>
            );
        case 'navigation':
            return (
                <nav className={`${componentName} flex gap-4 p-3`}>
                    <a href="#" className="hover:text-purple-600">Home</a>
                    <a href="#" className="hover:text-purple-600">About</a>
                    <a href="#" className="hover:text-purple-600">Services</a>
                    <a href="#" className="hover:text-purple-600">Contact</a>
                </nav>
            );
        default:
            return (
                <div className={componentName}>
                    <div className="p-4 border border-dashed border-gray-400 rounded text-center">
                        <p className="font-medium">{componentInfo?.displayName || componentName}</p>
                        <p className="text-sm text-gray-500 mt-1">{componentInfo?.description || 'Component preview'}</p>
                        <div className="mt-3 text-xs text-gray-400">
                            Selectors: {componentInfo?.selectors.slice(0, 3).join(', ')}
                        </div>
                    </div>
                </div>
            );
    }
}
