'use client';

import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, ArrowUpRight, ArrowLeftRight, Check, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function ModalTransaction({ onClose }: { onClose: () => void }) {
  const { currentUser, wallets, categories, refreshData, notify } = useApp();
  const [tab, setTab] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');
  const [targetWalletId, setTargetWalletId] = useState(wallets[1]?.id || '');
  const [categoryId, setCategoryId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!walletId && wallets.length > 0) {
      setWalletId(wallets[0].id);
    }
    if (!targetWalletId && wallets.length > 1) {
      setTargetWalletId(wallets[1].id);
    }
  }, [wallets, walletId, targetWalletId]);

  const filteredCategories = categories.filter((c) => c.type === (tab === 'transfer' ? 'expense' : tab));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseInt(amount.replace(/[^0-9]/g, ''), 10);
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Masukkan nominal transaksi yang valid.');
      return;
    }

    if (tab === 'transfer' && walletId === targetWalletId) {
      setError('Dompet asal dan dompet tujuan transfer tidak boleh sama.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          walletId,
          targetWalletId: tab === 'transfer' ? targetWalletId : undefined,
          categoryId: tab === 'transfer' ? undefined : categoryId || filteredCategories[0]?.id,
          type: tab,
          amount: parsedAmount,
          notes,
          transactionDate: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || 'Gagal menyimpan transaksi.');
        return;
      }

      notify(
        tab === 'expense'
          ? 'Pengeluaran berhasil dicatat!'
          : tab === 'income'
          ? 'Pemasukan berhasil dicatat!'
          : 'Transfer saldo berhasil!'
      );
      await refreshData();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-lg">Catat Transaksi Baru</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex gap-2">
          <button
            type="button"
            onClick={() => setTab('expense')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              tab === 'expense'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => setTab('income')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              tab === 'income'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            Pemasukan
          </button>
          <button
            type="button"
            onClick={() => setTab('transfer')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              tab === 'transfer'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            Transfer
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Nominal (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                Rp
              </span>
              <input
                type="text"
                required
                value={amount}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setAmount(val ? parseInt(val, 10).toLocaleString('id-ID') : '');
                }}
                placeholder="0"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-lg font-bold text-slate-800 placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* Wallets */}
          {tab === 'transfer' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Dari Dompet
                </label>
                <select
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Ke Dompet
                </label>
                <select
                  value={targetWalletId}
                  onChange={(e) => setTargetWalletId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Dompet
                </label>
                <select
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Kategori
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                >
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Catatan
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Makan siang bakso urat"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500 text-slate-700 placeholder:text-slate-400"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
