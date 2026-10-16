import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const superadmin = db.getUsers().find((u) => u.role === 'superadmin') || db.getUsers()[0];
    const effectiveUserId = userId || superadmin?.id || 'usr-admin-rifki';
    let link = db.getTelegramLink(effectiveUserId);

    const platformToken = (process.env.TELEGRAM_BOT_TOKEN || '8802532938:AAHbCUmP5JGZELyU6ifl6pVQAeZ_lfMV_zk').trim();
    const tokenToUse = link?.bot_token || platformToken;

    if (!link) {
      link = db.updateTelegramLink(effectiveUserId, {
        bot_token: tokenToUse,
        is_connected: true,
        telegram_username: 'tatadana2_bot',
        linking_code: 'TATA-8892',
      });
    }

    return NextResponse.json({
      ok: true,
      link: {
        ...link,
        is_connected: true,
        bot_token: tokenToUse,
        telegram_username: link.telegram_username || 'tatadana2_bot',
      },
      bot: {
        username: link.telegram_username || 'tatadana2_bot',
        name: 'demo_tatadana_bot_token',
        token: tokenToUse,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token, userId } = await req.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ ok: false, error: 'Token bot tidak boleh kosong' }, { status: 400 });
    }

    const cleanToken = token.trim();
    const effectiveUserId = userId || 'usr-budi-01';

    // 1. Cek keunikan token di database (hanya jika bukan platform bot token)
    const isPlatformToken = cleanToken === (process.env.TELEGRAM_BOT_TOKEN || '').trim();
    if (!isPlatformToken) {
      const existingUsers = db.getUsers();
      for (const u of existingUsers) {
        if (u.id !== effectiveUserId) {
          const link = db.getTelegramLink(u.id);
          if (link && link.bot_token === cleanToken) {
            return NextResponse.json(
              { ok: false, error: 'Token ini sudah digunakan oleh akun lain. Silakan gunakan bot Telegram berbeda.' },
              { status: 400 }
            );
          }
        }
      }
    }

    // 2. Mock mode untuk demo bot token
    if (cleanToken.startsWith('demo_')) {
      const updated = db.updateTelegramLink(effectiveUserId, {
        bot_token: cleanToken,
        is_connected: true,
        webhook_url: 'http://localhost:3000/api/telegram/webhook',
        linked_at: new Date().toISOString(),
      });
      return NextResponse.json({
        ok: true,
        bot: {
          id: 7788991122,
          is_bot: true,
          first_name: 'TataDana FinBot (Demo Mode)',
          username: 'tatadana_demo_bot',
        },
        webhook_set: true,
        message: 'Koneksi demo bot berhasil diverifikasi & webhook tersambung!',
      });
    }

    // 3. Verifikasi Token ke Telegram API: GET https://api.telegram.org/bot<TOKEN>/getMe
    const getMeRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
    const getMeJson = await getMeRes.json();

    if (!getMeRes.ok || !getMeJson.ok) {
      const errorDesc = getMeJson.description || 'Token bot tidak valid atau tidak dikenali oleh Telegram.';
      db.updateTelegramLink(effectiveUserId, {
        bot_token: cleanToken,
        is_connected: false,
      });
      return NextResponse.json(
        {
          ok: false,
          error: `Telegram API Error: ${errorDesc}`,
        },
        { status: 400 }
      );
    }

    // 4. Set Webhook: POST https://api.telegram.org/bot<TOKEN>/setWebhook
    const reqHost = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const reqProto = req.headers.get('x-forwarded-proto') || 'https';
    const detectedBase = reqHost ? `${reqProto}://${reqHost}` : 'https://tatadana-kg54.vercel.app';
    const webhookBase = process.env.WEBHOOK_BASE_URL || (reqHost && !reqHost.includes('localhost') ? detectedBase : 'https://tatadana-kg54.vercel.app');
    const webhookUrl = `${webhookBase}/api/telegram/webhook`;

    let webhookSet = false;
    try {
      const setHookRes = await fetch(`https://api.telegram.org/bot${cleanToken}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl }),
      });
      const setHookJson = await setHookRes.json();
      webhookSet = setHookJson.ok === true;
    } catch (whErr) {
      console.warn('Webhook register warning:', whErr);
    }

    // 5. Simpan status koneksi ke database
    db.updateTelegramLink(effectiveUserId, {
      bot_token: cleanToken,
      is_connected: true,
      webhook_url: webhookUrl,
      linked_at: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      bot: getMeJson.result,
      webhook_set: webhookSet,
      message: 'Token Telegram bot valid dan webhook berhasil didaftarkan!',
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
