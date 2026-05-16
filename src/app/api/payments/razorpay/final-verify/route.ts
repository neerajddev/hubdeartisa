import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const { projectId, orderId, paymentId, signature } = await request.json();

    if (!projectId || !orderId || !paymentId || !signature) {
      return NextResponse.json({ error: 'Missing payment verification data.' }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    const payload = `${orderId}|${paymentId}`;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    if (expected !== signature) {
      return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin is not configured.' }, { status: 500 });
    }

    // Mark the final payment record as paid
    await supabaseAdmin
      .from('project_payments')
      .update({ status: 'paid', payment_id: paymentId })
      .eq('project_id', projectId)
      .eq('order_id', orderId);

    // Advance project to completed
    await supabaseAdmin
      .from('projects')
      .update({ status: 'completed' })
      .eq('id', projectId);

    // Notify the assigned artist
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('selected_artist_id, title')
      .eq('id', projectId)
      .single();

    if (project?.selected_artist_id) {
      const { data: artist } = await supabaseAdmin
        .from('artist_profiles')
        .select('user_id, email, phone')
        .eq('id', project.selected_artist_id)
        .single();

      if (artist?.user_id) {
        const baseUrl = new URL(request.url).origin;
        await fetch(`${baseUrl}/api/notifications/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: artist.user_id,
            email: artist.email,
            whatsapp: artist.phone,
            message: `The client has approved the final renders for "${project.title || 'your project'}" and released the remaining 50% payment. The project is now complete — congratulations!`,
          }),
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Verification failed.' }, { status: 500 });
  }
}
