import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { importFromURL, isAIEnabled } from '@/lib/gemini/client';
import { z } from 'zod';

const ImportURLSchema = z.object({
  url: z.string().url('Invalid URL format'),
  itemId: z.string().optional(), // Optional itemId for image downloading
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
    const validation = ImportURLSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { url, itemId } = validation.data;

    // Check if URL is from supported platforms
    const supportedDomains = [
      'facebook.com',
      'marketplace.facebook.com',
      'craigslist.org',
      'ebay.com',
      'facebook.com/marketplace'
    ];

    const urlDomain = new URL(url).hostname.toLowerCase();
    const isSupported = supportedDomains.some(domain => 
      urlDomain.includes(domain) || urlDomain.endsWith(domain)
    );

    if (!isSupported) {
      return NextResponse.json(
        { 
          error: 'Unsupported URL. Currently supports Facebook Marketplace, Craigslist, and eBay.',
          supportedDomains 
        },
        { status: 400 }
      );
    }

    // Import data from URL using AI
    console.log(`Starting URL import for ${url} for user ${userId}${itemId ? ` with itemId ${itemId}` : ''}`);
    const importResult = await importFromURL(url, itemId);
    console.log('URL import completed:', importResult);

    return NextResponse.json({
      success: true,
      importResult,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in URL import:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error during URL import' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to import from URL.' },
    { status: 405 }
  );
}