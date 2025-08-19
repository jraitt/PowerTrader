import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { ItemSchema } from '@/types/item';
import { createSupabaseServerComponent, createSupabaseServiceClient } from '@/lib/supabase/client';

// GET /api/items - List items with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sort') || 'created_at';
    const sortOrder = searchParams.get('order') || 'desc';

    // Use service role client for user lookup to bypass RLS
    const serviceSupabase = createSupabaseServiceClient();
    const supabase = createSupabaseServerComponent();

    // Try to get user's database ID
    const { data: userData } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!userData) {
      // User not found in database yet - return empty result but allow app to work
      console.log(`User not found for Clerk ID: ${userId}, returning empty inventory`);
      return NextResponse.json({
        items: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        },
        message: 'User needs to be synced to database'
      });
    }

    // Build query using service role client to bypass RLS
    let query = serviceSupabase
      .from('items')
      .select(`
        *,
        item_photos(*)
      `)
      .eq('created_by', userData.id)
      .is('deleted_at', null);

    // Add filters
    if (search) {
      query = query.or(`manufacturer.ilike.%${search}%,model.ilike.%${search}%,description.ilike.%${search}%,vin_serial.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Add sorting
    const validSortFields = ['created_at', 'updated_at', 'asking_price', 'manufacturer', 'model', 'condition'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const ascending = sortOrder.toLowerCase() === 'asc';
    
    query = query.order(sortField, { ascending });

    // Add pagination
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    query = query.range(start, end);

    const { data: items, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    // Get total count for pagination using service role client to bypass RLS
    const { count: totalCount } = await serviceSupabase
      .from('items')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', userData.id)
      .is('deleted_at', null);

    const total = totalCount || 0;

    return NextResponse.json({
      items: items || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching items:', error);
    
    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('relation')) {
      return NextResponse.json(
        { 
          error: 'Database not initialized', 
          items: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          }
        },
        { status: 200 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
}

// POST /api/items - Create new item
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/items called');
    
    const { userId } = auth();
    console.log('User ID from auth:', userId);
    
    if (!userId) {
      console.log('No user ID, returning unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Request body:', body);
    
    // Validate input data
    const validatedData = ItemSchema.parse(body);
    console.log('Validated data:', validatedData);

    // Use service role client for user lookup to bypass RLS
    const serviceSupabase = createSupabaseServiceClient();
    const supabase = createSupabaseServerComponent();

    // Get user's database ID
    console.log('Looking up user with clerk_id:', userId);
    const { data: userData, error: userError } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    console.log('User lookup result:', { userData, userError });

    if (!userData) {
      console.log('User not found in database, returning 404');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Found user in database:', userData);

    // Insert item using service role client to bypass RLS
    console.log('Attempting to insert item with user_id:', userData.id);
    const { data: newItem, error } = await serviceSupabase
      .from('items')
      .insert({
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
        created_by: userData.id
      })
      .select()
      .single();

    console.log('Insert result:', { newItem, error });

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    // Log activity using service role client to bypass RLS
    await serviceSupabase
      .from('activity_log')
      .insert({
        item_id: newItem.id,
        user_id: userData.id,
        action: 'item_created',
        details: {
          category: newItem.category,
          manufacturer: newItem.manufacturer,
          model: newItem.model
        }
      });

    console.log('Item created successfully, returning response');
    return NextResponse.json(newItem, { status: 201 });

  } catch (error) {
    console.error('Error creating item:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 }
    );
  }
}