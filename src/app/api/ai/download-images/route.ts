import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { downloadAndUploadImages } from '@/lib/scraper/image-downloader';
import { createSupabaseServiceClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { imageUrls, itemId } = body;

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return NextResponse.json(
        { error: 'Valid imageUrls array is required' },
        { status: 400 }
      );
    }

    if (!itemId || typeof itemId !== 'string') {
      return NextResponse.json(
        { error: 'Valid itemId is required' },
        { status: 400 }
      );
    }

    console.log(`Starting image download for ${imageUrls.length} images`);

    // Download and upload images
    const downloadResults = await downloadAndUploadImages(imageUrls, itemId);

    // Filter successful downloads
    const successfulUploads = downloadResults.filter(result => result.supabaseUrl);
    const failedDownloads = downloadResults.filter(result => result.error);

    console.log(`Image download complete: ${successfulUploads.length} successful, ${failedDownloads.length} failed`);

    // Save photo records to database for successful uploads
    if (successfulUploads.length > 0) {
      const serviceSupabase = createSupabaseServiceClient();
      
      const photoRecords = successfulUploads.map((result, index) => ({
        item_id: itemId,
        url: result.supabaseUrl!,
        is_primary: index === 0, // First photo is primary
        order_index: index
      }));

      const { error: dbError } = await serviceSupabase
        .from('item_photos')
        .insert(photoRecords);

      if (dbError) {
        console.error('Failed to save photo records to database:', dbError);
        // Don't fail the entire operation, but log the error
      } else {
        console.log(`Saved ${photoRecords.length} photo records to database`);
      }
    }

    return NextResponse.json({
      success: true,
      results: downloadResults,
      summary: {
        total: imageUrls.length,
        successful: successfulUploads.length,
        failed: failedDownloads.length,
      }
    });

  } catch (error) {
    console.error('Error in download-images API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to download images',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}