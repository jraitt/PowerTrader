-- Fix RLS policies for user creation
-- This script should be run in the Supabase SQL editor

-- First, check current policies
SELECT tablename, policyname, cmd, permissive, roles, qual, with_check 
FROM pg_policies WHERE tablename = 'users';

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- Create more permissive policies that work with Clerk authentication
-- Allow authenticated users to insert their own profile
CREATE POLICY "Allow authenticated users to insert their profile" 
ON users FOR INSERT 
TO authenticated
WITH CHECK (
  clerk_id = auth.jwt() ->> 'sub' OR 
  clerk_id = COALESCE(
    auth.jwt() ->> 'sub',
    current_setting('request.jwt.claims', true)::json ->> 'sub'
  )
);

-- Allow users to view their own profile
CREATE POLICY "Allow users to view own profile" 
ON users FOR SELECT 
TO authenticated
USING (
  clerk_id = auth.jwt() ->> 'sub' OR 
  clerk_id = COALESCE(
    auth.jwt() ->> 'sub',
    current_setting('request.jwt.claims', true)::json ->> 'sub'
  )
);

-- Allow users to update their own profile
CREATE POLICY "Allow users to update own profile" 
ON users FOR UPDATE 
TO authenticated
USING (
  clerk_id = auth.jwt() ->> 'sub' OR 
  clerk_id = COALESCE(
    auth.jwt() ->> 'sub',
    current_setting('request.jwt.claims', true)::json ->> 'sub'
  )
);

-- Also allow service role full access
CREATE POLICY "Allow service role full access" 
ON users FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Verify the new policies
SELECT tablename, policyname, cmd, permissive, roles, qual, with_check 
FROM pg_policies WHERE tablename = 'users';