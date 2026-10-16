import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { updateSupabaseUserProfile, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, full_name, currency, avatar_url } = body;
    const uId = userId || 'usr-admin-rifki';

    const updates: any = {};
    if (full_name) updates.full_name = full_name;
    if (currency) updates.currency = currency;
    if (avatar_url) updates.avatar_url = avatar_url;

    const updatedUser = db.updateUser(uId, updates);
    if (!updatedUser) {
      return NextResponse.json({ ok: false, error: 'User tidak ditemukan' }, { status: 404 });
    }

    if (isSupabaseConfigured()) {
      try {
        await updateSupabaseUserProfile(uId, updates);
      } catch (sbErr: any) {
        console.warn('Failed to sync profile update to Supabase:', sbErr.message);
      }
    }

    return NextResponse.json({
      ok: true,
      user: updatedUser,
      message: 'Profil berhasil diperbarui!',
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
