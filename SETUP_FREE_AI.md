# Setup Free AI API - Google Gemini

## 🎯 Cara Dapat Gemini API Key (GRATIS)

### Step 1: Dapetin API Key
1. Buka: https://aistudio.google.com/app/apikey
2. Login pakai Google account kamu
3. Klik **"Create API Key"** atau **"Get API Key"**
4. Copy key yang muncul (format: `AIza...`)

### Step 2: Update di Web
1. Buka: http://localhost:3001/admin/settings
2. Scroll ke form bawah
3. Isi field **"Gemini API Key"**: `AIza...` (paste key tadi)
4. Klik **"Simpan Settings"**
5. Klik **"🔍 Verify Database Values"** untuk confirm tersimpan

### Step 3: Modify AI Route untuk Pakai Gemini

Edit file: `app/api/admin/errors/route.ts`

Ganti logic OpenAI dengan Gemini:

```typescript
// BEFORE (OpenAI):
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const completion = await openai.chat.completions.create({...});

// AFTER (Gemini):
import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const result = await model.generateContent(prompt);
```

### Step 4: Install Gemini SDK

```bash
npm install @google/generative-ai
```

---

## 📊 Free Tier Limits

| Provider | Free Quota | Speed | Quality |
|----------|-----------|-------|---------|
| **Gemini Flash** | 15/min, 1500/day | ⚡⚡⚡ Fast | ⭐⭐⭐⭐ Good |
| Anthropic | $5 credit | ⚡⚡ Medium | ⭐⭐⭐⭐⭐ Best |
| Groq (Llama) | 30/min unlimited | ⚡⚡⚡⚡ Fastest | ⭐⭐⭐ OK |

**RECOMMENDED:** Gemini Flash (gratis permanent!)

---

## 🔧 Alternative: Disable AI Features

Kalau mau skip AI features sementara:

```sql
-- Run di Supabase SQL Editor:
UPDATE admin_settings 
SET value = 'off' 
WHERE key = 'AUTO_EXECUTE_MODE';
```

Settings & Terminal fixes tetap berfungsi tanpa AI! ✅
