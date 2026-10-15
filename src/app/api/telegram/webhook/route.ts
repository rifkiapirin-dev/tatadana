import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  formatDateWib,
  formatTimeWib,
  formatRupiah,
  generateProgressBar,
} from '@/lib/utils';
import {
  parseTransactionWithAI,
  parseReceiptWithAI,
  transcribeAndParseVoice,
  evaluateFinancialAdvisor,
} from '@/lib/ai-engine';
import { Wallet, PendingTransactionConfirmation } from '@/types';

/**
 * Helper pengirim pesan balasan ke Telegram API
 */
async function sendTelegramMessage(
  botToken: string,
  chatId: number,
  text: string,
  replyMarkup?: any
) {
  if (!botToken || botToken.startsWith('demo_')) {
    console.log(`[TELEGRAM MOCK REPLY -> Chat ${chatId}]:\n${text}`);
    return;
  }

  try {
    const payload: any = {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      delete payload.parse_mode;
      payload.text = text.replace(/[*_`\[\]]/g, '');
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
  } catch (err) {
    console.error('Error sending telegram message:', err);
  }
}

/**
 * Helper pencocokan dompet berdasarkan teks, nomor urut, atau ID eksplisit
 */
function matchWalletFromInput(
  userWallets: Wallet[],
  text: string,
  explicitWalletId?: string
): Wallet | null {
  if (explicitWalletId) {
    const found = userWallets.find((w) => w.id === explicitWalletId);
    if (found) return found;
  }

  const clean = text.toLowerCase().trim();

  // 1. Callback query: wallet_wal-bca
  if (clean.startsWith('wallet_')) {
    const targetId = clean.replace('wallet_', '');
    const found = userWallets.find((w) => w.id.toLowerCase() === targetId);
    if (found) return found;
  }

  // 2. Angka pilihan urutan: 1, 2, 3, 4, [1], #1
  const numMatch = clean.match(/^\[?(\d+)\]?$/);
  if (numMatch) {
    const idx = parseInt(numMatch[1], 10) - 1;
    if (userWallets[idx]) return userWallets[idx];
  }

  // 3. Nama dompet cocok utuh atau substring
  for (const w of userWallets) {
    const wName = w.name.toLowerCase();
    if (clean === wName || clean.includes(wName) || wName.includes(clean)) {
      return w;
    }
  }

  // 4. Keyword umum perbankan & e-wallet
  if (clean.includes('bca')) {
    const found = userWallets.find((w) => w.name.toLowerCase().includes('bca'));
    if (found) return found;
  }
  if (clean.includes('mandiri')) {
    const found = userWallets.find((w) => w.name.toLowerCase().includes('mandiri'));
    if (found) return found;
  }
  if (clean.includes('gopay')) {
    const found = userWallets.find((w) => w.name.toLowerCase().includes('gopay'));
    if (found) return found;
  }
  if (clean.includes('tunai') || clean.includes('cash') || clean.includes('dompet')) {
    const found = userWallets.find(
      (w) =>
        w.type === 'cash' ||
        w.name.toLowerCase().includes('tunai') ||
        w.name.toLowerCase().includes('cash')
    );
    if (found) return found;
  }
  if (clean.includes('ovo')) {
    const found = userWallets.find((w) => w.name.toLowerCase().includes('ovo'));
    if (found) return found;
  }
  if (clean.includes('dana')) {
    const found = userWallets.find((w) => w.name.toLowerCase().includes('dana'));
    if (found) return found;
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    if (!update || !update.update_id) {
      return NextResponse.json({ ok: false, message: 'Invalid payload' }, { status: 400 });
    }

    // 1. Idempotency Check
    if (db.isTelegramUpdateProcessed(update.update_id)) {
      return NextResponse.json({ ok: true, status: 'already_processed' });
    }
    db.markTelegramUpdateProcessed(update.update_id);

    const isCallback = Boolean(update.callback_query);
    const message = update.message || update.callback_query?.message;
    if (!message && !isCallback) {
      return NextResponse.json({ ok: true, status: 'no_message' });
    }

    const chatId = message?.chat?.id || 123456789;
    const tgUserId = update.callback_query ? update.callback_query.from.id : message.from.id;
    const tgUsername = update.callback_query
      ? update.callback_query.from.username || ''
      : message.from.username || '';

    // Ambil default bot token
    const superadminUser = db.getUsers().find((u) => u.role === 'superadmin') || db.getUsers()[0];
    const configs = superadminUser ? db.getTelegramLink(superadminUser.id) : null;
    const botToken =
      update._bot_token ||
      req.headers.get('x-bot-token') ||
      process.env.TELEGRAM_BOT_TOKEN ||
      configs?.bot_token ||
      'demo_tatadana_bot_token';

    // Jawab callback query Telegram jika ada
    if (isCallback && botToken && !botToken.startsWith('demo_')) {
      fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: update.callback_query.id }),
      }).catch(() => {});
    }

    // Teks pesan
    const text = isCallback
      ? update.callback_query.data
      : message.text?.trim() || '';

    // 2. Hubungkan atau cari akun user
    let tgLink = db.getTelegramLinkByTgId(tgUserId);

    if (text.startsWith('/start')) {
      const parts = text.split(' ');
      if (parts.length > 1) {
        const code = parts[1].trim();
        const matchedLink = db.getTelegramLinkByCode(code);
        if (matchedLink) {
          db.updateTelegramLink(matchedLink.user_id, {
            telegram_user_id: tgUserId,
            telegram_username: tgUsername,
            is_connected: true,
            linked_at: new Date().toISOString(),
          });
          const user = db.getUser(matchedLink.user_id);
          const reply = `🎉 *Selamat Datang di TataDana!*\n\nAkun Telegram kamu berhasil terhubung dengan akun *${
            user?.full_name || 'TataDana'
          }*.\n\nSekarang kamu bisa langsung mencatat pengeluaran atau pemasukan hanya dengan chat:\n• _"beli bakso 15rb"_\n• _"bayar listrik 100rb"_\n• _"tambah saldo gopay 100rb"_\n\nKetik */bantuan* untuk melihat seluruh menu.`;
          await sendTelegramMessage(botToken, chatId, reply);
          return NextResponse.json({ ok: true, status: 'linked' });
        }
      } else {
        // User mengirim /start tanpa kode spesifik: hubungkan langsung ke akun utama
        const activeTarget = (tgLink ? db.getUser(tgLink.user_id) : null) || superadminUser;
        if (activeTarget) {
          tgLink = db.updateTelegramLink(activeTarget.id, {
            telegram_user_id: tgUserId,
            telegram_username: tgUsername,
            is_connected: true,
            linked_at: new Date().toISOString(),
          });
          const reply = `🎉 *Halo ${activeTarget.full_name}!*\n\nBot TataDana siap mencatat keuanganmu secara instan.\n\nContoh ketik di sini:\n💸 *Pengeluaran:* _"beli soto 20rb"_, _"kopi 25k bca"_\n💰 *Pemasukan:* _"gajian 5jt"_, _"transfer 500rb"_\n\nKetik */saldo* untuk cek dompet atau */bantuan* untuk panduan lengkap.`;
          await sendTelegramMessage(botToken, chatId, reply);
          return NextResponse.json({ ok: true, status: 'started' });
        }
      }
    }

    if (!tgLink || !tgLink.is_connected) {
      if (superadminUser) {
        tgLink = db.updateTelegramLink(superadminUser.id, {
          telegram_user_id: tgUserId,
          telegram_username: tgUsername,
          is_connected: true,
        });
      } else {
        const notLinkedReply = `👋 Halo! Akun Telegram kamu belum terhubung ke TataDana.\n\nSilakan buka aplikasi TataDana di menu *Settings → Bot Telegram* untuk mendapatkan kode pairing.`;
        await sendTelegramMessage(botToken, chatId, notLinkedReply);
        return NextResponse.json({ ok: true, status: 'not_linked' });
      }
    }

    const user = db.getUser(tgLink.user_id);
    if (!user) {
      return NextResponse.json({ ok: false, error: 'User not found' });
    }

    // 3. Enforcement Limit Paket (Starter max 50 transaksi/bulan)
    if (user.plan === 'starter' && user.monthly_txn_count >= 50) {
      const limitReply = `⚠️ *Limit Transaksi Bulanan Tercapai*\n\nAkun Starter kamu telah mencapai batas 50 transaksi untuk bulan ini.\n\n🚀 *Upgrade ke Paket Pro* untuk transaksi *unlimited*!\n👉 Buka menu Upgrade di aplikasi TataDana.`;
      await sendTelegramMessage(botToken, chatId, limitReply);
      return NextResponse.json({ ok: true, status: 'limit_reached' });
    }

    const userWallets = db.getWallets(user.id);
    const userCategories = db.getCategories(user.id);
    const defaultWallet = db.getDefaultWallet(user.id) || userWallets[0];

    // =========================================================================
    // 4. PENANGANAN KONFIRMASI DOMPET YANG SEDANG BERJALAN (PENDING CONFIRMATION)
    // =========================================================================
    const pendingConf = db.getPendingConfirmation(user.id);

    if (pendingConf) {
      const cleanInput = text.toLowerCase().trim();

      // Kasus A: Pembatalan konfirmasi
      if (
        cleanInput === 'batal' ||
        cleanInput === 'cancel' ||
        cleanInput === '/batal' ||
        cleanInput === '/cancel' ||
        cleanInput === 'cancel_tx'
      ) {
        db.clearPendingConfirmation(user.id);
        const cancelReply = `❌ *Pencatatan Transaksi Dibatalkan*\n\nTransaksi pengeluaran *"${
          pendingConf.notes
        }"* sejumlah *${formatRupiah(
          pendingConf.amount
        )}* telah dibatalkan. Saldo dompet Anda tidak berubah.`;
        await sendTelegramMessage(botToken, chatId, cancelReply);
        return NextResponse.json({
          ok: true,
          status: 'confirmation_cancelled',
          reply: cancelReply,
        });
      }

      // Kasus B: Pemilihan dompet oleh pengguna
      const explicitWalletId = (message as any)?.selected_wallet_id;
      const chosenWallet = matchWalletFromInput(userWallets, text, explicitWalletId);

      if (chosenWallet) {
        // Buat transaksi pengeluaran dan potong saldo dompet yang dipilih
        const newTx = db.createTransaction(user.id, {
          wallet_id: chosenWallet.id,
          category_id: pendingConf.category_id,
          type: 'expense',
          amount: pendingConf.amount,
          notes: pendingConf.notes,
          source: pendingConf.source,
          is_ocr: false,
          transaction_date: new Date().toISOString(),
        });

        // Bersihkan antrean konfirmasi
        db.clearPendingConfirmation(user.id);
        const updatedWallet = db.getWallet(chosenWallet.id);

        const budgets = db.getBudgets(user.id);
        const matchedBudget = budgets.find((b) => b.category_id === pendingConf.category_id);

        let reply = `📅 ${formatDateWib(new Date())} — ${formatTimeWib(new Date())}\n`;
        reply += `💸 *Pengeluaran Berhasil Dicatat!*\n`;
        reply += `├ Nominal : *${formatRupiah(pendingConf.amount)}*\n`;
        reply += `├ Kategori : ${pendingConf.category_name || 'Pengeluaran'}\n`;
        reply += `├ Dompet : 👛 ${chosenWallet.name}\n`;
        reply += `├ Catatan : ${pendingConf.notes}\n`;
        reply += `└ Sisa Saldo : *${formatRupiah(updatedWallet?.balance || 0)}*\n\n`;

        if (matchedBudget) {
          const spent = matchedBudget.current_spent || 0;
          const pct = Math.round((spent / matchedBudget.monthly_limit) * 100);
          const rem = Math.max(0, matchedBudget.monthly_limit - spent);
          const bar = generateProgressBar(pct, 10);
          reply += `📊 *Budget ${pendingConf.category_name} bulan ini:*\n`;
          reply += `[${bar}] ${pct}% — sisa ${formatRupiah(rem)}\n`;

          if (pct >= 100) {
            reply += `⚠️ *Perhatian:* Budget untuk kategori ini sudah melampaui batas bulanan!`;
          } else if (pct >= 80) {
            reply += `⚠️ *Hati-hati:* Budget hampir habis! Yuk lebih selektif lagi.`;
          } else {
            reply += `👍 Pengeluaran terkontrol dengan baik!`;
          }
        }

        await sendTelegramMessage(botToken, chatId, reply);

        // Evaluasi saran finansial proaktif AI
        const advisor = evaluateFinancialAdvisor(user.id, newTx);
        if (advisor.triggered) {
          await sendTelegramMessage(botToken, chatId, advisor.message);
        }

        return NextResponse.json({
          ok: true,
          status: 'expense_recorded',
          wallet: chosenWallet,
          new_balance: updatedWallet?.balance,
          reply,
        });
      } else {
        // Belum cocok: ingatkan kembali untuk memilih dompet
        let reply = `💳 *Mau bayar melalui rekening atau e-wallet yang mana?*\n\n`;
        reply += `Silakan pilih dompet untuk pembayaran *${pendingConf.notes}* sejumlah *${formatRupiah(
          pendingConf.amount
        )}*:\n\n`;
        userWallets.forEach((w, idx) => {
          reply += `[${idx + 1}] ${w.name} (${formatRupiah(w.balance)})\n`;
        });
        reply += `\nBalas dengan nomor *[1-${userWallets.length}]* atau ketik nama dompet (contoh: *BCA*, *Mandiri*, *GoPay*, *Cash*).\nKetik *batal* untuk membatalkan.`;

        const inlineKeyboard = {
          inline_keyboard: [
            userWallets.map((w, idx) => ({
              text: `[${idx + 1}] ${w.name}`,
              callback_data: `wallet_${w.id}`,
            })),
            [{ text: '✕ Batal', callback_data: 'cancel_tx' }],
          ],
        };

        await sendTelegramMessage(botToken, chatId, reply, inlineKeyboard);
        return NextResponse.json({
          ok: true,
          status: 'awaiting_wallet_confirmation',
          reply,
          pending_confirmation: pendingConf,
          wallets: userWallets,
        });
      }
    }

    // =========================================================================
    // 5. PERINTAH BOT TELEGRAM (/saldo, /budget, /bantuan, dll)
    // =========================================================================
    if (text.startsWith('/')) {
      const cmd = text.toLowerCase().split(' ')[0];

      if (cmd === '/saldo') {
        const totalSaldo = userWallets.reduce((s, w) => s + Number(w.balance), 0);
        let msg = `👛 *Saldo Dompet TataDana*\n\n`;
        userWallets.forEach((w, idx) => {
          msg += `[${idx + 1}] ${w.name}: *${formatRupiah(w.balance)}*${
            w.is_default ? ' (Utama)' : ''
          }\n`;
        });
        msg += `\n💰 *Total Saldo:* ${formatRupiah(totalSaldo)}`;
        await sendTelegramMessage(botToken, chatId, msg);
        return NextResponse.json({ ok: true, command: '/saldo', reply: msg });
      }

      if (cmd === '/hari' || cmd === '/hari_ini' || text.toLowerCase() === '/hari ini') {
        const todayIso = new Date().toISOString().split('T')[0];
        const txs = db.getTransactions(user.id, { startDate: todayIso, endDate: todayIso });
        const totalOut = txs
          .filter((t) => t.type === 'expense')
          .reduce((s, t) => s + Number(t.amount), 0);
        const totalIn = txs
          .filter((t) => t.type === 'income')
          .reduce((s, t) => s + Number(t.amount), 0);

        let msg = `📅 *Rekap Transaksi Hari Ini*\n${formatDateWib(new Date())}\n\n`;
        if (txs.length === 0) {
          msg += `Belum ada transaksi yang dicatat hari ini. Yuk catat transaksimu! 📝`;
        } else {
          txs.forEach((t) => {
            const icon = t.type === 'expense' ? '💸' : '💰';
            msg += `${icon} *${formatRupiah(t.amount)}* — ${
              t.notes || t.category?.name || 'Transaksi'
            }\n`;
          });
          msg += `\n🔻 Total Pengeluaran: *${formatRupiah(
            totalOut
          )}*\n🔺 Total Pemasukan: *${formatRupiah(totalIn)}*`;
        }
        await sendTelegramMessage(botToken, chatId, msg);
        return NextResponse.json({ ok: true, reply: msg });
      }

      if (cmd === '/budget') {
        const budgets = db.getBudgets(user.id);
        let msg = `🎯 *Status Budget Bulan Ini*\n\n`;
        budgets.forEach((b) => {
          const spent = b.current_spent || 0;
          const limit = b.monthly_limit;
          const pct = Math.round((spent / limit) * 100);
          const remaining = Math.max(0, limit - spent);
          const bar = generateProgressBar(pct, 10);
          msg += `${b.category?.name || 'Kategori'}:\n${bar} ${pct}% — Sisa ${formatRupiah(
            remaining
          )}\n\n`;
        });
        await sendTelegramMessage(botToken, chatId, msg);
        return NextResponse.json({ ok: true, reply: msg });
      }

      if (cmd === '/bantuan' || cmd === '/help') {
        const msg = `💡 *Panduan Perintah TataDana*\n\n*Format Chat Langsung:*
• _"beli bakso 15rb"_ → Bot konfirmasi pilihan dompet (BCA, Mandiri, GoPay, Tunai)
• _"bayar listrik 100rb"_ → Bot konfirmasi pilihan dompet
• _"tambah saldo gopay 100rb"_ → Top up saldo e-wallet
• _"gajian 5jt"_ → Catat pemasukan gaji
• Kirim Foto Struk (Paket Pro) 📷
• Kirim Voice Note 🎙️

*Perintah Cepat:*
• /saldo — Cek saldo semua dompet
• /hari ini — Rekap transaksi hari ini
• /budget — Pantau batas anggaran
• /batal — Batalkan transaksi yang sedang dikonfirmasi`;
        await sendTelegramMessage(botToken, chatId, msg);
        return NextResponse.json({ ok: true, reply: msg });
      }
    }

    // =========================================================================
    // 6. INPUT FOTO STRUK OCR (Paket Pro Saja)
    // =========================================================================
    if (message.photo && message.photo.length > 0) {
      if (user.plan !== 'pro') {
        const upgradeMsg = `📷 *Fitur Foto Struk Khusus Paket Pro*\n\nFitur AI OCR foto struk otomatis hanya tersedia untuk pengguna *Pro*.\n\n✨ Upgrade sekali bayar Rp99.000 untuk menikmati transaksi tanpa batas!\n👉 Buka menu Upgrade di aplikasi TataDana.`;
        await sendTelegramMessage(botToken, chatId, upgradeMsg);
        return NextResponse.json({ ok: true, status: 'photo_restricted_starter' });
      }

      const fileId = message.photo[message.photo.length - 1].file_id;
      const parsedReceipt = await parseReceiptWithAI(fileId, userCategories, user.id);
      const belanjaCat =
        userCategories.find((c) => c.name.includes('Belanja')) || userCategories[0];

      // Tanya konfirmasi dompet untuk struk
      const pendingData: PendingTransactionConfirmation = {
        id: `pend-rc-${Date.now()}`,
        user_id: user.id,
        telegram_chat_id: chatId,
        type: 'expense',
        amount: parsedReceipt.total,
        category_id: belanjaCat.id,
        category_name: belanjaCat.name,
        notes: `Belanja di ${parsedReceipt.merchant} (${parsedReceipt.items.length} item)`,
        source: 'telegram_photo',
        created_at: new Date().toISOString(),
      };
      db.setPendingConfirmation(user.id, pendingData);

      let receiptReply = `🧾 *Struk Berhasil Diekstrak AI!*\n`;
      receiptReply += `├ Merchant : 🏪 ${parsedReceipt.merchant}\n`;
      receiptReply += `├ Total    : *${formatRupiah(parsedReceipt.total)}*\n`;
      receiptReply += `└ Item     : ${parsedReceipt.items.length} produk\n\n`;
      receiptReply += `Mau bayar melalui rekening atau e-wallet yang mana?\n`;
      userWallets.forEach((w, idx) => {
        receiptReply += `[${idx + 1}] ${w.name} (${formatRupiah(w.balance)})\n`;
      });
      receiptReply += `\nBalas dengan nomor [1-${userWallets.length}] atau ketik nama dompet.`;

      const inlineKeyboard = {
        inline_keyboard: [
          userWallets.map((w, idx) => ({
            text: `[${idx + 1}] ${w.name}`,
            callback_data: `wallet_${w.id}`,
          })),
          [{ text: '✕ Batal', callback_data: 'cancel_tx' }],
        ],
      };

      await sendTelegramMessage(botToken, chatId, receiptReply, inlineKeyboard);
      return NextResponse.json({
        ok: true,
        status: 'awaiting_wallet_confirmation',
        reply: receiptReply,
        pending_confirmation: pendingData,
        wallets: userWallets,
      });
    }

    // =========================================================================
    // 7. INPUT SUARA / VOICE NOTE (STT)
    // =========================================================================
    if (message.voice || message.audio) {
      const audioDuration = message.voice?.duration || message.audio?.duration || 10;
      const audioInput =
        message.caption ||
        (message.voice?.file_id ? `voice_${message.voice.file_id}` : 'audio_stream');
      const { transcript, parsed, error } = await transcribeAndParseVoice(
        audioInput,
        userCategories,
        user.id,
        audioDuration
      );

      if (error || !parsed.nominal || parsed.nominal <= 0) {
        const errorReply = `⚠️ *Transkrip Suara Kurang Jelas*\n\n🎙️ Transkrip: "${transcript}"\n\nTataDana kesulitan mengenali nominal transaksi. Silakan ulangi dengan lebih jelas.`;
        await sendTelegramMessage(botToken, chatId, errorReply);
        return NextResponse.json({ ok: true, status: 'voice_ambiguous' });
      }

      const matchedCat =
        userCategories.find((c) => c.name === parsed.kategori_nama) || userCategories[0];

      // Jika Pemasukan / Top-Up dari Voice Note -> langsung catat
      if (parsed.jenis === 'income') {
        const targetWallet =
          (parsed.target_wallet &&
            db.findWalletByNameOrAlias(user.id, parsed.target_wallet)) ||
          defaultWallet;

        db.createTransaction(user.id, {
          wallet_id: targetWallet.id,
          category_id: matchedCat.id,
          type: 'income',
          amount: parsed.nominal,
          notes: parsed.catatan,
          source: 'telegram_voice',
          is_ocr: false,
          transaction_date: new Date().toISOString(),
        });
        const updatedWallet = db.getWallet(targetWallet.id);

        let reply = `🎙️ Transkrip: "${transcript}"\n\n`;
        reply += `💰 *Pemasukan Tercatat!*\n`;
        reply += `├ Nominal : *${formatRupiah(parsed.nominal)}*\n`;
        reply += `├ Dompet : 👛 ${targetWallet.name}\n`;
        reply += `└ Saldo baru : *${formatRupiah(updatedWallet?.balance || 0)}* 📈`;

        await sendTelegramMessage(botToken, chatId, reply);
        return NextResponse.json({
          ok: true,
          status: 'voice_income_recorded',
          wallet: targetWallet,
          new_balance: updatedWallet?.balance,
          reply,
        });
      }

      // Jika Pengeluaran dari Voice Note -> Wajib konfirmasi dompet!
      const pendingData: PendingTransactionConfirmation = {
        id: `pend-vn-${Date.now()}`,
        user_id: user.id,
        telegram_chat_id: chatId,
        type: 'expense',
        amount: parsed.nominal,
        category_id: matchedCat.id,
        category_name: matchedCat.name,
        notes: parsed.catatan,
        source: 'telegram_voice',
        created_at: new Date().toISOString(),
      };
      db.setPendingConfirmation(user.id, pendingData);

      let reply = `🎙️ Transkrip: "${transcript}"\n\n`;
      reply += `💳 *Konfirmasi Rekening / E-Wallet*\n`;
      reply += `Mau bayar melalui rekening atau e-wallet yang mana?\n`;
      reply += `├ Transaksi : *${parsed.catatan}*\n`;
      reply += `├ Nominal   : *${formatRupiah(parsed.nominal)}*\n\n`;
      reply += `*Pilihan dompet:*\n`;
      userWallets.forEach((w, idx) => {
        reply += `[${idx + 1}] ${w.name} (${formatRupiah(w.balance)})\n`;
      });
      reply += `\nBalas dengan angka [1-${userWallets.length}] atau ketik nama dompet.`;

      const inlineKeyboard = {
        inline_keyboard: [
          userWallets.map((w, idx) => ({
            text: `[${idx + 1}] ${w.name}`,
            callback_data: `wallet_${w.id}`,
          })),
          [{ text: '✕ Batal', callback_data: 'cancel_tx' }],
        ],
      };

      await sendTelegramMessage(botToken, chatId, reply, inlineKeyboard);
      return NextResponse.json({
        ok: true,
        status: 'awaiting_wallet_confirmation',
        reply,
        pending_confirmation: pendingData,
        wallets: userWallets,
      });
    }

    // =========================================================================
    // 8. INPUT TEKS NATURAL LANGUAGE (Chat Teks)
    // =========================================================================
    if (text) {
      const parsed = await parseTransactionWithAI(text, userCategories, user.id);

      if (parsed.is_ambiguous || !parsed.nominal || parsed.nominal <= 0) {
        const errorReply = `❓ *Format Transaksi Belum Jelas*\n\n${
          parsed.ambiguity_reason || 'TataDana kesulitan mengenali nominal atau maksud pesan.'
        }\n\n💡 *Contoh format yang didukung:*\n• _beli bakso 15rb_\n• _bayar listrik 100rb_\n• _tambah saldo gopay 100rb_\n• _gajian 5jt_`;
        await sendTelegramMessage(botToken, chatId, errorReply);
        return NextResponse.json({ ok: true, status: 'ambiguous_text', reply: errorReply });
      }

      // Kategori matching
      let matchedCat = userCategories.find(
        (c) =>
          c.name.toLowerCase().includes(parsed.kategori_nama.toLowerCase()) ||
          parsed.kategori_nama.toLowerCase().includes(c.name.toLowerCase())
      );
      if (!matchedCat) {
        matchedCat = userCategories.find((c) => c.type === parsed.jenis) || userCategories[0];
      }

      // =======================================================================
      // A. JIKA TRANSAKSI PENGELUARAN / PEMBAYARAN:
      // WAJIB KONFIRMASI DOMPET: "Mau bayar melalui rekening atau e-wallet yang mana?"
      // =======================================================================
      if (parsed.jenis === 'expense') {
        const pendingData: PendingTransactionConfirmation = {
          id: `pend-tx-${Date.now()}`,
          user_id: user.id,
          telegram_chat_id: chatId,
          type: 'expense',
          amount: parsed.nominal,
          category_id: matchedCat.id,
          category_name: matchedCat.name,
          notes: parsed.catatan,
          source: 'telegram_text',
          created_at: new Date().toISOString(),
        };

        db.setPendingConfirmation(user.id, pendingData);

        let reply = `💳 *Konfirmasi Rekening / E-Wallet*\n\n`;
        reply += `Mau bayar melalui rekening atau e-wallet yang mana?\n`;
        reply += `├ Transaksi : *${parsed.catatan}*\n`;
        reply += `├ Nominal : *${formatRupiah(parsed.nominal)}*\n`;
        reply += `└ Kategori : ${matchedCat.name}\n\n`;
        reply += `*Pilihan dompet Anda:*\n`;
        userWallets.forEach((w, idx) => {
          reply += `[${idx + 1}] ${w.name} (${formatRupiah(w.balance)})\n`;
        });
        reply += `\nSilakan balas dengan angka *[1-${userWallets.length}]* atau ketik nama dompet (contoh: *BCA*, *Mandiri*, *GoPay*, *Cash*).\nKetik *batal* untuk membatalkan.`;

        const inlineKeyboard = {
          inline_keyboard: [
            userWallets.map((w, idx) => ({
              text: `[${idx + 1}] ${w.name}`,
              callback_data: `wallet_${w.id}`,
            })),
            [{ text: '✕ Batal', callback_data: 'cancel_tx' }],
          ],
        };

        await sendTelegramMessage(botToken, chatId, reply, inlineKeyboard);
        return NextResponse.json({
          ok: true,
          status: 'awaiting_wallet_confirmation',
          reply,
          pending_confirmation: pendingData,
          wallets: userWallets,
        });
      }

      // =======================================================================
      // B. JIKA TRANSAKSI PEMASUKAN / TOP UP SALDO:
      // Saldo dompet bertambah dan nota konfirmasi ditampilkan
      // =======================================================================
      if (parsed.jenis === 'income') {
        let chosenWallet = defaultWallet;
        if (parsed.target_wallet) {
          const matchedW = db.findWalletByNameOrAlias(user.id, parsed.target_wallet);
          if (matchedW) {
            chosenWallet = matchedW;
          } else {
            const isEwallet = ['GoPay', 'OVO', 'DANA', 'ShopeePay'].includes(parsed.target_wallet);
            const newW = db.createWallet(user.id, {
              name: parsed.target_wallet,
              type: isEwallet ? 'ewallet' : 'bank',
              balance: 0,
              is_default: false,
              icon: isEwallet ? 'smartphone' : 'credit-card',
              color: '#10B981',
            });
            chosenWallet = newW;
          }
        }

        const isTopUp =
          parsed.kategori_nama.toLowerCase().includes('top up') ||
          parsed.kategori_nama.toLowerCase().includes('tabungan') ||
          parsed.catatan.toLowerCase().includes('isi saldo') ||
          parsed.catatan.toLowerCase().includes('tambah saldo') ||
          parsed.catatan.toLowerCase().includes('top up') ||
          parsed.catatan.toLowerCase().includes('nabung') ||
          parsed.catatan.toLowerCase().includes('setor');

        db.createTransaction(user.id, {
          wallet_id: chosenWallet.id,
          category_id: matchedCat.id,
          type: 'income',
          amount: parsed.nominal,
          notes: parsed.catatan,
          source: 'telegram_text',
          is_ocr: false,
          transaction_date: new Date().toISOString(),
        });

        const updatedWallet = db.getWallet(chosenWallet.id);

        let reply = `📅 ${formatDateWib(new Date())} — ${formatTimeWib(new Date())}\n`;
        if (isTopUp) {
          reply += `💰 *Saldo Berhasil Ditambahkan!*\n`;
          reply += `├ Nominal : *${formatRupiah(parsed.nominal)}*\n`;
          reply += `├ Dompet : 👛 ${chosenWallet.name}\n`;
          reply += `├ Kategori : 📥 ${matchedCat.name}\n`;
          reply += `├ Catatan : ${parsed.catatan}\n`;
          reply += `└ Saldo baru : *${formatRupiah(updatedWallet?.balance || 0)}* 📈\n\n`;
          reply += `✨ Tabunganmu bertambah! Saldo langsung siap digunakan atau disimpan dengan aman 💪`;
        } else {
          reply += `💰 *Pemasukan tercatat!*\n`;
          reply += `├ Nominal : *${formatRupiah(parsed.nominal)}*\n`;
          reply += `├ Kategori : 💼 Pemasukan\n`;
          reply += `├ Dompet : 👛 ${chosenWallet.name}\n`;
          reply += `└ Saldo baru : *${formatRupiah(updatedWallet?.balance || 0)}*\n\n`;
          reply += `💪 Semangat terus! Jangan lupa sisihkan untuk tabungan ya.`;
        }

        await sendTelegramMessage(botToken, chatId, reply);
        return NextResponse.json({
          ok: true,
          status: 'income_recorded',
          is_topup: isTopUp,
          wallet: chosenWallet,
          new_balance: updatedWallet?.balance,
          reply,
        });
      }
    }

    return NextResponse.json({ ok: true, status: 'unhandled_message_type' });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
