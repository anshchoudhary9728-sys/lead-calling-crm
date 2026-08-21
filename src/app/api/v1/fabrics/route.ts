import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { FABRIC_SUGGESTIONS as DEFAULT_FABRICS } from '@/constants/fabrics';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// In-memory fallback list if Supabase table isn't created yet
let memoryFabrics: string[] = [...DEFAULT_FABRICS];

export async function GET() {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('fabrics')
        .select('name')
        .order('name', { ascending: true });

      if (!error && data && data.length > 0) {
        const dbNames = data.map((d: any) => d.name).filter(Boolean);
        return NextResponse.json({ success: true, fabrics: dbNames });
      }
    }

    return NextResponse.json({ success: true, fabrics: memoryFabrics });
  } catch (err: any) {
    return NextResponse.json({ success: true, fabrics: memoryFabrics });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const fabricName = body.name?.trim();

    if (!fabricName) {
      return NextResponse.json({ success: false, error: 'Fabric name is required' }, { status: 400 });
    }

    // Check in-memory
    if (!memoryFabrics.some(f => f.toLowerCase() === fabricName.toLowerCase())) {
      memoryFabrics.unshift(fabricName);
    }

    // Try Supabase insert
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('fabrics')
          .insert([{ name: fabricName }])
          .select();
      } catch (dbErr) {
        // Table might not exist, in-memory updated
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fabric "${fabricName}" added successfully!`,
      fabrics: memoryFabrics,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fabricName = searchParams.get('name')?.trim();

    if (!fabricName) {
      return NextResponse.json({ success: false, error: 'Fabric name is required' }, { status: 400 });
    }

    // Remove from in-memory
    memoryFabrics = memoryFabrics.filter(f => f.toLowerCase() !== fabricName.toLowerCase());

    // Try Supabase delete
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('fabrics')
          .delete()
          .ilike('name', fabricName);
      } catch (dbErr) {
        // Table might not exist
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fabric "${fabricName}" removed successfully!`,
      fabrics: memoryFabrics,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT() {
  // Reset to default master list
  memoryFabrics = [...DEFAULT_FABRICS];
  return NextResponse.json({
    success: true,
    message: 'Reset to default fabric list successfully!',
    fabrics: memoryFabrics,
  });
}
