const fs = require('fs');

const p = 'app/api/ai/chat/route.ts';
let s = fs.readFileSync(p, 'utf8');

// ===============================
// 1. SISAKAN SATU POST()
// ===============================
const parts = s.split(/export async function POST/);
if (parts.length > 2) {
  s = parts[0] + 'export async function POST' + parts[1];
}

// ===============================
// 2. HAPUS DUPLICATE request.json()
// ===============================
let seen = false;
s = s.replace(/const body = await request\.json\(\);/g, m => {
  if (seen) return '';
  seen = true;
  return m;
});

// ===============================
// 3. PAKSA userQuery AMAN
// ===============================
if (!s.includes('const userQuery')) {
  s = s.replace(
    /const body = await request\.json\(\);/,
    [
      'const body = await request.json();',
      '',
      'const userQuery =',
      '  body?.message ??',
      '  body?.singleMessage ??',
      '  body?.messages?.[body.messages.length - 1]?.content ??',
      "  '';",
      ''
    ].join('\n')
  );
}

// ===============================
// 4. HAPUS KOMA NYASAR
// ===============================
s = s.replace(/^\s*,\s*$/gm, '');

// ===============================
// SAVE
// ===============================
fs.writeFileSync(p, s);
console.log('✅ AUTO FIX SELESAI');
