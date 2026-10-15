import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || 'usr-budi-01';
  const wallets = db.getWallets(userId);
  return NextResponse.json({ ok: true, wallets });
}

export async function POST(req: NextRequest) {
  try {
    const { userId, name, type, balance, is_default, icon, color } = await req.json();
    const uId = userId || 'usr-budi-01';

    // Enforcement Starter plan: max 3 wallets
    const user = db.getUser(uId);
    const existingWallets = db.getWallets(uId);
    if (user && user.plan === 'starter' && existingWallets.length >= 3) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Paket Starter maksimal memiliki 3 dompet. Upgrade ke Pro untuk dompet tanpa batas!',
        },
        { status: 403 }
      );
    }

    const wallet = db.createWallet(uId, {
      name,
      type: type || 'bank',
      balance: Number(balance) || 0,
      is_default: Boolean(is_default),
      icon: icon || 'wallet',
      color: color || '#10B981',
    });

    return NextResponse.json({ ok: true, wallet });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, updates } = await req.json();
    const updated = db.updateWallet(id, updates);
    return NextResponse.json({ ok: true, wallet: updated });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ ok: false, error: 'ID required' }, { status: 400 });
  const ok = db.deleteWallet(id);
  return NextResponse.json({ ok });
}
