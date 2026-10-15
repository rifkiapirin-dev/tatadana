import fs from 'fs';
import path from 'path';
import {
  User,
  UserRole,
  UserStatus,
  PendingTransactionConfirmation,
  Wallet,
  Category,
  Budget,
  Transaction,
  ReceiptItem,
  TelegramLink,
  DailyReminder,
  AiProviderConfig,
  AiLog,
  ExportHistory,
  Payment,
  AuditLog,
} from '@/types';

interface DatabaseSchema {
  users: User[];
  wallets: Wallet[];
  categories: Category[];
  budgets: Budget[];
  transactions: Transaction[];
  receipt_items: ReceiptItem[];
  telegram_links: TelegramLink[];
  reminders: DailyReminder[];
  ai_configs: AiProviderConfig[];
  ai_logs: AiLog[];
  export_history: ExportHistory[];
  payments: Payment[];
  audit_logs: AuditLog[];
  processed_updates: number[];
  pending_confirmations?: Record<string, PendingTransactionConfirmation>;
}

const DATA_DIR =
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
    ? path.join('/tmp', '.data')
    : path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'tatadana-store.json');

function getCurrentMonthYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getInitialData(): DatabaseSchema {
  const currentMonth = getCurrentMonthYear();
  const user1Id = 'usr-admin-rifki';

  const defaultCategories: Category[] = [
    { id: 'cat-makan', user_id: user1Id, name: '🍜 Makanan & Minuman', type: 'expense', icon: 'utensils', color: '#f97316', is_custom: false, created_at: new Date().toISOString() },
    { id: 'cat-trans', user_id: user1Id, name: '🚗 Transportasi', type: 'expense', icon: 'car', color: '#3b82f6', is_custom: false, created_at: new Date().toISOString() },
    { id: 'cat-hiburan', user_id: user1Id, name: '🎮 Hiburan & Hobi', type: 'expense', icon: 'gamepad-2', color: '#ec4899', is_custom: false, created_at: new Date().toISOString() },
    { id: 'cat-tagihan', user_id: user1Id, name: '🏠 Tagihan & Utilitas', type: 'expense', icon: 'home', color: '#ef4444', is_custom: false, created_at: new Date().toISOString() },
    { id: 'cat-sehat', user_id: user1Id, name: '💊 Kesehatan', type: 'expense', icon: 'heart-pulse', color: '#14b8a6', is_custom: false, created_at: new Date().toISOString() },
    { id: 'cat-belanja', user_id: user1Id, name: '👕 Belanja Kebutuhan', type: 'expense', icon: 'shopping-bag', color: '#8b5cf6', is_custom: false, created_at: new Date().toISOString() },
    { id: 'cat-gaji', user_id: user1Id, name: '💼 Gaji Bulanan', type: 'income', icon: 'briefcase', color: '#10b981', is_custom: false, created_at: new Date().toISOString() },
    { id: 'cat-freelance', user_id: user1Id, name: '💰 Freelance & Bonus', type: 'income', icon: 'coins', color: '#059669', is_custom: false, created_at: new Date().toISOString() },
  ];

  const defaultWallets: Wallet[] = [
    { id: 'wal-bca', user_id: user1Id, name: 'BCA Utama', type: 'bank', balance: 14250000, is_default: true, icon: 'credit-card', color: '#10B981', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'wal-mandiri', user_id: user1Id, name: 'Mandiri Tabungan', type: 'bank', balance: 6500000, is_default: false, icon: 'landmark', color: '#0284c7', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'wal-gopay', user_id: user1Id, name: 'GoPay', type: 'ewallet', balance: 420000, is_default: false, icon: 'smartphone', color: '#06b6d4', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'wal-cash', user_id: user1Id, name: 'Uang Tunai / Dompet', type: 'cash', balance: 750000, is_default: false, icon: 'wallet', color: '#f59e0b', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ];

  const defaultBudgets: Budget[] = [
    { id: 'bg-makan', user_id: user1Id, category_id: 'cat-makan', monthly_limit: 3000000, month_year: currentMonth, alert_80_sent: true, alert_100_sent: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'bg-trans', user_id: user1Id, category_id: 'cat-trans', monthly_limit: 1200000, month_year: currentMonth, alert_80_sent: false, alert_100_sent: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'bg-hiburan', user_id: user1Id, category_id: 'cat-hiburan', monthly_limit: 800000, month_year: currentMonth, alert_80_sent: false, alert_100_sent: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'bg-tagihan', user_id: user1Id, category_id: 'cat-tagihan', monthly_limit: 1500000, month_year: currentMonth, alert_80_sent: true, alert_100_sent: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'bg-belanja', user_id: user1Id, category_id: 'cat-belanja', monthly_limit: 1000000, month_year: currentMonth, alert_80_sent: false, alert_100_sent: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ];

  // Base transactions
  const tx1Id = 'tx-indomaret-01';
  const initialTransactions: Transaction[] = [
    {
      id: 'tx-gaji-01',
      user_id: user1Id,
      wallet_id: 'wal-bca',
      category_id: 'cat-gaji',
      type: 'income',
      amount: 15000000,
      notes: 'Gaji Bulanan PT Maju Bersama',
      source: 'web',
      is_ocr: false,
      transaction_date: `${currentMonth}-01T08:00:00+07:00`,
      created_at: `${currentMonth}-01T08:00:00+07:00`,
    },
    {
      id: 'tx-tagihan-listrik',
      user_id: user1Id,
      wallet_id: 'wal-bca',
      category_id: 'cat-tagihan',
      type: 'expense',
      amount: 850000,
      notes: 'Token Listrik PLN & Air PAM',
      source: 'telegram_text',
      is_ocr: false,
      transaction_date: `${currentMonth}-02T19:30:00+07:00`,
      created_at: `${currentMonth}-02T19:30:00+07:00`,
    },
    {
      id: 'tx-tagihan-wifi',
      user_id: user1Id,
      wallet_id: 'wal-bca',
      category_id: 'cat-tagihan',
      type: 'expense',
      amount: 650000,
      notes: 'Tagihan Indihome & Netflix',
      source: 'telegram_text',
      is_ocr: false,
      transaction_date: `${currentMonth}-05T14:15:00+07:00`,
      created_at: `${currentMonth}-05T14:15:00+07:00`,
    },
    {
      id: tx1Id,
      user_id: user1Id,
      wallet_id: 'wal-bca',
      category_id: 'cat-belanja',
      type: 'expense',
      amount: 75000,
      notes: 'Belanja Kebutuhan Harian di Indomaret Point',
      source: 'telegram_photo',
      is_ocr: true,
      raw_receipt_url: 'https://images.unsplash.com/photo-1554415707-9e4466a014c8?auto=format&fit=crop&w=400&q=80',
      transaction_date: `${currentMonth}-08T16:20:00+07:00`,
      created_at: `${currentMonth}-08T16:20:00+07:00`,
    },
    {
      id: 'tx-bakso-01',
      user_id: user1Id,
      wallet_id: 'wal-gopay',
      category_id: 'cat-makan',
      type: 'expense',
      amount: 35000,
      notes: 'Bakso Malang Cak Man & Es Teh',
      source: 'telegram_text',
      is_ocr: false,
      transaction_date: `${currentMonth}-09T12:45:00+07:00`,
      created_at: `${currentMonth}-09T12:45:00+07:00`,
    },
    {
      id: 'tx-kopi-01',
      user_id: user1Id,
      wallet_id: 'wal-gopay',
      category_id: 'cat-makan',
      type: 'expense',
      amount: 28000,
      notes: 'Kopi Kenangan Mantan Large',
      source: 'telegram_voice',
      is_ocr: false,
      transaction_date: `${currentMonth}-10T10:15:00+07:00`,
      created_at: `${currentMonth}-10T10:15:00+07:00`,
    },
    {
      id: 'tx-bbm-01',
      user_id: user1Id,
      wallet_id: 'wal-bca',
      category_id: 'cat-trans',
      type: 'expense',
      amount: 250000,
      notes: 'Pertamax Full Tank Mobil',
      source: 'telegram_text',
      is_ocr: false,
      transaction_date: `${currentMonth}-11T07:30:00+07:00`,
      created_at: `${currentMonth}-11T07:30:00+07:00`,
    },
    {
      id: 'tx-makan-resto',
      user_id: user1Id,
      wallet_id: 'wal-bca',
      category_id: 'cat-makan',
      type: 'expense',
      amount: 2387000,
      notes: 'Dinner Keluarga Akhir Pekan Seafood',
      source: 'web',
      is_ocr: false,
      transaction_date: `${currentMonth}-12T20:00:00+07:00`,
      created_at: `${currentMonth}-12T20:00:00+07:00`,
    },
  ];

  const defaultReceiptItems: ReceiptItem[] = [
    { id: 'rc-item-1', transaction_id: tx1Id, item_name: 'Sari Roti Gandum Kupas', quantity: 1, price: 16500, subtotal: 16500, category_name: 'Makanan', created_at: new Date().toISOString() },
    { id: 'rc-item-2', transaction_id: tx1Id, item_name: 'Ultra Milk Plain 1000ml', quantity: 1, price: 22000, subtotal: 22000, category_name: 'Minuman', created_at: new Date().toISOString() },
    { id: 'rc-item-3', transaction_id: tx1Id, item_name: 'Nescafe Can Original 240ml', quantity: 1, price: 9500, subtotal: 9500, category_name: 'Minuman', created_at: new Date().toISOString() },
    { id: 'rc-item-4', transaction_id: tx1Id, item_name: 'Attack Plus Softener 800g', quantity: 1, price: 27000, subtotal: 27000, category_name: 'Kebutuhan Rumah', created_at: new Date().toISOString() },
  ];

  return {
    users: [
      {
        id: 'usr-admin-rifki',
        email: 'rifkiarifin@gmail.com',
        phone_number: '083851284143',
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
    wallets: defaultWallets,
    categories: defaultCategories,
    budgets: defaultBudgets,
    transactions: initialTransactions,
    receipt_items: defaultReceiptItems,
    telegram_links: [
      {
        id: 'tg-link-01',
        user_id: user1Id,
        telegram_user_id: 123456789,
        telegram_username: 'budisantoso_id',
        phone_number: '081234567890',
        bot_token: '8802532938:AAHbCUmP5JGZELyU6ifl6pVQAeZ_lfMV_zk',
        is_connected: true,
        webhook_url: 'http://localhost:3000/api/telegram/webhook',
        linking_code: 'TATA-8892',
        linked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    reminders: [
      {
        id: 'rem-01',
        user_id: user1Id,
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
      {
        id: 'ai-cfg-deepseek',
        provider_name: 'deepseek',
        is_active: false,
        is_default: false,
        model_name: 'deepseek-chat',
        mode: 'parallel_failover',
        priority: 3,
        api_key_encrypted: 'sk-...EncryptedDeepSeekKey',
        updated_at: new Date().toISOString(),
      },
    ],
    ai_logs: [
      {
        id: 'log-01',
        user_id: user1Id,
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        input_type: 'text',
        prompt_tokens: 42,
        completion_tokens: 38,
        total_tokens: 80,
        latency_ms: 312,
        status: 'success',
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'log-02',
        user_id: user1Id,
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        input_type: 'photo',
        prompt_tokens: 280,
        completion_tokens: 145,
        total_tokens: 425,
        latency_ms: 1150,
        status: 'success',
        created_at: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 'log-03',
        user_id: user1Id,
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        input_type: 'voice',
        prompt_tokens: 95,
        completion_tokens: 44,
        total_tokens: 139,
        latency_ms: 680,
        status: 'success',
        created_at: new Date(Date.now() - 14400000).toISOString(),
      },
    ],
    export_history: [
      {
        id: 'exp-01',
        user_id: user1Id,
        file_name: 'Laporan-TataDana-Okt-2026.pdf',
        file_type: 'pdf',
        date_range: '01 Okt 2026 - 13 Okt 2026',
        download_url: '/api/reports/download?id=exp-01',
        file_size_bytes: 142800,
        expires_at: new Date(Date.now() + 86400000 * 7).toISOString(),
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
    payments: [
      {
        id: 'pay-01',
        user_id: user1Id,
        order_id: 'ORDER-TATA-77491',
        plan: 'pro',
        amount: 99000,
        payment_method: 'midtrans',
        status: 'approved',
        midtrans_transaction_id: 'mid-trx-99128',
        created_at: '2026-02-01T10:00:00+07:00',
        updated_at: '2026-02-01T10:05:00+07:00',
      },
      {
        id: 'pay-02',
        user_id: user1Id,
        order_id: 'ORDER-TATA-88129',
        plan: 'pro',
        amount: 99000,
        payment_method: 'manual_transfer',
        status: 'pending',
        proof_image_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80',
        notes: 'Transfer via BCA atas nama Rifki Arifin',
        created_at: new Date(Date.now() - 1800000).toISOString(),
        updated_at: new Date(Date.now() - 1800000).toISOString(),
      },
    ],
    audit_logs: [
      {
        id: 'adt-01',
        admin_id: 'usr-admin-rifki',
        target_user_id: user1Id,
        action: 'VIEW_USER_TRANSACTIONS',
        details: 'Admin membuka daftar transaksi user untuk verifikasi',
        ip_address: '127.0.0.1',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
    processed_updates: [],
    pending_confirmations: {},
  };
}

class DatabaseEngine {
  private inMemoryCache: DatabaseSchema | null = null;

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private read(): DatabaseSchema {
    if (this.inMemoryCache) {
      return this.inMemoryCache;
    }

    this.ensureDirectory();
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.inMemoryCache = JSON.parse(raw);
        // Pastikan setiap user memiliki status & role
        if (this.inMemoryCache && this.inMemoryCache.users) {
          let hasMod = false;
          this.inMemoryCache.users.forEach((u) => {
            if (!u.status) {
              u.status = 'approved';
              hasMod = true;
            }
            if (!u.role) {
              u.role = u.id.includes('admin') ? 'superadmin' : 'user';
              hasMod = true;
            }
          });

          // Pastikan akun khusus Admin rifkiarifin@gmail.com selalu tersedia
          const hasRifki = this.inMemoryCache.users.some((u) => u.email === 'rifkiarifin@gmail.com');
          if (!hasRifki) {
            const currentMonth = getCurrentMonthYear();
            this.inMemoryCache.users.unshift({
              id: 'usr-admin-rifki',
              email: 'rifkiarifin@gmail.com',
              phone_number: '083851284143',
              full_name: 'Rifki Arifin (Admin)',
              avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
              plan: 'pro',
              monthly_txn_count: 0,
              last_reset_month: currentMonth,
              currency: 'IDR',
              role: 'superadmin',
              status: 'approved',
              created_at: '2026-01-01T00:00:00+07:00',
              updated_at: new Date().toISOString(),
            });
            hasMod = true;
          }

          if (!this.inMemoryCache.pending_confirmations) {
            this.inMemoryCache.pending_confirmations = {};
            hasMod = true;
          }
          if (hasMod) {
            this.write(this.inMemoryCache);
          }
        }
        return this.inMemoryCache!;
      } catch (e) {
        console.error('Error reading db file, regenerating defaults:', e);
      }
    }

    const initial = getInitialData();
    this.write(initial);
    this.inMemoryCache = initial;
    return initial;
  }

  private write(data: DatabaseSchema): void {
    this.ensureDirectory();
    this.inMemoryCache = data;
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing db file:', e);
    }
  }

  // --- USERS ---
  getUsers(): User[] {
    return this.read().users;
  }

  getRegularUsers(): User[] {
    return this.read().users.filter((u) => u.role === 'user');
  }

  getAdminUsers(): User[] {
    return this.read().users.filter((u) => u.role === 'admin' || u.role === 'superadmin');
  }

  getPendingUsers(): User[] {
    return this.read().users.filter((u) => u.status === 'pending');
  }

  getUser(id: string): User | undefined {
    return this.read().users.find((u) => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    const clean = email.toLowerCase().trim();
    return this.read().users.find((u) => u.email.toLowerCase().trim() === clean);
  }

  getUserByPhone(phone: string): User | undefined {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return this.read().users.find((u) => u.phone_number.replace(/[^0-9]/g, '') === cleanPhone);
  }

  createUser(
    userData: {
      email: string;
      phone_number: string;
      full_name: string;
      plan?: 'starter' | 'pro';
      role?: UserRole;
      status?: UserStatus;
      avatar_url?: string;
    },
    adminId?: string
  ): User {
    const data = this.read();
    const currentMonth = getCurrentMonthYear();
    const newId = `usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const role: UserRole = userData.role || 'user';
    const status: UserStatus = userData.status || 'pending';

    const newUser: User = {
      id: newId,
      email: userData.email,
      phone_number: userData.phone_number,
      full_name: userData.full_name,
      avatar_url:
        userData.avatar_url ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      plan: userData.plan || 'starter',
      monthly_txn_count: 0,
      last_reset_month: currentMonth,
      currency: 'IDR',
      role,
      status,
      password: (userData as any).password || '123456789',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    data.users.unshift(newUser);

    // Setup initial default wallets & categories for the user
    const defaultWallets: Wallet[] = [
      {
        id: `wal-bca-${newId}`,
        user_id: newId,
        name: 'BCA Utama',
        type: 'bank',
        balance: 1000000,
        is_default: true,
        icon: 'credit-card',
        color: '#10B981',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: `wal-gopay-${newId}`,
        user_id: newId,
        name: 'GoPay',
        type: 'ewallet',
        balance: 200000,
        is_default: false,
        icon: 'smartphone',
        color: '#06b6d4',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: `wal-cash-${newId}`,
        user_id: newId,
        name: 'Uang Tunai',
        type: 'cash',
        balance: 300000,
        is_default: false,
        icon: 'wallet',
        color: '#f59e0b',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    data.wallets.push(...defaultWallets);

    const defaultCats: Category[] = [
      {
        id: `cat-makan-${newId}`,
        user_id: newId,
        name: '🍜 Makanan & Minuman',
        type: 'expense',
        icon: 'utensils',
        color: '#f97316',
        is_custom: false,
        created_at: new Date().toISOString(),
      },
      {
        id: `cat-trans-${newId}`,
        user_id: newId,
        name: '🚗 Transportasi',
        type: 'expense',
        icon: 'car',
        color: '#3b82f6',
        is_custom: false,
        created_at: new Date().toISOString(),
      },
      {
        id: `cat-tagihan-${newId}`,
        user_id: newId,
        name: '🏠 Tagihan & Utilitas',
        type: 'expense',
        icon: 'home',
        color: '#ef4444',
        is_custom: false,
        created_at: new Date().toISOString(),
      },
      {
        id: `cat-gaji-${newId}`,
        user_id: newId,
        name: '💼 Gaji & Pemasukan',
        type: 'income',
        icon: 'briefcase',
        color: '#10b981',
        is_custom: false,
        created_at: new Date().toISOString(),
      },
    ];
    data.categories.push(...defaultCats);

    const randCode = `TATA-${Math.floor(1000 + Math.random() * 9000)}`;
    data.telegram_links.push({
      id: `tg-${newId}`,
      user_id: newId,
      phone_number: userData.phone_number,
      is_connected: false,
      linking_code: randCode,
      updated_at: new Date().toISOString(),
    });

    if (adminId) {
      data.audit_logs.unshift({
        id: `adt-${Date.now()}`,
        admin_id: adminId,
        target_user_id: newId,
        action: 'CREATE_USER',
        details: `Admin membuat akun pengguna baru ${newUser.full_name} (${newUser.email}) - Role: ${newUser.role}, Status: ${newUser.status}`,
        ip_address: '127.0.0.1',
        created_at: new Date().toISOString(),
      });
    }

    this.write(data);
    return newUser;
  }

  approveUser(userId: string, adminId = 'usr-admin-00'): User | undefined {
    const data = this.read();
    const idx = data.users.findIndex((u) => u.id === userId);
    if (idx === -1) return undefined;

    data.users[idx] = {
      ...data.users[idx],
      status: 'approved',
      rejection_reason: undefined,
      updated_at: new Date().toISOString(),
    };

    data.audit_logs.unshift({
      id: `adt-${Date.now()}`,
      admin_id: adminId,
      target_user_id: userId,
      action: 'APPROVE_USER_REGISTRATION',
      details: `Admin menyetujui pendaftaran user ${data.users[idx].full_name} (${data.users[idx].email})`,
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString(),
    });

    this.write(data);
    return data.users[idx];
  }

  rejectUser(
    userId: string,
    adminId = 'usr-admin-00',
    reason = 'Data pendaftaran belum memenuhi syarat verifikasi atau kuota penuh'
  ): User | undefined {
    const data = this.read();
    const idx = data.users.findIndex((u) => u.id === userId);
    if (idx === -1) return undefined;

    data.users[idx] = {
      ...data.users[idx],
      status: 'rejected',
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    };

    data.audit_logs.unshift({
      id: `adt-${Date.now()}`,
      admin_id: adminId,
      target_user_id: userId,
      action: 'REJECT_USER_REGISTRATION',
      details: `Admin menolak pendaftaran user ${data.users[idx].full_name}. Alasan: ${reason}`,
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString(),
    });

    this.write(data);
    return data.users[idx];
  }

  setUserRole(userId: string, role: UserRole, adminId = 'usr-admin-00'): User | undefined {
    const data = this.read();
    const idx = data.users.findIndex((u) => u.id === userId);
    if (idx === -1) return undefined;

    const oldRole = data.users[idx].role;
    data.users[idx] = {
      ...data.users[idx],
      role,
      updated_at: new Date().toISOString(),
    };

    data.audit_logs.unshift({
      id: `adt-${Date.now()}`,
      admin_id: adminId,
      target_user_id: userId,
      action: 'CHANGE_USER_ROLE',
      details: `Admin mengubah hak akses role user ${data.users[idx].full_name} dari ${oldRole} menjadi ${role}`,
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString(),
    });

    this.write(data);
    return data.users[idx];
  }

  deleteUser(userId: string, adminId = 'usr-admin-00'): boolean {
    const data = this.read();
    const idx = data.users.findIndex((u) => u.id === userId);
    if (idx === -1) return false;

    const u = data.users[idx];
    data.users.splice(idx, 1);
    data.wallets = data.wallets.filter((w) => w.user_id !== userId);
    data.transactions = data.transactions.filter((t) => t.user_id !== userId);
    data.categories = data.categories.filter((c) => c.user_id !== userId);
    data.budgets = data.budgets.filter((b) => b.user_id !== userId);

    data.audit_logs.unshift({
      id: `adt-${Date.now()}`,
      admin_id: adminId,
      target_user_id: userId,
      action: 'DELETE_USER',
      details: `Admin menghapus user ${u.full_name} (${u.email})`,
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString(),
    });

    this.write(data);
    return true;
  }

  // --- PENDING CONFIRMATIONS (Interactive Wallet Selection) ---
  setPendingConfirmation(key: string, conf: PendingTransactionConfirmation): void {
    const data = this.read();
    if (!data.pending_confirmations) data.pending_confirmations = {};
    data.pending_confirmations[key] = conf;
    this.write(data);
  }

  getPendingConfirmation(key: string): PendingTransactionConfirmation | undefined {
    const data = this.read();
    return data.pending_confirmations?.[key];
  }

  clearPendingConfirmation(key: string): void {
    const data = this.read();
    if (data.pending_confirmations && data.pending_confirmations[key]) {
      delete data.pending_confirmations[key];
      this.write(data);
    }
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const data = this.read();
    const idx = data.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    data.users[idx] = { ...data.users[idx], ...updates, updated_at: new Date().toISOString() };
    this.write(data);
    return data.users[idx];
  }

  incrementMonthlyTxnCount(userId: string): number {
    const user = this.getUser(userId);
    if (!user) return 0;
    const currentMonth = getCurrentMonthYear();
    let currentCount = user.monthly_txn_count;
    if (user.last_reset_month !== currentMonth) {
      currentCount = 0;
      this.updateUser(userId, { last_reset_month: currentMonth, monthly_txn_count: 1 });
      return 1;
    }
    const newCount = currentCount + 1;
    this.updateUser(userId, { monthly_txn_count: newCount });
    return newCount;
  }

  // --- WALLETS ---
  getWallets(userId: string): Wallet[] {
    return this.read().wallets.filter((w) => w.user_id === userId);
  }

  getWallet(id: string): Wallet | undefined {
    return this.read().wallets.find((w) => w.id === id);
  }

  getDefaultWallet(userId: string): Wallet | undefined {
    const wallets = this.getWallets(userId);
    return wallets.find((w) => w.is_default) || wallets[0];
  }

  findWalletByNameOrAlias(userId: string, query: string): Wallet | undefined {
    if (!query) return undefined;
    const wallets = this.getWallets(userId);
    const q = query.toLowerCase().trim();

    // Direct match by name
    let found = wallets.find(
      (w) => w.name.toLowerCase().includes(q) || q.includes(w.name.toLowerCase())
    );
    if (found) return found;

    // Alias mapping
    if (/gopay|go-pay/i.test(q)) {
      found = wallets.find((w) => /gopay|go-pay/i.test(w.name));
    } else if (/\bovo\b/i.test(q)) {
      found = wallets.find((w) => /\bovo\b/i.test(w.name));
    } else if (/\bdana\b/i.test(q)) {
      found = wallets.find((w) => /\bdana\b/i.test(w.name));
    } else if (/shopeepay|shopee\s*pay/i.test(q)) {
      found = wallets.find((w) => /shopeepay|shopee/i.test(w.name));
    } else if (/\bbca\b/i.test(q)) {
      found = wallets.find((w) => /\bbca\b/i.test(w.name));
    } else if (/mandiri/i.test(q)) {
      found = wallets.find((w) => /mandiri/i.test(w.name));
    } else if (/\bbri\b/i.test(q)) {
      found = wallets.find((w) => /\bbri\b/i.test(w.name));
    } else if (/\bbni\b/i.test(q)) {
      found = wallets.find((w) => /\bbni\b/i.test(w.name));
    } else if (/jago/i.test(q)) {
      found = wallets.find((w) => /jago/i.test(w.name));
    } else if (/cash|tunai|uang\s*tunai|dompet/i.test(q)) {
      found = wallets.find((w) => /cash|tunai|dompet/i.test(w.name));
    }

    return found;
  }

  createWallet(userId: string, walletData: Omit<Wallet, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Wallet {
    const data = this.read();
    if (walletData.is_default) {
      data.wallets.forEach((w) => {
        if (w.user_id === userId) w.is_default = false;
      });
    }
    const newWallet: Wallet = {
      id: `wal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      ...walletData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    data.wallets.push(newWallet);
    this.write(data);
    return newWallet;
  }

  updateWallet(id: string, updates: Partial<Wallet>): Wallet | undefined {
    const data = this.read();
    const idx = data.wallets.findIndex((w) => w.id === id);
    if (idx === -1) return undefined;
    if (updates.is_default) {
      const uId = data.wallets[idx].user_id;
      data.wallets.forEach((w) => {
        if (w.user_id === uId) w.is_default = false;
      });
    }
    data.wallets[idx] = { ...data.wallets[idx], ...updates, updated_at: new Date().toISOString() };
    this.write(data);
    return data.wallets[idx];
  }

  deleteWallet(id: string): boolean {
    const data = this.read();
    const idx = data.wallets.findIndex((w) => w.id === id);
    if (idx === -1) return false;
    data.wallets.splice(idx, 1);
    this.write(data);
    return true;
  }

  // --- CATEGORIES ---
  getCategories(userId: string): Category[] {
    return this.read().categories.filter((c) => c.user_id === userId);
  }

  getCategory(id: string): Category | undefined {
    return this.read().categories.find((c) => c.id === id);
  }

  createCategory(userId: string, catData: Omit<Category, 'id' | 'user_id' | 'created_at'>): Category {
    const data = this.read();
    const newCat: Category = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      ...catData,
      created_at: new Date().toISOString(),
    };
    data.categories.push(newCat);
    this.write(data);
    return newCat;
  }

  updateCategory(id: string, updates: Partial<Category>): Category | undefined {
    const data = this.read();
    const idx = data.categories.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    data.categories[idx] = { ...data.categories[idx], ...updates };
    this.write(data);
    return data.categories[idx];
  }

  deleteCategory(id: string): boolean {
    const data = this.read();
    const idx = data.categories.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    data.categories.splice(idx, 1);
    this.write(data);
    return true;
  }

  // --- BUDGETS ---
  getBudgets(userId: string, monthYear?: string): Budget[] {
    const m = monthYear || getCurrentMonthYear();
    const data = this.read();
    const budgets = data.budgets.filter((b) => b.user_id === userId && b.month_year === m);
    const categories = this.getCategories(userId);

    // Calculate current spent per category
    const txs = this.getTransactions(userId, { monthYear: m, type: 'expense' });

    return budgets.map((b) => {
      const cat = categories.find((c) => c.id === b.category_id);
      const spent = txs
        .filter((t) => t.category_id === b.category_id)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      return {
        ...b,
        category: cat,
        current_spent: spent,
      };
    });
  }

  createOrUpdateBudget(userId: string, categoryId: string, limit: number, monthYear?: string): Budget {
    const m = monthYear || getCurrentMonthYear();
    const data = this.read();
    const idx = data.budgets.findIndex((b) => b.user_id === userId && b.category_id === categoryId && b.month_year === m);

    if (idx >= 0) {
      data.budgets[idx].monthly_limit = limit;
      data.budgets[idx].updated_at = new Date().toISOString();
      this.write(data);
      return data.budgets[idx];
    } else {
      const newBudget: Budget = {
        id: `bg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        user_id: userId,
        category_id: categoryId,
        monthly_limit: limit,
        month_year: m,
        alert_80_sent: false,
        alert_100_sent: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      data.budgets.push(newBudget);
      this.write(data);
      return newBudget;
    }
  }

  // --- TRANSACTIONS ---
  getTransactions(
    userId: string,
    filters?: {
      monthYear?: string;
      startDate?: string;
      endDate?: string;
      type?: 'expense' | 'income' | 'transfer';
      categoryId?: string;
      walletId?: string;
      search?: string;
    }
  ): Transaction[] {
    const data = this.read();
    let txs = data.transactions.filter((t) => t.user_id === userId);

    if (filters?.monthYear) {
      txs = txs.filter((t) => t.transaction_date.startsWith(filters.monthYear!));
    }
    if (filters?.startDate) {
      txs = txs.filter((t) => new Date(t.transaction_date) >= new Date(filters.startDate!));
    }
    if (filters?.endDate) {
      txs = txs.filter((t) => new Date(t.transaction_date) <= new Date(filters.endDate! + 'T23:59:59'));
    }
    if (filters?.type) {
      txs = txs.filter((t) => t.type === filters.type);
    }
    if (filters?.categoryId) {
      txs = txs.filter((t) => t.category_id === filters.categoryId);
    }
    if (filters?.walletId) {
      txs = txs.filter((t) => t.wallet_id === filters.walletId || t.target_wallet_id === filters.walletId);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      txs = txs.filter((t) => (t.notes || '').toLowerCase().includes(q));
    }

    // Enrich with wallets, category, receipt_items
    const wallets = data.wallets;
    const categories = data.categories;
    const receiptItems = data.receipt_items;

    return txs
      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
      .map((t) => ({
        ...t,
        wallet: wallets.find((w) => w.id === t.wallet_id),
        target_wallet: t.target_wallet_id ? wallets.find((w) => w.id === t.target_wallet_id) : undefined,
        category: categories.find((c) => c.id === t.category_id),
        receipt_items: receiptItems.filter((ri) => ri.transaction_id === t.id),
      }));
  }

  createTransaction(
    userId: string,
    txData: Omit<Transaction, 'id' | 'user_id' | 'created_at'>,
    receiptItems?: Omit<ReceiptItem, 'id' | 'transaction_id' | 'created_at'>[]
  ): Transaction {
    const data = this.read();
    const newTxId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newTx: Transaction = {
      id: newTxId,
      user_id: userId,
      ...txData,
      created_at: new Date().toISOString(),
    };

    // Update wallet balances
    const sourceWallet = data.wallets.find((w) => w.id === txData.wallet_id);
    if (sourceWallet) {
      if (txData.type === 'expense') {
        sourceWallet.balance -= Number(txData.amount);
      } else if (txData.type === 'income') {
        sourceWallet.balance += Number(txData.amount);
      } else if (txData.type === 'transfer' && txData.target_wallet_id) {
        sourceWallet.balance -= Number(txData.amount);
        const targetWallet = data.wallets.find((w) => w.id === txData.target_wallet_id);
        if (targetWallet) {
          targetWallet.balance += Number(txData.amount);
        }
      }
      sourceWallet.updated_at = new Date().toISOString();
    }

    data.transactions.push(newTx);

    // If receipt items provided
    if (receiptItems && receiptItems.length > 0) {
      receiptItems.forEach((ri) => {
        data.receipt_items.push({
          id: `ri-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          transaction_id: newTxId,
          ...ri,
          created_at: new Date().toISOString(),
        });
      });
    }

    this.write(data);
    this.incrementMonthlyTxnCount(userId);

    return {
      ...newTx,
      wallet: sourceWallet,
      category: data.categories.find((c) => c.id === newTx.category_id),
      receipt_items: data.receipt_items.filter((ri) => ri.transaction_id === newTxId),
    };
  }

  deleteTransaction(id: string): boolean {
    const data = this.read();
    const idx = data.transactions.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    const tx = data.transactions[idx];

    // Revert wallet balance
    const wallet = data.wallets.find((w) => w.id === tx.wallet_id);
    if (wallet) {
      if (tx.type === 'expense') {
        wallet.balance += Number(tx.amount);
      } else if (tx.type === 'income') {
        wallet.balance -= Number(tx.amount);
      } else if (tx.type === 'transfer' && tx.target_wallet_id) {
        wallet.balance += Number(tx.amount);
        const targetWallet = data.wallets.find((w) => w.id === tx.target_wallet_id);
        if (targetWallet) targetWallet.balance -= Number(tx.amount);
      }
    }

    data.transactions.splice(idx, 1);
    data.receipt_items = data.receipt_items.filter((ri) => ri.transaction_id !== id);
    this.write(data);
    return true;
  }

  // --- TELEGRAM IDEMPOTENCY & LINK ---
  isTelegramUpdateProcessed(updateId: number): boolean {
    const data = this.read();
    return data.processed_updates.includes(updateId);
  }

  markTelegramUpdateProcessed(updateId: number): void {
    const data = this.read();
    if (!data.processed_updates.includes(updateId)) {
      data.processed_updates.push(updateId);
      // Keep only last 1000 IDs to avoid unbounded growth
      if (data.processed_updates.length > 1000) {
        data.processed_updates = data.processed_updates.slice(-1000);
      }
      this.write(data);
    }
  }

  getTelegramLink(userId: string): TelegramLink | undefined {
    return this.read().telegram_links.find((tl) => tl.user_id === userId);
  }

  getTelegramLinkByTgId(tgUserId: number): TelegramLink | undefined {
    return this.read().telegram_links.find((tl) => tl.telegram_user_id === tgUserId);
  }

  getTelegramLinkByCode(code: string): TelegramLink | undefined {
    return this.read().telegram_links.find((tl) => tl.linking_code === code);
  }

  updateTelegramLink(userId: string, updates: Partial<TelegramLink>): TelegramLink {
    const data = this.read();
    const idx = data.telegram_links.findIndex((tl) => tl.user_id === userId);
    if (idx >= 0) {
      data.telegram_links[idx] = {
        ...data.telegram_links[idx],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      this.write(data);
      return data.telegram_links[idx];
    } else {
      const newLink: TelegramLink = {
        id: `tgl-${Date.now()}`,
        user_id: userId,
        is_connected: false,
        linking_code: `TATA-${Math.floor(1000 + Math.random() * 9000)}`,
        updated_at: new Date().toISOString(),
        ...updates,
      };
      data.telegram_links.push(newLink);
      this.write(data);
      return newLink;
    }
  }

  // --- REMINDERS ---
  getReminder(userId: string): DailyReminder {
    const data = this.read();
    const rem = data.reminders.find((r) => r.user_id === userId);
    if (rem) return rem;
    const newRem: DailyReminder = {
      id: `rem-${Date.now()}`,
      user_id: userId,
      is_active: true,
      frequency: 1,
      time_1: '09:00',
      time_2: '20:00',
      updated_at: new Date().toISOString(),
    };
    data.reminders.push(newRem);
    this.write(data);
    return newRem;
  }

  updateReminder(userId: string, updates: Partial<DailyReminder>): DailyReminder {
    const data = this.read();
    const idx = data.reminders.findIndex((r) => r.user_id === userId);
    if (idx >= 0) {
      data.reminders[idx] = { ...data.reminders[idx], ...updates, updated_at: new Date().toISOString() };
      this.write(data);
      return data.reminders[idx];
    } else {
      const newRem: DailyReminder = {
        id: `rem-${Date.now()}`,
        user_id: userId,
        is_active: true,
        frequency: 1,
        time_1: '09:00',
        time_2: '20:00',
        updated_at: new Date().toISOString(),
        ...updates,
      };
      data.reminders.push(newRem);
      this.write(data);
      return newRem;
    }
  }

  // --- AI CONFIGS & LOGS ---
  getAiConfigs(): AiProviderConfig[] {
    return this.read().ai_configs;
  }

  updateAiConfig(providerName: string, updates: Partial<AiProviderConfig>): AiProviderConfig | undefined {
    const data = this.read();
    const idx = data.ai_configs.findIndex((c) => c.provider_name === providerName);
    if (idx === -1) return undefined;
    data.ai_configs[idx] = { ...data.ai_configs[idx], ...updates, updated_at: new Date().toISOString() };
    this.write(data);
    return data.ai_configs[idx];
  }

  getAiLogs(): AiLog[] {
    return this.read().ai_logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  createAiLog(logData: Omit<AiLog, 'id' | 'created_at'>): AiLog {
    const data = this.read();
    const newLog: AiLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...logData,
      created_at: new Date().toISOString(),
    };
    data.ai_logs.unshift(newLog);
    if (data.ai_logs.length > 500) {
      data.ai_logs = data.ai_logs.slice(0, 500);
    }
    this.write(data);
    return newLog;
  }

  // --- EXPORT HISTORY ---
  getExportHistory(userId: string): ExportHistory[] {
    return this.read()
      .export_history.filter((e) => e.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  createExportHistory(item: Omit<ExportHistory, 'id' | 'created_at'> & { id?: string }): ExportHistory {
    const data = this.read();
    const expId = item.id || `exp-${Date.now()}`;
    const newExport: ExportHistory = {
      ...item,
      id: expId,
      download_url: item.download_url || `/api/reports/download?id=${expId}`,
      created_at: new Date().toISOString(),
    };
    data.export_history.unshift(newExport);
    this.write(data);
    return newExport;
  }

  // --- PAYMENTS ---
  getPayments(userId?: string): Payment[] {
    const data = this.read();
    let payments = data.payments;
    if (userId) {
      payments = payments.filter((p) => p.user_id === userId);
    }
    const users = data.users;
    return payments
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((p) => ({
        ...p,
        user: users.find((u) => u.id === p.user_id),
      }));
  }

  createPayment(paymentData: Omit<Payment, 'id' | 'created_at' | 'updated_at'>): Payment {
    const data = this.read();
    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      ...paymentData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    data.payments.unshift(newPayment);
    this.write(data);
    return newPayment;
  }

  updatePaymentStatus(id: string, status: 'approved' | 'rejected' | 'failed', adminId?: string): Payment | undefined {
    const data = this.read();
    const idx = data.payments.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    const payment = data.payments[idx];
    payment.status = status;
    payment.updated_at = new Date().toISOString();
    if (adminId) payment.approved_by_admin_id = adminId;

    // If approved, upgrade user plan!
    if (status === 'approved') {
      const userIdx = data.users.findIndex((u) => u.id === payment.user_id);
      if (userIdx >= 0) {
        data.users[userIdx].plan = payment.plan;
        data.users[userIdx].updated_at = new Date().toISOString();
      }
    }

    this.write(data);
    return payment;
  }

  // --- AUDIT LOGS ---
  getAuditLogs(): AuditLog[] {
    const data = this.read();
    const users = data.users;
    return data.audit_logs
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((al) => ({
        ...al,
        admin: users.find((u) => u.id === al.admin_id),
        target_user: users.find((u) => u.id === al.target_user_id),
      }));
  }

  createAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): AuditLog {
    const data = this.read();
    const newAudit: AuditLog = {
      id: `adt-${Date.now()}`,
      ...log,
      created_at: new Date().toISOString(),
    };
    data.audit_logs.unshift(newAudit);
    this.write(data);
    return newAudit;
  }
}

// Singleton database instance
export const db = new DatabaseEngine();
