import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json({
        success: true,
        kpis: {
          overdue_calls: 0,
          new_inquiry_count: 0,
          followup_count: 0,
          not_reachable_count: 0,
          converted_count: 0,
        },
      });
    }

    const { data: leads, error } = await supabase
      .from('leads')
      .select('current_status, current_planned_call_at, lead_received_at');

    if (error || !leads) {
      return NextResponse.json({
        success: true,
        kpis: {
          overdue_calls: 0,
          new_inquiry_count: 0,
          followup_count: 0,
          not_reachable_count: 0,
          converted_count: 0,
        },
      });
    }

    const now = new Date();

    const kpis = {
      // Overdue specifically for NEW inquiries that missed their 10 min window
      overdue_calls: leads.filter(l =>
        l.current_status === 'NEW' &&
        l.current_planned_call_at &&
        new Date(l.current_planned_call_at) < now
      ).length,
      new_inquiry_count: leads.filter(l => l.current_status === 'NEW').length,
      followup_count: leads.filter(l => l.current_status === 'FOLLOW_UP').length,
      not_reachable_count: leads.filter(l => l.current_status === 'NOT_REACHABLE').length,
      converted_count: leads.filter(l => l.current_status === 'CONVERTED').length,
    };

    return NextResponse.json({ success: true, kpis }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
