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
