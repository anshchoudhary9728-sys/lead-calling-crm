import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { DEFAULT_LEAD_SOURCES } from '@/constants/sources';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

let memorySources: string[] = [...DEFAULT_LEAD_SOURCES];

export async function GET() {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('lead_sources')
        .select('name')
        .order('name', { ascending: true });

      if (!error && data && data.length > 0) {
        const dbNames = data.map((d: any) => d.name).filter(Boolean);
        return NextResponse.json({ success: true, sources: dbNames });
      }
    }

    return NextResponse.json({ success: true, sources: memorySources });
  } catch (err: any) {
    return NextResponse.json({ success: true, sources: memorySources });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sourceName = body.name?.trim();

    if (!sourceName) {
      return NextResponse.json({ success: false, error: 'Source name is required' }, { status: 400 });
    }

    if (!memorySources.some(s => s.toLowerCase() === sourceName.toLowerCase())) {
      memorySources.push(sourceName);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('lead_sources')
          .insert([{ name: sourceName }])
          .select();
      } catch (dbErr) {
        // Table might not exist yet
      }
    }

    return NextResponse.json({
      success: true,
      message: `Source "${sourceName}" added successfully!`,
      sources: memorySources,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sourceName = searchParams.get('name')?.trim();

    if (!sourceName) {
      return NextResponse.json({ success: false, error: 'Source name is required' }, { status: 400 });
    }

    memorySources = memorySources.filter(s => s.toLowerCase() !== sourceName.toLowerCase());

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('lead_sources')
          .delete()
          .ilike('name', sourceName);
      } catch (dbErr) {
        // Table might not exist yet
      }
    }

    return NextResponse.json({
      success: true,
      message: `Source "${sourceName}" removed successfully!`,
      sources: memorySources,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT() {
  memorySources = [...DEFAULT_LEAD_SOURCES];
  return NextResponse.json({
    success: true,
    message: 'Reset to default sources list successfully!',
    sources: memorySources,
  });
}
