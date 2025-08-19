import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// This is a public endpoint for image proxying - no auth required

const ProxyImageSchema = z.object({
  url: z.string().url('Invalid URL format'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // Clean up URL encoding issues
    url = decodeURIComponent(url)
      .replace(/\\\//g, '/')  // Replace \/ with /
      .replace(/\\u002F/g, '/') // Replace unicode escaped slashes
      .replace(/\\/g, ''); // Remove any remaining backslashes

    const validation = ProxyImageSchema.safeParse({ url });
    if (!validation.success) {
      console.error('URL validation failed:', url, validation.error);
      return NextResponse.json({ 
        error: 'Invalid URL format', 
        details: validation.error.errors 
      }, { status: 400 });
    }

    // Only allow proxying from known safe domains
    const allowedDomains = [
      'fbcdn.net',
      'facebook.com',
      'scontent-',
      'craigslist.org',
      'images.craigslist.org',
      'via.placeholder.com', // For testing
    ];

    const urlObj = new URL(url);
    const isAllowed = allowedDomains.some(domain => 
      urlObj.hostname.includes(domain) || urlObj.hostname.endsWith(domain)
    );

    if (!isAllowed) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
    }

    // Fetch the image with appropriate headers
    const imageResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': 'https://www.facebook.com/',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site',
      },
    });

    if (!imageResponse.ok) {
      console.error(`Failed to fetch image from ${url}: ${imageResponse.status} ${imageResponse.statusText}`);
      return NextResponse.json(
        { error: 'Failed to fetch image' }, 
        { status: imageResponse.status }
      );
    }

    // Get the image data
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Content-Length': imageBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Error in image proxy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET with url parameter.' },
    { status: 405 }
  );
}