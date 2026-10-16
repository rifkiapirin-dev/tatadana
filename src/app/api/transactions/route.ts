import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  getSupabaseTransactions,
  createSupabaseTransaction,
  isSupabaseConfigured,
} from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || 'usr-admin-rifki';
  const type = searchParams.get('type') as any;
  const categoryId = searchParams.get('categoryId') || undefined;
  const walletId = searchParams.get('walletId') || undefined;
  const search = searchParams.get('search') || undefined;
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;

  if (isSupabaseConfigured()) {
    try {
      const sbTxs = await getSupabaseTransactions(userId);
      if (sbTxs && sbTxs.length > 0) {
        let filtered = sbTxs;
        if (type) filtered = filtered.filter((t: any) => t.type === type);
        if (walletId) filtered = filtered.filter((t: any) => t.wallet_id === walletId);
        if (categoryId) filtered = filtered.filter((t: any) => t.category_id === categoryId);
        if (search) {
          const s = search.toLowerCase();
          filtered = filtered.filter((t: any) => (t.notes || '').toLowerCase().includes(s));
        }
        return NextResponse.json({ ok: true, transactions: filtered, source: 'supabase' });
      }
    } catch (err: any) {
      console.warn('Fallback to local db txs:', err.message);
    }
  }

  const txs = db.getTransactions(userId, {
    type,
    categoryId,
    walletId,
    search,
    startDate,
    endDate,
  });

  return NextResponse.json({ ok: true, transactions: txs, source: 'local' });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, walletId, targetWalletId, categoryId, type, amount, notes, transactionDate, receiptItems } = body;
    const uId = userId || 'usr-admin-rifki';

    // Enforcement Starter plan limit
    const user = db.getUser(uId);
    if (user && user.plan === 'starter' && user.monthly_txn_count >= 50) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Batas 50 transaksi bulanan untuk akun Starter telah tercapai. Silakan upgrade ke paket Pro!',
        },
        { status: 403 }
      );
    }

    // 1. Simpan ke local DB cache
    const tx = db.createTransaction(
      uId,
      {
        wallet_id: walletId,
        target_wallet_id: targetWalletId,
        category_id: categoryId,
        type: type || 'expense',
        amount: Number(amount),
        notes: notes || '',
        source: 'web',
        is_ocr: Boolean(receiptItems && receiptItems.length > 0),
        transaction_date: transactionDate || new Date().toISOString(),
      },
      receiptItems
    );

    // 2. Simpan juga ke Supabase
    if (isSupabaseConfigured()) {
      try {
        await createSupabaseTransaction({
          userIdOrEmail: uId,
          walletId,
          categoryId,
          type: type || 'expense',
          amount: Number(amount),
          notes,
          source: 'web',
          transactionDate,
        });
      } catch (sbErr: any) {
        console.error('Failed to sync transaction to Supabase:', sbErr.message);
      }
    }

    return NextResponse.json({ ok: true, transaction: tx });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ ok: false, error: 'ID required' }, { status: 400 });

  const success = db.deleteTransaction(id);
  return NextResponse.json({ ok: success });
}
