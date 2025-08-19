import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAIStatus, isAIEnabled } from '@/lib/gemini/client';

export async function GET() {
  try {
    // Check authentication
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get AI service status
    const aiStatus = await getAIStatus();
    const enabled = isAIEnabled();

    return NextResponse.json({
      enabled,
      status: aiStatus.status,
      message: aiStatus.message,
      features: {
        photoAnalysis: enabled,
        urlImport: enabled,
        descriptionGeneration: enabled,
        pricingSuggestions: enabled,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error checking AI status:', error);
    
    return NextResponse.json({
      enabled: false,
      status: 'error',
      message: 'Failed to check AI status',
      features: {
        photoAnalysis: false,
        urlImport: false,
        descriptionGeneration: false,
        pricingSuggestions: false,
      },
      timestamp: new Date().toISOString(),
    });
  }
}