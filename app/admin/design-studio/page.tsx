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
    ArrowRight, Command, Cpu, Terminal
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
    actionType?: 'css' | 'component' | 'style' | 'info' | 'action' | 'file-edit' | 'error' | 'terminal';
    targetComponent?: string;
    targetFile?: string; // File path to apply changes
    codeBlocks?: { language: string; code: string; filename?: string }[];
    fileChanges?: { path: string; language: string; code: string; action: 'create' | 'update' | 'append' }[];
    terminalCommands?: string[]; // Terminal commands to run (npm install, etc)
}

interface SourceFile {
    path: string;
    name: string;
    content: string;
    language: string;
    size: number;
    modified: string;
    isFolder?: boolean;
    children?: SourceFile[];
    expanded?: boolean;
}

interface FileTree {
    components: SourceFile[];
    pages: SourceFile[];
    styles: SourceFile[];
    config: SourceFile[];
    api: SourceFile[];
    lib: SourceFile[];
    hooks: SourceFile[];
    contexts: SourceFile[];
    types: SourceFile[];
    data: SourceFile[];
    public: SourceFile[];
}

// File icon mapping by extension
const FILE_ICONS: Record<string, { icon: string; color: string }> = {
    tsx: { icon: '⚛️', color: 'text-blue-400' },
    ts: { icon: '📘', color: 'text-blue-500' },
    css: { icon: '🎨', color: 'text-purple-400' },
    js: { icon: '📒', color: 'text-yellow-400' },
    jsx: { icon: '⚛️', color: 'text-cyan-400' },
    json: { icon: '📋', color: 'text-orange-400' },
    md: { icon: '📝', color: 'text-gray-400' },
    svg: { icon: '🖼️', color: 'text-pink-400' },
    png: { icon: '🖼️', color: 'text-green-400' },
    jpg: { icon: '🖼️', color: 'text-green-400' },
    ico: { icon: '🎯', color: 'text-yellow-400' },
    mjs: { icon: '📒', color: 'text-yellow-500' },
    cjs: { icon: '📒', color: 'text-yellow-600' },
    html: { icon: '🌐', color: 'text-orange-500' },
    sql: { icon: '🗄️', color: 'text-blue-300' },
    sh: { icon: '⚡', color: 'text-green-500' },
    ps1: { icon: '⚡', color: 'text-blue-400' }
};

// Folder icon mapping
const FOLDER_ICONS: Record<string, { icon: string; color: string; openColor: string }> = {
    components: { icon: '📦', color: 'text-blue-400', openColor: 'text-blue-300' },
    pages: { icon: '📄', color: 'text-green-400', openColor: 'text-green-300' },
    app: { icon: '📱', color: 'text-green-400', openColor: 'text-green-300' },
    lib: { icon: '📚', color: 'text-teal-400', openColor: 'text-teal-300' },
    hooks: { icon: '🪝', color: 'text-pink-400', openColor: 'text-pink-300' },
    contexts: { icon: '🎯', color: 'text-indigo-400', openColor: 'text-indigo-300' },
    types: { icon: '📐', color: 'text-cyan-400', openColor: 'text-cyan-300' },
    api: { icon: '🔌', color: 'text-orange-400', openColor: 'text-orange-300' },
    styles: { icon: '🎨', color: 'text-purple-400', openColor: 'text-purple-300' },
    config: { icon: '⚙️', color: 'text-gray-400', openColor: 'text-gray-300' },
    public: { icon: '🌐', color: 'text-yellow-400', openColor: 'text-yellow-300' },
    data: { icon: '💾', color: 'text-emerald-400', openColor: 'text-emerald-300' },
    ui: { icon: '🎛️', color: 'text-violet-400', openColor: 'text-violet-300' },
    cards: { icon: '🃏', color: 'text-amber-400', openColor: 'text-amber-300' },
    admin: { icon: '👑', color: 'text-red-400', openColor: 'text-red-300' },
    default: { icon: '📁', color: 'text-gray-400', openColor: 'text-gray-300' }
};

// FileTreeNode Component - Recursive like VS Code
interface FileTreeNodeProps {
    file: SourceFile;
    depth: number;
    openFile: (path: string) => void;
    openSourceFile: SourceFile | null;
    expandedPaths: string[];
    togglePath: (path: string) => void;
}

const FileTreeNode = ({ file, depth, openFile, openSourceFile, expandedPaths, togglePath }: FileTreeNodeProps) => {
    const isExpanded = expandedPaths.includes(file.path);
    const isOpen = openSourceFile?.path === file.path;
    const ext = file.name.split('.').pop() || '';
    const folderInfo = FOLDER_ICONS[file.name] || FOLDER_ICONS.default;
    const fileInfo = FILE_ICONS[ext] || { icon: '📄', color: 'text-gray-400' };
    
    const paddingLeft = 8 + (depth * 12);
    
    if (file.isFolder) {
        return (
            <div>
                <div
                    className={`flex items-center gap-1.5 py-1 cursor-pointer hover:bg-gray-700/50 transition-colors`}
                    style={{ paddingLeft: `${paddingLeft}px` }}
                    onClick={() => togglePath(file.path)}
                >
                    {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${isExpanded ? folderInfo.openColor : folderInfo.color}`}>
                        {folderInfo.icon}
                    </span>
                    <span className={`text-xs font-medium ${isExpanded ? folderInfo.openColor : 'text-gray-300'}`}>
                        {file.name}
                    </span>
                    {file.children && (
                        <span className="text-[10px] text-gray-600 ml-auto mr-2">{file.children.length}</span>
                    )}
                </div>
                {isExpanded && file.children && (
                    <div>
                        {file.children.map((child) => (
                            <FileTreeNode
                                key={child.path}
                                file={child}
                                depth={depth + 1}
                                openFile={openFile}
                                openSourceFile={openSourceFile}
                                expandedPaths={expandedPaths}
                                togglePath={togglePath}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }
    
    return (
        <div
            className={`flex items-center gap-1.5 py-1 cursor-pointer transition-colors ${
                isOpen ? 'bg-purple-600/30 text-purple-200' : 'hover:bg-gray-700/50 text-gray-400'
            }`}
            style={{ paddingLeft: `${paddingLeft + 16}px` }}
            onClick={() => openFile(file.path)}
            title={file.path}
        >
            <span className={`text-sm ${fileInfo.color}`}>{fileInfo.icon}</span>
            <span className="text-xs truncate flex-1">{file.name}</span>
            {file.size && <span className="text-[9px] text-gray-600 mr-2">{(file.size / 1024).toFixed(1)}kb</span>}
        </div>
    );
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
    const [expandedPaths, setExpandedPaths] = useState<string[]>([]); // For tree node expansion
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
    
    // Toggle path in file tree (for recursive tree)
    const togglePath = (path: string) => {
        setExpandedPaths(prev => 
            prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
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
            // ═══════════════════════════════════════════════════════════════
            // 🧠 SMART AI ANALYSIS - Like GitHub Copilot
            // ═══════════════════════════════════════════════════════════════
            const queryLower = userQuery.toLowerCase();
            
            // ⚠️ CRITICAL: Check for CANCEL/UNDO/REVERT first
            const isCancelOrUndo = /kembalikan|batalkan|undo|revert|cancel|batal|reset|hapus.*perubahan|rollback/i.test(queryLower);
            
            // Check for casual/short messages that should NOT trigger actions
            const isCasualMessage = /^(hi|hello|halo|hey|hai|apa kabar|selamat|good|ok|oke|okey|thanks|terima kasih|makasih|thx|ya|yup|yap)$/i.test(userQuery.trim());
            
            // ⚠️ CRITICAL: Check for APPLY/TERAPKAN command - apply last AI changes
            const isApplyCommand = /^(terapkan|apply|lakukan|pasang|jalankan|execute)$/i.test(userQuery.trim()) || 
                                   /\b(terapkan|apply)\s*(sekarang|ini|changes?|perubahan)?\s*$/i.test(queryLower);
            
            // Handle APPLY command - apply file changes from last AI message
            if (isApplyCommand) {
                // Find the last AI message with fileChanges or cssCode
                const lastAIWithChanges = [...chatMessages].reverse().find(
                    msg => msg.role === 'assistant' && (msg.fileChanges?.length || msg.cssCode)
                );
                
                if (lastAIWithChanges) {
                    setIsAILoading(false);
                    
                    // Apply file changes if available
                    if (lastAIWithChanges.fileChanges && lastAIWithChanges.fileChanges.length > 0) {
                        try {
                            await applyFileChanges(lastAIWithChanges.fileChanges);
                            const fileList = lastAIWithChanges.fileChanges.map(f => `• \`${f.path}\` (${f.action})`).join('\n');
                            setChatMessages(prev => [...prev, {
                                id: Date.now().toString(),
                                role: 'system',
                                content: `✅ **Berhasil Diterapkan!**\n\n${fileList}\n\n🔄 Refresh halaman untuk melihat perubahan.`,
                                timestamp: new Date(),
                                actionType: 'action'
                            }]);
                        } catch (err) {
                            setChatMessages(prev => [...prev, {
                                id: Date.now().toString(),
                                role: 'system',
                                content: `❌ **Gagal menerapkan perubahan:** ${err instanceof Error ? err.message : 'Unknown error'}\n\nCoba klik tombol "Apply" pada kode di atas.`,
                                timestamp: new Date(),
                                actionType: 'error'
                            }]);
                        }
                        return;
                    }
                    
                    // Apply CSS if available
                    if (lastAIWithChanges.cssCode) {
                        const applyTarget = lastAIWithChanges.targetComponent || selectedComponent || 'global';
                        await applyCSSFromChat(lastAIWithChanges.cssCode, applyTarget);
                        setChatMessages(prev => [...prev, {
                            id: Date.now().toString(),
                            role: 'system',
                            content: `✅ **CSS Berhasil Diterapkan!**\n\nTarget: **${DESIGN_REGISTRY[applyTarget]?.displayName || applyTarget}**\n\n🔄 Refresh halaman untuk melihat perubahan.`,
                            timestamp: new Date(),
                            actionType: 'action'
                        }]);
                        return;
                    }
                } else {
                    // No previous changes to apply
                    setIsAILoading(false);
                    setChatMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        role: 'assistant',
                        content: `⚠️ **Tidak ada perubahan untuk diterapkan.**\n\nTidak ditemukan kode atau perubahan dari percakapan sebelumnya.\n\n💡 **Tips:**\n• Minta AI untuk membuat kode terlebih dahulu\n• Contoh: "Ubah header menjadi glassmorphism"\n• Lalu ketik "terapkan" untuk menerapkan kode tersebut`,
                        timestamp: new Date(),
                        actionType: 'info'
                    }]);
                    return;
                }
            }
            
            // Handle UNDO request immediately
            if (isCancelOrUndo) {
                setIsAILoading(false);
                setChatMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `🔄 **Pembatalan Perubahan**\n\n📋 **Cara Membatalkan:**\n• **CSS Override:** Klik tab "Settings" → "Reset CSS" atau hapus override yang tidak diinginkan\n• **File Changes:** Gunakan \`git checkout -- [filename]\` di terminal\n• **Semua Perubahan:** Gunakan \`git stash\` untuk menyimpan sementara\n\n⚠️ Perubahan yang sudah di-deploy ke production tidak bisa dibatalkan secara otomatis.\n\n❓ File mana yang ingin dikembalikan?`,
                    timestamp: new Date(),
                    actionType: 'info'
                }]);
                return;
            }
            
            // Handle casual messages - just respond normally without auto-apply
            if (isCasualMessage) {
                setIsAILoading(false);
                setChatMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `👋 **Halo!**\n\nSaya siap membantu dengan:\n• 🎨 Mendesain ulang komponen (button, card, header, dll)\n• 📝 Mengedit file source code\n• 🔍 Mencari lokasi file tertentu\n\n💡 Contoh permintaan:\n- "Ubah button menjadi glassmorphism"\n- "Edit navbar agar lebih modern"\n- "Di mana file untuk halaman about?"\n\nApa yang bisa saya bantu?`,
                    timestamp: new Date(),
                    actionType: 'info'
                }]);
                return;
            }
            
            // Intent Detection
            const isQuestion = /\?|dimana|where|bagaimana|how|apa itu|what is|letak|lokasi|file|jelaskan|explain|ada gak|ada tidak|cari|find/i.test(queryLower);
            const isAskingAboutFile = /file|ada gak|ada tidak|dimana|lokasi|letak|cari file/i.test(queryLower);
            const isRequestingCode = /buat(kan)?|tambah(kan)?|ubah|ganti|edit|update|create|modify/i.test(queryLower);
            const isRequestingStyle = /style|css|design|warna|color|glass|neon|gradient|animasi|hover/i.test(queryLower);
            const containsHTML = /<\w+[\s>]|class="|className=/i.test(userQuery);
            
            // ═══════════════════════════════════════════════════════════════
            // 🔍 SMART HTML DETECTION: Find source file for pasted HTML
            // ═══════════════════════════════════════════════════════════════
            // Only search if:
            // 1. User pasted HTML/JSX code
            // 2. User is requesting code changes (ubah, ganti, perbaiki, etc.)
            // 3. The content has MEANINGFUL text (not just styling)
            const hasMeaningfulText = /Sekbid|Anggota|Keagamaan|Kaderisasi|Akademik|Kominfo|Kesehatan|Ekonomi|Filter|Semua|Gallery|Galeri|People|Members/i.test(userQuery);
            
            if (containsHTML && (isRequestingCode || /ubah|ganti|perbaiki|fix|improve|redesign|update|bagus/i.test(queryLower)) && hasMeaningfulText) {
                // User pasted HTML and wants to modify it - let's find the source file
                try {
                    const searchRes = await fetch(`/api/design/files?action=search-content&content=${encodeURIComponent(userQuery.slice(0, 500))}`);
                    const searchData = await searchRes.json();
                    
                    if (searchData.success && searchData.results && searchData.results.length > 0) {
                        // Get the BEST match (highest score)
                        const foundFile = searchData.results[0];
                        const matchScore = foundFile.matchScore || 0;
                        
                        // Only proceed if match score is high enough (confident match)
                        if (matchScore >= 8) {
                            // Read the full file content
                            const fileRes = await fetch(`/api/design/files?action=read&file=${encodeURIComponent(foundFile.path)}`);
                            const fileData = await fileRes.json();
                            
                            if (fileData.success && fileData.file) {
                                // Add file context to chat
                                setChatMessages(prev => [...prev, {
                                    id: (Date.now() + 1).toString(),
                                    role: 'system',
                                    content: `🔍 **File Terdeteksi dengan Akurat!** (confidence: ${matchScore}/15)\n\n📍 Kode yang kamu tempelkan ditemukan di:\n📂 \`${foundFile.path}\` (baris ~${foundFile.lineNumber})\n\nSedang menganalisis untuk memberikan solusi...`,
                                    timestamp: new Date(),
                                    actionType: 'info'
                                }]);
                                
                                // Store file info for the AI context - use full file data
                                setOpenSourceFile(fileData.file);
                                setSourceCode(fileData.file.content);
                                setOriginalSourceCode(fileData.file.content);
                            }
                        } else if (matchScore >= 3 && searchData.results.length > 0) {
                            // Low confidence - show possible matches but ask user to confirm
                            const possibleFiles = searchData.results.slice(0, 3).map((r: { path: string; matchScore: number }) => 
                                `• \`${r.path}\` (score: ${r.matchScore})`
                            ).join('\n');
                            
                            setChatMessages(prev => [...prev, {
                                id: (Date.now() + 1).toString(),
                                role: 'system',
                                content: `🔎 **Kemungkinan Lokasi File:**\n\n${possibleFiles}\n\n⚠️ Confidence rendah. Mohon konfirmasi file mana yang ingin diubah, atau sebutkan nama file-nya.`,
                                timestamp: new Date(),
                                actionType: 'info'
                            }]);
                        }
                    }
                } catch (e) {
                    console.log('Search content failed:', e);
                }
            }
            
            // Extract file name if mentioned
            const fileMatch = userQuery.match(/([a-zA-Z0-9_\-]+\.(tsx?|jsx?|css|json))/i);
            const mentionedFile = fileMatch ? fileMatch[1] : null;
            
            // If user is asking about a specific file - READ IT FIRST
            if (isAskingAboutFile && mentionedFile) {
                // Try to find and read the file
                const possiblePaths = [
                    `app/${mentionedFile}`,
                    `app/bidang/${mentionedFile}`,
                    `app/admin/${mentionedFile}`,
                    `components/${mentionedFile}`,
                    `lib/${mentionedFile}`,
                    mentionedFile
                ];
                
                let foundFile = null;
                let fileContent = '';
                
                for (const filePath of possiblePaths) {
                    try {
                        const res = await fetch(`/api/design/files?action=read&file=${encodeURIComponent(filePath)}`);
                        const data = await res.json();
                        if (data.success && data.file) {
                            foundFile = data.file;
                            fileContent = data.file.content;
                            break;
                        }
                    } catch {}
                }
                
                if (foundFile) {
                    // File found - give detailed response
                    const preview = fileContent.slice(0, 1500);
                    const lineCount = fileContent.split('\n').length;
                    
                    setChatMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: `✅ **File Ditemukan!**\n\n📁 **Path:** \`${foundFile.path}\`\n📊 **Ukuran:** ${foundFile.size} bytes (${lineCount} baris)\n\n**Preview Kode:**\n\`\`\`${foundFile.language}\n${preview}${fileContent.length > 1500 ? '\n... (terpotong)' : ''}\n\`\`\`\n\n💡 Klik file di sidebar **Source Files** untuk membuka dan edit!`,
                        timestamp: new Date(),
                        actionType: 'info',
                        codeBlocks: [{ language: foundFile.language, code: fileContent, filename: foundFile.path }]
                    }]);
                    setIsAILoading(false);
                    return;
                } else {
                    // Search for file
                    try {
                        const searchRes = await fetch(`/api/design/files?action=search&q=${encodeURIComponent(mentionedFile)}`);
                        const searchData = await searchRes.json();
                        
                        if (searchData.results && searchData.results.length > 0) {
                            const fileList = searchData.results.slice(0, 5).map((f: any) => `• \`${f.path}\``).join('\n');
                            setChatMessages(prev => [...prev, {
                                id: (Date.now() + 1).toString(),
                                role: 'assistant',
                                content: `🔍 **File "${mentionedFile}" tidak ditemukan langsung, tapi saya menemukan file serupa:**\n\n${fileList}\n\n💡 Klik file di sidebar **Source Files** untuk membukanya!`,
                                timestamp: new Date(),
                                actionType: 'info'
                            }]);
                            setIsAILoading(false);
                            return;
                        }
                    } catch {}
                    
                    setChatMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: `❌ **File "${mentionedFile}" tidak ditemukan.**\n\n📂 Coba cek di sidebar **Source Files** atau gunakan search.\n\nFile yang mungkin maksud kamu:\n• \`app/bidang/page.tsx\` - Halaman Bidang/Sekbid\n• \`components/ProkerSection.tsx\` - Section Program Kerja\n• \`components/Navbar.tsx\` - Navigation Bar`,
                        timestamp: new Date(),
                        actionType: 'info'
                    }]);
                    setIsAILoading(false);
                    return;
                }
            }
            
            // Auto-detect component from query if not selected
            let targetComponent = selectedComponent;
            let componentInfo = selectedComponent ? DESIGN_REGISTRY[selectedComponent] : null;
            let selector = componentInfo?.selectors?.[0] || '';
            
            // ═══════════════════════════════════════════════════════════════
            // 🚫 SKIP PATTERN MATCHING WHEN USER PASTES HTML/CODE
            // ═══════════════════════════════════════════════════════════════
            // When user pastes HTML code, we should NOT auto-detect components
            // from the HTML tags. Instead, let AI analyze the actual intent.
            // This prevents hardcoded responses like "Header" when user pastes
            // code containing <header> tags but wants something else.
            const skipPatternMatching = containsHTML && userQuery.length > 150;
            
            // Try to detect component from user query (ONLY if not pasting code)
            if (!skipPatternMatching) {
                const detected = detectComponentFromQuery(userQuery);
                if (detected && !targetComponent) {
                    targetComponent = detected.component;
                    componentInfo = detected.info;
                    selector = detected.selector;
                    setSelectedComponent(detected.component);
                }
            }
            
            // If still no component, use general approach
            if (!targetComponent) {
                selector = '.target-component';
            } else {
                selector = componentInfo?.selectors?.[0] || `[data-component="${targetComponent}"]`;
            }
            
            // ═══════════════════════════════════════════════════════════════
            // 🚫 SMART CSS PATTERNS - COMPLETELY DISABLED
            // ═══════════════════════════════════════════════════════════════
            // Previously we used generateSmartCSS for quick CSS generation,
            // but it caused hardcoded responses that didn't understand context.
            // NOW: All requests go to AI for proper understanding.
            // ═══════════════════════════════════════════════════════════════
            // const styleKeywords = /glass|dark|neon.../i; // DISABLED
            // const isStyleRequest = styleKeywords.test(userQuery)... // DISABLED
            // if (isStyleRequest && explicitApply...) { generateSmartCSS... } // DISABLED
            // 
            // ALL requests now go directly to AI for proper context understanding!
            
            // Get current source file context if open
            const currentFileContext = openSourceFile ? `
═══════════════════════════════════════════════════════════════
📂 FILE YANG SEDANG DIBUKA (BISA LANGSUNG DIEDIT):
═══════════════════════════════════════════════════════════════
- Path: ${openSourceFile.path}
- Bahasa: ${openSourceFile.language}
- Ukuran: ${sourceCode.length} karakter, ${sourceCode.split('\n').length} baris

🚨🚨🚨 KODE ORIGINAL - WAJIB DIPERTAHANKAN STRUKTURNYA! 🚨🚨🚨
Ini adalah file ASLI. Jika user minta edit SATU bagian, JANGAN hapus bagian lain!
Baca SEMUA elemen yang ada di bawah ini, dan pastikan SEMUA tetap ada di respons kamu!

ISI FILE LENGKAP:
\`\`\`${openSourceFile.language}
${sourceCode}
\`\`\`

⚠️ CHECKLIST PARTIAL EDIT:
- [ ] Semua import statements tetap ada?
- [ ] Semua elemen UI tetap ada (button, icon, link, dll)?
- [ ] Semua function/logic tetap ada?
- [ ] Hanya bagian yang diminta user yang berubah?
` : '';

            // Extract user's actual request vs pasted code
            const pastedCodeMatch = userQuery.match(/<[^>]+>[\s\S]*<\/[^>]+>/);
            const userActualRequest = pastedCodeMatch 
                ? userQuery.replace(pastedCodeMatch[0], '[KODE YANG DI-PASTE USER - LIHAT DIBAWAH]').trim()
                : userQuery;
            
            // Build enhanced prompt for AI - REAL CODE EDITOR like GitHub Copilot
            const enhancedMessage = `
╔═══════════════════════════════════════════════════════════════════════════╗
║   🚀 WEBOSIS DESIGN STUDIO AI - GITHUB COPILOT LEVEL v5.0              ║
║        💎 ULTRA PROFESSIONAL MODE - PARTIAL EDIT MASTER 💎              ║
╚═══════════════════════════════════════════════════════════════════════════╝

🚨🚨🚨 ATURAN #1 PALING PENTING - BACA INI DULU! 🚨🚨🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⛔ DILARANG KERAS MEMBUAT KODE BARU DARI NOL! ⛔

Jika ada FILE YANG SEDANG DIBUKA di bawah, kamu WAJIB:
1. COPY PASTE SELURUH isi file tersebut sebagai basis
2. CARI line/bagian SPESIFIK yang perlu diubah
3. UBAH HANYA bagian itu, SISANYA TETAP 100% SAMA
4. JANGAN pernah menulis kode sendiri dari awal!

═══════════════════════════════════════════════════════════════════════════
📊 VALIDASI WAJIB SEBELUM RESPONSE
═══════════════════════════════════════════════════════════════════════════

Sebelum memberikan kode, HITUNG:
- File original: X baris
- File hasil edit: HARUS ~X baris (±5 baris tolerance)

Jika file original 342 baris, hasil edit TIDAK BOLEH jadi 20 baris!
Ini berarti kamu MENGHAPUS 320 baris kode → KESALAHAN FATAL!

CHECKLIST WAJIB:
□ Jumlah baris file hasil MIRIP dengan original?
□ Semua import statements dari original ADA?
□ Semua function dari original ADA?
□ Semua useEffect, useState, useRef dari original ADA?
□ Semua JSX elements dari original ADA?
□ HANYA bagian yang diminta yang BERBEDA?

═══════════════════════════════════════════════════════════════════════════
💡 CARA BENAR EDIT FILE (IKUTI LANGKAH INI!)
═══════════════════════════════════════════════════════════════════════════

LANGKAH 1: Lihat "FILE YANG SEDANG DIBUKA" di bawah
LANGKAH 2: Copy SELURUH isi file tersebut (SEMUA 300+ baris!)
LANGKAH 3: Cari bagian yang user minta ubah (contoh: email, warna, text)
LANGKAH 4: Ubah HANYA bagian itu (mungkin hanya 1-2 baris)
LANGKAH 5: Pastikan SEMUA kode lain TETAP PERSIS SAMA
LANGKAH 6: Berikan kode LENGKAP hasil edit (tetap 300+ baris!)

CONTOH YANG BENAR ✅:
- File original: 342 baris dengan 'use client', import, React.FC, hooks, JSX, export
- User minta: "ubah email jadi xxx@gmail.com"
- Hasil: 342 baris yang SAMA, hanya 1 line email berbeda
- TETAP ADA: 'use client', semua import, semua hooks, semua JSX, export default

CONTOH YANG SALAH ❌ (JANGAN LAKUKAN INI!):
- File original: 342 baris
- User minta: "ubah email"
- AI buat kode baru: 20 baris JSX saja → FATAL ERROR!
- HILANG: 'use client', import, React.FC, hooks, export default
- AKIBAT: Build error, website tidak bisa deploy!

═══════════════════════════════════════════════════════════════════════════
⚠️ CHECKLIST WAJIB UNTUK FILE TSX (REACT COMPONENT):
═══════════════════════════════════════════════════════════════════════════

Setiap file .tsx HARUS memiliki struktur ini:
□ 'use client'; di baris pertama (jika client component)
□ import statements (React, hooks, icons, dll)
□ const ComponentName: React.FC = () => { ... }
□ return ( <div>...</div> ); di dalam function
□ export default ComponentName; di baris terakhir

JIKA KODE KAMU TIDAK PUNYA STRUKTUR INI → KAMU SALAH!

═══════════════════════════════════════════════════════════════════════════
🔴 JIKA KAMU TIDAK BISA MELIHAT FILE ORIGINAL:
═══════════════════════════════════════════════════════════════════════════

Katakan: "Saya perlu melihat file original untuk melakukan edit yang benar.
Silakan buka file [nama file] di sidebar kiri, lalu tanyakan lagi."

JANGAN PERNAH membuat kode baru jika tidak ada file original!
JANGAN PERNAH memberikan kode yang hanya berisi JSX tanpa wrapper component!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧠 ATURAN UTAMA LAINNYA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ PAHAMI DULU, BARU JAWAB
   - Baca SELURUH pesan user dengan teliti
   - Identifikasi APA yang user MINTA/KELUHKAN SECARA SPESIFIK
   - JANGAN langsung fokus ke elemen HTML tertentu
   - Tanyakan klarifikasi jika tidak jelas

2️⃣ JIKA USER PASTE KODE HTML/JSX:
   - Kode yang di-paste adalah REFERENSI, bukan berarti ganti semua
   - Cari apa yang user TULIS di luar kode (keluhan/permintaan spesifik)
   - Contoh: User paste footer, minta "ubah email" → HANYA ubah email, sisanya TETAP
   - SELALU konfirmasi: "Jadi yang ingin diubah adalah [X], elemen lain tetap ya?"

3️⃣ BERIKAN DETAIL LENGKAP:
   - Jelaskan APA yang akan diubah (spesifik, bukan general)
   - Jelaskan MENGAPA perubahan ini membantu
   - Highlight bagian yang BERUBAH vs yang TETAP
   - Berikan kode LENGKAP dengan path file

4️⃣ QUALITY ASSURANCE SEBELUM RESPONSE:
   ✅ Cek: Apakah semua elemen original masih ada?
   ✅ Cek: Apakah hanya bagian yang diminta yang berubah?
   ✅ Cek: Apakah struktur kode tetap lengkap?
   ✅ Cek: Apakah import statements lengkap?
   ✅ Cek: Apakah tidak ada yang hilang tanpa alasan?

5️⃣ PENJELASAN SUPER LENGKAP (WAJIB!):
   Setiap respons HARUS mengandung:
   
   📍 **Lokasi File:** Path lengkap ke file yang akan diedit
   
   🎯 **Pemahaman Saya:** 
   Jelaskan dengan kata-kata sendiri apa yang user minta.
   Contoh: "Kamu ingin menambahkan animasi 3D pada ikon megaphone agar terlihat lebih modern dan menarik."
   
   ✏️ **Perubahan yang Dilakukan:**
   1. [Nama perubahan] - [Penjelasan detail MENGAPA ini membantu]
   2. [Nama perubahan] - [Penjelasan detail MENGAPA ini membantu]
   
   🔧 **Teknologi yang Digunakan:**
   - [Library/Framework yang dipakai dan MENGAPA]
   - [CSS/Styling approach dan MENGAPA]
   
   📝 **Kode Lengkap:** (dengan path file)
   
   💡 **Cara Kerja Kode:**
   Jelaskan step-by-step bagaimana kode bekerja:
   - Line X-Y: Melakukan [apa]
   - Line A-B: Mengatur [apa]
   
   🎨 **Preview Visual:**
   Deskripsikan bagaimana hasilnya akan terlihat
   
   ⚙️ **Cara Menggunakan:**
   Langkah-langkah untuk menggunakan komponen/kode ini
   
   ⚠️ **Catatan Penting:**
   - Dependencies yang perlu diinstall (jika ada)
   - Hal-hal yang perlu diperhatikan

═══════════════════════════════════════════════════════════════════════════
🎯 IDENTITAS KAMU:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Kamu adalah AI Design Studio Assistant PREMIUM dengan skill MAKSIMUM:
• 📊 ANALISA: Pahami konteks, identifikasi masalah, beri solusi tepat
• 💬 NGOBROL: Responsif, ramah, bisa bercanda, tidak kaku
• 📝 DETAILING: Jelaskan dengan SANGAT LENGKAP dan JELAS (lihat format di atas!)
• 🔧 FIXER: Perbaiki masalah dengan kode yang BENAR dan LENGKAP
• 🎓 LEARNER: Belajar dari konteks percakapan, ingat preferensi user

═══════════════════════════════════════════════════════════════════════════
💎 SKILL MAKSIMUM - FULL UNLOCK (SUPER PROFESSIONAL)
═══════════════════════════════════════════════════════════════════════════

🔥 LEVEL 1 - SOURCE CODE MASTERY:
• Baca, tulis, edit file: .tsx, .ts, .jsx, .js, .css, .json, .md
• Tailwind CSS dengan semua utility classes
• React/Next.js 14+ (App Router, Server Components, Client Components)
• TypeScript types, interfaces, generics
• Import/export modules, barrel exports
• Path aliases (@/components, @/lib, @/hooks)

🔥 LEVEL 2 - ADVANCED REACT & NEXT.JS:
• React Hooks: useState, useEffect, useRef, useCallback, useMemo, useContext
• Custom hooks creation dan best practices
• React Context API & state management
• Server Actions & API Routes
• Dynamic imports & code splitting
• ISR, SSG, SSR strategies

🔥 LEVEL 3 - DESIGN & STYLING PROFESIONAL:
• Glassmorphism: backdrop-blur, bg-opacity, border-opacity
• Neumorphism: box-shadow inset, soft shadows
• Gradients: linear, radial, conic gradients
• Responsive design: mobile-first, breakpoints (sm, md, lg, xl, 2xl)
• Dark/Light mode: dark: prefix, CSS variables
• Animations: Framer Motion, CSS keyframes, transitions
• Modern UI patterns: Cards, Modals, Dropdowns, Tabs

🔥 LEVEL 4 - FILE OPERATIONS DENGAN PRESISI:
• CREATE file baru dengan struktur yang benar
• UPDATE/EDIT: PARTIAL EDIT - hanya ubah yang diminta!
• ⚠️ WAJIB: Copy original → edit bagian spesifik → return full file
• JANGAN pernah buat kode baru jika diminta edit!

🔥 LEVEL 5 - ANALYSIS, DEBUG & OPTIMIZATION:
• Identifikasi bug dari error message
• Fix TypeScript errors
• Optimize performance (memo, lazy loading, image optimization)
• Code quality improvement
• Refactoring suggestions
• Best practices: DRY, SOLID, Clean Code

🔥 LEVEL 6 - KOMUNIKASI SEPERTI SENIOR DEVELOPER:
• Penjelasan yang SANGAT LENGKAP & profesional
• Tutorial step-by-step dengan context
• Contoh penggunaan real-world
• Tips & best practices
• Jawab pertanyaan follow-up dengan sabar
• Code review dengan saran improvement

🔥 LEVEL 7 - TERMINAL & DEPENDENCIES:
• Install packages: npm install, pnpm add, yarn add
• Common packages: framer-motion, react-icons, lucide-react, date-fns
• Run scripts: npm run build, npm run dev, npm run lint
• Git commands: git status, git add, git commit, git push
• Berikan perintah dalam code block \`\`\`bash

🔥 LEVEL 8 - DATABASE & API:
• Supabase queries: select, insert, update, delete
• API Routes: GET, POST, PUT, DELETE handlers
• Data fetching: fetch, useSWR patterns
• Error handling & loading states

🔥 LEVEL 9 - ARCHITECTURE & PATTERNS:
• Component composition
• HOC (Higher Order Components)
• Render props pattern
• Compound components
• Provider pattern
• Container/Presenter pattern

🔥 LEVEL 10 - TESTING & DEPLOYMENT:
• Unit testing dengan Jest/Vitest
• E2E testing dengan Playwright
• Vercel deployment
• Environment variables
• CI/CD pipelines

═══════════════════════════════════════════════════════════════════════════
📋 FORMAT KODE YANG WAJIB DIIKUTI
═══════════════════════════════════════════════════════════════════════════

⚠️ SANGAT PENTING: Gunakan format ini agar kode bisa langsung dieksekusi!

\`\`\`tsx:components/NamaKomponen.tsx
// Kode LENGKAP disini - SEMUA elemen original HARUS ada!
\`\`\`

\`\`\`ts:lib/utils.ts
export function myFunction() { ... }
\`\`\`

\`\`\`css:app/globals.css
.class-name { ... }
\`\`\`

\`\`\`bash
npm install framer-motion
\`\`\`

FORMAT: \`\`\`bahasa:path/ke/file.ext

Jika TIDAK ada path → user harus copy manual (hindari ini!)
Jika ADA path → sistem akan AUTO-APPLY dengan tombol Apply
Jika BASH → sistem akan tampilkan tombol RUN untuk eksekusi terminal

═══════════════════════════════════════════════════════════════════════════
🧠 CARA MENJAWAB YANG BENAR (IKUTI!)
═══════════════════════════════════════════════════════════════════════════

📌 JIKA USER BERTANYA (ada "?", "dimana", "ada gak"):
1. JAWAB langsung dengan informasi yang diminta
2. Berikan PATH FILE jika relevan
3. Jangan kasih kode kalau tidak diminta

📌 JIKA USER KASIH CONTOH HTML/JSX (PASTE KODE):
⚠️ SANGAT PENTING! Jika user paste kode HTML/JSX, BACA BAIK-BAIK:
1. JANGAN fokus pada tag/elemen tertentu saja (misal jangan fokus ke <header> saja)
2. BACA apa yang user MINTA/KELUHKAN (bukan tag HTML-nya)
3. Jika user bilang "button tidak sesuai" → fokus ke BUTTON, bukan header
4. Jika user bilang "icon mengecil" → fokus ke ICON styling
5. IDENTIFIKASI semua komponen yang ada dalam kode (button, icon, header, dll)
6. TANYAKAN user: "Komponen mana yang ingin diperbaiki?" jika tidak jelas
7. JANGAN asumsikan user ingin edit komponen tertentu hanya dari tag HTML

CONTOH SALAH:
- User paste kode dengan <header><button>...</button></header>
- User bilang "buttonnya tidak sesuai"  
- ❌ AI fokus ke "Header" → SALAH!
- ✅ AI fokus ke "Button" → BENAR!

📌 JIKA USER MINTA BUAT/UBAH:
1. Pahami apa yang diminta dengan TELITI
2. Berikan KODE LENGKAP (bukan snippet)
3. SERTAKAN path file yang tepat
4. JELASKAN perubahan yang dilakukan

📌 RESPONSE FORMAT:
📍 **Lokasi File:** \`path/ke/file.tsx\`

**Perubahan yang akan dilakukan:**
1. [Deskripsi perubahan 1]
2. [Deskripsi perubahan 2]

\`\`\`tsx:path/ke/file.tsx
// Kode lengkap disini
\`\`\`

Klik **Apply** untuk menerapkan perubahan!

═══════════════════════════════════════════════════════════════════════════
📂 PROJECT FILE MAPPING
═══════════════════════════════════════════════════════════════════════════

HALAMAN (app/*.tsx):
• app/page.tsx → Homepage
• app/about/page.tsx → About page
• app/gallery/page.tsx → Gallery dengan filter sekbid
• app/people/page.tsx → Daftar anggota
• app/bidang/page.tsx → Program kerja
• app/sekbid/page.tsx → Seksi bidang
• app/info/page.tsx → Info & events
• app/posts/page.tsx → Berita & artikel
• app/admin/* → Dashboard admin

KOMPONEN (components/*.tsx):
• Navbar.tsx → Navigation bar
• Footer.tsx → Footer
• DynamicHero.tsx → Hero section
• ProkerSection.tsx → Program kerja section
• PeopleSectionsClient.tsx → Filter tabs anggota
• cards/*.tsx → Card components
• ui/*.tsx → UI primitives

STYLES:
• app/globals.css → Global CSS
• tailwind.config.ts → Tailwind config

UTILS & HOOKS:
• lib/*.ts → Helper functions
• hooks/*.ts → React hooks
• contexts/*.tsx → React contexts

${currentFileContext}

${targetComponent ? `
═══════════════════════════════════════════════════════════════════════════
🎯 KOMPONEN TARGET (dari sidebar):
• Nama: ${targetComponent}
• Selector: ${selector}
• Deskripsi: ${componentInfo?.description || 'N/A'}
` : ''}

${skipPatternMatching ? `
═══════════════════════════════════════════════════════════════════════════
⚠️ USER PASTE KODE HTML/JSX - BACA BAIK-BAIK!
═══════════════════════════════════════════════════════════════════════════
User mengirimkan kode HTML/JSX. PERHATIKAN:
1. JANGAN fokus pada tag/elemen tertentu saja dari kode
2. BACA apa yang user MINTA/KELUHKAN (di luar kode)
3. Tanyakan "Komponen mana yang ingin diperbaiki?" jika tidak jelas
4. JANGAN asumsikan user ingin edit komponen hanya dari tag HTML
` : ''}

═══════════════════════════════════════════════════════════════════════════
💬 PERMINTAAN USER:
═══════════════════════════════════════════════════════════════════════════
${userActualRequest}

${pastedCodeMatch ? `
📋 KODE YANG DI-PASTE USER:
\`\`\`jsx
${pastedCodeMatch[0]}
\`\`\`

⚠️ INGAT: Kode di atas adalah REFERENSI. Fokus pada APA yang user MINTA, bukan tag HTML-nya!
` : ''}

═══════════════════════════════════════════════════════════════════════════
⚠️ ATURAN RESPONS - WAJIB DIIKUTI!
═══════════════════════════════════════════════════════════════════════════

🚨 REMINDER PARTIAL EDIT (SANGAT PENTING!):
- Jika user minta ubah EMAIL → berikan kode LENGKAP dengan SEMUA elemen, hanya email yang berbeda
- Jika user minta ubah WARNA → berikan kode LENGKAP dengan SEMUA elemen, hanya warna yang berbeda
- JANGAN PERNAH menghilangkan elemen yang tidak disebutkan user!
- Sebelum response, CEK: "Apakah ada elemen yang hilang dari kode original?"

1️⃣ STRUKTUR RESPONS WAJIB:
   📍 **Lokasi File:** \`path/ke/file.tsx\`
   
   🎯 **Yang saya pahami dari permintaan kamu:**
   [Jelaskan apa yang user minta dengan kata-kata sendiri]
   [Contoh: "Kamu ingin mengubah email saja, elemen lain (logo, links, social media) tetap sama"]
   
   ✏️ **Bagian yang DIUBAH:**
   1. [Perubahan spesifik dengan alasan]
   
   ✅ **Bagian yang TETAP SAMA:**
   - Logo dan branding
   - Navigation links
   - Social media icons
   - Copyright text
   - [dan elemen lain yang tidak diubah]
   
   📝 **Kode Lengkap (SEMUA ELEMEN TETAP ADA):**
   \`\`\`tsx:path/ke/file.tsx
   // Kode LENGKAP disini - TIDAK ADA yang dihapus!
   \`\`\`
   
   💡 **Penjelasan:**
   [Jelaskan bagian mana yang berubah vs tetap]
   
   👆 Klik **Apply** untuk menerapkan!

2️⃣ JIKA TIDAK JELAS/AMBIGU:
   ❓ **Saya perlu klarifikasi:**
   - Bagian mana SPESIFIK yang ingin diubah?
   - Apakah elemen lain tetap seperti semula?
   - File mana yang mau diedit?

3️⃣ JANGAN:
   ❌ Menghilangkan elemen yang tidak diminta dihapus
   ❌ Memberikan kode parsial/snippet saja
   ❌ Fokus ke satu elemen dan lupakan yang lain
   ❌ Asumsikan user ingin hapus elemen lain

4️⃣ SELALU:
   ✅ Berikan kode LENGKAP dengan SEMUA elemen
   ✅ Highlight bagian yang BERUBAH
   ✅ Konfirmasi elemen yang TETAP SAMA
   ✅ Double-check sebelum response: ada yang hilang?

═══════════════════════════════════════════════════════════════════════════
📂 FILE MAPPING CEPAT
═══════════════════════════════════════════════════════════════════════════

• Header/Navbar → components/Navbar.tsx
• Footer → components/Footer.tsx  
• Hero → components/DynamicHero.tsx
• Button styling → components/ui/button.tsx
• Gallery → app/gallery/page.tsx
• Filter tabs → components/PeopleSectionsClient.tsx
• Global CSS → app/globals.css

INGAT: Kamu adalah AI yang CERDAS dan RESPONSIF. 
Pahami konteks, berikan detail, dan bantu user dengan MAKSIMAL!`;

            // Build chat history for context continuity (last 6 messages)
            const recentMessages = chatMessages.slice(-6).map(msg => ({
                role: msg.role === 'system' ? 'assistant' : msg.role,
                content: msg.content.slice(0, 500) // Truncate to save tokens
            }));
            
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        ...recentMessages.filter(m => m.role === 'user' || m.role === 'assistant'),
                        { role: 'user', content: enhancedMessage }
                    ],
                    context: 'design_studio',
                    mode: 'admin',
                    provider: 'auto'
                })
            });
            
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            
            const data = await res.json();
            
            // Extract all code blocks (CSS, TSX, etc) - including file paths
            const codeBlocks: { language: string; code: string; filename?: string }[] = [];
            // Match both ```language and ```language:filepath formats
            const codeBlockRegex = /```(\w+)?(?::([^\n]+))?\n([\s\S]*?)```/g;
            let match;
            while ((match = codeBlockRegex.exec(data.reply)) !== null) {
                codeBlocks.push({
                    language: match[1] || 'text',
                    filename: match[2]?.trim(),
                    code: match[3].trim()
                });
            }
            
            // Extract CSS specifically
            let cssCode: string | undefined;
            const cssBlock = codeBlocks.find(b => b.language === 'css');
            if (cssBlock) {
                cssCode = cssBlock.code;
            }
            
            // Extract file changes (code blocks with file paths)
            const fileChanges = codeBlocks
                .filter(b => b.filename)
                .map(b => ({
                    path: b.filename!,
                    language: b.language,
                    code: b.code,
                    action: 'update' as const
                }));
            
            // Extract terminal commands (bash/sh/shell code blocks)
            const terminalCommands: string[] = [];
            const bashBlocks = codeBlocks.filter(b => ['bash', 'sh', 'shell', 'cmd', 'powershell', 'terminal'].includes(b.language));
            bashBlocks.forEach(block => {
                const commands = block.code.split('\n').filter(line => 
                    line.trim() && !line.startsWith('#') && !line.startsWith('//')
                );
                terminalCommands.push(...commands);
            });
            
            // Also detect inline commands like `npm install xxx`
            const inlineCommandRegex = /`(npm\s+(?:install|add|run)|pnpm\s+(?:install|add|run)|yarn\s+(?:add|install)|npx\s+\S+)[^`]*`/gi;
            let cmdMatch;
            while ((cmdMatch = inlineCommandRegex.exec(data.reply)) !== null) {
                const cmd = cmdMatch[1] + cmdMatch[0].slice(cmdMatch[1].length + 1, -1);
                if (!terminalCommands.includes(cmd)) {
                    terminalCommands.push(cmd);
                }
            }
            
            // Determine action type
            let actionType: ChatMessage['actionType'] = 'info';
            if (fileChanges.length > 0) {
                actionType = 'file-edit';
            } else if (cssCode) {
                actionType = 'css';
            } else if (codeBlocks.length > 0) {
                actionType = 'component';
            }
            
            // Keep the response as-is for display
            let displayContent = data.reply || 'Maaf, tidak ada respons dari AI.';
            
            const aiMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: displayContent,
                timestamp: new Date(),
                cssCode,
                targetComponent: targetComponent || undefined,
                targetFile: fileChanges.length > 0 ? fileChanges[0].path : undefined,
                codeBlocks: codeBlocks.length > 0 ? codeBlocks : undefined,
                fileChanges: fileChanges.length > 0 ? fileChanges : undefined,
                terminalCommands: terminalCommands.length > 0 ? terminalCommands : undefined,
                actionType
            };
            
            setChatMessages(prev => [...prev, aiMessage]);
            
            // ═══════════════════════════════════════════════════════════════
            // ⚠️ AUTO-APPLY DISABLED - User must click Apply button manually
            // ═══════════════════════════════════════════════════════════════
            // Auto-apply was causing confusion and unexpected changes.
            // Now ALL changes require explicit user action via the Apply button.
            
            const shouldAutoApply = false; // DISABLED - always false
            
            /* DISABLED AUTO-APPLY LOGIC
            const explicitApplyRequest = /\b(terapkan|apply|lakukan|pasang|execute|jalankan)\b/i.test(userQuery);
            const isAskingQuestion = /\?|dimana|where|letak|lokasi|ada (gak|tidak|nggak)|bagaimana|how|apa itu|what is|beritahu|kasih tau|jelaskan/i.test(userQuery);
            const shouldAutoApply = explicitApplyRequest && !isAskingQuestion;
            */
            
            if (shouldAutoApply) {
                // 1. Auto-apply CSS if available
                if (cssCode) {
                    const applyTarget = targetComponent || selectedComponent || 'global';
                    setTimeout(async () => {
                        await applyCSSFromChat(cssCode, applyTarget);
                        setChatMessages(prev => [...prev, {
                            id: Date.now().toString(),
                            role: 'system',
                            content: `✅ **Applied!** CSS untuk **${DESIGN_REGISTRY[applyTarget]?.displayName || applyTarget}** sudah diterapkan.\n\n🔄 Refresh halaman untuk melihat perubahan.`,
                            timestamp: new Date(),
                            actionType: 'action'
                        }]);
                    }, 500);
                }
                
                // Auto-apply file changes if available (TSX, TS, JS, JSON, CSS, etc.)
                if (fileChanges.length > 0) {
                    setTimeout(async () => {
                        await applyFileChanges(fileChanges);
                        const fileList = fileChanges.map(f => {
                            const icon = FILE_ICONS[f.language]?.icon || '📄';
                            return `${icon} ${f.path}`;
                        }).join('\n');
                        setChatMessages(prev => [...prev, {
                            id: Date.now().toString(),
                            role: 'system',
                            content: `✅ **Applied!** ${fileChanges.length} file(s) sudah diupdate:\n\n${fileList}\n\n🔄 Refresh halaman untuk melihat perubahan.`,
                            timestamp: new Date(),
                            actionType: 'action'
                        }]);
                    }, 500);
                }
            } else if (cssCode || fileChanges.length > 0) {
                // Show "ready to apply" message with details
                setTimeout(() => {
                    let readyMessage = `✨ **Perubahan Siap Diterapkan!**\n\n`;
                    
                    if (fileChanges.length > 0) {
                        readyMessage += `📂 **File yang akan diubah:**\n`;
                        fileChanges.forEach(f => {
                            const icon = FILE_ICONS[f.language]?.icon || '📄';
                            readyMessage += `${icon} \`${f.path}\`\n`;
                        });
                        readyMessage += `\n`;
                    }
                    
                    if (cssCode) {
                        readyMessage += `🎨 **CSS Override:** ${targetComponent || 'global'}\n\n`;
                    }
                    
                    readyMessage += `---\n`;
                    readyMessage += `👆 Klik tombol **Apply** di atas untuk menerapkan.\n`;
                    readyMessage += `⚡ Atau ketik **"terapkan"** untuk auto-apply semua.`;
                    
                    setChatMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        role: 'system',
                        content: readyMessage,
                        timestamp: new Date(),
                        actionType: 'info'
                    }]);
                }, 300);
            }
            
            // Show prompt for code blocks without file path
            if (!cssCode && !fileChanges.length && codeBlocks.length > 0 && openSourceFile) {
                setTimeout(() => {
                    setChatMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        role: 'system',
                        content: `💡 **Kode siap diterapkan!**\n\nKlik tombol **Apply** untuk menerapkan ke:\n📄 ${openSourceFile.path}`,
                        timestamp: new Date(),
                        actionType: 'info'
                    }]);
                }, 300);
            }
            
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
    
    // Apply code to any file (TSX, TS, CSS, etc)
    const applyCodeToFile = async (filePath: string, code: string, language: string) => {
        try {
            // ═══════════════════════════════════════════════════════════════
            // 🛡️ VALIDATION: Prevent applying code that's too short
            // This catches AI mistakes where it creates new code instead of editing
            // ═══════════════════════════════════════════════════════════════
            
            const newCodeLines = code.split('\n').length;
            
            // If we have the original file open, compare line counts
            if (openSourceFile?.path === filePath && originalSourceCode) {
                const originalLines = originalSourceCode.split('\n').length;
                const percentChange = ((originalLines - newCodeLines) / originalLines) * 100;
                
                // If new code is less than 30% of original, it's probably wrong
                if (newCodeLines < originalLines * 0.3 && originalLines > 50) {
                    const confirmApply = window.confirm(
                        `⚠️ PERINGATAN: Kode baru jauh lebih pendek!\n\n` +
                        `📊 Original: ${originalLines} baris\n` +
                        `📊 Baru: ${newCodeLines} baris (${percentChange.toFixed(0)}% lebih pendek)\n\n` +
                        `Ini mungkin menghapus banyak kode penting!\n\n` +
                        `Yakin ingin melanjutkan?`
                    );
                    
                    if (!confirmApply) {
                        notify('error', '❌ Apply dibatalkan - kode terlalu pendek');
                        setChatMessages(prev => [...prev, {
                            id: Date.now().toString(),
                            role: 'system',
                            content: `⚠️ **Apply Dibatalkan**\n\nKode baru (${newCodeLines} baris) jauh lebih pendek dari original (${originalLines} baris).\n\nIni biasanya berarti AI membuat kode baru dari awal, bukan mengedit file original.\n\n💡 **Solusi:**\n1. Buka file \`${filePath}\` di sidebar\n2. Minta AI lagi: "Edit file yang terbuka, ubah [bagian spesifik]"`,
                            timestamp: new Date(),
                            actionType: 'info'
                        }]);
                        return false;
                    }
                }
            }
            
            // ═══════════════════════════════════════════════════════════════
            // 🛡️ HARD VALIDATION: Check TSX/TS file structure
            // ═══════════════════════════════════════════════════════════════
            
            if (language === 'tsx' || language === 'ts' || language === 'typescript' || filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
                const validationErrors: string[] = [];
                
                // Check 1: Must have import statements (for tsx components)
                if (filePath.endsWith('.tsx') && !code.includes('import ')) {
                    validationErrors.push('❌ Tidak ada import statements (React components harus ada import)');
                }
                
                // Check 2: Must have export (either default or named)
                if (!code.includes('export ')) {
                    validationErrors.push('❌ Tidak ada export statement (file tidak bisa diimport)');
                }
                
                // Check 3: If it's a component file, should have React patterns
                if (filePath.endsWith('.tsx')) {
                    const hasReactComponent = 
                        code.includes('React.FC') || 
                        code.includes(': FC') ||
                        code.includes('function ') && code.includes('return (') ||
                        code.includes('const ') && code.includes('= () =>') ||
                        code.includes('return (') && (code.includes('<div') || code.includes('<section') || code.includes('<footer') || code.includes('<header') || code.includes('<nav') || code.includes('<main'));
                    
                    if (!hasReactComponent) {
                        validationErrors.push('❌ Tidak terdeteksi React component (tidak ada function/const yang return JSX)');
                    }
                }
                
                // Check 4: Raw JSX without component wrapper is invalid
                if (code.trim().startsWith('<') && !code.includes('import ') && !code.includes('export ')) {
                    validationErrors.push('❌ Kode hanya berisi JSX tanpa React component wrapper');
                }
                
                // If there are validation errors, BLOCK the apply
                if (validationErrors.length > 0) {
                    notify('error', '❌ Kode tidak valid - Apply diblokir');
                    setChatMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        role: 'system',
                        content: `🚫 **APPLY DIBLOKIR - Kode Tidak Valid!**\n\n**Masalah yang ditemukan:**\n${validationErrors.join('\n')}\n\n**File:** \`${filePath}\`\n\n💡 **Ini terjadi karena AI membuat kode baru dari awal, bukan mengedit file original.**\n\n**Solusi:**\n1. Buka file original di sidebar kiri\n2. Minta AI lagi dengan lebih spesifik\n3. Pastikan AI melihat isi file lengkap sebelum edit`,
                        timestamp: new Date(),
                        actionType: 'info'
                    }]);
                    return false;
                }
            }
            
            // Also check for suspiciously short TSX/TS files
            if ((language === 'tsx' || language === 'typescript') && newCodeLines < 20) {
                const confirmShort = window.confirm(
                    `⚠️ Kode sangat pendek (${newCodeLines} baris).\n\n` +
                    `File TSX/TS biasanya lebih panjang.\n` +
                    `Mungkin AI membuat kode baru, bukan mengedit.\n\n` +
                    `Yakin ingin melanjutkan?`
                );
                
                if (!confirmShort) {
                    notify('error', '❌ Apply dibatalkan');
                    return false;
                }
            }
            
            // ═══════════════════════════════════════════════════════════════
            
            const res = await fetch('/api/design/files', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save',
                    filePath: filePath,
                    content: code
                })
            });
            
            const data = await res.json();
            
            // Check if running on production (Vercel)
            if (data.isProduction) {
                // Show informative message for production environment
                setChatMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'system',
                    content: `⚠️ **Production Environment Detected**\n\nFile editing is disabled on Vercel production.\n\n📋 **Copy the code below and paste in your local editor:**\n\n**File:** \`${filePath}\`\n\n\`\`\`${language || 'typescript'}\n${code.slice(0, 2000)}${code.length > 2000 ? '\n// ... (code truncated, copy from code block above)' : ''}\n\`\`\`\n\n💡 **Steps:**\n1. Copy the code above\n2. Open \`${filePath}\` in VS Code\n3. Paste and save\n4. \`git push\` to deploy`,
                    timestamp: new Date(),
                    actionType: 'action'
                }]);
                notify('info', '📋 Code shown in chat - copy to local editor');
                return false;
            }
            
            if (data.success) {
                notify('success', `✅ File saved: ${filePath}`);
                
                // If it's a file we have open, update the editor
                if (openSourceFile?.path === filePath) {
                    setSourceCode(code);
                    setOriginalSourceCode(code);
                }
                
                // Reload file tree to show updated file
                await loadFileTree();
                
                return true;
            } else {
                notify('error', data.error || 'Failed to save file');
                return false;
            }
        } catch (err) {
            console.error('Apply code error:', err);
            notify('error', 'Failed to apply code to file');
            return false;
        }
    };
    
    // Apply multiple file changes from AI
    const applyFileChanges = async (changes: { path: string; language: string; code: string; action: string }[]) => {
        let successCount = 0;
        
        for (const change of changes) {
            const success = await applyCodeToFile(change.path, change.code, change.language);
            if (success) successCount++;
        }
        
        if (successCount === changes.length) {
            notify('success', `✅ All ${successCount} files updated successfully!`);
            
            // Auto push to GitHub after successful apply
            if (successCount > 0) {
                const changedFiles = changes.map(c => c.path).join(', ');
                await pushToGitHub(`Auto-commit from Design Studio: ${changedFiles.slice(0, 100)}`);
            }
        } else if (successCount > 0) {
            notify('info', `${successCount}/${changes.length} files updated`);
            // Still push partial changes
            const changedFiles = changes.slice(0, successCount).map(c => c.path).join(', ');
            await pushToGitHub(`Partial commit from Design Studio: ${changedFiles.slice(0, 100)}`);
        } else {
            notify('error', 'Failed to update files');
        }
    };
    
    // Push changes to GitHub
    const pushToGitHub = async (message: string = 'Update from Design Studio') => {
        try {
            notify('info', '🚀 Pushing to GitHub...');
            
            // git add -A
            const addRes = await fetch('/api/design/terminal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: 'git add -A' })
            });
            const addData = await addRes.json();
            
            if (!addData.success && !addData.isProduction) {
                notify('error', 'Failed to stage changes');
                return false;
            }
            
            // git commit
            const commitRes = await fetch('/api/design/terminal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: `git commit -m "${message}"` })
            });
            const commitData = await commitRes.json();
            
            // git push
            const pushRes = await fetch('/api/design/terminal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: 'git push origin main' })
            });
            const pushData = await pushRes.json();
            
            if (pushData.success) {
                notify('success', '🎉 Pushed to GitHub! Vercel will auto-deploy.');
                setChatMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'system',
                    content: `✅ **Successfully pushed to GitHub!**\n\nVercel will auto-deploy in ~30-60 seconds.\n\n📋 Commit: ${message}`,
                    timestamp: new Date(),
                    actionType: 'action'
                }]);
                return true;
            } else if (pushData.isProduction) {
                setChatMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'system',
                    content: `📋 **Files saved! Push manually:**\n\n\`\`\`bash\ngit add -A && git commit -m "${message}" && git push\n\`\`\``,
                    timestamp: new Date(),
                    actionType: 'action'
                }]);
                return false;
            } else {
                notify('error', 'Failed to push to GitHub');
                return false;
            }
        } catch (err) {
            console.error('Git push error:', err);
            notify('error', 'Failed to push to GitHub');
            return false;
        }
    };
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🖥️ TERMINAL EXECUTION - Run commands from AI
    // ═══════════════════════════════════════════════════════════════════════════
    
    const runTerminalCommand = async (command: string): Promise<{ success: boolean; output: string; error?: string; isProduction?: boolean }> => {
        try {
            notify('info', `🖥️ Running: ${command}`);
            
            const res = await fetch('/api/design/terminal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command })
            });
            
            const data = await res.json();
            
            // Check if running on production (Vercel)
            if (data.isProduction) {
                setChatMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'system',
                    content: `⚠️ **Production Environment Detected**\n\nTerminal commands are disabled on Vercel.\n\n📋 **Run this command locally:**\n\n\`\`\`bash\n${command}\n\`\`\`\n\n💡 **Steps:**\n1. Open terminal in your local project\n2. Run the command above\n3. \`git push\` to deploy`,
                    timestamp: new Date(),
                    actionType: 'action'
                }]);
                notify('info', '📋 Command shown in chat - run locally');
                return { success: false, output: '', error: 'Production environment', isProduction: true };
            }
            
            if (data.success) {
                notify('success', `✅ Command completed: ${command.slice(0, 30)}...`);
                return { success: true, output: data.output || data.stdout };
            } else {
                notify('error', `❌ Command failed: ${data.error}`);
                return { success: false, output: data.stderr || '', error: data.error };
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            notify('error', `Terminal error: ${errorMsg}`);
            return { success: false, output: '', error: errorMsg };
        }
    };
    
    // Quick install package
    const installPackage = async (packageName: string) => {
        setChatMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'system',
            content: `📦 Installing ${packageName}...`,
            timestamp: new Date(),
            actionType: 'action'
        }]);
        
        const result = await runTerminalCommand(`npm install ${packageName}`);
        
        setChatMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'system',
            content: result.success 
                ? `✅ **${packageName}** installed successfully!\n\`\`\`\n${result.output.slice(0, 500)}\n\`\`\``
                : `❌ Failed to install ${packageName}: ${result.error}`,
            timestamp: new Date(),
            actionType: result.success ? 'action' : 'error'
        }]);
        
        return result.success;
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
                                        
                                        {/* ═══════ SOURCE FILES (REAL FILES) - VS CODE STYLE ═══════ */}
                                        <div className="border-t-2 border-purple-500/50 mt-2 pt-2">
                                            <div className="px-3 py-1.5 flex items-center gap-2 text-xs text-purple-400 font-medium uppercase tracking-wider">
                                                <FileCode className="w-3 h-3" />
                                                Explorer - Source Files
                                            </div>
                                            
                                            {fileTree && (
                                                <div className="max-h-[500px] overflow-y-auto">
                                                    {/* Components Folder - with tree structure */}
                                                    {fileTree.components && fileTree.components.length > 0 && (
                                                        <div className="border-b border-gray-700/30">
                                                            <div
                                                                className="flex items-center gap-1.5 py-1.5 px-2 cursor-pointer hover:bg-gray-700/50"
                                                                onClick={() => toggleFolder('components')}
                                                            >
                                                                {expandedFolders.includes('components') ? (
                                                                    <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                                                                ) : (
                                                                    <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                                                                )}
                                                                <span className="text-blue-400">📦</span>
                                                                <span className="text-xs font-medium text-blue-300">components</span>
                                                                <span className="text-[10px] text-gray-600 ml-auto">{fileTree.components.length}</span>
                                                            </div>
                                                            {expandedFolders.includes('components') && (
                                                                <div className="pb-1">
                                                                    {fileTree.components.filter(f => filterBySearch(f.name) || filterBySearch(f.path)).map(file => (
                                                                        <FileTreeNode
                                                                            key={file.path}
                                                                            file={file}
                                                                            depth={0}
                                                                            openFile={openFile}
                                                                            openSourceFile={openSourceFile}
                                                                            expandedPaths={expandedPaths}
                                                                            togglePath={togglePath}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    
                                                    {/* App/Pages Folder */}
                                                    {fileTree.pages && fileTree.pages.length > 0 && (
                                                        <div className="border-b border-gray-700/30">
                                                            <div
                                                                className="flex items-center gap-1.5 py-1.5 px-2 cursor-pointer hover:bg-gray-700/50"
                                                                onClick={() => toggleFolder('pages')}
                                                            >
                                                                {expandedFolders.includes('pages') ? (
                                                                    <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                                                                ) : (
                                                                    <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                                                                )}
                                                                <span className="text-green-400">📱</span>
                                                                <span className="text-xs font-medium text-green-300">app (pages)</span>
                                                                <span className="text-[10px] text-gray-600 ml-auto">{fileTree.pages.length}</span>
                                                            </div>
                                                            {expandedFolders.includes('pages') && (
                                                                <div className="pb-1">
                                                                    {fileTree.pages.filter(f => filterBySearch(f.name) || filterBySearch(f.path)).map(file => (
                                                                        <FileTreeNode
                                                                            key={file.path}
                                                                            file={file}
                                                                            depth={0}
                                                                            openFile={openFile}
                                                                            openSourceFile={openSourceFile}
                                                                            expandedPaths={expandedPaths}
                                                                            togglePath={togglePath}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    
                                                    {/* Lib Folder */}
                                                    {fileTree.lib && fileTree.lib.length > 0 && (
                                                        <div className="border-b border-gray-700/30">
                                                            <div
                                                                className="flex items-center gap-1.5 py-1.5 px-2 cursor-pointer hover:bg-gray-700/50"
                                                                onClick={() => toggleFolder('lib')}
                                                            >
                                                                {expandedFolders.includes('lib') ? (
                                                                    <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                                                                ) : (
                                                                    <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                                                                )}
                                                                <span className="text-teal-400">📚</span>
                                                                <span className="text-xs font-medium text-teal-300">lib</span>
                                                                <span className="text-[10px] text-gray-600 ml-auto">{fileTree.lib.length}</span>
                                                            </div>
                                                            {expandedFolders.includes('lib') && (
                                                                <div className="pb-1">
                                                                    {fileTree.lib.filter(f => filterBySearch(f.name)).map(file => (
                                                                        <FileTreeNode
                                                                            key={file.path}
                                                                            file={file}
                                                                            depth={0}
                                                                            openFile={openFile}
                                                                            openSourceFile={openSourceFile}
                                                                            expandedPaths={expandedPaths}
                                                                            togglePath={togglePath}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    
                                                    {/* Hooks Folder */}
                                                    {fileTree.hooks && fileTree.hooks.length > 0 && (
                                                        <div className="border-b border-gray-700/30">
                                                            <div
                                                                className="flex items-center gap-1.5 py-1.5 px-2 cursor-pointer hover:bg-gray-700/50"
                                                                onClick={() => toggleFolder('hooks')}
                                                            >
                                                                {expandedFolders.includes('hooks') ? (
                                                                    <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                                                                ) : (
                                                                    <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                                                                )}
                                                                <span className="text-pink-400">🪝</span>
                                                                <span className="text-xs font-medium text-pink-300">hooks</span>
                                                                <span className="text-[10px] text-gray-600 ml-auto">{fileTree.hooks.length}</span>
                                                            </div>
                                                            {expandedFolders.includes('hooks') && (
                                                                <div className="pb-1">
                                                                    {fileTree.hooks.filter(f => filterBySearch(f.name)).map(file => (
                                                                        <FileTreeNode
                                                                            key={file.path}
                                                                            file={file}
                                                                            depth={0}
                                                                            openFile={openFile}
                                                                            openSourceFile={openSourceFile}
                                                                            expandedPaths={expandedPaths}
                                                                            togglePath={togglePath}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    
                                                    {/* Contexts Folder */}
                                                    {fileTree.contexts && fileTree.contexts.length > 0 && (
                                                        <div className="border-b border-gray-700/30">
                                                            <div
                                                                className="flex items-center gap-1.5 py-1.5 px-2 cursor-pointer hover:bg-gray-700/50"
                                                                onClick={() => toggleFolder('contexts')}
                                                            >
                                                                {expandedFolders.includes('contexts') ? (
                                                                    <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                                                                ) : (
                                                                    <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                                                                )}
                                                                <span className="text-indigo-400">🎯</span>
                                                                <span className="text-xs font-medium text-indigo-300">contexts</span>
                                                                <span className="text-[10px] text-gray-600 ml-auto">{fileTree.contexts.length}</span>
                                                            </div>
                                                            {expandedFolders.includes('contexts') && (
                                                                <div className="pb-1">
                                                                    {fileTree.contexts.filter(f => filterBySearch(f.name)).map(file => (
                                                                        <FileTreeNode
                                                                            key={file.path}
                                                                            file={file}
                                                                            depth={0}
                                                                            openFile={openFile}
                                                                            openSourceFile={openSourceFile}
                                                                            expandedPaths={expandedPaths}
                                                                            togglePath={togglePath}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    
                                                    {/* Types Folder */}
                                                    {fileTree.types && fileTree.types.length > 0 && (
                                                        <div className="border-b border-gray-700/30">
                                                            <div
                                                                className="flex items-center gap-1.5 py-1.5 px-2 cursor-pointer hover:bg-gray-700/50"
                                                                onClick={() => toggleFolder('types')}
                                                            >
                                                                {expandedFolders.includes('types') ? (
                                                                    <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                                                                ) : (
                                                                    <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                                                                )}
                                                                <span className="text-cyan-400">📐</span>
                                                                <span className="text-xs font-medium text-cyan-300">types</span>
                                                                <span className="text-[10px] text-gray-600 ml-auto">{fileTree.types.length}</span>
                                                            </div>
                                                            {expandedFolders.includes('types') && (
                                                                <div className="pb-1">
                                                                    {fileTree.types.filter(f => filterBySearch(f.name)).map(file => (
                                                                        <FileTreeNode
                                                                            key={file.path}
                                                                            file={file}
                                                                            depth={0}
                                                                            openFile={openFile}
                                                                            openSourceFile={openSourceFile}
                                                                            expandedPaths={expandedPaths}
                                                                            togglePath={togglePath}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    
                                                    {/* Config Files */}
                                                    {fileTree.config && fileTree.config.length > 0 && (
                                                        <div className="border-b border-gray-700/30">
                                                            <div
                                                                className="flex items-center gap-1.5 py-1.5 px-2 cursor-pointer hover:bg-gray-700/50"
                                                                onClick={() => toggleFolder('config')}
                                                            >
                                                                {expandedFolders.includes('config') ? (
                                                                    <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                                                                ) : (
                                                                    <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                                                                )}
                                                                <span className="text-orange-400">⚙️</span>
                                                                <span className="text-xs font-medium text-orange-300">config</span>
                                                                <span className="text-[10px] text-gray-600 ml-auto">{fileTree.config.length}</span>
                                                            </div>
                                                            {expandedFolders.includes('config') && (
                                                                <div className="pb-1">
                                                                    {fileTree.config.filter(f => filterBySearch(f.name)).map(file => (
                                                                        <FileTreeNode
                                                                            key={file.path}
                                                                            file={file}
                                                                            depth={0}
                                                                            openFile={openFile}
                                                                            openSourceFile={openSourceFile}
                                                                            expandedPaths={expandedPaths}
                                                                            togglePath={togglePath}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    
                                                    {/* Styles */}
                                                    {fileTree.styles && fileTree.styles.length > 0 && (
                                                        <div className="border-b border-gray-700/30">
                                                            <div
                                                                className="flex items-center gap-1.5 py-1.5 px-2 cursor-pointer hover:bg-gray-700/50"
                                                                onClick={() => toggleFolder('styles')}
                                                            >
                                                                {expandedFolders.includes('styles') ? (
                                                                    <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                                                                ) : (
                                                                    <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                                                                )}
                                                                <span className="text-purple-400">🎨</span>
                                                                <span className="text-xs font-medium text-purple-300">styles</span>
                                                                <span className="text-[10px] text-gray-600 ml-auto">{fileTree.styles.length}</span>
                                                            </div>
                                                            {expandedFolders.includes('styles') && (
                                                                <div className="pb-1">
                                                                    {fileTree.styles.filter(f => filterBySearch(f.name)).map(file => (
                                                                        <FileTreeNode
                                                                            key={file.path}
                                                                            file={file}
                                                                            depth={0}
                                                                            openFile={openFile}
                                                                            openSourceFile={openSourceFile}
                                                                            expandedPaths={expandedPaths}
                                                                            togglePath={togglePath}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    
                                                    {/* API Routes */}
                                                    {fileTree.api && fileTree.api.length > 0 && (
                                                        <div className="border-b border-gray-700/30">
                                                            <div
                                                                className="flex items-center gap-1.5 py-1.5 px-2 cursor-pointer hover:bg-gray-700/50"
                                                                onClick={() => toggleFolder('api')}
                                                            >
                                                                {expandedFolders.includes('api') ? (
                                                                    <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                                                                ) : (
                                                                    <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                                                                )}
                                                                <span className="text-orange-400">🔌</span>
                                                                <span className="text-xs font-medium text-orange-300">api</span>
                                                                <span className="text-[10px] text-gray-600 ml-auto">{fileTree.api.length}</span>
                                                            </div>
                                                            {expandedFolders.includes('api') && (
                                                                <div className="pb-1">
                                                                    {fileTree.api.filter(f => filterBySearch(f.name) || filterBySearch(f.path)).slice(0, 30).map(file => (
                                                                        <FileTreeNode
                                                                            key={file.path}
                                                                            file={file}
                                                                            depth={0}
                                                                            openFile={openFile}
                                                                            openSourceFile={openSourceFile}
                                                                            expandedPaths={expandedPaths}
                                                                            togglePath={togglePath}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
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
                                            {/* Show file changes with Apply button */}
                                            {msg.fileChanges && msg.fileChanges.length > 0 && (
                                                <div className="mt-3 space-y-2">
                                                    <div className="flex items-center gap-2 text-xs text-cyan-400 mb-2">
                                                        <FileCode className="w-3.5 h-3.5" />
                                                        <span className="font-medium">File Changes ({msg.fileChanges.length})</span>
                                                    </div>
                                                    {msg.fileChanges.map((change, i) => (
                                                        <div key={i} className="bg-black/40 rounded-lg overflow-hidden border border-cyan-500/20">
                                                            <div className="flex items-center justify-between px-3 py-2 bg-cyan-500/10 border-b border-cyan-500/20">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={FILE_ICONS[change.language]?.color || 'text-gray-400'}>
                                                                        {FILE_ICONS[change.language]?.icon || '📄'}
                                                                    </span>
                                                                    <span className="text-xs text-cyan-300 font-mono">{change.path}</span>
                                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${change.action === 'create' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                                        {change.action}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <button 
                                                                        onClick={() => { navigator.clipboard.writeText(change.code); notify('info', 'Code copied!'); }}
                                                                        className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                                                                        title="Copy code"
                                                                    >
                                                                        <Copy className="w-3 h-3" />
                                                                    </button>
                                                                    <button 
                                                                        onClick={async () => {
                                                                            const success = await applyCodeToFile(change.path, change.code, change.language);
                                                                            if (success) {
                                                                                await pushToGitHub(`Update ${change.path} from Design Studio`);
                                                                            }
                                                                        }}
                                                                        className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded text-xs font-medium transition-all hover:scale-[1.02] shadow-lg shadow-cyan-500/20"
                                                                    >
                                                                        <Play className="w-3 h-3" /> Apply
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <pre className="text-xs text-gray-300 p-3 overflow-x-auto max-h-40 font-mono">{change.code.slice(0, 400)}{change.code.length > 400 ? '\n...' : ''}</pre>
                                                        </div>
                                                    ))}
                                                    {/* Apply All button */}
                                                    {msg.fileChanges.length > 1 && (
                                                        <button 
                                                            onClick={() => applyFileChanges(msg.fileChanges!)}
                                                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:scale-[1.02]"
                                                        >
                                                            <Zap className="w-4 h-4" /> Apply All {msg.fileChanges.length} Files
                                                        </button>
                                                    )}
                                                    {/* Single file - Big Apply button */}
                                                    {msg.fileChanges.length === 1 && (
                                                        <button 
                                                            onClick={() => applyFileChanges(msg.fileChanges!)}
                                                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:scale-[1.02] animate-pulse"
                                                        >
                                                            <Zap className="w-5 h-5" /> 🚀 APPLY CHANGES
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {/* Terminal Commands Section */}
                                            {msg.terminalCommands && msg.terminalCommands.length > 0 && (
                                                <div className="mt-3 space-y-2">
                                                    <div className="flex items-center gap-2 text-xs text-amber-400 mb-2">
                                                        <Terminal className="w-3.5 h-3.5" />
                                                        <span className="font-medium">Terminal Commands ({msg.terminalCommands.length})</span>
                                                    </div>
                                                    {msg.terminalCommands.map((cmd, i) => (
                                                        <div key={i} className="flex items-center gap-2 bg-black/50 rounded-lg px-3 py-2 border border-amber-500/20">
                                                            <code className="flex-1 text-xs text-amber-200 font-mono">{cmd}</code>
                                                            <button 
                                                                onClick={() => { navigator.clipboard.writeText(cmd); notify('info', 'Command copied!'); }}
                                                                className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                                                                title="Copy command"
                                                            >
                                                                <Copy className="w-3 h-3" />
                                                            </button>
                                                            <button 
                                                                onClick={async () => {
                                                                    const result = await runTerminalCommand(cmd);
                                                                    setChatMessages(prev => [...prev, {
                                                                        id: Date.now().toString(),
                                                                        role: 'system',
                                                                        content: result.success 
                                                                            ? `✅ **Command executed:** \`${cmd}\`\n\`\`\`\n${result.output.slice(0, 1000)}\n\`\`\``
                                                                            : `❌ **Command failed:** \`${cmd}\`\n\nError: ${result.error}`,
                                                                        timestamp: new Date(),
                                                                        actionType: result.success ? 'action' : 'error'
                                                                    }]);
                                                                }}
                                                                className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded text-xs font-medium transition-all hover:scale-[1.02] shadow-lg shadow-amber-500/20"
                                                            >
                                                                <Play className="w-3 h-3" /> Run
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {/* Run All Commands button */}
                                                    {msg.terminalCommands.length > 1 && (
                                                        <button 
                                                            onClick={async () => {
                                                                for (const cmd of msg.terminalCommands!) {
                                                                    const result = await runTerminalCommand(cmd);
                                                                    setChatMessages(prev => [...prev, {
                                                                        id: Date.now().toString(),
                                                                        role: 'system',
                                                                        content: result.success 
                                                                            ? `✅ \`${cmd}\` - Success`
                                                                            : `❌ \`${cmd}\` - Failed: ${result.error}`,
                                                                        timestamp: new Date(),
                                                                        actionType: result.success ? 'action' : 'error'
                                                                    }]);
                                                                }
                                                            }}
                                                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-amber-500/25 hover:scale-[1.02]"
                                                        >
                                                            <Terminal className="w-4 h-4" /> Run All {msg.terminalCommands.length} Commands
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {/* Show code blocks for other languages (without file path) */}
                                            {msg.codeBlocks && msg.codeBlocks.filter(b => b.language !== 'css' && !b.filename).length > 0 && (
                                                <div className="mt-3 space-y-2">
                                                    {msg.codeBlocks.filter(b => b.language !== 'css' && !b.filename).map((block, i) => (
                                                        <div key={i} className="bg-black/30 rounded-lg p-2 border border-white/10">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-xs text-gray-400 uppercase">{block.language}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <button 
                                                                        onClick={() => { navigator.clipboard.writeText(block.code); notify('info', `${block.language} copied!`); }}
                                                                        className="text-xs text-gray-400 hover:text-white p-1"
                                                                        title="Copy code"
                                                                    >
                                                                        <Copy className="w-3 h-3" />
                                                                    </button>
                                                                    {openSourceFile && (
                                                                        <button 
                                                                            onClick={async () => {
                                                                                const success = await applyCodeToFile(openSourceFile.path, block.code, block.language);
                                                                                if (success) {
                                                                                    setSourceCode(block.code);
                                                                                    setOriginalSourceCode(block.code);
                                                                                    await pushToGitHub(`Update ${openSourceFile.path} from Design Studio`);
                                                                                }
                                                                            }}
                                                                            className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white rounded text-xs font-medium transition-all"
                                                                            title={`Apply to ${openSourceFile.path}`}
                                                                        >
                                                                            <Play className="w-2.5 h-2.5" /> Apply
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <pre className="text-xs text-gray-300 overflow-x-auto max-h-32">{block.code.slice(0, 200)}{block.code.length > 200 ? '...' : ''}</pre>
                                                            {openSourceFile && (
                                                                <div className="mt-1 text-[10px] text-gray-500">
                                                                    📄 Target: {openSourceFile.path}
                                                                </div>
                                                            )}
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
                                                <span className="text-xs text-gray-400">
                                                    {chatInput.toLowerCase().includes('terapkan') || chatInput.toLowerCase().includes('apply') ? '✨ Menerapkan perubahan...' :
                                                     chatInput.toLowerCase().includes('css') || chatInput.toLowerCase().includes('style') ? '🎨 Generating CSS...' :
                                                     chatInput.toLowerCase().includes('file') || chatInput.toLowerCase().includes('code') ? '📝 Analyzing code...' :
                                                     '🤔 Thinking...'}
                                                </span>
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
