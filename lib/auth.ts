import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { logAuthEvent } from './authLogger';
import { logActivity } from './activity-logger';
// import Google from 'next-auth/providers/google';
// Note: `bcryptjs` and `supabaseAdmin` are imported dynamically inside the
// authorize/findUserByEmail functions to avoid pulling Node-only modules into
// Edge/runtime-sensitive imports (e.g. middleware).

type UserRecord = {
  id: string;
  email: string;
  name?: string | null;
  role?: string | null;
  password_hash?: string | null;
  email_verified?: boolean | null;
  approved?: boolean | null;
  is_universal?: boolean | null;
};

// Basic in-memory rate limiter for login attempts. This is process-local and
// intended as a quick mitigation against credential stuffing/brute-force in
// environments without a central store. For production, consider a DB/Redis
// backed counter.
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const configuredLoginAttempts = Number.parseInt(process.env.LOGIN_MAX_ATTEMPTS || '5', 10);
const LOGIN_MAX_ATTEMPTS = Number.isInteger(configuredLoginAttempts) && configuredLoginAttempts >= 3 && configuredLoginAttempts <= 20
  ? configuredLoginAttempts
  : 5;
const loginAttempts = new Map<string, { count: number; first: number }>();

function getAttempts(key: string) {
  const v = loginAttempts.get(key);
  if (!v) return { count: 0, first: 0 };
  if (Date.now() - v.first > LOGIN_WINDOW_MS) {
    loginAttempts.delete(key);
    return { count: 0, first: 0 };
  }
  return v;
}

function incrementAttempts(key: string) {
  const now = Date.now();
  const v = loginAttempts.get(key);
  if (!v) {
    loginAttempts.set(key, { count: 1, first: now });
    return;
  }
  if (now - v.first > LOGIN_WINDOW_MS) {
    loginAttempts.set(key, { count: 1, first: now });
    return;
  }
  v.count += 1;
  if (loginAttempts.size > 5000) {
    const oldestAllowed = now - LOGIN_WINDOW_MS;
    for (const [attemptKey, attempt] of loginAttempts) {
      if (attempt.first < oldestAllowed) loginAttempts.delete(attemptKey);
    }
  }
  loginAttempts.set(key, v);
}

function resetAttempts(key: string) {
  loginAttempts.delete(key);
}

function getRequestIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return request.headers.get('x-real-ip')?.trim() || forwarded || 'unknown';
}

async function findUserByEmail(email: string): Promise<UserRecord | null> {
  // Dynamically import the server-only supabase client when actually used.
  const { supabaseAdmin } = await import('./supabase/server');
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, email, name, role, password_hash, email_verified, approved, requested_role, is_universal')
    // Use case-insensitive match to be more tolerant of email case differences
    .ilike('email', email)
    .single();
  if (error) return null;
  return (data as UserRecord) ?? null;
}

export const authConfig: NextAuthConfig = {
  // Trust proxy headers for Vercel deployment and other proxied environments
  trustHost: true,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
        alias: { label: 'Alias perangkat', type: 'text' },
      },
      async authorize(credentials, request) {
          const dbg = process.env.DEBUG_AUTH === '1';
          if (dbg) console.log('[NextAuth] authorize called with email:', credentials?.email);
          
          // Basic validation + normalization
          const rawEmail = credentials?.email as string | undefined;
          const password = credentials?.password as string | undefined;
          
          if (!rawEmail || !password) {
            if (dbg) console.log('[NextAuth] Missing email or password');
            await logAuthEvent('warn', { event: 'authorize_missing_fields' });
            throw new Error('Email dan password harus diisi');
          }
          const email = rawEmail.trim().toLowerCase();
          if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length > 1024) {
            throw new Error('Email atau password tidak sesuai.');
          }

          // Limit both a single account and a source address to slow guessing.
          const emailAttemptKey = `login:email:${email}`;
          const requestIp = getRequestIp(request);
          const ipAttemptKey = requestIp === 'unknown' ? null : `login:ip:${requestIp}`;
          const emailAttempts = getAttempts(emailAttemptKey);
          const ipAttempts = ipAttemptKey ? getAttempts(ipAttemptKey) : { count: 0, first: 0 };
          if (emailAttempts.count >= LOGIN_MAX_ATTEMPTS || (ipAttemptKey && ipAttempts.count >= LOGIN_MAX_ATTEMPTS * 3)) {
            await logAuthEvent('warn', { event: 'authorize_rate_limited' });
            throw new Error('Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.');
          }

          const recordFailure = () => {
            incrementAttempts(emailAttemptKey);
            if (ipAttemptKey) incrementAttempts(ipAttemptKey);
          };

          const user = await findUserByEmail(email);
          
          if (dbg) console.log('[NextAuth] User lookup result:', { 
            found: !!user, 
            hasPassword: !!user?.password_hash,
            email_verified: user?.email_verified,
            approved: user?.approved 
          });
          
          if (!user) {
            recordFailure();
            await logAuthEvent('warn', { event: 'authorize_credentials_invalid' });
            throw new Error('Email atau password tidak sesuai.');
          }

          if (!user.password_hash) {
            recordFailure();
            await logAuthEvent('warn', { event: 'authorize_credentials_invalid' });
            throw new Error('Email atau password tidak sesuai.');
          }

          // Dynamically import bcrypt to verify password first
          const bcrypt = (await import('bcryptjs')).default;
          if (dbg) console.log('[NextAuth] Comparing password...');
          const valid = await bcrypt.compare(password, user.password_hash as string);
          if (dbg) console.log('[NextAuth] Password valid:', valid);
          
          if (!valid) {
            recordFailure();
            const remainingAttempts = LOGIN_MAX_ATTEMPTS - getAttempts(emailAttemptKey).count;
            await logAuthEvent('warn', { 
              event: 'authorize_credentials_invalid',
              user_id: user.id,
              attempts: getAttempts(emailAttemptKey).count,
              remaining: remainingAttempts
            });
            throw new Error('Email atau password tidak sesuai.');
          }

          // Check email verification after password is correct (do NOT increment attempts for unverified)
          if (!user.email_verified) {
            await logAuthEvent('info', { event: 'authorize_unverified', user_id: user.id, email: user.email });
            // Throw with sentinel prefix for easier client detection
            throw new Error(`UNVERIFIED_EMAIL: Email "${user.email}" belum diverifikasi. Silakan cek inbox/spam lalu klik link verifikasi.`);
          }

          // Check admin approval after email is verified (do NOT increment attempts)
          if (!user.approved) {
            await logAuthEvent('info', { event: 'authorize_not_approved', user_id: user.id, email: user.email, role: user.role, requested_role: (user as any).requested_role });
            const desired = (user as any).requested_role || user.role || 'belum ditentukan';
            throw new Error(`NOT_APPROVED: Akun sudah diverifikasi tetapi menunggu persetujuan admin. Role diajukan: ${desired}. Silakan tunggu persetujuan.`);
          }

          const sessionAlias = String(credentials?.alias || '').trim().slice(0, 80);
          if (user.is_universal && sessionAlias.length < 2) {
            throw new Error('ALIAS_REQUIRED: Isi alias sesi/perangkat minimal 2 karakter untuk akun universal.');
          }

          // Success: reset attempts and log success
          resetAttempts(emailAttemptKey);
          if (ipAttemptKey) resetAttempts(ipAttemptKey);
          await logAuthEvent('info', { 
            event: 'login_success', 
            user_id: user.id, 
            email: user.email,
            role: user.role,
            approved: user.approved,
            email_verified: user.email_verified
          });

          // Activity will be logged in signIn callback
          const returnUser = {
            id: user.id, email: user.email, name: user.name ?? undefined, role: user.role ?? undefined,
            isUniversal: !!user.is_universal, sessionAlias,
            sessionIp: getRequestIp(request), sessionUa: request.headers.get('user-agent') || null,
          };
          if (dbg) console.log('[NextAuth] authorize SUCCESS, returning user:', returnUser);
          return returnUser;
      },
    }),
    // Google({
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // }),
  ],
  // Keep sessions short and JWT-based. Force refresh frequently to pick up role changes.
  // In production, consider 15-30 minutes. For testing role changes, use 5 minutes.
  session: { 
    strategy: 'jwt', 
    maxAge: 12 * 60 * 60,
    updateAge: 15 * 60, // Re-issue token every 15 minutes (was 60s → constant churn)
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (process.env.DEBUG_AUTH === '1') {
        console.log('[NextAuth] signIn callback triggered:', { 
          user: user?.email, 
          hasUser: !!user,
          account: account?.provider 
        });
      }
      
      // Log successful sign in to activity_logs
      if (user?.id && user?.email) {
        try {
          await logActivity({
            userId: user.id,
            userName: (user as any).name || user.email,
            userEmail: user.email,
            userRole: (user as any).role || 'user',
            activityType: 'login',
            action: 'User logged in successfully',
            description: `Login berhasil dengan ${account?.provider || 'credentials'}`,
            metadata: {
              provider: account?.provider,
              role: (user as any).role,
              email_verified: true, // Must be true to reach here
            },
            status: 'success',
          });
          if (process.env.DEBUG_AUTH === '1') {
            console.log('[NextAuth] Activity logged for user:', user.email);
          }
        } catch (error) {
          console.error('[NextAuth] Failed to log activity:', error);
          // Don't block sign in if logging fails
        }
      }
      
      // Allow sign in
      return true;
    },
    async jwt({ token, user, trigger }) {
      // On sign in, add user data to token
      if (user && typeof token === 'object' && token !== null) {
        (token as Record<string, unknown>)['role'] = ((user as unknown) as { role?: string }).role;
        (token as Record<string, unknown>)['id'] = ((user as unknown) as { id?: string }).id;
        (token as Record<string, unknown>)['roleCheckedAt'] = Date.now();
        const sessionKey = crypto.randomUUID();
        const signInUser = user as any;
        (token as any).sessionKey = sessionKey;
        (token as any).isUniversal = !!signInUser.isUniversal;
        (token as any).sessionAlias = signInUser.sessionAlias || null;
        const { createClient } = await import('@supabase/supabase-js');
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceKey) throw new Error('Session storage is not configured');
        const sessionDb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
        const { error } = await sessionDb.from('app_sessions').insert({
          user_id: signInUser.id,
          session_key: sessionKey,
          alias: signInUser.sessionAlias || null,
          ip_address: signInUser.sessionIp || null,
          user_agent: signInUser.sessionUa || null,
          expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        });
        // If the session table has not been migrated yet, keep the site usable
        // instead of logging everyone out. Other insert failures still block the
        // token so a broken session can never be trusted.
        if (error && !['PGRST205', '42P01'].includes(error.code || '')) {
          (token as any).sessionInvalid = true;
        } else if (error) {
          console.warn('[NextAuth] app_sessions table is missing; session tracking disabled until migration is applied.');
        }
      }

      const sessionKey = (token as any)?.sessionKey;
      if (!sessionKey && ((token as any)?.id || token?.sub)) (token as any).sessionInvalid = true;
      if (sessionKey && !(token as any).sessionInvalid) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
          if (!serviceKey) throw new Error('Session storage is not configured');
          const sessionDb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
          const { data: storedSession, error } = await sessionDb.from('app_sessions')
            .select('id,last_seen_at,expires_at,revoked_at')
            .eq('session_key', sessionKey).eq('user_id', (token as any).id || token?.sub).maybeSingle();
          if (error) {
            // Transient database/PostgREST error: do not punish the user with a
            // forced logout. The next request will retry the check.
            console.warn('[NextAuth] session check failed:', error.code || error.message);
          } else if (!storedSession || storedSession.revoked_at || Date.now() >= new Date(storedSession.expires_at).getTime()) {
            if (storedSession?.id && !storedSession.revoked_at) {
              await sessionDb.from('app_sessions').update({ revoked_at: new Date().toISOString() }).eq('id', storedSession.id);
            }
            (token as any).sessionInvalid = true;
          } else if (Date.now() - new Date(storedSession.last_seen_at).getTime() >= 5 * 60 * 1000) {
            // Throttle writes: last_seen_at is audit metadata, not a heartbeat.
            await sessionDb.from('app_sessions').update({ last_seen_at: new Date().toISOString() }).eq('id', storedSession.id);
          }
        } catch (error) {
          console.warn('[NextAuth] session storage unavailable:', error instanceof Error ? error.message : 'unknown error');
        }
      }

      // Refresh role from DB at most once per 60s (or on explicit update)
      // Avoids a Supabase query on EVERY auth()/session/middleware call
      const userId = (token as any)?.id || token?.sub;
      const lastChecked = Number((token as any)?.roleCheckedAt || 0);
      const stale = !lastChecked || Date.now() - lastChecked > 60_000;

      if (userId && (trigger === 'update' || stale)) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
          const supabase = createClient(supabaseUrl, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false }
          });

          const { data: userData } = await supabase
            .from('users')
            .select('role, approved, email_verified')
            .eq('id', userId)
            .single();

          if (userData?.role) {
            const oldRole = (token as any)?.role;
            (token as Record<string, unknown>)['role'] = userData.role;
            (token as Record<string, unknown>)['approved'] = userData.approved;
            (token as Record<string, unknown>)['email_verified'] = userData.email_verified;
            (token as Record<string, unknown>)['roleCheckedAt'] = Date.now();

            if (oldRole !== userData.role && process.env.DEBUG_AUTH === '1') {
              console.log('[NextAuth] jwt - ROLE CHANGED:', { userId, oldRole, newRole: userData.role });
            }
          } else {
            (token as Record<string, unknown>)['roleCheckedAt'] = Date.now();
          }
        } catch (error) {
          if (process.env.DEBUG_AUTH === '1') {
            console.error('[NextAuth] jwt - Error refreshing role:', error);
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if ((token as any)?.sessionInvalid) return { ...session, user: undefined } as any;
      if (session.user && typeof token === 'object' && token !== null) {
        ((session.user as unknown) as Record<string, unknown>)['role'] = (token as Record<string, unknown>)['role'];
        if ((token as Record<string, unknown>)['id']) {
          ((session.user as unknown) as Record<string, unknown>)['id'] = (token as Record<string, unknown>)['id'];
        }
        (session.user as any).sessionKey = (token as any).sessionKey;
        (session.user as any).isUniversal = (token as any).isUniversal;
        (session.user as any).sessionAlias = (token as any).sessionAlias;
      }
      return session;
    },
  },
  events: {
    async signOut(message) {
      const token = (message as any)?.token;
      if (token?.sessionKey) {
        const { createClient } = await import('@supabase/supabase-js');
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceKey) return;
        const sessionDb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
        await sessionDb.from('app_sessions').update({ revoked_at: new Date().toISOString() })
          .eq('session_key', token.sessionKey).is('revoked_at', null);
      }
    },
  },
  pages: {
    signIn: '/admin/login',
    signOut: '/',
  },
  // Use secure cookies in production
  useSecureCookies: process.env.NODE_ENV === 'production',
};

const _nextAuth = NextAuth(authConfig) as any;

// `auth` can throw when the JWT cannot be decrypted (for example when
// `NEXTAUTH_SECRET` changed). Wrap it to return `null` on JWTSessionError so
// server-side rendering doesn't crash — callers should handle a `null`
// session and treat it as unauthenticated.
const rawAuth = _nextAuth.auth as (...args: any[]) => Promise<any>;
export async function auth(...args: any[]) {
  try {
    return await rawAuth(...args);
  } catch (err: any) {
    // Auth.js throws a JWTSessionError when decryption fails. Detect this and
    // return null (no session) instead of rethrowing so pages/layouts can
    // continue rendering and handle unauthenticated state.
    const name = err?.name as string | undefined;
    const message = err?.message as string | undefined;
    if (name === 'JWTSessionError' || (message && message.includes('no matching decryption secret'))) {
      // Keep the structured log used across the repo
      try {
        await import('./authLogger').then(m => m.logAuthEvent('warn', { event: 'jwt_decrypt_failed', reason: message || name }));
      } catch (_) {
        // ignore logging errors
      }
      return null;
    }
    throw err;
  }
}

export const handlers = _nextAuth.handlers;
export const signIn = _nextAuth.signIn;
export const signOut = _nextAuth.signOut;
