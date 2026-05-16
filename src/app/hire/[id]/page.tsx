'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout/Layout';
import { ROUTES } from '@/constants/brand';
import { supabase } from '@/lib/supabase';
import { renderInlineMarkdown } from '@/lib/richText';
import styles from './page.module.css';

export default function HirePage() {
  const params = useParams();
  const router = useRouter();
  const visualizerId = params.id as string;

  const [visualizer, setVisualizer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accessBlocked, setAccessBlocked] = useState(false);
  const [accessMessage, setAccessMessage] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    projectTitle: '',
    description: '',
    deadline: '',
    budget: '',
  });

  // AI Smart Brief
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{
    riskScore: number;
    feedback: string;
    structuredBrief: string;
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;

      if (!userId) {
        setAccessBlocked(true);
        setAccessMessage('Please sign in to assign work to an artist.');
        setLoading(false);
        return;
      }

      const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (roleRow?.role !== 'client') {
        setAccessBlocked(true);
        setAccessMessage('Only clients can assign work to artists.');
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('artist_profiles')
        .select('id, full_name, experience, min_rate, max_rate, state, country, user_id, email, phone')
        .eq('id', visualizerId)
        .single();

      setVisualizer(data || null);
      setLoading(false);
    };

    if (visualizerId) init();
  }, [visualizerId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRefineBrief = async () => {
    if (!formData.description.trim()) return;
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    try {
      const res = await fetch('/api/ai/generate-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: formData.description }),
      });
      const data = await res.json();
      if (!res.ok) setAiError(data.error || 'AI refinement failed.');
      else setAiResult(data);
    } catch {
      setAiError('AI refinement failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiBrief = () => {
    if (!aiResult) return;
    setFormData((prev) => ({ ...prev, description: aiResult.structuredBrief }));
    setIsPreviewMode(true);
    setAiResult(null);
  };

  const riskLabel = (score: number) => {
    if (score <= 3) return { text: 'Brief is clear and complete.', level: 'low' };
    if (score <= 6) return { text: 'Some clarification advised before posting.', level: 'medium' };
    return { text: 'Detailed scoping recommended before proceeding.', level: 'high' };
  };

  const parseSections = (md: string): Array<{ title: string; body: string }> =>
    md.split(/\n?## /).filter(Boolean).map((chunk) => {
      const nl = chunk.indexOf('\n');
      return {
        title: nl > -1 ? chunk.slice(0, nl).trim() : chunk.trim(),
        body:  nl > -1 ? chunk.slice(nl + 1).trim() : '',
      };
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setNotice(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) { setNotice('Please sign in.'); setSubmitLoading(false); return; }

    const { data: clientProfile } = await supabase
      .from('client_profiles').select('id').eq('user_id', userId).single();

    if (!clientProfile?.id) {
      setNotice('Please complete your client profile first.');
      setSubmitLoading(false);
      return;
    }

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        client_id: clientProfile.id,
        title: formData.projectTitle,
        description: formData.description,
        category: 'Direct Hire',
        budget_min: Number(formData.budget || 0),
        budget_max: Number(formData.budget || 0),
        deadline: formData.deadline || null,
        status: 'assigned',
        selected_artist_id: visualizer.id,
      })
      .select('id')
      .single();

    if (error) { setNotice(error.message); setSubmitLoading(false); return; }

    if (visualizer?.user_id) {
      await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: visualizer.user_id,
          email: visualizer.email,
          whatsapp: visualizer.phone,
          message: `You have a new direct hire request. Review it: ${window.location.origin}/jobs/${project?.id}`,
        }),
      });
    }

    router.push(project?.id ? ROUTES.clientProjectWorkspace(project.id) : ROUTES.clientDashboard);
  };

  if (loading) {
    return (
      <Layout>
        <div className={styles.stateWrap}>
          <p className={styles.hint}>Loading&hellip;</p>
        </div>
      </Layout>
    );
  }

  if (accessBlocked || !visualizer) {
    return (
      <Layout>
        <div className={styles.stateWrap}>
          <p className={styles.eyebrow}>Access</p>
          <h1 className={styles.stateTitle}>{accessMessage || 'Artist not found.'}</h1>
          <button className={styles.backBtn} onClick={() => router.push(ROUTES.visualizers)}>
            ← Browse Artists
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>

      {/* ── PAGE HEADER ── */}
      <header className={styles.pageHeader}>
        <div className="container">
          <button className={styles.backLink} onClick={() => router.back()}>← Back</button>
          <p className={styles.eyebrow}>Direct Hire</p>
          <h1 className={styles.pageTitle}>Commission {visualizer.full_name}</h1>
          <p className={styles.pageSubtitle}>
            Describe your vision. Our AI will help you structure a precise brief before it reaches the artist.
          </p>
        </div>
      </header>

      {/* ── TWO-COLUMN BODY ── */}
      <section className={styles.bodySection}>
        <div className="container">
          <div className={styles.twoCol}>

            {/* LEFT — FORM (8 cols) */}
            <div className={styles.formCol}>
              <form onSubmit={handleSubmit} className={styles.form}>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Project Title</label>
                  <input
                    name="projectTitle"
                    className={styles.fieldInput}
                    value={formData.projectTitle}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Luxury Penthouse Interior — Phase 1"
                  />
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Deadline</label>
                    <input
                      type="date"
                      name="deadline"
                      className={styles.fieldInput}
                      value={formData.deadline}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Budget (INR)</label>
                    <div className={styles.budgetWrap}>
                      <span className={styles.budgetSymbol}>₹</span>
                      <input
                        type="number"
                        name="budget"
                        className={styles.fieldInput}
                        value={formData.budget}
                        onChange={handleChange}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.sectionDivider} />

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Project Brief</label>
                  <p className={styles.fieldHint}>
                    Describe your project in detail. The more context you provide, the better the outcome.
                  </p>
                  {isPreviewMode ? (
                    <div className={styles.briefPreview}>
                      {parseSections(formData.description).map((sec, i) => (
                        <div key={i} className={styles.briefSection}>
                          <p className={styles.briefSectionTitle}>{sec.title}</p>
                          <p className={styles.briefSectionBody}>{renderInlineMarkdown(sec.body)}</p>
                        </div>
                      ))}
                      <button type="button" className={styles.editManuallyBtn} onClick={() => setIsPreviewMode(false)}>
                        ✏️ Edit Manually
                      </button>
                    </div>
                  ) : (
                    <textarea
                      name="description"
                      className={styles.fieldTextarea}
                      value={formData.description}
                      onChange={handleChange}
                      rows={7}
                      required
                      placeholder="Describe your vision. Let our AI structure it. (Helpful details: Interior/Exterior, number of views, lighting mood, key materials, camera angles)."
                    />
                  )}
                </div>

                {/* ── AI SCOPING ── */}
                <div className={styles.scopingWrap}>
                  <button
                    type="button"
                    className={styles.scopingBtn}
                    onClick={handleRefineBrief}
                    disabled={aiLoading || !formData.description.trim()}
                  >
                    {aiLoading ? '✨ AI is analyzing...' : 'Initiate Intelligent Scoping'}
                  </button>
                  <p className={styles.scopingHint}>
                    Our AI reviews your brief for completeness, flags ambiguities, and produces a structured technical document.
                  </p>

                  {aiError && <p className={styles.aiError}>{aiError}</p>}

                  {aiResult && (() => {
                    const risk = riskLabel(aiResult.riskScore);
                    const sections = parseSections(aiResult.structuredBrief);
                    return (
                      <div className={styles.scopingResult}>
                        <span className={styles.scopingResultEyebrow}>Intelligent Scoping — Assessment</span>

                        <div className={styles.riskRow}>
                          <span className={`${styles.riskNumber} ${styles[`riskNum_${risk.level}`]}`}>
                            {aiResult.riskScore}
                          </span>
                          <div className={styles.riskDetail}>
                            <span className={styles.riskDetailLabel}>Complexity Score /10</span>
                            <span className={styles.riskDetailText}>{risk.text}</span>
                          </div>
                        </div>

                        <p className={styles.scopingFeedback}>{aiResult.feedback}</p>

                        <div className={styles.briefDocBlock}>
                          <p className={styles.briefDocLabel}>Structured Technical Brief</p>
                          {sections.length > 0
                            ? sections.map((sec, i) => (
                                <div key={i} className={styles.briefSection}>
                                  <p className={styles.briefSectionTitle}>{sec.title}</p>
                                  <p className={styles.briefSectionBody}>{renderInlineMarkdown(sec.body)}</p>
                                </div>
                              ))
                            : <p className={styles.briefSectionBody}>{renderInlineMarkdown(aiResult.structuredBrief)}</p>
                          }
                        </div>

                        <div className={styles.scopingActions}>
                          <button type="button" className={styles.applyBtn} onClick={applyAiBrief}>
                            Apply to Form →
                          </button>
                          <button type="button" className={styles.dismissBtn} onClick={() => setAiResult(null)}>
                            Dismiss
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className={styles.sectionDivider} />

                {notice && <p className={styles.formNotice}>{notice}</p>}

                <div className={styles.formActions}>
                  <button type="submit" className={styles.submitBtn} disabled={submitLoading}>
                    {submitLoading ? 'Sending…' : 'Send Brief to Artist →'}
                  </button>
                  <button type="button" className={styles.cancelBtn} onClick={() => router.back()}>
                    Cancel
                  </button>
                </div>

              </form>
            </div>

            {/* RIGHT — ARTIST DOSSIER (4 cols) */}
            <aside className={styles.dossierCol}>

              <div className={styles.dossierBlock}>
                <p className={styles.dossierEyebrow}>Selected Artist</p>
                <p className={styles.dossierName}>{visualizer.full_name}</p>
                {(visualizer.state || visualizer.country) && (
                  <p className={styles.dossierLocation}>
                    {[visualizer.state, visualizer.country].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>

              <div className={styles.dossierDivider} />

              <div className={styles.dossierBlock}>
                <div className={styles.dossierStat}>
                  <span className={styles.dossierStatLabel}>Rate Range</span>
                  <span className={styles.dossierStatValue}>
                    ${visualizer.min_rate || 0} – ${visualizer.max_rate || 0}/hr
                  </span>
                </div>
                {visualizer.experience && (
                  <div className={styles.dossierStat}>
                    <span className={styles.dossierStatLabel}>Experience</span>
                    <span className={styles.dossierStatValue}>{visualizer.experience}</span>
                  </div>
                )}
              </div>

              <div className={styles.dossierDivider} />

              <div className={styles.dossierBlock}>
                <p className={styles.dossierEyebrow}>What Happens Next</p>
                <ol className={styles.stepsList}>
                  <li className={styles.stepsItem}>{visualizer.full_name} reviews your brief</li>
                  <li className={styles.stepsItem}>You receive a detailed quote</li>
                  <li className={styles.stepsItem}>Approve and secure payment in escrow</li>
                  <li className={styles.stepsItem}>Production begins</li>
                </ol>
              </div>

            </aside>

          </div>
        </div>
      </section>

    </Layout>
  );
}
