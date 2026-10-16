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

    const isUuid = (str?: string) => Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

    // 1. Resolve walletId ke UUID Supabase
    let targetWalletId = params.walletId;
    const { data: userWallets } = await client.from('wallets').select('*').eq('user_id', userId);

    if (!isUuid(targetWalletId)) {
      const cleanW = (targetWalletId || '').toLowerCase();
      const matchedW =
        userWallets?.find((w) => {
          const wName = w.name.toLowerCase();
          return wName.includes(cleanW) || cleanW.includes(wName) || w.type.toLowerCase() === cleanW;
        }) ||
        userWallets?.find((w) => w.is_default) ||
        userWallets?.[0];

      if (matchedW) {
        targetWalletId = matchedW.id;
      }
    }

    if (!targetWalletId) return null;

    // 2. Resolve categoryId ke UUID Supabase (atau null jika tidak cocok)
    let targetCategoryId: string | null = null;
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

    // 3. Insert ke tabel transactions Supabase
    const { data: newTx, error: txErr } = await client
      .from('transactions')
      .insert({
        user_id: userId,
        wallet_id: targetWalletId,
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

    // 4. Update saldo dompet di Supabase
    const delta = params.type === 'expense' ? -Number(params.amount) : Number(params.amount);
    const updatedWallet = await updateSupabaseWalletBalance(targetWalletId, delta);

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

