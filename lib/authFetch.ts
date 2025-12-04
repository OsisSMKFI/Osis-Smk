/**
 * Enhanced fetch wrapper with automatic 401 handling and session refresh
 * Prevents unnecessary error logging for expected authentication failures
 */

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Refresh the session by calling NextAuth's session endpoint
 */
async function refreshSession(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      console.log('[AuthFetch] 🔄 Refreshing session...');
      
      // Call NextAuth session endpoint to refresh the JWT
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const session = await response.json();
        if (session && session.user) {
          console.log('[AuthFetch] ✅ Session refreshed successfully');
          return true;
        }
      }
      
      console.log('[AuthFetch] ❌ Session refresh failed - user needs to login');
      return false;
    } catch (error) {
      console.error('[AuthFetch] ❌ Session refresh error:', error);
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Enhanced fetch with automatic 401 handling
 * Automatically retries once after refreshing session
 */
export async function authFetch(
  url: string | URL | Request,
  options?: RequestInit,
  retryCount = 0
): Promise<Response> {
  try {
    const response = await fetch(url, options);

    // Handle 401 Unauthorized
    if (response.status === 401 && retryCount === 0) {
      console.log('[AuthFetch] ⚠️ Got 401, attempting session refresh...');
      
      const refreshed = await refreshSession();
      
      if (refreshed) {
        console.log('[AuthFetch] 🔄 Retrying request after session refresh...');
        return authFetch(url, options, retryCount + 1);
      } else {
        console.log('[AuthFetch] ❌ Session refresh failed, redirecting to login...');
        
        // Redirect to login if we're on client side
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          const loginUrl = `/login?callbackUrl=${encodeURIComponent(currentPath)}`;
          
          // Use setTimeout to avoid blocking the current execution
          setTimeout(() => {
            window.location.href = loginUrl;
          }, 1000);
        }
      }
    }

    return response;
  } catch (error) {
    console.error('[AuthFetch] Network error:', error);
    throw error;
  }
}

/**
 * Helper to check if a fetch call is for authentication endpoints
 */
export function isAuthEndpoint(url: string): boolean {
  return (
    url.includes('/api/auth/') ||
    url.includes('/api/attendance/biometric') ||
    url.includes('/api/enroll/') ||
    url.includes('/api/profile')
  );
}

/**
 * Safe fetch wrapper that catches and logs errors appropriately
 */
export async function safeFetch(
  url: string | URL | Request,
  options?: RequestInit
): Promise<Response | null> {
  try {
    const response = await authFetch(url, options);
    return response;
  } catch (error) {
    console.error('[SafeFetch] Request failed:', error);
    return null;
  }
}
