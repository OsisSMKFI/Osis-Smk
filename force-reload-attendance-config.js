// ========================================
// 🔄 FORCE RELOAD ATTENDANCE CONFIG
// ========================================
// Run this in browser console (F12) di halaman /attendance
// Untuk clear cache dan reload fresh data dari database

(async function forceReloadAttendanceConfig() {
  console.log('🔄 Starting force reload...');
  
  // STEP 1: Clear ALL browser cache
  console.log('1️⃣ Clearing browser cache...');
  localStorage.clear();
  sessionStorage.clear();
  
  // STEP 2: Clear service worker cache (if any)
  if ('caches' in window) {
    console.log('2️⃣ Clearing service worker cache...');
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log(`   ✅ Cleared ${cacheNames.length} caches`);
  }
  
  // STEP 3: Fetch FRESH config from database
  console.log('3️⃣ Fetching FRESH config from database...');
  const cacheBuster = Date.now();
  
  const response = await fetch(`/api/school/wifi-config?_t=${cacheBuster}`, {
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
  
  const data = await response.json();
  
  console.log('✅ FRESH CONFIG LOADED:');
  console.log('────────────────────────────────────────');
  console.log('📍 Location:', data.config?.locationName);
  console.log('🌍 GPS:', data.config?.latitude, ',', data.config?.longitude);
  console.log('📏 Radius:', data.config?.radiusMeters, 'meters');
  console.log('📶 Require WiFi:', data.config?.requireWiFi);
  console.log('🔐 IP Ranges:', data.allowedIPRanges?.length || 0, 'ranges');
  console.log('────────────────────────────────────────');
  
  // STEP 4: Show alert
  alert(
    '✅ CONFIG RELOADED!\n\n' +
    `📍 ${data.config?.locationName}\n` +
    `GPS: ${data.config?.latitude}, ${data.config?.longitude}\n` +
    `Radius: ${data.config?.radiusMeters}m\n\n` +
    'Now HARD REFRESH the page:\n' +
    'Press Ctrl+Shift+R (Windows/Linux)\n' +
    'or Cmd+Shift+R (Mac)'
  );
  
  console.log('⚠️ IMPORTANT: Hard refresh required!');
  console.log('   Windows/Linux: Ctrl + Shift + R');
  console.log('   Mac: Cmd + Shift + R');
  
})();
