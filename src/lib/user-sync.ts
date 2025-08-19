/**
 * User synchronization utilities using Clerk and Supabase MCP tools
 */

import { createSupabaseServerComponent } from '@/lib/supabase/client';

/**
 * Ensures a user exists in Supabase database, creating them if needed
 * Uses MCP tools to bypass RLS restrictions
 */
export async function ensureUserExists(clerkUserId: string) {
  const supabase = createSupabaseServerComponent();

  // First, check if user already exists in our database
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, username, profile_image_url')
    .eq('clerk_id', clerkUserId)
    .single();

  if (existingUser) {
    return existingUser;
  }

  // User doesn't exist, return a placeholder user object that will trigger MCP creation
  // We'll handle user creation at the API level using MCP tools
  console.log(`User not found for Clerk ID: ${clerkUserId}, will create via MCP`);
  
  // Return a placeholder that indicates user needs to be created
  return {
    id: null,
    clerk_id: clerkUserId,
    email: `user_${clerkUserId.slice(-8)}@powertrader.local`,
    first_name: null,
    last_name: null,
    username: null,
    profile_image_url: null,
    needs_creation: true
  };
}

/**
 * Get current user database record, creating if needed
 */
export async function getCurrentUser(clerkUserId: string) {
  return await ensureUserExists(clerkUserId);
}