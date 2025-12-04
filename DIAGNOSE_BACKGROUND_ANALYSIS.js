// ========================================
// 🔍 DIAGNOSE BACKGROUNDANALYSIS OBJECT
// ========================================
// Paste this in browser console

console.log('🔍 ========== BACKGROUND ANALYSIS DIAGNOSIS ==========');
console.log('');

// Get backgroundAnalysis from localStorage or wait for page to load
setTimeout(() => {
  console.log('📋 Step 1: Check if backgroundAnalysis exists in component state');
  console.log('   (This requires React DevTools or manual inspection)');
  console.log('');
  
  console.log('📋 Step 2: Check localStorage for cached analysis');
  const keys = Object.keys(localStorage);
  const securityKeys = keys.filter(k => k.includes('security') || k.includes('analysis'));
  console.log(`   Found ${securityKeys.length} security-related keys:`, securityKeys);
  
  securityKeys.forEach(key => {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      console.log(`\n   📦 ${key}:`, data);
      if (data.location) {
        console.log('   📍 Location data:', {
          schoolLatitude: data.location.schoolLatitude,
          schoolLongitude: data.location.schoolLongitude,
          allowedRadius: data.location.allowedRadius,
          locationName: data.location.locationName
        });
      }
    } catch (e) {
      console.log(`   ⚠️ ${key}: Not JSON or parse error`);
    }
  });
  
  console.log('');
  console.log('📋 Step 3: Force re-fetch background analysis');
  console.log('   Run this to trigger fresh analysis:');
  console.log('   location.reload();');
  
  console.log('');
  console.log('📋 Step 4: Check what API returns');
  fetch('/api/school/wifi-config?_debug=' + Date.now(), {cache: 'no-store'})
    .then(r => r.json())
    .then(data => {
      console.log('');
      console.log('🌐 API Response (/api/school/wifi-config):');
      console.log('   Config:', data.config);
      console.log('   Latitude:', data.config?.latitude, typeof data.config?.latitude);
      console.log('   Longitude:', data.config?.longitude, typeof data.config?.longitude);
      
      if (data.config?.latitude && data.config?.longitude) {
        const lat = parseFloat(data.config.latitude);
        const lon = parseFloat(data.config.longitude);
        console.log('   Parsed Lat:', lat, 'Type:', typeof lat, 'IsNaN:', isNaN(lat));
        console.log('   Parsed Lon:', lon, 'Type:', typeof lon, 'IsNaN:', isNaN(lon));
        
        if (lat === -6.864733 && lon === 107.522064) {
          console.log('   ✅ API returns CORRECT GPS!');
          console.log('');
          console.log('   ⚠️ PROBLEM: API correct but backgroundAnalysis wrong');
          console.log('   → Check how backgroundAnalyzer sets schoolLatitude/schoolLongitude');
        } else {
          console.log('   ❌ API returns WRONG GPS!');
        }
      } else {
        console.log('   ❌ API returns null/undefined GPS!');
      }
    })
    .catch(err => {
      console.error('   ❌ API Error:', err);
    });
  
}, 1000);

console.log('');
console.log('⏳ Waiting 1 second to collect data...');
console.log('');
