'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Sparkles, Send, Menu } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import ModalTransaction from './ModalTransaction';
import TelegramSimulatorModal from './TelegramSimulatorModal';

export default function Navbar({ title }: { title: string }) {
  const { currentUser, toggleMobileMenu } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSimModal, setShowSimModal] = useState(false);

  return (
    <>
      <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
        {/* Sisi Kiri: Hamburger Menu Mobile + Judul Halaman */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={toggleMobileMenu}
            aria-label="Buka Menu Navigasi"
            className="p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 lg:hidden transition-colors shrink-0"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>

          <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight truncate max-w-[150px] sm:max-w-xs md:max-w-none">
            {title}
          </h1>
        </div>

        {/* Sisi Kanan: Aksi Cepat yang Responsif */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Quick Telegram Simulator Trigger */}
          <button
            onClick={() => setShowSimModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl bg-gradient-to-r from-emerald-50 to-cyan-50 text-teal-800 hover:from-emerald-100 hover:to-cyan-100 border border-cyan-200 text-xs font-semibold transition-all shadow-sm"
            title="Buka Simulator Bot Telegram"
          >
            <Send className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
            <span className="hidden md:inline">Simulator Bot Telegram</span>
            <span className="hidden sm:inline md:hidden">Bot</span>
          </button>

          {/* Plan badge & Quick Upgrade */}
          {currentUser?.plan === 'starter' ? (
            <Link
              href="/#pricing"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-xs font-semibold transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Upgrade Pro</span>
            </Link>
          ) : (
            <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-50 to-cyan-50 text-emerald-800 border border-cyan-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
              <span>Pro</span>
            </span>
          )}

          {/* Quick Add Transaction Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white text-xs font-bold shadow-md shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Catat Transaksi</span>
            <span className="sm:hidden font-bold">Catat</span>
          </button>
        </div>
      </header>

      {showAddModal && <ModalTransaction onClose={() => setShowAddModal(false)} />}
      {showSimModal && <TelegramSimulatorModal onClose={() => setShowSimModal(false)} />}
    </>
  );
}
