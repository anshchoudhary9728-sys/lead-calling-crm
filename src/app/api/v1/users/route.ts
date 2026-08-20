import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { crmStore } from '@/lib/crm-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data: dbUsers, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && dbUsers && dbUsers.length > 0) {
        return NextResponse.json({ success: true, users: dbUsers }, {
          headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
        });
      }
    }

    // Fallback to store users
    return NextResponse.json({ success: true, users: crmStore.getUsers() }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { full_name, username, email, phone, role, password = 'user123' } = body;

    if (!full_name || !email) {
      return NextResponse.json({ success: false, error: 'Full name and email are required' }, { status: 400 });
    }

    const cleanUsername = (username || email.split('@')[0]).toLowerCase().trim();
    const empCode = `EMP-${Math.floor(100 + Math.random() * 900)}`;

    if (isSupabaseConfigured && supabase) {
      // Check if username/email already exists in Supabase
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .or(`username.eq.${cleanUsername},email.eq.${email.trim()}`)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ success: false, error: 'Username or Email already exists.' }, { status: 400 });
      }

      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{
          employee_code: empCode,
          full_name: full_name.trim(),
          username: cleanUsername,
          email: email.trim().toLowerCase(),
          phone: phone ? phone.trim() : null,
          role: role || 'SALES_EXECUTIVE',
          status: 'ACTIVE',
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase user insert error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      // Also create in local store
      crmStore.createUser({
        full_name: full_name.trim(),
        username: cleanUsername,
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : '',
        role: role || 'SALES_EXECUTIVE',
      });

      return NextResponse.json({ success: true, user: newUser });
    }

    // Local store create
    const localUser = crmStore.createUser({
      full_name: full_name.trim(),
      username: cleanUsername,
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      role: role || 'SALES_EXECUTIVE',
    });

    return NextResponse.json({ success: true, user: localUser });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
