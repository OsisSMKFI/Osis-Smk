// ========================================
// 🔥 NUCLEAR CACHE CLEAR - HAPUS SEMUA CACHE
// ========================================
// Paste this in browser console to clear ALL cache

console.log('🔥 Starting NUCLEAR cache clear...');

// Step 1: Clear all browser caches
if ('caches' in window) {
  caches.keys().then(keys => {
    console.log(`🗑️ Deleting ${keys.length} cache storage(s)...`);
    keys.forEach(key => {
      caches.delete(key);
      console.log(`   ✅ Deleted: ${key}`);
    });
  });
}

// Step 2: Clear localStorage
console.log('🗑️ Clearing localStorage...');
localStorage.clear();
console.log('   ✅ localStorage cleared');

// Step 3: Clear sessionStorage
console.log('🗑️ Clearing sessionStorage...');
sessionStorage.clear();
console.log('   ✅ sessionStorage cleared');

// Step 4: Clear IndexedDB
if ('indexedDB' in window) {
  console.log('🗑️ Clearing IndexedDB...');
  indexedDB.databases().then(dbs => {
    dbs.forEach(db => {
      if (db.name) {
        indexedDB.deleteDatabase(db.name);
        console.log(`   ✅ Deleted DB: ${db.name}`);
      }
    });
  });
}

// Step 5: Unregister service workers
if ('serviceWorker' in navigator) {
  console.log('🗑️ Unregistering service workers...');
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
      console.log('   ✅ Service worker unregistered');
    });
  });
}

// Step 6: Clear cookies (for current domain only)
console.log('🗑️ Clearing cookies...');
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
console.log('   ✅ Cookies cleared');

console.log('');
console.log('✅ CACHE CLEARED COMPLETELY!');
console.log('');
console.log('🔄 Now reloading page in 2 seconds...');
console.log('⏳ After reload, check for this log:');
console.log('   "[Background Analyzer] 🔄 Cache DISABLED - forcing fresh analysis"');
console.log('');

// Reload after 2 seconds
setTimeout(() => {
  window.location.href = window.location.pathname + '?nocache=' + Date.now();
}, 2000);
