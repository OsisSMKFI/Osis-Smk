// ========================================
// 🔍 DIAGNOSE WHICH CODE VERSION IS RUNNING
// ========================================
// Paste this in browser console

console.log('🔍 ========== DEPLOYMENT DIAGNOSIS ==========');
console.log('');

// Check 1: Look for the new code signature
console.log('📝 Step 1: Checking if new code is deployed...');
console.log('   Looking for: "[Background Analyzer] 🔄 Cache DISABLED"');
console.log('   in browser console logs above.');
console.log('');

// Check 2: Check build files
console.log('📦 Step 2: Checking Next.js build info...');
fetch('/_next/static/chunks/webpack.txt')
  .then(r => r.text())
  .then(txt => console.log('   Build file exists:', txt.substring(0, 50)))
  .catch(() => console.log('   Build file not found (normal for some builds)'));

// Check 3: Force fetch config from API
console.log('');
console.log('🌐 Step 3: Testing API endpoint directly...');
fetch('/api/school/wifi-config?_test=' + Date.now(), {
  cache: 'no-store',
  headers: {
    'Cache-Control': 'no-cache'
  }
})
  .then(r => r.json())
  .then(data => {
    console.log('   ✅ API Response:', data);
    const lat = data.config?.latitude;
    const lon = data.config?.longitude;
    
    console.log('');
    console.log('📍 GPS Coordinates from API:');
    console.log(`   Latitude:  ${lat}`);
    console.log(`   Longitude: ${lon}`);
    
    if (lat === -6.864733 && lon === 107.522064) {
      console.log('   ✅ CORRECT GPS! (Bandung)');
    } else if (lat === -6.2 || lat === -6.200000) {
      console.log('   ❌ OLD GPS! (Jakarta - WRONG)');
    } else {
      console.log('   ⚠️ UNEXPECTED GPS!');
    }
  })
  .catch(err => {
    console.error('   ❌ API Error:', err);
  });

// Check 4: Check what backgroundAnalyzer returns
console.log('');
console.log('🔐 Step 4: Checking Background Security Analyzer...');
console.log('   Refresh the page and look for these logs:');
console.log('');
console.log('   ✅ NEW CODE should show:');
console.log('      "[Background Analyzer] 🔄 Cache DISABLED - forcing fresh analysis"');
console.log('      "[Location Config] ✅ Loaded from DB: {latitude: -6.864733...}"');
console.log('');
console.log('   ❌ OLD CODE shows:');
console.log('      "[Background Analyzer] Using cached analysis"');
console.log('      "[Attendance] ✅ Location synced: {schoolLatitude: -6.2...}"');
console.log('');

// Check 5: Check localStorage for cached analysis
console.log('🗄️ Step 5: Checking localStorage...');
const keys = Object.keys(localStorage);
console.log(`   Found ${keys.length} localStorage items`);
keys.forEach(key => {
  if (key.includes('security') || key.includes('analysis') || key.includes('gps')) {
    console.log(`   - ${key}: ${localStorage.getItem(key).substring(0, 100)}...`);
  }
});

console.log('');
console.log('==========================================');
console.log('');
console.log('💡 NEXT STEPS:');
console.log('');
console.log('IF API returns CORRECT GPS (-6.864733) but UI shows WRONG:');
console.log('   → Run: CLEAR_ALL_CACHE.js');
console.log('   → Then hard refresh: Ctrl+Shift+R');
console.log('');
console.log('IF API returns WRONG GPS (-6.2):');
console.log('   → Vercel deployment failed or not triggered');
console.log('   → Check Vercel dashboard: https://vercel.com');
console.log('   → Manual redeploy required');
console.log('');
