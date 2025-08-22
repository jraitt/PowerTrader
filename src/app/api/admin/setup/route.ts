import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { targetUserId, adminSecret } = body;

    // Add a secret key check for security
    if (adminSecret !== process.env.ADMIN_SETUP_SECRET) {
      return NextResponse.json({ error: 'Invalid admin secret' }, { status: 403 });
    }

    // You would use the Clerk backend API here to update user metadata
    // For now, this is a placeholder showing the structure
    
    return NextResponse.json({ 
      message: 'Admin setup instructions',
      note: 'Use Clerk Dashboard or MCP server to set user.publicMetadata.role = "admin"',
      targetUserId 
    });

  } catch (error) {
    console.error('Admin setup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}