import { User } from '@clerk/nextjs/server';
import { createSupabaseServiceClient } from '@/lib/supabase/client';

export async function syncUserToDatabase(user: User) {
  try {
    const supabase = createSupabaseServiceClient();
    
    const { error } = await supabase
      .from('users')
      .upsert({
        clerk_id: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        first_name: user.firstName || null,
        last_name: user.lastName || null,
        username: user.username || null,
        profile_image_url: user.imageUrl || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'clerk_id'
      });

    if (error) {
      console.error('Error syncing user to database:', error);
      return { success: false, error };
    }

    console.log(`User synced to database: ${user.id}`);
    return { success: true };
    
  } catch (error) {
    console.error('Error in user sync:', error);
    return { success: false, error };
  }
}