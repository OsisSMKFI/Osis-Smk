// ========================================
// 🧪 TEST API RESPONSE - CHECK GPS DATA
// ========================================
// Run this in browser console (F12) to check what API returns

(async function testAPIResponse() {
  console.log('🧪 Testing API /api/school/wifi-config...');
  console.log('════════════════════════════════════════');
  
  const cacheBuster = Date.now();
  const url = `/api/school/wifi-config?_t=${cacheBuster}`;
  
  const response = await fetch(url, {
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
  
  const data = await response.json();
  
  console.log('📋 API Response Status:', response.status);
  console.log('📋 Full API Response:', data);
  console.log('════════════════════════════════════════');
  console.log('📍 Location Name:', data.config?.locationName);
  console.log('🌍 GPS Latitude:', data.config?.latitude);
  console.log('🌍 GPS Longitude:', data.config?.longitude);
  console.log('📏 Radius (meters):', data.config?.radiusMeters);
  console.log('📶 Require WiFi:', data.config?.requireWiFi);
  console.log('🔐 IP Ranges:', data.allowedIPRanges);
  console.log('════════════════════════════════════════');
  
  // CHECK IF GPS IS CORRECT
  const expectedLat = -6.864733;
  const expectedLon = 107.522064;
  
  const actualLat = data.config?.latitude;
  const actualLon = data.config?.longitude;
  
  if (actualLat === expectedLat && actualLon === expectedLon) {
    console.log('✅ GPS CORRECT! API returning Bandung coordinates');
  } else if (actualLat === -6.2 || actualLat === -6.200000) {
    console.error('❌ GPS WRONG! API still returning Jakarta coordinates');
    console.error('   Expected:', expectedLat, expectedLon);
    console.error('   Got:', actualLat, actualLon);
    console.error('');
    console.error('🔧 ACTION NEEDED:');
    console.error('   1. Run FIX_MULTIPLE_ACTIVE_GPS.sql in Supabase');
    console.error('   2. Or update via Admin Panel > Attendance Settings');
  } else if (!actualLat || !actualLon) {
    console.error('❌ GPS NOT SET! Database has no coordinates');
    console.error('   Configure via Admin Panel > Attendance Settings');
  } else {
    console.warn('⚠️ GPS DIFFERENT from expected:');
    console.warn('   Expected:', expectedLat, expectedLon);
    console.warn('   Got:', actualLat, actualLon);
  }
  
  return data;
})();
