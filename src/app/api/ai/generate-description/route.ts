import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateDescription, isAIEnabled } from '@/lib/gemini/client';
import { z } from 'zod';

const GenerateDescriptionSchema = z.object({
  category: z.enum(['ATV', 'Snowmobile', 'Trailer', 'Small Engine']),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  model: z.string().min(1, 'Model is required'),
  condition: z.number().int().min(1).max(10),
  additionalDetails: z.string().optional(),
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
    const validation = GenerateDescriptionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { category, manufacturer, model, condition, additionalDetails } = validation.data;

    // Generate description using AI
    console.log(`Generating description for ${manufacturer} ${model} (${category}) for user ${userId}`);
    const description = await generateDescription(
      category,
      manufacturer,
      model,
      condition,
      additionalDetails
    );
    console.log('Description generated successfully');

    return NextResponse.json({
      success: true,
      description,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in description generation:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error during description generation' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to generate description.' },
    { status: 405 }
  );
}