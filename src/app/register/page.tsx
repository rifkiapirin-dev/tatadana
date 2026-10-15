'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  Phone,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Bot,
  Clock,
  ShieldAlert,
  MessageCircle,
  ExternalLink,
  Info,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function RegisterPage() {
  const router = useRouter();
  const { notify } = useApp();

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userRoleGoal, setUserRoleGoal] = useState<'karyawan' | 'freelancer' | 'mahasiswa'>('karyawan');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingSuccess, setPendingSuccess] = useState<any | null>(null);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName || !phoneNumber || !email || !password) {
      const err = 'Mohon lengkapi semua kolom pendaftaran.';
      setErrorMessage(err);
      notify(err, 'error');
      return;
    }

    if (password.length < 6) {
      const err = 'Password minimal 6 karakter.';
      setErrorMessage(err);
      notify(err, 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/user/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          full_name: fullName,
          email,
          phone_number: phoneNumber,
          password,
          plan: 'starter',
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setPendingSuccess(data.user);
        notify('Pendaftaran berhasil diajukan! Menunggu persetujuan (approval) Administrator.', 'info');
      } else {
        const err = data.error || 'Gagal mengajukan pendaftaran akun.';
        setErrorMessage(err);
        notify(err, 'error');
      }
    } catch (err: any) {
      const msg = 'Terjadi kesalahan: ' + err.message;
      setErrorMessage(msg);
      notify(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const adminWhatsAppNumber = '083851284143';
  const whatsappHelpUrl = `https://wa.me/6283851284143?text=${encodeURIComponent(
    `Halo Admin TataDana, saya butuh bantuan pendaftaran akun baru.\nNama: ${fullName || '-'}\nNo HP: ${phoneNumber || '-'}\nEmail: ${email || '-'}`
  )}`;

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
            <span>Sistem Approval & Otorisasi Administrator</span>
          </div>
          <h2 className="text-4xl font-black leading-tight text-white tracking-tight">
            Keuanganmu. <br />
            <span className="text-emerald-300">Terkontrol & Terverifikasi.</span>
          </h2>
          <p className="text-xs text-emerald-100/90 leading-relaxed">
            Daftarkan akunmu untuk mulai mencatat keuangan via Telegram Bot. Tanpa perlu memasukkan kode OTP,
            setiap permohonan pendaftaran langsung ditinjau oleh Administrator untuk disetujui (Approved) atau ditolak (Rejected) demi menjaga privasi dan keamanan sistem.
          </p>
        </div>

        <div className="relative z-10 space-y-2">
          <div className="text-[11px] text-emerald-200/90 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Persetujuan Akun Eksklusif oleh Administrator</span>
          </div>
          <div className="text-[11px] text-emerald-200/70 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-300" />
            <span>Dukungan Bantuan Langsung via WhatsApp Admin: 0838-5128-4143</span>
          </div>
        </div>
      </div>

      {/* KANAN (60%): Form Panel */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          {pendingSuccess ? (
            /* TAMPILAN STATUS PENDING SETELAH DAFTAR */
            <div className="bg-white p-8 rounded-3xl border border-amber-200 shadow-xl shadow-amber-500/5 space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto border border-amber-200/60 shadow-inner">
                <Clock className="w-8 h-8 animate-pulse text-amber-500" />
              </div>

              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black uppercase tracking-wider mb-2 border border-amber-300/60">
                  Status: Menunggu Persetujuan Admin (Pending)
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Pendaftaran Berhasil Diajukan!
                </h2>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Terima kasih <strong className="text-slate-800">{pendingSuccess.full_name}</strong>! Formulir pendaftaran Anda telah diterima. Saat ini akun Anda berada dalam antrean peninjauan oleh <strong>Administrator TataDana</strong> untuk <strong>Disetujui (Approved)</strong> atau <strong>Ditolak (Rejected)</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Nama Pemohon:</span>
                  <span className="font-bold text-slate-800">{pendingSuccess.full_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Email:</span>
                  <span className="font-bold text-slate-800">{pendingSuccess.email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Nomor Handphone:</span>
                  <span className="font-bold text-slate-800">{pendingSuccess.phone_number}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">Status Akun:</span>
                  <span className="font-bold uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    PENDING (Menunggu Keputusan Admin)
                  </span>
                </div>
              </div>

              {/* Bantuan WhatsApp CTA */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-left space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Ingin Persetujuan Lebih Cepat?</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Hubungi Admin via WhatsApp untuk mengonfirmasikan permohonan Anda agar segera disetujui (Approved).
                </p>
                <a
                  href={`https://wa.me/6283851284143?text=${encodeURIComponent(
                    `Halo Admin TataDana, saya sudah mendaftar akun baru dengan nama ${pendingSuccess.full_name} (Email: ${pendingSuccess.email}, No HP: ${pendingSuccess.phone_number}). Mohon bantuannya untuk menyetujui akun saya.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Konfirmasi via WhatsApp Admin</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                <Link
                  href="/admin"
                  className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Buka Panel Admin (Approve / Reject Demo)</span>
                </Link>
                <Link
                  href="/login"
                  className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all text-center"
                >
                  Kembali ke Halaman Login
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Header Pendaftaran */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-black tracking-wider uppercase text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300">
                    Pendaftaran Akun Baru
                  </span>
                  <a
                    href={whatsappHelpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Bantuan WhatsApp</span>
                  </a>
                </div>

                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Daftar Akun TataDana
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Sudah punya akun?{' '}
                  <Link href="/login" className="text-emerald-600 font-bold hover:underline">
                    Masuk di sini
                  </Link>
                </p>
              </div>

              {/* FORM PENDAFTARAN LANGSUNG (TANPA KODE OTP) */}
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Contoh: Rian Pratama"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                    Nomor Handphone (WhatsApp / Telegram)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Contoh: 081299887766"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="rian@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-800"
                    />
                  </div>
                  {email.toLowerCase().trim() === 'rifkiarifin@gmail.com' && (
                    <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold">Email ini adalah Akun Super Admin</p>
                        <p className="text-amber-800">
                          Email <code className="bg-amber-100 px-1 py-0.5 rounded font-bold font-mono">rifkiarifin@gmail.com</code> sudah terdaftar aktif sebagai akun Admin.
                        </p>
                        <div className="pt-1 flex items-center gap-2">
                          <Link href="/login" className="font-bold underline text-emerald-700 hover:text-emerald-800">
                            Langsung Masuk (Login) →
                          </Link>
                          <span className="text-amber-500">•</span>
                          <span className="text-amber-700">Atau ganti email untuk pendaftar baru</span>
                        </div>
                      </div>
                    </div>
                  )}
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
                      placeholder="Minimal 6 karakter"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-800"
                    />
                  </div>
                </div>

                {/* Pilihan Profil Finansial */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                    Profil Keuangan Anda
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'karyawan', label: '💼 Karyawan', desc: 'Gaji tetap' },
                      { id: 'freelancer', label: '💻 Freelancer', desc: 'Fleksibel' },
                      { id: 'mahasiswa', label: '📚 Mahasiswa', desc: 'Uang saku' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setUserRoleGoal(item.id as any)}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          userRoleGoal === item.id
                            ? 'border-emerald-500 bg-emerald-50/80 text-emerald-800 ring-2 ring-emerald-500/20 font-bold'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="text-xs">{item.label}</div>
                        <div className="text-[10px] text-slate-400">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Penjelasan Verifikasi Approval Admin (Tanpa Kode OTP) */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-xs space-y-1.5">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Verifikasi Persetujuan oleh Administrator</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Tidak perlu kode OTP. Pendaftaran Anda akan langsung diteruskan ke konsol Administrator untuk <strong>Disetujui (Approved)</strong> atau <strong>Ditolak (Rejected)</strong>.
                  </p>
                </div>

                {/* Banner Bantuan WhatsApp */}
                <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-slate-800 truncate">
                        Punya kendala pendaftaran?
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        Hubungi WhatsApp Admin di 0838-5128-4143
                      </p>
                    </div>
                  </div>
                  <a
                    href={whatsappHelpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shrink-0 transition-colors"
                  >
                    Chat WA
                  </a>
                </div>

                {/* Banner Error Terlihat Jelas */}
                {errorMessage && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2 animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center gap-2 font-bold text-rose-900">
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Pendaftaran Tidak Dapat Diproses</span>
                    </div>
                    <p className="leading-relaxed font-medium">{errorMessage}</p>

                    {errorMessage.toLowerCase().includes('email ini sudah terdaftar') && (
                      <div className="pt-2 border-t border-rose-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <span className="text-[11px] text-rose-700">
                          Sudah memiliki akun atau ingin masuk ke Admin?
                        </span>
                        <Link
                          href="/login"
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition-colors inline-flex items-center gap-1.5 shrink-0"
                        >
                          <span>Masuk (Login) Sekarang</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}

                    {errorMessage.toLowerCase().includes('nomor hp ini sudah terdaftar') && (
                      <div className="pt-2 border-t border-rose-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <span className="text-[11px] text-rose-700">
                          Nomor HP ini sudah digunakan akun lain.
                        </span>
                        <Link
                          href="/login"
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition-colors inline-flex items-center gap-1.5 shrink-0"
                        >
                          <span>Login dengan Nomor Ini</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                  >
                    <span>{loading ? 'Mengirim Pendaftaran...' : 'Ajukan Pendaftaran Akun'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
