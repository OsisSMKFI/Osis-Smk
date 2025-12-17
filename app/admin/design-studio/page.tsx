'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Code, Eye, Save, Undo, Redo, 
    Palette, RefreshCw, ChevronDown, ChevronRight, 
    Play, Check, Trash2, Search, X, Send,
    Monitor, Smartphone, Tablet, Moon, Sun,
    File, Folder, FolderOpen, FileCode,
    Columns, AlertCircle, Loader2, Copy,
    Paintbrush, PanelLeftClose, PanelLeft,
    Zap, Download, Upload, Settings, Wand2,
    Sparkles, MessageCircle, Bot, User,
    RotateCcw, Type, Box, Layers, Grid3X3,
    ArrowRight, Command, Cpu
} from 'lucide-react';
import { DESIGN_REGISTRY } from '@/lib/design-registry';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 DESIGN STUDIO PRO v4.0 - Enterprise Grade
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
    actionType?: 'css' | 'component' | 'style' | 'info' | 'action';
    targetComponent?: string;
    codeBlocks?: { language: string; code: string; filename?: string }[];
}

interface SourceFile {
    path: string;
    name: string;
    content: string;
    language: string;
    size: number;
    modified: string;
}

interface FileTree {
    components: SourceFile[];
    pages: SourceFile[];
    styles: SourceFile[];
    config: SourceFile[];
    api: SourceFile[];
}

// File icon mapping by extension
const FILE_ICONS: Record<string, { icon: string; color: string }> = {
    tsx: { icon: '⚛️', color: 'text-blue-400' },
    ts: { icon: '📘', color: 'text-blue-500' },
    css: { icon: '🎨', color: 'text-purple-400' },
    js: { icon: '📒', color: 'text-yellow-400' },
    json: { icon: '📋', color: 'text-orange-400' },
    md: { icon: '📝', color: 'text-gray-400' }
};

// CSS Templates - Complete
const CSS_TEMPLATES: Record<string, { name: string; css: string; icon: string }> = {
    neumorphism: {
        name: 'Neumorphism',
        icon: '🌙',
        css: `/* Neumorphism */
background: #e0e5ec;
border-radius: 16px;
box-shadow: 8px 8px 16px #b8bec7, -8px -8px 16px #ffffff;
padding: 24px;`
    },
    glassmorphism: {
        name: 'Glassmorphism',
        icon: '💎',
        css: `/* Glassmorphism */
background: rgba(255, 255, 255, 0.1);
backdrop-filter: blur(16px);
-webkit-backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.2);
border-radius: 16px;
padding: 24px;`
    },
    gradient: {
        name: 'Gradient',
        icon: '🌈',
        css: `/* Gradient */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
color: white;
border-radius: 12px;
padding: 24px;
box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);`
    },
    dark: {
        name: 'Dark Mode',
        icon: '🌑',
        css: `/* Dark Mode */
background: #1a1a2e;
color: #eaeaea;
border: 1px solid rgba(255,255,255,0.1);
border-radius: 12px;
padding: 24px;`
    },
    neon: {
        name: 'Neon Glow',
        icon: '⚡',
        css: `/* Neon Glow */
background: #0a0a0a;
color: #00ff88;
border: 2px solid #00ff88;
border-radius: 8px;
padding: 24px;
box-shadow: 0 0 10px #00ff88, 0 0 20px rgba(0, 255, 136, 0.3);
text-shadow: 0 0 10px currentColor;`
    },
    minimal: {
        name: 'Minimal',
        icon: '⬜',
        css: `/* Minimal */
background: #fafafa;
border: 1px solid #eee;
border-radius: 4px;
padding: 20px;`
    },
    brutalist: {
        name: 'Brutalist',
        icon: '🧱',
        css: `/* Brutalist */
background: #ffffff;
border: 3px solid #000000;
padding: 20px;
box-shadow: 6px 6px 0 #000000;`
    },
    cyberpunk: {
        name: 'Cyberpunk',
        icon: '🤖',
        css: `/* Cyberpunk */
background: linear-gradient(135deg, #0c0c0c 0%, #1a0a20 100%);
color: #ff0080;
border: 1px solid #ff0080;
padding: 24px;
box-shadow: 0 0 20px rgba(255, 0, 128, 0.5);`
    }
};

export default function DesignStudioPage() {
    // ═══════════════════════════════════════════════════════════════════════════
    // STATE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Layout
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [chatOpen, setChatOpen] = useState(true);
    const [viewMode, setViewMode] = useState<'split' | 'code' | 'preview'>('split');
    const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    const [darkMode, setDarkMode] = useState(true);
    
    // Data
    const [designs, setDesigns] = useState<DesignOverride[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    
    // Editor
    const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
    const [code, setCode] = useState('');
    const [originalCode, setOriginalCode] = useState('');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    
    // History
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    
    // Explorer
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<string[]>(['active', 'templates']);
    
    // File Explorer (Real Source Files)
    const [fileTree, setFileTree] = useState<FileTree | null>(null);
    const [openSourceFile, setOpenSourceFile] = useState<SourceFile | null>(null);
    const [sourceCode, setSourceCode] = useState('');
    const [originalSourceCode, setOriginalSourceCode] = useState('');
    const [editorMode, setEditorMode] = useState<'css' | 'source'>('css');
    const [expandedFolders, setExpandedFolders] = useState<string[]>(['components', 'pages', 'styles']);
    const [isLoadingFile, setIsLoadingFile] = useState(false);
    
    // Chat
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: '👋 Hai! Saya Design AI Assistant - Fleksibel seperti GitHub Copilot!\n\n✨ **Saya bisa bantu:**\n• Generate CSS untuk komponen manapun\n• Modifikasi style website secara langsung\n• Jelaskan struktur kode\n• Buat animasi, hover effects, responsive\n• Jawab pertanyaan tentang design\n\n💡 **Contoh perintah:**\n- "Buat navbar lebih transparan"\n- "Tambahkan glassmorphism ke hero section"\n- "Ubah warna tombol jadi gradient"\n- "Bagaimana cara membuat card responsive?"\n\n📌 **Tidak perlu pilih komponen dulu!** Cukup ketik apa yang kamu mau.',
            timestamp: new Date()
        }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [isAILoading, setIsAILoading] = useState(false);
    
    // Notification
    const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    
    // Refs
    const editorRef = useRef<HTMLTextAreaElement>(null);
    const chatScrollRef = useRef<HTMLDivElement>(null);
    const historyDebounce = useRef<NodeJS.Timeout | null>(null);

    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════
    
    useEffect(() => {
        loadDesigns();
        loadFileTree();
        initializeAI();
    }, []);
    
    useEffect(() => {
        if (editorMode === 'css') {
            setHasUnsavedChanges(code !== originalCode);
        } else {
            setHasUnsavedChanges(sourceCode !== originalSourceCode);
        }
    }, [code, originalCode, sourceCode, originalSourceCode, editorMode]);
    
    useEffect(() => {
        chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [chatMessages]);
    
    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (hasUnsavedChanges) {
                    if (editorMode === 'source' && openSourceFile) {
                        saveSourceFile();
                    } else {
                        saveDesign();
                    }
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey && editorMode === 'css') {
                e.preventDefault();
                undo();
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z')) && editorMode === 'css') {
                e.preventDefault();
                redo();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [hasUnsavedChanges, history, historyIndex, editorMode, openSourceFile]);

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════════
    
    const loadDesigns = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/design/studio');
            const data = await res.json();
            if (data.success) {
                setDesigns(data.designs || []);
                notify('info', `${data.designs?.length || 0} design overrides synced`);
            } else {
                notify('error', data.error || 'Failed to load designs');
            }
        } catch (err) {
            console.error('Load error:', err);
            notify('error', 'Connection error');
        } finally {
            setIsLoading(false);
        }
    };
    
    // Load file tree with actual source files
    const loadFileTree = async () => {
        try {
            const res = await fetch('/api/design/files?action=list');
            const data = await res.json();
            if (data.success) {
                setFileTree(data.tree);
            }
        } catch (err) {
            console.error('File tree error:', err);
        }
    };
    
    // Open a real source file
    const openFile = async (filePath: string) => {
        if (hasUnsavedChanges && !confirm('Perubahan belum disimpan. Buang perubahan?')) return;
        
        setIsLoadingFile(true);
        try {
            const res = await fetch(`/api/design/files?action=read&file=${encodeURIComponent(filePath)}`);
            const data = await res.json();
            
            if (data.success) {
                setOpenSourceFile(data.file);
                setSourceCode(data.file.content);
                setOriginalSourceCode(data.file.content);
                setEditorMode('source');
                setSelectedComponent(null); // Clear CSS component selection
                notify('info', `Opened: ${data.file.name}`);
            } else {
                notify('error', data.error || 'Failed to open file');
            }
        } catch (err) {
            console.error('Open file error:', err);
            notify('error', 'Failed to read file');
        } finally {
            setIsLoadingFile(false);
        }
    };
    
    // Save source file
    const saveSourceFile = async () => {
        if (!openSourceFile) return;
        
        setIsSaving(true);
        try {
            const res = await fetch('/api/design/files', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save',
                    filePath: openSourceFile.path,
                    content: sourceCode
                })
            });
            
            const data = await res.json();
            if (data.success) {
                setOriginalSourceCode(sourceCode);
                setHasUnsavedChanges(false);
                setLastSaved(new Date());
                notify('success', `✅ Saved: ${openSourceFile.name}`);
            } else {
                notify('error', data.error || 'Save failed');
            }
        } catch (err) {
            console.error('Save error:', err);
            notify('error', 'Failed to save');
        } finally {
            setIsSaving(false);
        }
    };
    
    // Toggle folder in file explorer
    const toggleFolder = (folder: string) => {
        setExpandedFolders(prev => 
            prev.includes(folder) ? prev.filter(f => f !== folder) : [...prev, folder]
        );
    };
    
    // Get file extension
    const getFileExtension = (filename: string): string => {
        return filename.split('.').pop() || '';
    };

    const notify = (type: 'success' | 'error' | 'info', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
    };

    const initializeAI = () => {
        setChatMessages([{
            id: '0',
            role: 'system',
            content: `🚀 **Design Studio AI - Powered by GitHub Copilot Style**

Saya AI yang **fleksibel** dan bisa membantu:

**🎨 CSS & Styling:**
• Generate CSS untuk komponen apapun
• Glassmorphism, neumorphism, dark mode
• Animasi, hover effects, transitions
• Responsive design

**📝 Penjelasan & Info:**
• Jelaskan cara kerja CSS
• Best practices design
• Troubleshooting style issues

**🔥 Contoh langsung ketik:**
- "glassmorphism untuk navbar"
- "dark mode untuk semua card"  
- "hover effect button gradient"
- "responsive hero section"
- "apa itu flexbox?"

**💡 Tidak perlu pilih komponen dulu!**
Saya akan otomatis mendeteksi dari pertanyaan kamu.`,
            timestamp: new Date()
        }]);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // FILE OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════════
    
    const openDesign = (pageKey: string) => {
        if (hasUnsavedChanges && !confirm('Perubahan belum disimpan. Buang perubahan?')) return;
        
        const design = designs.find(d => d.page_key === pageKey);
        const componentName = pageKey.replace('design_override_', '');
        
        setSelectedComponent(componentName);
        const cssContent = design?.content || generateDefaultCSS(componentName);
        setCode(cssContent);
        setOriginalCode(design?.content || '');
        
        setHistory([{ css: cssContent, timestamp: Date.now(), action: 'opened' }]);
        setHistoryIndex(0);
        
        notify('info', `Opened: ${componentName}`);
    };

    const createNewDesign = (componentName: string) => {
        if (hasUnsavedChanges && !confirm('Perubahan belum disimpan. Buang perubahan?')) return;
        
        setSelectedComponent(componentName);
        const defaultCSS = generateDefaultCSS(componentName);
        setCode(defaultCSS);
        setOriginalCode('');
        setHistory([{ css: defaultCSS, timestamp: Date.now(), action: 'created' }]);
        setHistoryIndex(0);
        
        notify('info', `New design: ${componentName}`);
    };

    const generateDefaultCSS = (name: string): string => {
        const info = DESIGN_REGISTRY[name];
        const selectors = info?.selectors || [`.${name}`];
        const now = new Date().toLocaleString('id-ID');
        
        return `/* ═══════════════════════════════════════════════════════════
   ${info?.displayName || name} - Custom Styles
   Created: ${now}
   ═══════════════════════════════════════════════════════════ */

${selectors[0]} {
    /* Base Styles */
    
}

${selectors[0]}:hover {
    /* Hover State */
    
}

${selectors[0]}:focus {
    /* Focus State */
    
}

${selectors[0]}:active {
    /* Active State */
    
}

/* Responsive - Tablet */
@media (max-width: 768px) {
    ${selectors[0]} {
        
    }
}

/* Responsive - Mobile */
@media (max-width: 480px) {
    ${selectors[0]} {
        
    }
}`;
    };

    const saveDesign = async () => {
        if (!selectedComponent) {
            notify('error', 'Pilih komponen terlebih dahulu');
            return;
        }
        
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
                setLastSaved(new Date());
                await loadDesigns();
                notify('success', `✅ Saved: ${selectedComponent}`);
                
                // Dispatch event for global reload
                window.dispatchEvent(new CustomEvent('design-updated', { 
                    detail: { component: selectedComponent, css: code } 
                }));
            } else {
                notify('error', data.error || 'Save failed');
            }
        } catch (err) {
            console.error('Save error:', err);
            notify('error', 'Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    const deleteDesign = async (pageKey: string) => {
        if (!confirm('Hapus design override ini?')) return;
        
        const componentName = pageKey.replace('design_override_', '');
        
        try {
            const res = await fetch('/api/design/studio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ component: componentName, action: 'delete' })
            });
            
            const data = await res.json();
            if (data.success) {
                if (selectedComponent === componentName) {
                    setSelectedComponent(null);
                    setCode('');
                    setOriginalCode('');
                }
                await loadDesigns();
                notify('success', 'Deleted');
            } else {
                notify('error', data.error || 'Delete failed');
            }
        } catch (err) {
            notify('error', 'Delete failed');
        }
    };

    const exportCSS = () => {
        if (!code || !selectedComponent) {
            notify('error', 'Tidak ada CSS untuk export');
            return;
        }
        
        const blob = new Blob([code], { type: 'text/css' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedComponent}.css`;
        a.click();
        URL.revokeObjectURL(url);
        notify('success', 'CSS exported');
    };

    const importCSS = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.css,.txt';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            
            const text = await file.text();
            setCode(text);
            addToHistory(text, 'imported');
            notify('success', 'CSS imported');
        };
        input.click();
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // HISTORY (UNDO/REDO)
    // ═══════════════════════════════════════════════════════════════════════════
    
    const addToHistory = useCallback((css: string, action: string) => {
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push({ css, timestamp: Date.now(), action });
            return newHistory.slice(-50);
        });
        setHistoryIndex(prev => Math.min(prev + 1, 49));
    }, [historyIndex]);

    const handleCodeChange = (newCode: string) => {
        setCode(newCode);
        
        if (historyDebounce.current) clearTimeout(historyDebounce.current);
        historyDebounce.current = setTimeout(() => {
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
            notify('error', 'Pilih komponen terlebih dahulu');
            return;
        }
        
        const template = CSS_TEMPLATES[templateKey];
        if (!template) return;
        
        const info = DESIGN_REGISTRY[selectedComponent];
        const selector = info?.selectors?.[0] || `.${selectedComponent}`;
        
        const newCSS = `/* ═══════════════════════════════════════════════════════════
   ${template.name} Style for ${selectedComponent}
   Applied: ${new Date().toLocaleString('id-ID')}
   ═══════════════════════════════════════════════════════════ */

${selector} {
    ${template.css}
}

${selector}:hover {
    transform: translateY(-2px);
    transition: all 0.3s ease;
}`;
        
        setCode(newCSS);
        addToHistory(newCSS, `template:${templateKey}`);
        notify('success', `Applied: ${template.name}`);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // AI CHAT - INTELLIGENT CSS GENERATOR
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Smart CSS Pattern Generator
    const generateSmartCSS = (query: string, selector: string, category: string): { css: string; message: string } | null => {
        const q = query.toLowerCase();
        
        // Pattern detection with intelligent matching
        const patterns: Record<string, { match: RegExp; css: (sel: string) => string; msg: string }> = {
            glassmorphism: {
                match: /glass(morphism)?|blur|frosted|transparan/i,
                css: (sel) => `${sel} {
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 20px;
    padding: 28px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

${sel}:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.25);
    transform: translateY(-4px);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}`,
                msg: '💎 Glassmorphism style created! Modern frosted glass effect with smooth hover animation.'
            },
            darkMode: {
                match: /dark\s?(mode)?|gelap|hitam|night/i,
                css: (sel) => `${sel} {
    background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
    color: #e8e8e8;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
}

${sel}:hover {
    border-color: rgba(139, 92, 246, 0.5);
    box-shadow: 0 8px 32px rgba(139, 92, 246, 0.15);
    transition: all 0.3s ease;
}`,
                msg: '🌙 Dark mode style applied! Elegant dark theme with subtle purple accent.'
            },
            neon: {
                match: /neon|glow|cyberpunk|cyber/i,
                css: (sel) => `${sel} {
    background: #0a0a0f;
    color: #00ffaa;
    border: 2px solid #00ffaa;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 
        0 0 10px #00ffaa,
        0 0 20px rgba(0, 255, 170, 0.4),
        inset 0 0 20px rgba(0, 255, 170, 0.05);
    text-shadow: 0 0 8px currentColor;
}

${sel}:hover {
    box-shadow: 
        0 0 20px #00ffaa,
        0 0 40px rgba(0, 255, 170, 0.6),
        inset 0 0 30px rgba(0, 255, 170, 0.1);
    transform: scale(1.02);
    transition: all 0.3s ease;
}`,
                msg: '⚡ Neon glow effect activated! Cyberpunk-style with vibrant green glow.'
            },
            gradient: {
                match: /gradient|gradien|warna|colorful|rainbow/i,
                css: (sel) => `${sel} {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
    color: white;
    border: none;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 10px 40px rgba(102, 126, 234, 0.35);
    font-weight: 500;
}

${sel}:hover {
    transform: translateY(-4px) scale(1.01);
    box-shadow: 0 20px 60px rgba(102, 126, 234, 0.45);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}`,
                msg: '🌈 Gradient style applied! Beautiful purple-pink gradient with premium shadow.'
            },
            hover: {
                match: /hover|animasi|animation|efek|effect/i,
                css: (sel) => `${sel} {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
}

${sel}:hover {
    transform: translateY(-6px) scale(1.02);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
}

${sel}:active {
    transform: translateY(-2px) scale(1.01);
    transition: all 0.1s ease;
}`,
                msg: '✨ Hover animation added! Smooth lift effect with elegant scaling.'
            },
            responsive: {
                match: /responsive|mobile|tablet|hp|handphone|adaptif/i,
                css: (sel) => `/* Desktop - Default */
${sel} {
    padding: 32px;
    font-size: 16px;
    border-radius: 16px;
}

/* Tablet - max 1024px */
@media (max-width: 1024px) {
    ${sel} {
        padding: 24px;
        font-size: 15px;
        border-radius: 14px;
    }
}

/* Mobile - max 768px */
@media (max-width: 768px) {
    ${sel} {
        padding: 20px;
        font-size: 14px;
        border-radius: 12px;
    }
}

/* Small Mobile - max 480px */
@media (max-width: 480px) {
    ${sel} {
        padding: 16px;
        font-size: 13px;
        border-radius: 10px;
    }
}`,
                msg: '📱 Responsive styles added! Adapts perfectly from desktop to mobile.'
            },
            neumorphism: {
                match: /neumorphism|soft|lembut|emboss/i,
                css: (sel) => `${sel} {
    background: #e0e5ec;
    border-radius: 20px;
    box-shadow: 
        10px 10px 20px #b8bec7,
        -10px -10px 20px #ffffff;
    padding: 28px;
    color: #333;
}

${sel}:hover {
    box-shadow: 
        12px 12px 24px #b8bec7,
        -12px -12px 24px #ffffff;
    transition: all 0.3s ease;
}`,
                msg: '🌙 Neumorphism style! Soft 3D embossed effect.'
            },
            minimal: {
                match: /minimal|simple|clean|bersih|sederhana/i,
                css: (sel) => `${sel} {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 24px;
    color: #1f2937;
}

${sel}:hover {
    border-color: #9ca3af;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    transition: all 0.2s ease;
}`,
                msg: '✓ Minimal clean style! Simple and elegant.'
            },
            shadow: {
                match: /shadow|bayangan|depth/i,
                css: (sel) => `${sel} {
    box-shadow: 
        0 1px 1px rgba(0,0,0,0.08),
        0 2px 2px rgba(0,0,0,0.08),
        0 4px 4px rgba(0,0,0,0.08),
        0 8px 8px rgba(0,0,0,0.08),
        0 16px 16px rgba(0,0,0,0.08);
    border-radius: 16px;
    padding: 24px;
    background: white;
}

${sel}:hover {
    box-shadow: 
        0 1px 2px rgba(0,0,0,0.1),
        0 2px 4px rgba(0,0,0,0.1),
        0 4px 8px rgba(0,0,0,0.1),
        0 8px 16px rgba(0,0,0,0.1),
        0 16px 32px rgba(0,0,0,0.1);
    transform: translateY(-4px);
    transition: all 0.4s ease;
}`,
                msg: '🎭 Layered shadow effect! Smooth depth illusion.'
            },
            border: {
                match: /border|outline|garis|tepi/i,
                css: (sel) => `${sel} {
    border: 2px solid transparent;
    background: 
        linear-gradient(white, white) padding-box,
        linear-gradient(135deg, #667eea, #764ba2) border-box;
    border-radius: 12px;
    padding: 24px;
}

${sel}:hover {
    background: 
        linear-gradient(white, white) padding-box,
        linear-gradient(135deg, #764ba2, #f093fb) border-box;
    transition: all 0.3s ease;
}`,
                msg: '🎨 Gradient border effect! Modern animated border.'
            }
        };
        
        // Check each pattern
        for (const [, pattern] of Object.entries(patterns)) {
            if (pattern.match.test(q)) {
                return {
                    css: pattern.css(selector),
                    message: pattern.msg
                };
            }
        }
        
        return null;
    };
    
    // Detect component from user query
    const detectComponentFromQuery = (query: string): { component: string; selector: string; info: any } | null => {
        const q = query.toLowerCase();
        
        // Check against all components in registry
        for (const [key, info] of Object.entries(DESIGN_REGISTRY)) {
            const name = info.displayName.toLowerCase();
            const desc = info.description.toLowerCase();
            
            if (q.includes(name) || q.includes(key.replace(/_/g, ' ')) || q.includes(key)) {
                return {
                    component: key,
                    selector: info.selectors[0],
                    info
                };
            }
        }
        
        // Common patterns
        const patterns: Record<string, string> = {
            'navbar|nav|navigasi|menu': 'navbar',
            'hero|banner|jumbotron|header utama': 'hero',
            'footer|kaki': 'footer',
            'button|tombol|btn': 'button',
            'card|kartu': 'card',
            'input|form|field': 'input',
            'heading|judul|title|h1|h2': 'heading',
            'sidebar|side bar': 'sidebar',
            'modal|popup|dialog': 'modal',
            'chat|widget chat|live chat': 'chat_widget',
            'post|artikel|blog': 'post_card',
            'announcement|pengumuman': 'announcements',
            'poll|voting': 'polls',
            'vision|visi': 'vision_card',
            'mission|misi': 'mission_card',
            'loading|skeleton|spinner': 'loading',
            'avatar|profile|profil': 'avatar',
            'badge|tag|label': 'badge',
            'table|tabel': 'table',
            'link|tautan': 'link',
            'image|gambar|img': 'image'
        };
        
        for (const [pattern, component] of Object.entries(patterns)) {
            if (new RegExp(pattern, 'i').test(q)) {
                const info = DESIGN_REGISTRY[component];
                if (info) {
                    return {
                        component,
                        selector: info.selectors[0],
                        info
                    };
                }
            }
        }
        
        return null;
    };
    
    const sendChatMessage = async () => {
        if (!chatInput.trim() || isAILoading) return;
        
        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: chatInput,
            timestamp: new Date()
        };
        
        setChatMessages(prev => [...prev, userMessage]);
        const userQuery = chatInput;
        setChatInput('');
        setIsAILoading(true);
        
        try {
            // Analyze what the user is asking for
            const queryLower = userQuery.toLowerCase();
            
            // Check if user is asking a question (not requesting CSS)
            const isQuestion = /\?|dimana|where|bagaimana|how|apa itu|what is|letak|lokasi|file|jelaskan|explain/i.test(userQuery);
            const isAskingLocation = /dimana|where|letak|lokasi|file apa|di file/i.test(userQuery);
            const containsHTML = /<\w+[\s>]|class="|className=/i.test(userQuery);
            const isRequestingResponsive = /responsif|responsive|mobile|hp|handphone|tablet/i.test(userQuery);
            
            // Auto-detect component from query if not selected
            let targetComponent = selectedComponent;
            let componentInfo = selectedComponent ? DESIGN_REGISTRY[selectedComponent] : null;
            let selector = componentInfo?.selectors?.[0] || '';
            
            // If user pasted HTML, try to identify the component
            let identifiedFromHTML: { component: string; file: string; description: string } | null = null;
            if (containsHTML) {
                // Analyze HTML to identify component
                if (userQuery.includes('sekbid') || userQuery.includes('Sekbid')) {
                    identifiedFromHTML = {
                        component: 'Sekbid Filter Tabs',
                        file: 'app/bidang/page.tsx atau components/ProkerSection.tsx',
                        description: 'Filter tabs untuk memilih sekbid di halaman Program Kerja'
                    };
                } else if (userQuery.includes('navbar') || userQuery.includes('nav')) {
                    identifiedFromHTML = {
                        component: 'Navbar',
                        file: 'components/Navbar.tsx',
                        description: 'Navigation bar utama website'
                    };
                } else if (userQuery.includes('footer')) {
                    identifiedFromHTML = {
                        component: 'Footer',
                        file: 'components/Footer.tsx',
                        description: 'Footer website'
                    };
                } else if (userQuery.includes('hero') || userQuery.includes('banner')) {
                    identifiedFromHTML = {
                        component: 'Hero Section',
                        file: 'components/DynamicHero.tsx',
                        description: 'Banner utama di homepage'
                    };
                } else if (userQuery.includes('card')) {
                    identifiedFromHTML = {
                        component: 'Card Component',
                        file: 'components/cards/PostCard.tsx',
                        description: 'Card untuk menampilkan konten'
                    };
                }
            }
            
            // Try to detect component from user query
            const detected = detectComponentFromQuery(userQuery);
            if (detected && !targetComponent) {
                targetComponent = detected.component;
                componentInfo = detected.info;
                selector = detected.selector;
                setSelectedComponent(detected.component);
            }
            
            // If still no component, use general approach
            if (!targetComponent) {
                selector = '.target-component';
            } else {
                selector = componentInfo?.selectors?.[0] || `[data-component="${targetComponent}"]`;
            }
            
            // SMART RESPONSE: If user is asking about location or pasted HTML
            if (isAskingLocation || (containsHTML && isQuestion)) {
                let response = '';
                
                if (identifiedFromHTML) {
                    response = `📍 **Komponen Teridentifikasi:**\n\n`;
                    response += `**Nama:** ${identifiedFromHTML.component}\n`;
                    response += `**File:** \`${identifiedFromHTML.file}\`\n`;
                    response += `**Deskripsi:** ${identifiedFromHTML.description}\n\n`;
                    
                    if (isRequestingResponsive) {
                        response += `📱 **Tips Responsive:**\n`;
                        response += `Untuk membuat komponen ini lebih responsive, kamu bisa:\n\n`;
                        response += `1. Buka file \`${identifiedFromHTML.file}\` di VS Code\n`;
                        response += `2. Gunakan Tailwind breakpoints: \`sm:\`, \`md:\`, \`lg:\`\n`;
                        response += `3. Contoh perubahan:\n`;
                        response += `   - \`hidden sm:inline\` → tampil di mobile: \`inline\`\n`;
                        response += `   - \`px-4\` → lebih kecil: \`px-2 sm:px-4\`\n`;
                        response += `   - \`gap-2\` → lebih rapat: \`gap-1 sm:gap-2\`\n\n`;
                        
                        if (identifiedFromHTML.component.includes('Sekbid')) {
                            response += `🎨 **Untuk mengubah emoji Sekbid:**\n`;
                            response += `Cari array yang berisi emoji di file, biasanya seperti:\n`;
                            response += `\`\`\`tsx
const sekbidList = [
  { id: 1, name: 'Keagamaan', emoji: '🎭' },
  { id: 2, name: 'Kaderisasi', emoji: '📚' },
  { id: 3, name: 'Akademik', emoji: '🏃' },
  { id: 4, name: 'Ekonomi Kreatif', emoji: '💡' },
  { id: 5, name: 'Kesehatan', emoji: '🎨' },
  { id: 6, name: 'Kominfo', emoji: '🌿' },
];
\`\`\`\n\n`;
                            response += `Ganti emoji sesuai keinginan! 🚀`;
                        }
                    }
                } else if (containsHTML) {
                    response = `🔍 **Analisis HTML:**\n\n`;
                    response += `Saya melihat kamu menempelkan kode HTML. `;
                    response += `Untuk membantu lebih baik, beritahu saya:\n\n`;
                    response += `1. Dari halaman mana komponen ini?\n`;
                    response += `2. Apa yang ingin kamu ubah?\n\n`;
                    response += `💡 **Tip:** Kamu bisa mencari file dengan fitur Source Files di sidebar kiri!`;
                }
                
                setChatMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: response,
                    timestamp: new Date(),
                    actionType: 'info'
                }]);
                return;
            }
            
            // ONLY use smart CSS patterns if user is EXPLICITLY requesting a style
            const isExplicitStyleRequest = /buat(kan)?|terapkan|apply|style|tambah(kan)?|ubah.*jadi|make.*look/i.test(userQuery) && 
                                          !isQuestion && 
                                          /glass|dark|neon|gradient|hover|animasi|responsive|shadow|neumorphism|minimal/i.test(userQuery);
            
            if (targetComponent && isExplicitStyleRequest) {
                const smartResult = generateSmartCSS(userQuery, selector, componentInfo?.category || 'other');
                
                if (smartResult) {
                    setChatMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: `🎯 Komponen terdeteksi: **${componentInfo?.displayName || targetComponent}**\n\n${smartResult.message}\n\n✅ Klik **Apply** untuk menerapkan ke website.`,
                        timestamp: new Date(),
                        cssCode: smartResult.css,
                        targetComponent,
                        actionType: 'css'
                    }]);
                    return;
                }
            }
            
            // Build enhanced prompt for AI - send to real AI for complex queries
            const enhancedMessage = `
Kamu adalah AI Design Assistant yang powerful dan fleksibel seperti GitHub Copilot.
Kamu HARUS merespons dengan cerdas dan membantu, BUKAN hanya memberikan CSS template.

${containsHTML ? `
User menempelkan HTML code. Analisis dan identifikasi:
1. Komponen apa ini
2. Di file mana lokasinya
3. Bagaimana cara mengubahnya
` : ''}

${targetComponent ? `
Komponen target: ${targetComponent}
Selector CSS: ${selector}
Kategori: ${componentInfo?.category || 'other'}
Deskripsi: ${componentInfo?.description || ''}
` : `
Tidak ada komponen spesifik yang dipilih.
`}

CSS saat ini di editor:
${code || '(tidak ada)'}

Permintaan user: ${userQuery}

INSTRUKSI PENTING:
1. Berikan respons dalam bahasa Indonesia yang ramah dan informatif
2. Jika user BERTANYA (ada tanda ?, kata "dimana", "bagaimana", dll), JAWAB pertanyaannya
3. Jika user paste HTML, identifikasi komponennya dan jelaskan lokasinya
4. JANGAN langsung berikan CSS jika user hanya bertanya
5. Jika diminta CSS, sertakan kode lengkap dalam blok \`\`\`css ... \`\`\`
6. Jika user minta responsive, jelaskan cara mengubah dengan Tailwind breakpoints
7. Berikan jawaban yang RELEVAN dengan pertanyaan, bukan template generik`;
            
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: enhancedMessage }],
                    context: 'design_studio',
                    mode: 'admin',
                    provider: 'auto'
                })
            });
            
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            
            const data = await res.json();
            
            // Extract all code blocks (CSS, TSX, etc)
            const codeBlocks: { language: string; code: string }[] = [];
            const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
            let match;
            while ((match = codeBlockRegex.exec(data.reply)) !== null) {
                codeBlocks.push({
                    language: match[1] || 'text',
                    code: match[2].trim()
                });
            }
            
            // Extract CSS specifically
            let cssCode: string | undefined;
            const cssBlock = codeBlocks.find(b => b.language === 'css');
            if (cssBlock) {
                cssCode = cssBlock.code;
            }
            
            // Keep the response as-is, don't strip code blocks for informational responses
            let displayContent = data.reply || 'Maaf, tidak ada respons dari AI.';
            
            const aiMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: displayContent,
                timestamp: new Date(),
                cssCode,
                targetComponent: targetComponent || undefined,
                codeBlocks: codeBlocks.length > 0 ? codeBlocks : undefined,
                actionType: cssCode ? 'css' : (codeBlocks.length > 0 ? 'component' : 'info')
            };
            
            setChatMessages(prev => [...prev, aiMessage]);
            
        } catch (err) {
            console.error('AI Chat error:', err);
            
            // Smart fallback based on what user asked
            const queryLower = userQuery.toLowerCase();
            let fallbackResponse = '';
            
            if (/dimana|where|letak|lokasi|file/i.test(userQuery)) {
                fallbackResponse = `📂 **Mencari Lokasi File**\n\n`;
                fallbackResponse += `Gunakan fitur **Source Files** di sidebar kiri untuk menelusuri file.\n\n`;
                fallbackResponse += `**Lokasi file umum:**\n`;
                fallbackResponse += `- Components: \`components/\`\n`;
                fallbackResponse += `- Pages: \`app/\`\n`;
                fallbackResponse += `- Styles: \`app/globals.css\`\n`;
                fallbackResponse += `- Config: \`tailwind.config.ts\`\n\n`;
                fallbackResponse += `💡 Klik pada file di sidebar untuk membuka dan edit!`;
            } else if (/responsif|responsive|mobile/i.test(userQuery)) {
                fallbackResponse = `📱 **Tips Membuat Responsive**\n\n`;
                fallbackResponse += `Gunakan Tailwind breakpoints:\n`;
                fallbackResponse += `- \`sm:\` - 640px ke atas\n`;
                fallbackResponse += `- \`md:\` - 768px ke atas\n`;
                fallbackResponse += `- \`lg:\` - 1024px ke atas\n\n`;
                fallbackResponse += `**Contoh:**\n`;
                fallbackResponse += `\`\`\`tsx\n<div className="px-2 sm:px-4 md:px-6 lg:px-8">\n  <span className="hidden sm:inline">Text desktop</span>\n  <span className="sm:hidden">Text mobile</span>\n</div>\n\`\`\``;
            } else if (/<\w+[\s>]|class=/i.test(userQuery)) {
                fallbackResponse = `🔍 **Analisis Kode**\n\n`;
                fallbackResponse += `Saya melihat kamu menempelkan kode HTML/JSX.\n\n`;
                fallbackResponse += `Untuk mengubahnya:\n`;
                fallbackResponse += `1. Gunakan **Source Files** di sidebar\n`;
                fallbackResponse += `2. Cari file yang sesuai\n`;
                fallbackResponse += `3. Edit langsung di editor\n\n`;
                fallbackResponse += `💡 Atau tanyakan lebih spesifik apa yang ingin diubah!`;
            } else {
                fallbackResponse = `🤖 Saya siap membantu! Coba:\n\n`;
                fallbackResponse += `**📍 Lokasi File:**\n- "dimana file navbar?"\n- "letak komponen hero"\n\n`;
                fallbackResponse += `**🎨 Styling:**\n- "buat glassmorphism untuk card"\n- "dark mode untuk navbar"\n\n`;
                fallbackResponse += `**📱 Responsive:**\n- "buat navbar responsive"\n- "mobile friendly button"\n\n`;
                fallbackResponse += `**📝 Edit File:**\nGunakan sidebar → Source Files untuk buka dan edit file langsung!`;
            }
            
            setChatMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: fallbackResponse,
                timestamp: new Date(),
                actionType: 'info'
            }]);
        } finally {
            setIsAILoading(false);
        }
    };

    const applyCSSFromChat = async (css: string, targetComp?: string) => {
        const component = targetComp || selectedComponent;
        
        if (!component) {
            // If no component, show in editor anyway
            setCode(css);
            addToHistory(css, 'ai-applied');
            notify('info', 'CSS ditampilkan di editor. Pilih komponen untuk menyimpan.');
            return;
        }
        
        // Select the component if not already selected
        if (!selectedComponent && component) {
            setSelectedComponent(component);
        }
        
        // Update editor with new CSS
        setCode(css);
        addToHistory(css, 'ai-applied');
        
        // Auto-save to database so changes apply globally
        try {
            const res = await fetch('/api/design/studio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    component: component,
                    css: css,
                    style: 'ai-generated'
                })
            });
            
            const data = await res.json();
            if (data.success) {
                setOriginalCode(css);
                setHasUnsavedChanges(false);
                setLastSaved(new Date());
                await loadDesigns();
                
                // Trigger global design reload so website updates immediately
                window.dispatchEvent(new CustomEvent('design-updated', { 
                    detail: { component: component, css: css } 
                }));
                
                notify('success', `✅ CSS applied to ${component} & synced to website!`);
            } else {
                notify('info', 'CSS applied locally - Save to apply globally');
            }
        } catch (err) {
            console.error('Auto-save error:', err);
            notify('info', 'CSS applied locally - Save manually to apply');
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA GROUPING
    // ═══════════════════════════════════════════════════════════════════════════
    
    const activeOverrides = designs.reduce((acc, d) => {
        const name = d.page_key.replace('design_override_', '');
        const info = DESIGN_REGISTRY[name];
        const cat = info?.category || 'other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push({ ...d, componentName: name, info });
        return acc;
    }, {} as Record<string, (DesignOverride & { componentName: string; info?: typeof DESIGN_REGISTRY[string] })[]>);

    const allComponents = Object.entries(DESIGN_REGISTRY).reduce((acc, [key, info]) => {
        if (!acc[info.category]) acc[info.category] = [];
        acc[info.category].push({ key, ...info });
        return acc;
    }, {} as Record<string, ({ key: string } & typeof DESIGN_REGISTRY[string])[]>);

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
            <div className="h-full flex flex-col bg-gray-900">
                <div className="h-10 flex items-center justify-between px-3 bg-gray-800 border-b border-gray-700">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Eye className="w-4 h-4 text-green-400" />
                        <span>Live Preview</span>
                        {selectedComponent && <span className="text-gray-500">— {selectedComponent}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                        {(['desktop', 'tablet', 'mobile'] as const).map(device => (
                            <button
                                key={device}
                                onClick={() => setPreviewDevice(device)}
                                className={`p-1.5 rounded transition-colors ${
                                    previewDevice === device 
                                        ? 'bg-blue-600 text-white' 
                                        : 'text-gray-400 hover:bg-gray-700'
                                }`}
                                title={device}
                            >
                                {device === 'desktop' ? <Monitor className="w-4 h-4" /> : 
                                 device === 'tablet' ? <Tablet className="w-4 h-4" /> : 
                                 <Smartphone className="w-4 h-4" />}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="flex-1 overflow-auto p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                    <style dangerouslySetInnerHTML={{ __html: code }} />
                    
                    <div style={{ maxWidth: deviceWidth, margin: '0 auto' }} className="transition-all duration-300">
                        {selectedComponent ? (
                            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
                                <div className="mb-4 pb-3 border-b border-gray-700">
                                    <div className="text-sm text-gray-400">Component Preview</div>
                                    <div className="text-lg font-semibold text-white">{info?.displayName || selectedComponent}</div>
                                </div>
                                
                                {/* Dynamic Preview */}
                                {info?.category === 'button' && (
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap gap-3">
                                            <button className={selectedComponent}>Primary</button>
                                            <button className={selectedComponent}>Secondary</button>
                                            <button className={selectedComponent} disabled>Disabled</button>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            <button className={`${selectedComponent} text-sm`}>Small</button>
                                            <button className={selectedComponent}>Medium</button>
                                            <button className={`${selectedComponent} text-lg px-6 py-3`}>Large</button>
                                        </div>
                                    </div>
                                )}
                                
                                {info?.category === 'card' && (
                                    <div className="grid gap-4">
                                        <div className={selectedComponent}>
                                            <h3 className="text-lg font-bold mb-2">Card Title</h3>
                                            <p className="text-sm opacity-70 mb-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                                            <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm">Action</button>
                                        </div>
                                    </div>
                                )}
                                
                                {info?.category === 'form' && (
                                    <form className={selectedComponent} onSubmit={e => e.preventDefault()}>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm mb-1 text-gray-300">Email</label>
                                                <input type="email" placeholder="you@example.com" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                                            </div>
                                            <div>
                                                <label className="block text-sm mb-1 text-gray-300">Password</label>
                                                <input type="password" placeholder="••••••••" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                                            </div>
                                            <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded">Submit</button>
                                        </div>
                                    </form>
                                )}
                                
                                {info?.category === 'navigation' && (
                                    <nav className={selectedComponent}>
                                        <div className="flex gap-6 p-4">
                                            <a href="#" className="text-white hover:text-blue-400 transition-colors">Home</a>
                                            <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">About</a>
                                            <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Services</a>
                                            <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Contact</a>
                                        </div>
                                    </nav>
                                )}
                                
                                {info?.category === 'chat' && (
                                    <div className={selectedComponent}>
                                        <div className="space-y-3 mb-4">
                                            <div className="flex gap-2">
                                                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                                                    <Bot className="w-4 h-4" />
                                                </div>
                                                <div className="bg-gray-700 p-3 rounded-lg max-w-[80%]">
                                                    Hello! How can I help you today?
                                                </div>
                                            </div>
                                            <div className="flex gap-2 justify-end">
                                                <div className="bg-blue-600 text-white p-3 rounded-lg max-w-[80%]">
                                                    I need help with design
                                                </div>
                                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                                    <User className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <input placeholder="Type a message..." className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                                            <button className="px-4 py-2 bg-blue-600 text-white rounded">Send</button>
                                        </div>
                                    </div>
                                )}
                                
                                {info?.category === 'layout' && (
                                    <div className={selectedComponent}>
                                        <div className="border-2 border-dashed border-gray-600 p-8 text-center rounded-lg">
                                            <Layers className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                                            <div className="text-xl font-bold text-white mb-2">{info.displayName}</div>
                                            <div className="text-sm text-gray-400">{info.description}</div>
                                        </div>
                                    </div>
                                )}
                                
                                {(!info || !['button', 'card', 'form', 'navigation', 'chat', 'layout'].includes(info.category)) && (
                                    <div className={selectedComponent}>
                                        <div className="border-2 border-dashed border-gray-600 p-8 text-center rounded-lg">
                                            <Box className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                                            <div className="text-xl font-bold text-white mb-2">{info?.displayName || selectedComponent}</div>
                                            <div className="text-sm text-gray-400">{info?.description || 'Component preview'}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full min-h-[300px] flex items-center justify-center text-gray-500">
                                <div className="text-center">
                                    <Eye className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                    <p className="text-lg">Pilih komponen untuk preview</p>
                                    <p className="text-sm mt-1">Gunakan sidebar di kiri</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER - Responsive within admin layout
    // ═══════════════════════════════════════════════════════════════════════════

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] min-h-[600px] bg-gray-900 rounded-xl overflow-hidden border border-gray-700 shadow-2xl">
            {/* ═══════════ TOOLBAR ═══════════ */}
            <div className="h-12 flex items-center justify-between px-3 bg-gray-800 border-b border-gray-700">
                {/* Left */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 pr-3 border-r border-gray-600">
                        <Paintbrush className="w-5 h-5 text-purple-400" />
                        <span className="font-semibold text-white hidden sm:inline">Design Studio</span>
                    </div>
                    
                    <button 
                        onClick={() => setSidebarOpen(!sidebarOpen)} 
                        className={`p-2 rounded transition-colors ${sidebarOpen ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                        title="Toggle Explorer"
                    >
                        {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
                    </button>
                    
                    <div className="w-px h-6 bg-gray-600 mx-1" />
                    
                    <button 
                        onClick={() => {
                            if (editorMode === 'source' && openSourceFile) {
                                saveSourceFile();
                            } else {
                                saveDesign();
                            }
                        }} 
                        disabled={!hasUnsavedChanges || isSaving}
                        className={`p-2 rounded flex items-center gap-1.5 transition-colors ${
                            hasUnsavedChanges ? 'text-orange-400 hover:bg-gray-700' : 'text-gray-500'
                        }`}
                        title="Save (Ctrl+S)"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </button>
                    
                    <button onClick={undo} disabled={historyIndex <= 0 || editorMode !== 'css'} className={`p-2 rounded transition-colors ${historyIndex > 0 && editorMode === 'css' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600'}`} title="Undo (Ctrl+Z)">
                        <Undo className="w-4 h-4" />
                    </button>
                    <button onClick={redo} disabled={historyIndex >= history.length - 1 || editorMode !== 'css'} className={`p-2 rounded transition-colors ${historyIndex < history.length - 1 && editorMode === 'css' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600'}`} title="Redo (Ctrl+Y)">
                        <Redo className="w-4 h-4" />
                    </button>
                    
                    <div className="w-px h-6 bg-gray-600 mx-1" />
                    
                    <button onClick={() => setViewMode('split')} className={`p-2 rounded transition-colors ${viewMode === 'split' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`} title="Split View">
                        <Columns className="w-4 h-4" />
                    </button>
                    <button onClick={() => setViewMode('code')} className={`p-2 rounded transition-colors ${viewMode === 'code' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`} title="Code Only">
                        <Code className="w-4 h-4" />
                    </button>
                    <button onClick={() => setViewMode('preview')} className={`p-2 rounded transition-colors ${viewMode === 'preview' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`} title="Preview Only">
                        <Eye className="w-4 h-4" />
                    </button>
                </div>
                
                {/* Center - File info */}
                {editorMode === 'source' && openSourceFile ? (
                    <div className="hidden md:flex items-center gap-2 text-sm">
                        <span className={FILE_ICONS[getFileExtension(openSourceFile.name)]?.color || 'text-gray-400'}>
                            {FILE_ICONS[getFileExtension(openSourceFile.name)]?.icon || '📄'}
                        </span>
                        <span className={`${hasUnsavedChanges ? 'text-orange-400' : 'text-gray-300'}`}>
                            {openSourceFile.path}
                            {hasUnsavedChanges && ' •'}
                        </span>
                        {lastSaved && (
                            <span className="text-gray-500 text-xs">
                                Saved: {lastSaved.toLocaleTimeString('id-ID')}
                            </span>
                        )}
                    </div>
                ) : selectedComponent && (
                    <div className="hidden md:flex items-center gap-2 text-sm">
                        <FileCode className="w-4 h-4 text-orange-400" />
                        <span className={`${hasUnsavedChanges ? 'text-orange-400' : 'text-gray-300'}`}>
                            {selectedComponent}.css
                            {hasUnsavedChanges && ' •'}
                        </span>
                        {lastSaved && (
                            <span className="text-gray-500 text-xs">
                                Saved: {lastSaved.toLocaleTimeString('id-ID')}
                            </span>
                        )}
                    </div>
                )}
                
                {/* Right */}
                <div className="flex items-center gap-1">
                    <button onClick={exportCSS} className="p-2 rounded text-gray-400 hover:bg-gray-700 transition-colors" title="Export CSS">
                        <Download className="w-4 h-4" />
                    </button>
                    <button onClick={importCSS} className="p-2 rounded text-gray-400 hover:bg-gray-700 transition-colors" title="Import CSS">
                        <Upload className="w-4 h-4" />
                    </button>
                    
                    <div className="w-px h-6 bg-gray-600 mx-1" />
                    
                    <button 
                        onClick={() => setChatOpen(!chatOpen)} 
                        className={`p-2 rounded flex items-center gap-1.5 transition-colors ${
                            chatOpen ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'
                        }`}
                        title="AI Assistant"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span className="hidden sm:inline text-sm">AI</span>
                    </button>
                    
                    <button onClick={loadDesigns} className="p-2 rounded text-gray-400 hover:bg-gray-700 transition-colors" title="Refresh">
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* ═══════════ MAIN CONTENT ═══════════ */}
            <div className="flex-1 flex overflow-hidden">
                {/* ═══════════ SIDEBAR ═══════════ */}
                <AnimatePresence>
                    {sidebarOpen && (
                        <motion.aside
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 260, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex-shrink-0 flex flex-col bg-gray-850 border-r border-gray-700 overflow-hidden"
                            style={{ backgroundColor: '#1f2937' }}
                        >
                            {/* Search */}
                            <div className="p-2 border-b border-gray-700">
                                <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg">
                                    <Search className="w-4 h-4 text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="flex-1 bg-transparent outline-none text-sm text-white placeholder-gray-500"
                                    />
                                    {searchQuery && (
                                        <button onClick={() => setSearchQuery('')} className="text-gray-500 hover:text-white">
                                            <X className="w-3 h-3" />
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
                                        {/* Active Overrides */}
                                        <div className="border-b border-gray-700">
                                            <button
                                                onClick={() => toggleCategory('active')}
                                                className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-gray-700/50 text-left"
                                            >
                                                {expandedCategories.includes('active') ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                                                <FolderOpen className="w-4 h-4 text-yellow-500" />
                                                <span className="text-white font-medium">Active Overrides</span>
                                                <span className="ml-auto text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">{designs.length}</span>
                                            </button>
                                            
                                            {expandedCategories.includes('active') && (
                                                <div className="pb-2">
                                                    {designs.length === 0 ? (
                                                        <div className="px-6 py-2 text-gray-500 text-xs">No overrides. Select a component below.</div>
                                                    ) : (
                                                        designs.filter(d => filterBySearch(d.page_key)).map(design => {
                                                            const name = design.page_key.replace('design_override_', '');
                                                            const isSelected = selectedComponent === name;
                                                            return (
                                                                <div
                                                                    key={design.page_key}
                                                                    className={`group px-3 py-1.5 flex items-center gap-2 cursor-pointer mx-2 rounded ${
                                                                        isSelected ? 'bg-blue-600/30 text-blue-300' : 'hover:bg-gray-700/50 text-gray-300'
                                                                    }`}
                                                                    onClick={() => openDesign(design.page_key)}
                                                                >
                                                                    <FileCode className="w-4 h-4 text-purple-400" />
                                                                    <span className="flex-1 truncate">{name}</span>
                                                                    <button
                                                                        onClick={e => { e.stopPropagation(); deleteDesign(design.page_key); }}
                                                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-600 rounded transition-opacity"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Templates */}
                                        <div className="border-b border-gray-700">
                                            <button
                                                onClick={() => toggleCategory('templates')}
                                                className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-gray-700/50 text-left"
                                            >
                                                {expandedCategories.includes('templates') ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                                                <Palette className="w-4 h-4 text-pink-500" />
                                                <span className="text-white font-medium">Style Templates</span>
                                            </button>
                                            
                                            {expandedCategories.includes('templates') && (
                                                <div className="px-3 pb-3 grid grid-cols-2 gap-1.5">
                                                    {Object.entries(CSS_TEMPLATES).map(([key, tmpl]) => (
                                                        <button
                                                            key={key}
                                                            onClick={() => applyTemplate(key)}
                                                            className="px-2 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 rounded flex items-center gap-1.5 text-gray-300 transition-colors"
                                                            title={`Apply ${tmpl.name}`}
                                                        >
                                                            <span>{tmpl.icon}</span>
                                                            <span className="truncate">{tmpl.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* All Components */}
                                        {Object.entries(allComponents).map(([category, components]) => (
                                            <div key={category} className="border-b border-gray-700/50">
                                                <button
                                                    onClick={() => toggleCategory(category)}
                                                    className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-700/50 text-left"
                                                >
                                                    {expandedCategories.includes(category) ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                                                    <Folder className="w-4 h-4 text-blue-400" />
                                                    <span className="text-gray-300 capitalize">{category}</span>
                                                    <span className="ml-auto text-xs text-gray-500">{components.length}</span>
                                                </button>
                                                
                                                {expandedCategories.includes(category) && (
                                                    <div className="pb-2">
                                                        {components.filter(c => filterBySearch(c.displayName) || filterBySearch(c.key)).map(comp => {
                                                            const hasOverride = designs.some(d => d.page_key === `design_override_${comp.key}`);
                                                            const isSelected = selectedComponent === comp.key;
                                                            
                                                            return (
                                                                <div
                                                                    key={comp.key}
                                                                    className={`px-3 py-1.5 flex items-center gap-2 cursor-pointer mx-2 rounded transition-colors ${
                                                                        isSelected 
                                                                            ? 'bg-blue-600/30 text-blue-300' 
                                                                            : 'hover:bg-gray-700/50 text-gray-400'
                                                                    }`}
                                                                    onClick={() => hasOverride ? openDesign(`design_override_${comp.key}`) : createNewDesign(comp.key)}
                                                                >
                                                                    <File className={`w-4 h-4 ${hasOverride ? 'text-green-400' : 'text-gray-600'}`} />
                                                                    <span className="flex-1 truncate text-sm">{comp.displayName}</span>
                                                                    {hasOverride && <Check className="w-3 h-3 text-green-400" />}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        
                                        {/* ═══════ SOURCE FILES (REAL FILES) ═══════ */}
                                        <div className="border-t-2 border-purple-500/50 mt-2 pt-2">
                                            <div className="px-3 py-1.5 flex items-center gap-2 text-xs text-purple-400 font-medium uppercase tracking-wider">
                                                <FileCode className="w-3 h-3" />
                                                Source Files (Real Code)
                                            </div>
                                            
                                            {/* Components Folder */}
                                            {fileTree && (
                                                <>
                                                    <div className="border-b border-gray-700/50">
                                                        <button
                                                            onClick={() => toggleFolder('components')}
                                                            className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-700/50 text-left"
                                                        >
                                                            {expandedFolders.includes('components') ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                                                            <FolderOpen className="w-4 h-4 text-blue-400" />
                                                            <span className="text-blue-300 font-medium">components/</span>
                                                            <span className="ml-auto text-xs text-gray-500">{fileTree.components?.length || 0}</span>
                                                        </button>
                                                        
                                                        {expandedFolders.includes('components') && fileTree.components && (
                                                            <div className="pb-2">
                                                                {fileTree.components.filter(f => filterBySearch(f.name)).slice(0, 30).map(file => {
                                                                    const ext = getFileExtension(file.name);
                                                                    const iconInfo = FILE_ICONS[ext] || { icon: '📄', color: 'text-gray-400' };
                                                                    const isOpen = openSourceFile?.path === file.path;
                                                                    
                                                                    return (
                                                                        <div
                                                                            key={file.path}
                                                                            className={`px-3 py-1 flex items-center gap-2 cursor-pointer mx-2 rounded transition-colors text-xs ${
                                                                                isOpen ? 'bg-purple-600/30 text-purple-300' : 'hover:bg-gray-700/50 text-gray-400'
                                                                            }`}
                                                                            onClick={() => openFile(file.path)}
                                                                            title={file.path}
                                                                        >
                                                                            <span className={iconInfo.color}>{iconInfo.icon}</span>
                                                                            <span className="flex-1 truncate">{file.name}</span>
                                                                            <span className="text-[10px] text-gray-600 uppercase">.{ext}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Pages Folder */}
                                                    <div className="border-b border-gray-700/50">
                                                        <button
                                                            onClick={() => toggleFolder('pages')}
                                                            className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-700/50 text-left"
                                                        >
                                                            {expandedFolders.includes('pages') ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                                                            <FolderOpen className="w-4 h-4 text-green-400" />
                                                            <span className="text-green-300 font-medium">app/ (pages)</span>
                                                            <span className="ml-auto text-xs text-gray-500">{fileTree.pages?.length || 0}</span>
                                                        </button>
                                                        
                                                        {expandedFolders.includes('pages') && fileTree.pages && (
                                                            <div className="pb-2">
                                                                {fileTree.pages.filter(f => filterBySearch(f.name) || filterBySearch(f.path)).slice(0, 20).map(file => {
                                                                    const ext = getFileExtension(file.name);
                                                                    const iconInfo = FILE_ICONS[ext] || { icon: '📄', color: 'text-gray-400' };
                                                                    const isOpen = openSourceFile?.path === file.path;
                                                                    const displayPath = file.path.replace('app/', '').replace('/page.tsx', '');
                                                                    
                                                                    return (
                                                                        <div
                                                                            key={file.path}
                                                                            className={`px-3 py-1 flex items-center gap-2 cursor-pointer mx-2 rounded transition-colors text-xs ${
                                                                                isOpen ? 'bg-purple-600/30 text-purple-300' : 'hover:bg-gray-700/50 text-gray-400'
                                                                            }`}
                                                                            onClick={() => openFile(file.path)}
                                                                            title={file.path}
                                                                        >
                                                                            <span className={iconInfo.color}>{iconInfo.icon}</span>
                                                                            <span className="flex-1 truncate">{displayPath || 'home'}/</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Styles Folder */}
                                                    <div className="border-b border-gray-700/50">
                                                        <button
                                                            onClick={() => toggleFolder('styles')}
                                                            className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-700/50 text-left"
                                                        >
                                                            {expandedFolders.includes('styles') ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                                                            <Palette className="w-4 h-4 text-purple-400" />
                                                            <span className="text-purple-300 font-medium">styles/</span>
                                                            <span className="ml-auto text-xs text-gray-500">{fileTree.styles?.length || 0}</span>
                                                        </button>
                                                        
                                                        {expandedFolders.includes('styles') && fileTree.styles && (
                                                            <div className="pb-2">
                                                                {fileTree.styles.filter(f => filterBySearch(f.name)).map(file => {
                                                                    const ext = getFileExtension(file.name);
                                                                    const iconInfo = FILE_ICONS[ext] || { icon: '🎨', color: 'text-purple-400' };
                                                                    const isOpen = openSourceFile?.path === file.path;
                                                                    
                                                                    return (
                                                                        <div
                                                                            key={file.path}
                                                                            className={`px-3 py-1 flex items-center gap-2 cursor-pointer mx-2 rounded transition-colors text-xs ${
                                                                                isOpen ? 'bg-purple-600/30 text-purple-300' : 'hover:bg-gray-700/50 text-gray-400'
                                                                            }`}
                                                                            onClick={() => openFile(file.path)}
                                                                            title={file.path}
                                                                        >
                                                                            <span className={iconInfo.color}>{iconInfo.icon}</span>
                                                                            <span className="flex-1 truncate">{file.name}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Config Folder */}
                                                    <div className="border-b border-gray-700/50">
                                                        <button
                                                            onClick={() => toggleFolder('config')}
                                                            className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-700/50 text-left"
                                                        >
                                                            {expandedFolders.includes('config') ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                                                            <Settings className="w-4 h-4 text-orange-400" />
                                                            <span className="text-orange-300 font-medium">config/</span>
                                                            <span className="ml-auto text-xs text-gray-500">{fileTree.config?.length || 0}</span>
                                                        </button>
                                                        
                                                        {expandedFolders.includes('config') && fileTree.config && (
                                                            <div className="pb-2">
                                                                {fileTree.config.filter(f => filterBySearch(f.name)).slice(0, 15).map(file => {
                                                                    const ext = getFileExtension(file.name);
                                                                    const iconInfo = FILE_ICONS[ext] || { icon: '⚙️', color: 'text-orange-400' };
                                                                    const isOpen = openSourceFile?.path === file.path;
                                                                    
                                                                    return (
                                                                        <div
                                                                            key={file.path}
                                                                            className={`px-3 py-1 flex items-center gap-2 cursor-pointer mx-2 rounded transition-colors text-xs ${
                                                                                isOpen ? 'bg-purple-600/30 text-purple-300' : 'hover:bg-gray-700/50 text-gray-400'
                                                                            }`}
                                                                            onClick={() => openFile(file.path)}
                                                                            title={file.path}
                                                                        >
                                                                            <span className={iconInfo.color}>{iconInfo.icon}</span>
                                                                            <span className="flex-1 truncate">{file.name}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                            
                                            {!fileTree && (
                                                <div className="px-4 py-3 text-gray-500 text-xs text-center">
                                                    <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                                                    Loading files...
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* ═══════════ EDITOR & PREVIEW ═══════════ */}
                <main className="flex-1 flex overflow-hidden">
                    {/* Code Editor - Supports both CSS Override and Source Files */}
                    {(viewMode === 'split' || viewMode === 'code') && (
                        <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} flex flex-col border-r border-gray-700`}>
                            {/* Tab Bar - Show open files */}
                            <div className="h-9 flex items-center bg-gray-800 border-b border-gray-700 overflow-x-auto">
                                {/* CSS Override Tab */}
                                {selectedComponent && (
                                    <div 
                                        className={`h-full flex items-center gap-2 px-4 cursor-pointer transition-colors ${
                                            editorMode === 'css' 
                                                ? 'bg-gray-900 border-t-2 border-blue-500 text-white' 
                                                : 'hover:bg-gray-700/50 text-gray-400 border-t-2 border-transparent'
                                        }`}
                                        onClick={() => setEditorMode('css')}
                                    >
                                        <span className="text-purple-400">🎨</span>
                                        <span className="text-sm">{selectedComponent}.css</span>
                                        {editorMode === 'css' && hasUnsavedChanges && <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />}
                                    </div>
                                )}
                                
                                {/* Source File Tab */}
                                {openSourceFile && (
                                    <div 
                                        className={`h-full flex items-center gap-2 px-4 cursor-pointer transition-colors ${
                                            editorMode === 'source' 
                                                ? 'bg-gray-900 border-t-2 border-purple-500 text-white' 
                                                : 'hover:bg-gray-700/50 text-gray-400 border-t-2 border-transparent'
                                        }`}
                                        onClick={() => setEditorMode('source')}
                                    >
                                        <span className={FILE_ICONS[getFileExtension(openSourceFile.name)]?.color || 'text-gray-400'}>
                                            {FILE_ICONS[getFileExtension(openSourceFile.name)]?.icon || '📄'}
                                        </span>
                                        <span className="text-sm">{openSourceFile.name}</span>
                                        {editorMode === 'source' && hasUnsavedChanges && <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />}
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setOpenSourceFile(null); setSourceCode(''); setEditorMode('css'); }}
                                            className="ml-1 hover:bg-gray-600 rounded p-0.5"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                                
                                {/* Loading indicator */}
                                {isLoadingFile && (
                                    <div className="h-full flex items-center gap-2 px-4 text-gray-400">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-sm">Loading...</span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex-1 relative overflow-hidden bg-gray-900">
                                {/* CSS Editor Mode */}
                                {editorMode === 'css' && selectedComponent ? (
                                    <div className="absolute inset-0 flex font-mono text-sm">
                                        <div className="w-12 flex-shrink-0 text-right pr-3 pt-3 select-none bg-gray-900 text-gray-600 border-r border-gray-800">
                                            {code.split('\n').map((_, i) => (
                                                <div key={i} className="h-6 leading-6">{i + 1}</div>
                                            ))}
                                        </div>
                                        
                                        <textarea
                                            ref={editorRef}
                                            value={code}
                                            onChange={e => handleCodeChange(e.target.value)}
                                            className="flex-1 p-3 resize-none outline-none leading-6 bg-gray-900 text-gray-100 caret-white"
                                            spellCheck={false}
                                            style={{ tabSize: 2 }}
                                            placeholder="/* Write CSS here... */"
                                        />
                                    </div>
                                ) : editorMode === 'source' && openSourceFile ? (
                                    /* Source File Editor Mode */
                                    <div className="absolute inset-0 flex font-mono text-sm">
                                        <div className="w-12 flex-shrink-0 text-right pr-3 pt-3 select-none bg-gray-900 text-gray-600 border-r border-gray-800 overflow-hidden">
                                            {sourceCode.split('\n').map((_, i) => (
                                                <div key={i} className="h-6 leading-6">{i + 1}</div>
                                            ))}
                                        </div>
                                        
                                        <textarea
                                            value={sourceCode}
                                            onChange={e => setSourceCode(e.target.value)}
                                            className="flex-1 p-3 resize-none outline-none leading-6 bg-gray-900 text-gray-100 caret-white overflow-auto"
                                            spellCheck={false}
                                            style={{ tabSize: 2 }}
                                            placeholder="// Source code..."
                                        />
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-500">
                                        <div className="text-center">
                                            <Code className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                            <p className="text-lg">No file open</p>
                                            <p className="text-sm mt-2">Pilih file dari sidebar</p>
                                            <div className="mt-4 space-y-2 text-xs text-gray-600">
                                                <div>
                                                    <span className="text-purple-400">🎨 CSS</span> - Override styles
                                                </div>
                                                <div>
                                                    <span className="text-blue-400">⚛️ TSX</span> - React components
                                                </div>
                                                <div>
                                                    <span className="text-blue-500">📘 TS</span> - TypeScript
                                                </div>
                                            </div>
                                            <div className="mt-4 text-xs text-gray-600">
                                                <kbd className="px-2 py-1 bg-gray-800 rounded">Ctrl+S</kbd> Save
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Status Bar */}
                            <div className={`h-6 flex items-center justify-between px-3 text-white text-xs ${
                                editorMode === 'source' ? 'bg-purple-600' : 'bg-blue-600'
                            }`}>
                                <div className="flex items-center gap-4">
                                    {editorMode === 'css' && selectedComponent && <span>CSS Override</span>}
                                    {editorMode === 'source' && openSourceFile && (
                                        <>
                                            <span className="uppercase">{openSourceFile.language}</span>
                                            <span className="text-gray-300">{openSourceFile.path}</span>
                                        </>
                                    )}
                                    {!selectedComponent && !openSourceFile && <span>Ready</span>}
                                    {history.length > 1 && editorMode === 'css' && <span>History: {historyIndex + 1}/{history.length}</span>}
                                </div>
                                <div className="flex items-center gap-4">
                                    {hasUnsavedChanges && <span className="text-orange-300">● Unsaved</span>}
                                    {editorMode === 'source' && openSourceFile && (
                                        <button 
                                            onClick={saveSourceFile}
                                            disabled={!hasUnsavedChanges || isSaving}
                                            className={`px-2 py-0.5 rounded text-xs transition-colors ${
                                                hasUnsavedChanges ? 'bg-white/20 hover:bg-white/30' : 'opacity-50 cursor-not-allowed'
                                            }`}
                                        >
                                            {isSaving ? 'Saving...' : 'Save File'}
                                        </button>
                                    )}
                                    <span>UTF-8</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Preview */}
                    {(viewMode === 'split' || viewMode === 'preview') && (
                        <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} flex flex-col`}>
                            <PreviewPane />
                        </div>
                    )}
                </main>

                {/* ═══════════ AI CHAT PANEL - PREMIUM DESIGN ═══════════ */}
                <AnimatePresence>
                    {chatOpen && (
                        <motion.aside
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 380, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                            className="flex-shrink-0 flex flex-col overflow-hidden"
                            style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)' }}
                        >
                            {/* Header - Premium Glassmorphism */}
                            <div className="relative px-5 py-4 border-b border-white/10">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/10 to-transparent" />
                                <div className="relative flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center shadow-lg shadow-purple-500/30">
                                                <Sparkles className="w-5 h-5 text-white" />
                                            </div>
                                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900 animate-pulse" />
                                        </div>
                                        <div>
                                            <div className="text-base font-semibold text-white tracking-tight">Design AI</div>
                                            <div className="text-xs text-emerald-400/80 font-medium">Ready to help</div>
                                        </div>
                                    </div>
                                    <button onClick={() => setChatOpen(false)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Quick Actions - Floating Pills */}
                            {selectedComponent && (
                                <div className="px-4 py-3 border-b border-white/5">
                                    <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-medium">Quick Styles</div>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { label: '💎 Glass', query: 'glassmorphism' },
                                            { label: '🌙 Dark', query: 'dark mode' },
                                            { label: '✨ Hover', query: 'hover effect' },
                                            { label: '⚡ Neon', query: 'neon glow' },
                                            { label: '🌈 Gradient', query: 'gradient' },
                                            { label: '📱 Mobile', query: 'responsive mobile' }
                                        ].map(action => (
                                            <button
                                                key={action.query}
                                                onClick={() => { setChatInput(`Buat ${action.query} untuk ${selectedComponent}`); }}
                                                className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/15 text-gray-200 rounded-full border border-white/10 hover:border-white/20 transition-all duration-200 hover:scale-105"
                                            >
                                                {action.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* Messages - Modern Chat Bubbles */}
                            <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(139, 92, 246, 0.03) 100%)' }}>
                                {chatMessages.map(msg => (
                                    <motion.div 
                                        key={msg.id} 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {msg.role !== 'user' && (
                                            <div className="flex-shrink-0 mr-2.5">
                                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                                    <Bot className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                        )}
                                        <div className={`max-w-[82%] ${
                                            msg.role === 'user' 
                                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-lg shadow-blue-600/20' 
                                                : msg.role === 'system'
                                                    ? 'bg-white/5 text-gray-200 rounded-2xl rounded-bl-md px-4 py-3 border border-white/10 backdrop-blur'
                                                    : 'bg-white/5 text-gray-100 rounded-2xl rounded-bl-md px-4 py-3 border border-white/10 backdrop-blur'
                                        }`}>
                                            <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                                            {/* Show target component if detected */}
                                            {msg.targetComponent && (
                                                <div className="mt-2 flex items-center gap-2 text-xs text-purple-300">
                                                    <Box className="w-3 h-3" />
                                                    <span>Target: <strong>{DESIGN_REGISTRY[msg.targetComponent]?.displayName || msg.targetComponent}</strong></span>
                                                </div>
                                            )}
                                            {msg.cssCode && (
                                                <div className="mt-3 flex gap-2">
                                                    <button 
                                                        onClick={() => applyCSSFromChat(msg.cssCode!, msg.targetComponent)}
                                                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:scale-[1.02]"
                                                    >
                                                        <Play className="w-3.5 h-3.5" /> Apply to {msg.targetComponent ? DESIGN_REGISTRY[msg.targetComponent]?.displayName || msg.targetComponent : 'Website'}
                                                    </button>
                                                    <button 
                                                        onClick={() => { navigator.clipboard.writeText(msg.cssCode!); notify('info', 'CSS copied!'); }}
                                                        className="px-3 py-2.5 bg-white/10 hover:bg-white/20 text-gray-200 rounded-xl text-xs transition-all duration-200 border border-white/10"
                                                        title="Copy CSS"
                                                    >
                                                        <Copy className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                            {/* Show code blocks for other languages */}
                                            {msg.codeBlocks && msg.codeBlocks.filter(b => b.language !== 'css').length > 0 && (
                                                <div className="mt-3 space-y-2">
                                                    {msg.codeBlocks.filter(b => b.language !== 'css').map((block, i) => (
                                                        <div key={i} className="bg-black/30 rounded-lg p-2 border border-white/10">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-xs text-gray-400 uppercase">{block.language}</span>
                                                                <button 
                                                                    onClick={() => { navigator.clipboard.writeText(block.code); notify('info', `${block.language} copied!`); }}
                                                                    className="text-xs text-gray-400 hover:text-white"
                                                                >
                                                                    <Copy className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                            <pre className="text-xs text-gray-300 overflow-x-auto max-h-32">{block.code.slice(0, 200)}{block.code.length > 200 ? '...' : ''}</pre>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {msg.role === 'user' && (
                                            <div className="flex-shrink-0 ml-2.5">
                                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                                    <User className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                                
                                {isAILoading && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex justify-start"
                                    >
                                        <div className="flex-shrink-0 mr-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                                <Bot className="w-4 h-4 text-white" />
                                            </div>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 backdrop-blur px-5 py-4 rounded-2xl rounded-bl-md">
                                            <div className="flex items-center gap-3">
                                                <div className="flex gap-1.5">
                                                    <span className="w-2.5 h-2.5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                    <span className="w-2.5 h-2.5 bg-gradient-to-r from-pink-400 to-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                    <span className="w-2.5 h-2.5 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                </div>
                                                <span className="text-xs text-gray-400">Generating CSS...</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                            
                            {/* Input - Premium Floating Design */}
                            <div className="p-4 border-t border-white/10" style={{ background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.05) 0%, rgba(15, 23, 42, 1) 100%)' }}>
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl opacity-0 group-focus-within:opacity-100 blur transition-all duration-300" />
                                    <div className="relative flex items-center bg-slate-800/80 backdrop-blur border border-white/10 rounded-xl overflow-hidden">
                                        <input
                                            type="text"
                                            value={chatInput}
                                            onChange={e => setChatInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
                                            placeholder={selectedComponent ? `Tanya tentang ${DESIGN_REGISTRY[selectedComponent]?.displayName || selectedComponent}...` : 'Ketik apa saja: "glassmorphism untuk navbar", "dark mode card", dll...'}
                                            className="flex-1 bg-transparent px-4 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none transition-all"
                                        />
                                        <button 
                                            onClick={sendChatMessage}
                                            disabled={!chatInput.trim() || isAILoading}
                                            className="m-1.5 p-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-lg shadow-purple-500/25"
                                        >
                                            {isAILoading ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Send className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                {selectedComponent && (
                                    <p className="mt-3 text-xs text-emerald-400/80 text-center flex items-center justify-center gap-1.5">
                                        <Check className="w-3 h-3" />
                                        Target: {DESIGN_REGISTRY[selectedComponent]?.displayName || selectedComponent}
                                    </p>
                                )}
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>
            </div>

            {/* ═══════════ NOTIFICATION ═══════════ */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 ${
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
