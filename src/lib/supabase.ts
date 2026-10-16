import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

let cachedClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
      supabaseKey &&
      supabaseUrl.startsWith('https://') &&
      !supabaseUrl.includes('your-project')
  );
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return cachedClient;
}

export const supabase = isSupabaseConfigured() ? getSupabaseClient() : null;

/**
 * Sinkronisasi User baru ke Supabase Auth (auth.users) dan tabel public.users
 */
export async function syncUserToSupabaseAuth(user: {
  id?: string;
  email: string;
  password?: string;
  full_name: string;
  phone_number: string;
  role?: string;
  status?: string;
  plan?: string;
}) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    // 1. Cek apakah user sudah ada di Supabase Auth
    const { data: listData } = await client.auth.admin.listUsers();
    let authUser = listData?.users?.find(
      (u) => u.email?.toLowerCase() === user.email.toLowerCase()
    );

    if (!authUser) {
      const { data: created, error: authErr } = await client.auth.admin.createUser({
        email: user.email,
        password: user.password || '123456789',
        email_confirm: true,
        user_metadata: {
          full_name: user.full_name,
          phone_number: user.phone_number,
          role: user.role || 'user',
          status: user.status || 'pending',
        },
      });

      if (authErr) {
        console.error('[Supabase Auth] Gagal membuat auth user:', authErr.message);
      } else if (created?.user) {
        authUser = created.user;
        console.log('[Supabase Auth] ✅ Berhasil membuat auth user:', user.email, authUser.id);
      }
    }

    // 2. Upsert ke tabel public.users
    const userIdToUse = authUser?.id || user.id;
    const { error: dbErr } = await client.from('users').upsert(
      {
        id: userIdToUse,
        email: user.email,
        phone_number: user.phone_number,
        full_name: user.full_name,
        role: user.role || 'user',
        status: user.status || 'pending',
        plan: user.plan || 'starter',
        currency: 'IDR',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    );

    if (dbErr) {
      console.error('[Supabase DB] Gagal upsert ke public.users:', dbErr.message);
    } else {
      console.log('[Supabase DB] ✅ Berhasil upsert ke public.users:', user.email);
    }

    return { authUser, userId: userIdToUse };
  } catch (err: any) {
    console.error('[Supabase Sync Error]:', err.message);
    return null;
  }
}

/**
 * Sinkronisasi pembaruan status (approved / rejected / pending) ke Supabase
 */
export async function updateUserStatusInSupabase(email: string, status: string) {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    // Update di public.users
    await client
      .from('users')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('email', email);

    // Update metadata di auth.users
    const { data: listData } = await client.auth.admin.listUsers();
    const authUser = listData?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (authUser) {
      await client.auth.admin.updateUserById(authUser.id, {
        user_metadata: {
          ...authUser.user_metadata,
          status,
        },
      });
    }
  } catch (err: any) {
    console.error('[Supabase Update Status Error]:', err.message);
  }
}

/**
 * Hapus user dari Supabase Auth dan public.users
 */
export async function deleteUserInSupabase(email: string) {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('users').delete().eq('email', email);

    const { data: listData } = await client.auth.admin.listUsers();
    const authUser = listData?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (authUser) {
      await client.auth.admin.deleteUser(authUser.id);
    }
  } catch (err: any) {
    console.error('[Supabase Delete User Error]:', err.message);
  }
}

/**
 * Resolves an identifier (UUID, 'usr-admin-rifki', or email) to a Supabase user UUID
 */
export async function resolveSupabaseUserId(userIdOrEmail?: string): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (userIdOrEmail && uuidRegex.test(userIdOrEmail)) {
    return userIdOrEmail;
  }

  try {
    if (!userIdOrEmail || userIdOrEmail === 'usr-admin-rifki' || userIdOrEmail === 'rifkiarifin@gmail.com') {
      const { data } = await client.from('users').select('id').eq('email', 'rifkiarifin@gmail.com').maybeSingle();
      if (data?.id) return data.id;
    }

    if (userIdOrEmail && userIdOrEmail.includes('@')) {
      const { data } = await client.from('users').select('id').eq('email', userIdOrEmail).maybeSingle();
      if (data?.id) return data.id;
    }

    const { data: superadmin } = await client.from('users').select('id').eq('role', 'superadmin').maybeSingle();
    if (superadmin?.id) return superadmin.id;

    const { data: firstUser } = await client.from('users').select('id').limit(1).maybeSingle();
    return firstUser?.id || null;
  } catch (err: any) {
    console.error('[Supabase Resolve User Error]:', err.message);
    return null;
  }
}

/**
 * Ambil daftar dompet pengguna dari Supabase
 */
export async function getSupabaseWallets(userIdOrEmail?: string) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const userId = await resolveSupabaseUserId(userIdOrEmail);
    if (!userId) return null;

    const { data: wallets, error } = await client
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false });

    if (error) {
      console.error('[Supabase Wallets Error]:', error.message);
      return null;
    }

    return wallets || [];
  } catch (err: any) {
    console.error('[Supabase Wallets Catch]:', err.message);
    return null;
  }
}

/**
 * Update saldo dompet di Supabase (+ untuk income/top-up, - untuk expense)
 */
export async function updateSupabaseWalletBalance(walletId: string, amountChange: number) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data: currentWallet, error: fetchErr } = await client
      .from('wallets')
      .select('*')
      .eq('id', walletId)
      .single();

    if (fetchErr || !currentWallet) {
      console.error('[Supabase Wallet Fetch Error]:', fetchErr?.message);
      return null;
    }

    const currentBalance = Number(currentWallet.balance) || 0;
    const newBalance = currentBalance + amountChange;

    const { data: updatedWallet, error: updateErr } = await client
      .from('wallets')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', walletId)
      .select()
      .single();

    if (updateErr) {
      console.error('[Supabase Wallet Update Error]:', updateErr.message);
      return null;
    }

    return updatedWallet;
  } catch (err: any) {
    console.error('[Supabase Wallet Balance Catch]:', err.message);
    return null;
  }
}

/**
 * Catat transaksi langsung ke Supabase dan potong/tambah saldo dompet
 */
export async function createSupabaseTransaction(params: {
  userIdOrEmail?: string;
  walletId: string;
  targetWalletId?: string;
  categoryId?: string;
  type: 'expense' | 'income' | 'transfer';
  amount: number;
  notes?: string;
  source?: string;
  transactionDate?: string;
}) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const userId = await resolveSupabaseUserId(params.userIdOrEmail);
    if (!userId) return null;

    const isUuid = (str?: string) =>
      Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

    // 1. Resolve source walletId ke UUID Supabase
    let sourceWalletId = params.walletId;
    const { data: userWallets } = await client.from('wallets').select('*').eq('user_id', userId);

    if (!isUuid(sourceWalletId)) {
      const cleanW = (sourceWalletId || '').toLowerCase();
      const matchedW =
        userWallets?.find((w) => {
          const wName = w.name.toLowerCase();
          return wName.includes(cleanW) || cleanW.includes(wName) || w.type.toLowerCase() === cleanW;
        }) ||
        userWallets?.find((w) => w.is_default) ||
        userWallets?.[0];

      if (matchedW) {
        sourceWalletId = matchedW.id;
      }
    }

    if (!sourceWalletId) return null;

    // 2. Resolve destination walletId jika transaksi adalah Transfer
    let destinationWalletId: string | null = null;
    if (params.type === 'transfer' && params.targetWalletId) {
      if (isUuid(params.targetWalletId)) {
        destinationWalletId = params.targetWalletId;
      } else {
        const cleanTW = (params.targetWalletId || '').toLowerCase();
        const matchedTW = userWallets?.find((w) => {
          const wName = w.name.toLowerCase();
          return (wName.includes(cleanTW) || cleanTW.includes(wName)) && w.id !== sourceWalletId;
        });
        if (matchedTW) destinationWalletId = matchedTW.id;
      }
    }

    // 3. Resolve categoryId ke UUID Supabase (atau null jika transfer / tidak cocok)
    let targetCategoryId: string | null = null;
    if (params.type !== 'transfer') {
      if (isUuid(params.categoryId)) {
        targetCategoryId = params.categoryId!;
      } else {
        const { data: userCats } = await client.from('categories').select('*').eq('user_id', userId);
        const cleanC = (params.categoryId || '').toLowerCase();
        const matchedC =
          userCats?.find((c) => {
            const cName = c.name.toLowerCase();
            return cName.includes(cleanC) || cleanC.includes(cName) || c.type === params.type;
          }) || userCats?.[0];

        if (matchedC) {
          targetCategoryId = matchedC.id;
        }
      }
    }

    // 4. Insert ke tabel transactions Supabase
    const { data: newTx, error: txErr } = await client
      .from('transactions')
      .insert({
        user_id: userId,
        wallet_id: sourceWalletId,
        target_wallet_id: destinationWalletId,
        category_id: targetCategoryId,
        type: params.type,
        amount: Number(params.amount),
        notes: params.notes || '',
        source: params.source || 'telegram_text',
        transaction_date: params.transactionDate || new Date().toISOString(),
      })
      .select()
      .single();

    if (txErr) {
      console.error('[Supabase Insert Tx Error]:', txErr.message);
    }

    // 5. Update saldo dompet di Supabase
    let updatedWallet = null;
    if (params.type === 'expense') {
      updatedWallet = await updateSupabaseWalletBalance(sourceWalletId, -Number(params.amount));
    } else if (params.type === 'income') {
      updatedWallet = await updateSupabaseWalletBalance(sourceWalletId, Number(params.amount));
    } else if (params.type === 'transfer') {
      updatedWallet = await updateSupabaseWalletBalance(sourceWalletId, -Number(params.amount));
      if (destinationWalletId) {
        await updateSupabaseWalletBalance(destinationWalletId, Number(params.amount));
      }
    }

    return {
      transaction: newTx,
      wallet: updatedWallet,
      new_balance: updatedWallet?.balance,
    };
  } catch (err: any) {
    console.error('[Supabase Create Tx Catch]:', err.message);
    return null;
  }
}

/**
 * Ambil daftar transaksi pengguna dari Supabase
 */
export async function getSupabaseTransactions(userIdOrEmail?: string, limit = 50) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const userId = await resolveSupabaseUserId(userIdOrEmail);
    if (!userId) return null;

    const { data, error } = await client
      .from('transactions')
      .select('*, wallets(*), categories(*)')
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Supabase Get Tx Error]:', error.message);
      return null;
    }

    return (data || []).map((t: any) => ({
      ...t,
      wallet: t.wallets,
      category: t.categories,
    }));
  } catch (err: any) {
    console.error('[Supabase Get Tx Catch]:', err.message);
    return null;
  }
}

/**
 * Hapus transaksi dari Supabase dan kembalikan (reverse) saldo dompet
 */
export async function deleteSupabaseTransaction(transactionId: string) {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    // 1. Ambil data transaksi terlebih dahulu
    const { data: tx, error: fetchErr } = await client
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .maybeSingle();

    if (fetchErr || !tx) {
      console.error('[Supabase Delete Tx] Not found or error:', fetchErr?.message);
      return false;
    }

    // 2. Reverse saldo dompet
    const amount = Number(tx.amount) || 0;
    if (tx.type === 'expense' && tx.wallet_id) {
      // Mengembalikan saldo pengeluaran (+amount)
      await updateSupabaseWalletBalance(tx.wallet_id, amount);
    } else if (tx.type === 'income' && tx.wallet_id) {
      // Mengurangi saldo pemasukan (-amount)
      await updateSupabaseWalletBalance(tx.wallet_id, -amount);
    } else if (tx.type === 'transfer' && tx.wallet_id) {
      // Kembalikan ke dompet asal (+amount) dan kurangi dari dompet tujuan (-amount)
      await updateSupabaseWalletBalance(tx.wallet_id, amount);
      if (tx.target_wallet_id) {
        await updateSupabaseWalletBalance(tx.target_wallet_id, -amount);
      }
    }

    // 3. Hapus transaksi dari database
    const { error: delErr } = await client.from('transactions').delete().eq('id', transactionId);
    if (delErr) {
      console.error('[Supabase Delete Tx] Error:', delErr.message);
      return false;
    }

    return true;
  } catch (err: any) {
    console.error('[Supabase Delete Tx Catch]:', err.message);
    return false;
  }
}

/**
 * Ambil data user dari Supabase (berdasarkan email atau nomor HP)
 */
export async function getSupabaseUser(emailOrPhone: string) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    let query = client.from('users').select('*');
    if (emailOrPhone.includes('@')) {
      query = query.ilike('email', emailOrPhone.trim());
    } else {
      query = query.eq('phone_number', emailOrPhone.trim());
    }

    const { data, error } = await query.maybeSingle();
    if (error || !data) return null;
    return data;
  } catch (err: any) {
    console.error('[Supabase Get User Catch]:', err.message);
    return null;
  }
}

/**
 * Perbarui profil user di Supabase (public.users)
 */
export async function updateSupabaseUserProfile(
  userIdOrEmail: string,
  updates: { full_name?: string; currency?: string; avatar_url?: string }
) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const userId = await resolveSupabaseUserId(userIdOrEmail);
    if (!userId) return null;

    const { data, error } = await client
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('[Supabase Update Profile Error]:', error.message);
      return null;
    }

    return data;
  } catch (err: any) {
    console.error('[Supabase Update Profile Catch]:', err.message);
    return null;
  }
}

/**
 * Buat dompet baru di Supabase
 */
export async function createSupabaseWallet(
  userIdOrEmail: string,
  walletData: {
    name: string;
    type: string;
    balance: number;
    is_default?: boolean;
    icon?: string;
    color?: string;
  }
) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const userId = await resolveSupabaseUserId(userIdOrEmail);
    if (!userId) return null;

    if (walletData.is_default) {
      // Set dompet lainnya jadi non-default
      await client.from('wallets').update({ is_default: false }).eq('user_id', userId);
    }

    const { data, error } = await client
      .from('wallets')
      .insert({
        user_id: userId,
        name: walletData.name,
        type: walletData.type || 'bank',
        balance: Number(walletData.balance) || 0,
        is_default: Boolean(walletData.is_default),
        icon: walletData.icon || 'wallet',
        color: walletData.color || '#10B981',
      })
      .select()
      .single();

    if (error) {
      console.error('[Supabase Create Wallet Error]:', error.message);
      return null;
    }

    return data;
  } catch (err: any) {
    console.error('[Supabase Create Wallet Catch]:', err.message);
    return null;
  }
}

/**
 * Perbarui dompet di Supabase
 */
export async function updateSupabaseWallet(walletId: string, updates: any) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    if (updates.is_default) {
      // Ambil user_id dompet ini terlebih dahulu
      const { data: w } = await client.from('wallets').select('user_id').eq('id', walletId).single();
      if (w?.user_id) {
        await client.from('wallets').update({ is_default: false }).eq('user_id', w.user_id);
      }
    }

    const { data, error } = await client
      .from('wallets')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', walletId)
      .select()
      .single();

    if (error) {
      console.error('[Supabase Update Wallet Error]:', error.message);
      return null;
    }

    return data;
  } catch (err: any) {
    console.error('[Supabase Update Wallet Catch]:', err.message);
    return null;
  }
}

/**
 * Hapus dompet di Supabase
 */
export async function deleteSupabaseWallet(walletId: string) {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('wallets').delete().eq('id', walletId);
    if (error) {
      console.error('[Supabase Delete Wallet Error]:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error('[Supabase Delete Wallet Catch]:', err.message);
    return false;
  }
}

/**
 * Ambil daftar kategori dari Supabase
 */
export async function getSupabaseCategories(userIdOrEmail?: string) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const userId = await resolveSupabaseUserId(userIdOrEmail);
    if (!userId) return null;

    const { data, error } = await client
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) {
      console.error('[Supabase Get Categories Error]:', error.message);
      return null;
    }

    return data || [];
  } catch (err: any) {
    console.error('[Supabase Get Categories Catch]:', err.message);
    return null;
  }
}

/**
 * Buat kategori baru di Supabase
 */
export async function createSupabaseCategory(
  userIdOrEmail: string,
  catData: { name: string; type: string; icon?: string; color?: string; is_custom?: boolean }
) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const userId = await resolveSupabaseUserId(userIdOrEmail);
    if (!userId) return null;

    const { data, error } = await client
      .from('categories')
      .insert({
        user_id: userId,
        name: catData.name,
        type: catData.type,
        icon: catData.icon || 'tag',
        color: catData.color || '#10B981',
        is_custom: catData.is_custom !== undefined ? catData.is_custom : true,
      })
      .select()
      .single();

    if (error) {
      console.error('[Supabase Create Category Error]:', error.message);
      return null;
    }

    return data;
  } catch (err: any) {
    console.error('[Supabase Create Category Catch]:', err.message);
    return null;
  }
}

/**
 * Hapus kategori di Supabase
 */
export async function deleteSupabaseCategory(categoryId: string) {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('categories').delete().eq('id', categoryId);
    if (error) {
      console.error('[Supabase Delete Category Error]:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error('[Supabase Delete Category Catch]:', err.message);
    return false;
  }
}

/**
 * Ambil daftar budget dari Supabase dengan perhitungan current_spent dari tabel transactions
 */
export async function getSupabaseBudgets(userIdOrEmail?: string, monthYear?: string) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const userId = await resolveSupabaseUserId(userIdOrEmail);
    if (!userId) return null;

    const targetMonth = monthYear || new Date().toISOString().slice(0, 7);

    // Ambil budgets
    const { data: budgets, error: bErr } = await client
      .from('budgets')
      .select('*, categories(*)')
      .eq('user_id', userId)
      .eq('month_year', targetMonth);

    if (bErr) {
      console.error('[Supabase Get Budgets Error]:', bErr.message);
      return null;
    }

    if (!budgets || budgets.length === 0) return [];

    // Ambil total pengeluaran per kategori untuk bulan ini
    const startIso = `${targetMonth}-01T00:00:00+07:00`;
    const endIso = `${targetMonth}-31T23:59:59+07:00`;

    const { data: monthTxs } = await client
      .from('transactions')
      .select('category_id, amount')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('transaction_date', startIso)
      .lte('transaction_date', endIso);

    const spentMap: Record<string, number> = {};
    (monthTxs || []).forEach((t: any) => {
      if (t.category_id) {
        spentMap[t.category_id] = (spentMap[t.category_id] || 0) + Number(t.amount);
      }
    });

    return budgets.map((b: any) => ({
      ...b,
      category: b.categories,
      current_spent: spentMap[b.category_id] || 0,
    }));
  } catch (err: any) {
    console.error('[Supabase Get Budgets Catch]:', err.message);
    return null;
  }
}

/**
 * Buat atau update budget di Supabase
 */
export async function upsertSupabaseBudget(
  userIdOrEmail: string,
  categoryId: string,
  monthlyLimit: number,
  monthYear?: string
) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const userId = await resolveSupabaseUserId(userIdOrEmail);
    if (!userId) return null;

    const targetMonth = monthYear || new Date().toISOString().slice(0, 7);

    const { data, error } = await client
      .from('budgets')
      .upsert(
        {
          user_id: userId,
          category_id: categoryId,
          monthly_limit: Number(monthlyLimit),
          month_year: targetMonth,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id, category_id, month_year' }
      )
      .select('*, categories(*)')
      .single();

    if (error) {
      console.error('[Supabase Upsert Budget Error]:', error.message);
      return null;
    }

    return {
      ...data,
      category: data.categories,
    };
  } catch (err: any) {
    console.error('[Supabase Upsert Budget Catch]:', err.message);
    return null;
  }
}

