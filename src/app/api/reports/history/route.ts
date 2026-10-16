import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'usr-admin-rifki';
    const history = db.getExportHistory(userId);

    return NextResponse.json({
      ok: true,
      history,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
