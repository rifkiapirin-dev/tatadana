import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || 'usr-admin-rifki';
  const reminder = db.getReminder(userId);
  return NextResponse.json({ ok: true, reminder });
}

export async function POST(req: NextRequest) {
  try {
    const { userId, is_active, frequency, time_1, time_2 } = await req.json();
    const uId = userId || 'usr-admin-rifki';

    // Enforcement: maksimal 2x sehari sesuai kebijakan produk Part 3 & 4.8
    const safeFreq = frequency === 2 ? 2 : 1;

    const reminder = db.updateReminder(uId, {
      is_active: Boolean(is_active),
      frequency: safeFreq,
      time_1: time_1 || '09:00',
      time_2: time_2 || '20:00',
    });

    return NextResponse.json({
      ok: true,
      reminder,
      preview: `⏰ Reminder Keuangan!\nJangan lupa catat pengeluaran hari ini ya 📝\nPencatatan rutin = keuangan lebih terkontrol 💪\nKetik transaksimu sekarang!`,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
