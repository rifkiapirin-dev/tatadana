import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseTransactionWithAI } from '@/lib/ai-engine';

export async function POST(req: NextRequest) {
  try {
    const { text, userId } = await req.json();
    if (!text) {
      return NextResponse.json({ ok: false, error: 'Text required' }, { status: 400 });
    }

    const uId = userId || 'usr-budi-01';
    const categories = db.getCategories(uId);
    const parsed = await parseTransactionWithAI(text, categories, uId);

    return NextResponse.json({ ok: true, parsed });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
