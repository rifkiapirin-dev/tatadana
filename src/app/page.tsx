'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle,
  MessageSquare,
  BarChart3,
  Bot,
  Receipt,
  Shield,
  Zap,
  HelpCircle,
  ChevronDown,
  Star,
  Play,
  Check,
  Send,
  Smartphone,
  CreditCard,
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

export default function LandingPage() {
  const [pricingCycle, setPricingCycle] = useState<'monthly' | 'lifetime'>('lifetime');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Interactive Demo state
  const [demoTab, setDemoTab] = useState<'bot' | 'charts' | 'budget'>('bot');
  const [demoInput, setDemoInput] = useState('');
  const [demoChat, setDemoChat] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    { sender: 'user', text: 'beli bakso 15rb' },
    {
      sender: 'bot',
      text: `📅 Senin, 13 Okt — 12:45 WIB\n💸 Pengeluaran tercatat!\n├ Nominal : Rp 15.000\n├ Kategori : 🍜 Makanan & Minuman\n├ Dompet : 👛 BCA Utama\n├ Catatan : beli bakso\n└ Saldo : Rp 14.235.000\n\n📊 Budget Makanan bulan ini:\n[████████░░] 80% — sisa Rp 600.000\n⚠️ Hati-hati: Budget hampir habis!`,
    },
  ]);

  const handleSendDemo = (e: React.FormEvent, directText?: string) => {
    if (e) e.preventDefault();
    const userText = directText || demoInput.trim();
    if (!userText) return;

    const lower = userText.toLowerCase();
    const isTopUp =
      lower.includes('tambah saldo') ||
      lower.includes('isi saldo') ||
      lower.includes('top up') ||
      lower.includes('topup') ||
      lower.includes('nabung') ||
      lower.includes('setor');

    let wallet = 'BCA Utama';
    if (lower.includes('gopay')) wallet = 'GoPay';
    else if (lower.includes('mandiri')) wallet = 'Mandiri Tabungan';
    else if (lower.includes('ovo')) wallet = 'OVO';
    else if (lower.includes('dana')) wallet = 'DANA';
    else if (lower.includes('tunai') || lower.includes('cash')) wallet = 'Uang Tunai';

    let botText = '';
    if (isTopUp) {
      botText = `📅 Hari ini — WIB\n💰 Saldo Berhasil Ditambahkan!\n├ Nominal : Rp 100.000\n├ Dompet : 👛 ${wallet}\n├ Kategori : 📥 Top Up & Tabungan\n├ Catatan : ${userText}\n└ Saldo baru : Rp 14.335.000 📈\n\n✨ Tabunganmu bertambah! Pengelolaan makin terkontrol 💪`;
    } else if (lower.includes('gaji') || lower.includes('gajian')) {
      botText = `📅 Hari ini — WIB\n💰 Pemasukan tercatat!\n├ Nominal : Rp 5.000.000\n├ Dompet : 👛 ${wallet}\n├ Kategori : 💼 Gaji Bulanan\n└ Saldo baru : Rp 19.235.000 📈\n\n💪 Semangat terus! Tabungan makin aman.`;
    } else if (lower.includes('/saldo')) {
      botText = `👛 Saldo Dompet TataDana\n• BCA Utama: Rp 14.235.000 (Utama)\n• Mandiri Tabungan: Rp 6.500.000\n• GoPay: Rp 420.000\n• OVO: Rp 250.000\n• Uang Tunai: Rp 750.000\n\n💰 Total Saldo: Rp 22.155.000`;
    } else {
      botText = `📅 Hari ini — WIB\n💸 Pengeluaran tercatat!\n├ Nominal : Rp 15.000\n├ Kategori : 🍜 Makanan & Minuman\n├ Dompet : 👛 ${wallet}\n├ Catatan : ${userText}\n└ Sisa Saldo : Rp 14.220.000\n\n📊 Budget bulan ini terkontrol dengan baik!`;
    }

    setDemoChat((prev) => [
      ...prev,
      { sender: 'user', text: userText },
      { sender: 'bot', text: botText },
    ]);
    setDemoInput('');
  };

  const faqs = [
    {
      q: 'Apakah saya bisa menggunakan foto struk belanja di paket Starter?',
      a: 'Tidak. Fitur ekstraksi foto struk belanja dengan AI OCR merupakan fitur eksklusif paket Pro. Pengguna paket Starter dapat mencatat semua pengeluaran dan pemasukan dengan mengetik kalimat bahasa natural atau mengirim voice note lewat Telegram.',
    },
    {
      q: 'Bagaimana keamanan data transaksi saya di TataDana?',
      a: 'Keamanan adalah prioritas mutlak kami. Seluruh database dienkripsi menggunakan standar perbankan di Supabase PostgreSQL dengan Row-Level Security (RLS) terisolasi. Data Anda tidak pernah dijual atau digunakan untuk melatih model AI pihak ketiga.',
    },
    {
      q: 'Bagaimana cara bot mengenali akun saya di Telegram?',
      a: 'Satu bot TataDana melayani semua user. Saat pertama kali memulai bot, Anda memasukkan kode pairing atau nomor HP yang sudah terverifikasi saat pendaftaran web. Bot akan mengenali User ID Telegram Anda secara otomatis untuk seluruh transaksi berikutnya.',
    },
    {
      q: 'Apakah bisa mencatat transfer antar rekening?',
      a: 'Bisa! Anda bisa mencatat transfer langsung dari web dashboard atau via Telegram chat (contoh: "transfer ke mandiri 500rb"). Saldo kedua dompet akan otomatis disesuaikan secara real-time.',
    },
    {
      q: 'Bagaimana jika AI salah memahami pesan chat saya?',
      a: 'TataDana dilengkapi sistem deteksi ambiguitas pintar. Jika format atau nominal tidak terbaca jelas, bot tidak akan salah catat, melainkan membalas dengan saran dan contoh penulisan yang benar agar Anda dapat mengoreksinya dengan mudah.',
    },
    {
      q: 'Apakah paket Pro benar-benar sekali bayar tanpa langganan bulanan?',
      a: 'Ya, penawaran lifetime deal Pro Rp99.000 saat ini adalah sekali bayar untuk akses selamanya ke seluruh fitur premium, termasuk AI OCR struk belanja, AI Financial Advisor, dan export laporan tanpa batas.',
    },
    {
      q: 'Bagaimana metode pembayaran yang didukung?',
      a: 'Kami menerima pembayaran otomatis melalui Midtrans (QRIS, GoPay, ShopeePay, Virtual Account BCA/Mandiri/BRI/BNI) serta opsi transfer manual dengan approval langsung dari tim kami.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white flex flex-col font-sans">
      {/* 1. NAVBAR (Sticky) */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6 h-18 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-cyan-500/25">
              TD
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                Tata<span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">Dana</span>
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#fitur" className="hover:text-cyan-600 transition-colors">
              Fitur
            </a>
            <a href="#demo" className="hover:text-cyan-600 transition-colors">
              Cara Kerja
            </a>
            <a href="#pricing" className="hover:text-cyan-600 transition-colors">
              Harga
            </a>
            <a href="#faq" className="hover:text-cyan-600 transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-cyan-700 rounded-xl hover:bg-slate-100 transition-all"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white text-xs font-bold shadow-md shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Coba Gratis
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-6">
          {/* Pre-headline Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-50 to-cyan-50 border border-cyan-200/80 text-teal-900 text-xs font-bold shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600 animate-spin" />
            <span>✨ Catat keuangan langsung dari Telegram kamu</span>
          </div>

          {/* Headline H1 with Aurora Gradient */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
            Gaji habis sebelum akhir bulan?{' '}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 bg-clip-text text-transparent">
              Sudah saatnya kamu tahu ke mana uangmu pergi.
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            TataDana mencatat setiap pengeluaranmu langsung dari chat Telegram atau foto struk —
            sisanya kami yang urus.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold text-sm shadow-xl shadow-cyan-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>Mulai Gratis Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#demo"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm border border-slate-200 shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <span>Lihat cara kerjanya →</span>
            </a>
          </div>

          {/* Video Placeholder (Part 7: ditandai jelas untuk diganti nanti) */}
          <div className="pt-10 max-w-4xl mx-auto">
            {/* // TODO: ganti dengan video asli presentasi produk TataDana */}
            <div className="relative rounded-3xl overflow-hidden border border-slate-200 bg-slate-900 shadow-2xl aspect-video flex flex-col items-center justify-center text-white group cursor-pointer">
              <div className="absolute inset-0 bg-cover bg-center opacity-40 bg-[url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80')]" />
              <div className="relative z-10 flex flex-col items-center gap-3 p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 group-hover:scale-110 transition-transform">
                  <Play className="w-7 h-7 fill-white translate-x-0.5" />
                </div>
                <span className="font-extrabold text-lg text-white">
                  Tonton Demo 60 Detik: Pencatatan Telegram Bot TataDana
                </span>
                <span className="text-xs text-slate-300">
                  Placeholder Video • Klik untuk menjalankan simulasi interaktif di bawah
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PROBLEM AWARE BULLETS & SOLUTION TRANSITION */}
      <section className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Kenapa Mengatur Uang Terasa Sangat Berat?
            </h2>
            <p className="text-sm text-slate-500">
              Apakah kamu sering mengalami tiga hambatan klasik ini setiap hari?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                <XCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                "Buka aplikasi keuangan? Nanti dulu deh..."
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Aplikasi yang rumit dengan terlalu banyak form bikin malas mencatat. Akhirnya struk
                menumpuk dan terlupakan begitu saja.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                <XCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                "Kok uangnya habis ya? Padahal kayak tidak beli apa-apa"
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pengeluaran kecil seperti kopi, parkir, dan jajan online sering tak tercatat, tapi
                diam-diam menghabiskan setengah gaji bulananmu.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
                <XCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                "Udah niat bikin budget, tapi seminggu lupa"
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Budget yang dibuat di awal bulan tidak pernah dipantau secara berkala. Tanpa
                pengingat otomatis, budget tak lebih dari sekadar catatan di atas kertas.
              </p>
            </div>
          </div>

          {/* Solusi Transisi */}
          <div className="text-center pt-8 space-y-3 max-w-xl mx-auto">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
              Solusi dari TataDana
            </span>
            <h3 className="text-2xl font-black text-slate-900">
              Bagaimana kalau mencatat keuangan semudah kirim pesan ke teman?
            </h3>
            <p className="text-xs text-slate-500">
              Introducing <b>TataDana</b> — asisten keuangan pribadi yang selalu ada di dalam
              kantong Telegram kamu.
            </p>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE DASHBOARD PREVIEW (Part 7) */}
      <section id="demo" className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Coba Langsung Simulasi Bot Telegram
            </h2>
            <p className="text-xs text-slate-500">
              Ketik kalimat belanja apa saja di bawah untuk melihat bagaimana AI TataDana langsung
              memprosesnya.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden max-w-2xl mx-auto">
            {/* Telegram Header mockup */}
            <div className="bg-[#24A1DE] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white text-[#24A1DE] font-black flex items-center justify-center text-xs">
                  TD
                </div>
                <div>
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    TataDana Bot
                    <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                  </div>
                  <div className="text-[10px] text-sky-100">online • siap mencatat</div>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="p-4 space-y-3 bg-[#e8eef3] h-80 overflow-y-auto">
              {demoChat.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-sm whitespace-pre-wrap leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-[#EEFFDE] text-slate-900 rounded-tr-none font-medium'
                        : 'bg-white text-slate-900 rounded-tl-none border border-slate-100 font-mono text-[11px]'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Demo Prompts */}
            <div className="bg-slate-50 border-t border-slate-200 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                '➕ Tambah Saldo GoPay 100rb',
                '➕ Top Up Mandiri 500rb',
                '💸 Beli bakso 15rb pakai bca',
                '👛 /saldo',
              ].map((pill, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendDemo(null as any, pill.replace(/^[➕💸👛]\s*/, ''))}
                  className="text-[10px] font-semibold px-2 py-1 rounded-full bg-white text-slate-700 border border-slate-200 hover:border-emerald-400 hover:text-emerald-700 whitespace-nowrap transition-all"
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* Interactive Chat Form */}
            <form onSubmit={(e) => handleSendDemo(e)} className="p-3 bg-white border-t border-slate-200 flex gap-2">
              <input
                type="text"
                value={demoInput}
                onChange={(e) => setDemoInput(e.target.value)}
                placeholder="Ketik misal: 'tambah saldo gopay 100rb' atau 'beli bakso 15rb'..."
                className="flex-1 px-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#24A1DE]"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#24A1DE] text-white text-xs font-bold hover:bg-[#1f8ec4] transition-colors"
              >
                Kirim
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 5. FITUR SECTION (3 Alternating Layout Features) */}
      <section id="fitur" className="py-24 bg-white border-t border-slate-200/80">
        <div className="max-w-6xl mx-auto px-6 space-y-24">
          {/* Fitur 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                1. Catat via Telegram (Teks, Voice Note, & Foto Struk)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Tidak perlu buka form rumit. Cukup ketik kalimat natural seperti "beli kopi 25k", kirim
                voice note kilat, atau foto struk belanjaanmu. AI langsung mengekstrak pos kategori,
                nominal, dan rincian barang dalam hitungan detik.
              </p>
              <ul className="space-y-2 text-xs text-slate-700 font-semibold">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Mendukung dialek rupiah Indonesia: 15rb, 1.5jt, 500k
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  AI OCR Struk membedah rincian belanjaan per item
                </li>
              </ul>
            </div>
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-inner">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 font-mono text-xs">
                <div className="text-slate-400 text-[10px]">CONTOH REPLY EXPENSE:</div>
                <div className="text-emerald-700 font-bold">💸 Pengeluaran tercatat!</div>
                <div>├ Nominal : Rp 35.000</div>
                <div>├ Kategori : 🍜 Makanan & Minuman</div>
                <div>├ Dompet : 👛 BCA Utama</div>
                <div>└ Saldo : Rp 14.215.000</div>
                <div className="text-slate-500 pt-2 border-t">
                  📊 Budget Makanan: [██████░░░░] 60% — sisa Rp 1.200.000
                </div>
              </div>
            </div>
          </div>

          {/* Fitur 2 (Alternating) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center lg:flex-row-reverse">
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-inner order-2 lg:order-1">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="font-bold text-slate-800">Laporan Keuangan Realtime</span>
                  <span className="text-emerald-600 text-[10px] font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                    Supabase Realtime
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Pemasukan</span>
                    <span className="font-extrabold text-emerald-600">Rp 15.000.000</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Pengeluaran</span>
                    <span className="font-extrabold text-rose-600">Rp 6.250.000</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-2">
                  <span>Ekspor PDF / Excel</span>
                  <span className="font-bold text-emerald-600">On-demand 1-klik</span>
                </div>
              </div>
            </div>
            <div className="space-y-4 order-1 lg:order-2">
              <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                2. Laporan & Ekspor Otomatis di Dashboard TataDana
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Semua data transaksi tersimpan terpusat di Supabase. Kamu bisa melihat analitik visual,
                memfilter per kategori, memeriksa riwayat item struk belanjaan, hingga mengekspor berkas
                PDF dan Excel kapan saja.
              </p>
              <ul className="space-y-2 text-xs text-slate-700 font-semibold">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Tabel interaktif dengan pencarian dan pagination
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Ekspor PDF & Excel disimpan aman di Supabase Storage
                </li>
              </ul>
            </div>
          </div>

          {/* Fitur 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                3. AI Financial Advisor Proaktif
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Bukan cuma mencatat, TataDana adalah penasihat keuangan pribadi. AI memantau
                kebiasaanmu dan otomatis memberi peringatan saat pengeluaran melonjak 50%, saat budget
                hampir habis, atau ada transaksi besar yang mencurigakan.
              </p>
              <ul className="space-y-2 text-xs text-slate-700 font-semibold">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Saran spesifik yang actionable langsung di chat Telegram
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Pengingat harian rutin (1x atau 2x sehari)
                </li>
              </ul>
            </div>
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-inner">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2.5 text-xs">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-emerald-600" />
                  AI Financial Advisor
                </div>
                <p className="text-slate-600 leading-relaxed">
                  "Hei Budi! Pengeluaran pos Makananmu naik 52% dibanding minggu lalu. Total
                  pengeluaranmu sudah 82% dari pemasukan bulan ini."
                </p>
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] font-semibold">
                  💡 Saran: Tunda pembelian impulsif akhir pekan ini agar pos tabungan darurat tetap
                  terjaga!
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TESTIMONI (Masonry Grid Placeholder, Part 7) */}
      <section className="py-20 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-6xl mx-auto px-6 space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Cerita Pengguna TataDana
            </h2>
            <p className="text-xs text-slate-500">
              {/* // TODO: ganti dengan testimoni asli setelah fase beta user selesai */}
              Placeholder testimoni pengguna awal dari berbagai profesi
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: 'Andi Pratama',
                role: 'Software Engineer di Jakarta',
                quote:
                  'Sebelum pakai TataDana, selalu bingung gaji 12 juta ludes ke mana sebelum tanggal 20. Sekarang tinggal ketik di Telegram, semua tercatat tanpa ribet buka aplikasi berat.',
              },
              {
                name: 'Dina Kusuma',
                role: 'Freelance Content Creator',
                quote:
                  'Fitur foto struk AI di paket Pro itu juara banget! Belanja bulanan di supermarket tinggal difoto, rincian per barang langsung masuk kategori otomatis.',
              },
              {
                name: 'Rian Saputra',
                role: 'Mahasiswa Tingkat Akhir',
                quote:
                  'Reminder Telegram 2x seharinya ngebantu banget jaga disiplin. Bot-nya responsif dan format chat-nya rapi banget!',
              },
            ].map((t, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-3"
              >
                <div className="flex gap-1 text-amber-400">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-600 italic leading-relaxed">"{t.quote}"</p>
                <div className="pt-2 border-t border-slate-100">
                  <div className="font-bold text-xs text-slate-800">{t.name}</div>
                  <div className="text-[10px] text-slate-400">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. PRICING SECTION (Starter vs Pro) */}
      <section id="pricing" className="py-24 bg-white border-t border-slate-200/80">
        <div className="max-w-5xl mx-auto px-6 space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Investasi Terbaik untuk Kendali Finansialmu
            </h2>
            <p className="text-xs text-slate-500">
              Pilih paket yang sesuai dengan kebutuhan pencatatan dan pengelolaan uangmu.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold mt-2">
              <button
                onClick={() => setPricingCycle('monthly')}
                className={`px-4 py-1.5 rounded-xl transition-all ${
                  pricingCycle === 'monthly'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Bulanan
              </button>
              <button
                onClick={() => setPricingCycle('lifetime')}
                className={`px-4 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  pricingCycle === 'lifetime'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Sekali Bayar (Promo)</span>
                <span className="text-[9px] bg-emerald-400 text-emerald-950 px-1.5 py-0.2 rounded-full font-black">
                  HEMAT
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Starter Plan */}
            <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Paket Starter
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">Rp 49.000</span>
                  <span className="text-xs text-slate-500">/ bulan</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Cocok untuk pengguna pemula yang ingin mulai disiplin mencatat transaksi harian lewat chat.
                </p>

                <ul className="space-y-3 pt-2 text-xs text-slate-700">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    Catat transaksi via teks & voice note Telegram
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    Maksimal 50 transaksi / bulan
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    Maksimal 3 dompet & 5 kategori budget
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    Dashboard web ringkasan bulanan
                  </li>
                  <li className="flex items-center gap-2.5 text-slate-400">
                    <XCircle className="w-4 h-4 text-slate-300 shrink-0" />
                    Tanpa input foto struk OCR
                  </li>
                  <li className="flex items-center gap-2.5 text-slate-400">
                    <XCircle className="w-4 h-4 text-slate-300 shrink-0" />
                    Tanpa AI Financial Advisor & Ekspor PDF/Excel
                  </li>
                </ul>
              </div>

              <Link
                href="/register"
                className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold text-center transition-colors block"
              >
                Pilih Starter
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="p-8 rounded-3xl bg-slate-900 text-white shadow-2xl space-y-6 flex flex-col justify-between relative overflow-hidden border border-emerald-500/50">
              <div className="absolute top-4 right-4 bg-emerald-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                PALING POPULER
              </div>

              <div className="space-y-4">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                  Paket Pro (Lifetime Access)
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">Rp 99.000</span>
                  <span className="text-xs text-slate-400">sekali bayar</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Akses tanpa batas ke seluruh teknologi mutakhir TataDana seumur hidup.
                </p>

                <ul className="space-y-3 pt-2 text-xs text-slate-200">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <b>Unlimited</b> transaksi, dompet, & budget kategori
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <b>Input via foto struk AI OCR</b> (ekstraksi rincian per produk)
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <b>AI Financial Advisor aktif</b> dengan analisa proaktif
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <b>Ekspor laporan tanpa batas</b> ke format PDF & Excel (.xlsx)
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    Jadwal reminder harian custom via Telegram
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    Prioritas support VIP
                  </li>
                </ul>
              </div>

              <Link
                href="/register"
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs text-center transition-all shadow-lg shadow-emerald-500/25 block"
              >
                Dapatkan Akses Pro Sekarang
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ SECTION (Minimal 7 Pertanyaan, Part 7) */}
      <section id="faq" className="py-24 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-4xl mx-auto px-6 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Pertanyaan yang Sering Diajukan (FAQ)
            </h2>
            <p className="text-xs text-slate-500">
              Informasi lengkap seputar fitur, bot Telegram, dan keamanan akun TataDana.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => {
              const isOpen = activeFaq === i;
              return (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all shadow-sm"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : i)}
                    className="w-full p-5 text-left flex items-center justify-between text-xs font-bold text-slate-800 hover:text-emerald-700"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform shrink-0 ml-2 ${
                        isOpen ? 'rotate-180 text-emerald-600' : 'text-slate-400'
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 9. FINAL CTA (Emerald Gradient) */}
      <section className="py-20 bg-gradient-to-r from-emerald-700 to-teal-800 text-white text-center">
        <div className="max-w-3xl mx-auto px-6 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Mulai Kendalikan Keuanganmu Hari Ini
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mx-auto leading-relaxed">
            Bergabunglah dengan ribuan orang yang berhasil menghentikan kebocoran uang tak terlihat
            hanya dengan mengirim chat semudah menyapa kawan.
          </p>
          <div className="pt-2">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-white text-emerald-800 hover:bg-slate-100 font-extrabold text-xs shadow-xl transition-all hover:scale-105"
            >
              <span>Daftar TataDana Sekarang — Gratis</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 10. FOOTER (4 Kolom Sesuai Spesifikasi Part 7) */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-16 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Kolom 1: Brand & Tagline */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-extrabold text-base">
              <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xs">
                TD
              </div>
              <span>TataDana</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Catat keuangan semudah chat — langsung dari Telegram kamu. Terintegrasi penuh dengan
              Supabase PostgreSQL.
            </p>
            <div className="text-[11px] text-slate-500 pt-2">
              © {new Date().getFullYear()} TataDana. Hak cipta dilindungi undang-undang.
            </div>
          </div>

          {/* Kolom 2: Produk */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Produk</h4>
            <ul className="space-y-2">
              <li>
                <a href="#fitur" className="hover:text-emerald-400 transition-colors">
                  Integrasi Bot Telegram
                </a>
              </li>
              <li>
                <a href="#fitur" className="hover:text-emerald-400 transition-colors">
                  AI OCR Struk Belanja
                </a>
              </li>
              <li>
                <a href="#fitur" className="hover:text-emerald-400 transition-colors">
                  AI Financial Advisor
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-emerald-400 transition-colors">
                  Paket & Harga
                </a>
              </li>
            </ul>
          </div>

          {/* Kolom 3: Perusahaan */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Perusahaan</h4>
            <ul className="space-y-2">
              <li>
                <a href="#demo" className="hover:text-emerald-400 transition-colors">
                  Tentang TataDana
                </a>
              </li>
              <li>
                <a href="#demo" className="hover:text-emerald-400 transition-colors">
                  Blog Edukasi Finansial
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-emerald-400 transition-colors">
                  Panduan @BotFather
                </a>
              </li>
            </ul>
          </div>

          {/* Kolom 4: Legal & Kontak */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Legal & Bantuan</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="hover:text-emerald-400 transition-colors">
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-emerald-400 transition-colors">
                  Syarat & Ketentuan
                </Link>
              </li>
              <li>
                <a href="mailto:support@tatadana.id" className="hover:text-emerald-400 transition-colors">
                  Kontak Support: support@tatadana.id
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
