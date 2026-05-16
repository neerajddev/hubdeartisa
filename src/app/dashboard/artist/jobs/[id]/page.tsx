'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout/Layout';
import { CldUploadWidget } from 'next-cloudinary';
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
  reference_links: string[] | null;
  client_id: string | null;
}

interface MyQuote {
  id: string;
  amount: number;
  timeline_days: number;
  notes: string | null;
  status: string;
}

interface Agreement {
  id: string;
  status: string;
  terms_text: string | null;
}

interface ProjectFile {
  id: string;
  secure_url: string;
  resource_type: string;
  file_name: string | null;
  file_stage: 'preview' | 'final';
  created_at: string;
}

type Step = 'review_brief' | 'submit_quote' | 'awaiting_agreement' | 'in_progress' | 'payment_released';

const MILESTONES: Array<{ key: Step; label: string; desc: string }> = [
  { key: 'review_brief',       label: 'Brief Reviewed',   desc: 'You have accessed and reviewed the project requirements.' },
  { key: 'submit_quote',       label: 'Quote Submitted',  desc: 'Your proposal and timeline are pending client approval.' },
  { key: 'awaiting_agreement', label: 'Contract Signed',  desc: 'Escrow funded. The contract is active and you are cleared to begin.' },
  { key: 'in_progress',        label: 'Delivering Work',  desc: 'Upload deliverables on the left, then notify the client via Project Chat.' },
  { key: 'payment_released',   label: 'Payment Released', desc: 'Client approved the final deliverables. Funds have been released.' },
];

function resolveCurrentStep(project: Project, myQuote: MyQuote | null, agreement: Agreement | null): Step {
  // Post-escrow-funded statuses are source-of-truth: no agreement record needed
  if (project.status === 'completed') return 'payment_released';
  if (project.status === 'in_progress' || project.status === 'assigned') return 'in_progress';
  // Pre-funding: fall back to quote + agreement state
  if (!myQuote) return 'submit_quote';
  if (!agreement || (agreement.status !== 'signed' && agreement.status !== 'artist_accepted')) {
    return 'awaiting_agreement';
  }
  return 'in_progress';
}

const STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  assigned: 'Artist Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export default function ArtistJobWorkspacePage() {
  const params = useParams();
  const projectId = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [clientName, setClientName] = useState('');
  const [artistId, setArtistId] = useState<string | null>(null);
  const [myQuote, setMyQuote] = useState<MyQuote | null>(null);
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [previews, setPreviews] = useState<ProjectFile[]>([]);
  const [finals, setFinals] = useState<ProjectFile[]>([]);
  const [uploadingPreview, setUploadingPreview] = useState(false);
  const [uploadingFinal, setUploadingFinal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quote form
  const [quoteAmount, setQuoteAmount] = useState('');
  const [quoteTimeline, setQuoteTimeline] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [quoteFormOpen, setQuoteFormOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) { setLoading(false); return; }

      const { data: artistData } = await supabase
        .from('artist_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      const aid = artistData?.id || null;
      setArtistId(aid);

      const { data: proj, error: projErr } = await supabase
        .from('projects')
        .select('id, title, description, category, status, budget_min, budget_max, deadline, reference_links, client_id')
        .eq('id', projectId)
        .single();

      if (projErr || !proj) { setError('Project not found.'); setLoading(false); return; }
      setProject(proj);

      if (proj.client_id) {
        const { data: clientData } = await supabase
          .from('client_profiles')
          .select('full_name')
          .eq('id', proj.client_id)
          .single();
        setClientName(clientData?.full_name || 'Client');
      }

      if (aid) {
        const { data: quoteData } = await supabase
          .from('project_quotes')
          .select('id, amount, timeline_days, notes, status')
          .eq('project_id', projectId)
          .eq('artist_id', aid)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        setMyQuote(quoteData || null);
      }

      const { data: agmtData } = await supabase
        .from('project_agreements')
        .select('id, status, terms_text')
        .eq('project_id', projectId)
        .maybeSingle();
      setAgreement(agmtData || null);

      // Load existing Cloudinary deliverables
      const { data: filesData } = await supabase
        .from('project_files')
        .select('id, secure_url, resource_type, file_name, file_stage, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });
      const files = (filesData || []) as ProjectFile[];
      setPreviews(files.filter(f => f.file_stage === 'preview'));
      setFinals(files.filter(f => f.file_stage === 'final'));

      setLoading(false);
    };

    if (projectId) load();
  }, [projectId]);

  const loadDeliverables = useCallback(async () => {
    const { data } = await supabase
      .from('project_files')
      .select('id, secure_url, resource_type, file_name, file_stage, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    const files = (data || []) as ProjectFile[];
    setPreviews(files.filter(f => f.file_stage === 'preview'));
    setFinals(files.filter(f => f.file_stage === 'final'));
  }, [projectId]);

  const handlePreviewUpload = useCallback(async (result: any) => {
    if (!artistId || !projectId) return;
    setUploadingPreview(true);
    const info = result?.info ?? result;
    const secureUrl: string = info.secure_url;
    const resourceType: string = info.resource_type || 'image';
    const fileName: string = info.original_filename || info.public_id || 'file';
    if (!secureUrl) { setUploadingPreview(false); return; }
    const { data: inserted, error: insertErr } = await supabase
      .from('project_files')
      .insert({
        project_id: projectId,
        artist_id: artistId,
        secure_url: secureUrl,
        resource_type: resourceType,
        file_name: fileName,
        file_stage: 'preview',
      })
      .select('id, secure_url, resource_type, file_name, file_stage, created_at')
      .single();
    if (!insertErr && inserted) {
      setPreviews(prev => [...prev, inserted as ProjectFile]);
    } else {
      // Fallback: re-fetch if optimistic insert failed
      await loadDeliverables();
    }
    setUploadingPreview(false);
  }, [artistId, projectId, loadDeliverables]);

  const handleFinalUpload = useCallback(async (result: any) => {
    if (!artistId || !projectId) return;
    setUploadingFinal(true);
    const info = result?.info ?? result;
    const secureUrl: string = info.secure_url;
    const resourceType: string = info.resource_type || 'image';
    const fileName: string = info.original_filename || info.public_id || 'file';
    if (!secureUrl) { setUploadingFinal(false); return; }
    const { data: inserted, error: insertErr } = await supabase
      .from('project_files')
      .insert({
        project_id: projectId,
        artist_id: artistId,
        secure_url: secureUrl,
        resource_type: resourceType,
        file_name: fileName,
        file_stage: 'final',
      })
      .select('id, secure_url, resource_type, file_name, file_stage, created_at')
      .single();
    if (!insertErr && inserted) {
      setFinals(prev => [...prev, inserted as ProjectFile]);
    } else {
      await loadDeliverables();
    }
    setUploadingFinal(false);
  }, [artistId, projectId, loadDeliverables]);

  const handleSubmitQuote = async () => {
    const amount = parseFloat(quoteAmount);
    const timeline = parseInt(quoteTimeline, 10);
    if (!amount || !timeline) return;

    setQuoteSubmitting(true);
    setError(null);

    const { data, error: qErr } = await supabase
      .from('project_quotes')
      .insert({
        project_id: projectId,
        artist_id: artistId,
        amount,
        timeline_days: timeline,
        notes: quoteNotes || null,
        status: 'pending',
      })
      .select('id, amount, timeline_days, notes, status')
      .single();

    if (qErr) {
      setError(qErr.message);
    } else if (data) {
      setMyQuote(data);
      setQuoteFormOpen(false);
    }
    setQuoteSubmitting(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className={styles.loadingState}>
          <div className="container">
            <p className={styles.loadingText}>Loading workspace…</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className={styles.loadingState}>
          <div className="container">
            <p className={styles.errorText}>{error || 'Project not found.'}</p>
          </div>
        </div>
      </Layout>
    );
  }

  const currentStep = resolveCurrentStep(project, myQuote, agreement);

  const stepIndex = MILESTONES.findIndex((m) => m.key === currentStep);
  const completedUpTo = stepIndex; // milestones before current are done

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

  const briefSections = project.description ? parseSections(project.description) : [];

  return (
    <Layout>
      {/* ── WORKSPACE HEADER ── */}
      <header className={styles.pageHeader}>
        <div className="container">
          <a href={ROUTES.artistDashboard} className={styles.backLink}>
            ← Studio
          </a>
          <p className={styles.eyebrow}>Project Workspace</p>
          <h1 className={styles.pageTitle}>{project.title}</h1>
          <p className={styles.workspaceMeta}>
            <span className={styles.metaClient}>{clientName}</span>
            <span className={styles.metaDot}>·</span>
            <span className={styles.metaStatus}>{STATUS_LABEL[project.status] || project.status}</span>
            {project.budget_max > 0 && (
              <>
                <span className={styles.metaDot}>·</span>
                <span>₹{project.budget_max.toLocaleString()} budget</span>
              </>
            )}
          </p>
          {project.status !== 'open' && (
            <div className={styles.actionBar}>
              <Link href={ROUTES.artistJobMessages(projectId)} className={styles.actionLink}>
                Project Chat
              </Link>
              <Link href={ROUTES.artistAgreement(projectId)} className={styles.actionLink}>
                View Contract
              </Link>
            </div>
          )}
        </div>
      </header>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.workspaceLayout}>

            {/* ── LEFT: CANVAS ── */}
            <div className={styles.canvas}>

              {/* Project Brief */}
              <div className={styles.briefBlock}>
                <p className={styles.blockEyebrow}>Client Brief</p>
                {briefSections.length > 1
                  ? briefSections.map((sec, i) => (
                      <div key={i} className={styles.briefSection}>
                        <p className={styles.briefSectionTitle}>{sec.title}</p>
                        <p className={styles.briefSectionBody}>{renderInlineMarkdown(sec.body)}</p>
                      </div>
                    ))
                  : <p className={styles.briefBody}>{project.description || 'No brief description provided.'}</p>
                }

                {/* Brief meta row */}
                <div className={styles.briefMeta}>
                  {project.category && (
                    <div className={styles.briefMetaItem}>
                      <span className={styles.briefMetaLabel}>Category</span>
                      <span className={styles.briefMetaValue}>{project.category}</span>
                    </div>
                  )}
                  {project.deadline && (
                    <div className={styles.briefMetaItem}>
                      <span className={styles.briefMetaLabel}>Deadline</span>
                      <span className={styles.briefMetaValue}>
                        {new Date(project.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                  {project.budget_max > 0 && (
                    <div className={styles.briefMetaItem}>
                      <span className={styles.briefMetaLabel}>Budget</span>
                      <span className={styles.briefMetaValue}>₹{project.budget_min}–₹{project.budget_max}</span>
                    </div>
                  )}
                </div>

                {/* Reference links */}
                {project.reference_links && project.reference_links.length > 0 && (
                  <div className={styles.refLinks}>
                    <p className={styles.briefMetaLabel}>References</p>
                    {project.reference_links.map((link, i) => (
                      <a key={i} href={link} target="_blank" rel="noopener noreferrer" className={styles.refLink}>
                        {link}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <hr className={styles.divider} />

              {/* ━━ PLATFORM INTEGRITY NOTICE ━━ */}
              {project.status !== 'completed' && (
                <div className={styles.leakageBanner}>
                  <svg className={styles.leakageIcon} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <p className={styles.leakageText}>
                    All communication and payments must remain within De&apos;Artisa Hub. Sharing external contact details or payment links is prohibited and may result in account suspension.
                  </p>
                </div>
              )}

              {/* ━━ DELIVERABLES VAULT ━━ */}
              <div className={styles.deliverableBlock}>

                <p className={styles.blockEyebrow}>Deliverables Vault</p>

                {/* ── PREVIEW STAGE ── */}
                <>
                  <p className={styles.deliverableTitle}>
                    {project.status === 'completed' ? 'Watermarked Previews Sent' : 'Upload Watermarked Previews'}
                  </p>
                  {project.status !== 'completed' && (
                    <>
                      <p className={styles.deliverableHint}>
                        Upload low-res or watermarked previews for the client to review before final payment.
                        Supported: JPG, PNG, PDF.
                      </p>
                      {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? (
                        <CldUploadWidget
                          uploadPreset="de_artisa_uploads"
                          options={{
                            sources: ['local', 'url'],
                            resourceType: 'auto',
                            clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
                            maxFileSize: 52428800,
                            multiple: true,
                          }}
                          onSuccess={handlePreviewUpload}
                        >
                          {({ open }) => (
                            <button type="button" className={styles.dropzone} onClick={() => open()} disabled={uploadingPreview}>
                              <span className={styles.dropzoneIcon}>↑</span>
                              <span className={styles.dropzoneText}>{uploadingPreview ? 'Saving…' : 'Upload preview files'}</span>
                            </button>
                          )}
                        </CldUploadWidget>
                      ) : (
                        <div className={styles.dropzone}><span className={styles.dropzoneText}>Cloudinary not configured.</span></div>
                      )}
                    </>
                  )}

                  {previews.length > 0 && (
                    <div className={styles.deliverableGrid}>
                      {previews.map((file) =>
                        file.resource_type === 'image' ? (
                          <div key={file.id} className={styles.deliverableCard}>
                            <div className={styles.deliverableCardThumb}>
                              <img src={file.secure_url} alt={file.file_name || 'Preview'} className={styles.deliverableCardImg} />
                            </div>
                            <div className={styles.deliverableCardMeta}>
                              <span className={styles.deliverableCardName}>{file.file_name || 'Image'}</span>
                              <span className={styles.deliverableStageBadge}>Preview</span>
                            </div>
                          </div>
                        ) : (
                          <div key={file.id} className={styles.deliverableDocCard}>
                            <div className={styles.deliverableDocIcon}>
                              <svg viewBox="0 0 20 20" fill="currentColor" width="28" height="28"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                            </div>
                            <p className={styles.deliverableDocName}>{file.file_name || 'Document'}</p>
                            <span className={styles.deliverableStageBadge}>Preview</span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </>

                {/* ── FINAL STAGE ── */}
                {(project.status === 'completed' || finals.length > 0) && (
                  <>
                    <hr className={styles.divider} />
                    <p className={styles.deliverableTitle}>Upload Final High-Res Files</p>
                    {project.status === 'completed' && (
                      <>
                        <p className={styles.deliverableHint}>
                          Final payment received. Upload your full-resolution, unprotected deliverables for the client to download.
                        </p>
                        {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? (
                          <CldUploadWidget
                            uploadPreset="de_artisa_uploads"
                            options={{
                              sources: ['local', 'url'],
                              resourceType: 'auto',
                              clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'mp4'],
                              maxFileSize: 104857600,
                              multiple: true,
                            }}
                            onSuccess={handleFinalUpload}
                          >
                            {({ open }) => (
                              <button type="button" className={styles.dropzone} onClick={() => open()} disabled={uploadingFinal}>
                                <span className={styles.dropzoneIcon}>↑</span>
                                <span className={styles.dropzoneText}>{uploadingFinal ? 'Saving…' : 'Upload final files'}</span>
                              </button>
                            )}
                          </CldUploadWidget>
                        ) : (
                          <div className={styles.dropzone}><span className={styles.dropzoneText}>Cloudinary not configured.</span></div>
                        )}
                      </>
                    )}

                    {finals.length > 0 && (
                      <div className={styles.deliverableGrid}>
                        {finals.map((file) =>
                          file.resource_type === 'image' ? (
                            <div key={file.id} className={styles.deliverableCard}>
                              <div className={styles.deliverableCardThumb}>
                                <img src={file.secure_url} alt={file.file_name || 'Final'} className={styles.deliverableCardImg} />
                              </div>
                              <div className={styles.deliverableCardMeta}>
                                <span className={styles.deliverableCardName}>{file.file_name || 'Image'}</span>
                                <span className={styles.deliverableFinalBadge}>Final</span>
                              </div>
                            </div>
                          ) : (
                            <div key={file.id} className={styles.deliverableDocCard}>
                              <div className={styles.deliverableDocIcon}>
                                <svg viewBox="0 0 20 20" fill="currentColor" width="28" height="28"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                              </div>
                              <p className={styles.deliverableDocName}>{file.file_name || 'Document'}</p>
                              <span className={styles.deliverableFinalBadge}>Final</span>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </>
                )}

              </div>

              {/* Messages shortcut removed — use header action bar */}
              </div>

            {/* ── RIGHT: MILESTONE TRACKER ── */}
            <aside className={styles.tracker}>
              <p className={styles.trackerEyebrow}>Project Progress</p>

              <div className={styles.milestoneList}>
                {MILESTONES.map((milestone, idx) => {
                  const isDone = idx < completedUpTo;
                  const isCurrent = idx === stepIndex;

                  return (
                    <div
                      key={milestone.key}
                      className={`${styles.milestoneItem} ${isDone ? styles.milestoneDone : ''} ${isCurrent ? styles.milestoneCurrent : ''}`}
                    >
                      <div className={styles.milestoneIndicator}>
                        <div className={styles.milestoneDot}>
                          {isDone ? '✓' : String(idx + 1).padStart(2, '0')}
                        </div>
                        {idx < MILESTONES.length - 1 && (
                          <div className={`${styles.milestoneLine} ${isDone ? styles.milestoneLineDone : ''}`} />
                        )}
                      </div>

                      <div className={styles.milestoneBody}>
                        <p className={styles.milestoneLabel}>{milestone.label}</p>
                        <p className={styles.milestoneDesc}>{milestone.desc}</p>

                        {/* Action buttons per step */}
                        {isCurrent && milestone.key === 'submit_quote' && (
                          <div className={styles.stepAction}>
                            {!quoteFormOpen ? (
                              <button className={styles.ctaBtn} onClick={() => setQuoteFormOpen(true)}>
                                Submit Quote →
                              </button>
                            ) : (
                              <div className={styles.quoteForm}>
                                <div className={styles.quoteFieldRow}>
                                  <div className={styles.quoteField}>
                                    <label className={styles.quoteLabel}>Amount (₹)</label>
                                    <input
                                      type="number"
                                      className={styles.quoteInput}
                                      placeholder="e.g. 2500"
                                      value={quoteAmount}
                                      onChange={(e) => setQuoteAmount(e.target.value)}
                                    />
                                  </div>
                                  <div className={styles.quoteField}>
                                    <label className={styles.quoteLabel}>Timeline (days)</label>
                                    <input
                                      type="number"
                                      className={styles.quoteInput}
                                      placeholder="e.g. 14"
                                      value={quoteTimeline}
                                      onChange={(e) => setQuoteTimeline(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div className={styles.quoteField}>
                                  <label className={styles.quoteLabel}>Notes (optional)</label>
                                  <textarea
                                    className={styles.quoteTextarea}
                                    placeholder="Brief note about your approach or revisions included…"
                                    value={quoteNotes}
                                    onChange={(e) => setQuoteNotes(e.target.value)}
                                  />
                                </div>
                                {error && <p className={styles.quoteError}>{error}</p>}
                                <div className={styles.quoteActions}>
                                  <button
                                    className={styles.ctaBtn}
                                    onClick={handleSubmitQuote}
                                    disabled={quoteSubmitting}
                                  >
                                    {quoteSubmitting ? 'Submitting…' : 'Send Quote →'}
                                  </button>
                                  <button
                                    className={styles.cancelBtn}
                                    onClick={() => setQuoteFormOpen(false)}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {isCurrent && milestone.key === 'awaiting_agreement' && (
                          <div className={styles.stepAction}>
                            <p className={styles.stepNote}>
                              Quote: ₹{myQuote?.amount} · {myQuote?.timeline_days} days
                            </p>
                            <a
                              href={ROUTES.artistAgreement(projectId)}
                              className={styles.ctaBtn}
                            >
                              View Contract →
                            </a>
                          </div>
                        )}

                        {isCurrent && milestone.key === 'payment_released' && (
                          <div className={styles.stepAction}>
                            <div className={styles.paidBadge}>
                              <span className={styles.paidCheck}>✓</span>
                              Final Payment Cleared. Project Complete.
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>

          </div>
        </div>
      </section>
    </Layout>
  );
}
