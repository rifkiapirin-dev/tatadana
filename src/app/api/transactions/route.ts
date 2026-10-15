import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || 'usr-budi-01';
  const type = searchParams.get('type') as any;
  const categoryId = searchParams.get('categoryId') || undefined;
  const walletId = searchParams.get('walletId') || undefined;
  const search = searchParams.get('search') || undefined;
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;

  const txs = db.getTransactions(userId, {
    type,
    categoryId,
    walletId,
    search,
    startDate,
    endDate,
  });

  return NextResponse.json({ ok: true, transactions: txs });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, walletId, targetWalletId, categoryId, type, amount, notes, transactionDate, receiptItems } = body;
    const uId = userId || 'usr-budi-01';

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
