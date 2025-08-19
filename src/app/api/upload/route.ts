import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerComponent, createSupabaseServiceClient } from '@/lib/supabase/client';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// POST /api/upload - Upload photos to Supabase Storage
export async function POST(request: NextRequest) {
  console.log('Upload endpoint called');
  try {
    const { userId } = auth();
    console.log('User ID from auth:', userId);
    
    if (!userId) {
      console.log('No user ID, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const itemId = formData.get('itemId') as string;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Validate files
    for (const file of files) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return NextResponse.json({ 
          error: `File type ${file.type} not allowed. Only JPEG, PNG, and WebP are supported.` 
        }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ 
          error: `File ${file.name} is too large. Maximum size is 10MB.` 
        }, { status: 400 });
      }
    }

    // Use service role client for user lookup to bypass RLS
    const serviceSupabase = createSupabaseServiceClient();
    const supabase = createSupabaseServerComponent();

    // Get user's database ID
    const { data: userData } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If itemId is provided, verify user owns the item using service role client to bypass RLS
    if (itemId) {
      const { data: item } = await serviceSupabase
        .from('items')
        .select('id')
        .eq('id', itemId)
        .eq('created_by', userData.id)
        .single();

      if (!item) {
        return NextResponse.json({ error: 'Item not found or access denied' }, { status: 404 });
      }
    }

    const uploadResults = [];
    const errors = [];

    // Upload each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;
      
      try {
        // Generate unique filename
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        // Convert File to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Upload to Supabase Storage using service role client to bypass RLS
        const { data, error: uploadError } = await serviceSupabase.storage
          .from('powertrader-images')
          .upload(filePath, uint8Array, {
            contentType: file.type || 'image/jpeg',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          errors.push(`Failed to upload ${file.name}: ${uploadError.message}`);
          continue;
        }

        // Get public URL using service role client
        const { data: { publicUrl } } = serviceSupabase.storage
          .from('powertrader-images')
          .getPublicUrl(filePath);

        const uploadResult = {
          fileName: file.name || 'unnamed',
          filePath: data.path,
          url: publicUrl,
          size: file.size || 0,
          type: file.type || 'image/jpeg'
        };

        // If itemId provided, save to item_photos table using service role client to bypass RLS
        if (itemId) {
          const { error: dbError } = await serviceSupabase
            .from('item_photos')
            .insert({
              item_id: itemId,
              url: publicUrl,
              is_primary: i === 0, // First photo is primary
              order_index: i
            });

          if (dbError) {
            console.error('Database insert error:', dbError);
            // Clean up uploaded file using service role client
            await serviceSupabase.storage
              .from('powertrader-images')
              .remove([filePath]);
            errors.push(`Failed to save photo record for ${file.name}`);
            continue;
          }
        }

        uploadResults.push(uploadResult);

      } catch (error) {
        console.error(`Error processing file ${file.name || 'unnamed'}:`, error);
        errors.push(`Failed to process ${file.name || 'unnamed'}: ${(error as Error).message || 'Unknown error'}`);
      }
    }

    // Log activity if photos were added to an item using service role client to bypass RLS
    if (itemId && uploadResults.length > 0) {
      await serviceSupabase
        .from('activity_log')
        .insert({
          item_id: itemId,
          user_id: userData.id,
          action: 'photos_uploaded',
          details: {
            photoCount: uploadResults.length,
            fileNames: uploadResults.map(r => r.fileName)
          }
        });
    }

    return NextResponse.json({
      success: true,
      uploadedFiles: uploadResults,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully uploaded ${uploadResults.length} of ${files.length} files`
    });

  } catch (error) {
    console.error('Upload endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    );
  }
}

// DELETE /api/upload - Delete photo from storage and database
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get('photoId');
    const filePath = searchParams.get('filePath');

    if (!photoId && !filePath) {
      return NextResponse.json({ error: 'Photo ID or file path required' }, { status: 400 });
    }

    // Use service role client for user lookup to bypass RLS
    const serviceSupabase = createSupabaseServiceClient();
    const supabase = createSupabaseServerComponent();

    // Get user's database ID
    const { data: userData } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let photoRecord = null;
    let pathToDelete = filePath;

    // If photoId provided, get the record and verify ownership using service role client to bypass RLS
    if (photoId) {
      const { data: photo } = await serviceSupabase
        .from('item_photos')
        .select(`
          *,
          items!inner(created_by)
        `)
        .eq('id', photoId)
        .single();

      if (!photo || photo.items.created_by !== userData.id) {
        return NextResponse.json({ error: 'Photo not found or access denied' }, { status: 404 });
      }

      photoRecord = photo;
      // Extract file path from URL
      const url = new URL(photo.url);
      pathToDelete = url.pathname.split('/').slice(-2).join('/'); // Get last two parts of path
    }

    // Delete from storage using service role client to bypass RLS
    if (pathToDelete) {
      const { error: storageError } = await serviceSupabase.storage
        .from('powertrader-images')
        .remove([pathToDelete]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
      }
    }

    // Delete from database if photoId provided using service role client to bypass RLS
    if (photoId && photoRecord) {
      const { error: dbError } = await serviceSupabase
        .from('item_photos')
        .delete()
        .eq('id', photoId);

      if (dbError) {
        console.error('Database deletion error:', dbError);
        return NextResponse.json({ error: 'Failed to delete photo record' }, { status: 500 });
      }

      // Log activity using service role client to bypass RLS
      await serviceSupabase
        .from('activity_log')
        .insert({
          item_id: photoRecord.item_id,
          user_id: userData.id,
          action: 'photo_deleted',
          details: {
            photoUrl: photoRecord.url
          }
        });
    }

    return NextResponse.json({ message: 'Photo deleted successfully' });

  } catch (error) {
    console.error('Delete endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    );
  }
}