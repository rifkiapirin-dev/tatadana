import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { formatRupiah, formatDateWib } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const { userId, fileType, startDate, endDate, categoryId, walletId } = await req.json();
    const uId = userId || 'usr-budi-01';
    const user = db.getUser(uId);

    if (!user) {
      return NextResponse.json({ ok: false, error: 'User tidak ditemukan' }, { status: 404 });
    }

    // Check Plan restriction: Starter cannot export PDF/Excel
    if (user.plan === 'starter') {
      return NextResponse.json(
        {
          ok: false,
          error: 'Export laporan ke PDF dan Excel adalah fitur eksklusif paket Pro. Silakan upgrade paketmu.',
        },
        { status: 403 }
      );
    }

    const txs = db.getTransactions(uId, {
      startDate,
      endDate,
      categoryId,
      walletId,
    });

    const periodStr = startDate && endDate ? `${startDate} s/d ${endDate}` : 'Semua Periode';
    const ext = fileType === 'pdf' ? 'pdf' : 'xlsx';
    const fileName = `Laporan-TataDana-${Date.now()}.${ext}`;

    // Create export history record
    const exportId = `exp-${Date.now()}`;
    const exportRecord = db.createExportHistory({
      id: exportId,
      user_id: uId,
      file_name: fileName,
      file_type: fileType === 'pdf' ? 'pdf' : 'xlsx',
      date_range: periodStr,
      download_url: `/api/reports/download?id=${exportId}&userId=${uId}`,
      file_size_bytes: 45000 + txs.length * 280,
      expires_at: new Date(Date.now() + 86400000 * 7).toISOString(),
    });

    return NextResponse.json({
      ok: true,
      export: exportRecord,
      message: `Laporan ${fileType.toUpperCase()} berhasil dibuat!`,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
