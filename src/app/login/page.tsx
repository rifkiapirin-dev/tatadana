'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  Phone,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  Clock,
  XCircle,
  UserCheck,
  Shield,
  Zap,
  MessageCircle,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface LoginStatusInfo {
  type: 'pending' | 'rejected' | 'error';
  title: string;
  message: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
    status: string;
  };
}

export default function LoginPage() {
  const router = useRouter();
  const { switchUser, notify } = useApp();
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('rifkiarifin@gmail.com');
  const [password, setPassword] = useState('123456789');
  const [phone, setPhone] = useState('083851284143');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusInfo, setStatusInfo] = useState<LoginStatusInfo | null>(null);

  const adminAccount = {
    id: 'usr-admin-rifki',
    label: '👑 Akun Khusus Admin',
    email: 'rifkiarifin@gmail.com',
    password: '123456789',
    phone: '083851284143',
    name: 'Rifki Arifin (Admin)',
    badge: 'Superadmin',
    badgeColor: 'bg-emerald-500/15 text-emerald-800 border-emerald-400 font-extrabold',
    icon: Shield,
    targetPath: '/dashboard',
  };

  const executeLogin = async (loginEmail?: string, loginPhone?: string, directRedirectPath?: string) => {
    setStatusInfo(null);
    setLoading(true);

    const targetEmail = loginEmail !== undefined ? loginEmail : email;
    const targetPhone = loginPhone !== undefined ? loginPhone : phone;

    try {
      const res = await fetch('/api/user/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: method === 'email' || loginEmail ? targetEmail : undefined,
          phone: method === 'phone' && !loginEmail ? targetPhone : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        if (data.status === 'pending') {
          setStatusInfo({
            type: 'pending',
            title: 'Akun Masih Menunggu Persetujuan Admin',
            message:
              data.error ||
              'Akun Anda saat ini masih berada dalam antrean approval oleh Administrator. Hanya akun yang telah disetujui (Approved) yang diizinkan masuk ke sistem.',
            user: data.user,
          });
          notify('Akun Anda masih berstatus PENDING approval admin.', 'error');
          return;
        }

        if (data.status === 'rejected') {
          setStatusInfo({
            type: 'rejected',
            title: 'Pendaftaran Akun Ditolak Administrator',
            message:
              data.error ||
              'Mohon maaf, permohonan pendaftaran akun Anda ditolak oleh Admin TataDana. Silakan hubungi admin atau daftar ulang dengan data yang benar.',
            user: data.user,
          });
          notify('Akun Anda DITOLAK oleh Administrator.', 'error');
          return;
        }

        setStatusInfo({
          type: 'error',
          title: 'Gagal Masuk',
          message: data.error || 'Akun tidak ditemukan. Periksa kembali email atau nomor HP Anda.',
        });
        notify(data.error || 'Gagal masuk', 'error');
        return;
      }

      // Approved!
      const user = data.user;
      switchUser(user.id);
      notify(`Login berhasil! Selamat datang, ${user.full_name}.`);

      if (directRedirectPath) {
        router.push(directRedirectPath);
      } else if (user.role === 'admin' || user.role === 'superadmin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setStatusInfo({
        type: 'error',
        title: 'Koneksi Error',
        message: err.message || 'Terjadi kesalahan sistem',
      });
      notify('Terjadi kesalahan: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setOtpSent(true);
    notify('Kode OTP 4-digit simulasi (1234) dikirim ke WhatsApp / SMS.');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeLogin();
  };

  const handleAdminQuickLogin = () => {
    setEmail(adminAccount.email);
    setPassword(adminAccount.password);
    setPhone(adminAccount.phone);
    setMethod('email');
    executeLogin(adminAccount.email, adminAccount.phone, '/dashboard');
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* KIRI (40%): Branding Panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 text-white p-12 flex-col justify-between relative overflow-hidden select-none">
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white text-emerald-800 font-black text-lg flex items-center justify-center shadow-lg">
              TD
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">TataDana</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-4 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Fintech Personal Terintegrasi Telegram</span>
          </div>
          <h2 className="text-4xl font-black leading-tight text-white tracking-tight">
            Keuanganmu. <br />
            <span className="text-emerald-300">Terkontrol & Terverifikasi.</span>
          </h2>
          <p className="text-xs text-emerald-100/90 leading-relaxed">
            Sistem pencatatan keuangan multi-dompet cerdas. Akun admin memiliki akses penuh ke
            dashboard keuangan sekaligus panel administrator.
          </p>
        </div>

        <div className="relative z-10 text-[11px] text-emerald-200/80 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-300" />
          <span>Sistem Otorisasi Administrator Terverifikasi</span>
        </div>
      </div>

      {/* KANAN (60%): Form Panel */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Masuk ke TataDana</h1>
            <p className="text-xs text-slate-500 mt-1">
              Belum punya akun?{' '}
              <Link href="/register" className="text-emerald-600 font-bold hover:underline">
                Daftar akun baru dengan kode verifikasi
              </Link>
            </p>
          </div>

          {/* Quick Access Akun Admin */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5 uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                Akun Khusus Admin Aktif:
              </span>
              <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded-full">
                SUPERADMIN
              </span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-emerald-100 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">Rifki Arifin (Admin)</p>
                <p className="text-[11px] text-slate-500 font-mono">rifkiarifin@gmail.com</p>
                <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">Password: 123456789</p>
              </div>
              <button
                type="button"
                onClick={handleAdminQuickLogin}
                disabled={loading}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                Masuk 1-Klik →
              </button>
            </div>

            {/* Tombol Bantuan WhatsApp */}
            <a
              href="https://wa.me/6283851284143?text=Halo%20Admin%20TataDana,%20saya%20butuh%20bantuan%20login%20ke%20akun%20saya"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-800 text-[11px] font-bold border border-emerald-200 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ada Kendala? Hubungi WhatsApp Admin (0838-5128-4143)</span>
            </a>
          </div>

          {/* Status Alert Notification (Pending / Rejected / Error) */}
          {statusInfo && (
            <div
              className={`p-4 rounded-2xl border text-xs space-y-2 animate-in fade-in duration-200 ${
                statusInfo.type === 'pending'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : statusInfo.type === 'rejected'
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : 'bg-red-50 border-red-300 text-red-900'
              }`}
            >
              <div className="flex items-center gap-2 font-black text-sm">
                {statusInfo.type === 'pending' ? (
                  <Clock className="w-5 h-5 text-amber-600 animate-pulse shrink-0" />
                ) : statusInfo.type === 'rejected' ? (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                )}
                <span>{statusInfo.title}</span>
              </div>
              <p className="leading-relaxed text-xs">{statusInfo.message}</p>

              {statusInfo.type === 'pending' && (
                <div className="pt-2 border-t border-amber-200 flex items-center justify-between">
                  <span className="text-[11px] text-amber-800 font-medium">
                    Ingin menyetujui akun ini?
                  </span>
                  <Link
                    href="/admin"
                    className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition-colors"
                  >
                    Buka Admin Panel →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Login Method Toggle */}
          <div className="p-1 bg-slate-100 rounded-2xl flex gap-1 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setMethod('email');
                setOtpSent(false);
                setStatusInfo(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                method === 'email' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Email & Password
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod('phone');
                setStatusInfo(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                method === 'phone' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Nomor HP (OTP Telegram)
            </button>
          </div>

          {/* Form Content */}
          {method === 'email' ? (
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                  Email Akun
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? 'Memvalidasi Status Akun...' : 'Masuk Sekarang'}
              </button>
            </form>
          ) : (
            <form onSubmit={otpSent ? handleFormSubmit : handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                  Nomor Handphone (WhatsApp / Telegram)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-800"
                  />
                </div>
              </div>

              {otpSent && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                    Kode OTP Verifikasi
                  </label>
                  <input
                    type="text"
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Masukkan 1234"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-center tracking-widest text-base font-black focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    *Gunakan kode <b>1234</b> untuk verifikasi simulasi instan
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                {otpSent ? 'Verifikasi & Masuk' : 'Kirim Kode OTP'}
              </button>
            </form>
          )}

          {/* Social Google OAuth Simulation Button */}
          <div className="space-y-3 pt-2">
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-slate-50 px-3 text-[10px] text-slate-400 uppercase font-bold absolute">
                atau masuk dengan
              </span>
            </div>

            <button
              type="button"
              onClick={() => executeLogin('rifkiarifin@gmail.com')}
              className="w-full py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google OAuth</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
