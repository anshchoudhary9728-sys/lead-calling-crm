import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Quotation } from '@/types/quotation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get('lead_id');

    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from('quotations')
        .select('*')
        .order('created_at', { ascending: false });

      if (leadId) {
        query = query.eq('lead_id', leadId);
      }

      const { data, error } = await query;

      if (!error && data) {
        return NextResponse.json({
          success: true,
          quotations: data,
          source: 'supabase',
        });
      }
    }

    return NextResponse.json({
      success: true,
      quotations: [],
      source: 'memory',
    });
  } catch (err: any) {
    console.error('Fetch quotations exception:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: Partial<Quotation> = await req.json();

    if (!body.customer_name || !body.mobile_number || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Customer Name, Mobile Number and at least 1 Line Item are required.' },
        { status: 400 }
      );
    }

    // Generate Quotation Number if not provided: QT-YYYYMMDD-XXXX
    const today = new Date();
    const dateStr = today.toISOString().substring(0, 10).replace(/-/g, '');
    const randPart = Math.floor(1000 + Math.random() * 9000);
    const quotationNumber = body.quotation_number || `QT-${dateStr}-${randPart}`;

    const quotationRecord: any = {
      quotation_number: quotationNumber,
      lead_id: body.lead_id || null,
      lead_unique_id: body.lead_unique_id || null,
      customer_name: String(body.customer_name).trim(),
      company_name: body.company_name ? String(body.company_name).trim() : null,
      mobile_number: String(body.mobile_number).trim(),
      email: body.email ? String(body.email).trim().toLowerCase() : null,
      billing_address: body.billing_address || null,
      city: body.city || null,
      state: body.state || null,
      gstin: body.gstin || null,
      
      quotation_date: body.quotation_date || today.toISOString().substring(0, 10),
      valid_until_date: body.valid_until_date || new Date(Date.now() + 15 * 86400000).toISOString().substring(0, 10),
      
      items: body.items,
      
      subtotal: body.subtotal || 0,
      discount_type: body.discount_type || 'PERCENTAGE',
      discount_value: body.discount_value || 0,
      discount_amount: body.discount_amount || 0,
      taxable_amount: body.taxable_amount || body.subtotal || 0,
      
      tax_type: body.tax_type || 'CGST_SGST',
      cgst_rate: body.cgst_rate || 2.5,
      cgst_amount: body.cgst_amount || 0,
      sgst_rate: body.sgst_rate || 2.5,
      sgst_amount: body.sgst_amount || 0,
      igst_rate: body.igst_rate || 5,
      igst_amount: body.igst_amount || 0,
      total_tax: body.total_tax || 0,
      
      shipping_charges: body.shipping_charges || 0,
      round_off: body.round_off || 0,
      grand_total: body.grand_total || 0,
      grand_total_words: body.grand_total_words || '',
      
      terms_and_conditions: body.terms_and_conditions || [],
      notes: body.notes || null,
      company_profile: body.company_profile || null,
      
      status: body.status || 'SENT',
      whatsapp_status: body.whatsapp_status || 'PENDING',
      whatsapp_sent_at: body.whatsapp_status === 'SENT' ? new Date().toISOString() : null,
      
      created_by_user_id: body.created_by_user_id || null,
      created_by_user_name: body.created_by_user_name || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('quotations')
          .insert([quotationRecord])
          .select()
          .single();

        if (!error && data) {
          return NextResponse.json({
            success: true,
            quotation: data,
            message: `Quotation ${quotationNumber} saved successfully.`,
          });
        }
      } catch (dbErr) {
        console.error('Supabase quotation insert error:', dbErr);
      }
    }

    // Fallback response
    return NextResponse.json({
      success: true,
      quotation: {
        id: `qt-${Date.now()}`,
        ...quotationRecord,
      },
      message: `Quotation ${quotationNumber} created.`,
    });
  } catch (err: any) {
    console.error('Create quotation exception:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
