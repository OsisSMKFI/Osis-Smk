// ========================================
// 🔍 VERCEL BUILD CHECKER
// ========================================
// Run this in PRODUCTION site console to check deployed code version

console.log('🔍 Checking deployed code version...');
console.log('Current URL:', window.location.href);
console.log('Timestamp:', new Date().toISOString());

// Try to trigger background analyzer and see what it does
if (typeof window !== 'undefined') {
  console.log('✅ Client-side code loaded');
  
  // Check if cache is disabled (our fix)
  setTimeout(() => {
    console.log('\n📋 Look for these logs in console:');
    console.log('   [Background Analyzer] 🔄 Cache DISABLED - forcing fresh analysis for accurate GPS');
    console.log('   [Location Config] ✅ Loaded from DB: ...');
    console.log('\nIf you SEE these logs = NEW CODE DEPLOYED ✅');
    console.log('If you DON\'T see them = OLD CODE STILL RUNNING ❌');
  }, 1000);
}
