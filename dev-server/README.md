# Webosis Dev Server

Remote terminal server for Design Studio. Deploy this to Railway as a **separate service**.

## Features

- ✅ Execute any terminal command
- ✅ NPM: install, uninstall, update packages
- ✅ Git: add, commit, push, pull, status
- ✅ File: create, read, update, delete
- ✅ Full filesystem access

## Deploy to Railway

1. Create new Railway project
2. Deploy from this folder (`dev-server/`)
3. Set environment variables:

```env
# Required
GITHUB_TOKEN=ghp_xxxx          # GitHub Personal Access Token with repo scope
GITHUB_REPO_URL=https://github.com/Ashera12/webosis-archive.git
DEV_SERVER_TOKEN=your-secret   # Auth token for API calls

# Optional
ALLOWED_ORIGIN=https://webosis-archive.vercel.app
PORT=3001
```

## Get GitHub Token

1. Go to https://github.com/settings/tokens
2. Generate new token (classic)
3. Select scopes: `repo` (full control)
4. Copy and save token

## API Endpoints

### Health Check
```
GET /health
```

### Execute Command
```
POST /api/exec
Headers: x-auth-token: your-secret
Body: { "command": "npm list" }
```

### NPM Operations
```
POST /api/npm
Headers: x-auth-token: your-secret
Body: { "action": "install", "packages": ["lodash", "axios"] }
Body: { "action": "uninstall", "packages": ["lodash"] }
Body: { "action": "list" }
```

### Git Operations
```
POST /api/git
Headers: x-auth-token: your-secret
Body: { "action": "status" }
Body: { "action": "commit", "message": "feat: add new feature" }
Body: { "action": "push" }
Body: { "action": "commit-push", "message": "feat: add new feature" }
```

### File Operations
```
POST /api/file
Headers: x-auth-token: your-secret
Body: { "action": "read", "filePath": "package.json" }
Body: { "action": "write", "filePath": "test.txt", "content": "Hello" }
Body: { "action": "delete", "filePath": "test.txt" }
```

## Connect from Design Studio

After deploying, add the Dev Server URL to your Vercel environment:

```env
DEV_SERVER_URL=https://your-dev-server.railway.app
DEV_SERVER_TOKEN=your-secret
```
