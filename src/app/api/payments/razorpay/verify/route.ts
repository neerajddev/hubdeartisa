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

    await supabaseAdmin
      .from('project_payments')
      .update({ status: 'paid', payment_id: paymentId })
      .eq('project_id', projectId)
      .eq('order_id', orderId);

    // Resolve the selected quote's artist_id so we can assign them atomically.
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('selected_quote_id')
      .eq('id', projectId)
      .single();

    let resolvedArtistId: string | null = null;
    if (project?.selected_quote_id) {
      const { data: quote } = await supabaseAdmin
        .from('project_quotes')
        .select('artist_id')
        .eq('id', project.selected_quote_id)
        .single();
      resolvedArtistId = quote?.artist_id ?? null;
    }

    // Only now — after confirmed payment — do we assign the artist and advance status.
    await supabaseAdmin
      .from('projects')
      .update({
        status: 'assigned',
        escrow_funded: true,
        client_signed_at: new Date().toISOString(),
        ...(resolvedArtistId ? { selected_artist_id: resolvedArtistId } : {}),
      })
      .eq('id', projectId);

    if (resolvedArtistId) {
      const { data: artist } = await supabaseAdmin
        .from('artist_profiles')
        .select('user_id, email, phone')
        .eq('id', resolvedArtistId)
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
            message: 'Client payment received and you have been selected. Please review and accept the project agreement in your dashboard.',
          }),
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Verification failed.' }, { status: 500 });
  }
}