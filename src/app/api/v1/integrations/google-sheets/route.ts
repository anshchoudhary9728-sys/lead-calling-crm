import { NextRequest, NextResponse } from 'next/server';
import { crmStore } from '@/lib/crm-store';
import { LeadSource } from '@/types/crm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      source = 'JUSTDIAL',
      source_lead_id,
      customer_name,
      mobile_number,
      company_name,
      email,
      city,
      state,
      client_requirement,
      product,
      enquiry_message,
    } = body;

    // Validate mandatory fields
    if (!customer_name || !mobile_number) {
      return NextResponse.json(
        { success: false, error: 'Missing mandatory fields: customer_name and mobile_number are required.' },
        { status: 400 }
      );
    }

    // Call store sync function
    const result = crmStore.syncGoogleSheetLead({
      source: (source as LeadSource) || 'JUSTDIAL',
      source_lead_id,
      customer_name,
      mobile_number,
      company_name,
      email,
      city,
      state,
      client_requirement: client_requirement || enquiry_message,
      product,
      enquiry_message,
    });

    // If Supabase database is connected, insert directly into Supabase PostgreSQL `leads` table
    const { supabase, isSupabaseConfigured } = await import('@/lib/supabase');
    if (isSupabaseConfigured && supabase && result.success) {
      try {
        const rawPhone = String(mobile_number || '');
        const cleanPhone = rawPhone.replace(/\D/g, '');
        const normalizedPhone = cleanPhone.length === 10 ? `+91 ${cleanPhone}` : `+91 ${cleanPhone.slice(-10)}`;
        const plannedTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        await supabase.from('leads').insert([{
          unique_lead_id: result.unique_lead_id,
          source: (source as LeadSource) || 'JUSTDIAL',
          customer_name,
          company_name: company_name || null,
          mobile_number: normalizedPhone,
          email: email || null,
          city: city || null,
          state: state || null,
          client_requirement: client_requirement || enquiry_message || null,
          current_status: 'NEW',
          current_planned_call_at: plannedTime,
          lead_received_at: new Date().toISOString(),
        }]);
      } catch (dbErr) {
        console.error('Supabase PostgreSQL insert warning:', dbErr);
      }
    }

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        supabase_lead_id: result.lead_id,
        unique_lead_id: result.unique_lead_id,
        synced_at: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
