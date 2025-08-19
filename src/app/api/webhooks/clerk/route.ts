import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { createSupabaseServiceClient } from '@/lib/supabase/client';

const webhookSecret = process.env['CLERK_WEBHOOK_SECRET'];

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    throw new Error('Missing CLERK_WEBHOOK_SECRET environment variable');
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret
  const wh = new Webhook(webhookSecret);

  let evt: any;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as any;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occurred', {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;
  
  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, username, image_url } = evt.data;
    
    try {
      const supabase = createSupabaseServiceClient();
      
      // Sync user with our database
      const { error } = await supabase
        .from('users')
        .upsert({
          clerk_id: id,
          email: email_addresses[0]?.email_address,
          first_name: first_name || null,
          last_name: last_name || null,
          username: username || null,
          profile_image_url: image_url || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'clerk_id'
        });

      if (error) {
        console.error('Error syncing user to database:', error);
        return NextResponse.json({ error: 'Database sync failed' }, { status: 500 });
      }

      console.log(`User ${eventType}: ${id} synced to database`);
      
    } catch (error) {
      console.error('Error processing webhook:', error);
      return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ message: 'Webhook processed successfully' });
}