'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Users,
  Cpu,
  Receipt,
  FileSpreadsheet,
  Check,
  X,
  Eye,
  LogOut,
  Sparkles,
  Search,
  Activity,
  ArrowRight,
  Clock,
  Key,
  ShieldCheck,
  Download,
  UserPlus,
  Trash2,
  UserCheck,
  AlertCircle,
  Filter,
  CheckCircle2,
  XCircle,
  Shield,
  Layers,
  MessageCircle,
  Send,
  Smartphone,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { formatRupiah, formatDateWib } from '@/lib/utils';
import { User, UserRole, UserStatus, UserPlan, AiProviderConfig, AiLog, Payment, AuditLog } from '@/types';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { currentUser, switchUser, setIsImpersonating, notify } = useApp();

  type TabType =
    | 'pending'
    | 'users'
    | 'admins'
    | 'ai_providers'
    | 'ai_logs'
    | 'payments'
    | 'audit_logs';

  const [activeTab, setActiveTab] = useState<TabType>('pending');

  const [users, setUsers] = useState<User[]>([]);
  const [aiConfigs, setAiConfigs] = useState<AiProviderConfig[]>([]);
  const [aiLogs, setAiLogs] = useState<AiLog[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Create User
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<{
    full_name: string;
    email: string;
    phone_number: string;
    role: UserRole;
    status: UserStatus;
    plan: UserPlan;
  }>({
    full_name: '',
    email: '',
    phone_number: '',
    role: 'user',
    status: 'approved',
    plan: 'starter',
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Modal Reject User with Reason
  const [rejectingUser, setRejectingUser] = useState<User | null>(null);
  const [rejectReason, setRejectReason] = useState(
    'Data kontak atau nomor HP belum valid untuk verifikasi Telegram'
  );
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  // Sub-filter for Registrations & Verification Modal
  const [pendingSubFilter, setPendingSubFilter] = useState<'pending' | 'rejected' | 'all'>('pending');
  const [verifyingUser, setVerifyingUser] = useState<User | null>(null);
  const [verifyingChannel, setVerifyingChannel] = useState<'whatsapp' | 'sms' | 'telegram'>('whatsapp');
  const [verifyingSubmitting, setVerifyingSubmitting] = useState(false);

  // Modal view transactions
  const [viewTxModalUser, setViewTxModalUser] = useState<User | null>(null);
  const [userTransactions, setUserTransactions] = useState<any[]>([]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin');
      const data = await res.json();
      if (data.ok) {
        setUsers(data.users || []);
        setAiConfigs(data.aiConfigs || []);
        setAiLogs(data.aiLogs || []);
        setPayments(data.payments || []);
        setAuditLogs(data.auditLogs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Filtered lists
  const pendingUsers = users.filter((u) => u.status === 'pending');
  const rejectedUsers = users.filter((u) => u.status === 'rejected');
  const allRegistrations = users.filter((u) => u.role === 'user');
  const regularUsers = users.filter((u) => u.role === 'user' && u.status === 'approved');
  const adminUsers = users.filter((u) => u.role === 'admin' || u.role === 'superadmin');

  const displayedRegistrationList =
    pendingSubFilter === 'pending'
      ? pendingUsers
      : pendingSubFilter === 'rejected'
      ? rejectedUsers
      : allRegistrations;

  const handleSendVerification = async (u: User, ch: 'whatsapp' | 'sms' | 'telegram') => {
    setVerifyingSubmitting(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_verification_to_user',
          userId: u.id,
          channel: ch,
          adminId: currentUser?.id || 'usr-admin-rifki',
        }),
      });
      const data = await res.json();
      if (data.ok) {
        notify(`Kode verifikasi (${data.code}) disiapkan via ${ch.toUpperCase()} ke nomor ${u.phone_number}`);
        if (data.direct_url) {
          window.open(data.direct_url, '_blank');
        }
        setVerifyingUser(null);
        fetchAdminData();
      } else {
        notify(data.error || 'Gagal mengirim kode verifikasi', 'error');
      }
    } catch (e: any) {
      notify('Error: ' + e.message, 'error');
    } finally {
      setVerifyingSubmitting(false);
    }
  };

  const filterUsersBySearch = (list: User[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone_number.includes(q)
    );
  };

  // Create User Handler
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.full_name || !createForm.email || !createForm.phone_number) {
      notify('Nama lengkap, email, dan nomor HP wajib diisi!', 'error');
      return;
    }

    setCreateSubmitting(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_user',
          ...createForm,
          adminId: currentUser?.id || 'usr-admin-rifki',
        }),
      });

      const data = await res.json();
      if (data.ok) {
        notify(`Akun baru ${data.user.full_name} (${data.user.role}) berhasil ditambahkan!`);
        setShowCreateModal(false);
        setCreateForm({
          full_name: '',
          email: '',
          phone_number: '',
          role: 'user',
          status: 'approved',
          plan: 'starter',
        });
        fetchAdminData();
      } else {
        notify(data.error || 'Gagal menambahkan akun baru', 'error');
      }
    } catch (err: any) {
      notify('Error: ' + err.message, 'error');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Approve User Handler
  const handleApproveUser = async (userId: string, userName: string) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve_user',
          userId,
          adminId: currentUser?.id || 'usr-admin-rifki',
        }),
      });
      const data = await res.json();
      if (data.ok) {
        notify(`Akun ${userName} berhasil disetujui (Approved)! User dapat segera login.`);
        fetchAdminData();
      } else {
        notify(data.error || 'Gagal menyetujui akun', 'error');
      }
    } catch (err: any) {
      notify('Error: ' + err.message, 'error');
    }
  };

  // Reject User Handler
  const handleConfirmReject = async () => {
    if (!rejectingUser) return;
    setRejectSubmitting(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject_user',
          userId: rejectingUser.id,
          reason: rejectReason,
          adminId: currentUser?.id || 'usr-admin-rifki',
        }),
      });
      const data = await res.json();
      if (data.ok) {
        notify(`Pendaftaran ${rejectingUser.full_name} telah ditolak.`);
        setRejectingUser(null);
        fetchAdminData();
      } else {
        notify(data.error || 'Gagal menolak akun', 'error');
      }
    } catch (err: any) {
      notify('Error: ' + err.message, 'error');
    } finally {
      setRejectSubmitting(false);
    }
  };

  // Update Role Handler
  const handleUpdateRole = async (userId: string, role: UserRole, userName: string) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_user_role',
          userId,
          role,
          adminId: currentUser?.id || 'usr-admin-rifki',
        }),
      });
      const data = await res.json();
      if (data.ok) {
        notify(`Role ${userName} berhasil diubah menjadi ${role.toUpperCase()}`);
        fetchAdminData();
      } else {
        notify(data.error || 'Gagal mengubah role', 'error');
      }
    } catch (err: any) {
      notify('Error: ' + err.message, 'error');
    }
  };

  // Update Plan Handler
  const handleUpdatePlan = async (userId: string, plan: UserPlan, userName: string) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_user_plan',
          userId,
          plan,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        notify(`Paket ${userName} diubah menjadi ${plan.toUpperCase()}`);
        fetchAdminData();
      }
    } catch (err: any) {
      notify('Error: ' + err.message, 'error');
    }
  };

  // Delete User Handler
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Yakin ingin menghapus seluruh data pengguna ${userName}?`)) return;
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_user',
          userId,
          adminId: currentUser?.id || 'usr-admin-rifki',
        }),
      });
      const data = await res.json();
      if (data.ok) {
        notify(`User ${userName} berhasil dihapus beserta data terkait.`);
        fetchAdminData();
      }
    } catch (err: any) {
      notify('Error: ' + err.message, 'error');
    }
  };

  // Impersonate User
  const handleImpersonate = (userId: string) => {
    switchUser(userId);
    setIsImpersonating(true);
    notify('Beralih ke mode tampilan pengguna...');
    router.push('/dashboard');
  };

  // View User Transactions with Audit Logging
  const handleViewUserTransactions = async (u: User) => {
    try {
      const currentAdminId = currentUser?.id || 'usr-admin-rifki';
      const res = await fetch(
        `/api/admin?action=view_user_transactions&targetUserId=${u.id}&adminId=${currentAdminId}`
      );
      const data = await res.json();
      if (data.ok) {
        setViewTxModalUser(u);
        setUserTransactions(data.transactions || []);
        notify('Audit log dicatat: Akses data transaksi user ' + u.full_name);
        fetchAdminData();
      }
    } catch (e: any) {
      notify('Error viewing transactions: ' + e.message, 'error');
    }
  };

  // Approve / Reject Payment
  const handlePaymentAction = async (paymentId: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/payment/midtrans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, paymentId, adminId: currentUser?.id || 'usr-admin-rifki' }),
      });
      const data = await res.json();
      if (data.ok) {
        notify(`Pembayaran berhasil di-${action}!`);
        fetchAdminData();
      }
    } catch (e: any) {
      notify('Error: ' + e.message, 'error');
    }
  };

  // Toggle AI Config mode & active status
  const handleUpdateAiConfig = async (providerName: string, updates: Partial<AiProviderConfig>) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_ai_config',
          providerName,
          ...updates,
        }),
      });
      if (res.ok) {
        notify('Konfigurasi provider AI diperbarui!');
        fetchAdminData();
      }
    } catch (e: any) {
      notify('Error: ' + e.message, 'error');
    }
  };

  const handleExportAllUsers = () => {
    window.open('/api/admin?action=export_all_users', '_blank');
  };

  // Proteksi Akses: Halaman ini HANYA untuk akun Admin / Super Admin
  if (currentUser && currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 selection:bg-rose-500 selection:text-white">
        <div className="w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-10 h-10 animate-bounce" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-rose-500/15 text-rose-400 text-xs font-black uppercase tracking-wider border border-rose-500/30">
              403 Forbidden • Akses Terbatas
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Khusus Akun Administrator
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Halaman ini dilindungi sistem otorisasi TataDana dan hanya dapat dibuka oleh akun dengan peran <strong>Super Admin</strong> atau <strong>Staff Admin</strong>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Akun Anda:</span>
              <span className="font-bold text-white">{currentUser.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Email:</span>
              <span className="font-mono text-slate-300">{currentUser.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Role Saat Ini:</span>
              <span className="font-bold uppercase text-amber-400">{currentUser.role} (Bukan Admin)</span>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => {
                switchUser('usr-admin-rifki');
                notify('Beralih ke akun Super Admin Rifki Arifin!');
              }}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Login sebagai Admin Rifki Arifin (Superadmin)</span>
            </button>

            <Link
              href="/dashboard"
              className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <span>Kembali ke Dashboard Pengguna</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Admin Navbar */}
      <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shrink-0">
            TD
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-xs sm:text-sm text-white tracking-tight flex items-center gap-1.5 sm:gap-2 truncate">
              <span>TataDana Admin</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold border border-emerald-500/30">
                PROD
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <a
            href="https://nqeumqrxlpelisqqzxqu.supabase.co"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold hover:bg-emerald-500/20 transition-all shadow-sm"
            title="Buka Supabase Console"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Supabase PostgreSQL: Terhubung</span>
            <ExternalLink className="w-3 h-3 text-emerald-400" />
          </a>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">+ Tambah Akun Baru</span>
            <span className="sm:hidden">+ Akun</span>
          </button>

          <button
            onClick={handleExportAllUsers}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Export Data
          </button>

          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all"
          >
            <span className="hidden sm:inline">Tampilan User</span>
            <span className="sm:hidden">User</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Body */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 flex-1">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 gap-1.5 overflow-x-auto no-scrollbar">
          {[
            {
              id: 'pending' as TabType,
              label: '⏳ Antrean Approval Pendaftaran',
              icon: Clock,
              badge: pendingUsers.length,
              badgeColor: 'bg-amber-500 text-slate-950',
            },
            {
              id: 'users' as TabType,
              label: '👤 Pengguna Reguler',
              icon: Users,
              badge: regularUsers.length,
              badgeColor: 'bg-emerald-500/20 text-emerald-300',
            },
            {
              id: 'admins' as TabType,
              label: '🛡️ Pengelola Admin & Super Admin',
              icon: Shield,
              badge: adminUsers.length,
              badgeColor: 'bg-indigo-500/20 text-indigo-300',
            },
            {
              id: 'ai_providers' as TabType,
              label: 'Multi-AI Provider',
              icon: Cpu,
            },
            {
              id: 'ai_logs' as TabType,
              label: 'Log AI & Latensi',
              icon: Activity,
              badge: aiLogs.length,
              badgeColor: 'bg-slate-800 text-slate-300',
            },
            {
              id: 'payments' as TabType,
              label: 'Approval Pembayaran',
              icon: Receipt,
              badge: payments.filter((p) => p.status === 'pending').length,
              badgeColor: 'bg-amber-500 text-slate-950',
            },
            {
              id: 'audit_logs' as TabType,
              label: 'Audit Log Privasi',
              icon: ShieldCheck,
              badge: auditLogs.length,
              badgeColor: 'bg-slate-800 text-slate-300',
            },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-3.5 py-3 border-b-2 font-bold text-xs whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10 rounded-t-xl'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
                {t.badge !== undefined && t.badge > 0 && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                      t.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: ANTREAN APPROVAL PENDAFTARAN & VERIFIKASI */}
        {activeTab === 'pending' && (
          <div className="bg-slate-950/60 rounded-3xl border border-slate-800 overflow-hidden shadow-xl space-y-4">
            <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>Antrean Persetujuan Pendaftaran Akun</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black border border-amber-500/30">
                    {pendingUsers.length} Menunggu Tindakan
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Admin dapat menyetujui (Approve), menolak (Reject) dengan alasan, serta mengirimkan kode verifikasi langsung ke nomor yang didaftarkan.
                </p>
              </div>

              {/* Sub-Filter: Pending / Rejected / Semua */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                  <button
                    onClick={() => setPendingSubFilter('pending')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      pendingSubFilter === 'pending'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Menunggu ({pendingUsers.length})</span>
                  </button>
                  <button
                    onClick={() => setPendingSubFilter('rejected')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      pendingSubFilter === 'rejected'
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Ditolak ({rejectedUsers.length})</span>
                  </button>
                  <button
                    onClick={() => setPendingSubFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      pendingSubFilter === 'all'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Semua ({allRegistrations.length})</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tambah User</span>
                </button>
              </div>
            </div>

            {displayedRegistrationList.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-white">Tidak Ada Data Pendaftaran di Kategori Ini</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {pendingSubFilter === 'pending'
                    ? 'Semua permohonan pendaftaran telah selesai diproses oleh Administrator.'
                    : 'Tidak ada data pengguna yang sesuai dengan filter yang dipilih.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase text-[10px] font-bold">
                      <th className="py-3 px-6">Nama & Kontak Pemohon</th>
                      <th className="py-3 px-4">Paket Pilihan</th>
                      <th className="py-3 px-4">Tanggal Pengajuan</th>
                      <th className="py-3 px-4">Status & Alasan</th>
                      <th className="py-3 px-6 text-right">Keputusan Administrator (Approve / Reject)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {displayedRegistrationList.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-white text-sm">{u.full_name}</div>
                          <div className="text-slate-400 text-[11px] font-mono mt-0.5 flex items-center gap-2">
                            <span>{u.phone_number}</span>
                            <span>•</span>
                            <span>{u.email}</span>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                              u.plan === 'pro'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {u.plan}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-slate-300 font-mono text-[11px]">
                          {formatDateWib(u.created_at)}
                        </td>

                        <td className="py-4 px-4">
                          {u.status === 'pending' && (
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-[10px] uppercase flex items-center gap-1 w-fit">
                              <Clock className="w-3 h-3 animate-spin" />
                              Menunggu Approval
                            </span>
                          )}
                          {u.status === 'rejected' && (
                            <div className="space-y-0.5">
                              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold text-[10px] uppercase flex items-center gap-1 w-fit">
                                <XCircle className="w-3 h-3" />
                                Ditolak (Rejected)
                              </span>
                              {u.rejection_reason && (
                                <p className="text-[10px] text-slate-400 max-w-[200px] truncate" title={u.rejection_reason}>
                                  Alasan: {u.rejection_reason}
                                </p>
                              )}
                            </div>
                          )}
                          {u.status === 'approved' && (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-[10px] uppercase flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" />
                              Disetujui (Approved)
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                          {/* Chat WhatsApp Pemohon */}
                          <a
                            href={`https://wa.me/${u.phone_number.replace(/\D/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(
                              `Halo ${u.full_name}, kami dari Administrator TataDana mengenai permohonan pendaftaran akun Anda.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Chat WhatsApp pemohon"
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold border border-slate-700 inline-flex items-center gap-1.5 transition-all"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>

                          {/* Tombol Tolak (Reject) jika belum ditolak */}
                          {u.status !== 'rejected' && (
                            <button
                              onClick={() => {
                                setRejectingUser(u);
                                setRejectReason(
                                  'Data pendaftaran belum memenuhi syarat atau nomor kontak tidak valid'
                                );
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 inline-flex items-center gap-1.5 transition-all"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Tolak (Reject)</span>
                            </button>
                          )}

                          {/* Tombol Setujui (Approve) */}
                          {u.status !== 'approved' && (
                            <button
                              onClick={() => handleApproveUser(u.id, u.full_name)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-500/20 inline-flex items-center gap-1.5 transition-all"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Setujui (Approve)</span>
                            </button>
                          )}

                          {/* Tombol Impersonate jika sudah approved */}
                          {u.status === 'approved' && (
                            <button
                              onClick={() => handleImpersonate(u.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 inline-flex items-center gap-1 transition-all"
                            >
                              <Eye className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Lihat Akun</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PENGGUNA REGULER */}
        {activeTab === 'users' && (
          <div className="bg-slate-950/60 rounded-3xl border border-slate-800 overflow-hidden shadow-xl space-y-4">
            <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>Daftar Pengguna Reguler (Role: User)</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold">
                    {regularUsers.length} Akun
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Kelola paket starter/pro, impersonasi akses user, audit transaksi, dan promosi admin
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama, email, hp..."
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Tambah User</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase text-[10px] font-bold">
                    <th className="py-3 px-6">Nama & Kontak</th>
                    <th className="py-3 px-4">Status Akun</th>
                    <th className="py-3 px-4">Paket Langganan</th>
                    <th className="py-3 px-4">Pemakaian Bulan Ini</th>
                    <th className="py-3 px-6 text-right">Aksi Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filterUsersBySearch(regularUsers).map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-white text-sm">{u.full_name}</div>
                        <div className="text-slate-400 text-[11px] font-mono mt-0.5">
                          {u.phone_number} • {u.email}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {u.status === 'approved' ? (
                          <span className="px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Approved
                          </span>
                        ) : u.status === 'rejected' ? (
                          <div className="space-y-0.5">
                            <span className="px-2 py-0.5 rounded-full font-bold uppercase text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 inline-flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-rose-400" />
                              Ditolak
                            </span>
                            {u.rejection_reason && (
                              <p className="text-[10px] text-slate-400 line-clamp-1">
                                {u.rejection_reason}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Pending
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                              u.plan === 'pro'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {u.plan}
                          </span>
                          <button
                            onClick={() =>
                              handleUpdatePlan(u.id, u.plan === 'pro' ? 'starter' : 'pro', u.full_name)
                            }
                            title="Ubah paket Starter <-> Pro"
                            className="text-[10px] text-slate-400 hover:text-emerald-400 underline font-semibold"
                          >
                            Ubah
                          </button>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-slate-300 font-medium">
                        {u.monthly_txn_count} transaksi
                        <span className="text-[10px] text-slate-500 block">
                          Periode: {u.last_reset_month}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleViewUserTransactions(u)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Transaksi</span>
                        </button>

                        <button
                          onClick={() => handleImpersonate(u.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1 shadow-sm"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Login</span>
                        </button>

                        <button
                          onClick={() => handleUpdateRole(u.id, 'admin', u.full_name)}
                          title="Promosikan menjadi Staff Admin"
                          className="px-2.5 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold inline-flex items-center gap-1"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>Jadikan Admin</span>
                        </button>

                        <button
                          onClick={() => handleDeleteUser(u.id, u.full_name)}
                          title="Hapus Pengguna"
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PENGELOLA ADMIN & SUPER ADMIN */}
        {activeTab === 'admins' && (
          <div className="bg-slate-950/60 rounded-3xl border border-slate-800 overflow-hidden shadow-xl space-y-4">
            <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>Daftar Pengelola Administrator & Superadmin</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                    {adminUsers.length} Pengelola
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Akun staf pengelola sistem dengan hak akses approval, audit privasi, dan manajemen multi-AI
                </p>
              </div>

              <button
                onClick={() => {
                  setCreateForm((prev) => ({ ...prev, role: 'admin' }));
                  setShowCreateModal(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>+ Tambah Akun Admin</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase text-[10px] font-bold">
                    <th className="py-3 px-6">Nama Administrator</th>
                    <th className="py-3 px-4">Kontak & Email</th>
                    <th className="py-3 px-4">Tingkat Hak Akses</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-6 text-right">Kelola Akses</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {adminUsers.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          <Shield className="w-4 h-4 text-emerald-400" />
                          <span>{a.full_name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          ID: <span className="font-mono">{a.id}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-mono text-slate-300">
                        <div>{a.email}</div>
                        <div className="text-[11px] text-slate-400">{a.phone_number}</div>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full font-black uppercase text-[10px] inline-flex items-center gap-1 ${
                            a.role === 'superadmin'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          {a.role}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {a.status}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                        {a.id !== 'usr-admin-rifki' && a.id !== 'usr-admin-00' ? (
                          <>
                            {a.role === 'admin' ? (
                              <button
                                onClick={() => handleUpdateRole(a.id, 'superadmin', a.full_name)}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-500/30"
                              >
                                Jadikan Superadmin
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateRole(a.id, 'admin', a.full_name)}
                                className="px-2.5 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-bold border border-indigo-500/30"
                              >
                                Turunkan ke Admin
                              </button>
                            )}

                            <button
                              onClick={() => handleUpdateRole(a.id, 'user', a.full_name)}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30"
                            >
                              Cabut Akses Admin
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-bold italic">
                            Root Superadmin (Utama)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: AI PROVIDERS */}
        {activeTab === 'ai_providers' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {aiConfigs.map((cfg) => (
              <div
                key={cfg.id}
                className="bg-slate-950/60 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white uppercase text-sm flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <span>{cfg.provider_name}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      cfg.is_active
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {cfg.is_active ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Model Name</span>
                    <span className="font-mono text-white">{cfg.model_name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Mode Strategi</span>
                    <span className="font-semibold text-emerald-400">{cfg.mode}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Prioritas Antrean</span>
                    <span className="font-mono text-white">#{cfg.priority}</span>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() =>
                      handleUpdateAiConfig(cfg.provider_name, { is_active: !cfg.is_active })
                    }
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      cfg.is_active
                        ? 'bg-slate-800 text-rose-400 border-slate-700 hover:bg-rose-500/10'
                        : 'bg-emerald-600 text-white border-transparent hover:bg-emerald-500'
                    }`}
                  >
                    {cfg.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: AI LOGS */}
        {activeTab === 'ai_logs' && (
          <div className="bg-slate-950/60 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">Log Eksekusi & Latensi Multi-AI Engine</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitoring token prompt, latensi respons per provider (Gemini / OpenAI / DeepSeek)
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase text-[10px] font-bold">
                    <th className="py-3 px-6">Timestamp</th>
                    <th className="py-3 px-4">Provider / Model</th>
                    <th className="py-3 px-4">Tipe Input</th>
                    <th className="py-3 px-4">Latensi</th>
                    <th className="py-3 px-4">Token Total</th>
                    <th className="py-3 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {aiLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-6 text-slate-400 font-mono text-[11px]">
                        {formatDateWib(log.created_at)}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        {log.provider} <span className="text-slate-400 font-normal">({log.model})</span>
                      </td>
                      <td className="py-3 px-4 uppercase font-mono text-[10px] text-emerald-400">
                        {log.input_type}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">{log.latency_ms} ms</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{log.total_tokens}</td>
                      <td className="py-3 px-6">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: PAYMENTS */}
        {activeTab === 'payments' && (
          <div className="bg-slate-950/60 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">Approval Pembayaran Manual / Midtrans</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Konfirmasi bukti transfer pengguna yang melakukan upgrade ke paket Pro
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase text-[10px] font-bold">
                    <th className="py-3 px-6">Order ID & Pemohon</th>
                    <th className="py-3 px-4">Metode & Nominal</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Bukti Transfer</th>
                    <th className="py-3 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-white">{p.order_id}</div>
                        <div className="text-[11px] text-slate-400">{p.user?.full_name || p.user_id}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-emerald-400">{formatRupiah(p.amount)}</div>
                        <div className="text-[11px] text-slate-400 uppercase">{p.payment_method}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            p.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : p.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {p.proof_image_url ? (
                          <a
                            href={p.proof_image_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-400 hover:underline text-xs flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Lihat Bukti</span>
                          </a>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        {p.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handlePaymentAction(p.id, 'reject')}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold hover:bg-rose-500/20"
                            >
                              Tolak
                            </button>
                            <button
                              onClick={() => handlePaymentAction(p.id, 'approve')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500"
                            >
                              Approve
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: AUDIT LOGS */}
        {activeTab === 'audit_logs' && (
          <div className="bg-slate-950/60 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">Log Audit Akses Data Transaksi User</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Setiap kali admin membuka transaksi user, pencatatan otomatis di-commit untuk privasi & kepatuhan regulasi finansial
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase text-[10px] font-bold">
                    <th className="py-3 px-6">Timestamp</th>
                    <th className="py-3 px-4">Admin Pelaksana</th>
                    <th className="py-3 px-4">Target User</th>
                    <th className="py-3 px-4">Tindakan</th>
                    <th className="py-3 px-6">Detail / Alasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {auditLogs.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-6 text-slate-400 font-mono text-[11px]">
                        {formatDateWib(a.created_at)}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-200">
                        {a.admin?.full_name || 'Superadmin'}
                      </td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold">
                        {a.target_user?.full_name || a.target_user_id || 'User'}
                      </td>
                      <td className="py-3 px-4 uppercase font-mono text-[10px] text-amber-400">
                        {a.action}
                      </td>
                      <td className="py-3 px-6 text-slate-300">{a.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: TAMBAH USER / ADMIN BARU */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100 flex flex-col">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Tambah Akun User / Admin Baru</h3>
                  <p className="text-[11px] text-slate-400">
                    Konfigurasi role, status persetujuan, dan paket langganan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 uppercase font-bold text-[10px] mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={createForm.full_name}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, full_name: e.target.value }))
                  }
                  placeholder="Contoh: Andi Pratama"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 uppercase font-bold text-[10px] mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="andi@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 uppercase font-bold text-[10px] mb-1">
                    Nomor WhatsApp / HP *
                  </label>
                  <input
                    type="tel"
                    required
                    value={createForm.phone_number}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, phone_number: e.target.value }))
                    }
                    placeholder="0812xxxxxxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-slate-400 uppercase font-bold text-[10px] mb-1">
                    Hak Akses (Role)
                  </label>
                  <select
                    value={createForm.role}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, role: e.target.value as UserRole }))
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 text-xs"
                  >
                    <option value="user">User (Pengguna)</option>
                    <option value="admin">Staff Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase font-bold text-[10px] mb-1">
                    Status Akun
                  </label>
                  <select
                    value={createForm.status}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, status: e.target.value as UserStatus }))
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 text-xs"
                  >
                    <option value="approved">Approved (Aktif)</option>
                    <option value="pending">Pending (Antrean)</option>
                    <option value="rejected">Rejected (Ditolak)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase font-bold text-[10px] mb-1">
                    Paket Layanan
                  </label>
                  <select
                    value={createForm.plan}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, plan: e.target.value as UserPlan }))
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 text-xs"
                  >
                    <option value="starter">Starter (50 txn/bln)</option>
                    <option value="pro">Pro Unlimited (Full AI)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {createSubmitting ? 'Menyimpan...' : 'Simpan Akun Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TOLAK PENDAFTARAN DENGAN ALASAN */}
      {rejectingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl text-slate-100 p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm">
              <XCircle className="w-5 h-5" />
              <span>Tolak Pendaftaran: {rejectingUser.full_name}</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Alasan penolakan ini akan ditampilkan kepada user saat mencoba masuk di halaman login:
            </p>

            <div className="space-y-1.5">
              {[
                'Data kontak atau nomor HP belum valid untuk verifikasi Telegram',
                'Kuota pendaftaran akun baru pada periode ini sudah penuh',
                'Terindikasi permohonan duplikat dari identitas yang sama',
              ].map((reason, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRejectReason(reason)}
                  className={`w-full p-2.5 rounded-xl border text-left text-[11px] transition-all ${
                    rejectReason === reason
                      ? 'border-rose-500/50 bg-rose-500/10 text-rose-300 font-bold'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-slate-400 uppercase font-bold text-[10px] mb-1">
                Kustom Alasan Penolakan:
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={rejectSubmitting || !rejectReason.trim()}
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                {rejectSubmitting ? 'Memproses...' : 'Konfirmasi Tolak Pendaftaran'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: USER TRANSACTIONS VIEWER */}
      {viewTxModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden text-slate-100">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white">
                  Investigasi Transaksi: {viewTxModalUser.full_name}
                </h3>
                <span className="text-[11px] text-amber-400 flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Akses ini telah dicatat ke dalam audit log resmi.
                </span>
              </div>
              <button
                onClick={() => setViewTxModalUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 divide-y divide-slate-800 text-xs">
              {userTransactions.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  Tidak ada transaksi tercatat untuk user ini.
                </div>
              ) : (
                userTransactions.map((tx) => (
                  <div key={tx.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{tx.notes || tx.category?.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {formatDateWib(tx.transaction_date)} • Dompet: {tx.wallet?.name} • Sumber: {tx.source}
                      </div>
                    </div>
                    <div
                      className={`font-black text-sm ${
                        tx.type === 'expense' ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {tx.type === 'expense' ? '-' : '+'} {formatRupiah(tx.amount)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
