import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// ═══════════════════════════════════════════════════════════════════════════════
// 📁 DESIGN FILES API - Read actual component files from workspace
// ═══════════════════════════════════════════════════════════════════════════════

// Component to file mapping - maps component names to their actual source files
const COMPONENT_FILE_MAP: Record<string, string[]> = {
    // Layout Components
    navbar: ['components/Navbar.tsx'],
    footer: ['components/Footer.tsx'],
    hero: ['components/DynamicHero.tsx'],
    sidebar: ['components/admin/AdminSidebar.tsx'],
    
    // Section Components  
    vision_card: ['components/VisionCard.tsx'],
    mission_card: ['components/MissionCard.tsx'],
    goals_section: ['components/GoalsSection.tsx'],
    latest_posts: ['components/LatestPostsSection.tsx'],
    announcements: ['components/AnnouncementsWidget.tsx'],
    polls: ['components/PollsWidget.tsx'],
    
    // Card Components
    card: ['components/cards/PostCard.tsx', 'components/MissionCard.tsx'],
    post_card: ['components/cards/PostCard.tsx'],
    
    // Form Components
    input: ['components/ui/Input.tsx'],
    button: ['components/ui/Button.tsx'],
    
    // Chat Components
    chat_widget: ['components/chat/LiveChatWidget.tsx'],
    
    // Page Components
    about: ['app/about/page.tsx', 'components/about/AboutSections.tsx'],
    home: ['app/page.tsx'],
    gallery: ['app/gallery/page.tsx'],
    people: ['app/people/page.tsx', 'components/PeopleSectionsClient.tsx'],
    
    // Style Files
    globals: ['app/globals.css'],
    globals_mobile: ['app/globals-mobile.css'],
    tailwind: ['tailwind.config.ts'],
    
    // Config Files
    design_registry: ['lib/design-registry.ts'],
};

// File categories for sidebar organization
const FILE_CATEGORIES = {
    components: {
        name: 'Components',
        icon: '📦',
        patterns: ['components/**/*.tsx', 'components/**/*.ts']
    },
    pages: {
        name: 'Pages', 
        icon: '📄',
        patterns: ['app/**/page.tsx']
    },
    styles: {
        name: 'Styles',
        icon: '🎨',
        patterns: ['app/**/*.css', '*.css']
    },
    config: {
        name: 'Config',
        icon: '⚙️',
        patterns: ['*.config.ts', '*.config.js', 'lib/**/*.ts']
    },
    api: {
        name: 'API Routes',
        icon: '🔌',
        patterns: ['app/api/**/*.ts']
    }
};

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action') || 'list';
        const filePath = searchParams.get('file');
        const component = searchParams.get('component');
        
        const workspaceRoot = process.cwd();
        
        if (action === 'read' && filePath) {
            // Read a specific file
            const fullPath = path.join(workspaceRoot, filePath);
            
            // Security: Ensure path is within workspace
            if (!fullPath.startsWith(workspaceRoot)) {
                return NextResponse.json({ success: false, error: 'Invalid path' }, { status: 400 });
            }
            
            try {
                const content = await fs.readFile(fullPath, 'utf-8');
                const stats = await fs.stat(fullPath);
                const ext = path.extname(filePath).slice(1);
                
                return NextResponse.json({
                    success: true,
                    file: {
                        path: filePath,
                        name: path.basename(filePath),
                        content,
                        language: getLanguage(ext),
                        size: stats.size,
                        modified: stats.mtime.toISOString()
                    }
                });
            } catch (err) {
                return NextResponse.json({ 
                    success: false, 
                    error: `File not found: ${filePath}` 
                }, { status: 404 });
            }
        }
        
        if (action === 'component' && component) {
            // Get files for a specific component
            const files = COMPONENT_FILE_MAP[component] || [];
            const fileContents = [];
            
            for (const file of files) {
                const fullPath = path.join(workspaceRoot, file);
                try {
                    const content = await fs.readFile(fullPath, 'utf-8');
                    const stats = await fs.stat(fullPath);
                    const ext = path.extname(file).slice(1);
                    
                    fileContents.push({
                        path: file,
                        name: path.basename(file),
                        content,
                        language: getLanguage(ext),
                        size: stats.size,
                        modified: stats.mtime.toISOString()
                    });
                } catch {
                    // File doesn't exist, skip
                }
            }
            
            return NextResponse.json({
                success: true,
                component,
                files: fileContents
            });
        }
        
        if (action === 'list') {
            // List all available files organized by category
            const fileTree = await buildFileTree(workspaceRoot);
            
            return NextResponse.json({
                success: true,
                tree: fileTree,
                componentMap: COMPONENT_FILE_MAP,
                categories: FILE_CATEGORIES
            });
        }
        
        if (action === 'search') {
            const query = searchParams.get('q') || '';
            const results = await searchFiles(workspaceRoot, query);
            
            return NextResponse.json({
                success: true,
                results
            });
        }
        
        if (action === 'search-content') {
            const content = searchParams.get('content') || '';
            if (!content || content.length < 10) {
                return NextResponse.json({ success: false, error: 'Content too short' }, { status: 400 });
            }
            
            const results = await searchByContent(workspaceRoot, content);
            
            return NextResponse.json({
                success: true,
                results,
                searchedContent: content.slice(0, 100)
            });
        }
        
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
        
    } catch (error) {
        console.error('Design Files API error:', error);
        return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500 });
    }
}

import { fileOnDevServer, isProduction, hasDevServer } from '@/lib/dev-server-client';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, filePath, content } = body;
        
        const workspaceRoot = process.cwd();
        
        if (action === 'save' && filePath && content !== undefined) {
            // ═══════════════════════════════════════════════════════════════
            // 🌐 PRODUCTION MODE: Forward to Dev Server
            // ═══════════════════════════════════════════════════════════════
            if (isProduction) {
                if (!hasDevServer) {
                    return NextResponse.json({
                        success: false,
                        error: `⚠️ File editing requires Dev Server.\n\nDev Server belum dikonfigurasi.\n\n💡 Setup Dev Server:\n1. Deploy dev-server/ ke Railway\n2. Set DEV_SERVER_URL dan DEV_SERVER_TOKEN di Vercel\n\n📋 File: ${filePath}`,
                        isProduction: true,
                        filePath,
                        code: content.slice(0, 500) + (content.length > 500 ? '\n...(truncated)' : '')
                    }, { status: 200 });
                }
                
                console.log(`[Design Files] Forwarding save to Dev Server`);
                const result = await fileOnDevServer('write', filePath, content);
                
                if (result.success) {
                    return NextResponse.json({
                        success: true,
                        message: `✅ File saved via Dev Server: ${filePath}`,
                        path: filePath,
                        source: 'dev-server'
                    });
                } else {
                    return NextResponse.json({
                        success: false,
                        error: result.error || 'Failed to save via Dev Server',
                        source: 'dev-server'
                    }, { status: 200 });
                }
            }
            
            // ═══════════════════════════════════════════════════════════════
            // 💻 LOCAL MODE: Save directly
            // ═══════════════════════════════════════════════════════════════
            
            const fullPath = path.join(workspaceRoot, filePath);
            
            // Security: Ensure path is within workspace
            if (!fullPath.startsWith(workspaceRoot)) {
                return NextResponse.json({ success: false, error: 'Invalid path' }, { status: 400 });
            }
            
            // Ensure directory exists (for new files)
            const dir = path.dirname(fullPath);
            await fs.mkdir(dir, { recursive: true });
            
            // Create backup before saving (only if file exists)
            try {
                const existing = await fs.readFile(fullPath, 'utf-8');
                const backupDir = path.join(workspaceRoot, 'backups', 'design-studio');
                await fs.mkdir(backupDir, { recursive: true });
                
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const backupPath = path.join(backupDir, `${path.basename(filePath)}.${timestamp}.bak`);
                await fs.writeFile(backupPath, existing, 'utf-8');
                console.log(`[Design Files] Backup created: ${backupPath}`);
            } catch {
                // No existing file to backup (new file creation)
                console.log(`[Design Files] Creating new file: ${filePath}`);
            }
            
            // Save the file
            await fs.writeFile(fullPath, content, 'utf-8');
            console.log(`[Design Files] File saved successfully: ${filePath}`);
            
            return NextResponse.json({
                success: true,
                message: `File saved: ${filePath}`,
                path: filePath,
                created: true
            });
        }
        
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
        
    } catch (error) {
        console.error('Design Files API POST error:', error);
        return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500 });
    }
}

// Helper functions
function getLanguage(ext: string): string {
    const langMap: Record<string, string> = {
        'tsx': 'typescript',
        'ts': 'typescript',
        'jsx': 'javascript',
        'js': 'javascript',
        'css': 'css',
        'scss': 'scss',
        'json': 'json',
        'md': 'markdown',
        'html': 'html'
    };
    return langMap[ext] || 'text';
}

async function buildFileTree(root: string) {
    // Build a proper tree structure like VS Code
    const tree: Record<string, any[]> = {
        components: [],
        pages: [],
        styles: [],
        config: [],
        api: [],
        lib: [],
        hooks: [],
        contexts: [],
        types: [],
        data: [],
        public: []
    };
    
    // Scan components directory - with subdirectories
    try {
        const componentsDir = path.join(root, 'components');
        const componentFiles = await scanDirectoryRecursive(componentsDir, root, 3); // depth 3
        tree.components = componentFiles.filter(f => 
            f.path.endsWith('.tsx') || f.path.endsWith('.ts') || f.isFolder
        );
    } catch {}
    
    // Scan app directory for pages - full structure
    try {
        const appDir = path.join(root, 'app');
        const appFiles = await scanDirectoryRecursive(appDir, root, 4); // depth 4
        tree.pages = appFiles.filter(f => f.name === 'page.tsx' || f.name === 'layout.tsx' || f.isFolder);
        tree.styles = appFiles.filter(f => f.path.endsWith('.css'));
        tree.api = appFiles.filter(f => f.path.includes('/api/') && (f.path.endsWith('.ts') || f.isFolder));
    } catch {}
    
    // Scan root for config files
    try {
        const rootFiles = await fs.readdir(root);
        for (const file of rootFiles) {
            const ext = path.extname(file);
            if (ext === '.ts' || ext === '.js' || ext === '.json' || ext === '.mjs' || ext === '.cjs') {
                if (file.includes('config') || file === 'package.json' || file === 'tsconfig.json' || 
                    file === 'next.config.js' || file === 'tailwind.config.ts' || file === 'biome.json') {
                    try {
                        const stats = await fs.stat(path.join(root, file));
                        tree.config.push({
                            name: file,
                            path: file,
                            size: stats.size,
                            modified: stats.mtime.toISOString(),
                            isFolder: false
                        });
                    } catch {}
                }
            }
        }
    } catch {}
    
    // Scan lib directory - utility functions
    try {
        const libDir = path.join(root, 'lib');
        const libFiles = await scanDirectoryRecursive(libDir, root, 2);
        tree.lib = libFiles.filter(f => f.path.endsWith('.ts') || f.path.endsWith('.tsx') || f.isFolder);
    } catch {}
    
    // Scan hooks directory - React hooks
    try {
        const hooksDir = path.join(root, 'hooks');
        const hookFiles = await scanDirectoryRecursive(hooksDir, root, 2);
        tree.hooks = hookFiles.filter(f => f.path.endsWith('.ts') || f.path.endsWith('.tsx') || f.isFolder);
    } catch {}
    
    // Scan contexts directory - React contexts
    try {
        const contextsDir = path.join(root, 'contexts');
        const contextFiles = await scanDirectoryRecursive(contextsDir, root, 2);
        tree.contexts = contextFiles.filter(f => f.path.endsWith('.ts') || f.path.endsWith('.tsx') || f.isFolder);
    } catch {}
    
    // Scan types directory - TypeScript types
    try {
        const typesDir = path.join(root, 'types');
        const typeFiles = await scanDirectoryRecursive(typesDir, root, 2);
        tree.types = typeFiles.filter(f => f.path.endsWith('.ts') || f.path.endsWith('.d.ts') || f.isFolder);
    } catch {}
    
    // Scan data directory
    try {
        const dataDir = path.join(root, 'data');
        const dataFiles = await scanDirectoryRecursive(dataDir, root, 2);
        tree.data = dataFiles;
    } catch {}
    
    // Scan public directory (images, assets)
    try {
        const publicDir = path.join(root, 'public');
        const publicFiles = await scanDirectoryRecursive(publicDir, root, 2);
        tree.public = publicFiles.filter(f => 
            f.path.endsWith('.svg') || f.path.endsWith('.png') || f.path.endsWith('.jpg') || 
            f.path.endsWith('.ico') || f.path.endsWith('.webp') || f.isFolder
        ).slice(0, 50); // Limit public files
    } catch {}
    
    return tree;
}

// Recursive scan with proper folder structure
async function scanDirectoryRecursive(dir: string, root: string, maxDepth: number, currentDepth = 0): Promise<any[]> {
    const results: any[] = [];
    
    if (currentDepth > maxDepth) return results;
    
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        // Sort: folders first, then files
        const sorted = entries.sort((a, b) => {
            if (a.isDirectory() && !b.isDirectory()) return -1;
            if (!a.isDirectory() && b.isDirectory()) return 1;
            return a.name.localeCompare(b.name);
        });
        
        for (const entry of sorted) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.relative(root, fullPath).replace(/\\/g, '/');
            
            // Skip hidden files, node_modules, .next, backups, etc
            if (entry.name.startsWith('.') || 
                entry.name === 'node_modules' || 
                entry.name === '.next' ||
                entry.name === 'backups' ||
                entry.name === '.git' ||
                entry.name === '.vercel') {
                continue;
            }
            
            if (entry.isDirectory()) {
                const children = await scanDirectoryRecursive(fullPath, root, maxDepth, currentDepth + 1);
                results.push({
                    name: entry.name,
                    path: relativePath,
                    isFolder: true,
                    children: children,
                    expanded: false
                });
            } else if (entry.isFile()) {
                try {
                    const stats = await fs.stat(fullPath);
                    results.push({
                        name: entry.name,
                        path: relativePath,
                        size: stats.size,
                        modified: stats.mtime.toISOString(),
                        isFolder: false
                    });
                } catch {}
            }
        }
    } catch {}
    
    return results;
}

async function searchFiles(root: string, query: string): Promise<any[]> {
    const results: any[] = [];
    const q = query.toLowerCase();
    
    // Search in components and app directories
    const dirs = ['components', 'app', 'lib'];
    
    for (const dir of dirs) {
        try {
            const files = await scanDirectoryRecursive(path.join(root, dir), root, 3);
            for (const file of files) {
                if (file.name.toLowerCase().includes(q) || file.path.toLowerCase().includes(q)) {
                    results.push(file);
                }
            }
        } catch {}
    }
    
    return results.slice(0, 50); // Limit results
}

// Search files by content (for finding where HTML code is located)
async function searchByContent(root: string, content: string): Promise<{ path: string; lineNumber: number; snippet: string; matchScore: number }[]> {
    const results: { path: string; lineNumber: number; snippet: string; matchScore: number }[] = [];
    
    // ═══════════════════════════════════════════════════════════════
    // 🧠 SMART CONTENT EXTRACTION - More accurate pattern matching
    // ═══════════════════════════════════════════════════════════════
    
    const searchPatterns: { pattern: string; weight: number; type: string }[] = [];
    
    // Priority 1: Extract SPECIFIC text content (highest weight) - like "Sekbid 1 - Keagamaan"
    const textMatches = content.match(/>([^<]{5,80})</g);
    if (textMatches) {
        textMatches.forEach(m => {
            const text = m.slice(1, -1).trim();
            // Prioritize text with meaningful words (not just styling keywords)
            if (text && text.length > 10 && !/^(bg-|text-|flex|grid|px-|py-)/i.test(text)) {
                searchPatterns.push({ pattern: text, weight: 10, type: 'text' });
            } else if (text && text.length > 5) {
                searchPatterns.push({ pattern: text, weight: 5, type: 'text' });
            }
        });
    }
    
    // Priority 2: Extract UNIQUE class combinations (not individual generic classes)
    const classMatches = content.match(/(?:class|className)=["']([^"']+)["']/g);
    if (classMatches) {
        classMatches.forEach(m => {
            const classes = m.match(/["']([^"']+)["']/);
            if (classes && classes[1]) {
                // Get the FULL class string as a pattern (more unique)
                const fullClassString = classes[1];
                if (fullClassString.length > 30) {
                    // Long class strings are more unique
                    searchPatterns.push({ pattern: fullClassString, weight: 8, type: 'fullClass' });
                }
                
                // Also extract specific/unique individual classes
                const classList = classes[1].split(/\s+/);
                classList.forEach(c => {
                    // Skip generic utility classes, keep specific ones
                    const genericPatterns = /^(flex|grid|bg-|text-|px-|py-|p-|m-|mt-|mb-|ml-|mr-|mx-|my-|rounded|transition|hover:|dark:|sm:|md:|lg:|xl:|w-|h-)$/;
                    if (c.length > 10 && !genericPatterns.test(c)) {
                        searchPatterns.push({ pattern: c, weight: 3, type: 'class' });
                    }
                });
            }
        });
    }
    
    // Priority 3: Extract function/component names
    const funcMatches = content.match(/function\s+(\w+)|const\s+(\w+)\s*=/g);
    if (funcMatches) {
        funcMatches.forEach(m => {
            const name = m.match(/(?:function|const)\s+(\w+)/);
            if (name && name[1] && name[1].length > 3) {
                searchPatterns.push({ pattern: name[1], weight: 7, type: 'function' });
            }
        });
    }
    
    // Sort patterns by weight and take top unique ones
    const sortedPatterns = searchPatterns
        .sort((a, b) => b.weight - a.weight)
        .filter((p, i, arr) => arr.findIndex(x => x.pattern === p.pattern) === i)
        .slice(0, 5);
    
    if (sortedPatterns.length === 0) return results;
    
    // Search directories - prioritize components and app pages
    const dirs = ['components', 'app'];
    const extensions = ['.tsx', '.jsx', '.ts', '.js'];
    
    // Skip files that are unlikely to be the source
    const skipFiles = ['WebGLIntro.tsx', 'LoadingScreen.tsx', 'ParticleBackground.tsx', '3d/', 'animations/'];
    
    const searchInDir = async (dir: string): Promise<void> => {
        try {
            const entries = await fs.readdir(path.join(root, dir), { withFileTypes: true });
            
            for (const entry of entries) {
                if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
                
                const fullPath = path.join(root, dir, entry.name);
                const relativePath = `${dir}/${entry.name}`;
                
                // Skip unlikely source files
                if (skipFiles.some(skip => relativePath.includes(skip))) continue;
                
                if (entry.isDirectory()) {
                    await searchInDir(relativePath);
                } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
                    try {
                        const fileContent = await fs.readFile(fullPath, 'utf-8');
                        
                        // Calculate match score based on weighted patterns
                        let matchScore = 0;
                        let firstMatchLine = 0;
                        let bestSnippet = '';
                        
                        for (const { pattern, weight } of sortedPatterns) {
                            const idx = fileContent.indexOf(pattern);
                            if (idx !== -1) {
                                matchScore += weight;
                                
                                // Track first match for line number
                                if (firstMatchLine === 0) {
                                    const beforeText = fileContent.slice(0, idx);
                                    firstMatchLine = beforeText.split('\n').length;
                                    
                                    // Get snippet
                                    const lines = fileContent.split('\n');
                                    const startLine = Math.max(0, firstMatchLine - 3);
                                    const endLine = Math.min(lines.length, firstMatchLine + 5);
                                    bestSnippet = lines.slice(startLine, endLine).join('\n');
                                }
                            }
                        }
                        
                        // Only include files with significant matches
                        if (matchScore >= 5) {
                            results.push({
                                path: relativePath,
                                lineNumber: firstMatchLine,
                                snippet: bestSnippet.slice(0, 500),
                                matchScore
                            });
                        }
                    } catch {}
                }
                
                if (results.length >= 10) return; // Get more candidates for sorting
            }
        } catch {}
    };
    
    for (const dir of dirs) {
        await searchInDir(dir);
    }
    
    // Sort results by match score (highest first)
    results.sort((a, b) => b.matchScore - a.matchScore);
    
    // Return top 5 results
    return results.slice(0, 5);
}
