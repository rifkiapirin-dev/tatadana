'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import { useApp } from '@/context/AppContext';
import {
  formatRupiah,
  formatDateWib,
  formatTimeWib,
  generateProgressBar,
} from '@/lib/utils';
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Circle,
  ExternalLink,
  Calendar,
  Sparkles,
  Receipt,
  Mic,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardOverviewPage() {
  const { currentUser, wallets, budgets, transactions, isLoading } = useApp();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  // Filtered transactions based on selected period
  const now = new Date();
  const filteredTx = transactions.filter((t) => {
    const tDate = new Date(t.transaction_date);
    if (period === 'daily') {
      return tDate.toDateString() === now.toDateString();
    } else if (period === 'weekly') {
      const past7Days = new Date(now.getTime() - 7 * 86400000);
      return tDate >= past7Days;
    } else if (period === 'monthly') {
      return tDate.getFullYear() === now.getFullYear() && tDate.getMonth() === now.getMonth();
    } else if (period === 'yearly') {
      return tDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  // Stats calculation based on filtered period
  const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);
  const totalIncome = filteredTx
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = filteredTx
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalBudgetLimit = budgets.reduce((sum, b) => sum + Number(b.monthly_limit), 0);
  const remainingBudget = Math.max(0, totalBudgetLimit - totalExpense);

  // Category breakdown for pie chart representation based on active period
  const expenseByCategory: Record<string, { name: string; amount: number; color: string }> = {};
  filteredTx
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const cName = t.category?.name || 'Lainnya';
      const cColor = t.category?.color || '#10b981';
      if (!expenseByCategory[cName]) {
        expenseByCategory[cName] = { name: cName, amount: 0, color: cColor };
      }
      expenseByCategory[cName].amount += Number(t.amount);
    });

  const categoryList = Object.values(expenseByCategory).sort((a, b) => b.amount - a.amount);

  // Trend Pengeluaran Harian Bulan Ini (Part 3 requirement)
  const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyExpenseMap: Record<number, number> = {};
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    dailyExpenseMap[d] = 0;
  }
  transactions
    .filter((t) => {
      const d = new Date(t.transaction_date);
      return t.type === 'expense' && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .forEach((t) => {
      const day = new Date(t.transaction_date).getDate();
      dailyExpenseMap[day] = (dailyExpenseMap[day] || 0) + Number(t.amount);
    });

  const dailyTrendData = Object.entries(dailyExpenseMap).map(([day, amount]) => ({
    day: Number(day),
    amount,
  }));
  const maxDailyExpense = Math.max(1, ...dailyTrendData.map((d) => d.amount));

  // 6 months cashflow chart data
  const monthData = [
    { month: 'Mei', inc: 12000000, exp: 9500000 },
    { month: 'Jun', inc: 13500000, exp: 11200000 },
    { month: 'Jul', inc: 14000000, exp: 10800000 },
    { month: 'Ags', inc: 14500000, exp: 12100000 },
    { month: 'Sep', inc: 15000000, exp: 11900000 },
    { month: 'Okt', inc: 15000000, exp: 6250000 },
  ];

  // 10 recent transactions
  const recentTransactions = transactions.slice(0, 10);

  // Onboarding Checklist
  const onboardingSteps = [
    { title: 'Hubungkan Akun Telegram', done: true, href: '/dashboard/settings' },
    { title: 'Konfigurasi Dompet Utama (BCA/Mandiri/GoPay)', done: wallets.length > 0, href: '/dashboard/wallets' },
    { title: 'Tetapkan Budget Bulanan Kategori Pengeluaran', done: budgets.length > 0, href: '/dashboard/budgets' },
    { title: 'Coba Catat Transaksi Pertama via Telegram Bot', done: transactions.length > 0, href: '/dashboard/settings' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar title="Beranda Ringkasan" />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 sm:space-y-8">
        {/* Header greeting & Period Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Selamat datang kembali, {currentUser?.full_name || 'Budi'}! 👋
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Catatan keuanganmu bulan ini terpusat dan tersinkronisasi otomatis via Telegram.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 overflow-x-auto no-scrollbar max-w-full">
            {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((p) => {
              const labels = {
                daily: 'Harian',
                weekly: 'Mingguan',
                monthly: 'Bulan Ini',
                yearly: 'Tahunan',
              };
              return (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                    period === p
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {labels[p]}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Saldo - Aurora Hero Card with Sheen */}
          <div className="aurora-hero-polished p-5 rounded-3xl text-white">
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
                  Saldo Total
                </span>
                <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-extrabold text-white">
                  {formatRupiah(totalBalance)}
                </div>
                <div className="text-xs text-white/90 mt-1 flex items-center gap-1 font-medium">
                  <span className="text-white font-bold">{wallets.length} Dompet</span> aktif terhubung
                </div>
              </div>
            </div>
          </div>

          {/* Pemasukan Bulan Ini */}
          <div className="glass-card-polished p-5 rounded-3xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Pemasukan Bulan Ini
              </span>
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-emerald-600">
                {formatRupiah(totalIncome)}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
                <span className="text-emerald-600 font-bold">+12%</span> dibanding bulan lalu
              </div>
            </div>
          </div>

          {/* Pengeluaran Bulan Ini */}
          <div className="glass-card-polished p-5 rounded-3xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Pengeluaran Bulan Ini
              </span>
              <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-rose-600">
                {formatRupiah(totalExpense)}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
                <span className="text-rose-500 font-bold">
                  {totalIncome > 0 ? `${Math.round((totalExpense / totalIncome) * 100)}%` : '0%'}
                </span>{' '}
                dari total pemasukan
              </div>
            </div>
          </div>

          {/* Sisa Budget */}
          <div className="glass-card-polished p-5 rounded-3xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Budget Tersisa
              </span>
              <div className="w-9 h-9 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-900">
                {formatRupiah(remainingBudget)}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
                Dari total limit{' '}
                <span className="font-bold text-slate-700">{formatRupiah(totalBudgetLimit)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Onboarding Checklist Widget */}
        <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                  Onboarding Step
                </span>
                <h3 className="font-bold text-lg text-white">Langkah Awal Memulai TataDana</h3>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Ikuti langkah berikut agar pencatatan keuangan otomatis berjalan lancar.
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-400">
                {onboardingSteps.filter((s) => s.done).length}/{onboardingSteps.length}
              </span>
              <span className="text-xs text-slate-300 block">Selesai</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            {onboardingSteps.map((step, idx) => (
              <Link
                key={idx}
                href={step.href}
                className={`p-3 rounded-2xl border transition-all flex items-start gap-2.5 ${
                  step.done
                    ? 'bg-emerald-800/30 border-emerald-700/50 hover:bg-emerald-800/50'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                {step.done ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                )}
                <span className="text-xs font-semibold text-slate-100">{step.title}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart: 6 Bulan Terakhir Pemasukan vs Pengeluaran */}
          <div className="lg:col-span-2 glass-card-polished p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Pemasukan vs Pengeluaran 6 Bulan Terakhir
                </h3>
                <p className="text-xs text-slate-500">Perbandingan arus kas bulanan</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-emerald-500" />
                  <span>Pemasukan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-rose-400" />
                  <span>Pengeluaran</span>
                </div>
              </div>
            </div>

            {/* Custom Clean Bar Chart Visualization */}
            <div className="pt-6 pb-2">
              <div className="flex items-end justify-between gap-3 h-52">
                {monthData.map((d, i) => {
                  const maxVal = 16000000;
                  const incHeight = Math.round((d.inc / maxVal) * 100);
                  const expHeight = Math.round((d.exp / maxVal) * 100);

                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="w-full flex items-end justify-center gap-1.5 h-full">
                        {/* Income Bar */}
                        <div
                          style={{ height: `${incHeight}%` }}
                          className="w-1/2 max-w-[24px] bg-emerald-500 rounded-t-lg transition-all group-hover:bg-emerald-600 relative group/bar"
                        >
                          <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-10 transition-opacity">
                            {formatRupiah(d.inc)}
                          </div>
                        </div>
                        {/* Expense Bar */}
                        <div
                          style={{ height: `${expHeight}%` }}
                          className="w-1/2 max-w-[24px] bg-rose-400 rounded-t-lg transition-all group-hover:bg-rose-500 relative group/bar"
                        >
                          <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-10 transition-opacity">
                            {formatRupiah(d.exp)}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-500">{d.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Pie Chart: Pengeluaran per Kategori */}
          <div className="glass-card-polished p-6 rounded-3xl space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Pengeluaran per Kategori</h3>
              <p className="text-xs text-slate-500">Breakdown pos pengeluaran bulan ini</p>
            </div>

            <div className="space-y-3 pt-2">
              {categoryList.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Belum ada pengeluaran bulan ini.</p>
              ) : (
                categoryList.map((cat, i) => {
                  const pct = totalExpense > 0 ? Math.round((cat.amount / totalExpense) * 100) : 0;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">{cat.name}</span>
                        <span className="font-bold text-slate-900">{formatRupiah(cat.amount)} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%`, backgroundColor: cat.color }}
                          className="h-full rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Trend Line Pengeluaran Harian Bulan Ini (Part 3 requirement) */}
        <div className="glass-card-polished p-6 rounded-3xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Trend Pengeluaran Harian Bulan Ini
              </h3>
              <p className="text-xs text-slate-500">
                Pola ritme pengeluaran per tanggal untuk evaluasi cashflow
              </p>
            </div>
            <div className="text-xs text-slate-500">
              Pengeluaran tertinggi:{' '}
              <span className="font-bold text-rose-600">{formatRupiah(maxDailyExpense)}</span>
            </div>
          </div>

          <div className="pt-6 pb-2">
            <div className="flex items-end justify-between gap-1 sm:gap-2 h-40">
              {dailyTrendData.map((item) => {
                const heightPct = Math.max(4, Math.round((item.amount / maxDailyExpense) * 100));
                const hasExpense = item.amount > 0;
                return (
                  <div
                    key={item.day}
                    className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative"
                  >
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full max-w-[18px] rounded-t-md transition-all relative ${
                        hasExpense
                          ? 'bg-rose-500 group-hover:bg-rose-600'
                          : 'bg-slate-100 group-hover:bg-slate-200'
                      }`}
                    >
                      {hasExpense && (
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-20 transition-opacity">
                          Tgl {item.day}: {formatRupiah(item.amount)}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-slate-700">
                      {item.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 10 Transaksi Terbaru */}
        <div className="glass-card-polished rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">10 Transaksi Terbaru</h3>
              <p className="text-xs text-slate-500">
                Pencatatan dari Web Dashboard dan Telegram Bot
              </p>
            </div>
            <Link
              href="/dashboard/transactions"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
            >
              Lihat Semua Transaksi
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Belum ada transaksi yang dicatat.
              </div>
            ) : (
              recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="py-3.5 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-2xl transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                        tx.type === 'expense'
                          ? 'bg-rose-50 text-rose-600'
                          : tx.type === 'income'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-sky-50 text-sky-600'
                      }`}
                    >
                      {tx.type === 'expense' ? (
                        <ArrowDownRight className="w-5 h-5" />
                      ) : tx.type === 'income' ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <TrendingUp className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {tx.notes || tx.category?.name || 'Transaksi'}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{formatDateWib(tx.transaction_date)}</span>
                        <span>•</span>
                        <span className="font-medium text-slate-600">{tx.wallet?.name}</span>
                        {tx.is_ocr && (
                          <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 text-[10px] font-bold px-1.5 py-0.2 rounded-md">
                            <Receipt className="w-3 h-3" /> Foto Struk AI
                          </span>
                        )}
                        {tx.source === 'telegram_voice' && (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-bold px-1.5 py-0.2 rounded-md">
                            <Mic className="w-3 h-3" /> Voice Note AI
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-sm font-extrabold ${
                        tx.type === 'expense'
                          ? 'text-rose-600'
                          : tx.type === 'income'
                          ? 'text-emerald-600'
                          : 'text-sky-600'
                      }`}
                    >
                      {tx.type === 'expense' ? '-' : '+'} {formatRupiah(tx.amount)}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {tx.category?.name || 'Transfer'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
