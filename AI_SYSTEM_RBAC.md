# AI System - Role-Based Access Control

## 🎯 Overview

Sistem AI sekarang memiliki **2 mode berbeda** berdasarkan user role:

1. **AI Public** - Safe, limited access untuk pengunjung
2. **AI Super Admin** - Full database access dengan auto-fix capabilities

---

## 🔓 AI Super Admin (role: super_admin)

### Capabilities

**🔍 Full Database Access:**
- Query semua tabel dengan filter
- View complete database schema
- Execute SQL queries (dengan safety checks)
- Access system statistics

**🛠️ Auto-Fix & Repair:**
- Apply RLS policies
- Fix schema issues
- Execute safe SQL modifications
- Analyze and repair errors automatically

**📊 System Diagnostics:**
- View recent errors with stack traces
- Check table counts and statistics
- Analyze system health
- Debug complex issues

**⚡ Admin Commands:**
```
/help           - List all commands
/schema         - Show database schema
/stats          - Show system statistics
/sql <query>    - Execute SQL query
/query <table>  - Query table with filters
/errors list    - List recent errors
/analyze <id>   - AI analysis of error
/fix <id>       - Auto-fix error
/run <cmd>      - Execute terminal command
/config get     - View configuration
/config set     - Update configuration
/confirm        - Confirm pending action
/cancel         - Cancel pending action
/clear          - Clear chat history
```

### AI Context (Super Admin)

AI memiliki akses ke:
- **Database Schema** - Full table structure
- **Recent Errors** - Last 10 errors with details
- **System Stats** - Table counts, activity metrics
- **All Tables** - Read/write access via service role

**System Prompt Example:**
```
You are an AI Super Admin Assistant for OSIS SMK Informatika Fithrah Insani.

YOUR CAPABILITIES:
1. Database Access: Full read/write access to all tables
2. Auto-Fix: Can execute SQL, apply RLS policies, fix schema
3. Debugging: Analyze errors, suggest fixes, generate patches
4. Admin Commands: Execute /sql, /fix, /analyze commands
5. System Operations: Backup, restore, migrate data

CURRENT SYSTEM STATE:
[Database schema]
[Recent errors]
[System statistics]

You can:
- Query any table
- Fix RLS policies
- Execute SQL
- Analyze problems
- Auto-repair issues
```

### Usage Examples

**Query Database:**
```
User: Show me all users
AI: [Queries users table and shows results]

User: /query posts status=published limit=5
AI: [Executes query with filters]
```

**Execute SQL:**
```
User: /sql SELECT COUNT(*) FROM events WHERE event_date > NOW()
AI: [Confirms query] Type /confirm to execute
User: /confirm
AI: [Shows results]
```

**Fix Issues:**
```
User: Why are posts not showing?
AI: [Analyzes] RLS policy blocking public access.
    [Suggests] Create policy "allow_public_read"
    
User: Fix it
AI: [Generates fix] /fix <error_id>
    Type /confirm to apply
```

---

## 🔒 AI Public (role: member/guest)

### Capabilities

**📚 Public Information Only:**
- Read announcements
- Read upcoming events
- Read sekbid information
- General OSIS info

**❌ Restrictions:**
- NO database write access
- NO system commands
- NO admin operations
- NO personal data access

### AI Context (Public)

AI hanya bisa akses:
- Latest announcements (3 terbaru)
- Upcoming events (3 terdekat)
- Sekbid info (nama & deskripsi)
- Public static content

**System Prompt Example:**
```
You are a friendly AI Assistant for OSIS SMK Informatika Fithrah Insani.

YOUR PURPOSE:
Help students and visitors learn about OSIS activities.

CURRENT OSIS INFORMATION:
[Latest announcements]
[Upcoming events]
[Sekbid divisions]

WHAT YOU CAN HELP WITH:
- Explain OSIS structure
- Share event information
- Guide registration process
- Provide contact information

WHAT YOU CANNOT DO:
- Access private data
- Modify database
- Execute commands
- View user information
```

### Usage Examples

**General Questions:**
```
User: Apa itu OSIS?
AI: OSIS adalah Organisasi Siswa Intra Sekolah...

User: Event apa yang akan datang?
AI: [Shows 3 upcoming events from database]

User: Bagaimana cara daftar?
AI: [Explains registration process]
```

**Out of Scope:**
```
User: Show me all users
AI: Maaf, saya tidak bisa mengakses data pengguna.
    Saya hanya bisa membantu dengan informasi umum OSIS.
```

---

## 🏗️ Architecture

### File Structure

```
lib/
├── aiContext.ts              # AI context provider
│   ├── buildAIContext()      # Build role-based context
│   ├── getDatabaseSchema()   # Get schema for admin
│   ├── getRecentErrors()     # Get errors for admin
│   ├── getSystemStats()      # Get stats for admin
│   ├── getPublicOSISInfo()   # Get public info
│   └── executeAdminAction()  # Execute admin actions
│
├── adminChatCommands.ts      # Admin command handlers
│   ├── /help, /schema, /stats
│   ├── /sql, /query
│   ├── /errors, /analyze, /fix
│   └── /run, /config
│
app/api/
├── chat/send/route.ts        # Main chat endpoint
│   └── Uses buildAIContext()
│
├── ai/admin-action/route.ts  # Admin action endpoint
    └── Executes database operations
```

### Flow

**Public User:**
```
1. User sends message
2. buildAIContext() → mode: 'public'
3. AI gets public OSIS info only
4. AI responds with safe info
```

**Super Admin:**
```
1. Admin sends message
2. buildAIContext() → mode: 'admin'
3. AI gets full schema + errors + stats
4. AI can suggest fixes
5. Admin confirms → executeAdminAction()
6. Fix applied to database
```

---

## 🔐 Security

### Access Control

**Role Check:**
```typescript
const isSuperAdmin = (user as any).role === 'super_admin';
const effectiveMode = mode === 'admin' && isSuperAdmin ? 'admin' : 'public';
```

**Action Verification:**
```typescript
export async function executeAdminAction(...) {
  if (userRole !== 'super_admin') {
    return { success: false, error: 'Unauthorized' };
  }
  // Execute action
}
```

### SQL Safety

**Dangerous Pattern Detection:**
```typescript
const dangerous = /drop\s+database|truncate|delete\s+from.*where\s+1\s*=\s*1/i.test(sql);
if (dangerous) {
  return { error: 'Dangerous SQL - manual confirmation required' };
}
```

**Confirmation Required:**
- SQL execution → requires /confirm
- Terminal commands → requires /confirm
- Destructive operations → blocked or confirmed

---

## 📊 Data Access Comparison

| Feature | Public AI | Super Admin AI |
|---------|-----------|----------------|
| Database Schema | ❌ No | ✅ Full access |
| Query Tables | ❌ No | ✅ Yes |
| Execute SQL | ❌ No | ✅ Yes (with safety) |
| View Errors | ❌ No | ✅ Yes |
| Fix Errors | ❌ No | ✅ Auto-fix |
| Terminal Commands | ❌ No | ✅ Yes |
| Read Announcements | ✅ Yes | ✅ Yes |
| Read Events | ✅ Yes | ✅ Yes |
| Read Sekbid | ✅ Yes | ✅ Yes |
| Modify Database | ❌ No | ✅ Yes |
| View User Data | ❌ No | ✅ Yes |

---

## 🎨 UI Differences

### Chat Header

**Public:**
```
🤖 AI Assistant OSIS
📚 Public Info Only • Safe Mode
```

**Super Admin:**
```
🤖 AI Super Admin
🔓 Full Database Access • Auto-Fix Enabled
```

### Welcome Message

**Public:**
```
👋 Halo! Selamat datang di OSIS SMK Informatika Fithrah Insani

Saya AI Assistant yang siap membantu! 🌟

Yang bisa saya bantu:
• Informasi tentang OSIS dan Sekbid
• Event dan kegiatan terbaru
• Cara daftar menjadi anggota
• Kontak dan informasi umum

Silakan tanya apa saja! 😊
```

**Super Admin:**
```
🤖 AI Super Admin Assistant - Full System Access

Capabilities:
🔍 Database Access: Query all tables, view schema
🛠️ Auto-Fix: Execute SQL, apply RLS, repair features
📊 System Diagnostics: Analyze errors, check statistics
⚡ Admin Commands: Type / for suggestions

Ask me anything! Saya bisa:
- "Show me all users"
- "Fix RLS on posts table"
- "Execute: SELECT * FROM events LIMIT 5"
```

---

## 🚀 API Endpoints

### POST /api/chat/send

Send message to AI (public or admin).

**Request:**
```json
{
  "content": "Show me recent errors",
  "mode": "admin",
  "sessionId": "uuid" // optional
}
```

**Response:**
```json
{
  "sessionId": "uuid",
  "reply": "AI response...",
  "mode": "admin",
  "capabilities": ["database_read", "execute_sql", ...]
}
```

### POST /api/ai/admin-action

Execute admin action (super admin only).

**Request:**
```json
{
  "type": "query",
  "payload": {
    "table": "posts",
    "filters": { "status": "published" },
    "limit": 10
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": [...],
  "action": "query"
}
```

**Action Types:**
- `query` - Query database table
- `execute_sql` - Execute SQL
- `fix_rls` - Apply RLS policy
- `analyze` - Analyze system (errors/schema/stats)

---

## 📝 Testing

### Test Public AI

1. Login as regular user (member role)
2. Open chat widget
3. Try: "Apa itu OSIS?"
4. Try: "Event apa yang akan datang?"
5. Verify: Cannot execute /sql or admin commands

### Test Super Admin AI

1. Login as super admin
2. Open chat widget
3. Verify header shows "Full Database Access"
4. Try: "/schema" → Should show database structure
5. Try: "/stats" → Should show system statistics
6. Try: "/query posts status=published limit=5"
7. Try: "Show me all errors"
8. Try: "/sql SELECT COUNT(*) FROM users"
9. Confirm with /confirm
10. Verify results shown

### Test Security

1. Login as regular user
2. Try to POST to /api/ai/admin-action
3. Should get 403 Forbidden
4. Verify mode forced to 'public' even if mode='admin' sent

---

## ✅ Implementation Checklist

- [x] Create lib/aiContext.ts with role-based context builder
- [x] Add getDatabaseSchema() for admin
- [x] Add getRecentErrors() for admin
- [x] Add getSystemStats() for admin
- [x] Add getPublicOSISInfo() for public
- [x] Add executeAdminAction() for admin operations
- [x] Update chat/send/route.ts to use buildAIContext()
- [x] Create /api/ai/admin-action endpoint
- [x] Add admin commands: /schema, /stats, /sql, /query
- [x] Update LiveChatWidget with mode indicators
- [x] Different welcome messages for public vs admin
- [x] Command suggestions (/sql, /query, etc.)
- [x] SQL safety checks (dangerous patterns)
- [x] Confirmation flow for destructive actions
- [x] Build verification ✅

---

## 🎓 Future Enhancements

**Potential Improvements:**

1. **AI can suggest fixes in natural language**
   - User: "Posts not showing"
   - AI: "I detect RLS blocking. Shall I apply 'allow_public_read' policy?"
   - User: "Yes"
   - AI: [Applies fix automatically]

2. **Batch operations**
   - AI: "Fix all errors" → Analyzes and fixes all pending errors

3. **Smart query builder**
   - User: "Show users who registered this week"
   - AI: Builds query automatically

4. **Voice commands** (future)
   - "AI, fix error 123"

5. **Multi-step operations**
   - AI tracks conversation state
   - Can perform complex multi-step repairs

---

**Status:** ✅ COMPLETE  
**Build:** ✅ SUCCESS  
**Security:** ✅ Role-based access enforced  
**AI Context:** ✅ Separate for public vs admin  
**Database Access:** ✅ Admin has full access, public has safe read-only
