import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      source = 'JUSTDIAL',
      customer_name,
      mobile_number,
      company_name,
      email,
      city,
      state,
      client_requirement,
      enquiry_message,
    } = body;

    // Validate mandatory fields
    if (!customer_name || !mobile_number) {
      return NextResponse.json(
        { success: false, error: 'Missing mandatory fields: customer_name and mobile_number are required.' },
        { status: 400 }
      );
    }

    // Normalize phone number
    const rawPhone = String(mobile_number || '');
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const normalizedPhone = cleanPhone.length >= 10
      ? `+91 ${cleanPhone.slice(-10)}`
      : `+91 ${cleanPhone}`;

    // Import Supabase
    const { supabase, isSupabaseConfigured } = await import('@/lib/supabase');

    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json(
        { success: false, error: 'Database not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel environment variables.' },
        { status: 500 }
      );
    }

    // Check for duplicate phone number in Supabase
    const { data: existing } = await supabase
      .from('leads')
      .select('id, unique_lead_id')
      .ilike('mobile_number', `%${cleanPhone.slice(-10)}%`)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: true,
        message: `Duplicate lead - already exists as ${existing.unique_lead_id}`,
        unique_lead_id: existing.unique_lead_id,
        duplicate: true,
      });
    }

    // Generate unique lead ID using timestamp + random (no DB count needed)
    const today = new Date();
    const dateStr = today.toISOString().substring(0, 10).replace(/-/g, '');
    const randomPart = Math.floor(10000 + Math.random() * 89999); // 5-digit random
    const unique_lead_id = `LD-${dateStr}-${randomPart}`;

    // Compute planned call time (+10 minutes from now)
    const plannedTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Direct INSERT into Supabase leads table
    const { data: inserted, error: dbError } = await supabase
      .from('leads')
      .insert([{
        unique_lead_id,
        source: source,
        customer_name: String(customer_name),
        company_name: company_name ? String(company_name) : null,
        mobile_number: normalizedPhone,
        email: email ? String(email) : null,
        city: city ? String(city) : null,
        state: state ? String(state) : null,
        client_requirement: client_requirement
          ? String(client_requirement)
          : enquiry_message
          ? String(enquiry_message)
          : null,
        enquiry_message: enquiry_message ? String(enquiry_message) : null,
        current_status: 'NEW',
        current_planned_call_at: plannedTime,
        lead_received_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (dbError) {
      console.error('Supabase INSERT Error:', JSON.stringify(dbError));
      return NextResponse.json(
        {
          success: false,
          error: `Database insert failed: ${dbError.message}`,
          details: dbError,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Lead synced successfully! Assigned Unique ID: ${unique_lead_id}. Planned call in 10 minutes.`,
      unique_lead_id,
      lead_id: inserted?.id,
      planned_call_at: plannedTime,
      synced_at: new Date().toISOString(),
    });

  } catch (err: any) {
    console.error('Webhook Exception:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
