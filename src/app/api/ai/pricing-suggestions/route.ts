import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getPricingSuggestions, isAIEnabled } from '@/lib/gemini/client';
import { z } from 'zod';

const PricingSuggestionsSchema = z.object({
  category: z.enum(['ATV', 'Snowmobile', 'Trailer', 'Small Engine']),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  condition: z.number().int().min(1).max(10).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if AI features are enabled
    if (!isAIEnabled()) {
      return NextResponse.json(
        { error: 'AI features are not enabled' },
        { status: 503 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = PricingSuggestionsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { category, manufacturer, model, year, condition } = validation.data;

    // Get pricing suggestions using AI
    console.log(`Getting pricing suggestions for ${manufacturer} ${model} (${category}) for user ${userId}`);
    const pricingSuggestions = await getPricingSuggestions(
      category,
      manufacturer,
      model,
      year,
      condition
    );
    console.log('Pricing suggestions generated successfully');

    return NextResponse.json({
      success: true,
      pricingSuggestions,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in pricing suggestions:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error during pricing suggestions' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to get pricing suggestions.' },
    { status: 405 }
  );
}