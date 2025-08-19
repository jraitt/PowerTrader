import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { ItemSchema } from '@/types/item';
import { createSupabaseServerComponent, createSupabaseServiceClient } from '@/lib/supabase/client';

// GET /api/items/[id] - Get single item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Get item with photos using service role client to bypass RLS
    const { data: item, error } = await serviceSupabase
      .from('items')
      .select(`
        *,
        item_photos(*),
        activity_log(*)
      `)
      .eq('id', params.id)
      .eq('created_by', userData.id)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }
      console.error('Supabase error:', error);
      throw error;
    }

    return NextResponse.json(item);

  } catch (error) {
    console.error('Error fetching item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch item' },
      { status: 500 }
    );
  }
}

// PUT /api/items/[id] - Update item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate input data
    const validatedData = ItemSchema.parse(body);

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

    // Check if item exists and belongs to user using service role client to bypass RLS
    const { data: existingItem } = await serviceSupabase
      .from('items')
      .select('*')
      .eq('id', params.id)
      .eq('created_by', userData.id)
      .is('deleted_at', null)
      .single();

    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData = {
      category: validatedData.category,
      manufacturer: validatedData.manufacturer,
      model: validatedData.model,
      year: validatedData.year || null,
      condition: validatedData.condition,
      asking_price: validatedData.asking_price,
      final_price: validatedData.final_price || null,
      sold_price: validatedData.sold_price || null,
      purchase_location: validatedData.purchase_location || null,
      purchase_date: validatedData.purchase_date || null,
      sale_date: validatedData.sale_date || null,
      status: validatedData.status,
      description: validatedData.description,
      vin_serial: validatedData.vin_serial || null,
      updated_at: new Date().toISOString()
    };

    // Auto-set sale_date when status changes to Sold
    if (validatedData.status === 'Sold' && existingItem.status !== 'Sold') {
      updateData.sale_date = new Date().toISOString().split('T')[0] || null;
    }

    // Update item using service role client to bypass RLS
    const { data: updatedItem, error } = await serviceSupabase
      .from('items')
      .update(updateData)
      .eq('id', params.id)
      .eq('created_by', userData.id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }

    // Log activity
    const changes: Record<string, any> = {};
    Object.keys(updateData).forEach(key => {
      if (key !== 'updated_at' && (existingItem as any)[key] !== (updateData as any)[key]) {
        changes[key] = {
          from: (existingItem as any)[key],
          to: (updateData as any)[key]
        };
      }
    });

    if (Object.keys(changes).length > 0) {
      await serviceSupabase
        .from('activity_log')
        .insert({
          item_id: updatedItem.id,
          user_id: userData.id,
          action: 'item_updated',
          details: { changes }
        });
    }

    return NextResponse.json(updatedItem);

  } catch (error) {
    console.error('Error updating item:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    );
  }
}

// DELETE /api/items/[id] - Soft delete item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Check if item exists and belongs to user using service role client to bypass RLS
    const { data: existingItem } = await serviceSupabase
      .from('items')
      .select('*')
      .eq('id', params.id)
      .eq('created_by', userData.id)
      .is('deleted_at', null)
      .single();

    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Soft delete item using service role client to bypass RLS
    const { error } = await serviceSupabase
      .from('items')
      .update({ 
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('created_by', userData.id);

    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }

    // Log activity using service role client to bypass RLS
    await serviceSupabase
      .from('activity_log')
      .insert({
        item_id: params.id,
        user_id: userData.id,
        action: 'item_deleted',
        details: {
          category: existingItem.category,
          manufacturer: existingItem.manufacturer,
          model: existingItem.model
        }
      });

    return NextResponse.json({ message: 'Item deleted successfully' });

  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    );
  }
}