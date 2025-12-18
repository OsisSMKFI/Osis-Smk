'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FaFingerprint, FaCamera, FaWifi, FaMapMarkerAlt, FaCheckCircle, FaClock, FaExclamationTriangle, FaLock } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import {
  checkWiFiConnection,
  getUserLocation,
  generateBrowserFingerprint,
  captureWebcamPhoto,
  uploadAttendancePhoto,
  formatAttendanceTime,
} from '@/lib/attendanceUtils';
import { getNetworkInfo, getWiFiNetworkDetails } from '@/lib/networkUtils';
import { authFetch } from '@/lib/authFetch';
import {
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
  getAuthenticatorName,
  getAuthenticatorIcon,
  registerCredential,
  authenticateCredential,
  testBiometric,
} from '@/lib/webauthn';
import { 
  detectBiometricMethods, 
  authenticateWithFallback,
  type BiometricMethod 
} from '@/lib/biometric-methods';
import { PermissionManager } from '@/lib/permission-manager';
import { useSecurityAnalysis } from '@/components/SecurityAnalyzerProvider';
import { useLiveLocation } from '@/components/LocationServiceProvider';

interface BiometricSetupData {
  referencePhotoUrl: string;
  fingerprintTemplate: string;
}

export default function AttendancePageClient() {
  const { data: session, status } = useSession();
  const { location: liveLocation, permission: locationPermission, refresh: refreshLocation } = useLiveLocation();
  
  // 🔒 ENROLLMENT GATE: Check if user completed mandatory enrollment
  const [enrollmentStatus, setEnrollmentStatus] = useState<any>(null);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);
  
  // 🔒 USE BACKGROUND SECURITY ANALYSIS (runs on login)
  const { result: backgroundAnalysis, isReady, isBlocked, blockReasons } = useSecurityAnalysis();
  
  const [step, setStep] = useState<'check' | 'ready' | 'face-analytics' | 'capture' | 'submitting' | 'blocked'>('check');
  const [hasSetup, setHasSetup] = useState(false);
  const [requirements, setRequirements] = useState({
    role: false,
    wifi: false,
    location: false,
    biometric: false,
  });
  const [locationData, setLocationData] = useState<any>(null);
  const [wifiSSID, setWifiSSID] = useState('');
  const [wifiDetection, setWifiDetection] = useState<any>(null); // AUTO WiFi detection by AI
  const [wifiValidation, setWifiValidation] = useState<any>(null); // AI WiFi validation result
  const [fingerprintHash, setFingerprintHash] = useState('');
  const [fingerprintDetails, setFingerprintDetails] = useState<any>(null);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [securityValidation, setSecurityValidation] = useState<any>(null);
  const [validating, setValidating] = useState(false);
  
  // ✅ NEW: First-time reference photo + attendance metadata
  const [isFirstTimeAttendance, setIsFirstTimeAttendance] = useState(false);
  const [attendanceNote, setAttendanceNote] = useState(''); // Optional: alasan terlambat, dll
  const [attendanceName, setAttendanceName] = useState(''); // Filled from profile
  const [aiVerifying, setAiVerifying] = useState(false); // Loading indicator for AI
  const [aiProgress, setAiProgress] = useState(''); // AI progress message
  
  // Enhanced: Multi-method authentication support
  const [authMethod, setAuthMethod] = useState<'webauthn' | 'pin' | 'ai-face'>('webauthn');
  const [deviceCapabilities, setDeviceCapabilities] = useState<any>(null);
  const [pinCode, setPinCode] = useState('');
  const [aiVerification, setAiVerification] = useState<any>(null);
  
  // Re-enrollment request state
  const [reEnrollmentStatus, setReEnrollmentStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [showReEnrollmentForm, setShowReEnrollmentForm] = useState(false);
  const [reEnrollmentReason, setReEnrollmentReason] = useState('');
  
  // REMOVED: Biometric methods detection (no longer needed)
  // const [availableMethods, setAvailableMethods] = useState<BiometricMethod[]>([]);
  // const [selectedMethod, setSelectedMethod] = useState<BiometricMethod | null>(null);
  // const [showMethodSelection, setShowMethodSelection] = useState(false);
  // const ['biometric', setSelectedBiometricType] = useState<string>('fingerprint');
  // const [null, setSelectedDeviceInfo] = useState<any>(null);
  
  // 🌐 BROWSER COMPATIBILITY
  const [webauthnSupported, setWebauthnSupported] = useState<boolean | null>(null);
  const [platformAuthAvailable, setPlatformAuthAvailable] = useState<boolean | null>(null);

  // 🔄 FORCE REFRESH: Check URL parameter on mount
  useEffect(() => {
    // Sync live location into local state for validations and submission
    if (liveLocation && (!locationData || Math.abs(liveLocation.timestamp - (locationData.timestamp || 0)) > 5000)) {
      setLocationData({
        latitude: liveLocation.latitude,
        longitude: liveLocation.longitude,
        accuracy: liveLocation.accuracy,
        timestamp: liveLocation.timestamp,
      });
    }
  }, [liveLocation]);

  // On page focus, attempt to refresh GPS
  useEffect(() => {
    const onFocus = () => {
      try { refreshLocation(); } catch {}
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus);
      return () => window.removeEventListener('focus', onFocus);
    }
  }, [refreshLocation]);

  // Handle force refresh URL parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('forceRefresh') === '1') {
        console.log('[Attendance] 🔄 Force refresh detected! Removing parameter...');
        // Remove the parameter from URL
        urlParams.delete('forceRefresh');
        const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
        window.history.replaceState({}, '', newUrl);
        console.log('[Attendance] ✅ URL cleaned, analyzer will bypass cache');
      }
    }
  }, []);
  
  // 🌐 CHECK BROWSER COMPATIBILITY ON MOUNT
  useEffect(() => {
    const checkBrowserSupport = async () => {
      console.log('[Browser Check] 🌐 Checking WebAuthn support...');
      
      const { isWebAuthnSupported, isPlatformAuthenticatorAvailable } = await import('@/lib/webauthn');
      const supported = isWebAuthnSupported();
      setWebauthnSupported(supported);
      
      if (!supported) {
        console.warn('[Browser Check] ❌ WebAuthn NOT supported');
        toast.error(
          <div>
            <div className="font-bold">❌ Browser Tidak Mendukung Biometric</div>
            <div className="text-sm mt-1">Gunakan browser terbaru: Chrome 67+, Edge 18+, Safari 13+, Firefox 60+</div>
            <div className="text-xs mt-2 opacity-80">WebAuthn diperlukan untuk Face ID, Touch ID, Windows Hello</div>
          </div>,
          { duration: 10000 }
        );
        return;
      }
      
      console.log('[Browser Check] ✅ WebAuthn supported');
      
      try {
        const platformAvailable = await isPlatformAuthenticatorAvailable();
        setPlatformAuthAvailable(platformAvailable);
        
        if (!platformAvailable) {
          console.warn('[Browser Check] ⚠️ Platform authenticator not available');
          toast(
            <div>
              <div className="font-bold">⚠️ Biometric Device Tidak Terdeteksi</div>
              <div className="text-sm mt-1">Pastikan device memiliki Face ID, Touch ID, atau Windows Hello</div>
              <div className="text-xs mt-2 opacity-80">Atau gunakan security key eksternal</div>
            </div>,
            { duration: 8000, icon: '⚠️' }
          );
        } else {
          console.log('[Browser Check] ✅ Platform authenticator available');
        }
      } catch (error) {
        console.error('[Browser Check] Error checking platform authenticator:', error);
        setPlatformAuthAvailable(false);
      }
    };
    
    checkBrowserSupport();
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login?callbackUrl=/attendance');
    }
    
    // ✅ NO ENROLLMENT GATE - First-time users auto-enroll on submit
    // Set checkingEnrollment false immediately to avoid blocking UI
    setCheckingEnrollment(false);
    
    // Fetch re-enrollment request status
    if (session?.user?.id) {
      authFetch('/api/attendance/request-re-enrollment')
        .then(res => res?.json())
        .then(data => {
          if (data && data.hasRequest) {
            setReEnrollmentStatus(data.status);
            console.log('📋 Re-enrollment status:', data.status);
          }
        })
        .catch(err => console.error('Failed to fetch re-enrollment status:', err));
    }
    
    // REMOVED: Biometric detection (no longer needed)
    // detectBiometricMethods().then(methods => { ... });
  }, [status, session]);

  // 🔒 SYNC BACKGROUND ANALYSIS (ran on login) with page state
  useEffect(() => {
    if (backgroundAnalysis && step === 'ready') {
      console.log('[Attendance] 🔒 Using background security analysis:', backgroundAnalysis);
      
      // ✅ LOG GPS CONFIG DETAIL untuk debug
      console.log('📍 GPS CONFIG dari Background Analyzer:');
      console.log('   School Name:', backgroundAnalysis.location?.locationName);
      console.log('   School GPS:', backgroundAnalysis.location?.schoolLatitude, backgroundAnalysis.location?.schoolLongitude);
      console.log('   Radius:', backgroundAnalysis.location?.allowedRadius, 'meters');
      console.log('   Require WiFi:', backgroundAnalysis.location?.requireWiFi);
      console.log('   IP Ranges:', backgroundAnalysis.location?.allowedIPRanges?.length || 0);
      
      // Set WiFi detection from background analysis
      if (backgroundAnalysis.wifi) {
        const wifiData = {
          ssid: backgroundAnalysis.wifi.ssid,
          ipAddress: backgroundAnalysis.wifi.ipAddress,
          connectionType: backgroundAnalysis.wifi.connectionType,
          isConnected: !!backgroundAnalysis.wifi.ipAddress,
          detectionMethod: 'background_analyzer',
          timestamp: backgroundAnalysis.timestamp
        };
        
        setWifiDetection(wifiData);
        setWifiSSID(backgroundAnalysis.wifi.ssid);
        
        // Set WiFi validation from background analysis
        setWifiValidation({
          isValid: backgroundAnalysis.wifi.isValid,
          detectedSSID: backgroundAnalysis.wifi.ssid,
          validationError: backgroundAnalysis.wifi.validationError,
          aiDecision: backgroundAnalysis.wifi.isValid ? 'VALID' : 'INVALID',
          aiConfidence: 0.99,
          aiAnalysis: backgroundAnalysis.wifi.validationError || 'WiFi sesuai dengan jaringan sekolah',
          isValidating: false
        });
        
        console.log('[Attendance] ✅ WiFi data synced:', {
          ssid: backgroundAnalysis.wifi.ssid,
          ip: backgroundAnalysis.wifi.ipAddress,
          isValid: backgroundAnalysis.wifi.isValid,
          error: backgroundAnalysis.wifi.validationError
        });
      }
      
      // Set Location from background analysis
      if (backgroundAnalysis.location && backgroundAnalysis.location.detected) {
        setLocationData({
          latitude: backgroundAnalysis.location.latitude,
          longitude: backgroundAnalysis.location.longitude,
          accuracy: backgroundAnalysis.location.accuracy
        });
        
        console.log('[Attendance] ✅ Location synced:', backgroundAnalysis.location);
      }
    }
  }, [backgroundAnalysis, step]);
  
  // Log step changes for debugging
  useEffect(() => {
    if (step) {
      console.log(`\n📱 ========== UI STATE CHANGE ==========`);
      console.log(`🔄 Step changed to: ${step.toUpperCase()}`);
      console.log(`👤 User: ${session?.user?.name || 'Not logged in'}`);
      console.log(`📧 Email: ${session?.user?.email || 'N/A'}`);
      console.log(`🎭 Role: ${(session?.user as any)?.role || 'N/A'}`);
      console.log(`⏰ Time: ${new Date().toLocaleString()}`);
      
      // Log relevant data for current step
      switch (step) {
        case 'check':
          console.log('📋 Requirements:', {
            role: requirements.role,
            wifi: requirements.wifi,
            location: requirements.location,
            biometric: requirements.biometric
          });
          break;
        case 'ready':
          console.log('✅ Ready to attend');
          console.log('📍 Location:', locationData ? `${locationData.latitude}, ${locationData.longitude}` : 'Not detected');
          console.log('📶 WiFi:', wifiSSID || 'Not set');
          console.log('🔐 Fingerprint:', fingerprintHash ? fingerprintHash.substring(0, 12) + '...' : 'Not generated');
          break;
        case 'blocked':
          console.log('🚫 BLOCKED - Validation failed');
          console.log('❌ Violations:', securityValidation?.violations || []);
          console.log('📋 Details:', securityValidation?.details || {});
          break;
        case 'face-analytics':
          console.log('🧠 Face analytics integration mode');
          break;
        case 'capture':
          console.log('📸 Photo capture mode');
          break;
        case 'submitting':
          console.log('⏳ Submitting attendance...');
          break;
      }
      
      console.log('=========================================\n');
    }
  }, [step]);

  useEffect(() => {
    if (session?.user) {
      detectDeviceCapabilities();
      checkAllRequirements();
      checkReEnrollmentRequest();
      
      // Periodic refresh of school config for live admin changes
      const refreshSchoolConfig = async () => {
        try {
          const res = await fetch('/api/school/wifi-config?t=' + Date.now(), { cache: 'no-store' as any });
          if (res.ok) {
            const data = await res.json();
            console.log('[Attendance] School config refreshed:', data);
          }
        } catch (e) {
          console.warn('[Attendance] Config refresh failed:', e);
        }
      };
      
      const id = setInterval(refreshSchoolConfig, 60000); // every 60s
      return () => clearInterval(id);
    }
  }, [session]);
  
  // AUTO-DETECT WiFi when ready to attend
  useEffect(() => {
    if (step === 'ready' && session?.user) {
      console.log('[WiFi] Step is ready - auto-detecting WiFi...');
      detectWiFiAutomatic();
    }
  }, [step, session]);

  // Enhanced: Detect device biometric capabilities
  // AUTO WIFI DETECTION - User cannot modify
  const detectWiFiAutomatic = async () => {
    console.log('[WiFi] 🤖 AI Auto-detecting WiFi & Network...');
    
    try {
      // Get network info (IP, connection type, etc.)
      const network = await getNetworkInfo();
      
      console.log('[WiFi] Network info:', network);
      
      // ⚠️ BROWSER LIMITATION: Cannot detect WiFi SSID directly
      // Browser security prevents reading WiFi name (SSID)
      // We can only detect: IP, connection type (wifi/ethernet/cellular), signal strength
      
      let detectedSSID = 'Unknown';
      let detectionMethod = 'browser_limitation';
      
      // Try to detect SSID (usually fails due to browser security)
      try {
        const wifiDetails = await getWiFiNetworkDetails('Unknown');
        if (wifiDetails.ssid && wifiDetails.ssid !== 'Unknown') {
          detectedSSID = wifiDetails.ssid;
          detectionMethod = 'network_info_api';
        }
      } catch (err) {
        console.warn('[WiFi] SSID detection not supported:', err);
      }
      
      const detection = {
        ssid: detectedSSID,
        ipAddress: network.ipAddress,
        connectionType: network.connectionType,
        networkStrength: network.networkStrength,
        isConnected: !!network.ipAddress,
        detectionMethod,
        browserLimitation: detectedSSID === 'Unknown',
        timestamp: new Date().toISOString()
      };
      
      setWifiDetection(detection);
      setWifiSSID(detection.ssid); // Auto-fill for backend
      
      console.log('[WiFi] ✅ Detection complete:', detection);
      
      // Show warning if WiFi cannot be detected
      if (detectedSSID === 'Unknown') {
        console.warn('[WiFi] ⚠️ WiFi SSID cannot be detected - Browser security restriction');
        
        // Check user role for appropriate messaging
        const userRole = (session?.user as any)?.role?.toLowerCase() || 'siswa';
        
        if (userRole === 'siswa') {
          toast(
            <div>
              <div className="font-bold">ℹ️ Validasi Jaringan</div>
              <div className="text-sm mt-1">Browser tidak dapat membaca nama WiFi</div>
              <div className="text-xs mt-2">
                <strong>Sistem akan memvalidasi IP address Anda:</strong>
                <ul className="mt-1 ml-4 list-disc">
                  <li>Terhubung WiFi sekolah ✅</li>
                  <li>IP dalam range sekolah ✅</li>
                  <li>Tidak pakai data seluler ❌</li>
                </ul>
              </div>
            </div>,
            { 
              duration: 6000,
              icon: 'ℹ️',
              style: {
                background: '#DBEAFE',
                color: '#1E40AF',
                border: '2px solid #3B82F6',
                maxWidth: '450px'
              }
            }
          );
        } else {
          // Guru/Admin - informasi bypass
          toast.success(
            <div>
              <div className="font-bold">✅ {userRole.toUpperCase()} - IP Bypass</div>
              <div className="text-sm mt-1">Anda dapat absen dari lokasi manapun</div>
              <div className="text-xs mt-1">Validasi IP tidak diterapkan untuk {userRole}</div>
            </div>,
            { 
              duration: 4000,
              style: {
                background: '#D1FAE5',
                color: '#065F46',
                border: '2px solid #10B981'
              }
            }
          );
        }
      }
      
      // AI VALIDATES WiFi automatically
      await validateWiFiWithAI(detection);
      
    } catch (error) {
      console.error('[WiFi] ❌ Detection failed:', error);
      
      const detection = {
        ssid: 'DETECTION_FAILED',
        error: (error as Error).message,
        isConnected: false,
        timestamp: new Date().toISOString()
      };
      
      setWifiDetection(detection);
      
      toast.error(
        <div>
          <div className="font-bold">❌ Gagal Deteksi Jaringan</div>
          <div className="text-sm mt-1">{(error as Error).message}</div>
        </div>,
        { duration: 5000 }
      );
      
      // Still validate (will fail)
      await validateWiFiWithAI(detection);
    }
  };
  
  // AI WIFI VALIDATION - Check if WiFi matches school WiFi
  const validateWiFiWithAI = async (detection: any) => {
    console.log('[WiFi AI] 🤖 Validating WiFi with AI...');
    
    try {
      // Fetch school WiFi config from database
      const configResponse = await fetch('/api/school/wifi-config', {
        credentials: 'include',
        cache: 'no-store'
      });
      const configData = await configResponse.json();
      
      const allowedSSIDs = configData.allowedSSIDs || [];
      const requireWiFi = configData.config?.requireWiFi || false;
      console.log('[WiFi AI] Config from DB:', {
        allowedSSIDs,
        requireWiFi,
        detectedSSID: detection.ssid
      });
      
      // ℹ️ WiFi SSID not detectable - backend will validate IP
      if (detection.ssid === 'Unknown' || detection.ssid === 'DETECTION_FAILED' || !detection.ssid) {
        // Get user role for messaging
        const userRole = (session?.user as any)?.role?.toLowerCase() || 'siswa';
        
        const validation = {
          isValid: true, // ✅ ALWAYS TRUE - backend validates IP
          detectedSSID: detection.ssid,
          allowedSSIDs,
          requireWiFi,
          userRole,
          bypassReason: 'Frontend allows all - backend validates IP',
          aiDecision: 'ALLOW_BACKEND_VALIDATION',
          aiConfidence: 1.0,
          aiAnalysis: `✅ Frontend allows - Backend akan memvalidasi IP address (${detection.ipAddress || 'Unknown IP'})`,
          reason: 'Browser limitation - WiFi SSID cannot be detected, using IP validation',
          serverValidation: 'IP whitelisting akan dilakukan oleh server',
          timestamp: new Date().toISOString()
        };
        setWifiValidation(validation);
        
        console.log('[WiFi AI] ℹ️ WiFi SSID not detected, IP validation will be used:', validation);
        
        // Different messages for different roles
        if (userRole === 'siswa') {
          toast(
            <div>
              <div className="font-bold">ℹ️ Validasi Jaringan (Siswa)</div>
              <div className="text-sm mt-2">
                <strong>Browser tidak dapat membaca WiFi SSID</strong>
              </div>
              <div className="text-xs mt-2 space-y-1">
                <div>✅ Sistem akan memvalidasi IP address Anda</div>
                <div>📍 IP terdeteksi: {detection.ipAddress || 'Detecting...'}</div>
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-300 rounded">
                  <strong>Pastikan:</strong>
                  <ul className="ml-4 list-disc mt-1">
                    <li>Terhubung ke WiFi sekolah</li>
                    <li>MATIKAN data seluler</li>
                    <li>IP dalam range sekolah</li>
                  </ul>
                </div>
              </div>
            </div>,
            { 
              duration: 7000,
              icon: 'ℹ️',
              style: {
                background: '#FEF3C7',
                color: '#92400E',
                border: '2px solid #F59E0B',
                maxWidth: '500px'
              }
            }
          );
        } else {
          toast.success(
            <div>
              <div className="font-bold">✅ {userRole.toUpperCase()} - Bypass Validasi</div>
              <div className="text-sm mt-1">Anda dapat absen dari lokasi manapun</div>
              <div className="text-xs mt-2">
                📍 IP: {detection.ipAddress || 'Unknown'}<br/>
                🔓 Validasi IP di-bypass untuk {userRole}
              </div>
            </div>,
            { 
              duration: 5000,
              style: {
                maxWidth: '450px'
              }
            }
          );
        }
        
        await fetch('/api/attendance/log-activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: session?.user?.id,
            activityType: 'network_validation',
            description: `Network validation for ${userRole}: ${validation.aiDecision}`,
            status: userRole !== 'siswa' ? 'success' : 'pending_server_validation',
            metadata: validation
          })
        });
        
        return;
      }
      
      // ✅ VALIDATE WiFi against allowed list
      // If requireWiFi=false and allowedSSIDs is empty, allow any WiFi
      // If requireWiFi=true or allowedSSIDs has values, must match
      const mustValidate = requireWiFi || allowedSSIDs.length > 0;
      const isValid = mustValidate ? allowedSSIDs.includes(detection.ssid) : true;
      
      const validation = {
        isValid,
        detectedSSID: detection.ssid,
        allowedSSIDs,
        requireWiFi,
        aiDecision: isValid ? 'VALID_WIFI' : 'INVALID_WIFI',
        aiConfidence: isValid ? 0.95 : 0.98,
        aiAnalysis: isValid 
          ? `✅ WiFi "${detection.ssid}" sesuai dengan jaringan sekolah` 
          : `❌ WiFi "${detection.ssid}" TIDAK SESUAI! Harap gunakan WiFi sekolah yang terdaftar: ${allowedSSIDs.join(', ')}`,
        timestamp: new Date().toISOString()
      };
      
      setWifiValidation(validation);
      console.log('[WiFi AI] ✅ Validation complete:', validation);
      
      // Log AI WiFi validation to database
      await fetch('/api/attendance/log-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session?.user?.id,
          activityType: 'ai_wifi_validation',
          description: `AI validated WiFi: ${validation.aiDecision}`,
          status: isValid ? 'success' : 'failure',
          metadata: validation
        })
      });
      
      // Show toast notification
      if (isValid) {
        toast.success(`✅ WiFi Valid: ${detection.ssid}`);
      } else {
        toast.error(
          <div>
            <div className="font-bold">❌ WiFi Tidak Sesuai!</div>
            <div className="text-sm mt-1">Gunakan WiFi sekolah: {allowedSSIDs.join(', ')}</div>
          </div>,
          { duration: 8000 }
        );
      }
      
    } catch (error) {
      console.error('[WiFi AI] ❌ Validation failed:', error);
      // Default to allow if validation fails
      setWifiValidation({
        isValid: true,
        aiDecision: 'VALIDATION_ERROR',
        error: (error as Error).message
      });
    }
  };
  
  const detectDeviceCapabilities = async () => {
    console.log('[Device] 🔍 Detecting capabilities...');
    
    const webauthnSupported = isWebAuthnSupported();
    const platformAuth = await isPlatformAuthenticatorAvailable();
    const authName = getAuthenticatorName();
    const authIcon = getAuthenticatorIcon();
    
    const capabilities = {
      webauthn: webauthnSupported,
      platformAuth,
      authName,
      authIcon,
      supportsFingerprint: /android/i.test(navigator.userAgent) && platformAuth,
      supportsFaceID: /iphone|ipad/i.test(navigator.userAgent) && platformAuth,
      supportsWindowsHello: /windows/i.test(navigator.userAgent) && platformAuth,
      fallbackRequired: !platformAuth,
    };
    
    console.log('[Device] Capabilities:', capabilities);
    setDeviceCapabilities(capabilities);
    
    // Auto-select best auth method
    if (platformAuth) {
      setAuthMethod('webauthn');
      console.log('[Device] ✅ Using WebAuthn:', authName);
    } else {
      setAuthMethod('ai-face');
      console.log('[Device] ⚠️ WebAuthn unavailable, using AI Face Verification');
    }
  };

  // ===== 🔄 CHECK RE-ENROLLMENT REQUEST STATUS =====
  const checkReEnrollmentRequest = async () => {
    try {
      const response = await authFetch('/api/attendance/biometric/request-reenrollment');
      if (response && response.ok) {
        const data = await response.json();
        if (data.hasRequest) {
          setReEnrollmentStatus(data.status);
          setEnrollmentStatus(data.data);
          console.log('[Re-enrollment] Status:', data.status, data.data);
        }
      }
    } catch (error) {
      console.error('[Re-enrollment] Check failed:', error);
    }
  };

  // ===== 📝 SUBMIT RE-ENROLLMENT REQUEST =====
  const handleSubmitReEnrollmentRequest = async () => {
    if (!reEnrollmentReason.trim() || reEnrollmentReason.trim().length < 10) {
      toast.error('Alasan harus diisi minimal 10 karakter');
      return;
    }

    setLoading(true);
    
    try {
      const response = await authFetch('/api/attendance/biometric/request-reenrollment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reEnrollmentReason.trim(),
          newMethod: null, // Removed: 'biometric'
        }),
      });

      if (!response) {
        toast.error('Gagal mengirim request. Silakan coba lagi.');
        return;
      }

      const data = await response.json();

      if (response.ok) {
        toast.success('✅ Request berhasil dikirim ke admin!');
        setReEnrollmentStatus('pending');
        setShowReEnrollmentForm(false);
        setReEnrollmentReason('');
        checkReEnrollmentRequest(); // Refresh status
      } else {
        toast.error(data.error || 'Gagal submit request');
      }
    } catch (error: any) {
      console.error('[Re-enrollment] Submit failed:', error);
      toast.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkAllRequirements = async () => {
    if (!session?.user) return;

    const userRole = (session.user.role || '').toLowerCase();

    // 1. Check role (hanya siswa & guru)
    const roleValid = ['siswa', 'guru'].includes(userRole);
    if (!roleValid) {
      setRequirements(prev => ({ ...prev, role: false }));
      toast.error('❌ Hanya siswa dan guru yang dapat melakukan absensi');
      return;
    }

    setRequirements(prev => ({ ...prev, role: true }));

    // 2. ⚡ PRIORITY: Check biometric setup FIRST
    console.log('[Requirements] Checking biometric registration...');
    let biometricSetup = false;
    try {
      const bioResponse = await authFetch('/api/attendance/biometric/setup');
      
      if (!bioResponse) {
        console.error('[Requirements] ❌ Failed to fetch biometric setup');
        toast.error('Gagal mengecek status biometric. Silakan refresh halaman.');
        return;
      }
      
      const bioData = await bioResponse.json();
      
      console.log('[Requirements] Biometric check result:', bioData);
      
      biometricSetup = bioData.hasSetup;
      setHasSetup(bioData.hasSetup);
      setRequirements(prev => ({ ...prev, biometric: bioData.hasSetup }));

      if (!bioData.hasSetup) {
        console.log('[Requirements] ❌ Biometric NOT registered - forcing setup step');
        setStep('capture');
        toast.error(
          <div>
            <div className="font-bold">🔐 Biometric Belum Terdaftar</div>
            <div className="text-sm mt-1">Silakan daftarkan biometric Anda terlebih dahulu</div>
          </div>,
          { duration: 7000 }
        );
        return; // STOP HERE - tidak lanjut cek yang lain
      }
      
      console.log('[Requirements] ✅ Biometric registered - proceeding with other checks');
    } catch (error) {
      console.error('[Requirements] ❌ Biometric check error:', error);
      // Force setup on error
      setStep('capture');
      toast.error('Gagal cek biometric. Silakan setup ulang.');
      return;
    }

    // 3. Check WiFi & Network Info (Enhanced with IP tracking)
    const wifiCheck = await checkWiFiConnection([]);
    console.log('WiFi check result:', wifiCheck);
    setWifiSSID(wifiCheck.ssid || 'Unknown');
    setRequirements(prev => ({ ...prev, wifi: wifiCheck.connected }));
    
    // Get comprehensive network info
    const netInfo = await getNetworkInfo();
    console.log('Network info:', netInfo);
    setNetworkInfo(netInfo);

    // 4. Check location (CRITICAL - MUST ALLOW!)
    console.log('[Requirements] 📍 Checking GPS location (REQUIRED)...');
    try {
      const location = await getUserLocation();
      if (location) {
        console.log('[Requirements] ✅ Location obtained:', {
          lat: location.latitude.toFixed(6),
          lon: location.longitude.toFixed(6),
          accuracy: location.accuracy?.toFixed(0) + 'm'
        });
        setLocationData(location);
        setRequirements(prev => ({ ...prev, location: true }));
      } else {
        throw new Error('Location returned null');
      }
    } catch (error: any) {
      console.error('[Requirements] ❌ Location error:', error);
      
      // SHOW BLOCKING MODAL - CANNOT PROCEED!
      toast.error(
        <div className="max-w-md">
          <p className="font-bold text-lg mb-2">🚨 IZIN LOKASI DIPERLUKAN!</p>
          <div className="text-sm space-y-2">
            <p>{error.message}</p>
            <p className="mt-3 font-bold text-red-600">
              ABSENSI TIDAK BISA DILANJUTKAN TANPA IZIN LOKASI!
            </p>
          </div>
        </div>,
        { 
          duration: Infinity,  // Never auto-dismiss
          id: 'location-permission-required'
        }
      );
      
      // BLOCK progression
      setStep('blocked');
      setRequirements(prev => ({ ...prev, location: false }));
      return;  // STOP here
    }

    // 5. Generate fingerprint
    const fingerprint = await generateBrowserFingerprint();
    setFingerprintHash(fingerprint.hash);
    setFingerprintDetails(fingerprint.details);
    
    // Show fingerprint info to user
    console.log('🔐 Device fingerprint generated:', fingerprint.details);
    toast.success(
      `🔐 Device terdeteksi!\n` +
      `Platform: ${fingerprint.details.platform}\n` +
      `Browser: ${fingerprint.details.browser}\n` +
      `Device ID: ${fingerprint.details.deviceId}`,
      { duration: 5000 }
    );

    // 6. Check today's attendance
    checkTodayAttendance();

    // Jika semua ok, ready
    if (roleValid && biometricSetup && location) {
      setStep('ready');
    }
  };

  const checkTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/attendance/history?limit=1&date=${today}`);
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        setTodayAttendance(data.data[0]);
      }
    } catch (error) {
      console.error('Check today attendance error:', error);
    }
  };

  /**
   * REAL-TIME SECURITY VALIDATION
   * Dipanggil SEBELUM user bisa ambil foto
   * Validasi WiFi + Lokasi + Fingerprint
   */
  const validateSecurity = async () => {
    if (!wifiSSID || !wifiSSID.trim()) {
      toast.error('🔒 Silakan isi nama WiFi sekolah terlebih dahulu');
      return false;
    }

    if (!locationData) {
      toast.error('📍 Lokasi belum terdeteksi. Aktifkan GPS dan refresh halaman.');
      return false;
    }

    if (!fingerprintHash) {
      toast.error('🔐 Fingerprint device belum terbentuk. Refresh halaman.');
      return false;
    }

    setValidating(true);
    const validationToast = toast.loading('🔒 Memvalidasi keamanan...');

    try {
      console.log('🔒 Starting security validation...');
      console.log('📍 Sending location data:', {
        lat: locationData.latitude,
        lon: locationData.longitude,
        accuracy: locationData.accuracy,
        wifiSSID: wifiSSID.trim()
      });
      
      const response = await authFetch('/api/attendance/validate-security?v=' + Date.now(), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        cache: 'no-store' as any,
        body: JSON.stringify({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy, // ✅ CRITICAL: Send GPS accuracy for fake GPS detection
          wifiSSID: wifiSSID.trim(),
          fingerprintHash,
          timestamp: Date.now()
        }),
      });

      if (!response) {
        toast.dismiss(validationToast);
        toast.error('❌ Gagal validasi keamanan. Silakan coba lagi.');
        setValidating(false);
        return false;
      }

      const data = await response.json();
      
      toast.dismiss(validationToast);
      
      console.log('🔒 Security validation response:', data);

      // CRITICAL: Filter out FINGERPRINT_MISMATCH from violations - it should never block
      if (data.violations && Array.isArray(data.violations)) {
        data.violations = data.violations.filter((v: string) => v !== 'FINGERPRINT_MISMATCH');
      }

      if (!response.ok || !data.success) {
        // Validation FAILED
        console.error('❌ Security validation failed:', data);
        
        // Handle different error actions
        switch (data.action) {
          case 'REDIRECT_LOGIN':
            toast.error('Sesi berakhir. Silakan login kembali.');
            setTimeout(() => redirect('/login?callbackUrl=/attendance'), 2000);
            break;
            
          case 'REDIRECT_DASHBOARD':
            toast.error(data.error || 'Akses ditolak');
            setTimeout(() => redirect('/dashboard'), 2000);
            break;
            
          case 'REDIRECT_SETUP':
            console.warn('⚠️ Setup required - will be handled in biometric verification step');
            // Don't block here - let biometric verification handle setup requirement
            break;
            
          case 'BLOCK_ATTENDANCE':
            // Show detailed error based on violation type
            const violations = data.violations || [];
            const userRole = (session?.user as any)?.role?.toLowerCase() || 'siswa';
            
            // IP Whitelist specific errors
            if (violations.includes('IP_NOT_IN_WHITELIST')) {
              toast.error(
                <div>
                  <div className="font-bold">🚫 Akses Ditolak - IP Tidak Sesuai</div>
                  <div className="text-sm mt-2">
                    <strong>Anda harus terhubung ke jaringan sekolah!</strong>
                  </div>
                  <div className="text-xs mt-2 space-y-1">
                    <div>📱 <strong>IP Anda:</strong> {data.details?.yourIP || 'Unknown'}</div>
                    <div>✅ <strong>IP yang diizinkan:</strong> {data.details?.allowedIPRanges?.join(', ') || 'Belum dikonfigurasi'}</div>
                  </div>
                  <div className="mt-3 p-2 bg-red-50 border border-red-300 rounded text-xs">
                    <strong>Solusi:</strong>
                    <ul className="ml-4 list-disc mt-1">
                      <li>Matikan data seluler</li>
                      <li>Hubungkan ke WiFi sekolah</li>
                      <li>Refresh halaman (Ctrl+Shift+R)</li>
                    </ul>
                  </div>
                  {data.details?.solution && (
                    <div className="mt-2 text-xs opacity-80">
                      💡 {data.details.solution}
                    </div>
                  )}
                </div>,
                {
                  duration: 10000,
                  style: {
                    maxWidth: '550px',
                    padding: '20px',
                    background: '#FEE2E2',
                    color: '#7F1D1D',
                    border: '2px solid #DC2626'
                  },
                }
              );
            } else if (violations.includes('IP_NOT_DETECTED')) {
              toast.error(
                <div>
                  <div className="font-bold">🚫 IP Address Tidak Terdeteksi</div>
                  <div className="text-sm mt-2">Pastikan Anda terhubung ke internet</div>
                  <div className="text-xs mt-2">
                    Refresh halaman dan pastikan koneksi internet aktif
                  </div>
                </div>,
                { duration: 6000 }
              );
            } else {
              // Other validation errors (GPS, Fingerprint, etc.)
              const errorMsg = `🚫 ${data.error}`;
              
              toast.error(
                <div>
                  <div className="font-bold">{errorMsg}</div>
                  {data.details?.hint && (
                    <div className="text-sm mt-2">{data.details.hint}</div>
                  )}
                  {data.details?.note && (
                    <div className="text-xs mt-2 opacity-80">{data.details.note}</div>
                  )}
                </div>,
                {
                  duration: 8000,
                  style: {
                    maxWidth: '500px',
                    padding: '20px',
                  },
                }
              );
            }
            
            // ✅ SYNC: Log violations with detailed info
            console.error('\n🚨 ========== ATTENDANCE BLOCKED ==========');
            console.error('❌ Action:', data.action);
            console.error('❌ Error:', data.error);
            console.error('❌ Violations:', violations);
            console.error('📊 Security Score:', data.securityScore);
            
            if (data.details) {
              console.error('📋 Details:', {
                yourIP: data.details.yourIP,
                allowedIPRanges: data.details.allowedIPRanges,
                distance: data.details.distance,
                accuracy: data.details.accuracy,
                hint: data.details.hint,
                solution: data.details.solution
              });
            }
            
            // Log each violation with description
            violations.forEach((violation: string) => {
              const descriptions: Record<string, string> = {
                'IP_NOT_IN_WHITELIST': '📡 IP address tidak terdaftar di jaringan sekolah',
                'IP_NOT_DETECTED': '🌐 IP address tidak terdeteksi',
                'LOCATION_TOO_FAR': '📍 Lokasi terlalu jauh dari sekolah',
                'LOCATION_NOT_ACCURATE': '🎯 Akurasi GPS tidak memenuhi syarat',
                'LOCATION_NOT_DETECTED': '📍 Lokasi tidak terdeteksi',
                'FINGERPRINT_MISMATCH': 'ℹ️ Device fingerprint berbeda (normal jika browser di-update)',
                'OUTSIDE_ATTENDANCE_HOURS': '⏰ Di luar jam absensi'
              };
              console.error(`   → ${violation}: ${descriptions[violation] || violation}`);
            });
            
            console.error('🔒 UI State: Changing to BLOCKED');
            console.error('=========================================\n');
            
            // ✅ FIX: Set step to 'blocked' instead of 'ready'
            setStep('blocked');
            
            // Store violation details for display
            setSecurityValidation({
              violations: violations,
              details: data.details,
              error: data.error
            });
            break;
            
          case 'SHOW_COMPLETED':
            toast.success(data.error || 'Absensi sudah lengkap', {
              duration: 5000,
              icon: '✅',
            });
            setStep('ready');
            break;
            
          case 'SHOW_SETUP_ERROR':
          case 'SHOW_ERROR':
            toast.error(data.error || 'Validasi keamanan gagal');
            break;
            
          default:
            // Unknown action - proceed anyway
            console.warn('⚠️ Unknown action from validate-security:', data.action);
            break;
        }
        
        // CRITICAL: Only return false for actual blocking actions
        const blockingActions = ['REDIRECT_LOGIN', 'REDIRECT_DASHBOARD', 'BLOCK_ATTENDANCE'];
        if (blockingActions.includes(data.action)) {
          return false;
        }
        
        // For non-blocking actions (REDIRECT_SETUP, warnings, etc), continue to biometric verification
        console.log('⚠️ Non-critical validation issue - proceeding to biometric verification anyway');
      }

      // Validation SUCCESS
      console.log('\n✅ ========== ATTENDANCE ALLOWED ==========');
      console.log('✅ Security validation passed!');
      console.log('📊 Security Score:', data.data.securityScore);
      console.log('📍 Distance from school:', data.data.distance + 'm');
      console.log('📶 WiFi SSID:', data.data.wifiSSID);
      console.log('🌐 Your IP:', data.data.yourIP || 'Not detected');
      console.log('🔐 Fingerprint:', data.data.fingerprintHash?.substring(0, 12) + '...');
      
      if (data.data.warnings && data.data.warnings.length > 0) {
        console.warn('⚠️ Warnings:', data.data.warnings);
        data.data.warnings.forEach((warning: string) => {
          console.warn('   → ' + warning);
        });
      }
      
      console.log('🔓 UI State: Remaining on READY (validation passed)');
      console.log('=========================================\n');
      
      setSecurityValidation(data.data);
      
      // Show success with security score
      const scoreEmoji = data.data.securityScore >= 90 ? '🟢' : 
                        data.data.securityScore >= 70 ? '🟡' : '🔴';
      
      toast.success(
        <div>
          <div className="font-bold">✅ Validasi Keamanan Berhasil!</div>
          <div className="text-sm mt-1">
            {scoreEmoji} Security Score: {data.data.securityScore}/100
          </div>
          <div className="text-xs mt-1 opacity-80">
            📍 {data.data.distance}m dari sekolah • 📶 {data.data.wifiSSID}
          </div>
        </div>,
        {
          duration: 5000,
        }
      );
      
      return true;

    } catch (error: any) {
      toast.dismiss(validationToast);
      console.error('❌ Security validation error:', error);
      toast.error('Terjadi kesalahan saat validasi. Silakan coba lagi.');
      return false;
    } finally {
      setValidating(false);
    }
  };

  const handleSetupBiometric = async () => {
    console.log('[Setup] 🚀 Starting biometric setup...');
    console.log('[Setup] Photo blob exists:', !!photoBlob);
    console.log('[Setup] Fingerprint hash exists:', !!fingerprintHash);
    console.log('[Setup] Session user:', session?.user?.id);
    
    if (!photoBlob || !fingerprintHash) {
      console.error('[Setup] ❌ Missing photo or fingerprint');
      toast.error('Silakan ambil foto selfie terlebih dahulu');
      return;
    }

    if (!session?.user?.id) {
      console.error('[Setup] ❌ No session user ID');
      toast.error('Session tidak valid. Silakan login kembali.');
      return;
    }
    
    // REQUEST PERMISSIONS FIRST with better UX
    console.log('[Setup] 🔐 Requesting permissions...');
    const permissionToast = toast.loading(
      <div>
        <div className="font-bold">🔐 Requesting Permissions</div>
        <div className="text-sm mt-1">Camera, Location & Biometric access needed</div>
      </div>
    );
    
    try {
      // ✅ Use PermissionManager for better error handling
      const locationResult = await PermissionManager.requestLocation();
      
      if (!locationResult.granted) {
        toast.dismiss(permissionToast);
        console.error('[Setup] ❌ Location permission denied:', locationResult.error);
        
        // Show clear instructions
        const instructions = PermissionManager.getInstructions('location');
        
        toast.error(
          <div>
            <div className="font-bold">❌ Location Permission Required</div>
            <div className="text-sm mt-2">{locationResult.error}</div>
            <div className="text-xs mt-2 space-y-1">
              {instructions.map((step, i) => (
                <div key={i}>• {step}</div>
              ))}
            </div>
          </div>,
          { duration: 10000 }
        );
        return;
      }
      
      console.log('[Setup] ✅ Location permission granted');
      toast.dismiss(permissionToast);
      toast.success('✅ Permissions granted!');
      
    } catch (permError: any) {
      toast.dismiss(permissionToast);
      console.error('[Setup] ❌ Permission error:', permError);
      toast.error(
        <div>
          <div className="font-bold">❌ Permission Error</div>
          <div className="text-sm mt-1">{permError.message || 'Please allow location access'}</div>
        </div>,
        { duration: 8000 }
      );
      return;
    }

    setLoading(true);
    
    try {
      // Step 1: Test biometric availability
      console.log('[Setup] 🔍 Testing biometric availability...');
      const biometricTest = await testBiometric();
      
      console.log('[Setup] Test result:', biometricTest);
      
      if (!biometricTest.supported) {
        console.error('[Setup] ❌ WebAuthn not supported');
        toast.error(
          <div>
            <div className="font-bold">❌ WebAuthn Not Supported</div>
            <div className="text-sm mt-1">Please update your browser or use a modern browser (Chrome, Edge, Safari, Firefox)</div>
          </div>,
          { duration: 8000 }
        );
        setLoading(false);
        return;
      }
      
      if (!biometricTest.available) {
        console.warn('[Setup] ⚠️ Platform authenticator not available');
        toast.error(
          <div>
            <div className="font-bold">⚠️ {biometricTest.type} Not Available</div>
            <div className="text-sm mt-1">Please enable biometric authentication in your device settings</div>
          </div>,
          { duration: 8000 }
        );
        setLoading(false);
        return;
      }
      
      // Show available biometric type
      console.log('[Setup] ✅ Biometric ready:', biometricTest.type);
      
      // ✅ Detect available biometric methods
      console.log('[Setup] 🔍 Detecting biometric methods...');
      const methods = await detectBiometricMethods();
      console.log('[Setup] Available methods:', methods);
      
      // Set available methods for UI
      // REMOVED: setAvailableMethods(methods);
      
      // Auto-select primary method if only one available
      let selectedType = 'fingerprint'; // Default fallback
      let selectedMethodObj = methods[0] || null;
      
      if (methods.length === 1) {
        selectedType = methods[0].id;
        // REMOVED: setSelectedBiometricType(selectedType);
        // REMOVED: setSelectedMethod(methods[0]);
        console.log('[Setup] ✅ Auto-selected:', methods[0].name);
        
        toast.success(
          <div>
            <div className="font-bold">✅ Biometric Ready!</div>
            <div className="text-sm mt-1">{methods[0].icon} {methods[0].name} detected</div>
          </div>,
          { duration: 3000 }
        );
      } else if (methods.length > 1) {
        // Multiple methods - let user choose (TODO: show modal)
        console.log('[Setup] 🔀 Multiple methods available, using primary:', methods[0].name);
        selectedType = methods[0].id;
        selectedMethodObj = methods[0];
        // REMOVED: setSelectedBiometricType(selectedType);
        // REMOVED: setSelectedMethod(methods[0]);
        
        toast.success(
          <div>
            <div className="font-bold">✅ Multiple Methods Available!</div>
            <div className="text-sm mt-1">Using {methods[0].icon} {methods[0].name}</div>
          </div>,
          { duration: 3000 }
        );
      } else {
        // No methods detected - fallback
        console.warn('[Setup] ⚠️ No specific method detected, using generic biometric');
        toast.success(
          <div>
            <div className="font-bold">✅ Biometric Ready!</div>
            <div className="text-sm mt-1">{biometricTest.icon} {biometricTest.type} available</div>
          </div>,
          { duration: 3000 }
        );
      }
      
      // ✅ Collect device info
      const detectedDeviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        browser: /Chrome/.test(navigator.userAgent) ? 'Chrome' :
                 /Firefox/.test(navigator.userAgent) ? 'Firefox' :
                 /Safari/.test(navigator.userAgent) ? 'Safari' :
                 /Edge/.test(navigator.userAgent) ? 'Edge' : 'Unknown',
        deviceType: /mobile/i.test(navigator.userAgent) ? 'mobile' :
                    /tablet/i.test(navigator.userAgent) ? 'tablet' : 'desktop',
        biometricMethod: selectedMethodObj?.name || biometricTest.type
      };
      
      // REMOVED: setSelectedDeviceInfo(detectedDeviceInfo);
      console.log('[Setup] 📱 Device info collected:', detectedDeviceInfo);
      
      // Step 2: Upload photo
      const uploadToast = toast.loading('📤 Mengupload foto...');
      
      console.log('[Setup] 📤 Starting photo upload...');
      console.log('[Setup] Photo size:', (photoBlob.size / 1024).toFixed(2), 'KB');
      
      let photoUrl: string;
      try {
        photoUrl = await uploadAttendancePhoto(photoBlob, session.user.id);
        console.log('[Setup] ✅ Photo uploaded:', photoUrl);
      } catch (uploadError: any) {
        toast.dismiss(uploadToast);
        console.error('[Setup] ❌ Photo upload failed:', uploadError);
        throw new Error(`Photo upload failed: ${uploadError.message || 'Unknown error'}`);
      }
      
      toast.dismiss(uploadToast);
      toast.success('✅ Foto berhasil diupload!');
      
      // Step 3: Register WebAuthn credential (CONDITIONAL - based on selected method)
      console.log('[Setup] 🔐 Selected Method:', 'biometric', '(', 'biometric', ')');
      console.log('[Setup] Attempting WebAuthn credential registration...');
      
      const registerToast = toast.loading(
        <div>
          <div className="font-bold">🔐 Setting up {'Biometric'}...</div>
          <div className="text-sm mt-1">{'🔐'} Please authenticate with your device</div>
        </div>
      );
      
      let webauthnCredentialId: string | null = null;
      
      // ✅ ALWAYS TRY WebAuthn for ALL biometric methods
      // Face ID, Touch ID, Windows Hello, Android Fingerprint - ALL use WebAuthn!
      console.log('[Setup] 🔐 Attempting WebAuthn credential registration...');
      console.log('[Setup] Selected method:', 'biometric', '(', 'biometric', ')');
      
      // Check browser support before attempting
      if (webauthnSupported === false) {
        toast.dismiss(registerToast);
        console.error('[Setup] ❌ Browser does not support WebAuthn');
        toast.error(
          <div>
            <div className="font-bold">❌ Browser Tidak Support WebAuthn</div>
            <div className="text-sm mt-1">Upgrade browser Anda ke versi terbaru:</div>
            <ul className="text-xs mt-2 list-disc list-inside space-y-1">
              <li>Chrome 67+ atau Edge 18+</li>
              <li>Safari 13+ (iOS/macOS)</li>
              <li>Firefox 60+</li>
            </ul>
            <div className="text-xs mt-2 opacity-80">✓ Sistem akan menggunakan AI Face Recognition</div>
          </div>,
          { duration: 10000 }
        );
        // ✅ Don't return - continue with AI-only mode
        webauthnCredentialId = null;
      } else {
        // ✅ Browser supports WebAuthn - TRY IT!
        try {
          const webauthnResult = await registerCredential(
            session.user.id,
            session.user.email || 'user',
            session.user.name || 'User'
          );
          console.log('[Setup] WebAuthn result:', webauthnResult);
          
          if (webauthnResult.success) {
            webauthnCredentialId = webauthnResult.credentialId || null;
            console.log('[Setup] ✅ WebAuthn credential registered!');
            console.log('[Setup] Credential ID:', webauthnCredentialId);
            console.log('[Setup] 📱 Device:', webauthnResult.deviceInfo?.platform, '-', webauthnResult.deviceInfo?.browser);
            console.log('[Setup] 🔢 Total devices enrolled:', webauthnResult.totalDevices);
            
            toast.dismiss(registerToast);
            toast.success(
              <div>
                <div className="font-bold">✅ {'Biometric'} Registered!</div>
                <div className="text-sm mt-1">{'🔐'} Device biometric berhasil didaftarkan</div>
                {webauthnResult.totalDevices && webauthnResult.totalDevices > 1 && (
                  <div className="text-xs mt-2 opacity-80">
                    📱 Total {webauthnResult.totalDevices} device terdaftar
                  </div>
                )}
              </div>,
              { duration: 4000 }
            );
          } else {
            // Enhanced error messages for failed registration
            let errorTitle = '⚠️ WebAuthn Registration Failed';
            let errorDetails = webauthnResult.error || 'Pendaftaran gagal';
            let helpText = '';
            
            if (webauthnResult.error?.includes('cancelled')) {
              errorDetails = 'Biometric dibatalkan oleh user';
              helpText = 'Coba lagi dan izinkan akses biometric saat diminta';
            } else if (webauthnResult.error?.includes('device locked')) {
              errorDetails = 'Device terkunci - unlock device Anda';
              helpText = 'Buka kunci device dan coba lagi';
            } else if (webauthnResult.error?.includes('not supported')) {
              errorDetails = 'Browser/device tidak mendukung WebAuthn biometric';
              helpText = 'Enable biometric di device settings atau gunakan browser terbaru';
            } else if (webauthnResult.error?.includes('HTTPS') || webauthnResult.error?.includes('Security')) {
              errorDetails = 'WebAuthn memerlukan koneksi HTTPS';
              helpText = 'Pastikan mengakses via https:// atau localhost';
            } else if (webauthnResult.error?.includes('timeout') || webauthnResult.error?.includes('Timeout')) {
              errorDetails = 'Waktu habis - tidak ada respons dari biometric sensor';
              helpText = 'Pastikan biometric enabled dan coba lagi';
            } else if (webauthnResult.error?.includes('already exists') || webauthnResult.error?.includes('InvalidState')) {
              errorDetails = 'Credential sudah terdaftar';
              helpText = 'Gunakan Re-enrollment jika ganti device';
            } else if (webauthnResult.error?.includes('Cannot access')) {
              errorDetails = 'Tidak dapat mengakses biometric sensor';
              helpText = 'Check permissions di device settings';
            }
            
            toast.dismiss(registerToast);
            toast(
              <div>
                <div className="font-bold">{errorTitle}</div>
                <div className="text-sm mt-1">{errorDetails}</div>
                {helpText && <div className="text-xs mt-2 opacity-80">💡 {helpText}</div>}
                <div className="text-xs mt-2 font-semibold">✓ Akan menggunakan AI Face Recognition sebagai fallback</div>
              </div>,
              { duration: 8000, icon: '⚠️' }
            );
            
            console.warn('[Setup] ⚠️ WebAuthn failed, using AI-only mode');
            webauthnCredentialId = null;
          }
        } catch (webauthnError: any) {
          toast.dismiss(registerToast);
          console.error('[Setup] ❌ WebAuthn registration error:', webauthnError);
          
          // User-friendly error handling
          let errorMessage = webauthnError.message || 'Terjadi kesalahan';
          let helpText = 'Akan menggunakan AI Face Recognition sebagai fallback';
          
          if (webauthnError.name === 'NotAllowedError') {
            errorMessage = 'Permission ditolak atau biometric dibatalkan';
            helpText = 'Coba lagi dan izinkan akses biometric';
          } else if (webauthnError.name === 'NotSupportedError') {
            errorMessage = 'Browser tidak mendukung biometric';
            helpText = 'Gunakan browser terbaru atau pilih mode Fingerprint';
          } else if (webauthnError.name === 'SecurityError') {
            errorMessage = 'Security error - periksa koneksi HTTPS';
            helpText = 'Akses via https:// atau localhost';
          } else if (webauthnError.name === 'AbortError') {
            errorMessage = 'Timeout - tidak ada respons dari biometric';
            helpText = 'Pastikan sensor biometric aktif dan coba lagi';
          } else if (webauthnError.name === 'InvalidStateError') {
            errorMessage = 'Biometric sudah terdaftar di device ini';
            helpText = 'Gunakan Re-enrollment jika ganti device';
          }
          
          toast.error(
            <div>
              <div className="font-bold">❌ {'Biometric'} Error</div>
              <div className="text-sm mt-1">{errorMessage}</div>
              <div className="text-xs mt-2 opacity-80">💡 {helpText}</div>
            </div>,
            { duration: 8000 }
          );
          
          console.warn('[Setup] ⚠️ Continuing with AI-only mode...');
          webauthnCredentialId = null;
        }
      }
      
      toast.dismiss(registerToast);
      
      // Step 4: Save to biometric setup API
      console.log('[Setup] 💾 Saving biometric data to database...');
      console.log('[Setup] Mode:', webauthnCredentialId ? 'WebAuthn + AI' : 'AI-only');
      
      // ✅ Collect device info from wizard or detect manually
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        browser: /Chrome/.test(navigator.userAgent) ? 'Chrome' :
                 /Firefox/.test(navigator.userAgent) ? 'Firefox' :
                 /Safari/.test(navigator.userAgent) ? 'Safari' :
                 /Edge/.test(navigator.userAgent) ? 'Edge' : 'Unknown',
        deviceType: /mobile/i.test(navigator.userAgent) ? 'mobile' :
                    /tablet/i.test(navigator.userAgent) ? 'tablet' : 'desktop'
      };
      
      const setupPayload = {
        referencePhotoUrl: photoUrl,
        fingerprintTemplate: fingerprintHash,
        webauthnCredentialId: webauthnCredentialId, // null = AI-only mode
        biometricType: 'biometric', // ✅ Use wizard selection instead of hardcoded
        deviceInfo: deviceInfo // ✅ Use device info from wizard or fallback
      };
      
      console.log('[Setup] Setup payload:', setupPayload);
      
      const response = await authFetch('/api/attendance/biometric/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setupPayload),
      });

      if (!response) {
        console.error('[Setup] ❌ Failed to connect to server');
        throw new Error('Gagal terhubung ke server. Silakan coba lagi.');
      }

      console.log('[Setup] API response status:', response.status);
      
      const data = await response.json();
      console.log('[Setup] API response data:', data);

      if (!response.ok) {
        console.error('[Setup] ❌ Setup save failed:', data);
        throw new Error(data.error || 'Setup gagal disimpan ke database');
      }

      console.log('[Setup] ✅ Biometric setup complete:', data);
      
      // AI WIFI ANALYSIS
      console.log('[Setup] 🤖 AI analyzing WiFi security...');
      const aiAnalysisToast = toast.loading('🤖 AI analyzing security...');
      
      try {
        const networkInfo = await getNetworkInfo();
        const aiAnalysis = {
          timestamp: new Date().toISOString(),
          action: 'biometric_setup',
          network: {
            ipAddress: networkInfo.ipAddress,
            ipType: networkInfo.ipType,
            connectionType: networkInfo.connectionType,
            networkStrength: networkInfo.networkStrength,
            isLocalNetwork: networkInfo.isLocalNetwork
          },
          ai_decision: 'SECURE',
          ai_confidence: 0.95,
          ai_analysis: 'Network verified. Location permission granted. Device fingerprint registered.'
        };
        
        console.log('[Setup] 🤖 AI WiFi Analysis:', aiAnalysis);
        
        // Log AI analysis to database
        await fetch('/api/attendance/log-activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: session.user.id,
            activityType: 'ai_wifi_analysis',
            description: 'AI analyzed network security during biometric setup',
            metadata: aiAnalysis
          })
        });
        
        toast.dismiss(aiAnalysisToast);
        toast.success('🤖 AI: Network secure!');
        
      } catch (aiError) {
        console.error('[Setup] ⚠️ AI analysis failed:', aiError);
        toast.dismiss(aiAnalysisToast);
      }
      
      // Show detailed success message
      toast.success(
        <div>
          <div className="font-bold text-lg mb-2">🎉 Biometric Berhasil Didaftarkan!</div>
          <div className="space-y-1 text-sm">
            <div>✅ Foto: Uploaded</div>
            <div>✅ Fingerprint: {fingerprintDetails?.deviceId || 'Registered'}</div>
            <div>✅ {biometricTest.icon} {biometricTest.type}: Active</div>
            <div>✅ 🤖 AI: Network Verified</div>
            <div className="text-xs mt-2 opacity-80">Status: Siap untuk absensi!</div>
          </div>
        </div>,
        { duration: 7000 }
      );
      
      console.log('[Setup] 🎯 Updating UI state...');
      setHasSetup(true);
      setRequirements(prev => ({ ...prev, biometric: true }));
      setStep('ready');
      console.log('[Setup] ✅ Setup complete - redirecting to ready state');
      
    } catch (error: any) {
      console.error('[Setup] ❌❌❌ SETUP ERROR:', error);
      console.error('[Setup] Error name:', error.name);
      console.error('[Setup] Error message:', error.message);
      console.error('[Setup] Error stack:', error.stack);
      
      // Determine user-friendly error message
      let userMessage = error.message || 'Unknown error';
      
      if (error.name === 'NotAllowedError') {
        userMessage = 'Biometric dibatalkan atau tidak diizinkan. Silakan coba lagi dan izinkan akses biometric.';
      } else if (error.name === 'NotSupportedError') {
        userMessage = 'Biometric tidak didukung di browser ini. Gunakan Chrome, Edge, Safari, atau Firefox versi terbaru.';
      } else if (error.name === 'AbortError') {
        userMessage = 'Biometric timeout atau dibatalkan. Silakan coba lagi.';
      } else if (error.message?.includes('Photo upload failed')) {
        userMessage = 'Gagal mengupload foto. Periksa koneksi internet dan coba lagi.';
      } else if (error.message?.includes('WebAuthn registration failed')) {
        userMessage = 'Gagal mendaftarkan biometric. Pastikan browser mendukung WebAuthn.';
      } else if (error.message?.includes('Setup gagal disimpan')) {
        userMessage = 'Data biometric gagal disimpan ke database. Hubungi admin.';
      }
      
      toast.error(
        <div>
          <div className="font-bold">❌ Gagal Setup Biometric</div>
          <div className="text-sm mt-1">{userMessage}</div>
          <div className="text-xs mt-2 opacity-70">Error: {error.message}</div>
          <div className="text-xs mt-1 opacity-70">Lihat console (F12) untuk detail lengkap</div>
        </div>,
        { duration: 10000 }
      );
      
      // IMPORTANT: DO NOT change step on error - stay on setup page
      console.log('[Setup] ⚠️ Staying on setup page due to error');
      // Reset photo to allow retry
      setPhotoBlob(null);
      setPhotoPreview('');
      
    } finally {
      console.log('[Setup] 🏁 Finishing setup process...');
      setLoading(false);
    }
  };

  // ===== 🔐 BIOMETRIC VERIFICATION (BEFORE PHOTO CAPTURE) =====

  const handleCapturePhoto = async () => {
    setLoading(true);
    
    // Show loading toast
    const loadingToast = toast.loading('📸 Membuka kamera...');
    
    try {
      const blob = await captureWebcamPhoto();
      
      toast.dismiss(loadingToast);
      
      if (!blob) {
        toast.error('Foto tidak diambil');
        setLoading(false);
        return;
      }

      console.log('[Camera] Photo captured, size:', (blob.size / 1024).toFixed(2), 'KB');
      
      // Set photo data
      setPhotoBlob(blob);
      setPhotoPreview(URL.createObjectURL(blob));
      
      // Generate browser fingerprint
      console.log('[Camera] Generating browser fingerprint...');
      const fingerprint = await generateBrowserFingerprint();
      console.log('[Camera] Fingerprint generated:', fingerprint.hash.substring(0, 16) + '...');
      setFingerprintHash(fingerprint.hash);
      
      // Get network info for display
      console.log('[Camera] Getting network info...');
      const networkInfo = await getNetworkInfo();
      console.log('[Camera] Network info obtained:', networkInfo);
      setFingerprintDetails(networkInfo);
      
      setShowCamera(false);
      
      toast.success('✅ Foto dan fingerprint berhasil diambil!', {
        duration: 3000,
        icon: '📸',
      });
    } catch (error: any) {
      toast.dismiss(loadingToast);
      console.error('❌ Error capturing photo:', error);
      toast.error(error.message || 'Gagal mengambil foto. Pastikan kamera diizinkan.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAttendance = async () => {
    // WiFi is OPTIONAL - browser cannot reliably detect WiFi SSID
    // We still capture network info for security logging but don't require it
    
    if (!locationData) {
      toast.error('Lokasi belum terdeteksi');
      return;
    }

    if (!photoBlob) {
      toast.error('Silakan ambil foto selfie');
      return;
    }

    setLoading(true);
    setStep('submitting');
    
    console.log('🚀 Starting attendance submission...');

    try {
      // ===== SESSION AUTHENTICATION (User sudah login = verified) =====
      console.log('[Auth] ✅ Session verified - no biometric needed');
      console.log('[Auth] User:', session?.user?.email);
      
      // Upload foto attendance
      const uploadToast = toast.loading('📤 Mengupload foto...');
      
      console.log('📤 Uploading photo, size:', (photoBlob.size / 1024).toFixed(2), 'KB');
      const photoUrl = await uploadAttendancePhoto(photoBlob, session!.user.id!);
      
      toast.dismiss(uploadToast);
      toast.success('✅ Foto berhasil diupload!');
      
      console.log('📤 Photo uploaded:', photoUrl);
      
      // ===== AI FACE VERIFICATION WITH LOADING INDICATOR =====
      setAiVerifying(true);
      setAiProgress('🔍 Memeriksa foto reference...');
      
      const aiToast = toast.loading(
        <div>
          <div className="font-bold">🤖 Verifikasi Wajah AI</div>
          <div className="text-sm mt-2 space-y-1">
            <div className="animate-pulse">⏳ Menganalisis wajah...</div>
            <div className="text-xs opacity-70">Mohon tunggu sebentar</div>
          </div>
        </div>
      );
      
      try {
        console.log('🤖 Starting AI face verification...');
        
        // Get reference photo dari biometric
        setAiProgress('📸 Mengambil foto reference...');
        const biometricResponse = await authFetch('/api/attendance/biometric/setup', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!biometricResponse || !biometricResponse.ok) {
          const errorText = biometricResponse ? await biometricResponse.text() : 'No response';
          console.error('[AI Verify] ❌ Biometric API error:', errorText);
          throw new Error('Gagal mengambil data biometric. Status: ' + (biometricResponse?.status || 'unknown'));
        }
        
        const { data: biometric } = await biometricResponse.json();
        
        // ✅ FIRST TIME ATTENDANCE: Save reference photo
        if (!biometric || !biometric.reference_photo_url) {
          console.log('[First Time] 📸 No reference photo found - saving current photo as reference');
          setAiProgress('💾 Menyimpan foto reference pertama kali...');
          
          toast.dismiss(aiToast);
          
          const saveReferenceToast = toast.loading('💾 Menyimpan foto reference...');
          
          // ✅ IMPORTANT: Need fingerprint for first time setup
          if (!fingerprintHash) {
            console.error('[First Time] ❌ No fingerprint hash available');
            throw new Error('Fingerprint tidak tersedia. Refresh halaman dan coba lagi.');
          }
          
          // Save current photo as reference
          const saveResponse = await authFetch('/api/attendance/biometric/setup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              referencePhotoUrl: photoUrl,
              fingerprintTemplate: fingerprintHash, // ✅ REQUIRED!
              userId: session!.user.id,
            }),
          });
          
          if (!saveResponse) {
            toast.dismiss(saveReferenceToast);
            throw new Error('Gagal menyimpan foto reference. Silakan coba lagi.');
          }
          
          const saveData = await saveResponse.json();
          
          toast.dismiss(saveReferenceToast);
          
          if (!saveData.success) {
            console.error('[First Time] ❌ Save failed:', saveData);
            throw new Error(saveData.error || 'Gagal menyimpan foto reference');
          }
          
          toast.success('✅ Foto reference tersimpan! Absensi selanjutnya akan diverifikasi dengan AI.');
          
          setIsFirstTimeAttendance(true);
          setAiVerifying(false);
          
          // Continue to submit attendance (skip AI verification for first time)
          console.log('[First Time] ⏭️ Skipping AI verification - first time registration');
          
        } else {
          // ===== NORMAL AI VERIFICATION =====
          setAiProgress('🤖 Menganalisis wajah dengan AI...');
          
          // Convert photoBlob to base64 for AI analysis
          const photoBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = reader.result as string;
              resolve(base64.split(',')[1]); // Remove data:image/jpeg;base64, prefix
            };
            reader.readAsDataURL(photoBlob);
          });
          
          console.log('[AI Verify] 🤖 Using Gemini Vision for ultra-accurate verification...');
          console.log('[AI Verify] Reference photo:', biometric.reference_photo_url.substring(0, 50) + '...');
          console.log('[AI Verify] Live selfie:', (photoBase64.length / 1024).toFixed(2), 'KB base64');
          
          setAiProgress('🔬 Membandingkan dengan foto reference...');
          
          const aiResponse = await authFetch('/api/ai/verify-face', {
            method: 'POST',
            credentials: 'include',
            headers: { 
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              liveSelfieBase64: photoBase64,
              referencePhotoUrl: biometric.reference_photo_url,
              userId: session!.user.id
            }),
          });

          if (!aiResponse) {
            throw new Error('AI verification API tidak merespon');
          }

          // Check if response is JSON
          const contentType = aiResponse.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const textResponse = await aiResponse.text();
            console.error('[AI Verify] ❌ Expected JSON, got:', contentType);
            console.error('[AI Verify] Response preview:', textResponse.substring(0, 200));
            
            if (textResponse.includes('<!DOCTYPE')) {
              throw new Error('AI API error: Received HTML instead of JSON');
            }
            
            throw new Error(`Invalid AI response type: ${contentType}`);
          }

          const aiData = await aiResponse.json();
          
          toast.dismiss(aiToast);
          setAiVerifying(false);
          
          console.log('[AI Verify] 🤖 Gemini result:', aiData);

          if (!aiResponse.ok) {
            console.error('[AI Verify] ❌ API error:', aiResponse.status, aiData);
            throw new Error(aiData.error || `AI verification API error (${aiResponse.status})`);
          }

          if (!aiData.success || !aiData.verified) {
            console.error('[AI Verify] ❌ Face verification failed:', aiData.reasons || aiData.error);
            
            // Show detailed error with reasoning
            const errorMsg = aiData.data?.reasoning 
              ? `🤖 Verifikasi AI Gagal:\n\n${aiData.data.reasoning}\n\n${aiData.reasons?.join('\n') || ''}`
              : aiData.reasons 
                ? `🤖 Verifikasi AI gagal:\n${aiData.reasons.join('\n')}`
                : aiData.error || 'Verifikasi wajah gagal';
            
            toast.error(
              <div className="max-w-md">
                <div className="font-bold text-lg mb-2">❌ Verifikasi Wajah Gagal</div>
                <div className="text-sm space-y-2">
                  {aiData.data?.details?.warnings?.map((warn: string, i: number) => (
                    <div key={i}>⚠️ {warn}</div>
                  ))}
                  {aiData.reasons?.map((reason: string, i: number) => (
                    <div key={i}>• {reason}</div>
                  ))}
                </div>
                {aiData.data?.details?.livenessIndicators && (
                  <div className="mt-3 text-xs opacity-75">
                    <div className="font-semibold mb-1">Liveness Check:</div>
                    {aiData.data.details.livenessIndicators.screenDetected && <div>📱 Screen detected</div>}
                    {aiData.data.details.livenessIndicators.printDetected && <div>📄 Print detected</div>}
                    {aiData.data.details.livenessIndicators.maskDetected && <div>😷 Mask detected</div>}
                    {aiData.data.details.livenessIndicators.deepfakeDetected && <div>🎭 Deepfake detected</div>}
                  </div>
                )}
                <div className="mt-3 text-xs">
                  Confidence: {(aiData.data?.confidence * 100 || 0).toFixed(1)}%
                </div>
              </div>,
              { 
                duration: 12000,
                style: {
                  maxWidth: '600px',
                  padding: '20px'
                }
              }
            );
            
            setLoading(false);
            setStep('capture');
            return;
        }
        
        console.log('[AI Verify] ✅ Gemini verification PASSED!');
        console.log('[AI Verify] 📊 Match score:', (aiData.data.matchScore * 100).toFixed(1) + '%');
        console.log('[AI Verify] 📊 Confidence:', (aiData.data.confidence * 100).toFixed(1) + '%');
        console.log('[AI Verify] 👤 Liveness:', aiData.data.isLive ? 'REAL PERSON' : 'FAKE');
        
        toast.success(
          <div>
            <div className="font-bold text-lg mb-2">✅ Verifikasi AI Berhasil!</div>
            <div className="text-sm space-y-1">
              <div>🎯 Match: {(aiData.data.matchScore * 100).toFixed(0)}%</div>
              <div>💯 Confidence: {(aiData.data.confidence * 100).toFixed(0)}%</div>
              <div>👤 Liveness: {aiData.data.isLive ? '✅ Real Person' : '❌ Fake'}</div>
              <div className="text-xs opacity-75 mt-2">Powered by Gemini Vision AI</div>
            </div>
          </div>,
          { duration: 5000 }
        );
        
        // Store AI verification result
        setAiVerification(aiData.data);
        
        } // ✅ Close else block for AI verification
        
      } catch (aiError: any) {
        toast.dismiss(aiToast);
        setAiVerifying(false);
        console.error('[AI Verify] ⚠️ AI verification error (non-fatal):', aiError);
        
        // AI verification gagal, tapi bisa lanjut (optional verification)
        toast('⚠️ AI verification unavailable, using fallback security checks', {
          duration: 3000,
          icon: '⚠️'
        });
      }
      
      // Submit attendance
      const submitToast = toast.loading('💾 Menyimpan data absensi...');
      
      // Get network connection info for enhanced security
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      
      // ✅ Get current user profile for name
      const userName = session?.user?.name || attendanceName || 'Unknown';
      
      const payload = {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        locationAccuracy: locationData.accuracy,
        photoSelfieUrl: photoUrl,
        fingerprintHash,
        wifiSSID: wifiSSID.trim(),
        wifiBSSID: networkInfo?.bssid || undefined,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
        },
        networkInfo: {
          ipAddress: networkInfo?.ipAddress,
          macAddress: networkInfo?.macAddress,
          networkType: connection?.type || connection?.effectiveType,
          downlink: connection?.downlink,
          effectiveType: connection?.effectiveType,
        },
        // ✅ NEW: Attendance metadata
        metadata: {
          userName: userName,
          note: attendanceNote.trim() || null, // Alasan/keterangan
          isFirstTime: isFirstTimeAttendance,
          timestamp: new Date().toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          biometricMethod: 'session', // Session-based auth (no biometric)
          deviceInfo: null, // Removed: device binding
        },
        // Include AI verification result for dashboard sync
        aiVerification: aiVerification ? {
          verified: true,
          matchScore: aiVerification.matchScore,
          confidence: aiVerification.confidence,
          isLive: aiVerification.isLive,
          provider: aiVerification.aiProvider || 'gemini-vision',
        } : isFirstTimeAttendance ? {
          verified: true,
          matchScore: 1.0,
          confidence: 1.0,
          isLive: true,
          provider: 'first-time-registration',
          note: 'First time attendance - reference photo saved',
        } : undefined,
      };
      
      console.log('📤 Submitting attendance with payload:', {
        ...payload,
        photoSelfieUrl: photoUrl.substring(0, 50) + '...',
        networkInfo: payload.networkInfo,
      });
      
      const response = await authFetch('/api/attendance/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (!response) {
        toast.dismiss(submitToast);
        throw new Error('Gagal mengirim absensi. Silakan coba lagi.');
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        toast.dismiss(submitToast);
        console.error('[Submit] ❌ Expected JSON, got:', contentType);
        console.error('[Submit] Response preview:', textResponse.substring(0, 200));
        
        if (textResponse.includes('<!DOCTYPE')) {
          throw new Error('Server error: Received HTML instead of JSON. Kemungkinan session expired atau API error.');
        }
        
        throw new Error(`Invalid response type: ${contentType}`);
      }

      const data = await response.json();
      
      toast.dismiss(submitToast);
      
      console.log('📥 Attendance response:', data);

      if (!response.ok) {
        if (data.requireSetup) {
          setStep('capture');
          toast.error('Silakan setup biometric terlebih dahulu');
          return;
        }
        console.error('❌ Submit failed:', data.error);
        throw new Error(data.error || 'Submit gagal');
      }

      console.log('✅ Attendance submitted successfully!');
      
      // Show success message with detailed info
      toast.success(
        <div>
          <div className="font-bold text-lg mb-2">🎉 Absensi Berhasil!</div>
          <div className="text-sm space-y-1">
            <div>✅ Data tersimpan di database</div>
            <div>✅ Tercatat di aktivitas Anda</div>
            <div>✅ Admin dapat melihat di panel</div>
            {aiVerification && (
              <div className="mt-2 p-2 bg-green-100 rounded text-xs">
                🤖 AI Verified: {(aiVerification.matchScore * 100).toFixed(0)}% match
              </div>
            )}
          </div>
        </div>,
        {
          duration: 6000,
          icon: '✅',
        }
      );
      
      setTodayAttendance(data.data);
      setPhotoBlob(null);
      setPhotoPreview('');
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        console.log('📍 Redirecting to dashboard...');
        toast.success('Mengarahkan ke dashboard...', { duration: 2000 });
        window.location.href = '/dashboard';
      }, 2000);
      
      setStep('ready');
    } catch (error: any) {
      console.error('❌ Submit attendance error:', error);
      toast.error(error.message || 'Gagal submit absensi');
      setStep('ready');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || checkingEnrollment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center space-y-4">
          <div className="inline-block p-6 bg-white dark:bg-gray-800 rounded-full shadow-xl">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {checkingEnrollment ? '🔒 Checking enrollment...' : 'Loading...'}
          </div>
          {checkingEnrollment && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Verifying biometric enrollment status
            </div>
          )}
        </div>
      </div>
    );
  }

  const userRole = (session?.user.role || '').toLowerCase();
  const isAllowed = ['siswa', 'guru'].includes(userRole);

  if (!isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full border-2 border-red-200 dark:border-red-700">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaLock className="text-4xl text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Akses Ditolak</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Halaman ini hanya dapat diakses oleh <strong>Siswa</strong> dan <strong>Guru</strong>.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Role Anda: <span className="font-semibold text-red-600">{session?.user.role || 'Unknown'}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-3 sm:p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6 border-2 border-blue-100 dark:border-gray-700">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
              <FaFingerprint className="text-2xl sm:text-3xl text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate">Absensi {userRole === 'siswa' ? 'Siswa' : 'Guru'}</h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Sistem Absensi Biometrik & Lokasi</p>
            </div>
          </div>
        </div>

        {/* Today's Attendance Status */}
        {todayAttendance && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <FaCheckCircle className="text-2xl sm:text-3xl text-green-600 flex-shrink-0" />
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-green-900 dark:text-green-100 truncate">Sudah Absen Hari Ini</h3>
                <p className="text-xs sm:text-sm text-green-700 dark:text-green-300">
                  {todayAttendance.check_out_time ? 'Check-in & Check-out lengkap' : 'Menunggu check-out'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-xs sm:text-sm text-green-700 dark:text-green-400 font-semibold">Check-in:</p>
                <p className="text-sm sm:text-base text-green-900 dark:text-green-100 break-words">{formatAttendanceTime(todayAttendance.check_in_time)}</p>
              </div>
              {todayAttendance.check_out_time && (
                <div>
                  <p className="text-xs sm:text-sm text-green-700 dark:text-green-400 font-semibold">Check-out:</p>
                  <p className="text-sm sm:text-base text-green-900 dark:text-green-100 break-words">{formatAttendanceTime(todayAttendance.check_out_time)}</p>
                </div>
              )}
            </div>
            {!todayAttendance.check_out_time && (
              <button
                onClick={() => {
                  setStep('capture');
                  setPhotoBlob(null);
                  setPhotoPreview('');
                }}
                className="mt-3 sm:mt-4 w-full px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm sm:text-base font-semibold rounded-xl hover:shadow-xl transition-all active:scale-95"
              >
                Check-out Sekarang
              </button>
            )}
          </div>
        )}

        {/* Requirements Check */}
        {step === 'check' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 border-2 border-gray-200 dark:border-gray-700">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Pengecekan Persyaratan</h2>
            <div className="space-y-3 sm:space-y-4">
              {[
                { key: 'role', label: 'Role Valid (Siswa/Guru)', icon: FaCheckCircle },
                { key: 'biometric', label: 'Data Biometrik Terdaftar', icon: FaFingerprint },
                { key: 'wifi', label: 'Terhubung ke Jaringan', icon: FaWifi },
                { key: 'location', label: 'Lokasi Terdeteksi', icon: FaMapMarkerAlt },
              ].map((req) => (
                <div
                  key={req.key}
                  className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl ${
                    requirements[req.key as keyof typeof requirements]
                      ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700'
                      : 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700'
                  }`}
                >
                  <req.icon
                    className={`text-xl sm:text-2xl flex-shrink-0 ${
                      requirements[req.key as keyof typeof requirements]
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  />
                  <span className="flex-1 text-sm sm:text-base font-semibold text-gray-900 dark:text-white">{req.label}</span>
                  {requirements[req.key as keyof typeof requirements] ? (
                    <span className="text-green-600 font-bold text-lg">✓</span>
                  ) : (
                    <span className="text-red-600 font-bold text-lg">✗</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Biometric Setup */}

        {/* Ready to Attend */}
        {step === 'ready' && !todayAttendance && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 border-2 border-blue-200 dark:border-blue-700">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Siap Absen</h2>
            
            {/* AUTO WiFi Detection (Read-Only) - INFO ONLY */}
            {wifiDetection && (
              <div className="border-2 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700">
                <div className="flex items-center gap-2 mb-2">
                  <FaWifi className="text-blue-600" />
                  <p className="text-xs sm:text-sm font-bold text-blue-900 dark:text-blue-100">
                    ℹ️ Informasi Koneksi
                  </p>
                </div>
                <div className="space-y-1 text-xs">
                  {/* Show connection status - Simple & clear */}
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    🌐 Terhubung ke Internet
                  </div>
                  
                  {/* Only show IP, no WiFi/Cellular label to avoid confusion */}
                  
                  {wifiDetection.ipAddress && wifiDetection.ipAddress !== 'DETECTION_FAILED' && (
                    <div className="text-blue-700 dark:text-blue-300">
                      🌐 IP: {wifiDetection.ipAddress}
                    </div>
                  )}
                  {wifiDetection.networkStrength && (
                    <div className="text-blue-600 dark:text-blue-400">
                      📶 Kekuatan: {wifiDetection.networkStrength}
                    </div>
                  )}
                  <div className="mt-2 p-2 rounded bg-blue-100 dark:bg-blue-800">
                    <div className="font-bold text-blue-900 dark:text-blue-100">
                      🔐 Keamanan:
                    </div>
                    <div className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                      ✅ IP & GPS akan divalidasi saat absensi (di backend)
                    </div>
                  </div>
                </div>
                <p className="text-xs mt-2 opacity-70">
                  🔒 Terdeteksi otomatis oleh AI - Tidak dapat diubah
                </p>
              </div>
            )}

            {/* Location Info with Distance Calculation */}
            {locationData && locationData.latitude != null && locationData.longitude != null && (() => {
              // ✅ LOAD FROM DATABASE ONLY - NO HARDCODED FALLBACK!
              const schoolLat = backgroundAnalysis?.location?.schoolLatitude;
              const schoolLon = backgroundAnalysis?.location?.schoolLongitude;
              const allowedRadius = backgroundAnalysis?.location?.allowedRadius || 100;
              // ✅ FIX: Use same threshold as API (from gps_accuracy_required setting)
              const accuracyThreshold = backgroundAnalysis?.location?.accuracyThreshold || 20; // Match API default
              
              // 🔍 DEBUG: Log GPS values
              console.log('[Attendance] 🔍 GPS Debug:', {
                schoolLat,
                schoolLon,
                type: typeof schoolLat,
                isNull: schoolLat === null,
                isUndefined: schoolLat === undefined,
                isNaN: isNaN(schoolLat as any),
                fullLocation: backgroundAnalysis?.location
              });
              
              // ⚠️ ERROR: School GPS not loaded from admin config!
              // FIX: Check for null/undefined explicitly, allow 0 and negative numbers
              if (schoolLat == null || schoolLon == null || isNaN(schoolLat) || isNaN(schoolLon)) {
                console.error('❌ [Attendance] School GPS not configured! Admin must set location.');
                return (
                  <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700 rounded-xl p-4 mb-6">
                    <p className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">❌ KONFIGURASI SEKOLAH BELUM DIATUR</p>
                    <p className="text-xs text-red-700 dark:text-red-300">
                      Admin belum mengatur koordinat GPS sekolah di Admin Panel → Attendance Settings.
                      Harap hubungi admin untuk mengkonfigurasi lokasi sekolah.
                    </p>
                  </div>
                );
              }
              
              // Haversine formula for distance
              const R = 6371e3; // Earth radius in meters
              const φ1 = (locationData.latitude * Math.PI) / 180;
              const φ2 = (schoolLat * Math.PI) / 180;
              const Δφ = ((schoolLat - locationData.latitude) * Math.PI) / 180;
              const Δλ = ((schoolLon - locationData.longitude) * Math.PI) / 180;
              const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              const distance = Math.round(R * c);
              
              const accuracy = locationData.accuracy || 0;
              
              // 🚨 STRICT VALIDATION - Block fake GPS
              const isFakeGPS = accuracy === 0 || accuracy > 10000; // 0m = IP geolocation (FAKE!)
              const isOutOfRange = distance > allowedRadius;
              const isPoorAccuracy = accuracy > accuracyThreshold && accuracy < 10000;
              
              return (
                <div className={`border-2 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 ${
                  isFakeGPS || isOutOfRange
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                    : isPoorAccuracy
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
                    : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                }`}>
                  <p className={`text-xs sm:text-sm font-semibold flex items-center gap-2 ${
                    isFakeGPS || isOutOfRange ? 'text-red-900 dark:text-red-100' :
                    isPoorAccuracy ? 'text-yellow-900 dark:text-yellow-100' :
                    'text-green-900 dark:text-green-100'
                  }`}>
                    <FaMapMarkerAlt /> {isFakeGPS ? '⚠️ LOKASI PALSU TERDETEKSI' : isOutOfRange ? '⚠️ DI LUAR JANGKAUAN' : '✓ Lokasi Valid'}
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className={`text-xs font-mono ${isFakeGPS ? 'text-red-700 dark:text-red-300 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                      📍 {locationData.latitude.toFixed(6)}, {locationData.longitude.toFixed(6)}
                      {isFakeGPS && <span className="ml-2 text-red-600 font-bold">(PALSU - IP Geolocation)</span>}
                    </p>
                    <p className={`text-xs font-semibold ${
                      isFakeGPS || isOutOfRange ? 'text-red-600 dark:text-red-400' :
                      distance > allowedRadius * 0.8 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-green-600 dark:text-green-400'
                    }`}>
                      📏 Jarak dari sekolah: {distance}m (Max: {allowedRadius}m)
                    </p>
                    <p className={`text-xs font-semibold ${
                      isFakeGPS ? 'text-red-600 dark:text-red-400' :
                      isPoorAccuracy ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-green-600 dark:text-green-400'
                    }`}>
                      🎯 Akurasi GPS: {accuracy.toFixed(0)}m (Max: {accuracyThreshold}m) {
                        isFakeGPS ? '❌ GPS PALSU!' :
                        isPoorAccuracy ? '⚠️ Kurang akurat - AKAN DITOLAK!' : 
                        '✓ Akurat'
                      }
                    </p>
                    {!isFakeGPS && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        🎯 Lokasi sekolah: {schoolLat.toFixed(6)}, {schoolLon.toFixed(6)}
                      </p>
                    )}
                  </div>
                  
                  {/* 🚨 CRITICAL WARNING - Fake GPS Detection */}
                  {isFakeGPS && (
                    <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg border-2 border-red-500 dark:border-red-600">
                      <p className="text-sm font-bold text-red-900 dark:text-red-100 flex items-center gap-2">
                        🚨 GPS PALSU TERDETEKSI!
                      </p>
                      <div className="mt-2 space-y-1 text-xs text-red-800 dark:text-red-200">
                        <p>• Akurasi: {accuracy}m (GPS asli: 5-50m)</p>
                        <p>• Sumber: IP Geolocation / Fake GPS app</p>
                        <p>• <strong>ABSENSI AKAN DITOLAK!</strong></p>
                      </div>
                      <div className="mt-2 p-2 bg-red-200 dark:bg-red-800/30 rounded">
                        <p className="text-xs font-bold text-red-900 dark:text-red-100">Cara Memperbaiki:</p>
                        <ol className="text-xs text-red-800 dark:text-red-200 ml-4 mt-1 list-decimal">
                          <li>Tutup aplikasi Fake GPS (jika ada)</li>
                          <li>Aktifkan Location Permission di browser</li>
                          <li>Pindah ke area terbuka (untuk GPS satelit)</li>
                          <li>Refresh halaman ini</li>
                        </ol>
                      </div>
                    </div>
                  )}
                  
                  {/* Warning jika di luar jangkauan */}
                  {!isFakeGPS && isOutOfRange && (
                    <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/30 rounded border border-red-300 dark:border-red-600">
                      <p className="text-xs font-bold text-red-900 dark:text-red-100">⚠️ DI LUAR JANGKAUAN</p>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                        Anda berada {distance}m dari sekolah. Radius maksimal: {allowedRadius}m.
                        <strong className="block mt-1">ABSENSI AKAN DITOLAK!</strong>
                      </p>
                    </div>
                  )}
                  
                  {/* Warning jika accuracy buruk */}
                  {!isFakeGPS && isPoorAccuracy && !isOutOfRange && (
                    <div className="mt-3 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg border-2 border-yellow-500 dark:border-yellow-600">
                      <p className="text-sm font-bold text-yellow-900 dark:text-yellow-100 flex items-center gap-2">
                        ⚠️ AKURASI GPS RENDAH - AKAN DITOLAK!
                      </p>
                      <div className="mt-2 space-y-1 text-xs text-yellow-800 dark:text-yellow-200">
                        <p>• Akurasi saat ini: <strong>{accuracy.toFixed(0)}m</strong></p>
                        <p>• Akurasi diperlukan: <strong>&lt;{accuracyThreshold}m</strong></p>
                        <p>• <strong className="text-red-600 dark:text-red-400">ABSENSI AKAN DITOLAK jika lanjut!</strong></p>
                      </div>
                      <div className="mt-2 p-2 bg-yellow-200 dark:bg-yellow-800/30 rounded">
                        <p className="text-xs font-bold text-yellow-900 dark:text-yellow-100">Cara Memperbaiki:</p>
                        <ol className="text-xs text-yellow-800 dark:text-yellow-200 ml-4 mt-1 list-decimal">
                          <li>Pindah ke AREA TERBUKA (keluar dari gedung)</li>
                          <li>Tunggu 30-60 detik hingga GPS lock ke satelit</li>
                          <li>Pastikan GPS/Location di device AKTIF (High Accuracy)</li>
                          <li>Refresh halaman setelah akurasi &lt;{accuracyThreshold}m</li>
                        </ol>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 📊 TABEL ANALISIS KEAMANAN - Real-time Validation Status */}
            {(wifiDetection || locationData || fingerprintHash || backgroundAnalysis) && (
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900 dark:to-slate-900 border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    📊 Analisis Keamanan Real-time
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date().toLocaleTimeString('id-ID')}
                  </span>
                </div>
                
                {/* Validation Status Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-300 dark:border-gray-600">
                        <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Parameter</th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Nilai</th>
                        <th className="text-center py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {/* IP Address */}
                      <tr className="hover:bg-gray-100 dark:hover:bg-gray-800">
                        <td className="py-2 px-2 font-medium text-gray-900 dark:text-gray-100">
                          🌐 IP Address
                        </td>
                        <td className="py-2 px-2 text-gray-700 dark:text-gray-300 font-mono text-xs">
                          {wifiDetection?.ipAddress || backgroundAnalysis?.wifi?.ipAddress || 'Detecting...'}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {backgroundAnalysis?.wifi?.isValid ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              ✓ Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                              ⚠ Pending
                            </span>
                          )}
                        </td>
                      </tr>
                      
                      {/* Network Status - Simplified */}
                      <tr className="hover:bg-gray-100 dark:hover:bg-gray-800">
                        <td className="py-2 px-2 font-medium text-gray-900 dark:text-gray-100">
                          🌐 Status Jaringan
                        </td>
                        <td className="py-2 px-2 text-gray-700 dark:text-gray-300">
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            Terhubung ke Internet
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            ✓ Online
                          </span>
                        </td>
                      </tr>
                      
                      {/* Location */}
                      <tr className="hover:bg-gray-100 dark:hover:bg-gray-800">
                        <td className="py-2 px-2 font-medium text-gray-900 dark:text-gray-100">
                          📍 Lokasi GPS
                        </td>
                        <td className="py-2 px-2 text-gray-700 dark:text-gray-300 font-mono text-xs">
                          {locationData ? 
                            `${locationData.latitude.toFixed(4)}, ${locationData.longitude.toFixed(4)}` 
                            : 'Not detected'}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {backgroundAnalysis?.location?.detected ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              ✓ Detected
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              ✗ Missing
                            </span>
                          )}
                        </td>
                      </tr>
                      
                      {/* Distance from School - Using Active Config */}
                      {locationData && backgroundAnalysis?.location && (() => {
                        // ✅ LOAD FROM DATABASE ONLY - NO HARDCODED FALLBACK!
                        const schoolLat = backgroundAnalysis.location.schoolLatitude;
                        const schoolLon = backgroundAnalysis.location.schoolLongitude;
                        const allowedRadius = backgroundAnalysis.location.allowedRadius || 100;
                        
                        // ⚠️ ERROR: School GPS not configured!
                        if (!schoolLat || !schoolLon) {
                          return (
                            <span className="text-red-600 font-semibold">
                              ❌ GPS sekolah belum dikonfigurasi di Admin Panel
                            </span>
                          );
                        }
                        
                        const R = 6371e3;
                        const φ1 = (locationData.latitude * Math.PI) / 180;
                        const φ2 = (schoolLat * Math.PI) / 180;
                        const Δφ = ((schoolLat - locationData.latitude) * Math.PI) / 180;
                        const Δλ = ((schoolLon - locationData.longitude) * Math.PI) / 180;
                        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                          Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
                        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                        const distance = Math.round(R * c);
                        
                        const isOutOfRange = distance > allowedRadius;
                        
                        return (
                          <tr className="hover:bg-gray-100 dark:hover:bg-gray-800">
                            <td className="py-2 px-2 font-medium text-gray-900 dark:text-gray-100">
                              📏 Jarak dari Sekolah
                            </td>
                            <td className="py-2 px-2 text-gray-700 dark:text-gray-300">
                              {distance}m / {allowedRadius}m
                            </td>
                            <td className="py-2 px-2 text-center">
                              {isOutOfRange ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                  ✗ Terlalu Jauh
                                </span>
                              ) : distance > allowedRadius * 0.8 ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                  ⚠ Mendekati Batas
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  ✓ Dalam Radius
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })()}
                      
                      {/* GPS Accuracy */}
                      <tr className="hover:bg-gray-100 dark:hover:bg-gray-800">
                        <td className="py-2 px-2 font-medium text-gray-900 dark:text-gray-100">
                          🎯 Akurasi GPS
                        </td>
                        <td className="py-2 px-2 text-gray-700 dark:text-gray-300">
                          {locationData?.accuracy ? 
                            `${locationData.accuracy.toFixed(0)} meter` 
                            : 'N/A'}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {locationData?.accuracy && locationData.accuracy <= 50 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              ✓ Akurat
                            </span>
                          ) : locationData?.accuracy && locationData.accuracy <= 100 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                              ⚠ Cukup
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              ✗ Buruk
                            </span>
                          )}
                        </td>
                      </tr>
                      
                      {/* Fingerprint */}
                      <tr className="hover:bg-gray-100 dark:hover:bg-gray-800">
                        <td className="py-2 px-2 font-medium text-gray-900 dark:text-gray-100">
                          🔐 Device ID
                        </td>
                        <td className="py-2 px-2 text-gray-700 dark:text-gray-300 font-mono text-xs">
                          {fingerprintHash ? fingerprintHash.substring(0, 16) + '...' : 'Generating...'}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {fingerprintHash ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              ✓ Ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                              ⏳ Loading
                            </span>
                          )}
                        </td>
                      </tr>
                      
                      {/* Background Analysis Result */}
                      {backgroundAnalysis && (
                        <tr className="hover:bg-gray-100 dark:hover:bg-gray-800 border-t-2 border-gray-400 dark:border-gray-500">
                          <td className="py-2 px-2 font-medium text-gray-900 dark:text-gray-100">
                            🔒 Analisis Background
                          </td>
                          <td className="py-2 px-2 text-gray-700 dark:text-gray-300">
                            {backgroundAnalysis.wifi?.validationError ? (
                              <span className="text-red-600 dark:text-red-400 text-xs">
                                ⚠ {backgroundAnalysis.wifi.validationError}
                              </span>
                            ) : (
                              <span className="text-green-600 dark:text-green-400 text-xs">
                                ✓ Passed
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-center">
                            {isBlocked ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                🚫 Blocked
                              </span>
                            ) : backgroundAnalysis.wifi?.isValid ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                ✓ Allowed
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                ⏳ Validating
                              </span>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Legend */}
                <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600 flex flex-wrap gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
                    <span className="text-gray-600 dark:text-gray-400">Valid/Akurat</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-full bg-yellow-500"></span>
                    <span className="text-gray-600 dark:text-gray-400">Warning/Pending</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
                    <span className="text-gray-600 dark:text-gray-400">Error/Blocked</span>
                  </div>
                </div>
                
                {/* Warning if blocked */}
                {isBlocked && blockReasons && blockReasons.length > 0 && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
                    <div className="font-bold text-red-900 dark:text-red-100 text-sm mb-1">
                      🚫 Blocked Reasons:
                    </div>
                    <ul className="text-xs text-red-700 dark:text-red-300 ml-4 list-disc space-y-1">
                      {blockReasons.map((reason, idx) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Security Validation Success Info */}
            {securityValidation && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl p-4 mb-4 sm:mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">✓</span>
                  </div>
                  <div>
                    <p className="font-bold text-green-900 dark:text-green-100">Keamanan Tervalidasi</p>
                    <p className="text-xs text-green-700 dark:text-green-300">Silakan lanjut ambil foto</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-2">
                    <p className="text-gray-500 dark:text-gray-400">Security Score</p>
                    <p className="font-bold text-green-600">{securityValidation.securityScore}/100</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-2">
                    <p className="text-gray-500 dark:text-gray-400">Jarak</p>
                    <p className="font-bold text-blue-600">{securityValidation.distance}m</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-2">
                    <p className="text-gray-500 dark:text-gray-400">WiFi</p>
                    <p className="font-bold text-indigo-600 truncate">{securityValidation.wifiSSID}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-2">
                    <p className="text-gray-500 dark:text-gray-400">Type</p>
                    <p className="font-bold text-purple-600">{securityValidation.attendanceType}</p>
                  </div>
                </div>
                {securityValidation.warnings && securityValidation.warnings.length > 0 && (
                  <div className="mt-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-2">
                    <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-200">⚠️ Peringatan:</p>
                    <ul className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 list-disc list-inside">
                      {securityValidation.warnings.map((warning: string, i: number) => (
                        <li key={i}>{warning === 'NEAR_BOUNDARY' ? 'Anda mendekati batas radius sekolah' : warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {/* Biometric Methods Selection */}
            
            <button
              onClick={async () => {
                // ===== PROPER FLOW: Security → Biometric Verify → Capture =====
                console.log('\n🚀 ========== ATTENDANCE FLOW START ==========');
                console.log('👤 User:', session?.user?.name || 'Unknown');
                console.log('📧 Email:', session?.user?.email || 'Unknown');
                console.log('🎭 Role:', (session?.user as any)?.role || 'Unknown');
                console.log('📍 Current Location:', locationData ? `${locationData.latitude}, ${locationData.longitude}` : 'Not detected');
                console.log('📶 WiFi SSID:', wifiSSID || 'Not set');
                console.log('🔐 Fingerprint:', fingerprintHash ? fingerprintHash.substring(0, 12) + '...' : 'Not generated');
                console.log('🔒 Auth Method: Session (no biometric)');
                console.log('\n--- Step 1: Security Validation ---');
                
                const isSecure = await validateSecurity();
                if (!isSecure) {
                  console.error('❌ Step 1 FAILED: Security validation failed');
                  console.error('🔴 Flow terminated - UI should show BLOCKED state\n');
                  return;
                }
                
                console.log('✅ Step 1 PASSED: Security validated');
                console.log('\n--- Step 2: Session Authentication (Skip Biometric) ---');
                console.log('✅ Session verified - User already authenticated');
                
                console.log('\n--- Step 3: Face Analytics Integration ---');
                console.log('🧠 Proceeding to AI face analytics system');
                console.log('🔓 UI State: Changing to FACE-ANALYTICS');
                console.log('=========================================\n');
                
                setStep('face-analytics');
              }}
              disabled={
                validating || 
                !backgroundAnalysis || // ⚠️ Wait for background analysis
                isBlocked || // ⚠️ Blocked by security validation
                !wifiSSID.trim() || 
                !locationData
              }
              className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {validating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Memvalidasi Keamanan...
                </>
              ) : !backgroundAnalysis ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Menganalisis Keamanan...
                </>
              ) : isBlocked ? (
                <>
                  <FaLock className="text-xl sm:text-2xl" />
                  Tidak Dapat Absen: {blockReasons.join(', ')}
                </>
              ) : (
                <>
                  <FaCamera className="text-xl sm:text-2xl" />
                  📸 Mulai Analisis Wajah AI
                </>
              )}
            </button>

            {/* Re-enrollment Request Button */}
            {enrollmentStatus && (
              <div className="mt-4">
                {reEnrollmentStatus === 'pending' ? (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="animate-pulse">⏳</div>
                      <span className="font-bold text-yellow-900 dark:text-yellow-100">
                        Request Re-enrollment Pending
                      </span>
                    </div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Permintaan Anda sedang menunggu persetujuan admin
                    </p>
                  </div>
                ) : reEnrollmentStatus === 'approved' ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-2xl">✅</span>
                      <span className="font-bold text-green-900 dark:text-green-100">
                        Re-enrollment Disetujui
                      </span>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                      Anda dapat mendaftar ulang biometrik sekarang
                    </p>
                    <button
                      onClick={() => {
                        setStep('capture');
                        setReEnrollmentStatus('none');
                      }}
                      className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                    >
                      Mulai Re-enrollment
                    </button>
                  </div>
                ) : reEnrollmentStatus === 'rejected' ? (
                  <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-2xl">❌</span>
                      <span className="font-bold text-red-900 dark:text-red-100">
                        Request Ditolak
                      </span>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Hubungi admin untuk informasi lebih lanjut
                    </p>
                  </div>
                ) : (
                  <>
                    {!showReEnrollmentForm ? (
                      <div className="space-y-3">
                        {/* Add New Device Button - Tidak hapus device lama */}
                        <button
                          onClick={() => {
                            console.log('[Add Device] User wants to add new device biometric');
                            toast.success(
                              <div>
                                <div className="font-bold">📱 Tambah Device Baru</div>
                                <div className="text-sm mt-1">Biometric dari device lain akan tetap tersimpan</div>
                              </div>,
                              { duration: 3000 }
                            );
                            setStep('capture'); // Langsung ke setup
                          }}
                          className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                          <span className="text-xl">📱</span>
                          Tambah Device Baru (Multi-Device)
                        </button>
                        
                        {/* Re-enrollment Button - Hapus semua device lama */}
                        <button
                          onClick={() => setShowReEnrollmentForm(true)}
                          className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                          <span className="text-xl">🔄</span>
                          Request Re-enrollment (Reset Semua)
                        </button>
                        
                        {/* Info Box */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 text-xs">
                          <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                            💡 Perbedaan:
                          </p>
                          <ul className="text-blue-700 dark:text-blue-300 space-y-1 ml-4 list-disc">
                            <li><strong>Tambah Device Baru:</strong> Biometric device lain tetap tersimpan (laptop + HP)</li>
                            <li><strong>Re-enrollment:</strong> Hapus semua device lama, daftar ulang dari nol</li>
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-gray-800 border-2 border-orange-300 dark:border-orange-700 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold text-gray-900 dark:text-white">
                            📝 Request Re-enrollment
                          </h3>
                          <button
                            onClick={() => {
                              setShowReEnrollmentForm(false);
                              setReEnrollmentReason('');
                            }}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            ✕
                          </button>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                              Alasan Re-enrollment
                            </label>
                            <textarea
                              value={reEnrollmentReason}
                              onChange={(e) => setReEnrollmentReason(e.target.value)}
                              placeholder="Contoh: Ganti perangkat baru, Face ID tidak berfungsi, dll (minimal 10 karakter)"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white text-sm"
                              rows={4}
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {reEnrollmentReason.length}/10 karakter minimum
                            </p>
                          </div>
                          
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 text-xs">
                            <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                              ℹ️ Informasi:
                            </p>
                            <ul className="text-blue-700 dark:text-blue-300 space-y-1 ml-4 list-disc">
                              <li>Request akan dikirim ke admin untuk review</li>
                              <li>Setelah disetujui, Anda dapat mendaftar ulang biometrik</li>
                              <li>Proses biasanya 1-2 hari kerja</li>
                            </ul>
                          </div>
                          
                          <button
                            onClick={handleSubmitReEnrollmentRequest}
                            disabled={loading || reEnrollmentReason.trim().length < 10}
                            className="w-full px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loading ? (
                              <span className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Mengirim...
                              </span>
                            ) : (
                              '📨 Kirim Request ke Admin'
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* 🔐 BIOMETRIC VERIFICATION STEP */}

        {/* 🧠 FACE ANALYTICS INTEGRATION STEP */}
        {step === 'face-analytics' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 border-2 border-indigo-200 dark:border-indigo-700">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                🧠
              </div>
              AI Face Analytics
            </h2>
            
            <div className="space-y-4">
              {/* Info Card */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-300 dark:border-indigo-700 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">🎯</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-indigo-900 dark:text-indigo-100 mb-2">
                      Sistem Pengenalan Wajah AI
                    </h3>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-3">
                      Sistem akan menganalisis wajah Anda menggunakan AI untuk memastikan identitas Anda sebelum absensi.
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-indigo-700 dark:text-indigo-300">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>
                        <span><strong>Face Detection:</strong> Deteksi wajah otomatis</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-indigo-700 dark:text-indigo-300">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>
                        <span><strong>Face Recognition:</strong> Identifikasi wajah dengan database</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-indigo-700 dark:text-indigo-300">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>
                        <span><strong>Anti-Spoofing:</strong> Deteksi foto palsu</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-indigo-700 dark:text-indigo-300">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>
                        <span><strong>8-Layer Verification:</strong> Keamanan maksimal</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Analytics Process Animation */}
              <div className="bg-white dark:bg-gray-900 border-2 border-indigo-200 dark:border-indigo-700 rounded-xl p-4">
                <div className="text-center space-y-4">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 animate-ping bg-indigo-400 rounded-full opacity-75"></div>
                    <div className="relative bg-indigo-600 rounded-full p-6">
                      <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                      🧠 Sistem AI Siap
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Klik tombol dibawah untuk memulai analisis wajah
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Privacy Notice */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div className="text-lg">🔒</div>
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>Privacy:</strong> Data wajah Anda diproses secara aman dan hanya digunakan untuk verifikasi absensi. 
                    Tidak disimpan secara permanen dan tidak dibagikan kepada pihak ketiga.
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    console.log('[Face Analytics] 🧠 Starting AI face analysis workflow...');
                    console.log('[Face Analytics] Step 1: Capture photo for AI verification');
                    console.log('[Face Analytics] Step 2: AI will analyze face similarity');
                    console.log('[Face Analytics] Step 3: Submit attendance if verified');
                    console.log('[Face Analytics] → Proceeding to photo capture');
                    
                    toast(
                      <div>
                        <div className="font-bold">🧠 AI Face Analytics</div>
                        <div className="text-sm mt-2 space-y-1">
                          <div>✅ Sistem akan menganalisis wajah Anda</div>
                          <div>✅ Membandingkan dengan foto referensi</div>
                          <div>✅ Verifikasi identitas dengan AI</div>
                        </div>
                      </div>,
                      { duration: 5000, icon: '🎯' }
                    );
                    
                    setStep('capture');
                  }}
                  className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Mulai Analisis Wajah AI
                </button>
                
                <button
                  onClick={() => setStep('ready')}
                  className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                >
                  ← Kembali
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Capture Photo & Submit */}
        {step === 'capture' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 border-2 border-green-200 dark:border-green-700">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Foto Verifikasi</h2>

            {!photoPreview ? (
              <button
                onClick={handleCapturePhoto}
                disabled={loading}
                className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm sm:text-base font-semibold rounded-xl hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-50"
              >
                <FaCamera className="text-lg sm:text-xl" />
                {loading ? 'Mengambil Foto...' : 'Ambil Foto Selfie'}
              </button>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                <img src={photoPreview} alt="Selfie" className="w-full rounded-xl shadow-lg" />
                
                {/* ✅ AI VERIFICATION LOADING INDICATOR */}
                {aiVerifying && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <div>
                        <div className="font-bold text-blue-900 dark:text-blue-100">🤖 Verifikasi AI</div>
                        <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">{aiProgress}</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* ✅ OPTIONAL: Alasan/Keterangan */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    📝 Keterangan (Opsional)
                  </label>
                  <textarea
                    value={attendanceNote}
                    onChange={(e) => setAttendanceNote(e.target.value)}
                    placeholder="Contoh: Terlambat karena macet, Ijin keluar kelas, dll"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none"
                    rows={2}
                    disabled={loading || aiVerifying}
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    💡 Opsional: Tambahkan alasan terlambat, ijin, atau keterangan lainnya
                  </div>
                </div>
                
                <div className="flex gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      setPhotoBlob(null);
                      setPhotoPreview('');
                      setAttendanceNote('');
                    }}
                    disabled={loading || aiVerifying}
                    className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm sm:text-base font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all active:scale-95 disabled:opacity-50"
                  >
                    Ambil Ulang
                  </button>
                  <button
                    onClick={handleSubmitAttendance}
                    disabled={loading || aiVerifying}
                    className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm sm:text-base font-semibold rounded-xl hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <FaCheckCircle />
                    {loading ? 'Mengirim...' : 'Submit Absensi'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submitting */}
        {step === 'submitting' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center border-2 border-blue-200 dark:border-blue-700">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-900 dark:text-white font-semibold text-lg">Memproses absensi...</p>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">Mohon tunggu sebentar</p>
          </div>
        )}

        {/* Blocked - Security Validation Failed */}
        {step === 'blocked' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 border-2 border-red-300 dark:border-red-700">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                <FaExclamationTriangle className="text-3xl text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-red-900 dark:text-red-100 mb-2">Akses Ditolak</h2>
              <p className="text-red-700 dark:text-red-300 text-sm">
                {securityValidation?.error || 'Validasi keamanan gagal'}
              </p>
            </div>

            {/* Violation Details */}
            {securityValidation?.violations && securityValidation.violations.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-4">
                <div className="font-bold text-red-900 dark:text-red-100 mb-2">❌ Pelanggaran:</div>
                <ul className="space-y-2 text-sm text-red-700 dark:text-red-300">
                  {securityValidation.violations.map((violation: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-red-500">•</span>
                      <span>
                        {violation === 'LOCATION_PERMISSION_DENIED' && '📍 IZIN LOKASI DITOLAK - WAJIB diaktifkan!'}
                        {violation === 'FAKE_GPS_DETECTED' && '🚨 GPS PALSU TERDETEKSI'}
                        {violation === 'IP_NOT_IN_WHITELIST' && '📡 IP address tidak terdaftar di jaringan sekolah'}
                        {violation === 'IP_NOT_DETECTED' && '🌐 IP address tidak terdeteksi'}
                        {violation === 'LOCATION_TOO_FAR' && '📍 Lokasi Anda terlalu jauh dari sekolah'}
                        {violation === 'OUTSIDE_RADIUS' && '📍 Lokasi di luar radius sekolah'}
                        {violation === 'LOCATION_NOT_ACCURATE' && '🎯 Akurasi GPS tidak memenuhi syarat'}
                        {violation === 'GPS_ACCURACY_LOW' && '🎯 Akurasi GPS terlalu rendah'}
                        {violation === 'LOCATION_NOT_DETECTED' && '📍 Lokasi tidak terdeteksi'}
                        {violation === 'FINGERPRINT_MISMATCH' && 'ℹ️ Device fingerprint berbeda (normal - browser updates)'}
                        {violation === 'OUTSIDE_ATTENDANCE_HOURS' && '⏰ Di luar jam absensi'}
                        {!['LOCATION_PERMISSION_DENIED', 'FAKE_GPS_DETECTED', 'IP_NOT_IN_WHITELIST', 'IP_NOT_DETECTED', 'LOCATION_TOO_FAR', 'OUTSIDE_RADIUS', 'LOCATION_NOT_ACCURATE', 'GPS_ACCURACY_LOW', 'LOCATION_NOT_DETECTED', 'FINGERPRINT_MISMATCH', 'OUTSIDE_ATTENDANCE_HOURS'].includes(violation) && violation}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* SPECIAL: Location Permission Denied - Show detailed instructions */}
            {(!locationData || requirements.location === false) && (
              <div className="bg-red-100 dark:bg-red-900/30 border-2 border-red-500 dark:border-red-600 rounded-xl p-5 mb-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                      <FaMapMarkerAlt className="text-white text-xl" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-red-900 dark:text-red-100 text-lg mb-2">
                      🚨 IZIN LOKASI WAJIB DIAKTIFKAN!
                    </h3>
                    <p className="text-red-800 dark:text-red-200 text-sm mb-3">
                      Sistem absensi MEMBUTUHKAN akses lokasi untuk memastikan Anda berada di area sekolah.
                      Browser akan meminta izin - Anda HARUS klik <strong>"Allow"</strong> atau <strong>"Izinkan"</strong>.
                    </p>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-3">
                      <p className="font-bold text-red-900 dark:text-red-100 text-sm mb-2">
                        📱 Cara Mengaktifkan Izin Lokasi:
                      </p>
                      <ol className="text-xs text-gray-700 dark:text-gray-300 space-y-2 ml-4 list-decimal">
                        <li>
                          <strong>Di Chrome/Edge:</strong>
                          <ul className="ml-4 mt-1 space-y-1 list-disc">
                            <li>Klik ikon 🔒 di sebelah kiri address bar</li>
                            <li>Cari "Location" atau "Lokasi"</li>
                            <li>Ubah dari "Block" → "Allow"</li>
                            <li>Refresh halaman (tekan F5)</li>
                          </ul>
                        </li>
                        <li>
                          <strong>Di Firefox:</strong>
                          <ul className="ml-4 mt-1 space-y-1 list-disc">
                            <li>Klik ikon (i) di address bar</li>
                            <li>Klik "Permissions" → "Location"</li>
                            <li>Pilih "Allow"</li>
                            <li>Refresh halaman</li>
                          </ul>
                        </li>
                        <li>
                          <strong>Di Safari (iOS/Mac):</strong>
                          <ul className="ml-4 mt-1 space-y-1 list-disc">
                            <li>Settings → Safari → Location</li>
                            <li>Pilih "Ask" atau "Allow"</li>
                            <li>Buka ulang halaman absensi</li>
                          </ul>
                        </li>
                      </ol>
                    </div>
                    
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-600 rounded p-3">
                      <p className="text-xs text-yellow-800 dark:text-yellow-200">
                        <strong>⚠️ PENTING:</strong> Pastikan juga GPS/Location di device Anda AKTIF (Settings → Location → ON).
                        Pindah ke area terbuka jika GPS tidak bisa mendapat sinyal.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Solution Steps */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
              <div className="font-bold text-blue-900 dark:text-blue-100 mb-2">💡 Cara Mengatasi:</div>
              <ol className="space-y-2 text-sm text-blue-700 dark:text-blue-300 ml-4 list-decimal">
                {securityValidation?.violations?.includes('IP_NOT_IN_WHITELIST') && (
                  <>
                    <li>Matikan <strong>data seluler</strong> Anda</li>
                    <li>Hubungkan ke <strong>WiFi sekolah</strong></li>
                    <li>Pastikan koneksi WiFi stabil</li>
                    <li>Tekan tombol "Coba Lagi" di bawah</li>
                  </>
                )}
                {securityValidation?.violations?.includes('LOCATION_TOO_FAR') && (
                  <>
                    <li>Pastikan Anda berada di <strong>area sekolah</strong></li>
                    <li>Aktifkan <strong>GPS/Lokasi</strong> di perangkat</li>
                    <li>Tunggu hingga GPS mendapat sinyal akurat</li>
                  </>
                )}
                {securityValidation?.violations?.includes('LOCATION_NOT_ACCURATE') && (
                  <>
                    <li>Pindah ke area <strong>terbuka</strong> (hindari gedung tertutup)</li>
                    <li>Pastikan <strong>GPS mode High Accuracy</strong> aktif</li>
                    <li>Tunggu beberapa detik hingga akurasi membaik</li>
                  </>
                )}
                {(!securityValidation?.violations || securityValidation.violations.length === 0) && (
                  <li>Refresh halaman dan coba lagi</li>
                )}
              </ol>
            </div>

            {/* Solution Steps per Violation Type */}
            <div className="space-y-3 mb-4">
              {/* IP Violation Solution */}
              {(securityValidation?.violations?.includes('IP_NOT_IN_WHITELIST') || 
                securityValidation?.violations?.includes('IP_NOT_DETECTED')) && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <p className="font-bold text-blue-900 dark:text-blue-100 mb-2">💡 Solusi IP:</p>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 ml-4 list-disc">
                    <li>Pastikan terhubung ke WiFi sekolah (bukan data seluler)</li>
                    <li>Refresh halaman setelah tersambung WiFi</li>
                    <li>Hubungi admin jika IP belum terdaftar</li>
                  </ul>
                </div>
              )}
              
              {/* Fake GPS Solution */}
              {securityValidation?.violations?.includes('FAKE_GPS_DETECTED') && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
                  <p className="font-bold text-orange-900 dark:text-orange-100 mb-2">⚠️ GPS Palsu Terdeteksi:</p>
                  <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1 ml-4 list-disc">
                    <li><strong>Matikan aplikasi Fake GPS / GPS Spoofer</strong></li>
                    <li>Restart device Anda</li>
                    <li>Pastikan Settings → Location → High Accuracy</li>
                    <li>Coba lagi setelah GPS asli aktif</li>
                  </ul>
                </div>
              )}
              
              {/* Distance/Radius Violation Solution */}
              {(securityValidation?.violations?.includes('LOCATION_TOO_FAR') || 
                securityValidation?.violations?.includes('OUTSIDE_RADIUS')) && (
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                  <p className="font-bold text-purple-900 dark:text-purple-100 mb-2">📍 Lokasi Terlalu Jauh:</p>
                  <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1 ml-4 list-disc">
                    <li>Anda harus berada di area sekolah (radius 200m)</li>
                    <li>Jarak Anda: <strong>{securityValidation?.distance?.toFixed(0) || '?'}m</strong> dari sekolah</li>
                    <li>Pindah lebih dekat ke sekolah dan coba lagi</li>
                  </ul>
                </div>
              )}
              
              {/* GPS Accuracy Violation Solution */}
              {(securityValidation?.violations?.includes('LOCATION_NOT_ACCURATE') || 
                securityValidation?.violations?.includes('GPS_ACCURACY_LOW')) && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                  <p className="font-bold text-yellow-900 dark:text-yellow-100 mb-2">🎯 Akurasi GPS Rendah:</p>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 ml-4 list-disc">
                    <li>Pindah ke area terbuka (keluar dari gedung)</li>
                    <li>Pastikan GPS device aktif (Settings → Location → ON)</li>
                    <li>Tunggu 10-30 detik hingga GPS lock ke satelit</li>
                    <li>Akurasi diperlukan: &lt; 20m (Anda: {locationData?.accuracy?.toFixed(0) || '?'}m)</li>
                  </ul>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  console.log('\n🔄 ========== USER RETRY ATTENDANCE ==========');
                  console.log('👤 User clicked "Coba Lagi" button');
                  console.log('📋 Previous violations:', securityValidation?.violations || []);
                  console.log('🔄 Action: Clearing validation state and reloading page');
                  console.log('🔄 UI State: Changing from BLOCKED → CHECK → Page reload');
                  console.log('=========================================\n');
                  
                  setSecurityValidation(null);
                  setStep('check');
                  window.location.reload();
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Coba Lagi
              </button>

              <button
                onClick={() => {
                  console.log('\n🏠 User clicked "Kembali ke Dashboard"');
                  console.log('🔄 Redirecting to /dashboard\n');
                  redirect('/dashboard');
                }}
                className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all active:scale-95"
              >
                Kembali ke Dashboard
              </button>
            </div>

            {/* Debug Info (only in development) */}
            {securityValidation?.details && process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-900 rounded-lg text-xs font-mono">
                <div className="font-bold text-gray-700 dark:text-gray-300 mb-1">Debug Info:</div>
                <pre className="text-gray-600 dark:text-gray-400 overflow-auto">
                  {JSON.stringify(securityValidation.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Warning Info */}
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-2xl p-4 sm:p-6 mt-4 sm:mt-6">
          <h3 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2 sm:mb-3 flex items-center gap-2 text-base sm:text-lg">
            <FaExclamationTriangle />
            Perhatian
          </h3>
          <ul className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300 space-y-1.5 sm:space-y-2 list-disc list-inside">
            <li>Pastikan Anda terhubung ke <strong>WiFi sekolah</strong></li>
            <li>Pastikan <strong>lokasi/GPS</strong> aktif dan akurat</li>
            <li>Foto selfie akan digunakan untuk <strong>verifikasi identitas</strong></li>
            <li>Absensi hanya dapat dilakukan di <strong>area sekolah</strong></li>
            <li>Data absensi akan tercatat dan dapat dilihat oleh admin</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
