'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useApp } from '@/context/AppContext';
import {
  User as UserIcon,
  Bot,
  Bell,
  Tag,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Clock,
  Send,
  Loader2,
  Trash2,
  Plus,
} from 'lucide-react';

export default function SettingsPage() {
  const { currentUser, reminder, categories, telegramLink, refreshData, notify } = useApp();
  const [activeTab, setActiveTab] = useState<'profile' | 'telegram' | 'reminders' | 'categories'>('telegram');

  // Tab Profile state
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phone_number || '');
  const [currency, setCurrency] = useState(currentUser?.currency || 'IDR');
  const [savingProfile, setSavingProfile] = useState(false);

  // Tab Telegram state
  const [botToken, setBotToken] = useState('8802532938:AAHbCUmP5JGZELyU6ifl6pVQAeZ_lfMV_zk');
  const [botUsername, setBotUsername] = useState('tatadana2_bot');
  const [isTestingToken, setIsTestingToken] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<'idle' | 'connected' | 'error'>('connected');
  const [telegramError, setTelegramError] = useState('');
  const [linkingCode, setLinkingCode] = useState('TATA-8892');

  // Tab Reminders state
  const [reminderActive, setReminderActive] = useState(reminder?.is_active ?? true);
  const [reminderFreq, setReminderFreq] = useState<1 | 2>(reminder?.frequency ?? 2);
  const [time1, setTime1] = useState(reminder?.time_1 ?? '09:00');
  const [time2, setTime2] = useState(reminder?.time_2 ?? '20:00');

  // Tab Categories state
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'expense' | 'income'>('expense');

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.full_name);
      setPhoneNumber(currentUser.phone_number);
      setCurrency(currentUser.currency || 'IDR');
    }
    if (reminder) {
      setReminderActive(reminder.is_active);
      setReminderFreq(reminder.frequency);
      setTime1(reminder.time_1);
      setTime2(reminder.time_2);
    }
    if (telegramLink) {
      setTelegramStatus(telegramLink.is_connected ? 'connected' : 'idle');
      if (telegramLink.linking_code) setLinkingCode(telegramLink.linking_code);
      if (telegramLink.bot_token) setBotToken(telegramLink.bot_token);
      if (telegramLink.telegram_username) setBotUsername(telegramLink.telegram_username);
    }
  }, [currentUser, reminder, telegramLink]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          full_name: fullName,
          currency,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        notify('Profil pengguna berhasil diperbarui dan disimpan!');
        await refreshData();
      } else {
        notify(data.error || 'Gagal menyimpan profil', 'error');
      }
    } catch (e: any) {
      notify('Gagal menyimpan profil: ' + e.message, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  // Test Telegram Connection (Part 5)
  const handleTestConnection = async () => {
    setIsTestingToken(true);
    setTelegramError('');

    try {
      const res = await fetch('/api/telegram/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: botToken,
          userId: currentUser?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setTelegramStatus('error');
        setTelegramError(data.error || 'Token bot tidak valid atau koneksi gagal.');
        notify('Koneksi Telegram gagal: ' + data.error, 'error');
        return;
      }

      setTelegramStatus('connected');
      if (data.bot?.username) {
        setBotUsername(data.bot.username);
      }
      notify('🟢 ' + (data.message || 'Bot Telegram berhasil terhubung!'));
      await refreshData();
    } catch (err: any) {
      setTelegramStatus('error');
      setTelegramError(err.message || 'Gagal menghubungi server.');
    } finally {
      setIsTestingToken(false);
    }
  };

  // Save Reminders
  const handleSaveReminder = async () => {
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          is_active: reminderActive,
          frequency: reminderFreq,
          time_1: time1,
          time_2: time2,
        }),
      });
      if (res.ok) {
        notify('Jadwal reminder harian berhasil disimpan!');
        await refreshData();
      }
    } catch (e: any) {
      notify('Gagal menyimpan reminder: ' + e.message, 'error');
    }
  };

  // Add Custom Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          name: newCatName.trim(),
          type: newCatType,
          color: '#10B981',
        }),
      });
      if (res.ok) {
        notify('Kategori custom berhasil ditambahkan!');
        setNewCatName('');
        await refreshData();
      }
    } catch (e: any) {
      notify('Gagal menambah kategori: ' + e.message, 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar title="Pengaturan Sistem" />

      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'telegram', label: 'Bot Telegram', icon: Bot },
            { id: 'reminders', label: 'Reminder Harian', icon: Bell },
            { id: 'categories', label: 'Kategori Custom', icon: Tag },
            { id: 'profile', label: 'Profil Akun', icon: UserIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs transition-all ${
                  isActive
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: BOT TELEGRAM (Part 5) */}
        {activeTab === 'telegram' && (
          <div className="space-y-6">
            {/* Connection Status Card */}
            <div className="glass-card-polished p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Status Integrasi Bot
                </span>
                <div className="flex flex-wrap items-center gap-2.5 mt-1.5">
                  {telegramStatus === 'connected' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      🟢 Terhubung & Webhook Aktif
                    </span>
                  ) : telegramStatus === 'error' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      🔴 Tidak Terhubung
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      🟢 Terhubung
                    </span>
                  )}
                  <a
                    href={`https://t.me/${botUsername || 'tatadana2_bot'}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-300 hover:bg-sky-100 transition"
                  >
                    <span>🤖 @{botUsername || 'tatadana2_bot'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-xs text-slate-500">
                    No. HP: {currentUser?.phone_number || '083851284143'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleTestConnection}
                  disabled={isTestingToken}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isTestingToken ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>⏳ Testing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Test Koneksi & Set Webhook</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {telegramError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Error Telegram API:</span> {telegramError}
                </div>
              </div>
            )}

            {/* Token Input Form */}
            <div className="glass-card-polished p-6 rounded-3xl space-y-4">
              <h3 className="font-bold text-slate-900 text-base">Token Telegram Bot</h3>
              <p className="text-xs text-slate-500">
                Masukkan API Token bot yang kamu dapatkan dari @BotFather. Backend otomatis memvalidasi token dan mengonfigurasi webhook.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  Telegram Bot API Token
                </label>
                <input
                  type="text"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Pairing Code & 1-Click Telegram Deep Link */}
              <div className="pt-2 p-5 bg-gradient-to-br from-slate-50 to-emerald-50/40 rounded-2xl border border-emerald-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">Kode Pairing Akun Unik:</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Aktif
                    </span>
                  </div>
                  <div className="text-2xl font-black text-emerald-700 tracking-wider font-mono">
                    {linkingCode}
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-md">
                    Buka bot resmi TataDana di Telegram (<strong>@{botUsername || 'tatadana2_bot'}</strong>) lalu kirim <code>/start {linkingCode}</code> atau klik tombol di samping untuk otomatis menghubungkan.
                  </p>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <a
                    href={`https://t.me/${botUsername || 'tatadana2_bot'}?start=${linkingCode}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-[#24A1DE] hover:bg-[#1f8ec4] text-white text-xs font-bold shadow-md shadow-sky-500/20 transition-all flex items-center gap-2 shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Bot @{botUsername || 'tatadana2_bot'}</span>
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`/start ${linkingCode}`);
                      notify('Perintah /start berhasil disalin ke clipboard!');
                    }}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Salin Perintah
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Cheatsheet: Cara Mengatur Transaksi di Telegram */}
            <div className="glass-card-polished p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span>📱</span> Panduan Mengatur Transaksi Langsung dari Telegram
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Setelah terhubung, kamu bisa mencatat keuangan semudah chatting tanpa perlu membuka dashboard web!
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                {/* 1. Pengeluaran */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    1. Catat Pengeluaran
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Ketik nominal dan nama barang. Sistem otomatis mengenali kategori & dompet:
                  </p>
                  <div className="space-y-1 font-mono text-[11px] text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/60">
                    <div>• <code>beli bakso 15rb</code> <span className="text-slate-400">(dompet default)</span></div>
                    <div>• <code>kopi 25k pakai gopay</code> <span className="text-slate-400">(potong GoPay)</span></div>
                    <div>• <code>bensin 50rb pake mandiri</code> <span className="text-slate-400">(potong Mandiri)</span></div>
                  </div>
                </div>

                {/* 2. Tambah Saldo & Tabungan */}
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/70 space-y-2">
                  <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    2. Tambah Saldo / Nabung
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Menambah saldo akan <b>menaikkan tabungan</b> secara real-time:
                  </p>
                  <div className="space-y-1 font-mono text-[11px] text-slate-700 bg-white p-2.5 rounded-xl border border-emerald-200/60">
                    <div>• <code>tambah saldo gopay 100rb</code> <span className="text-emerald-600 font-bold">(+100rb)</span></div>
                    <div>• <code>nabung ke mandiri 500rb</code> <span className="text-emerald-600 font-bold">(+500rb)</span></div>
                    <div>• <code>gajian 5jt</code> <span className="text-emerald-600 font-bold">(+Gaji masuk)</span></div>
                  </div>
                </div>

                {/* 3. Perintah Cepat */}
                <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-200/70 space-y-2">
                  <div className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#24A1DE]" />
                    3. Shortcut Cepat
                  </div>
                  <div className="space-y-1 font-mono text-[11px] text-slate-700 bg-white p-2.5 rounded-xl border border-sky-200/60">
                    <div>• <code>/saldo</code> → Cek saldo semua rekening & e-wallet</div>
                    <div>• <code>/budget</code> → Pantau sisa limit anggaran bulanan</div>
                    <div>• <code>/hari ini</code> → Rekap pemasukan & pengeluaran hari ini</div>
                    <div>• <code>/bulan ini</code> → Rekap kategori bulan berjalan</div>
                  </div>
                </div>

                {/* 4. Fitur Pintar AI */}
                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200/70 space-y-2">
                  <div className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    4. Foto Struk & Voice Note
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-700 bg-white p-2.5 rounded-xl border border-purple-200/60">
                    <div>📷 <b>Kirim Foto Struk:</b> AI OCR mengekstrak total, merchant & item belanja secara otomatis (Paket Pro).</div>
                    <div>🎙️ <b>Kirim Voice Note:</b> Rekam ucapan transaksi, AI speech-to-text otomatis mencatatnya.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step by Step Guide from @BotFather (Part 5) */}
            <div className="glass-card-polished p-6 rounded-3xl space-y-3">
              <h3 className="font-bold text-slate-900 text-base">
                Panduan Step-by-Step Menghubungkan Bot dari @BotFather
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 leading-relaxed font-medium">
                <li>
                  Buka aplikasi Telegram dan cari user resmi <b>@BotFather</b> di kotak pencarian.
                </li>
                <li>
                  Kirim perintah <code>/newbot</code> lalu ikuti instruksi untuk memberi nama dan username bot kamu.
                </li>
                <li>
                  Salin <b>HTTP API Token</b> yang diberikan oleh BotFather (format: <code>123456:ABC-DEF...</code>).
                </li>
                <li>
                  Tempel token tersebut ke input field di atas, lalu klik <b>Test Koneksi & Set Webhook</b>.
                </li>
                <li>
                  Sistem TataDana akan memverifikasi token ke Telegram API dan mengaktifkan webhook otomatis.
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* TAB 2: REMINDER HARIAN (Part 3 & 4.8) */}
        {activeTab === 'reminders' && (
          <div className="space-y-6">
            <div className="glass-card-polished p-6 rounded-3xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Pengingat Keuangan Harian</h3>
                  <p className="text-xs text-slate-500">
                    Notifikasi otomatis dikirim langsung via Telegram untuk mengingatkanmu mencatat transaksi.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reminderActive}
                    onChange={(e) => setReminderActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {reminderActive && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                      Frekuensi Pengingat (Maksimal 2x Sehari)
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setReminderFreq(1)}
                        className={`flex-1 py-2.5 rounded-2xl text-xs font-bold border transition-all ${
                          reminderFreq === 1
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        1x Sehari
                      </button>
                      <button
                        type="button"
                        onClick={() => setReminderFreq(2)}
                        className={`flex-1 py-2.5 rounded-2xl text-xs font-bold border transition-all ${
                          reminderFreq === 2
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        2x Sehari (Pagi & Malam)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        Jam Pengingat 1 (WIB)
                      </label>
                      <input
                        type="time"
                        value={time1}
                        onChange={(e) => setTime1(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {reminderFreq === 2 && (
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                          Jam Pengingat 2 (WIB)
                        </label>
                        <input
                          type="time"
                          value={time2}
                          onChange={(e) => setTime2(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Real-time Message Preview (Part 4.8) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      Preview Pesan Reminder Telegram
                    </label>
                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 font-mono text-xs text-slate-800 whitespace-pre-line">
                      {`⏰ Reminder Keuangan!
Jangan lupa catat pengeluaran hari ini ya 📝
Pencatatan rutin = keuangan lebih terkontrol 💪
Ketik transaksimu sekarang!`}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSaveReminder}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md"
                    >
                      Simpan Jadwal Reminder
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: KATEGORI CUSTOM */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="glass-card-polished p-6 rounded-3xl space-y-4">
              <h3 className="font-bold text-slate-900 text-base">Kelola Kategori Transaksi</h3>
              <p className="text-xs text-slate-500">
                Tambah atau sesuaikan pos pengeluaran dan pos pemasukan pribadimu.
              </p>

              <form onSubmit={handleAddCategory} className="flex gap-2">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Contoh: 🐾 Perlengkapan Hewan"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-500"
                />
                <select
                  value={newCatType}
                  onChange={(e) => setNewCatType(e.target.value as any)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none"
                >
                  <option value="expense">Pengeluaran</option>
                  <option value="income">Pemasukan</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Tambah
                </button>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-3">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-slate-800">{c.name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.type === 'expense'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {c.type === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PROFIL AKUN */}
        {activeTab === 'profile' && (
          <div className="glass-card-polished p-6 rounded-3xl space-y-4 max-w-xl">
            <h3 className="font-bold text-slate-900 text-base">Profil Pengguna</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Nomor HP (Terverifikasi OTP untuk Telegram)
                </label>
                <input
                  type="text"
                  disabled
                  value={phoneNumber}
                  className="w-full px-3 py-2 rounded-xl border border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Mata Uang Default
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  <option value="IDR">Rupiah Indonesia (IDR)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                >
                  {savingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
