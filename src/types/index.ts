export type UserPlan = 'starter' | 'pro';
export type UserRole = 'user' | 'admin' | 'superadmin';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  email: string;
  phone_number: string;
  full_name: string;
  avatar_url?: string;
  plan: UserPlan;
  monthly_txn_count: number;
  last_reset_month: string; // YYYY-MM
  currency: string;
  role: UserRole;
  status: UserStatus;
  password?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface PendingTransactionConfirmation {
  id: string;
  user_id: string;
  telegram_chat_id?: number;
  type: 'expense' | 'income';
  amount: number;
  category_id: string;
  category_name?: string;
  notes: string;
  source: TransactionSource;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  type: 'cash' | 'bank' | 'ewallet' | 'investment';
  balance: number;
  is_default: boolean;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  is_custom: boolean;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  monthly_limit: number;
  month_year: string; // YYYY-MM
  alert_80_sent: boolean;
  alert_100_sent: boolean;
  created_at: string;
  updated_at: string;
  // enriched fields
  category?: Category;
  current_spent?: number;
}

export type TransactionType = 'expense' | 'income' | 'transfer';
export type TransactionSource = 'web' | 'telegram_text' | 'telegram_photo' | 'telegram_voice';

export interface ReceiptItem {
  id: string;
  transaction_id: string;
  item_name: string;
  quantity: number;
  price: number;
  subtotal: number;
  category_name?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  target_wallet_id?: string;
  category_id?: string;
  type: TransactionType;
  amount: number;
  notes?: string;
  source: TransactionSource;
  raw_receipt_url?: string;
  is_ocr: boolean;
  transaction_date: string;
  created_at: string;
  // enriched
  wallet?: Wallet;
  target_wallet?: Wallet;
  category?: Category;
  receipt_items?: ReceiptItem[];
}

export interface TelegramLink {
  id: string;
  user_id: string;
  telegram_user_id?: number;
  telegram_username?: string;
  phone_number?: string;
  bot_token?: string;
  is_connected: boolean;
  webhook_url?: string;
  linking_code?: string;
  linked_at?: string;
  updated_at: string;
}

export interface DailyReminder {
  id: string;
  user_id: string;
  is_active: boolean;
  frequency: 1 | 2;
  time_1: string; // HH:mm
  time_2: string; // HH:mm
  updated_at: string;
}

export type AiProviderName = 'gemini' | 'openai' | 'deepseek';
export type AiProviderMode = 'single' | 'parallel_failover';

export interface AiProviderConfig {
  id: string;
  provider_name: AiProviderName;
  is_active: boolean;
  is_default: boolean;
  api_key_encrypted?: string;
  model_name: string;
  mode: AiProviderMode;
  priority: number;
  updated_at: string;
}

export interface AiLog {
  id: string;
  user_id?: string;
  provider: string;
  model: string;
  input_type: 'text' | 'photo' | 'voice';
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  status: 'success' | 'failed' | 'fallback';
  error_message?: string;
  created_at: string;
}

export interface ExportHistory {
  id: string;
  user_id: string;
  file_name: string;
  file_type: 'pdf' | 'xlsx';
  date_range: string;
  download_url: string;
  file_size_bytes: number;
  expires_at: string;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  order_id: string;
  plan: UserPlan;
  amount: number;
  payment_method: 'midtrans' | 'manual_transfer';
  status: 'pending' | 'approved' | 'rejected' | 'failed';
  proof_image_url?: string;
  approved_by_admin_id?: string;
  midtrans_transaction_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // enriched
  user?: User;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  target_user_id?: string;
  action: string;
  details?: string;
  ip_address?: string;
  created_at: string;
  // enriched
  admin?: User;
  target_user?: User;
}
