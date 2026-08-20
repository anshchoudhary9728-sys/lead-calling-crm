import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { current_status, current_planned_call_at, next_followup_at } = body;

    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 });
    }

    const updatePayload: any = { updated_at: new Date().toISOString() };
    if (current_status) updatePayload.current_status = current_status;
    if (current_planned_call_at !== undefined) updatePayload.current_planned_call_at = current_planned_call_at;
    if (next_followup_at !== undefined) updatePayload.next_followup_at = next_followup_at;

    const { data, error } = await supabase
      .from('leads')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, lead: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
