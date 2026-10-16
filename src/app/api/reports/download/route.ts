import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { formatRupiah, formatDateWib } from '@/lib/utils';
import { getSupabaseTransactions, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  let format = searchParams.get('format') || '';
  let uId = searchParams.get('userId') || 'usr-admin-rifki';
  let fileName = `Laporan-TataDana-${Date.now()}`;

  if (id) {
    const allHistory = db.getExportHistory(uId);
    let matched = allHistory.find((e) => e.id === id);
    if (!matched) {
      // Coba cari dari semua user
      const users = db.getUsers();
      for (const u of users) {
        const uHistory = db.getExportHistory(u.id);
        const f = uHistory.find((e) => e.id === id);
        if (f) {
          matched = f;
          break;
        }
      }
    }

    if (matched) {
      uId = matched.user_id;
      if (!format) format = matched.file_type;
      fileName = matched.file_name.replace(/\.[^/.]+$/, '');
    }
  }

  if (!format) format = 'csv';

  const user = db.getUser(uId);
  let txs = db.getTransactions(uId);

  if (isSupabaseConfigured()) {
    try {
      const sbTxs = await getSupabaseTransactions(uId, 200);
      if (sbTxs && sbTxs.length > 0) {
        txs = sbTxs as any;
      }
    } catch (e) {}
  }

  if (format === 'csv' || format === 'xlsx') {
    let csv = 'ID Transaksi,Tanggal,Jenis,Kategori,Dompet,Nominal,Catatan,Sumber\n';
    txs.forEach((t) => {
      const row = [
        `"${t.id}"`,
        `"${formatDateWib(t.transaction_date)}"`,
        `"${t.type}"`,
        `"${t.category?.name || '-'}"`,
        `"${t.wallet?.name || '-'}"`,
        `"${t.amount}"`,
        `"${(t.notes || '').replace(/"/g, '""')}"`,
        `"${t.source}"`,
      ].join(',');
      csv += row + '\n';
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}.csv"`,
      },
    });
  }

  // Printable HTML for PDF download
  const totalIn = txs.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalOut = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Laporan Keuangan TataDana</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1e293b; }
    .header { border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
    h1 { margin: 0; color: #047857; font-size: 24px; }
    .tagline { color: #64748b; font-size: 14px; margin-top: 4px; }
    .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 30px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
    .card-title { font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: bold; }
    .card-val { font-size: 20px; font-weight: bold; margin-top: 6px; }
    .green { color: #10b981; }
    .red { color: #ef4444; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #f1f5f9; text-align: left; padding: 10px; font-size: 12px; border-bottom: 2px solid #cbd5e1; }
    td { padding: 10px; font-size: 13px; border-bottom: 1px solid #e2e8f0; }
    .footer { margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>TataDana — Laporan Keuangan</h1>
      <div class="tagline">Pengguna: <b>${user?.full_name || 'TataDana User'}</b> (${user?.email || ''}) • Catat keuangan semudah chat • Dicetak pada ${new Date().toLocaleString('id-ID')}</div>
    </div>
  </div>

  <div class="summary-grid">
    <div class="card">
      <div class="card-title">Total Pemasukan</div>
      <div class="card-val green">${formatRupiah(totalIn)}</div>
    </div>
    <div class="card">
      <div class="card-title">Total Pengeluaran</div>
      <div class="card-val red">${formatRupiah(totalOut)}</div>
    </div>
    <div class="card">
      <div class="card-title">Net Cashflow</div>
      <div class="card-val">${formatRupiah(totalIn - totalOut)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Tanggal</th>
        <th>Jenis</th>
        <th>Kategori</th>
        <th>Dompet</th>
        <th>Catatan</th>
        <th style="text-align: right;">Nominal</th>
      </tr>
    </thead>
    <tbody>
      ${txs
        .map(
          (t) => `
        <tr>
          <td>${formatDateWib(t.transaction_date)}</td>
          <td><span style="font-weight: 600; color: ${t.type === 'expense' ? '#ef4444' : '#10b981'}">${t.type.toUpperCase()}</span></td>
          <td>${t.category?.name || '-'}</td>
          <td>${t.wallet?.name || '-'}</td>
          <td>${t.notes || '-'}</td>
          <td style="text-align: right; font-weight: bold;">${formatRupiah(t.amount)}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <div class="footer">
    Dokumen ini dicetak secara otomatis dari TataDana Fintech Platform. Seluruh data transaksi dijamin aman dan terenkripsi.
  </div>
  <script>window.print();</script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
