import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Jika ini Midtrans Webhook Notification
    if (body.order_id && body.transaction_status) {
      const orderId = body.order_id;
      const status = body.transaction_status;
      const allPayments = db.getPayments();
      const matched = allPayments.find((p) => p.order_id === orderId);

      if (matched) {
        if (status === 'capture' || status === 'settlement') {
          db.updatePaymentStatus(matched.id, 'approved');
        } else if (status === 'deny' || status === 'cancel' || status === 'expire') {
          db.updatePaymentStatus(matched.id, 'failed');
        }
      }

      return NextResponse.json({ ok: true, status: 'midtrans_handled' });
    }

    // 2. Admin Manual Action (approve / reject)
    if (body.action === 'approve' || body.action === 'reject') {
      const paymentId = body.paymentId;
      const adminId = body.adminId || 'usr-admin-rifki';
      const newStatus = body.action === 'approve' ? 'approved' : 'rejected';

      const updated = db.updatePaymentStatus(paymentId, newStatus, adminId);
      if (!updated) {
        return NextResponse.json({ ok: false, error: 'Payment not found' }, { status: 404 });
      }

      // Log audit
      db.createAuditLog({
        admin_id: adminId,
        target_user_id: updated.user_id,
        action: `MANUAL_PAYMENT_${newStatus.toUpperCase()}`,
        details: `Admin ${body.action} pembayaran order ${updated.order_id} nominal Rp ${updated.amount}`,
      });

      return NextResponse.json({ ok: true, payment: updated });
    }

    // 3. User Create Payment Request
    if (body.action === 'create') {
      const { userId, plan, amount, paymentMethod, notes, proofImageUrl } = body;
      const orderId = `ORDER-TATA-${Date.now().toString().slice(-6)}`;

      const newPayment = db.createPayment({
        user_id: userId || 'usr-admin-rifki',
        order_id: orderId,
        plan: plan || 'pro',
        amount: amount || 99000,
        payment_method: paymentMethod || 'midtrans',
        status: paymentMethod === 'midtrans' ? 'approved' : 'pending',
        proof_image_url: proofImageUrl,
        notes: notes,
      });

      // If midtrans simulation, auto-upgrade
      if (paymentMethod === 'midtrans') {
        db.updateUser(newPayment.user_id, { plan: 'pro' });
      }

      return NextResponse.json({ ok: true, payment: newPayment });
    }

    return NextResponse.json({ ok: false, error: 'Unknown payload' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
