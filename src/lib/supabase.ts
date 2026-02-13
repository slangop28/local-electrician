// Supabase client configuration
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  if (process.env.NODE_ENV === 'production') {
    console.warn(
      'MISSING SUPABASE CREDENTIALS: Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your environment variables.'
    );
  }
}

// Use placeholders for build-time if variables are missing
const finalUrl = supabaseUrl || 'https://placeholder-url.supabase.co';
const finalAnonKey = supabaseAnonKey || 'placeholder-anon-key';
const finalServiceKey = supabaseServiceKey || finalAnonKey;

// Client for client-side usage (respects RLS)
export const supabase = createClient(finalUrl, finalAnonKey);

// Client for server-side API routes (bypasses RLS) - only available on server
export const supabaseAdmin = createClient(finalUrl, finalServiceKey);

export { supabaseUrl };
