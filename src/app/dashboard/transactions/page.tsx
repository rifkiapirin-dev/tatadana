'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import { useApp } from '@/context/AppContext';
import {
  formatRupiah,
  formatDateWib,
  formatTimeWib,
} from '@/lib/utils';
import {
  Search,
  Filter,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  Trash2,
  Receipt,
  Mic,
  Calendar,
} from 'lucide-react';
import ModalTransaction from '@/components/ModalTransaction';

export default function TransactionsPage() {
  const { currentUser, transactions, wallets, categories, refreshData, notify } = useApp();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterWallet, setFilterWallet] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Filter transactions
  const filtered = transactions.filter((t) => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (filterWallet !== 'all' && t.wallet_id !== filterWallet && t.target_wallet_id !== filterWallet) return false;
    if (filterCategory !== 'all' && t.category_id !== filterCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      const notes = (t.notes || '').toLowerCase();
      const cat = (t.category?.name || '').toLowerCase();
      const wal = (t.wallet?.name || '').toLowerCase();
      if (!notes.includes(q) && !cat.includes(q) && !wal.includes(q)) return false;
    }
    return true;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus transaksi ini?')) return;
    try {
      const res = await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        notify('Transaksi berhasil dihapus');
        await refreshData();
      }
    } catch (err: any) {
      notify('Gagal menghapus: ' + err.message, 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar title="Daftar Transaksi" />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[240px] flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari transaksi berdasarkan catatan..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Filter Jenis */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="py-2.5 px-3 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">Semua Jenis</option>
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
              <option value="transfer">Transfer</option>
            </select>

            {/* Filter Wallet */}
            <select
              value={filterWallet}
              onChange={(e) => setFilterWallet(e.target.value)}
              className="py-2.5 px-3 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">Semua Dompet</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>

            {/* Filter Kategori */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="py-2.5 px-3 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white text-xs font-bold shadow-md shadow-cyan-500/25 shrink-0 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Transaksi</span>
          </button>
        </div>

        {/* Transactions Table Card */}
        <div className="glass-card-polished rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Waktu & Tanggal</th>
                  <th className="py-3.5 px-4">Jenis</th>
                  <th className="py-3.5 px-4">Kategori / Pos</th>
                  <th className="py-3.5 px-4">Dompet</th>
                  <th className="py-3.5 px-4">Catatan & Sumber</th>
                  <th className="py-3.5 px-6 text-right">Nominal</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                      Tidak ada transaksi yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 whitespace-nowrap text-slate-600 font-medium">
                        {formatDateWib(tx.transaction_date)}
                        <span className="block text-[10px] text-slate-400">
                          {formatTimeWib(tx.transaction_date)}
                        </span>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                            tx.type === 'expense'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : tx.type === 'income'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-sky-50 text-sky-700 border border-sky-200'
                          }`}
                        >
                          {tx.type === 'expense' && <ArrowDownRight className="w-3.5 h-3.5" />}
                          {tx.type === 'income' && <ArrowUpRight className="w-3.5 h-3.5" />}
                          {tx.type === 'transfer' && <ArrowLeftRight className="w-3.5 h-3.5" />}
                          {tx.type === 'expense'
                            ? 'Pengeluaran'
                            : tx.type === 'income'
                            ? 'Pemasukan'
                            : 'Transfer'}
                        </span>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap font-semibold text-slate-800">
                        {tx.category?.name || '-'}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap text-slate-600">
                        {tx.wallet?.name}
                        {tx.target_wallet && (
                          <span className="text-slate-400 text-[10px] block">
                            → {tx.target_wallet.name}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-slate-700">
                        <div className="font-medium">{tx.notes || '-'}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {tx.source === 'telegram_text' && (
                            <span className="text-[10px] text-sky-600 bg-sky-50 px-1.5 py-0.2 rounded font-semibold">
                              Telegram Chat
                            </span>
                          )}
                          {tx.is_ocr && (
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold flex items-center gap-1">
                              <Receipt className="w-3 h-3" /> Struk OCR AI
                            </span>
                          )}
                          {tx.source === 'telegram_voice' && (
                            <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-semibold flex items-center gap-1">
                              <Mic className="w-3 h-3" /> Voice Note
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <span
                          className={`font-black text-sm ${
                            tx.type === 'expense'
                              ? 'text-rose-600'
                              : tx.type === 'income'
                              ? 'text-emerald-600'
                              : 'text-sky-600'
                          }`}
                        >
                          {tx.type === 'expense' ? '-' : '+'} {formatRupiah(tx.amount)}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(tx.id)}
                          title="Hapus transaksi"
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddModal && <ModalTransaction onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
