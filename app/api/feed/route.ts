import { NextResponse } from 'next/server';
import { getRecentPublicSessions } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    
    const sessions = await getRecentPublicSessions(Math.min(limit, 100));
    
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching feed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feed' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
