import { NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: false,
      connected: false,
      message: 'Supabase belum dikonfigurasi di file .env.local',
    });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({
      ok: false,
      connected: false,
      message: 'Gagal membuat Supabase client',
    });
  }

  try {
    const [usersRes, walletsRes, categoriesRes, txRes] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('wallets').select('*', { count: 'exact', head: true }),
      supabase.from('categories').select('*', { count: 'exact', head: true }),
      supabase.from('transactions').select('*', { count: 'exact', head: true }),
    ]);

    const hasError = usersRes.error || walletsRes.error || categoriesRes.error || txRes.error;

    if (hasError) {
      return NextResponse.json({
        ok: false,
        connected: false,
        error: usersRes.error?.message || walletsRes.error?.message || categoriesRes.error?.message,
      });
    }

    return NextResponse.json({
      ok: true,
      connected: true,
      project_url: process.env.SUPABASE_URL,
      tables: {
        users_count: usersRes.count ?? 0,
        wallets_count: walletsRes.count ?? 0,
        categories_count: categoriesRes.count ?? 0,
        transactions_count: txRes.count ?? 0,
      },
      message: 'Terhubung aktif ke database Supabase PostgreSQL!',
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        connected: false,
        error: err.message,
      },
      { status: 500 }
    );
  }
}
