import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-8 flex justify-center">
      <div className="max-w-3xl w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </Link>
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-emerald-600" />
          <h1 className="text-2xl font-black text-slate-900">Kebijakan Privasi TataDana</h1>
        </div>
        <p className="text-xs text-slate-500">Terakhir diperbarui: Oktober 2026</p>
        <div className="space-y-4 text-xs leading-relaxed text-slate-700">
          <p>
            TataDana berkomitmen penuh untuk melindungi privasi data finansial Anda. Seluruh data transaksi, nominal dompet, dan foto struk disimpan secara aman di database PostgreSQL Supabase dengan Row-Level Security (RLS).
          </p>
          <h2 className="font-bold text-sm text-slate-900 pt-2">1. Data yang Dikumpulkan</h2>
          <p>
            Kami hanya mengumpulkan data yang diperlukan untuk pencatatan keuangan: nomor handphone/ID Telegram untuk linking akun, catatan transaksi, nominal, dan foto struk belanja yang Anda unggah secara sukarela.
          </p>
          <h2 className="font-bold text-sm text-slate-900 pt-2">2. Penggunaan AI dan Enkripsi</h2>
          <p>
            Ekstraksi teks dan struk diproses melalui API terenkripsi. Data transaksi Anda tidak pernah dijual atau digunakan untuk melatih model publik.
          </p>
          <h2 className="font-bold text-sm text-slate-900 pt-2">3. Audit Log Admin</h2>
          <p>
            Staf administrasi TataDana hanya dapat mengakses data transaksi spesifik atas permintaan dukungan teknis, dan setiap akses dicatat secara otomatis dalam audit log yang tidak dapat diubah.
          </p>
        </div>
      </div>
    </div>
  );
}
