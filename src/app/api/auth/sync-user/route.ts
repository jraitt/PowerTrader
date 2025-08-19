import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerComponent, createSupabaseServiceClient } from '@/lib/supabase/client';

/**
 * POST /api/auth/sync-user
 * Syncs the current authenticated user to the Supabase database
 * This should be called after user signs in to ensure they exist in our system
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role client to bypass RLS for user creation
    const supabase = createSupabaseServiceClient();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, username, profile_image_url')
      .eq('clerk_id', userId)
      .single();

    if (existingUser) {
      return NextResponse.json({ 
        message: 'User already exists', 
        user: existingUser 
      });
    }

    // Get user data from request body (sent from client after sign-in)
    const body = await request.json().catch(() => ({}));
    const { email, firstName, lastName, username, imageUrl } = body;

    // Create user record - using service role client to bypass RLS
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        clerk_id: userId,
        email: email || `user_${userId.slice(-8)}@powertrader.local`,
        first_name: firstName || null,
        last_name: lastName || null,
        username: username || null,
        profile_image_url: imageUrl || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      
      // If user already exists (race condition), try to fetch them
      if (error.code === '23505') {
        const { data: retryUser } = await supabase
          .from('users')
          .select('id, email, first_name, last_name, username, profile_image_url')
          .eq('clerk_id', userId)
          .single();
        
        if (retryUser) {
          return NextResponse.json({ 
            message: 'User already exists', 
            user: retryUser 
          });
        }
      }
      
      return NextResponse.json({ 
        error: 'Failed to create user', 
        details: error.message 
      }, { status: 500 });
    }

    console.log(`Successfully created user ${userId} in database`);
    
    return NextResponse.json({ 
      message: 'User created successfully', 
      user: newUser 
    });

  } catch (error) {
    console.error('Error in user sync:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}