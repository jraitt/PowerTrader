import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServiceClient } from '@/lib/supabase/client';

// POST /api/admin/repair-photos - Repair items that have storage files but no database records
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceSupabase = createSupabaseServiceClient();

    // Get user's database ID
    const { data: userData } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all items that have no photos in the database
    const { data: itemsWithoutPhotos, error: itemsError } = await serviceSupabase
      .from('items')
      .select(`
        id,
        manufacturer,
        model,
        item_photos(id)
      `)
      .eq('created_by', userData.id)
      .is('deleted_at', null);

    if (itemsError) {
      throw new Error(`Failed to fetch items: ${itemsError.message}`);
    }

    const itemsNeedingRepair = itemsWithoutPhotos?.filter(item => 
      !item.item_photos || item.item_photos.length === 0
    ) || [];

    console.log(`Found ${itemsNeedingRepair.length} items without photo records`);

    if (itemsNeedingRepair.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No items need photo repair',
        repairedItems: 0
      });
    }

    let repairedCount = 0;

    // For each item, check if there are files in storage and create database records
    for (const item of itemsNeedingRepair) {
      try {
        // List files in storage for this item
        const { data: files, error: listError } = await serviceSupabase.storage
          .from('powertrader-images')
          .list('', {
            search: item.id
          });

        if (listError) {
          console.error(`Failed to list files for item ${item.id}:`, listError);
          continue;
        }

        const itemFiles = files?.filter(file => 
          file.name.includes(item.id) && 
          (file.name.endsWith('.jpg') || file.name.endsWith('.jpeg') || 
           file.name.endsWith('.png') || file.name.endsWith('.webp'))
        ) || [];

        if (itemFiles.length > 0) {
          console.log(`Found ${itemFiles.length} storage files for item ${item.id}`);

          // Create photo records for each file
          const photoRecords = itemFiles.map((file, index) => {
            const { data: { publicUrl } } = serviceSupabase.storage
              .from('powertrader-images')
              .getPublicUrl(file.name);

            return {
              item_id: item.id,
              url: publicUrl,
              is_primary: index === 0,
              order_index: index
            };
          });

          const { error: insertError } = await serviceSupabase
            .from('item_photos')
            .insert(photoRecords);

          if (insertError) {
            console.error(`Failed to insert photo records for item ${item.id}:`, insertError);
          } else {
            console.log(`Repaired ${photoRecords.length} photos for item ${item.id}`);
            repairedCount++;
          }
        }
      } catch (error) {
        console.error(`Error processing item ${item.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Repaired photos for ${repairedCount} items`,
      itemsChecked: itemsNeedingRepair.length,
      repairedItems: repairedCount
    });

  } catch (error) {
    console.error('Photo repair error:', error);
    return NextResponse.json(
      { error: 'Failed to repair photos' },
      { status: 500 }
    );
  }
}