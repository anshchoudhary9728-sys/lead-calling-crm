import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    // Fetch ONLY from Supabase — no demo/seed data fallback
    if (isSupabaseConfigured && supabase) {
      const { data: dbLeads, error } = await supabase
        .from('leads')
        .select('*')
        .order('current_planned_call_at', { ascending: true });

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, leads: dbLeads || [], source: 'supabase' }, { status: 200 });
    }

    // Supabase not configured — return empty, not demo data
    return NextResponse.json({
      success: false,
      leads: [],
      error: 'Database not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel environment variables.',
    }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
