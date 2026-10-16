import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  getSupabaseBudgets,
  upsertSupabaseBudget,
  isSupabaseConfigured,
} from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || 'usr-admin-rifki';
  const monthYear = searchParams.get('monthYear') || undefined;

  if (isSupabaseConfigured()) {
    try {
      const sbBudgets = await getSupabaseBudgets(userId, monthYear);
      if (sbBudgets && sbBudgets.length > 0) {
        return NextResponse.json({ ok: true, budgets: sbBudgets, source: 'supabase' });
      }
    } catch (err: any) {
      console.warn('Fallback to local db budgets:', err.message);
    }
  }

  const budgets = db.getBudgets(userId, monthYear);
  return NextResponse.json({ ok: true, budgets, source: 'local' });
}

export async function POST(req: NextRequest) {
  try {
    const { userId, categoryId, monthlyLimit, monthYear } = await req.json();
    const uId = userId || 'usr-admin-rifki';
    const user = db.getUser(uId);

    // Enforcement: Starter max 5 budget categories
    let existingBudgets = db.getBudgets(uId, monthYear);
    if (isSupabaseConfigured()) {
      try {
        const sbB = await getSupabaseBudgets(uId, monthYear);
        if (sbB && sbB.length > 0) existingBudgets = sbB as any;
      } catch (e) {}
    }

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

    if (isSupabaseConfigured()) {
      try {
        const sbBudget = await upsertSupabaseBudget(uId, categoryId, Number(monthlyLimit), monthYear);
        if (sbBudget) {
          return NextResponse.json({ ok: true, budget: sbBudget, source: 'supabase' });
        }
      } catch (sbErr: any) {
        console.warn('Failed to sync budget to Supabase:', sbErr.message);
      }
    }

    return NextResponse.json({ ok: true, budget });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
