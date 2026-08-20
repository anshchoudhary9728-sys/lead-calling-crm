import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { crmStore } from '@/lib/crm-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { status, role } = body;

    if (isSupabaseConfigured && supabase) {
      const updatePayload: any = { updated_at: new Date().toISOString() };
      if (status) updatePayload.status = status;
      if (role) updatePayload.role = role;

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      let query = supabase.from('users').update(updatePayload);
      if (isUuid) {
        query = query.eq('id', id);
      } else {
        query = query.eq('employee_code', id);
      }

      const { data, error } = await query.select().maybeSingle();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      // Also update local store
      crmStore.toggleUserStatus(id);

      return NextResponse.json({ success: true, user: data });
    }

    // Local toggle
    crmStore.toggleUserStatus(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
