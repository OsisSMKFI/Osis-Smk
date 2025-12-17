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
        
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
        
    } catch (error) {
        console.error('Design Files API error:', error);
        return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, filePath, content } = body;
        
        const workspaceRoot = process.cwd();
        
        if (action === 'save' && filePath && content !== undefined) {
            const fullPath = path.join(workspaceRoot, filePath);
            
            // Security: Ensure path is within workspace
            if (!fullPath.startsWith(workspaceRoot)) {
                return NextResponse.json({ success: false, error: 'Invalid path' }, { status: 400 });
            }
            
            // Create backup before saving
            try {
                const existing = await fs.readFile(fullPath, 'utf-8');
                const backupDir = path.join(workspaceRoot, 'backups', 'design-studio');
                await fs.mkdir(backupDir, { recursive: true });
                
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const backupPath = path.join(backupDir, `${path.basename(filePath)}.${timestamp}.bak`);
                await fs.writeFile(backupPath, existing, 'utf-8');
            } catch {
                // No existing file to backup
            }
            
            // Save the file
            await fs.writeFile(fullPath, content, 'utf-8');
            
            return NextResponse.json({
                success: true,
                message: `File saved: ${filePath}`,
                path: filePath
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
    const tree: Record<string, any[]> = {
        components: [],
        pages: [],
        styles: [],
        config: [],
        api: [],
        lib: [],
        hooks: [],
        contexts: [],
        types: []
    };
    
    // Scan components directory
    try {
        const componentsDir = path.join(root, 'components');
        const componentFiles = await scanDirectory(componentsDir, root);
        tree.components = componentFiles.filter(f => f.path.endsWith('.tsx') || f.path.endsWith('.ts'));
    } catch {}
    
    // Scan app directory for pages
    try {
        const appDir = path.join(root, 'app');
        const appFiles = await scanDirectory(appDir, root);
        tree.pages = appFiles.filter(f => f.name === 'page.tsx');
        tree.styles = appFiles.filter(f => f.path.endsWith('.css'));
        tree.api = appFiles.filter(f => f.path.includes('/api/') && f.path.endsWith('.ts'));
    } catch {}
    
    // Scan root for config files
    try {
        const rootFiles = await fs.readdir(root);
        for (const file of rootFiles) {
            if (file.endsWith('.config.ts') || file.endsWith('.config.js') || file === 'tailwind.config.ts') {
                const stats = await fs.stat(path.join(root, file));
                tree.config.push({
                    name: file,
                    path: file,
                    size: stats.size,
                    modified: stats.mtime.toISOString()
                });
            }
        }
    } catch {}
    
    // Scan lib directory - utility functions
    try {
        const libDir = path.join(root, 'lib');
        const libFiles = await scanDirectory(libDir, root);
        tree.lib = libFiles.filter(f => f.path.endsWith('.ts') || f.path.endsWith('.tsx'));
    } catch {}
    
    // Scan hooks directory - React hooks
    try {
        const hooksDir = path.join(root, 'hooks');
        const hookFiles = await scanDirectory(hooksDir, root);
        tree.hooks = hookFiles.filter(f => f.path.endsWith('.ts') || f.path.endsWith('.tsx'));
    } catch {}
    
    // Scan contexts directory - React contexts
    try {
        const contextsDir = path.join(root, 'contexts');
        const contextFiles = await scanDirectory(contextsDir, root);
        tree.contexts = contextFiles.filter(f => f.path.endsWith('.ts') || f.path.endsWith('.tsx'));
    } catch {}
    
    // Scan types directory - TypeScript types
    try {
        const typesDir = path.join(root, 'types');
        const typeFiles = await scanDirectory(typesDir, root);
        tree.types = typeFiles.filter(f => f.path.endsWith('.ts') || f.path.endsWith('.d.ts'));
    } catch {}
    
    return tree;
}

async function scanDirectory(dir: string, root: string): Promise<any[]> {
    const results: any[] = [];
    
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.relative(root, fullPath).replace(/\\/g, '/');
            
            // Skip node_modules, .next, backups
            if (entry.name.startsWith('.') || 
                entry.name === 'node_modules' || 
                entry.name === '.next' ||
                entry.name === 'backups') {
                continue;
            }
            
            if (entry.isDirectory()) {
                const subFiles = await scanDirectory(fullPath, root);
                results.push(...subFiles);
            } else if (entry.isFile()) {
                const stats = await fs.stat(fullPath);
                results.push({
                    name: entry.name,
                    path: relativePath,
                    size: stats.size,
                    modified: stats.mtime.toISOString()
                });
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
            const files = await scanDirectory(path.join(root, dir), root);
            for (const file of files) {
                if (file.name.toLowerCase().includes(q) || file.path.toLowerCase().includes(q)) {
                    results.push(file);
                }
            }
        } catch {}
    }
    
    return results.slice(0, 50); // Limit results
}
