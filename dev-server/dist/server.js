"use strict";
// ═══════════════════════════════════════════════════════════════════════════
// 🖥️ WEBOSIS DEV SERVER - Remote Terminal for Design Studio
// ═══════════════════════════════════════════════════════════════════════════
// 
// This is a separate service that runs on Railway with full terminal access.
// Design Studio on Vercel sends commands here, and this server executes them.
//
// Features:
// - npm install/remove packages
// - git add, commit, push
// - File create/edit/delete
// - Any terminal command
//
// Deploy this to Railway as a separate service!
// ═══════════════════════════════════════════════════════════════════════════
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Security: Only allow requests from your domain
const ALLOWED_ORIGINS = [
    'https://webosis-archive.vercel.app',
    'https://osis-smk-fithrah-insani.vercel.app',
    'http://localhost:3000',
    process.env.ALLOWED_ORIGIN
].filter(Boolean);
// Secret token for authentication
const AUTH_TOKEN = process.env.DEV_SERVER_TOKEN || 'your-secret-token';
// Repo configuration
const REPO_URL = process.env.GITHUB_REPO_URL || 'https://github.com/Ashera12/webosis-archive.git';
const REPO_DIR = '/app/workspace';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // For authenticated push
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
// Auth middleware
const authMiddleware = (req, res, next) => {
    const token = req.headers['x-auth-token'] || req.query.token;
    if (token !== AUTH_TOKEN) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    next();
};
// ═══════════════════════════════════════════════════════════════════════════
// 📂 REPO MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════
// Initialize/clone repo on startup
async function initRepo() {
    try {
        // Check if repo already exists
        try {
            await promises_1.default.access(path_1.default.join(REPO_DIR, '.git'));
            console.log('📂 Repo already cloned, pulling latest...');
            await execAsync('git pull', { cwd: REPO_DIR });
        }
        catch {
            console.log('📥 Cloning repository...');
            await promises_1.default.mkdir(REPO_DIR, { recursive: true });
            // Use token for authenticated clone if available
            let cloneUrl = REPO_URL;
            if (GITHUB_TOKEN) {
                cloneUrl = REPO_URL.replace('https://', `https://${GITHUB_TOKEN}@`);
            }
            await execAsync(`git clone ${cloneUrl} ${REPO_DIR}`);
            console.log('✅ Repository cloned!');
        }
        // Configure git
        await execAsync('git config user.email "dev-server@webosis.app"', { cwd: REPO_DIR });
        await execAsync('git config user.name "Webosis Dev Server"', { cwd: REPO_DIR });
        // Install dependencies
        console.log('📦 Installing dependencies...');
        await execAsync('npm install', { cwd: REPO_DIR });
        console.log('✅ Dependencies installed!');
    }
    catch (err) {
        console.error('❌ Failed to initialize repo:', err);
    }
}
// ═══════════════════════════════════════════════════════════════════════════
// 🔌 API ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════
// Root route
app.get('/', (req, res) => {
    res.json({
        service: 'Webosis Dev Server',
        version: '1.0.0',
        status: 'running',
        endpoints: [
            'GET  /health - Health check',
            'POST /api/exec - Execute command',
            'POST /api/npm - NPM operations',
            'POST /api/git - Git operations',
            'POST /api/file - File operations',
            'GET  /api/files - List files'
        ],
        docs: 'https://github.com/Ashera12/webosis-archive/tree/main/dev-server'
    });
});
// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'webosis-dev-server',
        repoDir: REPO_DIR,
        timestamp: new Date().toISOString(),
        config: {
            hasGithubToken: !!GITHUB_TOKEN,
            githubTokenLength: GITHUB_TOKEN?.length || 0,
            repoUrl: REPO_URL,
            hasAuthToken: !!AUTH_TOKEN,
            authTokenPreview: AUTH_TOKEN ? `${AUTH_TOKEN.slice(0, 4)}...${AUTH_TOKEN.slice(-4)}` : 'not-set'
        }
    });
});
// Debug endpoint - test git push (temporary)
app.get('/api/test-git', async (req, res) => {
    try {
        // Check git remote
        const { stdout: remoteInfo } = await execAsync('git remote -v', { cwd: REPO_DIR });
        // Check git status
        const { stdout: statusInfo } = await execAsync('git status --short', { cwd: REPO_DIR });
        // Try a simple git operation
        let pushTest = 'not attempted';
        if (GITHUB_TOKEN) {
            try {
                const remoteUrl = REPO_URL.replace('https://', `https://${GITHUB_TOKEN}@`);
                await execAsync(`git remote set-url origin ${remoteUrl}`, { cwd: REPO_DIR });
                const { stdout } = await execAsync('git push --dry-run origin main 2>&1', { cwd: REPO_DIR });
                pushTest = 'SUCCESS: ' + (stdout || 'Push would succeed');
            }
            catch (err) {
                pushTest = 'FAILED: ' + err.message;
            }
        }
        else {
            pushTest = 'GITHUB_TOKEN not set';
        }
        res.json({
            success: true,
            gitRemote: remoteInfo,
            gitStatus: statusInfo || 'No changes',
            pushTest,
            config: {
                hasGithubToken: !!GITHUB_TOKEN,
                tokenLength: GITHUB_TOKEN?.length || 0
            }
        });
    }
    catch (err) {
        res.json({ success: false, error: err.message });
    }
});
// Execute any command - SUPER ADMIN MODE (no restrictions)
app.post('/api/exec', authMiddleware, async (req, res) => {
    try {
        const { command, cwd } = req.body;
        if (!command) {
            return res.status(400).json({ success: false, error: 'Command required' });
        }
        // No command blocking - Super admin has full access
        // Security is handled by AUTH_TOKEN authentication
        const workDir = cwd ? path_1.default.join(REPO_DIR, cwd) : REPO_DIR;
        console.log(`🖥️ Executing: ${command}`);
        const { stdout, stderr } = await execAsync(command, {
            cwd: workDir,
            timeout: 300000, // 5 min timeout for long operations
            maxBuffer: 50 * 1024 * 1024, // 50MB buffer
            env: {
                ...process.env,
                // Inject GitHub token for git commands
                GIT_ASKPASS: 'echo',
                GIT_TERMINAL_PROMPT: '0'
            }
        });
        res.json({
            success: true,
            stdout,
            stderr,
            command,
            cwd: workDir
        });
    }
    catch (err) {
        console.error('Command error:', err.message);
        res.json({
            success: false,
            error: err.message,
            stdout: err.stdout || '',
            stderr: err.stderr || ''
        });
    }
});
// NPM operations
app.post('/api/npm', authMiddleware, async (req, res) => {
    try {
        const { action, packages } = req.body;
        let command = '';
        switch (action) {
            case 'install':
                command = packages ? `npm install ${packages.join(' ')}` : 'npm install';
                break;
            case 'uninstall':
            case 'remove':
                if (!packages?.length) {
                    return res.status(400).json({ success: false, error: 'Package name required' });
                }
                command = `npm uninstall ${packages.join(' ')}`;
                break;
            case 'update':
                command = packages ? `npm update ${packages.join(' ')}` : 'npm update';
                break;
            case 'list':
                command = 'npm list --depth=0';
                break;
            default:
                return res.status(400).json({ success: false, error: 'Invalid action' });
        }
        console.log(`📦 NPM: ${command}`);
        const { stdout, stderr } = await execAsync(command, { cwd: REPO_DIR, timeout: 300000 });
        res.json({
            success: true,
            action,
            packages,
            stdout,
            stderr
        });
    }
    catch (err) {
        res.json({
            success: false,
            error: err.message,
            stderr: err.stderr || ''
        });
    }
});
// Git operations
app.post('/api/git', authMiddleware, async (req, res) => {
    try {
        const { action, message, files, branch } = req.body;
        let command = '';
        let result = {};
        switch (action) {
            case 'status':
                command = 'git status --short';
                break;
            case 'add':
                command = files ? `git add ${files.join(' ')}` : 'git add -A';
                break;
            case 'commit':
                if (!message) {
                    return res.status(400).json({ success: false, error: 'Commit message required' });
                }
                // First add all changes
                await execAsync('git add -A', { cwd: REPO_DIR });
                command = `git commit -m "${message.replace(/"/g, '\\"')}"`;
                break;
            case 'push':
                // Configure remote with token if available
                if (GITHUB_TOKEN) {
                    const remoteUrl = REPO_URL.replace('https://', `https://${GITHUB_TOKEN}@`);
                    await execAsync(`git remote set-url origin ${remoteUrl}`, { cwd: REPO_DIR });
                }
                else {
                    return res.status(400).json({
                        success: false,
                        error: 'GITHUB_TOKEN not configured on Railway. Please add it to environment variables.',
                        help: 'Go to Railway Dashboard → Variables → Add GITHUB_TOKEN with your Personal Access Token'
                    });
                }
                command = `git push origin ${branch || 'main'}`;
                break;
            case 'pull':
                command = `git pull origin ${branch || 'main'}`;
                break;
            case 'log':
                command = 'git log --oneline -10';
                break;
            case 'diff':
                command = 'git diff --stat';
                break;
            case 'commit-push':
                // All in one: add, commit, push
                if (!message) {
                    return res.status(400).json({ success: false, error: 'Commit message required' });
                }
                if (!GITHUB_TOKEN) {
                    return res.status(400).json({
                        success: false,
                        error: 'GITHUB_TOKEN not configured on Railway. Please add it to environment variables.',
                        help: 'Go to Railway Dashboard → Variables → Add GITHUB_TOKEN with your Personal Access Token'
                    });
                }
                await execAsync('git add -A', { cwd: REPO_DIR });
                try {
                    await execAsync(`git commit -m "${message.replace(/"/g, '\\"')}"`, { cwd: REPO_DIR });
                }
                catch (commitErr) {
                    // If nothing to commit, that's ok
                    if (!commitErr.message?.includes('nothing to commit')) {
                        throw commitErr;
                    }
                    return res.json({
                        success: true,
                        action: 'commit-push',
                        message: 'No changes to commit',
                        stdout: 'Already up to date'
                    });
                }
                const remoteUrl = REPO_URL.replace('https://', `https://${GITHUB_TOKEN}@`);
                await execAsync(`git remote set-url origin ${remoteUrl}`, { cwd: REPO_DIR });
                const pushResult = await execAsync(`git push origin ${branch || 'main'}`, { cwd: REPO_DIR });
                return res.json({
                    success: true,
                    action: 'commit-push',
                    message,
                    stdout: pushResult.stdout,
                    stderr: pushResult.stderr
                });
            default:
                return res.status(400).json({ success: false, error: 'Invalid git action' });
        }
        console.log(`🔀 Git: ${command}`);
        const { stdout, stderr } = await execAsync(command, { cwd: REPO_DIR });
        res.json({
            success: true,
            action,
            stdout,
            stderr
        });
    }
    catch (err) {
        // Handle "nothing to commit" as success
        if (err.message?.includes('nothing to commit')) {
            return res.json({
                success: true,
                action: req.body.action,
                message: 'Nothing to commit, working tree clean'
            });
        }
        res.json({
            success: false,
            error: err.message,
            stderr: err.stderr || ''
        });
    }
});
// File operations
app.post('/api/file', authMiddleware, async (req, res) => {
    try {
        const { action, filePath, content } = req.body;
        if (!filePath) {
            return res.status(400).json({ success: false, error: 'File path required' });
        }
        const fullPath = path_1.default.join(REPO_DIR, filePath);
        // Security: Ensure path is within repo
        if (!fullPath.startsWith(REPO_DIR)) {
            return res.status(403).json({ success: false, error: 'Invalid path' });
        }
        switch (action) {
            case 'read':
                const fileContent = await promises_1.default.readFile(fullPath, 'utf-8');
                return res.json({ success: true, content: fileContent, path: filePath });
            case 'write':
            case 'save':
                // Create directory if needed
                await promises_1.default.mkdir(path_1.default.dirname(fullPath), { recursive: true });
                await promises_1.default.writeFile(fullPath, content || '', 'utf-8');
                console.log(`📝 File saved: ${filePath}`);
                return res.json({ success: true, message: `File saved: ${filePath}`, path: filePath });
            case 'delete':
                await promises_1.default.unlink(fullPath);
                console.log(`🗑️ File deleted: ${filePath}`);
                return res.json({ success: true, message: `File deleted: ${filePath}`, path: filePath });
            case 'exists':
                try {
                    await promises_1.default.access(fullPath);
                    return res.json({ success: true, exists: true, path: filePath });
                }
                catch {
                    return res.json({ success: true, exists: false, path: filePath });
                }
            default:
                return res.status(400).json({ success: false, error: 'Invalid file action' });
        }
    }
    catch (err) {
        res.json({
            success: false,
            error: err.message
        });
    }
});
// List files
app.get('/api/files', authMiddleware, async (req, res) => {
    try {
        const dir = req.query.dir || '';
        const fullPath = path_1.default.join(REPO_DIR, dir);
        const items = await promises_1.default.readdir(fullPath, { withFileTypes: true });
        const files = items.map(item => ({
            name: item.name,
            isDirectory: item.isDirectory(),
            path: path_1.default.join(dir, item.name)
        }));
        res.json({ success: true, files, dir });
    }
    catch (err) {
        res.json({ success: false, error: err.message });
    }
});
// ═══════════════════════════════════════════════════════════════════════════
// 🚀 START SERVER
// ═══════════════════════════════════════════════════════════════════════════
app.listen(PORT, async () => {
    console.log(`\n🚀 Webosis Dev Server running on port ${PORT}`);
    console.log('═══════════════════════════════════════════════════════');
    console.log('📂 Initializing repository...');
    await initRepo();
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ Dev Server ready!');
    console.log(`\nEndpoints:`);
    console.log(`  GET  /health        - Health check`);
    console.log(`  POST /api/exec      - Execute any command`);
    console.log(`  POST /api/npm       - NPM operations`);
    console.log(`  POST /api/git       - Git operations`);
    console.log(`  POST /api/file      - File operations`);
    console.log(`  GET  /api/files     - List files`);
    console.log('\n');
});
exports.default = app;
//# sourceMappingURL=server.js.map