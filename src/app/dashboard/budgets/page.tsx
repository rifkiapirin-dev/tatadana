'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import { useApp } from '@/context/AppContext';
import { formatRupiah, generateProgressBar } from '@/lib/utils';
import { Target, Plus, AlertTriangle, CheckCircle2, AlertCircle, Sparkles, X } from 'lucide-react';

export default function BudgetsPage() {
  const { currentUser, budgets, categories, refreshData, notify } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanLimit = parseInt(monthlyLimit.replace(/[^0-9]/g, ''), 10);
    if (!cleanLimit || cleanLimit <= 0) {
      setError('Masukkan limit budget yang valid.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          categoryId: categoryId || expenseCategories[0]?.id,
          monthlyLimit: cleanLimit,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || 'Gagal menyimpan budget.');
        return;
      }

      notify('Budget kategori berhasil disimpan!');
      await refreshData();
      setShowAddModal(false);
      setMonthlyLimit('');
    } catch (e: any) {
      setError(e.message || 'Terjadi kesalahan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar title="Manajemen Budget Bulanan" />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Target & Alokasi Budget Kategori
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Atur batas belanja per kategori. Bot Telegram akan otomatis mengirim alert saat pemakaian mencapai 80% dan 100%.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white text-xs font-bold shadow-md shadow-cyan-500/25 shrink-0 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Set Budget Kategori</span>
          </button>
        </div>

        {/* Budget Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {budgets.map((b) => {
            const spent = b.current_spent || 0;
            const limit = b.monthly_limit;
            const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
            const remaining = Math.max(0, limit - spent);
            const isExceeded = pct >= 100;
            const isWarning = pct >= 80 && pct < 100;

            return (
              <div
                key={b.id}
                className="glass-card-polished p-6 rounded-3xl space-y-4 relative overflow-hidden"
              >
                {/* Alert Badge Header */}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-800">
                    {b.category?.name || 'Kategori'}
                  </span>
                  {isExceeded ? (
                    <span className="flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      100% OVERBUDGET
                    </span>
                  ) : isWarning ? (
                    <span className="flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      80% PERINGATAN
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      AMAN
                    </span>
                  )}
                </div>

                {/* Amounts */}
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-black text-slate-900">{formatRupiah(spent)}</span>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      dari target {formatRupiah(limit)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-lg font-black ${
                        isExceeded ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'
                      }`}
                    >
                      {pct}%
                    </span>
                    <span className="text-[10px] text-slate-400 block">terpakai</span>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, pct)}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        isExceeded
                          ? 'bg-rose-500'
                          : isWarning
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span>Sisa: {formatRupiah(remaining)}</span>
                    <span className="font-mono text-[10px]">[{generateProgressBar(pct, 8)}]</span>
                  </div>
                </div>

                {/* Telegram Alert Note */}
                <div className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {isExceeded
                    ? '🔔 Notifikasi Telegram 100% telah dikirimkan ke chat pribadimu.'
                    : isWarning
                    ? '⚠️ Notifikasi Telegram 80% telah dikirimkan ke chat pribadimu.'
                    : '✅ Pengeluaran berada dalam batas aman.'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Set Budget Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Tetapkan Budget Kategori</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Pilih Kategori
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                >
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Batas Bulanan (Rp)
                </label>
                <input
                  type="text"
                  required
                  value={monthlyLimit}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setMonthlyLimit(val ? parseInt(val, 10).toLocaleString('id-ID') : '');
                  }}
                  placeholder="Contoh: 1.500.000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                />
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
