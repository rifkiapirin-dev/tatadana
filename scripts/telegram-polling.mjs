/**
 * TataDana - Telegram Bot Local Polling Bridge
 * 
 * Skrip ini memungkinkan bot Telegram Anda di HP/Desktop merespons secara langsung 
 * saat aplikasi berjalan di localhost, tanpa perlu ngrok atau konfigurasi webhook publik!
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Baca token dari argumen CLI atau file .env.local
let token = process.argv[2];

if (!token || token.startsWith('--')) {
  const envPath = path.join(rootDir, '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/TELEGRAM_BOT_TOKEN=["']?([^"'\r\n]+)["']?/);
    if (match && match[1]) {
      token = match[1].trim();
    }
  }
}

console.log('\n======================================================');
console.log('       🍃 TataDana - Telegram Polling Bridge');
console.log('======================================================\n');

if (!token || token === 'demo_tatadana_bot_token' || token.trim() === '') {
  console.log('⚠️  TOKEN TELEGRAM BELUM DIATUR ATAU MASIH DEMO!\n');
  console.log('Alasan bot tidak membalas di Telegram:');
  console.log('1. Bot Telegram Anda butuh token resmi dari @BotFather.');
  console.log('2. Server Telegram di internet butuh jalur untuk mengirim pesan ke aplikasi Anda.\n');
  console.log('CARA MENGHUBUNGKAN BOT TELEGRAM ASLI ANDA:');
  console.log('------------------------------------------------------');
  console.log('1. Buka aplikasi Telegram di HP/Laptop, cari: @BotFather');
  console.log('2. Kirim perintah: /newbot');
  console.log('3. Beri nama bot (contoh: Dompet Finansialku)');
  console.log('4. Beri username berakhiran "bot" (contoh: tatadana_anda_bot)');
  console.log('5. BotFather akan memberikan HTTP API Token berbentuk:');
  console.log('   123456789:ABCdefGHIjklmNoPQRsTUVwxyZ');
  console.log('6. Jalankan polling dengan token tersebut:');
  console.log('   npm run bot:poll -- <TOKEN_ANDA>');
  console.log('   atau masukkan token ke file .env.local:');
  console.log('   TELEGRAM_BOT_TOKEN="<TOKEN_ANDA>"\n');
  console.log('💡 TIPS: Anda juga bisa mencoba simulasi chat instan tanpa token');
  console.log('   di dashboard web: http://localhost:3000/dashboard');
  console.log('   dengan mengklik tombol "Simulator Bot Telegram".\n');
  process.exit(1);
}

const LOCAL_WEBHOOK_URL = 'http://localhost:3000/api/telegram/webhook';

async function main() {
  console.log(`🔍 Memeriksa koneksi token Telegram ke Telegram API...`);

  // 1. Hapus webhook lama agar getUpdates diizinkan
  try {
    const delRes = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=false`);
    const delJson = await delRes.json();
    if (!delJson.ok) {
      console.warn('⚠️ Gagal reset webhook (mungkin token salah):', delJson.description);
    }
  } catch (err) {
    console.error('❌ Tidak dapat menghubungi Telegram API (periksa koneksi internet Anda):', err.message);
    process.exit(1);
  }

  // 2. Ambil profil bot (getMe)
  let botInfo;
  try {
    const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const meJson = await meRes.json();
    if (!meJson.ok) {
      console.error(`❌ Token Telegram salah atau tidak valid! Deskripsi: ${meJson.description}`);
      console.log('Periksa kembali token yang Anda dapatkan dari @BotFather.');
      process.exit(1);
    }
    botInfo = meJson.result;
  } catch (err) {
    console.error('❌ Gagal memeriksa profil bot:', err.message);
    process.exit(1);
  }

  // 3. Cek apakah server TataDana lokal aktif
  try {
    const testLocal = await fetch('http://localhost:3000', { method: 'HEAD' });
    if (!testLocal.ok && testLocal.status >= 500) {
      console.warn('⚠️ Server lokal di http://localhost:3000 mengembalikan status error:', testLocal.status);
    }
  } catch (err) {
    console.error('⚠️ PERINGATAN: Server TataDana (http://localhost:3000) belum berjalan!');
    console.log('👉 Pastikan Anda sudah menjalankan "npm run dev" di terminal lain.');
    console.log('Polling akan tetap dimulai dan menunggu server Next.js siap...\n');
  }

  console.log(`\n✅ BERHASIL TERHUBUNG KE TELEGRAM!`);
  console.log(`🤖 Bot Name    : ${botInfo.first_name}`);
  console.log(`🔗 Bot Username: @${botInfo.username} (https://t.me/${botInfo.username})`);
  console.log(`📡 Local Target: ${LOCAL_WEBHOOK_URL}`);
  console.log(`\n🚀 POLLING AKTIF! Sekarang Anda bisa membuka Telegram dan chat ke @${botInfo.username}`);
  console.log(`Contoh ketik:`);
  console.log(`  • /start`);
  console.log(`  • beli soto 20rb`);
  console.log(`  • tambah saldo gopay 150rb`);
  console.log(`  • /saldo`);
  console.log(`------------------------------------------------------\n`);

  let offset = 0;
  let isRunning = true;

  process.on('SIGINT', () => {
    console.log('\n🛑 Menghentikan polling Telegram...');
    isRunning = false;
    process.exit(0);
  });

  while (isRunning) {
    try {
      const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=20&allowed_updates=["message","callback_query"]`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.ok && Array.isArray(data.result) && data.result.length > 0) {
        for (const update of data.result) {
          offset = update.update_id + 1;

          const isCallback = Boolean(update.callback_query);
          const msg = update.message || update.callback_query?.message;
          const sender = update.callback_query?.from?.username
            ? `@${update.callback_query.from.username}`
            : msg?.from?.username
            ? `@${msg.from.username}`
            : (update.callback_query?.from?.first_name || msg?.from?.first_name || 'User');
          const text = isCallback
            ? `[Pilihan Dompet: ${update.callback_query.data}]`
            : msg?.text || (msg?.photo ? '[Foto Struk]' : (msg?.voice ? '[Voice Note]' : '[Pesan]'));
          const time = new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' });

          console.log(`[${time} WIB] 📩 Dari ${sender}: "${text}"`);

          // Teruskan ke backend TataDana
          try {
            const forwardRes = await fetch(LOCAL_WEBHOOK_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-bot-token': token,
              },
              body: JSON.stringify({
                ...update,
                _bot_token: token,
              }),
            });

            const forwardJson = await forwardRes.json().catch(() => ({}));
            if (forwardRes.ok) {
              console.log(`   └─ ✅ Berhasil diproses (Status: ${forwardJson.status || 'OK'})\n`);
            } else {
              console.log(`   └─ ⚠️ Response backend: HTTP ${forwardRes.status} (${forwardJson.error || forwardJson.message || 'error'})\n`);
            }
          } catch (forwardErr) {
            console.error(`   └─ ❌ Gagal meneruskan ke ${LOCAL_WEBHOOK_URL}: ${forwardErr.message}\n`);
          }
        }
      } else if (!data.ok) {
        console.warn('⚠️ Telegram error saat getUpdates:', data.description);
        await new Promise(r => setTimeout(r, 3000));
      }
    } catch (err) {
      // Timeout normal dari long polling atau network glitch
      if (err.name !== 'AbortError') {
        console.warn('Koneksi timeout/reconnecting...', err.message);
      }
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

main().catch(err => {
  console.error('Fatal polling error:', err);
});
