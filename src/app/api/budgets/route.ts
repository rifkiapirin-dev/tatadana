import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || 'usr-budi-01';
  const monthYear = searchParams.get('monthYear') || undefined;

  const budgets = db.getBudgets(userId, monthYear);
  return NextResponse.json({ ok: true, budgets });
}

export async function POST(req: NextRequest) {
  try {
    const { userId, categoryId, monthlyLimit, monthYear } = await req.json();
    const uId = userId || 'usr-budi-01';
    const user = db.getUser(uId);

    // Enforcement: Starter max 5 budget categories
    const existingBudgets = db.getBudgets(uId, monthYear);
    const isExisting = existingBudgets.some((b) => b.category_id === categoryId);

    if (user && user.plan === 'starter' && !isExisting && existingBudgets.length >= 5) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Paket Starter maksimal memiliki 5 kategori budget. Upgrade ke Pro untuk budget tanpa batas!',
        },
        { status: 403 }
      );
    }

    const budget = db.createOrUpdateBudget(uId, categoryId, Number(monthlyLimit), monthYear);
    return NextResponse.json({ ok: true, budget });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
