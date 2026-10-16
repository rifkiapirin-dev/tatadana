import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  getSupabaseCategories,
  createSupabaseCategory,
  deleteSupabaseCategory,
  isSupabaseConfigured,
} from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || 'usr-admin-rifki';

  if (isSupabaseConfigured()) {
    try {
      const sbCats = await getSupabaseCategories(userId);
      if (sbCats && sbCats.length > 0) {
        return NextResponse.json({ ok: true, categories: sbCats, source: 'supabase' });
      }
    } catch (err: any) {
      console.warn('Fallback to local db categories:', err.message);
    }
  }

  const categories = db.getCategories(userId);
  return NextResponse.json({ ok: true, categories, source: 'local' });
}

export async function POST(req: NextRequest) {
  try {
    const { userId, name, type, icon, color } = await req.json();
    const uId = userId || 'usr-admin-rifki';

    const category = db.createCategory(uId, {
      name,
      type: type || 'expense',
      icon: icon || 'tag',
      color: color || '#10B981',
      is_custom: true,
    });

    if (isSupabaseConfigured()) {
      try {
        const sbCat = await createSupabaseCategory(uId, {
          name,
          type: type || 'expense',
          icon: icon || 'tag',
          color: color || '#10B981',
          is_custom: true,
        });
        if (sbCat) {
          return NextResponse.json({ ok: true, category: sbCat, source: 'supabase' });
        }
      } catch (sbErr: any) {
        console.warn('Failed to sync new category to Supabase:', sbErr.message);
      }
    }

    return NextResponse.json({ ok: true, category });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ ok: false, error: 'ID required' }, { status: 400 });

  let ok = db.deleteCategory(id);

  if (isSupabaseConfigured()) {
    try {
      const sbDeleted = await deleteSupabaseCategory(id);
      if (sbDeleted) ok = true;
    } catch (e: any) {
      console.warn('Failed to delete category from Supabase:', e.message);
    }
  }

  return NextResponse.json({ ok });
}
