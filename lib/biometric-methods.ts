/**
 * Multi-Method Biometric Detection & Fallback
 * Detects all available biometric authentication methods and provides fallback
 */

export interface BiometricMethod {
  id: string;
  name: string;
  icon: string;
  available: boolean;
  primary: boolean; // Recommended method for this device
  description: string;
}

/**
 * Detect all available biometric authentication methods
 */
export async function detectBiometricMethods(): Promise<BiometricMethod[]> {
  const methods: BiometricMethod[] = [];
  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);
  const isWindows = /windows/.test(userAgent);
  const isMac = /macintosh|mac os x/.test(userAgent);

  // Check WebAuthn support (covers most biometric methods)
  const webAuthnSupported = !!(
    window.PublicKeyCredential &&
    navigator.credentials &&
    navigator.credentials.create
  );

  let platformAuthenticatorAvailable = false;
  if (webAuthnSupported) {
    try {
      platformAuthenticatorAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch (e) {
      console.warn('Platform authenticator check failed:', e);
    }
  }

  // iOS - Face ID / Touch ID
  if (isIOS && platformAuthenticatorAvailable) {
    // Face ID (iPhone X and newer)
    methods.push({
      id: 'face-id',
      name: 'Face ID',
      icon: '🔐',
      available: true,
      primary: true,
      description: 'Scan wajah Anda untuk verifikasi'
    });

    // Touch ID (older iPhones, iPads)
    methods.push({
      id: 'touch-id',
      name: 'Touch ID',
      icon: '👆',
      available: true,
      primary: false,
      description: 'Sentuh sensor sidik jari'
    });
  }

  // Android - Fingerprint / Face Unlock  
  if (isAndroid && platformAuthenticatorAvailable) {
    methods.push({
      id: 'fingerprint',
      name: 'Fingerprint',
      icon: '🔒',
      available: true,
      primary: true,
      description: 'Gunakan sensor sidik jari Android'
    });

    methods.push({
      id: 'face-unlock',
      name: 'Face Unlock',
      icon: '🤖',
      available: true,
      primary: false,
      description: 'Scan wajah Android'
    });
    
    // ✅ ADD: Android Screen Lock PIN/Pattern (EXPLICIT)
    // NOTE: Di Android, saat pilih ini, akan muncul passkey selector
    // User harus klik "Use screen lock" atau "Use PIN" di dialog passkey
    methods.push({
      id: 'android-screen-lock',
      name: 'Screen Lock PIN',
      icon: '🔢',
      available: true,
      primary: false,
      description: 'Gunakan PIN/pattern lockscreen (pilih "Use screen lock" saat muncul dialog passkey)'
    });
  }
  
  // Universal Fingerprint (fallback for any platform)
  if (!isAndroid && !isIOS && !isWindows && platformAuthenticatorAvailable) {
    methods.push({
      id: 'fingerprint',
      name: 'Fingerprint',
      icon: '🔒',
      available: true,
      primary: true,
      description: 'Gunakan sensor sidik jari device'
    });
  }

  // Windows Hello
  if (isWindows && platformAuthenticatorAvailable) {
    methods.push({
      id: 'windows-hello-face',
      name: 'Windows Hello Face',
      icon: '🪟',
      available: true,
      primary: true,
      description: 'Scan wajah dengan Windows Hello'
    });

    methods.push({
      id: 'windows-hello-fingerprint',
      name: 'Windows Hello Fingerprint',
      icon: '🖐️',
      available: true,
      primary: false,
      description: 'Sensor sidik jari Windows Hello'
    });

    methods.push({
      id: 'windows-hello-pin',
      name: 'Windows Hello PIN',
      icon: '🔢',
      available: true,
      primary: false,
      description: 'Gunakan PIN Windows (password device Anda)'
    });
  }

  // macOS - Touch ID
  if (isMac && platformAuthenticatorAvailable) {
    methods.push({
      id: 'touch-id-mac',
      name: 'Touch ID',
      icon: '🍎',
      available: true,
      primary: true,
      description: 'Sensor sidik jari di MacBook'
    });
  }

  // Passkey (Universal, available on all platforms with WebAuthn)
  if (webAuthnSupported) {
    methods.push({
      id: 'passkey',
      name: 'Passkey',
      icon: '🔑',
      available: true,
      primary: methods.length === 0, // Primary if no platform-specific method
      description: 'Passkey Google/Apple/Microsoft'
    });
  }

  // Security Key (External USB/NFC)
  if (webAuthnSupported) {
    methods.push({
      id: 'security-key',
      name: 'Security Key',
      icon: '🔐',
      available: true,
      primary: false,
      description: 'YubiKey, USB Security Key'
    });
  }

  // Fallback: PIN Code (Device Password/PIN)
  methods.push({
    id: 'pin-code',
    name: 'PIN Code',
    icon: '🔢',
    available: true,
    primary: methods.length === 0, // Only primary if nothing else available
    description: 'Gunakan PIN/password device Anda'
  });

  return methods;
}

/**
 * Attempt biometric authentication with automatic fallback
 */
export async function authenticateWithFallback(
  methods: BiometricMethod[],
  onMethodAttempt?: (methodId: string) => void,
  onMethodFailed?: (methodId: string, error: string) => void
): Promise<{
  success: boolean;
  method?: string;
  credential?: any;
  error?: string;
}> {
  // Try methods in order of priority (primary first, then others)
  const sortedMethods = [...methods].sort((a, b) => {
    if (a.primary && !b.primary) return -1;
    if (!a.primary && b.primary) return 1;
    return 0;
  });

  for (const method of sortedMethods) {
    if (!method.available) continue;

    // Skip PIN code unless it's the last option
    if (method.id === 'pin-code' && sortedMethods.length > 1) {
      continue;
    }

    try {
      if (onMethodAttempt) onMethodAttempt(method.id);

      console.log(`🔐 Trying ${method.name}...`);

      // Attempt WebAuthn authentication (includes PIN Code via device)
      // All methods use WebAuthn - even PIN code triggers device PIN/password prompt
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32), // Random challenge
          timeout: 60000,
          userVerification: 'required', // Force biometric/PIN
        } as PublicKeyCredentialRequestOptions
      });

      if (credential) {
        console.log(`✅ ${method.name} authentication successful!`);
        return {
          success: true,
          method: method.id,
          credential
        };
      }

    } catch (error: any) {
      console.warn(`❌ ${method.name} failed:`, error.message);
      if (onMethodFailed) onMethodFailed(method.id, error.message);
      // Continue to next method
    }
  }

  // All methods failed
  return {
    success: false,
    error: 'Semua metode biometrik gagal. Silakan coba lagi atau hubungi admin.'
  };
}

/**
 * Get icon and label for a specific biometric method
 */
export function getMethodDisplay(methodId: string): { icon: string; label: string } {
  const displays: Record<string, { icon: string; label: string }> = {
    'face-id': { icon: '🔐', label: 'Face ID' },
    'touch-id': { icon: '👆', label: 'Touch ID' },
    'fingerprint': { icon: '🔒', label: 'Fingerprint' },
    'face-unlock': { icon: '🤖', label: 'Face Unlock' },
    'android-screen-lock': { icon: '🔢', label: 'Screen Lock PIN' },
    'windows-hello-face': { icon: '🪟', label: 'Windows Hello Face' },
    'windows-hello-fingerprint': { icon: '🖐️', label: 'Windows Hello Fingerprint' },
    'windows-hello-pin': { icon: '🔢', label: 'Windows Hello PIN' },
    'touch-id-mac': { icon: '🍎', label: 'Touch ID' },
    'passkey': { icon: '🔑', label: 'Passkey' },
    'security-key': { icon: '🔐', label: 'Security Key' },
    'pin-code': { icon: '🔢', label: 'PIN Code' }
  };

  return displays[methodId] || { icon: '🔒', label: 'Biometric' };
}

/**
 * Show biometric method selection UI (React component friendly)
 */
export function renderMethodSelectionData(methods: BiometricMethod[]): {
  primary: BiometricMethod[];
  fallback: BiometricMethod[];
} {
  const primary = methods.filter(m => m.primary && m.available);
  const fallback = methods.filter(m => !m.primary && m.available);

  return { primary, fallback };
}
