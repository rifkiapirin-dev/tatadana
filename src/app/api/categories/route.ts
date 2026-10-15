import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || 'usr-budi-01';
  const categories = db.getCategories(userId);
  return NextResponse.json({ ok: true, categories });
}

export async function POST(req: NextRequest) {
  try {
    const { userId, name, type, icon, color } = await req.json();
    const uId = userId || 'usr-budi-01';

    const category = db.createCategory(uId, {
      name,
      type: type || 'expense',
      icon: icon || 'tag',
      color: color || '#10B981',
      is_custom: true,
    });

    return NextResponse.json({ ok: true, category });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ ok: false, error: 'ID required' }, { status: 400 });
  const ok = db.deleteCategory(id);
  return NextResponse.json({ ok });
}
