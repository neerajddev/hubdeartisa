'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout/Layout';
import { supabase } from '@/lib/supabase';
import { ROUTES } from '@/constants/brand';
import styles from './page.module.css';

export default function ArtistContractPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [pageLoading, setPageLoading] = useState(true);
  const [projectTitle, setProjectTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [isExecuted, setIsExecuted] = useState(false);
  const [signedAt, setSignedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const depositAmount = Math.round(totalAmount / 2);
  const finalAmount = totalAmount - depositAmount;

  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) { setError('Not authenticated.'); setPageLoading(false); return; }

      const { data: project } = await supabase
        .from('projects')
        .select('id, title, status, escrow_funded, client_signed_at, selected_quote_id, client_id')
        .eq('id', projectId)
        .single();

      if (!project) { setError('Project not found.'); setPageLoading(false); return; }

      setProjectTitle(project.title || '');
      setIsExecuted(
        project.escrow_funded ||
        project.status === 'assigned' ||
        project.status === 'in_progress' ||
        project.status === 'completed'
      );
      setSignedAt(project.client_signed_at || null);

      if (project.client_id) {
        const { data: cp } = await supabase
          .from('client_profiles')
          .select('full_name')
          .eq('id', project.client_id)
          .single();
        setClientName(cp?.full_name || 'Client');
      }

      if (project.selected_quote_id) {
        const { data: quote } = await supabase
          .from('project_quotes')
          .select('amount, artist_id')
          .eq('id', project.selected_quote_id)
          .single();

        setTotalAmount(quote?.amount || 0);

        if (quote?.artist_id) {
          const { data: ap } = await supabase
            .from('artist_profiles')
            .select('full_name')
            .eq('id', quote.artist_id)
            .single();
          setArtistName(ap?.full_name || '');
        }
      }

      setPageLoading(false);
    };

    if (projectId) load();
  }, [projectId]);

  if (pageLoading) {
    return (
      <Layout>
        <div className={styles.loadingState}>
          <div className="container"><p className={styles.loadingText}>Loading contract…</p></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className={styles.loadingState}>
          <div className="container"><p className={styles.errorText}>{error}</p></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <header className={styles.pageHeader}>
        <div className="container">
          <button className={styles.backLink} onClick={() => router.back()}>← Workspace</button>
          <p className={styles.eyebrow}>Project Contract — Read Only</p>
          <h1 className={styles.pageTitle}>{projectTitle}</h1>
          {totalAmount > 0 && (
            <p className={styles.summaryLine}>
              ESCROW: ₹{depositAmount.toLocaleString('en-IN')}&nbsp;&nbsp;·&nbsp;&nbsp;
              FINAL: ₹{finalAmount.toLocaleString('en-IN')}&nbsp;&nbsp;·&nbsp;&nbsp;
              TOTAL: ₹{totalAmount.toLocaleString('en-IN')}
            </p>
          )}
        </div>
      </header>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.contractLayout}>

            {/* CONTRACT TEXT */}
            <div className={styles.contractCanvas}>
              <div className={styles.agreementBlock}>
                <p className={styles.agreementEyebrow}>Project Agreement</p>
                <div className={styles.agreementBody}>
                  <p>
                    This agreement is entered into between {clientName} (the &ldquo;Client&rdquo;) and{' '}
                    {artistName || 'the Visualizer'} for the project{' '}
                    <strong>&ldquo;{projectTitle}&rdquo;</strong> facilitated through De&apos;Artisa Hub.
                  </p>
                  <p>
                    <strong>1. Scope of Work</strong><br />
                    The Visualizer agrees to deliver the architectural visualization outputs as described
                    in the approved project brief and quote. All deliverables, formats, and revision
                    rounds are as agreed in the accepted quote.
                  </p>
                  <p>
                    <strong>2. Escrow Payment Structure</strong><br />
                    The agreed total of <strong>₹{totalAmount.toLocaleString('en-IN')}</strong> is split
                    into two milestones:<br />
                    a) <strong>₹{depositAmount.toLocaleString('en-IN')} (50%)</strong> — due upon signing,
                    held securely in escrow. This confirms the project and authorizes the Visualizer to
                    commence work.<br />
                    b) <strong>₹{finalAmount.toLocaleString('en-IN')} (50%)</strong> — released only after
                    explicit Client approval of deliverables.
                  </p>
                  <p>
                    <strong>3. Revisions</strong><br />
                    All revision rounds are as specified in the accepted quote. Revisions beyond the agreed
                    scope are subject to additional charges, agreed in writing before work commences.
                  </p>
                  <p>
                    <strong>4. Intellectual Property</strong><br />
                    Full ownership of all final render files transfers to the Client upon receipt of the
                    final 50% payment. The Visualizer retains the right to display the work in their
                    portfolio unless otherwise agreed in writing.
                  </p>
                  <p>
                    <strong>5. Cancellation</strong><br />
                    If the Client cancels after work has commenced, the 50% deposit is non-refundable.
                    If the Visualizer is unable to deliver, the deposit is returned in full.
                    De&apos;Artisa Hub mediates all disputes.
                  </p>
                  <p>
                    <strong>6. Platform</strong><br />
                    De&apos;Artisa Hub serves as the escrow custodian and communication platform. By
                    funding escrow, the Client acknowledges they have read, understood, and agree to
                    these terms.
                  </p>
                </div>
              </div>

              {totalAmount > 0 && (
                <>
                  <div className={styles.splitRow}>
                    <div className={styles.splitItem}>
                      <p className={styles.splitLabel}>Escrow Deposit — 50%</p>
                      <p className={styles.splitAmount}>₹{depositAmount.toLocaleString('en-IN')}</p>
                      <p className={styles.splitHint}>Held in escrow — released when you begin</p>
                    </div>
                    <div className={styles.splitDivider} />
                    <div className={styles.splitItem}>
                      <p className={styles.splitLabel}>On Final Approval — 50%</p>
                      <p className={styles.splitAmount}>₹{finalAmount.toLocaleString('en-IN')}</p>
                      <p className={styles.splitHint}>Released after client approves your work</p>
                    </div>
                  </div>
                  <div className={styles.totalRow}>
                    <span>Agreed Total</span>
                    <strong>₹{totalAmount.toLocaleString('en-IN')}</strong>
                  </div>
                </>
              )}

              {/* Status — read-only, no Razorpay */}
              <div className={styles.statusArea}>
                {isExecuted ? (
                  <>
                    <div className={styles.executedBadge}>
                      <span className={styles.executedCheck}>✓</span>
                      Contract Executed &amp; Escrow Funded
                    </div>
                    {signedAt && (
                      <p className={styles.signedMeta}>
                        Executed on{' '}
                        {new Date(signedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                    <p className={styles.readOnlyNote}>
                      This is a read-only contract view. Payment actions are managed by the client.
                    </p>
                  </>
                ) : (
                  <div className={styles.pendingBadge}>
                    Awaiting client signature &amp; escrow deposit
                  </div>
                )}
              </div>
            </div>

            {/* ASIDE */}
            <aside className={styles.contractAside}>
              <p className={styles.asideEyebrow}>Your Role</p>
              <ol className={styles.escrowList}>
                <li className={styles.escrowItem}>
                  <span className={styles.escrowNum}>01</span>
                  <div>
                    <strong>Client Funds 50%</strong>
                    <p>The client agrees to terms and deposits 50% into escrow. You receive confirmation to start immediately.</p>
                  </div>
                </li>
                <li className={styles.escrowItem}>
                  <span className={styles.escrowNum}>02</span>
                  <div>
                    <strong>You Deliver</strong>
                    <p>Upload your final renders via the Workspace. The client reviews before any funds are released.</p>
                  </div>
                </li>
                <li className={styles.escrowItem}>
                  <span className={styles.escrowNum}>03</span>
                  <div>
                    <strong>Client Approves &amp; Pays</strong>
                    <p>On client approval, the remaining 50% is charged and the full amount is released to you.</p>
                  </div>
                </li>
              </ol>
              <p className={styles.escrowDisclaimer}>
                Payment is only released upon explicit client approval. De&apos;Artisa Hub mediates all disputes.
              </p>
              <button
                className={styles.backBtn}
                onClick={() => router.push(ROUTES.artistJobWorkspace(projectId))}
              >
                Back to Workspace →
              </button>
            </aside>

          </div>
        </div>
      </section>
    </Layout>
  );
}
