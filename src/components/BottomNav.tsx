'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CreditCard, BarChart3, Plus, Menu, Shield } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import ModalTransaction from './ModalTransaction';

export default function BottomNav() {
  const pathname = usePathname();
  const { toggleMobileMenu, currentUser } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);

  const navItems = [
    { label: 'Beranda', href: '/dashboard', icon: Home },
    { label: 'Transaksi', href: '/dashboard/transactions', icon: CreditCard },
  ];

  const rightNavItems = [
    { label: 'Laporan', href: '/dashboard/reports', icon: BarChart3 },
  ];

  return (
    <>
      <nav
        aria-label="Navigasi Bawah Mobile"
        className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 z-40 px-3 py-2 shadow-lg"
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {/* Navigasi Kiri */}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 py-1 text-center transition-all ${
                  isActive ? 'text-emerald-600 font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
              </Link>
            );
          })}

          {/* Tombol Tengah FAB Catat */}
          <div className="flex flex-col items-center justify-center flex-1 -mt-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all"
              title="Catat Transaksi Cepat"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
            <span className="text-[10px] mt-1 font-bold text-emerald-700">Catat</span>
          </div>

          {/* Navigasi Kanan */}
          {rightNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 py-1 text-center transition-all ${
                  isActive ? 'text-emerald-600 font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
              </Link>
            );
          })}

          {/* Tombol Menu (Buka Drawer Lengkap: Budget, Wallet, Settings, Admin) */}
          <button
            onClick={toggleMobileMenu}
            className="flex flex-col items-center justify-center flex-1 py-1 text-center text-slate-400 hover:text-slate-700 transition-all relative"
          >
            <Menu className="w-5 h-5 text-slate-500" />
            <span className="text-[10px] mt-1 tracking-tight font-medium text-slate-500">Menu</span>
            {(currentUser?.role === 'admin' || currentUser?.role === 'superadmin') && (
              <span className="absolute top-0.5 right-4 w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>
        </div>
      </nav>

      {showAddModal && <ModalTransaction onClose={() => setShowAddModal(false)} />}
    </>
  );
}
