'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import Layout from '@/components/Layout/Layout';
import { CldImage } from 'next-cloudinary';
import { supabase } from '@/lib/supabase';
import { ROUTES } from '@/constants/brand';
import { renderInlineMarkdown } from '@/lib/richText';
import styles from './page.module.css';

interface Project {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: string;
  budget_min: number;
  budget_max: number;
  deadline: string | null;
  reference_links: string[];
  selected_artist_id: string | null;
  selected_quote_id: string | null;
  created_at: string;
}

interface ArtistProfile {
  full_name: string;
  country: string;
}

interface Quote {
  id: string;
  amount: number;
  timeline_days: number;
  status: string;
}

interface ProjectFile {
  id: string;
  secure_url: string;
  resource_type: string;
  file_name: string | null;
  file_stage: 'preview' | 'final';
}

const STATUS_ORDER = ['open', 'assigned', 'in_progress', 'completed'];

declare global {
  interface Window { Razorpay?: any; }
}

const STEPS = [
  { key: 'open',        label: 'Brief Posted',        desc: 'Your project is live and routing to our curated artists.' },
  { key: 'assigned',    label: 'Artist Assigned',      desc: 'Escrow funded. Your selected artist is ready to begin production.' },
  { key: 'in_progress', label: 'In Production',        desc: 'The artist is currently crafting your deliverables. Check Project Chat for updates.' },
  { key: 'completed',   label: 'Delivered & Approved', desc: 'Final files approved and escrow balance released. Project complete.' },
];

const STATUS_CTA: Record<string, { label: string; href: (id: string) => string }> = {
  open:        { label: 'Review Quotes →',  href: ROUTES.clientProjectQuotes },
  assigned:    { label: 'View Contract →',  href: ROUTES.clientProjectPayment },
  in_progress: { label: 'View Contract →',  href: ROUTES.clientProjectPayment },
  completed:   { label: 'View Contract →',  href: ROUTES.clientProjectPayment },
};

const STATUS_LABEL: Record<string, string> = {
  open: 'Open — receiving quotes',
  assigned: 'Artist assigned',
  in_progress: 'In production',
  completed: 'Delivered',
};

export default function ProjectWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [quoteAmount, setQuoteAmount] = useState(0);
  const [finalPayLoading, setFinalPayLoading] = useState(false);
  const [finalPayMessage, setFinalPayMessage] = useState<string | null>(null);
  const [previews, setPreviews] = useState<ProjectFile[]>([]);
  const [finals, setFinals] = useState<ProjectFile[]>([]);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data: proj } = await supabase
        .from('projects')
        .select('id, title, description, category, status, budget_min, budget_max, deadline, reference_links, selected_artist_id, selected_quote_id, created_at')
        .eq('id', id)
        .single();

      if (proj) {
        setProject(proj);

        if (proj.selected_artist_id) {
          const { data: ap } = await supabase
            .from('artist_profiles')
            .select('full_name, country')
            .eq('id', proj.selected_artist_id)
            .single();
          if (ap) setArtist(ap);
        }

        const { data: qs } = await supabase
          .from('project_quotes')
          .select('id, amount, timeline_days, status')
          .eq('project_id', id)
          .order('created_at', { ascending: false });
        setQuotes(qs || []);

        // Load amount of selected quote for final payment calculation
        if (proj.selected_quote_id) {
          const { data: sq } = await supabase
            .from('project_quotes')
            .select('amount')
            .eq('id', proj.selected_quote_id)
            .single();
          if (sq) setQuoteAmount(sq.amount);
        }

        // Load artist deliverables
        const { data: filesData } = await supabase
          .from('project_files')
          .select('id, secure_url, resource_type, file_name, file_stage')
          .eq('project_id', id)
          .order('created_at', { ascending: true });
        const allFiles = (filesData || []) as ProjectFile[];
        setPreviews(allFiles.filter(f => f.file_stage === 'preview'));
        setFinals(allFiles.filter(f => f.file_stage === 'final'));
      }

      setLoading(false);
    };
    load();
  }, [id]);

  const handleFinalApproval = async () => {
    if (!project) return;
    setFinalPayLoading(true);
    setFinalPayMessage(null);

    const finalAmt = quoteAmount - Math.round(quoteAmount / 2);
    const orderResponse = await fetch('/api/payments/razorpay/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: id, amount: finalAmt }),
    });

    const orderData = await orderResponse.json();
    if (!orderResponse.ok) {
      setFinalPayMessage(orderData.error || 'Unable to create payment order. Please try again.');
      setFinalPayLoading(false);
      return;
    }

    if (!window.Razorpay) {
      setFinalPayMessage('Payment SDK not loaded. Please refresh the page.');
      setFinalPayLoading(false);
      return;
    }

    const rzp = new window.Razorpay({
      key: orderData.key,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "De'Artisa Hub",
      description: `Final Approval — ${project.title}`,
      order_id: orderData.orderId,
      handler: async (response: any) => {
        const verifyResponse = await fetch('/api/payments/razorpay/final-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: id,
            orderId: orderData.orderId,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          }),
        });

        if (verifyResponse.ok) {
          // Optimistically update status so UI transitions to completed badge
          setProject(prev => prev ? { ...prev, status: 'completed' } : prev);
          setFinalPayLoading(false);
        } else {
          const err = await verifyResponse.json().catch(() => ({}));
          setFinalPayMessage(err.error || 'Payment verification failed. Please contact support.');
          setFinalPayLoading(false);
        }
      },
      modal: {
        ondismiss: () => setFinalPayLoading(false),
      },
      theme: { color: '#092B2F' },
    });

    rzp.open();
  };

  if (loading) {
    return (
      <Layout>
        <div className={styles.loadingState}>
          <p className={styles.hint}>Loading workspace&hellip;</p>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className={styles.loadingState}>
          <p className={styles.hint}>Project not found.</p>
        </div>
      </Layout>
    );
  }

  const currentStepIndex = STATUS_ORDER.indexOf(project.status);
  const cta = STATUS_CTA[project.status];

  // Parse AI-generated markdown brief (## Section\nbody) into section objects
  const parseSections = (md: string): Array<{ title: string; body: string }> =>
    md
      .split(/\n?## /)
      .filter(Boolean)
      .map((chunk) => {
        const nl = chunk.indexOf('\n');
        return {
          title: nl > -1 ? chunk.slice(0, nl).trim() : chunk.trim(),
          body:  nl > -1 ? chunk.slice(nl + 1).trim() : '',
        };
      });

  return (
    <Layout>

      {/* STUDIO HEADER */}
      <section className={styles.studioHeader}>
        <div className="container">
          <Link href={ROUTES.clientDashboard} className={styles.backLink}>
            ← Dashboard
          </Link>
          <p className={styles.eyebrow}>{project.category || 'Project'}</p>
          <h1 className={styles.projectTitle}>{project.title}</h1>
          <p className={styles.projectMeta}>
            <span className={styles.statusText}>
              {STATUS_LABEL[project.status] ?? project.status}
            </span>
            {artist && (
              <>
                <span className={styles.metaDot}>&middot;</span>
                <span>{artist.full_name}</span>
                <span className={styles.metaDot}>,</span>
                <span>{artist.country}</span>
              </>
            )}
          </p>
          {project.status !== 'open' && (
            <div className={styles.actionBar}>
              <Link href={ROUTES.clientProjectMessages(id)} className={styles.actionLink}>
                Project Chat
              </Link>
              <Link href={ROUTES.clientProjectPayment(id)} className={styles.actionLink}>
                View Contract
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* TWO-COLUMN BODY */}
      <section className={styles.workspaceBody}>
        <div className="container">
          <div className={styles.twoCol}>

            {/* LEFT — THE CANVAS */}
            <div className={styles.canvas}>

              {/* Brief */}
              {project.description && (() => {
                const sections = parseSections(project.description!);
                return (
                  <div className={styles.canvasBlock}>
                    <p className={styles.blockLabel}>Project Brief</p>
                    {sections.length > 1
                      ? sections.map((sec, i) => (
                          <div key={i} className={styles.briefSection}>
                            <p className={styles.briefSectionTitle}>{sec.title}</p>
                            <p className={styles.briefSectionBody}>{renderInlineMarkdown(sec.body)}</p>
                          </div>
                        ))
                      : <p className={styles.briefText}>{project.description}</p>
                    }
                  </div>
                );
              })()}

              {/* Budget & Deadline */}
              <div className={styles.canvasBlock}>
                <p className={styles.blockLabel}>Details</p>
                <div className={styles.detailsRow}>
                  <div className={styles.detailItem}>
                    <p className={styles.detailLabel}>Budget</p>
                    <p className={styles.detailValue}>
                      ₹{project.budget_min.toLocaleString('en-IN')} – ₹{project.budget_max.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className={styles.detailItem}>
                    <p className={styles.detailLabel}>Deadline</p>
                    <p className={styles.detailValue}>{project.deadline || 'Flexible'}</p>
                  </div>
                  <div className={styles.detailItem}>
                    <p className={styles.detailLabel}>Quotes received</p>
                    <p className={styles.detailValue}>{quotes.length}</p>
                  </div>
                </div>
              </div>

              {/* Reference links */}
              {project.reference_links?.length > 0 && (
                <div className={styles.canvasBlock}>
                  <p className={styles.blockLabel}>Reference Links</p>
                  <ul className={styles.refList}>
                    {project.reference_links.map((url, i) => (
                      <li key={i}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.refLink}
                        >
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ━━ DELIVERABLES VAULT — PREVIEWS ━━ */}
              {previews.length > 0 && (
                <>
                  <hr className={styles.vaultDivider} />
                  <div className={styles.canvasBlock}>
                    <p className={styles.blockLabel}>Deliverables Vault</p>
                    <p className={styles.vaultHint}>
                      {project.status === 'completed'
                        ? 'Your approved watermarked previews from this project.'
                        : "Review the artist's watermarked previews. Approve and release final payment to unlock full-resolution files."}
                    </p>

                    {/* Preview grid: CldImage with watermark for images, clean link for raw */}
                    <div className={styles.deliverablePreviewGrid}>
                      {previews.map((file) => {
                        if (file.resource_type === 'image') {
                          return (
                            <div key={file.id} className={styles.deliverableThumb}>
                              <CldImage
                                src={file.secure_url}
                                width={400}
                                height={400}
                                alt={file.file_name || 'Preview'}
                                rawTransformations={['l_text:Arial_28_bold:REVIEW%20COPY,co_white,o_50,g_center']}
                                className={styles.deliverableThumbImg}
                              />
                              <div className={styles.watermarkOverlay}>De&apos;Artisa Hub</div>
                            </div>
                          );
                        }
                        // Raw / PDF — clean download link, no watermark
                        return (
                          <div key={file.id} className={styles.deliverableFileChip}>
                            <span className={styles.deliverableFileIcon}>
                              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                            </span>
                            <a
                              href={file.secure_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.deliverableDocLink}
                            >
                              {file.file_name || 'Preview Document'}
                            </a>
                          </div>
                        );
                      })}
                    </div>

                    {/* Approval CTA — hidden once project is completed */}
                    {project.status !== 'completed' && (
                      <>
                        {finalPayMessage && <p className={styles.finalPayMessage}>{finalPayMessage}</p>}
                        <div className={styles.finalApprovalWrap}>
                          <button
                            className={styles.finalPayBtn}
                            onClick={handleFinalApproval}
                            disabled={finalPayLoading || quoteAmount === 0}
                          >
                            {finalPayLoading
                              ? 'Opening Payment…'
                              : `Approve Previews & Pay Final 50% — ₹${(quoteAmount - Math.round(quoteAmount / 2)).toLocaleString('en-IN')}`}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}

              {/* ━━ DELIVERABLES VAULT — FINAL FILES ━━ */}
              {(project.status === 'completed' || finals.length > 0) && (
                <div className={styles.canvasBlock}>
                  <p className={styles.blockLabel}>Final Deliverables</p>

                  {project.status === 'completed' && (
                    <div className={styles.completedBadge}>
                      <span className={styles.completedCheck}>✓</span>
                      Final Payment Cleared. Project Complete.
                    </div>
                  )}

                  {finals.length > 0 ? (
                    <>
                      <p className={styles.downloadLabel}>Download Full-Resolution Files</p>
                      <div className={styles.deliverableFinalGrid}>
                        {finals.map((file) => {
                          if (file.resource_type === 'image') {
                            return (
                              <a
                                key={file.id}
                                href={file.secure_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.deliverableFinalCard}
                              >
                                <div className={styles.deliverableFinalThumb}>
                                  <img
                                    src={file.secure_url}
                                    alt={file.file_name || 'Final'}
                                    className={styles.deliverableFinalImg}
                                  />
                                </div>
                                <div className={styles.deliverableFinalMeta}>
                                  <span className={styles.deliverableFinalName}>{file.file_name || 'Image'}</span>
                                  <span className={styles.deliverableFinalBadge}>↓</span>
                                </div>
                              </a>
                            );
                          }
                          // Raw / PDF — file download row
                          return (
                            <div key={file.id} className={styles.deliverableFileChip}>
                              <span className={styles.deliverableFileIcon}>
                                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                              </span>
                              <a
                                href={file.secure_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.deliverableDocLink}
                              >
                                {file.file_name || 'Final File'}
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <p className={styles.downloadPending}>The artist is preparing your final files. They will appear here shortly.</p>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT — THE BUSINESS */}
            <div className={styles.business}>
              <p className={styles.blockLabel}>Project Progress</p>
              <div className={styles.milestoneList}>
                {STEPS.map((step, i) => {
                  const isPast   = i < currentStepIndex;
                  const isActive = i === currentStepIndex;
                  return (
                    <div
                      key={step.key}
                      className={`${styles.milestoneItem} ${isPast ? styles.milestoneDone : ''} ${isActive ? styles.milestoneCurrent : ''}`}
                    >
                      <div className={styles.milestoneIndicator}>
                        <div className={styles.milestoneDot}>
                          {isPast ? '✓' : String(i + 1).padStart(2, '0')}
                        </div>
                        {i < STEPS.length - 1 && (
                          <div className={`${styles.milestoneLine} ${isPast ? styles.milestoneLineDone : ''}`} />
                        )}
                      </div>
                      <div className={styles.milestoneBody}>
                        <p className={styles.milestoneLabel}>{step.label}</p>
                        <p className={styles.milestoneDesc}>{step.desc}</p>
                        {isActive && step.key === 'open' && cta && (
                          <div className={styles.stepAction}>
                            <Link href={cta.href(id)} className={styles.ctaBtn}>{cta.label}</Link>
                          </div>
                        )}
                        {isActive && step.key === 'completed' && (
                          <div className={styles.stepAction}>
                            <div className={styles.completedBadge}>
                              <span className={styles.completedCheck}>✓</span>
                              Final Payment Cleared. Project Completed.
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </section>

      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
    </Layout>
  );
}
