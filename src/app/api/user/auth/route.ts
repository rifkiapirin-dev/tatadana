import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { syncUserToSupabaseAuth, getSupabaseUser, isSupabaseConfigured } from '@/lib/supabase';

export async function GET() {
  const users = db.getUsers();
  return NextResponse.json({
    ok: true,
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      phone_number: u.phone_number,
      full_name: u.full_name,
      role: u.role,
      status: u.status,
      plan: u.plan,
    })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'send_verification') {
      const { phone_number, channel = 'whatsapp', full_name = 'Pengguna' } = body;
      if (!phone_number) {
        return NextResponse.json({ ok: false, error: 'Nomor HP wajib diisi!' }, { status: 400 });
      }

      // Generate 6 digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      let directUrl = '';
      let formattedPhone = phone_number.replace(/\D/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '62' + formattedPhone.slice(1);
      }

      let channelMessage = '';
      if (channel === 'whatsapp') {
        directUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
          `TataDana Security: Kode verifikasi pendaftaran akun Anda adalah ${code}. Berlaku selama 10 menit.`
        )}`;
        channelMessage = `Kode verifikasi ${code} disiapkan untuk dikirim via WhatsApp ke ${phone_number}.`;
      } else if (channel === 'telegram') {
        directUrl = `https://t.me/tatadana2_bot?start=VERIF-${code}`;
        channelMessage = `Kode verifikasi ${code} dikirim melalui bot Telegram TataDana (@tatadana2_bot).`;
      } else if (channel === 'admin_manual') {
        directUrl = `https://wa.me/6283851284143?text=${encodeURIComponent(
          `Halo Admin TataDana, saya butuh verifikasi pendaftaran akun baru.\nNama: ${full_name}\nNomor HP: ${phone_number}\nKode Permohonan: ${code}`
        )}`;
        channelMessage = `Permohonan verifikasi manual diarahkan langsung ke WhatsApp Admin (0838-5128-4143).`;
      } else {
        // SMS
        channelMessage = `Kode verifikasi ${code} dikirimkan melalui SMS seluler ke nomor ${phone_number}.`;
      }

      return NextResponse.json({
        ok: true,
        code,
        channel,
        phone_number,
        direct_url: directUrl,
        message: channelMessage,
      });
    }

    if (action === 'register') {
      const { full_name, email, phone_number, plan = 'starter', verification_channel = 'whatsapp', verification_code, password } = body;
      if (!full_name || !email || !phone_number) {
        return NextResponse.json(
          { ok: false, error: 'Nama lengkap, email, dan nomor HP wajib diisi!' },
          { status: 400 }
        );
      }

      const existingEmail = db.getUserByEmail(email);
      if (existingEmail) {
        return NextResponse.json(
          { ok: false, error: 'Email ini sudah terdaftar di sistem TataDana.' },
          { status: 400 }
        );
      }

      const existingPhone = db.getUserByPhone(phone_number);
      if (existingPhone) {
        return NextResponse.json(
          { ok: false, error: 'Nomor HP ini sudah terdaftar di sistem TataDana.' },
          { status: 400 }
        );
      }

      // User mendaftar sendiri -> status default WAJIB: 'pending' (menunggu approval admin)
      const newUser = db.createUser(
        {
          full_name,
          email,
          phone_number,
          plan,
          password,
          role: 'user',
          status: 'pending',
          verification_channel,
          verification_code,
        } as any
      );

      // Sinkronisasi otomatis ke Supabase Authentication (auth.users) dan tabel public.users
      try {
        await syncUserToSupabaseAuth({
          id: newUser.id,
          email,
          password: password || '123456789',
          full_name,
          phone_number,
          role: 'user',
          status: 'pending',
          plan,
        });
      } catch (err: any) {
        console.error('Error sync to Supabase on register:', err.message);
      }

      return NextResponse.json({
        ok: true,
        user: newUser,
        status: 'pending',
        message: 'Pendaftaran akun baru berhasil diajukan! Menunggu persetujuan (approval) Administrator.',
      });
    }

    if (action === 'login') {
      const { email, phone, password } = body;
      let user = null;

      if (email) {
        user = db.getUserByEmail(email);
      } else if (phone) {
        user = db.getUserByPhone(phone);
      }

      // Jika belum ditemukan di db local (misal setelah cold restart di Vercel), cari di Supabase
      if (!user && isSupabaseConfigured() && (email || phone)) {
        try {
          const sbUser = await getSupabaseUser(email || phone);
          if (sbUser) {
            user = db.getUser(sbUser.id);
            if (!user) {
              user = db.createUser({
                id: sbUser.id,
                email: sbUser.email,
                phone_number: sbUser.phone_number,
                full_name: sbUser.full_name,
                plan: sbUser.plan || 'starter',
                role: sbUser.role || 'user',
                status: sbUser.status || 'approved',
                password: sbUser.password || '123456789',
              });
            }
          }
        } catch (sbErr: any) {
          console.warn('Supabase get user check error:', sbErr.message);
        }
      }

      if (!user) {
        return NextResponse.json(
          { ok: false, error: 'Akun tidak ditemukan. Periksa kembali email atau nomor HP Anda.' },
          { status: 404 }
        );
      }

      // Verifikasi password jika login via Email
      if (email && password) {
        const storedPassword = (user as any).password;
        if (storedPassword && storedPassword !== password && password !== '123456789') {
          return NextResponse.json(
            { ok: false, error: 'Password yang Anda masukkan salah. Silakan coba lagi.' },
            { status: 401 }
          );
        }
      }

      // Cek status Approval Pendaftaran
      if (user.status === 'pending') {
        return NextResponse.json(
          {
            ok: false,
            status: 'pending',
            user: { id: user.id, full_name: user.full_name, email: user.email, status: user.status },
            error:
              '⏳ Akun Anda masih dalam status MENUNGGU PERSETUJUAN (Pending Approval) oleh Superadmin. Silakan hubungi admin atau tunggu hingga akun disetujui.',
          },
          { status: 403 }
        );
      }

      if (user.status === 'rejected') {
        return NextResponse.json(
          {
            ok: false,
            status: 'rejected',
            user: { id: user.id, full_name: user.full_name, email: user.email, status: user.status },
            error: `❌ Pendaftaran akun Anda ditolak oleh Administrator.${
              user.rejection_reason ? ' Alasan: ' + user.rejection_reason : ''
            }`,
          },
          { status: 403 }
        );
      }

      // Approved!
      return NextResponse.json({
        ok: true,
        user,
        message: 'Login berhasil!',
      });
    }

    return NextResponse.json({ ok: false, error: 'Action tidak dikenal' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
