import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'tatadana-store.json');

const currentMonth = '2026-10';
const adminId = 'usr-admin-rifki';

const cleanData = {
  users: [
    {
      id: adminId,
      email: 'rifkiarifin@gmail.com',
      phone_number: '081234567899',
      full_name: 'Rifki Arifin (Admin)',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      plan: 'pro',
      monthly_txn_count: 5,
      last_reset_month: currentMonth,
      currency: 'IDR',
      role: 'superadmin',
      status: 'approved',
      created_at: '2026-01-01T00:00:00+07:00',
      updated_at: new Date().toISOString(),
    },
  ],
  wallets: [
    {
      id: 'wal-bca',
      user_id: adminId,
      name: 'BCA Utama',
      type: 'bank',
      balance: 14250000,
      is_default: true,
      icon: 'credit-card',
      color: '#10B981',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'wal-mandiri',
      user_id: adminId,
      name: 'Mandiri Tabungan',
      type: 'bank',
      balance: 6500000,
      is_default: false,
      icon: 'landmark',
      color: '#0284c7',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'wal-gopay',
      user_id: adminId,
      name: 'GoPay',
      type: 'ewallet',
      balance: 420000,
      is_default: false,
      icon: 'smartphone',
      color: '#06b6d4',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'wal-cash',
      user_id: adminId,
      name: 'Uang Tunai / Dompet',
      type: 'cash',
      balance: 750000,
      is_default: false,
      icon: 'wallet',
      color: '#f59e0b',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  categories: [
    { id: 'cat-makan', user_id: adminId, name: '🍜 Makanan & Minuman', type: 'expense', icon: 'utensils', color: '#f97316', is_custom: false, created_at: new Date().toISOString() },
    { id: 'cat-trans', user_id: adminId, name: '🚗 Transportasi', type: 'expense', icon: 'car', color: '#3b82f6', is_custom: false, created_at: new Date().toISOString() },
    { id: 'cat-hiburan', user_id: adminId, name: '🎮 Hiburan & Hobi', type: 'expense', icon: 'gamepad-2', color: '#ec4899', is_custom: false, created_at: new Date().toISOString() },
    { id: 'cat-tagihan', user_id: adminId, name: '🏠 Tagihan & Utilitas', type: 'expense', icon: 'home', color: '#ef4444', is_custom: false, created_at: new Date().toISOString() },
    { id: 'cat-sehat', user_id: adminId, name: '💊 Kesehatan', type: 'expense', icon: 'heart-pulse', color: '#14b8a6', is_custom: false, created_at: new Date().toISOString() },
    { id: 'cat-belanja', user_id: adminId, name: '👕 Belanja Kebutuhan', type: 'expense', icon: 'shopping-bag', color: '#8b5cf6', is_custom: false, created_at: new Date().toISOString() },
    { id: 'cat-gaji', user_id: adminId, name: '💼 Gaji Bulanan', type: 'income', icon: 'briefcase', color: '#10b981', is_custom: false, created_at: new Date().toISOString() },
    { id: 'cat-freelance', user_id: adminId, name: '💰 Freelance & Bonus', type: 'income', icon: 'coins', color: '#059669', is_custom: false, created_at: new Date().toISOString() },
  ],
  budgets: [
    { id: 'bg-makan', user_id: adminId, category_id: 'cat-makan', monthly_limit: 3000000, month_year: currentMonth, alert_80_sent: true, alert_100_sent: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'bg-trans', user_id: adminId, category_id: 'cat-trans', monthly_limit: 1200000, month_year: currentMonth, alert_80_sent: false, alert_100_sent: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'bg-tagihan', user_id: adminId, category_id: 'cat-tagihan', monthly_limit: 1500000, month_year: currentMonth, alert_80_sent: true, alert_100_sent: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],
  transactions: [
    {
      id: 'tx-gaji-01',
      user_id: adminId,
      wallet_id: 'wal-bca',
      category_id: 'cat-gaji',
      type: 'income',
      amount: 15000000,
      notes: 'Gaji Bulanan Masuk',
      source: 'web',
      is_ocr: false,
      transaction_date: `${currentMonth}-01T08:00:00+07:00`,
      created_at: `${currentMonth}-01T08:00:00+07:00`,
    },
    {
      id: 'tx-listrik-01',
      user_id: adminId,
      wallet_id: 'wal-bca',
      category_id: 'cat-tagihan',
      type: 'expense',
      amount: 850000,
      notes: 'Token Listrik PLN & Tagihan Air',
      source: 'telegram_text',
      is_ocr: false,
      transaction_date: `${currentMonth}-02T19:30:00+07:00`,
      created_at: `${currentMonth}-02T19:30:00+07:00`,
    },
    {
      id: 'tx-makan-01',
      user_id: adminId,
      wallet_id: 'wal-gopay',
      category_id: 'cat-makan',
      type: 'expense',
      amount: 35000,
      notes: 'Nasi Padang Spesial',
      source: 'telegram_text',
      is_ocr: false,
      transaction_date: `${currentMonth}-10T12:30:00+07:00`,
      created_at: `${currentMonth}-10T12:30:00+07:00`,
    },
  ],
  receipt_items: [],
  telegram_links: [
    {
      id: 'tg-link-rifki',
      user_id: adminId,
      telegram_user_id: 123456789,
      telegram_username: 'rifki_admin',
      phone_number: '081234567899',
      bot_token: 'demo_tatadana_bot_token',
      is_connected: true,
      webhook_url: 'http://localhost:3000/api/telegram/webhook',
      linking_code: 'TATA-7788',
      linked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  reminders: [
    {
      id: 'rem-admin',
      user_id: adminId,
      is_active: true,
      frequency: 2,
      time_1: '09:00',
      time_2: '20:00',
      updated_at: new Date().toISOString(),
    },
  ],
  ai_configs: [
    {
      id: 'ai-cfg-gemini',
      provider_name: 'gemini',
      is_active: true,
      is_default: true,
      model_name: 'gemini-2.5-flash',
      mode: 'single',
      priority: 1,
      api_key_encrypted: 'AIzaSy...EncryptedGeminiKey',
      updated_at: new Date().toISOString(),
    },
    {
      id: 'ai-cfg-openai',
      provider_name: 'openai',
      is_active: true,
      is_default: false,
      model_name: 'gpt-4o-mini',
      mode: 'parallel_failover',
      priority: 2,
      api_key_encrypted: 'sk-proj-...EncryptedOpenAIKey',
      updated_at: new Date().toISOString(),
    },
  ],
  ai_logs: [],
  export_history: [],
  payments: [],
  audit_logs: [
    {
      id: 'adt-init',
      admin_id: adminId,
      target_user_id: adminId,
      action: 'SYSTEM_INITIALIZATION',
      details: 'Sistem di-reset menyisakan akun khusus Admin Rifki Arifin (Superadmin)',
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString(),
    },
  ],
  processed_updates: [],
  pending_confirmations: {},
};

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

fs.writeFileSync(DB_FILE, JSON.stringify(cleanData, null, 2), 'utf-8');
console.log('✅ DATABASE RESET BERHASIL: Menyisakan HANYA akun Super Admin Rifki Arifin!');
console.log('Users count:', cleanData.users.length);
console.log('User list:', cleanData.users.map(u => `${u.full_name} (${u.email}) - ${u.role}`).join(', '));
