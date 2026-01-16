import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import type { AnalyticsStats } from '@/lib/database.types';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Call the analytics function
    const { data, error } = await supabase.rpc('get_analytics_stats');

    if (error) {
      console.error('Error fetching analytics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 500 }
      );
    }

    // Function returns an array, get the first row
    const stats: AnalyticsStats | null = data?.[0] ?? null;

    if (!stats) {
      return NextResponse.json(
        { error: 'No analytics data available' },
        { status: 404 }
      );
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
