import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Get environment variables
const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!;
const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!;
const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Client-side Supabase client for use in components
 */
export const createSupabaseClientComponent = () => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
};

/**
 * Server-side Supabase client for use in Server Components and API routes
 */
export const createSupabaseServerComponent = () => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
};

/**
 * Service role client for admin operations (use carefully)
 */
export const createSupabaseServiceClient = () => {
  if (!supabaseServiceKey) {
    throw new Error('Missing Supabase service role key');
  }
  
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

/**
 * Standard client for general use
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);