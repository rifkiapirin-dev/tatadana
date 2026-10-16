import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  getSupabaseWallets,
  createSupabaseWallet,
  updateSupabaseWallet,
  deleteSupabaseWallet,
  isSupabaseConfigured,
} from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || 'usr-admin-rifki';

  if (isSupabaseConfigured()) {
    try {
      const sbWallets = await getSupabaseWallets(userId);
      if (sbWallets && sbWallets.length > 0) {
        return NextResponse.json({ ok: true, wallets: sbWallets, source: 'supabase' });
      }
    } catch (err: any) {
      console.warn('Fallback to local db wallets:', err.message);
    }
  }

  const wallets = db.getWallets(userId);
  return NextResponse.json({ ok: true, wallets, source: 'local' });
}

export async function POST(req: NextRequest) {
  try {
    const { userId, name, type, balance, is_default, icon, color } = await req.json();
    const uId = userId || 'usr-admin-rifki';

    // Enforcement Starter plan: max 3 wallets
    const user = db.getUser(uId);
    let existingWallets = db.getWallets(uId);
    if (isSupabaseConfigured()) {
      try {
        const sbWallets = await getSupabaseWallets(uId);
        if (sbWallets && sbWallets.length > 0) existingWallets = sbWallets as any;
      } catch (e) {}
    }

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

    if (isSupabaseConfigured()) {
      try {
        const sbWallet = await createSupabaseWallet(uId, {
          name,
          type: type || 'bank',
          balance: Number(balance) || 0,
          is_default: Boolean(is_default),
          icon: icon || 'wallet',
          color: color || '#10B981',
        });
        if (sbWallet) {
          return NextResponse.json({ ok: true, wallet: sbWallet, source: 'supabase' });
        }
      } catch (sbErr: any) {
        console.warn('Failed to sync new wallet to Supabase:', sbErr.message);
      }
    }

    return NextResponse.json({ ok: true, wallet });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, updates } = await req.json();
    const updated = db.updateWallet(id, updates);

    if (isSupabaseConfigured()) {
      try {
        await updateSupabaseWallet(id, updates);
      } catch (sbErr: any) {
        console.warn('Failed to sync wallet update to Supabase:', sbErr.message);
      }
    }

    return NextResponse.json({ ok: true, wallet: updated });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ ok: false, error: 'ID required' }, { status: 400 });

  let ok = db.deleteWallet(id);

  if (isSupabaseConfigured()) {
    try {
      const sbDeleted = await deleteSupabaseWallet(id);
      if (sbDeleted) ok = true;
    } catch (e: any) {
      console.warn('Failed to delete wallet from Supabase:', e.message);
    }
  }

  return NextResponse.json({ ok });
}
