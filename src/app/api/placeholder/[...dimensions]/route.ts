import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest, 
  { params }: { params: { dimensions: string[] } }
) {
  try {
    const [width, height] = params.dimensions;
    const w = parseInt(width || '150') || 150;
    const h = parseInt(height || '150') || 150;

    // Generate a simple SVG placeholder
    const svg = `
      <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <rect x="10%" y="10%" width="80%" height="80%" fill="#e5e7eb" rx="8"/>
        <circle cx="35%" cy="35%" r="8%" fill="#9ca3af"/>
        <path d="M 45% 50% L 75% 50% L 60% 70% Z" fill="#9ca3af"/>
        <text x="50%" y="85%" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.max(12, w/12)}px" fill="#6b7280">
          ${w}x${h}
        </text>
      </svg>
    `;

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('Error generating placeholder:', error);
    return new NextResponse('Error generating placeholder', { status: 500 });
  }
}