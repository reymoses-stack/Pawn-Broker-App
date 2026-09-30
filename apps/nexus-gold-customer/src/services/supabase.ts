/**
 * Supabase client for Nexus Gold Customer App.
 * Handles email OTP authentication (free, no SMS needed).
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://asnzwwjrtgswldnwohci.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && !supabaseAnonKey.includes('placeholder'));

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/** Send a 6-digit OTP to the customer's email (free via Supabase Auth) */
export async function sendEmailOtp(email: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'auth_not_configured' };
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  return { error: error ? error.message : null };
}

/** Verify the OTP code entered by the customer */
export async function verifyEmailOtp(
  email: string,
  token: string
): Promise<{ userId: string | null; userEmail: string | null; error: string | null }> {
  if (!supabase) return { userId: null, userEmail: null, error: 'auth_not_configured' };
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });
  if (error) return { userId: null, userEmail: null, error: error.message };
  return {
    userId: data.user?.id || null,
    userEmail: data.user?.email || null,
    error: null,
  };
}

/** Get current authenticated session */
export async function getSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** Sign out */
export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}
