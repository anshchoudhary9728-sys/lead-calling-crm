import { NextRequest, NextResponse } from 'next/server';
import { crmStore } from '@/lib/crm-store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    // If Supabase DB is configured, fetch directly from Supabase PostgreSQL
    if (isSupabaseConfigured && supabase) {
      const { data: dbLeads, error } = await supabase
        .from('leads')
        .select('*')
        .order('current_planned_call_at', { ascending: true });

      if (!error && dbLeads && dbLeads.length > 0) {
        return NextResponse.json({ success: true, leads: dbLeads }, { status: 200 });
      }
    }

    // Fallback to store
    const leads = crmStore.getLeads();
    return NextResponse.json({ success: true, leads }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
