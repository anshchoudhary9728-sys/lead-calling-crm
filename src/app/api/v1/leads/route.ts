import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data: dbLeads, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        leads: dbLeads || [],
        source: 'supabase',
      }, {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      });
    }

    return NextResponse.json({
      success: false,
      leads: [],
      error: 'Database not configured.',
    }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customer_name,
      mobile_number,
      company_name,
      alternate_number,
      email,
      city,
      state,
      source = 'MANUAL',
      custom_source,
      client_requirement,
    } = body;

    if (!customer_name || !mobile_number) {
      return NextResponse.json(
        { success: false, error: 'Customer Name and Mobile Number are required.' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json(
        { success: false, error: 'Database not configured.' },
        { status: 500 }
      );
    }

    // Normalize phone number
    const rawPhone = String(mobile_number || '');
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const normalizedPhone = cleanPhone.length >= 10
      ? `+91 ${cleanPhone.slice(-10)}`
      : `+91 ${cleanPhone}`;

    // Generate unique ID: LD-YYYYMMDD-XXXXX
    const today = new Date();
    const dateStr = today.toISOString().substring(0, 10).replace(/-/g, '');
    const randomPart = Math.floor(10000 + Math.random() * 89999);
    const unique_lead_id = `LD-${dateStr}-${randomPart}`;

    // Planned call time (+10 minutes from now)
    const plannedTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Map source to valid Postgres ENUM ('JUSTDIAL', 'INDIAMART', 'MANUAL', 'IMPORT', 'OTHER')
    let validSource: string = 'MANUAL';
    if (['JUSTDIAL', 'INDIAMART', 'MANUAL', 'IMPORT', 'OTHER'].includes(source)) {
      validSource = source;
    } else {
      validSource = 'MANUAL';
    }

    const requirementText = custom_source
      ? `[Source: ${custom_source}] ${client_requirement || ''}`
      : client_requirement || null;

    // Automatic Round-Robin Assignment to Active Sales Team
    let assignedUserId: string | null = null;
    try {
      const { data: activeCallers } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('status', 'ACTIVE')
        .eq('role', 'SALES_EXECUTIVE');

      if (activeCallers && activeCallers.length > 0) {
        // Pick random/round-robin active caller from sales team
        const selectedCaller = activeCallers[Math.floor(Math.random() * activeCallers.length)];
        assignedUserId = selectedCaller.id;
      }
    } catch (e) {
      // Fallback unassigned
    }

    const { data: insertedLead, error: insertError } = await supabase
      .from('leads')
      .insert([{
        unique_lead_id,
        source: validSource,
        customer_name: String(customer_name).trim(),
        company_name: company_name ? String(company_name).trim() : null,
        mobile_number: normalizedPhone,
        alternate_number: alternate_number ? String(alternate_number).trim() : null,
        email: email ? String(email).trim().toLowerCase() : null,
        city: city ? String(city).trim() : null,
        state: state ? String(state).trim() : null,
        client_requirement: requirementText,
        enquiry_message: requirementText,
        assigned_user_id: assignedUserId,
        current_status: 'NEW',
        current_planned_call_at: plannedTime,
        lead_received_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Manual lead insert error:', insertError);
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Manual lead created with ID ${unique_lead_id}`,
      lead: insertedLead,
    });

  } catch (err: any) {
    console.error('Manual lead exception:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
