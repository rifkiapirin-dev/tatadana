import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';

export const metadata: Metadata = {
  title: 'TataDana — Catat Keuangan Semudah Chat dari Telegram Kamu',
  description:
    'Aplikasi manajemen keuangan pribadi modern terintegrasi bot Telegram. Catat pengeluaran dan pemasukan dengan bahasa natural atau foto struk AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-emerald-500 selection:text-white">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
