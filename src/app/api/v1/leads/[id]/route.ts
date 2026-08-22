import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { current_status, current_planned_call_at, next_followup_at, deal_amount, remarks } = body;

    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 });
    }

    const updatePayload: any = {
      updated_at: new Date().toISOString(),
      last_call_at: new Date().toISOString(),
    };

    if (current_status) {
      updatePayload.current_status = current_status;
      updatePayload.last_call_status = current_status;

      if (current_status === 'CONVERTED') {
        updatePayload.converted_at = new Date().toISOString();
        updatePayload.current_planned_call_at = null;
        updatePayload.next_followup_at = null;
      }
    }

    if (deal_amount !== undefined) {
      updatePayload.deal_amount = Number(deal_amount) || 0;
    }

    if (current_planned_call_at !== undefined) {
      updatePayload.current_planned_call_at = current_planned_call_at;
    }
    if (next_followup_at !== undefined) {
      updatePayload.next_followup_at = next_followup_at;
    }

    // Match by UUID or unique_lead_id (LD-...)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let query = supabase.from('leads').update(updatePayload);
    
    if (isUuid) {
      query = query.eq('id', id);
    } else {
      query = query.eq('unique_lead_id', id);
    }

    const { data, error } = await query.select().maybeSingle();

    if (error) {
      console.error('Supabase PATCH leads error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      lead: data,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (err: any) {
    console.error('PATCH leads exception:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
