-- ========================================================
-- TataDana: Database Schema DDL & Initial Seed Data
-- File: supabase/migrations/20261013000000_init_tatadana.sql
-- Description: Skema lengkap PostgreSQL + Supabase untuk TataDana
-- Timezone default: Asia/Jakarta (WIB)
-- ========================================================

-- 0. Pastikan UUID & pgcrypto extension aktif
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tabel Users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    phone_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro')),
    monthly_txn_count INT NOT NULL DEFAULT 0,
    last_reset_month TEXT NOT NULL DEFAULT TO_CHAR(NOW() AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM'),
    currency TEXT NOT NULL DEFAULT 'IDR',
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
    status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    password TEXT DEFAULT '123456789',
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 2. Tabel Wallets (Multi Wallet)
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'ewallet', 'investment')),
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    icon TEXT NOT NULL DEFAULT 'wallet',
    color TEXT NOT NULL DEFAULT '#10B981',
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 3. Tabel Categories (Kategori Transaksi)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT NOT NULL DEFAULT 'tag',
    color TEXT NOT NULL DEFAULT '#10B981',
    is_custom BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 4. Tabel Budgets (Budget per Kategori bulanan)
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    monthly_limit NUMERIC(15, 2) NOT NULL,
    month_year TEXT NOT NULL, -- Format: YYYY-MM
    alert_80_sent BOOLEAN NOT NULL DEFAULT FALSE,
    alert_100_sent BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    CONSTRAINT unique_user_category_month UNIQUE (user_id, category_id, month_year)
);

-- 5. Tabel Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
    target_wallet_id UUID REFERENCES public.wallets(id) ON DELETE RESTRICT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
    amount NUMERIC(15, 2) NOT NULL,
    notes TEXT,
    source TEXT NOT NULL DEFAULT 'web' CHECK (source IN ('web', 'telegram_text', 'telegram_photo', 'telegram_voice')),
    raw_receipt_url TEXT,
    is_ocr BOOLEAN NOT NULL DEFAULT FALSE,
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 6. Tabel Receipt Items (Detail per item dari foto struk)
CREATE TABLE IF NOT EXISTS public.receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price NUMERIC(15, 2) NOT NULL,
    subtotal NUMERIC(15, 2) NOT NULL,
    category_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 7. Tabel Telegram Links & Bot Connection
CREATE TABLE IF NOT EXISTS public.telegram_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    telegram_user_id BIGINT UNIQUE,
    telegram_username TEXT,
    phone_number TEXT,
    bot_token TEXT,
    is_connected BOOLEAN NOT NULL DEFAULT FALSE,
    webhook_url TEXT,
    linking_code TEXT UNIQUE,
    linked_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 8. Tabel Idempotency Telegram Webhook (Cegah Transaksi Dobel)
CREATE TABLE IF NOT EXISTS public.processed_telegram_updates (
    update_id BIGINT PRIMARY KEY,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 9. Tabel Daily Reminders (Maksimal 2x per hari)
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    frequency INT NOT NULL DEFAULT 1 CHECK (frequency IN (1, 2)),
    time_1 TIME NOT NULL DEFAULT '09:00:00',
    time_2 TIME NOT NULL DEFAULT '20:00:00',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 10. Tabel Konfigurasi AI Provider (Kelola multi-provider Gemini/OpenAI/DeepSeek)
CREATE TABLE IF NOT EXISTS public.ai_provider_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name TEXT NOT NULL UNIQUE CHECK (provider_name IN ('gemini', 'openai', 'deepseek')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    api_key_encrypted TEXT,
    model_name TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'single' CHECK (mode IN ('single', 'parallel_failover')),
    priority INT NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 11. Tabel Log Pemanggilan AI (Biaya, Latensi, Status)
CREATE TABLE IF NOT EXISTS public.ai_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    input_type TEXT NOT NULL CHECK (input_type IN ('text', 'photo', 'voice')),
    prompt_tokens INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,
    total_tokens INT DEFAULT 0,
    latency_ms INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'fallback')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 12. Tabel Riwayat Export Laporan (PDF / Excel)
CREATE TABLE IF NOT EXISTS public.export_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'xlsx')),
    date_range TEXT NOT NULL,
    download_url TEXT NOT NULL,
    file_size_bytes INT NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 13. Tabel Payments (Midtrans & Manual Transfer)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    order_id TEXT NOT NULL UNIQUE,
    plan TEXT NOT NULL CHECK (plan IN ('starter', 'pro')),
    amount NUMERIC(15, 2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('midtrans', 'manual_transfer')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'failed')),
    proof_image_url TEXT,
    approved_by_admin_id UUID REFERENCES public.users(id),
    midtrans_transaction_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 14. Tabel Audit Log Admin (Privasi & Keamanan Akses Transaksi User)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.users(id),
    target_user_id UUID REFERENCES public.users(id),
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- INDEXES untuk performa query realtime
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON public.transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_receipt_items_tx ON public.receipt_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON public.budgets(user_id, month_year);
CREATE INDEX IF NOT EXISTS idx_ai_logs_user ON public.ai_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id, status);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Default policies (User hanya bisa membaca dan mengubah datanya sendiri)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public users access" ON public.users;
    CREATE POLICY "Public users access" ON public.users FOR ALL USING (true);

    DROP POLICY IF EXISTS "Public wallets access" ON public.wallets;
    CREATE POLICY "Public wallets access" ON public.wallets FOR ALL USING (true);

    DROP POLICY IF EXISTS "Public categories access" ON public.categories;
    CREATE POLICY "Public categories access" ON public.categories FOR ALL USING (true);

    DROP POLICY IF EXISTS "Public budgets access" ON public.budgets;
    CREATE POLICY "Public budgets access" ON public.budgets FOR ALL USING (true);

    DROP POLICY IF EXISTS "Public transactions access" ON public.transactions;
    CREATE POLICY "Public transactions access" ON public.transactions FOR ALL USING (true);

    DROP POLICY IF EXISTS "Public receipt_items access" ON public.receipt_items;
    CREATE POLICY "Public receipt_items access" ON public.receipt_items FOR ALL USING (true);

    DROP POLICY IF EXISTS "Public telegram_links access" ON public.telegram_links;
    CREATE POLICY "Public telegram_links access" ON public.telegram_links FOR ALL USING (true);

    DROP POLICY IF EXISTS "Public reminders access" ON public.reminders;
    CREATE POLICY "Public reminders access" ON public.reminders FOR ALL USING (true);

    DROP POLICY IF EXISTS "Public export_history access" ON public.export_history;
    CREATE POLICY "Public export_history access" ON public.export_history FOR ALL USING (true);

    DROP POLICY IF EXISTS "Public payments access" ON public.payments;
    CREATE POLICY "Public payments access" ON public.payments FOR ALL USING (true);

    DROP POLICY IF EXISTS "Public audit_logs access" ON public.audit_logs;
    CREATE POLICY "Public audit_logs access" ON public.audit_logs FOR ALL USING (true);
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- ========================================================
-- SEED DATA AWAL: AKUN SUPER ADMIN RIFKI ARIFIN
-- ========================================================
DO $$
DECLARE
    admin_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
    bca_id UUID := '00000000-0000-0000-0000-000000000002'::UUID;
    mandiri_id UUID := '00000000-0000-0000-0000-000000000003'::UUID;
    gopay_id UUID := '00000000-0000-0000-0000-000000000004'::UUID;
    cash_id UUID := '00000000-0000-0000-0000-000000000005'::UUID;
BEGIN
    -- 1. Insert Akun Super Admin jika belum ada
    INSERT INTO public.users (
        id, email, phone_number, full_name, plan, role, status, password, currency, monthly_txn_count
    ) VALUES (
        admin_id,
        'rifkiarifin@gmail.com',
        '081234567899',
        'Rifki Arifin (Admin)',
        'pro',
        'superadmin',
        'approved',
        '123456789',
        'IDR',
        5
    )
    ON CONFLICT (email) DO UPDATE SET
        role = 'superadmin',
        status = 'approved',
        password = '123456789';

    -- 2. Insert Wallets Default Admin
    INSERT INTO public.wallets (id, user_id, name, type, balance, is_default, icon, color)
    VALUES
        (bca_id, admin_id, 'BCA Utama', 'bank', 14230000, true, 'credit-card', '#10B981'),
        (mandiri_id, admin_id, 'Mandiri Tabungan', 'bank', 6500000, false, 'landmark', '#0284c7'),
        (gopay_id, admin_id, 'GoPay', 'ewallet', 420000, false, 'smartphone', '#06b6d4'),
        (cash_id, admin_id, 'Uang Tunai / Dompet', 'cash', 850000, false, 'wallet', '#84cc16')
    ON CONFLICT (id) DO NOTHING;

    -- 3. Insert Kategori Transaksi
    INSERT INTO public.categories (user_id, name, type, icon, color)
    VALUES
        (admin_id, '🍜 Makanan & Minuman', 'expense', 'utensils', '#f97316'),
        (admin_id, '🚗 Transportasi', 'expense', 'car', '#06b6d4'),
        (admin_id, '🛍️ Belanja Kebutuhan', 'expense', 'shopping-bag', '#8b5cf6'),
        (admin_id, '🏠 Tagihan & Listrik', 'expense', 'home', '#ef4444'),
        (admin_id, '🎮 Hiburan & Liburan', 'expense', 'gamepad-2', '#ec4899'),
        (admin_id, '💊 Kesehatan', 'expense', 'heart-pulse', '#10b981'),
        (admin_id, '💼 Gaji Bulanan', 'income', 'briefcase', '#10b981'),
        (admin_id, '💰 Bonus & Freelance', 'income', 'coins', '#0284c7')
    ON CONFLICT DO NOTHING;

    -- 4. Insert Pengaturan Reminder
    INSERT INTO public.reminders (user_id, is_active, frequency, time_1, time_2)
    VALUES (admin_id, true, 2, '09:00:00', '20:00:00')
    ON CONFLICT (user_id) DO NOTHING;

    -- 5. Insert Konfigurasi Default AI Provider
    INSERT INTO public.ai_provider_configs (provider_name, is_active, is_default, model_name, mode, priority)
    VALUES
        ('gemini', true, true, 'gemini-2.5-flash', 'single', 1),
        ('openai', false, false, 'gpt-4o-mini', 'single', 2),
        ('deepseek', false, false, 'deepseek-chat', 'single', 3)
    ON CONFLICT (provider_name) DO NOTHING;
END $$;
