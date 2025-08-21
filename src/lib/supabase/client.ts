import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Get environment variables with lazy validation
function getSupabaseConfig() {
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return { supabaseUrl, supabaseAnonKey };
}

function getServiceKey() {
  const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];
  if (!supabaseServiceKey) {
    throw new Error('Missing Supabase service role key');
  }
  return supabaseServiceKey;
}

/**
 * Client-side Supabase client for use in components
 */
export const createSupabaseClientComponent = () => {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
};

/**
 * Server-side Supabase client for use in Server Components and API routes
 */
export const createSupabaseServerComponent = () => {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
};

/**
 * Service role client for admin operations (use carefully)
 */
export const createSupabaseServiceClient = () => {
  const { supabaseUrl } = getSupabaseConfig();
  const supabaseServiceKey = getServiceKey();
  
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

/**
 * Standard client for general use - lazy initialization
 */
export const getSupabaseClient = () => {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
};