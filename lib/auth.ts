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
};

// Basic in-memory rate limiter for login attempts. This is process-local and
// intended as a quick mitigation against credential stuffing/brute-force in
// environments without a central store. For production, consider a DB/Redis
// backed counter.
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOGIN_MAX_ATTEMPTS = Number(process.env.LOGIN_MAX_ATTEMPTS ?? 5);
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
  loginAttempts.set(key, v);
}

function resetAttempts(key: string) {
  loginAttempts.delete(key);
}

async function findUserByEmail(email: string): Promise<UserRecord | null> {
  // Dynamically import the server-only supabase client when actually used.
  const { supabaseAdmin } = await import('./supabase/server');
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, email, name, role, password_hash, email_verified, approved, requested_role')
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
          if (dbg) console.log('[NextAuth] Normalized email:', email);

          // rate-limit by normalized email (process-local)
          const attemptKey = `login:${email}`;
          const attempts = getAttempts(attemptKey);
          if (attempts.count >= LOGIN_MAX_ATTEMPTS) {
            await logAuthEvent('warn', { event: 'authorize_rate_limited', email });
            throw new Error('Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.');
          }

          const user = await findUserByEmail(email);
          
          if (dbg) console.log('[NextAuth] User lookup result:', { 
            found: !!user, 
            hasPassword: !!user?.password_hash,
            email_verified: user?.email_verified,
            approved: user?.approved 
          });
          
          if (!user) {
            incrementAttempts(attemptKey);
            await logAuthEvent('warn', { event: 'authorize_user_not_found', email });
            throw new Error(`Email "${email}" tidak terdaftar. Silakan registrasi terlebih dahulu atau periksa ejaan email Anda.`);
          }

          if (!user.password_hash) {
            incrementAttempts(attemptKey);
            await logAuthEvent('warn', { event: 'authorize_no_password_hash', email, user_id: user.id });
            throw new Error('Akun Anda belum memiliki password. Silakan hubungi admin untuk reset password.');
          }

          // Dynamically import bcrypt to verify password first
          const bcrypt = (await import('bcryptjs')).default;
          if (dbg) console.log('[NextAuth] Comparing password...');
          const valid = await bcrypt.compare(password, user.password_hash as string);
          if (dbg) console.log('[NextAuth] Password valid:', valid);
          
          if (!valid) {
            incrementAttempts(attemptKey);
            const remainingAttempts = LOGIN_MAX_ATTEMPTS - getAttempts(attemptKey).count;
            await logAuthEvent('warn', { 
              event: 'authorize_bad_password', 
              email, 
              user_id: user.id,
              attempts: getAttempts(attemptKey).count,
              remaining: remainingAttempts
            });
            throw new Error(`Password salah! Anda masih memiliki ${remainingAttempts} percobaan lagi. Setelah ${LOGIN_MAX_ATTEMPTS} kali gagal, akun akan dikunci selama 15 menit.`);
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

          // Success: reset attempts and log success
          resetAttempts(attemptKey);
          await logAuthEvent('info', { 
            event: 'login_success', 
            user_id: user.id, 
            email: user.email,
            role: user.role,
            approved: user.approved,
            email_verified: user.email_verified
          });

          // Activity will be logged in signIn callback
          const returnUser = { id: user.id, email: user.email, name: user.name ?? undefined, role: user.role ?? undefined };
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
    maxAge: 7 * 24 * 60 * 60, // 7 days - role still refreshed from DB via roleCheckedAt
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
      if (session.user && typeof token === 'object' && token !== null) {
        ((session.user as unknown) as Record<string, unknown>)['role'] = (token as Record<string, unknown>)['role'];
        if ((token as Record<string, unknown>)['id']) {
          ((session.user as unknown) as Record<string, unknown>)['id'] = (token as Record<string, unknown>)['id'];
        }
      }
      return session;
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
