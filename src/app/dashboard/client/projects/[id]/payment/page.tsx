'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Script from 'next/script';
import Layout from '@/components/Layout/Layout';
import { supabase } from '@/lib/supabase';
import { ROUTES } from '@/constants/brand';
import styles from './page.module.css';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export default function ClientPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [totalAmount, setTotalAmount] = useState(0);
  const [projectTitle, setProjectTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Locked state — true when payment already verified
  const [alreadyFunded, setAlreadyFunded] = useState(false);
  const [signedAt, setSignedAt] = useState<string | null>(null);

  const depositAmount = Math.round(totalAmount / 2);
  const finalAmount = totalAmount - depositAmount;

  useEffect(() => {
    const load = async () => {
      const { data: project } = await supabase
        .from('projects')
        .select('id, title, selected_quote_id, status, escrow_funded, client_signed_at')
        .eq('id', projectId)
        .single();

      if (!project) { setPageLoading(false); return; }

      setProjectTitle(project.title || '');

      // Detect funded state — set badge flag but do NOT early-return
      // so the agreement text is always loaded and displayed
      const isFunded =
        project.escrow_funded ||
        project.status === 'assigned' ||
        project.status === 'in_progress' ||
        project.status === 'completed';

      if (isFunded) {
        setAlreadyFunded(true);
        setSignedAt(project.client_signed_at || null);
      }

      // Always fetch quote amounts — needed to display receipt correctly
      if (project.selected_quote_id) {
        const { data: quote } = await supabase
          .from('project_quotes')
          .select('amount, artist_id')
          .eq('id', project.selected_quote_id)
          .single();

        setTotalAmount(quote?.amount || 0);

        if (quote?.artist_id) {
          const { data: artist } = await supabase
            .from('artist_profiles')
            .select('full_name')
            .eq('id', quote.artist_id)
            .single();
          setArtistName(artist?.full_name || '');
        }
      } else if (!isFunded) {
        setMessage('No quote selected for this project. Please select a quote first.');
      }

      setPageLoading(false);
    };

    if (projectId) load();
  }, [projectId]);

  const handleAgreeAndFund = async () => {
    setLoading(true);
    setMessage(null);

    const orderResponse = await fetch('/api/payments/razorpay/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, amount: depositAmount }),
    });

    const orderData = await orderResponse.json();
    if (!orderResponse.ok) {
      setMessage(orderData.error || 'Unable to create payment order. Please try again.');
      setLoading(false);
      return;
    }

    if (!window.Razorpay) {
      setMessage('Payment SDK not loaded. Please refresh the page.');
      setLoading(false);
      return;
    }

    const rzp = new window.Razorpay({
      key: orderData.key,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "De'Artisa Hub",
      description: `Escrow Deposit — ${projectTitle}`,
      order_id: orderData.orderId,
      handler: async (response: any) => {
        // ── Only fires on 100% verified Razorpay success ──
        const verifyResponse = await fetch('/api/payments/razorpay/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            orderId: orderData.orderId,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          }),
        });

        if (verifyResponse.ok) {
          // Transition page to locked receipt state in-place — no re-render or redirect needed
          setAlreadyFunded(true);
          setSignedAt(new Date().toISOString());
          setLoading(false);
        } else {
          const err = await verifyResponse.json().catch(() => ({}));
          setMessage(err.error || 'Payment verification failed. Please contact support.');
          setLoading(false);
        }
      },
      modal: {
        ondismiss: () => setLoading(false),
      },
      theme: { color: '#092B2F' },
    });

    rzp.open();
    // Note: setLoading(false) is handled by ondismiss or handler — not here
  };

  // ── SINGLE RENDER PATH ── (contract always visible; only CTA area is conditional)
  return (
    <Layout>
      <header className={styles.pageHeader}>
        <div className="container">
          <button className={styles.backLink} onClick={() => router.back()}>← Back</button>
          <p className={styles.eyebrow}>{alreadyFunded ? 'Contract Receipt' : 'Project Agreement & Escrow'}</p>
          <h1 className={styles.pageTitle}>{projectTitle || 'Project Contract'}</h1>
          {totalAmount > 0 && (
            <p className={styles.summaryLine}>
              {alreadyFunded
                ? `ESCROW: ₹${depositAmount.toLocaleString('en-IN')}  ·  FINAL: ₹${finalAmount.toLocaleString('en-IN')}  ·  TOTAL: ₹${totalAmount.toLocaleString('en-IN')}`
                : `DUE NOW: 50%\u00a0\u00a0·\u00a0\u00a0ON APPROVAL: 50%\u00a0\u00a0·\u00a0\u00a0TOTAL: ₹${totalAmount.toLocaleString('en-IN')}`}
            </p>
          )}
        </div>
      </header>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.paymentLayout}>

            <div className={styles.paymentCanvas}>

              {/* ── AGREEMENT TEXT ── */}
              <div className={styles.agreementBlock}>
                <p className={styles.agreementEyebrow}>Project Agreement</p>
                <div className={styles.agreementBody}>
                  <p>This agreement is entered into between the Client and{artistName ? ` ${artistName}` : ' the selected Artist'} (the &ldquo;Visualizer&rdquo;) for the project <strong>&ldquo;{projectTitle}&rdquo;</strong> facilitated through De&apos;Artisa Hub.</p>

                  <p><strong>1. Scope of Work</strong><br />
                  The Visualizer agrees to deliver the architectural visualization outputs as described in the approved project brief and quote. All deliverables, formats, and revision rounds are as agreed in the accepted quote.</p>

                  <p><strong>2. Escrow Payment Structure</strong><br />
                  The agreed total of <strong>₹{totalAmount.toLocaleString('en-IN')}</strong> is split into two milestones:
                  a) <strong>₹{depositAmount.toLocaleString('en-IN')} (50%)</strong> — due upon signing this agreement, held securely in escrow. This confirms the project and authorizes the Visualizer to commence work.
                  b) <strong>₹{finalAmount.toLocaleString('en-IN')} (50%)</strong> — due upon the Client&apos;s final approval of deliverables. Funds are released only after explicit Client approval.</p>

                  <p><strong>3. Revisions</strong><br />
                  All revision rounds are as specified in the accepted quote. Revisions beyond the agreed scope are subject to additional charges, which must be agreed upon in writing before work commences.</p>

                  <p><strong>4. Intellectual Property</strong><br />
                  Full ownership of all final render files transfers to the Client upon receipt of the final 50% payment. The Visualizer retains the right to display the work in their portfolio unless otherwise agreed in writing.</p>

                  <p><strong>5. Cancellation</strong><br />
                  If the Client cancels after work has commenced, the 50% deposit is non-refundable. If the Visualizer is unable to deliver, the deposit is returned in full. De&apos;Artisa Hub mediates all disputes.</p>

                  <p><strong>6. Platform</strong><br />
                  De&apos;Artisa Hub serves as the escrow custodian and communication platform. By funding escrow, the Client acknowledges they have read, understood, and agree to these terms.</p>
                </div>
              </div>

              {/* ── PAYMENT SPLIT ── */}
              <div className={styles.splitRow}>
                <div className={styles.splitItem}>
                  <p className={styles.splitLabel}>Escrow Deposit — 50%</p>
                  <p className={styles.splitAmount}>₹{depositAmount.toLocaleString('en-IN')}</p>
                  <p className={styles.splitHint}>Held in escrow to start the project</p>
                </div>
                <div className={styles.splitDivider} />
                <div className={styles.splitItem}>
                  <p className={styles.splitLabel}>On Final Approval — 50%</p>
                  <p className={styles.splitAmount}>₹{finalAmount.toLocaleString('en-IN')}</p>
                  <p className={styles.splitHint}>Released only after your final approval</p>
                </div>
              </div>

              <div className={styles.totalRow}>
                <span>Agreed Total</span>
                <strong>₹{totalAmount.toLocaleString('en-IN')}</strong>
              </div>

              {message && <p className={styles.errorNotice}>{message}</p>}

              {/* ── CONDITIONAL CTA ── */}
              {alreadyFunded ? (
                <div className={styles.executedArea}>
                  <div className={styles.fundedBadge}>
                    <span className={styles.fundedCheck}>✓</span>
                    Contract Executed &amp; Escrow Funded
                  </div>
                  {signedAt && (
                    <p className={styles.signedMeta}>
                      Executed on {new Date(signedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                  <button
                    className={styles.successBtn}
                    onClick={() => router.push(ROUTES.clientProjectWorkspace(projectId))}
                  >
                    Back to Workspace →
                  </button>
                </div>
              ) : (
                <>
                  <button
                    className={styles.payBtn}
                    onClick={handleAgreeAndFund}
                    disabled={loading || totalAmount === 0}
                  >
                    {loading
                      ? 'Opening Payment…'
                      : `Agree to Terms & Fund Escrow — ₹${depositAmount.toLocaleString('en-IN')}`}
                  </button>
                  <p className={styles.ctaHint}>
                    By clicking above you confirm you have read and agree to the Project Agreement. Your card is charged only after you click &ldquo;Pay&rdquo; in the secure Razorpay modal.
                  </p>
                </>
              )}

            </div>

            <aside className={styles.escrowAside}>
              <p className={styles.asideEyebrow}>How Escrow Works</p>
              <ol className={styles.escrowList}>
                <li className={styles.escrowItem}>
                  <span className={styles.escrowNum}>01</span>
                  <div>
                    <strong>Agree &amp; Fund 50%</strong>
                    <p>Your deposit is held securely. The artist receives confirmation and begins work immediately.</p>
                  </div>
                </li>
                <li className={styles.escrowItem}>
                  <span className={styles.escrowNum}>02</span>
                  <div>
                    <strong>Review Deliverables</strong>
                    <p>The artist submits final renders. You have full time to review before any funds are released.</p>
                  </div>
                </li>
                <li className={styles.escrowItem}>
                  <span className={styles.escrowNum}>03</span>
                  <div>
                    <strong>Approve &amp; Release</strong>
                    <p>Once you approve, the remaining 50% is charged and released to the artist.</p>
                  </div>
                </li>
              </ol>
              <p className={styles.escrowDisclaimer}>
                You are never charged the second 50% without your explicit approval.
              </p>
            </aside>

          </div>
        </div>
      </section>

      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
    </Layout>
  );
}


