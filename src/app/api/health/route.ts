import { NextResponse } from 'next/server';
import { getAIStatus } from '@/lib/gemini/client';

/**
 * Health check endpoint for Docker health monitoring
 * @returns JSON response with application status
 */
export async function GET() {
  try {
    // Check service statuses
    const services = {
      database: checkDatabaseConnection(),
      auth: checkAuthService(),
      ai: await checkAIService(),
    };

    const allServicesHealthy = Object.values(services).every(
      service => service.status === 'ok'
    );

    const healthCheck = {
      status: allServicesHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env['npm_package_version'] || '1.0.0',
      services,
    };

    return NextResponse.json(healthCheck, { 
      status: allServicesHealthy ? 200 : 503 
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 500 }
    );
  }
}

/**
 * Check database connection status
 */
function checkDatabaseConnection() {
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const supabaseKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  
  if (!supabaseUrl || !supabaseKey) {
    return { status: 'error', message: 'Supabase configuration missing' };
  }
  
  return { status: 'ok', message: 'Supabase configured' };
}

/**
 * Check authentication service status
 */
function checkAuthService() {
  const clerkPubKey = process.env['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'];
  const clerkSecretKey = process.env['CLERK_SECRET_KEY'];
  
  if (!clerkPubKey || !clerkSecretKey) {
    return { status: 'error', message: 'Clerk configuration missing' };
  }
  
  return { status: 'ok', message: 'Clerk configured' };
}

/**
 * Check AI service status
 */
async function checkAIService() {
  try {
    return await getAIStatus();
  } catch (error) {
    return { 
      status: 'error', 
      message: error instanceof Error ? error.message : 'AI service error' 
    };
  }
}