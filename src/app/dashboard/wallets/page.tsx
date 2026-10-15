'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import { useApp } from '@/context/AppContext';
import { formatRupiah } from '@/lib/utils';
import {
  Wallet as WalletIcon,
  Plus,
  CheckCircle2,
  Trash2,
  CreditCard,
  Landmark,
  Smartphone,
  Star,
  X,
} from 'lucide-react';

export default function WalletsPage() {
  const { currentUser, wallets, refreshData, notify } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'bank' | 'ewallet' | 'cash'>('bank');
  const [balance, setBalance] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSetDefault = async (walletId: string) => {
    try {
      const res = await fetch('/api/wallets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: walletId, updates: { is_default: true } }),
      });
      if (res.ok) {
        notify('Dompet default Telegram berhasil diubah!');
        await refreshData();
      }
    } catch (e: any) {
      notify('Gagal set default: ' + e.message, 'error');
    }
  };

  const handleDelete = async (walletId: string) => {
    if (wallets.length <= 1) {
      notify('Minimal harus menyisakan 1 dompet aktif.', 'error');
      return;
    }
    if (!confirm('Hapus dompet ini?')) return;

    try {
      const res = await fetch(`/api/wallets?id=${walletId}`, { method: 'DELETE' });
      if (res.ok) {
        notify('Dompet berhasil dihapus!');
        await refreshData();
      }
    } catch (e: any) {
      notify('Gagal menghapus: ' + e.message, 'error');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedBalance = parseInt(balance.replace(/[^0-9]/g, ''), 10) || 0;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          name,
          type,
          balance: parsedBalance,
          is_default: isDefault,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || 'Gagal membuat dompet.');
        return;
      }

      notify('Dompet baru berhasil ditambahkan!');
      await refreshData();
      setShowAddModal(false);
      setName('');
      setBalance('');
    } catch (e: any) {
      setError(e.message || 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar title="Manajemen Dompet (Multi Wallet)" />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Daftar Dompet & Akun Keuangan
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Atur dompet rekening bank, e-wallet, atau uang tunai. Dompet default ditandai bintang (★) untuk pencatatan otomatis Telegram.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white text-xs font-bold shadow-md shadow-cyan-500/25 shrink-0 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Dompet Baru</span>
          </button>
        </div>

        {/* Wallets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {wallets.map((w) => (
            <div
              key={w.id}
              className={`glass-card-polished p-6 rounded-3xl space-y-4 relative overflow-hidden ${
                w.is_default ? 'border-cyan-500/80 ring-2 ring-cyan-500/20' : ''
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-sm"
                    style={{ backgroundColor: w.color || '#10B981' }}
                  >
                    {w.type === 'bank' ? (
                      <Landmark className="w-5 h-5" />
                    ) : w.type === 'ewallet' ? (
                      <Smartphone className="w-5 h-5" />
                    ) : (
                      <WalletIcon className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{w.name}</h3>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      {w.type === 'bank' ? 'Rekening Bank' : w.type === 'ewallet' ? 'E-Wallet' : 'Tunai / Cash'}
                    </span>
                  </div>
                </div>

                {w.is_default && (
                  <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                    DEFAULT BOT
                  </span>
                )}
              </div>

              {/* Balance */}
              <div>
                <span className="text-xs text-slate-400 font-medium">Saldo Dompet</span>
                <div className="text-2xl font-black text-slate-900 mt-0.5">
                  {formatRupiah(w.balance)}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                {!w.is_default ? (
                  <button
                    onClick={() => handleSetDefault(w.id)}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <Star className="w-3.5 h-3.5" />
                    Jadikan Default
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Digunakan di Telegram
                  </span>
                )}

                <button
                  onClick={() => handleDelete(w.id)}
                  title="Hapus dompet"
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Wallet Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Tambah Dompet Baru</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              {error && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Nama Dompet
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: BCA Tabungan, GoPay, OVO"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Tipe Dompet
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                >
                  <option value="bank">Rekening Bank (BCA, Mandiri, BRI, BNI)</option>
                  <option value="ewallet">E-Wallet (GoPay, OVO, Dana, ShopeePay)</option>
                  <option value="cash">Uang Tunai / Cash Fisik</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Saldo Awal (Rp)
                </label>
                <input
                  type="text"
                  value={balance}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setBalance(val ? parseInt(val, 10).toLocaleString('id-ID') : '');
                  }}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="defWallet"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="defWallet" className="text-xs font-medium text-slate-700">
                  Jadikan dompet utama untuk transaksi Telegram
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
