'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Eye, EyeOff, X, Check, Maximize2, Minimize2,
    Monitor, Smartphone, Tablet, RefreshCw, Code,
    Play, Pause, Layers, ExternalLink
} from 'lucide-react';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🎨 DESIGN STUDIO PREVIEW SYSTEM v2.0
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Real-time preview system for AI-generated code changes.
 * Features:
 * - Live component rendering
 * - Device size simulation
 * - Side-by-side comparison
 * - Apply/Reject controls
 */

interface PreviewChange {
    path: string;
    action: 'create' | 'modify' | 'delete';
    content?: string;
    diff?: { find: string; replace: string };
}

interface PreviewSystemProps {
    changes: PreviewChange[];
    isOpen: boolean;
    onClose: () => void;
    onApply: (changes: PreviewChange[]) => Promise<void>;
    onReject: () => void;
}

export function DesignStudioPreview({
    changes,
    isOpen,
    onClose,
    onApply,
    onReject
}: PreviewSystemProps) {
    const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isApplying, setIsApplying] = useState(false);
    const [previewMode, setPreviewMode] = useState<'visual' | 'code' | 'diff'>('visual');
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    
    // Device sizes
    const deviceSizes = {
        desktop: { width: '100%', height: '100%' },
        tablet: { width: '768px', height: '1024px' },
        mobile: { width: '375px', height: '667px' }
    };
    
    // Handle apply
    const handleApply = async () => {
        setIsApplying(true);
        try {
            await onApply(changes);
            onClose();
        } catch (err) {
            console.error('Apply failed:', err);
        } finally {
            setIsApplying(false);
        }
    };
    
    // Render code preview
    const renderCodePreview = (change: PreviewChange) => {
        if (change.diff) {
            return (
                <div className="space-y-4">
                    <div>
                        <h4 className="text-sm font-medium text-red-400 mb-2">- Original</h4>
                        <pre className="bg-red-950/30 p-3 rounded-lg text-sm overflow-x-auto border border-red-500/20">
                            <code className="text-red-300">{change.diff.find}</code>
                        </pre>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-green-400 mb-2">+ Modified</h4>
                        <pre className="bg-green-950/30 p-3 rounded-lg text-sm overflow-x-auto border border-green-500/20">
                            <code className="text-green-300">{change.diff.replace}</code>
                        </pre>
                    </div>
                </div>
            );
        }
        
        return (
            <pre className="bg-gray-900 p-4 rounded-lg text-sm overflow-auto max-h-96 border border-gray-700">
                <code className="text-gray-300">{change.content || 'No content'}</code>
            </pre>
        );
    };
    
    // Try to render visual preview
    const renderVisualPreview = () => {
        const componentChanges = changes.filter(c => c.path.endsWith('.tsx') && c.content);
        
        if (componentChanges.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Layers className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg mb-2">Visual Preview Not Available</p>
                    <p className="text-sm text-gray-500">
                        Preview requires TSX component changes
                    </p>
                    <button
                        onClick={() => setPreviewMode('code')}
                        className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm transition-colors"
                    >
                        View Code Instead
                    </button>
                </div>
            );
        }
        
        return (
            <div 
                className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-2xl transition-all duration-300"
                style={{
                    width: deviceSizes[device].width,
                    height: deviceSizes[device].height,
                    maxWidth: '100%',
                    maxHeight: '100%',
                    margin: 'auto'
                }}
            >
                <div className="p-4 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className="flex-1 text-center text-xs text-gray-500">
                        {componentChanges[0]?.path || 'Preview'}
                    </div>
                </div>
                <div className="p-6 overflow-auto h-[calc(100%-48px)]">
                    {/* Conceptual preview - show the code structure */}
                    <div className="space-y-4">
                        <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-lg border-2 border-dashed border-purple-300 dark:border-purple-600">
                            <p className="text-sm text-purple-700 dark:text-purple-300 font-medium mb-2">
                                📦 Component Preview
                            </p>
                            <p className="text-xs text-purple-600 dark:text-purple-400">
                                This is a conceptual preview. Apply changes to see the actual render.
                            </p>
                        </div>
                        {componentChanges.map((change, i) => (
                            <div 
                                key={i}
                                className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600"
                            >
                                <p className="text-sm font-mono text-gray-600 dark:text-gray-400 mb-2">
                                    {change.path}
                                </p>
                                <div className="text-xs text-gray-500">
                                    {change.content?.split('\n').slice(0, 10).join('\n')}...
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };
    
    if (!isOpen) return null;
    
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 ${
                    isFullscreen ? '' : 'md:p-8'
                }`}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className={`bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-700 ${
                        isFullscreen ? 'w-full h-full' : 'w-full max-w-6xl h-[90vh]'
                    }`}
                >
                    {/* Header */}
                    <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Eye className="w-5 h-5 text-purple-400" />
                                <h2 className="font-semibold text-white">Preview Changes</h2>
                            </div>
                            <div className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                                {changes.length} file{changes.length !== 1 ? 's' : ''} to modify
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {/* Preview Mode Toggle */}
                            <div className="flex bg-gray-700 rounded-lg p-1">
                                {(['visual', 'code', 'diff'] as const).map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => setPreviewMode(mode)}
                                        className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                                            previewMode === mode
                                                ? 'bg-purple-600 text-white'
                                                : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                    </button>
                                ))}
                            </div>
                            
                            {/* Device Toggle */}
                            <div className="flex bg-gray-700 rounded-lg p-1">
                                <button
                                    onClick={() => setDevice('desktop')}
                                    className={`p-1.5 rounded-md ${device === 'desktop' ? 'bg-purple-600' : 'hover:bg-gray-600'}`}
                                >
                                    <Monitor className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setDevice('tablet')}
                                    className={`p-1.5 rounded-md ${device === 'tablet' ? 'bg-purple-600' : 'hover:bg-gray-600'}`}
                                >
                                    <Tablet className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setDevice('mobile')}
                                    className={`p-1.5 rounded-md ${device === 'mobile' ? 'bg-purple-600' : 'hover:bg-gray-600'}`}
                                >
                                    <Smartphone className="w-4 h-4" />
                                </button>
                            </div>
                            
                            {/* Fullscreen Toggle */}
                            <button
                                onClick={() => setIsFullscreen(!isFullscreen)}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                            </button>
                            
                            {/* Close */}
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex h-[calc(100%-120px)]">
                        {/* File List Sidebar */}
                        <div className="w-64 bg-gray-850 border-r border-gray-700 overflow-y-auto">
                            <div className="p-3">
                                <h3 className="text-xs font-medium text-gray-400 uppercase mb-2">
                                    Changed Files
                                </h3>
                                <div className="space-y-1">
                                    {changes.map((change, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedFile(change.path)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                                selectedFile === change.path
                                                    ? 'bg-purple-600/30 text-purple-300'
                                                    : 'hover:bg-gray-700 text-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {change.action === 'create' && (
                                                    <span className="text-green-400 text-xs">+</span>
                                                )}
                                                {change.action === 'modify' && (
                                                    <span className="text-yellow-400 text-xs">~</span>
                                                )}
                                                {change.action === 'delete' && (
                                                    <span className="text-red-400 text-xs">-</span>
                                                )}
                                                <span className="truncate">{change.path.split('/').pop()}</span>
                                            </div>
                                            <div className="text-xs text-gray-500 truncate mt-0.5">
                                                {change.path}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        {/* Preview Area */}
                        <div className="flex-1 overflow-auto p-6 bg-gray-950">
                            {previewMode === 'visual' && renderVisualPreview()}
                            {previewMode === 'code' && (
                                <div className="space-y-6">
                                    {changes
                                        .filter(c => !selectedFile || c.path === selectedFile)
                                        .map((change, i) => (
                                            <div key={i}>
                                                <h3 className="text-sm font-mono text-gray-400 mb-2 flex items-center gap-2">
                                                    <Code className="w-4 h-4" />
                                                    {change.path}
                                                    <span className={`px-2 py-0.5 rounded text-xs ${
                                                        change.action === 'create' ? 'bg-green-900 text-green-300' :
                                                        change.action === 'modify' ? 'bg-yellow-900 text-yellow-300' :
                                                        'bg-red-900 text-red-300'
                                                    }`}>
                                                        {change.action}
                                                    </span>
                                                </h3>
                                                {renderCodePreview(change)}
                                            </div>
                                        ))}
                                </div>
                            )}
                            {previewMode === 'diff' && (
                                <div className="space-y-6">
                                    {changes
                                        .filter(c => c.diff && (!selectedFile || c.path === selectedFile))
                                        .map((change, i) => (
                                            <div key={i}>
                                                <h3 className="text-sm font-mono text-gray-400 mb-2">
                                                    {change.path}
                                                </h3>
                                                {renderCodePreview(change)}
                                            </div>
                                        ))}
                                    {changes.filter(c => c.diff).length === 0 && (
                                        <div className="text-center text-gray-500 py-8">
                                            No DIFF changes. Showing full file replacements in Code view.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Footer Actions */}
                    <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-t border-gray-700">
                        <div className="text-sm text-gray-400">
                            {changes.length} file{changes.length !== 1 ? 's' : ''} will be modified
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onReject}
                                className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApply}
                                disabled={isApplying}
                                className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {isApplying ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        Applying...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Apply Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default DesignStudioPreview;
