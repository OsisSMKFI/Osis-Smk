/**
 * Comprehensive Biometric Testing & Debugging Script
 * Run in browser console to test all biometric methods
 */

console.log('🔬 Starting Biometric Debug Test...\n');

// Test 1: WebAuthn Support
console.log('═══ Test 1: WebAuthn Support ═══');
const webauthnSupported = !!(window.PublicKeyCredential && navigator.credentials);
console.log('WebAuthn supported:', webauthnSupported ? '✅ YES' : '❌ NO');

if (webauthnSupported) {
  // Test 2: Platform Authenticator
  console.log('\n═══ Test 2: Platform Authenticator ═══');
  PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    .then(available => {
      console.log('Platform authenticator available:', available ? '✅ YES' : '❌ NO');
      
      if (available) {
        console.log('\n📱 Device biometric (Fingerprint/Face ID/Windows Hello) tersedia!');
        console.log('Artinya: Screen lock PIN/Pattern/Fingerprint BISA digunakan');
      } else {
        console.log('\n⚠️ Platform authenticator tidak tersedia');
        console.log('Artinya: Device tidak punya biometric atau belum di-setup');
      }
    })
    .catch(err => console.error('Error checking platform authenticator:', err));

  // Test 3: Conditional Mediation (Passkey Autofill)
  console.log('\n═══ Test 3: Conditional Mediation (Autofill) ═══');
  if (PublicKeyCredential.isConditionalMediationAvailable) {
    PublicKeyCredential.isConditionalMediationAvailable()
      .then(available => {
        console.log('Conditional mediation available:', available ? '✅ YES' : '❌ NO');
        if (available) {
          console.log('Artinya: Browser support passkey autofill');
        }
      })
      .catch(err => console.error('Error checking conditional mediation:', err));
  } else {
    console.log('Conditional mediation: ❌ NOT SUPPORTED');
  }

  // Test 4: Device Info
  console.log('\n═══ Test 4: Device & Browser Info ═══');
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  console.log('User Agent:', userAgent);
  console.log('Platform:', platform);
  
  const isAndroid = /android/i.test(userAgent);
  const isIOS = /iphone|ipad|ipod/i.test(userAgent);
  const isWindows = /windows/i.test(userAgent);
  const isMac = /macintosh|mac os x/i.test(userAgent);
  
  console.log('\nDetected OS:');
  console.log('  Android:', isAndroid ? '✅' : '❌');
  console.log('  iOS:', isIOS ? '✅' : '❌');
  console.log('  Windows:', isWindows ? '✅' : '❌');
  console.log('  macOS:', isMac ? '✅' : '❌');
  
  // Test 5: Try Simple WebAuthn Registration (Mock)
  console.log('\n═══ Test 5: WebAuthn Registration Test ═══');
  console.log('⚠️ This will trigger device biometric prompt!');
  console.log('Testing with residentKey: "preferred" (not required)');
  
  // Don't actually run this automatically - user must trigger
  window.testWebAuthnRegistration = async function() {
    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      
      console.log('🔐 Attempting WebAuthn registration...');
      console.log('Config: residentKey=preferred, userVerification=required');
      
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: 'OSIS Test',
            id: window.location.hostname,
          },
          user: {
            id: new Uint8Array(16),
            name: 'test@example.com',
            displayName: 'Test User',
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },  // ES256
            { alg: -257, type: 'public-key' }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            requireResidentKey: false,        // ✅ CHANGED
            residentKey: 'preferred',         // ✅ CHANGED
            userVerification: 'required',     // ✅ Force biometric
          },
          timeout: 60000,
          attestation: 'none',
        },
      });
      
      if (credential) {
        console.log('✅ SUCCESS! Credential created:', credential);
        console.log('Credential ID:', credential.id);
        console.log('\n📱 Apa yang muncul di device Anda?');
        console.log('  - Android: Passkey selector ATAU langsung fingerprint/PIN?');
        console.log('  - iOS: Face ID/Touch ID prompt?');
        console.log('  - Windows: Windows Hello prompt?');
        return credential;
      } else {
        console.log('❌ No credential created (user cancelled?)');
      }
    } catch (error) {
      console.error('❌ WebAuthn registration failed:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      
      // Explain common errors
      if (error.name === 'NotAllowedError') {
        console.log('\n💡 NotAllowedError: User cancelled atau timeout');
      } else if (error.name === 'NotSupportedError') {
        console.log('\n💡 NotSupportedError: WebAuthn tidak support atau biometric tidak tersedia');
      } else if (error.name === 'SecurityError') {
        console.log('\n💡 SecurityError: Butuh HTTPS atau localhost');
      }
    }
  };
  
  console.log('\n✅ Test function created!');
  console.log('Run: testWebAuthnRegistration()');
  console.log('     to test WebAuthn registration with device biometric\n');
  
} else {
  console.error('\n❌ WebAuthn NOT supported in this browser!');
  console.log('Please use modern browser: Chrome 67+, Edge 18+, Safari 13+, Firefox 60+');
}

// Test 6: Current Biometric Methods Detection
console.log('\n═══ Test 6: Detecting Available Biometric Methods ═══');
console.log('Checking what biometric methods are available...\n');

// This will call the actual function from biometric-methods.ts if loaded
if (typeof detectBiometricMethods === 'function') {
  detectBiometricMethods().then(methods => {
    console.log('✅ Available biometric methods:');
    methods.filter(m => m.available).forEach(method => {
      console.log(`  ${method.icon} ${method.name} ${method.primary ? '⭐' : ''}`);
      console.log(`     ${method.description}`);
    });
  }).catch(err => {
    console.error('Error detecting methods:', err);
  });
} else {
  console.log('⚠️ detectBiometricMethods() not available');
  console.log('   (Run this in app context where biometric-methods.ts is loaded)');
}

console.log('\n🔬 Biometric Debug Test Complete!');
console.log('═══════════════════════════════════\n');
