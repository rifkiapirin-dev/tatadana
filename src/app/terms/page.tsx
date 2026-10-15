import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-8 flex justify-center">
      <div className="max-w-3xl w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </Link>
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-emerald-600" />
          <h1 className="text-2xl font-black text-slate-900">Syarat & Ketentuan Layanan</h1>
        </div>
        <p className="text-xs text-slate-500">Terakhir diperbarui: Oktober 2026</p>
        <div className="space-y-4 text-xs leading-relaxed text-slate-700">
          <p>
            Dengan menggunakan layanan TataDana via Web Dashboard maupun bot Telegram, Anda menyetujui ketentuan penggunaan layanan ini.
          </p>
          <h2 className="font-bold text-sm text-slate-900 pt-2">1. Akun dan Batasan Penggunaan</h2>
          <p>
            Paket Starter dibatasi maksimal 50 transaksi per bulan kalender. Pengguna paket Pro menikmati akses tidak terbatas serta fitur AI OCR dan Financial Advisor.
          </p>
          <h2 className="font-bold text-sm text-slate-900 pt-2">2. Bot Telegram & Webhook</h2>
          <p>
            Pengguna bertanggung jawab untuk menjaga kerahasiaan token bot Telegram pribadi mereka. TataDana menerapkan sistem pencegahan transaksi ganda (idempotency) untuk menjaga akurasi saldo.
          </p>
          <h2 className="font-bold text-sm text-slate-900 pt-2">3. Pembayaran</h2>
          <p>
            Pembayaran diproses melalui payment gateway berizin resmi (Midtrans) atau konfirmasi manual dari tim finance TataDana.
          </p>
        </div>
      </div>
    </div>
  );
}
