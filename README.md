# 🚀 TataDana — Catat Keuangan Semudah Chat dari Telegram Kamu

> Aplikasi manajemen keuangan pribadi modern terintegrasi bot Telegram dengan PostgreSQL Supabase, Multi-Engine AI (Google Gemini, OpenAI, DeepSeek), dan pembayaran Midtrans.

---

## ✨ Fitur Utama

1. **Integrasi Bot Telegram End-to-End**:
   - Chat teks natural dengan format nominal Indonesia (`"beli bakso 15rb"`, `"gajian 5jt"`, `"kopi 25k"`).
   - Ekstraksi foto struk belanja otomatis dengan AI OCR (khusus paket Pro).
   - Voice Note Speech-to-Text (STT) transkrip otomatis (maksimal 60 detik).
   - Format balasan pengeluaran & pemasukan lengkap dengan status saldo dompet dan visual progress bar budget (`[████████░░] 80%`).
   - Perintah cepat: `/saldo`, `/hari ini`, `/minggu ini`, `/bulan ini`, `/budget`, `/sheet`, `/bantuan`.
   - Idempotent Webhook (`update_id` filter) untuk mencegah duplikasi transaksi.

2. **User Dashboard Web**:
   - **Beranda Overview**: 4 Stat Cards, grafik perbandingan arus kas 6 bulan, diagram kategori, 10 transaksi terbaru, onboarding checklist.
   - **Transaksi**: Catat Pemasukan, Pengeluaran, dan Transfer Antar Rekening/Dompet.
   - **Laporan & Ekspor**: Filter rentang tanggal, kategori, dompet, pencarian catatan, expand rincian struk per item, ekspor on-demand PDF & Excel (.xlsx), riwayat unduhan.
   - **Budgeting**: Alokasi batas bulanan per pos, alert 80% & 100% via Telegram.
   - **Multi Wallet**: BCA, Mandiri, GoPay, Tunai/Cash dengan selektor dompet default untuk bot.
   - **Pengaturan**: Profil, panduan step-by-step @BotFather, tombol fungsional "Test Koneksi", pengingat harian (1x atau 2x sehari) dengan preview real-time.

3. **Superadmin Console**:
   - Mode Impersonasi Pengguna (akses tampilan user tanpa login ulang).
   - Kelola Provider AI Multi-Engine (Gemini, OpenAI, DeepSeek) dengan mode Single vs Failover.
   - Monitoring Log AI (latensi ms, token prompt/completion, status, model).
   - Approval Pembayaran Midtrans & Transfer Manual.
   - Penampil Transaksi User untuk Customer Support disertai **Audit Log** otomatis demi menjaga kepatuhan privasi.
   - Ekspor Data Semua User dalam format JSON/CSV.

4. **Landing Page Fintech Premium**:
   - 10 Bagian lengkap: Navbar sticky, Hero badge & gradient, Problem Bullets, Solusi Transisi, Simulator Bot Telegram interaktif, 3 Fitur alternating, Testimoni masonry, Pricing toggle (Bulanan vs Lifetime Deal Rp99.000), FAQ (7+ pertanyaan), Final CTA, dan Footer 4 kolom.

---

## 🛠️ Cara Menjalankan di Localhost

Aplikasi saat ini telah **berjalan aktif di background** pada:
👉 **`http://localhost:3000`**

### Menjalankan Manual:
```bash
# Pindah ke direktori proyek
cd C:\Users\Admin\.gemini\antigravity\scratch\tatadana

# Menjalankan production server
npm run start

# Atau menjalankan development server dengan hot-reload
npm run dev
```

---

## 🔑 Akun Demo yang Siap Digunakan

| Nama Pengguna | Peran / Paket | Nomor HP | Akses & Fitur |
|---|---|---|---|
| **Budi Santoso** | Starter Plan | `081234567890` | Catat via teks, 50 tx/bulan, 3 wallet, 5 budget |
| **Siti Rahma** | Pro Plan | `081987654321` | Unlimited tx, Foto Struk OCR, AI Advisor, Ekspor PDF/Excel |
| **Super Admin** | Superadmin | `081112223334` | Akses penuh konsol `/admin`, impersonasi, audit log |

*Anda dapat berpindah akun secara instan melalui tombol switcher di pojok kiri bawah sidebar dashboard!*

---

## 🧪 Menguji Bot Telegram Langsung dari Browser

Klik tombol **"Simulator Bot Telegram"** di navbar atas dashboard untuk mencoba interaksi bot tanpa perlu setup webhook publik:
- Ketik `beli bakso 15rb`
- Ketik `gajian 5jt`
- Ketik `/saldo`
- Ketik `/budget`
- Klik ikon kamera untuk simulasi OCR struk belanja
- Klik ikon mikrofon untuk simulasi Voice Note STT
