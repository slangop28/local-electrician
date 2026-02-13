// Supabase client configuration
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] CRITICAL: Missing SUPABASE credentials!',
    'NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING',
    'SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'MISSING'
  );
}

// Use placeholders for build-time if variables are missing (Next.js needs this for static analysis)
const finalUrl = supabaseUrl || 'https://placeholder-url.supabase.co';
const finalAnonKey = supabaseAnonKey || 'placeholder-anon-key';
const finalServiceKey = supabaseServiceKey || finalAnonKey;

// Client for client-side usage (respects RLS)
export const supabase = createClient(finalUrl, finalAnonKey);

// Client for server-side API routes (bypasses RLS) - only available on server
export const supabaseAdmin = createClient(finalUrl, finalServiceKey);

export { supabaseUrl };
