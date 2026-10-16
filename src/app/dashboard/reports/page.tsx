'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useApp } from '@/context/AppContext';
import {
  formatRupiah,
  formatDateWib,
  formatTimeWib,
} from '@/lib/utils';
import {
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  ChevronRight,
  Receipt,
  Search,
  Filter,
  ArrowUpDown,
  Lock,
  Sparkles,
  History,
  TrendingDown,
  TrendingUp,
  Scale,
} from 'lucide-react';

export default function ReportsPage() {
  const { currentUser, transactions, wallets, categories, notify } = useApp();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterWallet, setFilterWallet] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortCol, setSortCol] = useState<'date' | 'amount' | 'category' | 'wallet'>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportHistory, setExportHistory] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch export history
  const fetchExportHistory = async () => {
    try {
      const res = await fetch(`/api/reports/history?userId=${currentUser?.id || 'usr-admin-rifki'}`);
      const data = await res.json();
      if (data.ok) {
        setExportHistory(data.history || []);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchExportHistory();
  }, [currentUser]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterType, filterWallet, filterCategory, startDate, endDate]);

  // Filter & Search
  let list = transactions.filter((t) => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (filterWallet !== 'all' && t.wallet_id !== filterWallet) return false;
    if (filterCategory !== 'all' && t.category_id !== filterCategory) return false;
    if (startDate && new Date(t.transaction_date) < new Date(startDate)) return false;
    if (endDate && new Date(t.transaction_date) > new Date(endDate + 'T23:59:59')) return false;
    if (search) {
      const q = search.toLowerCase();
      const n = (t.notes || '').toLowerCase();
      const c = (t.category?.name || '').toLowerCase();
      if (!n.includes(q) && !c.includes(q)) return false;
    }
    return true;
  });

  // Sorting
  list = list.sort((a, b) => {
    let cmp = 0;
    if (sortCol === 'date') cmp = new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime();
    else if (sortCol === 'amount') cmp = Number(a.amount) - Number(b.amount);
    else if (sortCol === 'category') cmp = (a.category?.name || '').localeCompare(b.category?.name || '');
    else if (sortCol === 'wallet') cmp = (a.wallet?.name || '').localeCompare(b.wallet?.name || '');
    return sortAsc ? cmp : -cmp;
  });

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  const paginatedList = list.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Summary Metrics
  const totalIncome = list.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = list.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const netCashflow = totalIncome - totalExpense;

  // Top 5 Categories
  const catSums: Record<string, number> = {};
  list.filter((t) => t.type === 'expense').forEach((t) => {
    const name = t.category?.name || 'Lainnya';
    catSums[name] = (catSums[name] || 0) + Number(t.amount);
  });
  const topCategories = Object.entries(catSums)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Export Trigger
  const handleExport = async (format: 'pdf' | 'xlsx') => {
    if (currentUser?.plan === 'starter') {
      notify('Export PDF & Excel adalah fitur khusus paket Pro. Silakan upgrade paketmu.', 'error');
      return;
    }

    setExportLoading(true);
    try {
      const res = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          fileType: format,
          startDate,
          endDate,
          categoryId: filterCategory !== 'all' ? filterCategory : undefined,
          walletId: filterWallet !== 'all' ? filterWallet : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        notify(data.error || 'Gagal generate export', 'error');
        return;
      }

      notify(`File ${format.toUpperCase()} berhasil dibuat! Mengunduh file...`);
      await fetchExportHistory();
      // Trigger download using the URL returned from backend
      const downloadLink = data.export?.download_url || `/api/reports/download?format=${format}&userId=${currentUser?.id}`;
      window.open(downloadLink, '_blank');
    } catch (e: any) {
      notify('Export error: ' + e.message, 'error');
    } finally {
      setExportLoading(false);
    }
  };

  const toggleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else {
      setSortCol(col);
      setSortAsc(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar title="Laporan & Ekspor Keuangan" />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Top Export Banner */}
        <div className="glass-card-polished p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              Ekspor Laporan On-Demand
              {currentUser?.plan === 'starter' && (
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                  Paket Pro Saja
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Unduh laporan transaksi dalam format PDF siap cetak atau berkas Excel (.xlsx).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleExport('pdf')}
              disabled={exportLoading}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all shadow-sm ${
                currentUser?.plan === 'starter'
                  ? 'bg-slate-50 border-slate-200 text-slate-400 hover:border-amber-300'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <FileText className="w-4 h-4 text-rose-500" />
              <span>Ekspor PDF</span>
              {currentUser?.plan === 'starter' && <Lock className="w-3.5 h-3.5 text-amber-500 ml-1" />}
            </button>

            <button
              onClick={() => handleExport('xlsx')}
              disabled={exportLoading}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm ${
                currentUser?.plan === 'starter'
                  ? 'bg-slate-100 border border-slate-200 text-slate-400'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Excel (.xlsx)</span>
              {currentUser?.plan === 'starter' && <Lock className="w-3.5 h-3.5 text-amber-300 ml-1" />}
            </button>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="glass-card-polished p-5 rounded-3xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Pemasukan
              </span>
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-600">
              {formatRupiah(totalIncome)}
            </div>
            <span className="text-xs text-slate-400">Dalam periode terpilih</span>
          </div>

          <div className="glass-card-polished p-5 rounded-3xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Pengeluaran
              </span>
              <TrendingDown className="w-5 h-5 text-rose-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-rose-600">
              {formatRupiah(totalExpense)}
            </div>
            <span className="text-xs text-slate-400">Dalam periode terpilih</span>
          </div>

          <div className="glass-card-polished p-5 rounded-3xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Net Cashflow
              </span>
              <Scale className="w-5 h-5 text-sky-600" />
            </div>
            <div
              className={`mt-2 text-2xl font-black ${
                netCashflow >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {formatRupiah(netCashflow)}
            </div>
            <span className="text-xs text-slate-400">Pemasukan dikurangi pengeluaran</span>
          </div>
        </div>

        {/* Top 5 Categories & Filter Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Top 5 Categories Widget */}
          <div className="glass-card-polished p-5 rounded-3xl space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Top 5 Kategori Pengeluaran
            </h3>
            <div className="space-y-2.5 pt-1">
              {topCategories.length === 0 ? (
                <div className="text-xs text-slate-400 italic">Belum ada pengeluaran</div>
              ) : (
                topCategories.map(([catName, amt], idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 truncate pr-2">{catName}</span>
                    <span className="font-bold text-slate-900 shrink-0">{formatRupiah(amt)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Filters Form */}
          <div className="lg:col-span-3 glass-card-polished p-5 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Filter & Pencarian Laporan Transaksi
              </h3>
              {(search || filterType !== 'all' || filterWallet !== 'all' || filterCategory !== 'all' || startDate || endDate) && (
                <button
                  onClick={() => {
                    setSearch('');
                    setFilterType('all');
                    setFilterWallet('all');
                    setFilterCategory('all');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="text-[11px] font-bold text-rose-600 hover:underline"
                >
                  Reset Filter
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Search Catatan */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Cari Catatan</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Ketik catatan transaksi..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Filter Jenis */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Jenis Transaksi</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="all">Semua Jenis</option>
                  <option value="expense">💸 Pengeluaran</option>
                  <option value="income">💰 Pemasukan</option>
                  <option value="transfer">🔄 Transfer Antar Dompet</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Dompet</label>
                <select
                  value={filterWallet}
                  onChange={(e) => setFilterWallet(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="all">Semua Dompet</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Kategori</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Mulai Tanggal</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Sampai Tanggal</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Transactions Table with Expandable Receipts */}
        <div className="glass-card-polished rounded-3xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="font-bold text-slate-800 text-sm">
              Tabel Laporan ({list.length} Baris Transaksi)
            </div>
            <div className="text-xs text-slate-400">
              Klik baris struk belanja untuk melihat rincian item
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 w-8"></th>
                  <th
                    onClick={() => toggleSort('date')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-700 select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Tanggal</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('category')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-700 select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Kategori</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('wallet')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-700 select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Dompet</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Catatan Transaksi</th>
                  <th
                    onClick={() => toggleSort('amount')}
                    className="py-3 px-6 text-right cursor-pointer hover:text-slate-700 select-none"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Nominal</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                      Tidak ada transaksi pada kriteria filter laporan ini.
                    </td>
                  </tr>
                ) : (
                  paginatedList.map((tx) => {
                    const isExpanded = expandedTxId === tx.id;
                    const hasItems = tx.receipt_items && tx.receipt_items.length > 0;

                    return (
                      <React.Fragment key={tx.id}>
                        <tr
                          onClick={() => hasItems && setExpandedTxId(isExpanded ? null : tx.id)}
                          className={`transition-colors ${
                            hasItems ? 'cursor-pointer hover:bg-slate-50' : 'hover:bg-slate-50/50'
                          } ${isExpanded ? 'bg-emerald-50/40' : ''}`}
                        >
                          <td className="py-3.5 px-4 text-center">
                            {hasItems && (
                              <button className="text-slate-400 hover:text-emerald-600">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 font-medium">
                            {formatDateWib(tx.transaction_date)}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-slate-800">
                            {tx.category?.name || '-'}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                            {tx.wallet?.name || '-'}
                          </td>

                          <td className="py-3.5 px-4 text-slate-700">
                            <div className="flex items-center gap-2">
                              <span>{tx.notes || '-'}</span>
                              {hasItems && (
                                <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Receipt className="w-3 h-3" /> {tx.receipt_items?.length} Item Struk
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-6 text-right whitespace-nowrap">
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
                        </tr>

                        {/* Expandable Multi-item Receipt Row (Part 3) */}
                        {isExpanded && hasItems && (
                          <tr className="bg-slate-50/80 border-b border-slate-100">
                            <td colSpan={6} className="py-3 px-8">
                              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-2">
                                <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                                  <Receipt className="w-4 h-4 text-emerald-600" />
                                  <span>Rincian Item Foto Struk:</span>
                                </div>
                                <div className="divide-y divide-slate-100">
                                  {tx.receipt_items?.map((item) => (
                                    <div
                                      key={item.id}
                                      className="py-2 flex items-center justify-between text-xs"
                                    >
                                      <div>
                                        <span className="font-semibold text-slate-800">
                                          {item.item_name}
                                        </span>
                                        <span className="text-slate-400 ml-2">
                                          ({item.quantity}x @ {formatRupiah(item.price)})
                                        </span>
                                      </div>
                                      <div className="font-bold text-slate-800">
                                        {formatRupiah(item.subtotal)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls (Part 3) */}
          <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-50/50">
            <div className="flex items-center gap-2 text-slate-500">
              <span>Menampilkan</span>
              <span className="font-bold text-slate-800">
                {list.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, list.length)}
              </span>
              <span>dari</span>
              <span className="font-bold text-slate-800">{list.length}</span>
              <span>transaksi</span>
              <span className="mx-2">•</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="py-1 px-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none"
              >
                <option value={10}>10 per halaman</option>
                <option value={25}>25 per halaman</option>
                <option value={50}>50 per halaman</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-all"
              >
                Sebelumnya
              </button>

              <div className="flex items-center gap-1 px-2 font-bold text-slate-700">
                Halaman {currentPage} dari {totalPages}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-all"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </div>

        {/* Saved Export History Card (Part 3) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Riwayat Ekspor Laporan (Tersimpan)
                </h3>
                <p className="text-xs text-slate-500">
                  Unduh ulang berkas laporan PDF atau Excel yang sudah pernah di-generate tanpa harus menunggu proses ulang.
                </p>
              </div>
            </div>
            <button
              onClick={fetchExportHistory}
              className="text-xs text-emerald-600 hover:underline font-bold"
            >
              Segarkan
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Nama Berkas</th>
                  <th className="py-2.5 px-4">Format</th>
                  <th className="py-2.5 px-4">Periode Laporan</th>
                  <th className="py-2.5 px-4">Ukuran</th>
                  <th className="py-2.5 px-4">Tanggal Dibuat</th>
                  <th className="py-2.5 px-4 text-right">Aksi Unduh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exportHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Belum ada riwayat ekspor. Klik tombol Ekspor PDF atau Excel di bagian atas untuk mengunduh laporan pertama.
                    </td>
                  </tr>
                ) : (
                  exportHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-800 flex items-center gap-2">
                        {item.file_type === 'pdf' ? (
                          <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                        ) : (
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                        <span className="truncate max-w-xs">{item.file_name}</span>
                      </td>
                      <td className="py-3 px-4 uppercase font-extrabold text-[10px]">
                        <span
                          className={`px-2 py-0.5 rounded-full ${
                            item.file_type === 'pdf'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {item.file_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{item.date_range}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {item.file_size_bytes ? `${Math.round(item.file_size_bytes / 1024)} KB` : '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{formatDateWib(item.created_at)}</td>
                      <td className="py-3 px-4 text-right">
                        <a
                          href={item.download_url || `/api/reports/download?id=${item.id}&userId=${currentUser?.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 font-bold text-slate-700 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh Ulang</span>
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
