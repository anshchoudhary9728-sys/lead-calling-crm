import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json({ success: true, kpis: { overdue_calls: 0, followup_count: 0, not_reachable_count: 0, new_leads_today: 0, converted_count: 0 } });
    }

    const { data: leads } = await supabase.from('leads').select('current_status, current_planned_call_at, lead_received_at');

    if (!leads) return NextResponse.json({ success: true, kpis: { overdue_calls: 0, followup_count: 0, not_reachable_count: 0, new_leads_today: 0, converted_count: 0 } });

    const now = new Date();
    const todayStr = now.toISOString().substring(0, 10);

    const kpis = {
      overdue_calls: leads.filter(l =>
        l.current_planned_call_at &&
        new Date(l.current_planned_call_at) < now &&
        l.current_status !== 'CONVERTED' &&
        l.current_status !== 'LOST' &&
        l.current_status !== 'NOT_INTERESTED'
      ).length,
      followup_count: leads.filter(l => l.current_status === 'FOLLOW_UP').length,
      not_reachable_count: leads.filter(l => l.current_status === 'NOT_REACHABLE').length,
      new_leads_today: leads.filter(l => l.lead_received_at && l.lead_received_at.substring(0, 10) === todayStr).length,
      converted_count: leads.filter(l => l.current_status === 'CONVERTED').length,
    };

    return NextResponse.json({ success: true, kpis });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
