/**
 * Test script untuk authFetch
 * Run: node --loader ts-node/esm test-auth-fetch.ts
 */

import { authFetch } from './lib/authFetch';

async function testAuthFetch() {
  console.log('🧪 Testing authFetch...\n');

  // Test 1: Normal fetch
  console.log('Test 1: Normal API call');
  try {
    const response = await authFetch('/api/health');
    console.log('✅ Response:', response?.status);
  } catch (error) {
    console.log('❌ Error:', error);
  }

  console.log('\n---\n');

  // Test 2: 401 handling (will trigger if not authenticated)
  console.log('Test 2: 401 handling');
  try {
    const response = await authFetch('/api/attendance/biometric/setup');
    console.log('✅ Response:', response?.status);
    
    if (response?.status === 401) {
      console.log('⚠️ Got 401 - authFetch should auto-refresh session');
    }
  } catch (error) {
    console.log('❌ Error:', error);
  }

  console.log('\n✅ Test complete!\n');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testAuthFetch();
}
