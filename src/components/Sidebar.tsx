'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  CreditCard,
  BarChart3,
  Target,
  Wallet,
  Settings,
  ShieldAlert,
  Sparkles,
  LogOut,
  X,
  Shield,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { currentUser, isImpersonating, switchUser, isMobileMenuOpen, closeMobileMenu } = useApp();

  const navItems = [
    { label: 'Beranda', href: '/dashboard', icon: Home },
    { label: 'Transaksi', href: '/dashboard/transactions', icon: CreditCard },
    { label: 'Laporan', href: '/dashboard/reports', icon: BarChart3 },
    { label: 'Budget', href: '/dashboard/budgets', icon: Target },
    { label: 'Wallet', href: '/dashboard/wallets', icon: Wallet },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const renderContent = (isMobile = false) => (
    <div className="flex flex-col justify-between h-full">
      <div>
        {/* Header / Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
          <Link
            href="/dashboard"
            onClick={() => isMobile && closeMobileMenu()}
            className="flex items-center gap-2.5"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-md shadow-cyan-500/25 text-white font-black text-lg">
              TD
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900">
                Tata<span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">Dana</span>
              </span>
              <span className="text-[10px] block font-medium text-slate-400 uppercase tracking-wider">
                Fintech SaaS
              </span>
            </div>
          </Link>

          {isMobile && (
            <button
              onClick={closeMobileMenu}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Tutup menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Impersonation Banner if active */}
        {isImpersonating && (
          <div className="mx-4 mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-amber-800 font-semibold">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Mode Impersonasi</span>
            </div>
            <Link
              href="/admin"
              onClick={() => isMobile && closeMobileMenu()}
              className="text-[11px] bg-amber-600 text-white px-2 py-0.5 rounded-lg hover:bg-amber-700"
            >
              Keluar
            </Link>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-220px)]">
          <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Menu Utama
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => isMobile && closeMobileMenu()}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-50/80 to-cyan-50/80 text-emerald-800 font-semibold shadow-sm border border-cyan-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Tampilan Administrator: Khusus Akun Admin & Superadmin */}
          {(currentUser?.role === 'admin' || currentUser?.role === 'superadmin') && (
            <>
              <div className="pt-4 px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Administrator</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 text-[9px] font-extrabold border border-emerald-300">
                  ADMIN ONLY
                </span>
              </div>
              <Link
                href="/admin"
                onClick={() => isMobile && closeMobileMenu()}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  pathname.startsWith('/admin')
                    ? 'bg-gradient-to-r from-emerald-50/80 to-cyan-50/80 text-emerald-800 font-semibold shadow-sm border border-cyan-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Shield className={`w-5 h-5 ${pathname.startsWith('/admin') ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>Panel Admin</span>
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* User profile & Plan badge */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-100 to-cyan-100 text-teal-800 font-bold flex items-center justify-center text-xs shrink-0">
              {currentUser?.full_name?.charAt(0) || 'R'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">
                {currentUser?.full_name || 'Rifki Arifin (Admin)'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`inline-block text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded-md ${
                    currentUser?.plan === 'pro'
                      ? 'bg-gradient-to-r from-emerald-100 to-cyan-100 text-emerald-800 border border-cyan-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {currentUser?.plan === 'pro' ? '★ PRO' : 'STARTER'}
                </span>
                <span className="text-[10px] text-slate-400 truncate">
                  {currentUser?.plan === 'starter' ? `${currentUser.monthly_txn_count || 0}/50` : 'Unlimited'}
                </span>
              </div>
            </div>
          </div>
          <Link
            href="/login"
            onClick={() => isMobile && closeMobileMenu()}
            title="Keluar"
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Sidebar (Hanya tampil di layar besar lg: ke atas) */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col justify-between h-screen sticky top-0 z-30 select-none shrink-0">
        {renderContent(false)}
      </aside>

      {/* 2. Mobile Drawer Sidebar (Tampil melayang saat isMobileMenuOpen = true) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop Blur Gelap */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <aside
            className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col justify-between select-none z-10 animate-in slide-in-from-left duration-200"
            role="dialog"
            aria-modal="true"
          >
            {renderContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
