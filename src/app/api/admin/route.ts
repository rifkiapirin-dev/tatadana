import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  syncUserToSupabaseAuth,
  updateUserStatusInSupabase,
  deleteUserInSupabase,
} from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action === 'export_all_users') {
    const users = db.getUsers();
    const payments = db.getPayments();
    const aiLogs = db.getAiLogs();
    return NextResponse.json({
      exported_at: new Date().toISOString(),
      total_users: users.length,
      users,
      payments,
      ai_logs_summary: {
        total_calls: aiLogs.length,
      },
    });
  }

  if (action === 'view_user_transactions') {
    const targetUserId = searchParams.get('targetUserId') || 'usr-budi-01';
    const adminId = searchParams.get('adminId') || 'usr-admin-00';
    const reason = searchParams.get('reason') || 'Investigasi komplain transaksi user';

    // WAJIB: Audit Log setiap kali admin mengakses data transaksi user (Part 10)
    db.createAuditLog({
      admin_id: adminId,
      target_user_id: targetUserId,
      action: 'VIEW_USER_TRANSACTIONS',
      details: reason,
      ip_address: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    const txs = db.getTransactions(targetUserId);
    const targetUser = db.getUser(targetUserId);

    return NextResponse.json({
      ok: true,
      targetUser,
      transactions: txs,
    });
  }

  // Default: Get all admin dashboard overview data
  const users = db.getUsers();
  return NextResponse.json({
    ok: true,
    users,
    pendingUsers: db.getPendingUsers(),
    adminUsers: db.getAdminUsers(),
    regularUsers: db.getRegularUsers(),
    pendingCount: db.getPendingUsers().length,
    adminCount: db.getAdminUsers().length,
    regularCount: db.getRegularUsers().length,
    aiConfigs: db.getAiConfigs(),
    aiLogs: db.getAiLogs(),
    payments: db.getPayments(),
    auditLogs: db.getAuditLogs(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, adminId = 'usr-admin-00' } = body;

    if (action === 'create_user') {
      const { email, phone_number, full_name, plan, role, status } = body;
      if (!email || !phone_number || !full_name) {
        return NextResponse.json({ ok: false, error: 'Nama, Email, dan No HP wajib diisi' }, { status: 400 });
      }

      // Cek apakah email/phone sudah terdaftar
      const existingEmail = db.getUserByEmail(email);
      if (existingEmail) {
        return NextResponse.json({ ok: false, error: 'Email sudah terdaftar dalam sistem!' }, { status: 400 });
      }

      const existingPhone = db.getUserByPhone(phone_number);
      if (existingPhone) {
        return NextResponse.json({ ok: false, error: 'Nomor HP sudah terdaftar dalam sistem!' }, { status: 400 });
      }

      const newUser = db.createUser(
        {
          email,
          phone_number,
          full_name,
          plan: plan || 'starter',
          role: role || 'user',
          status: status || 'approved',
        },
        adminId
      );

      // Sinkronkan ke Supabase Auth & public.users
      syncUserToSupabaseAuth({
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        phone_number: newUser.phone_number,
        role: newUser.role,
        status: newUser.status,
        plan: newUser.plan,
      }).catch((e) => console.error('Admin create_user Supabase sync error:', e));

      return NextResponse.json({ ok: true, user: newUser });
    }

    if (action === 'approve_user') {
      const { userId } = body;
      const approved = db.approveUser(userId, adminId);
      if (!approved) {
        return NextResponse.json({ ok: false, error: 'User tidak ditemukan' }, { status: 404 });
      }

      // Sinkronkan status approval ke Supabase
      updateUserStatusInSupabase(approved.email, 'approved').catch((e) =>
        console.error('Admin approve_user Supabase sync error:', e)
      );

      return NextResponse.json({ ok: true, user: approved });
    }

    if (action === 'send_verification_to_user') {
      const { userId, channel = 'whatsapp' } = body;
      const targetUser = db.getUser(userId);
      if (!targetUser) {
        return NextResponse.json({ ok: false, error: 'User tidak ditemukan' }, { status: 404 });
      }
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      let formattedPhone = targetUser.phone_number.replace(/\D/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '62' + formattedPhone.slice(1);
      }

      let directUrl = '';
      if (channel === 'whatsapp') {
        directUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
          `Halo ${targetUser.full_name}, Administrator TataDana telah mengirimkan kode verifikasi akun Anda: ${code}. Masukkan kode ini untuk mengaktifkan akun Anda.`
        )}`;
      } else if (channel === 'telegram') {
        directUrl = `https://t.me/tatadana2_bot?start=VERIF-${code}`;
      }

      db.createAuditLog({
        admin_id: adminId,
        target_user_id: userId,
        action: 'SEND_VERIFICATION_CODE',
        details: `Admin mengirimkan kode verifikasi (${code}) via ${channel.toUpperCase()} ke nomor ${targetUser.phone_number}`,
        ip_address: req.headers.get('x-forwarded-for') || '127.0.0.1',
      });

      return NextResponse.json({
        ok: true,
        code,
        channel,
        phone_number: targetUser.phone_number,
        direct_url: directUrl,
        message: `Kode verifikasi ${code} disiapkan dan dikirimkan via ${channel.toUpperCase()} ke ${targetUser.phone_number}.`,
      });
    }

    if (action === 'reject_user') {
      const { userId, reason } = body;
      const rejected = db.rejectUser(userId, adminId, reason);
      if (!rejected) {
        return NextResponse.json({ ok: false, error: 'User tidak ditemukan' }, { status: 404 });
      }

      // Sinkronkan status reject ke Supabase
      updateUserStatusInSupabase(rejected.email, 'rejected').catch((e) =>
        console.error('Admin reject_user Supabase sync error:', e)
      );

      return NextResponse.json({ ok: true, user: rejected });
    }

    if (action === 'update_user_role') {
      const { userId, role } = body;
      const updated = db.setUserRole(userId, role, adminId);
      if (!updated) {
        return NextResponse.json({ ok: false, error: 'User tidak ditemukan' }, { status: 404 });
      }
      return NextResponse.json({ ok: true, user: updated });
    }

    if (action === 'delete_user') {
      const { userId } = body;
      const targetUser = db.getUser(userId);
      const userEmail = targetUser?.email;
      const deleted = db.deleteUser(userId, adminId);

      // Sinkronkan penghapusan ke Supabase
      if (userEmail) {
        deleteUserInSupabase(userEmail).catch((e) =>
          console.error('Admin delete_user Supabase sync error:', e)
        );
      }

      return NextResponse.json({ ok: deleted });
    }

    if (action === 'update_ai_config') {
      const { providerName, is_active, mode, model_name, api_key_encrypted } = body;
      const updated = db.updateAiConfig(providerName, {
        is_active,
        mode,
        model_name,
        api_key_encrypted,
      });
      return NextResponse.json({ ok: true, config: updated });
    }

    if (action === 'update_user_plan') {
      const { userId, plan } = body;
      const updated = db.updateUser(userId, { plan });
      return NextResponse.json({ ok: true, user: updated });
    }

    return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
