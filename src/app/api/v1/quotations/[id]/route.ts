import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (isSupabaseConfigured && supabase) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      let query = supabase.from('quotations').select('*');
      if (isUuid) {
        query = query.eq('id', id);
      } else {
        query = query.eq('quotation_number', id);
      }

      const { data, error } = await query.maybeSingle();
      if (!error && data) {
        return NextResponse.json({ success: true, quotation: data });
      }
    }

    return NextResponse.json({ success: false, error: 'Quotation not found' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();

    if (isSupabaseConfigured && supabase) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      let query = supabase.from('quotations').update({
        ...body,
        updated_at: new Date().toISOString(),
      });

      if (isUuid) {
        query = query.eq('id', id);
      } else {
        query = query.eq('quotation_number', id);
      }

      const { data, error } = await query.select().maybeSingle();
      if (!error && data) {
        return NextResponse.json({ success: true, quotation: data });
      }
    }

    return NextResponse.json({ success: true, message: 'Quotation updated' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
