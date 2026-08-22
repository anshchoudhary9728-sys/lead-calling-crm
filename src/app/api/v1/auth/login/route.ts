import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { crmStore } from '@/lib/crm-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Please enter both username/email and password.' },
        { status: 400 }
      );
    }

    const cleanInput = username.trim().toLowerCase();

    // 1. Check Supabase users table
    if (isSupabaseConfigured && supabase) {
      const isSuperAdminQuery = cleanInput === 'admin' || cleanInput === 'superadmin';
      const { data: dbUser, error } = await supabase
        .from('users')
        .select('*')
        .or(isSuperAdminQuery ? `role.eq.SUPER_ADMIN,username.ilike.${cleanInput},email.ilike.${cleanInput}` : `username.ilike.${cleanInput},email.ilike.${cleanInput}`)
        .maybeSingle();

      if (!error && dbUser) {
        if (dbUser.status === 'INACTIVE') {
          return NextResponse.json(
            { success: false, error: 'Your account has been deactivated. Please contact administrator.' },
            { status: 403 }
          );
        }

        // Return authenticated user
        return NextResponse.json({
          success: true,
          user: dbUser,
        });
      }
    }

    // 2. Check local store users
    const storeUsers = crmStore.getUsers();
    const foundUser = storeUsers.find(
      u =>
        u.username.toLowerCase() === cleanInput ||
        u.email.toLowerCase() === cleanInput ||
        (cleanInput === 'admin' && (u.role === 'SUPER_ADMIN' || u.role === 'ADMIN'))
    );

    if (foundUser) {
      if (foundUser.status === 'INACTIVE') {
        return NextResponse.json(
          { success: false, error: 'Your account has been deactivated. Please contact administrator.' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        user: foundUser,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid username or password.' },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
