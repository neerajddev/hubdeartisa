'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout/Layout';
import { supabase } from '@/lib/supabase';
import { ROUTES } from '@/constants/brand';
import { CldUploadWidget } from 'next-cloudinary';
import { renderInlineMarkdown } from '@/lib/richText';
import styles from './page.module.css';

export default function NewClientProjectPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    budgetMax: '',
    deadline: '',
    description: '',
  });
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // AI Smart Brief
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{
    riskScore: number;
    feedback: string;
    structuredBrief: string;
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const containsContactInfo = (value: string) => {
    const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
    const phoneRegex = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/;
    return emailRegex.test(value) || phoneRegex.test(value);
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
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
      if (!res.ok) {
        setAiError(data.error || 'AI refinement failed.');
      } else {
        setAiResult(data);
      }
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    if (
      containsContactInfo(formData.title) ||
      containsContactInfo(formData.description)
    ) {
      setMessage('Please remove phone numbers or emails from your project details.');
      setLoading(false);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) {
      setMessage('Please sign in to create a project.');
      setLoading(false);
      return;
    }

    const { data: clientProfile, error: clientError } = await supabase
      .from('client_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (clientError || !clientProfile?.id) {
      setMessage('Please complete your client profile before posting a project.');
      setLoading(false);
      return;
    }

    const { data: inserted, error } = await supabase.from('projects').insert({
      client_id: clientProfile.id,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      budget_max: Number(formData.budgetMax || 0),
      deadline: formData.deadline || null,
      status: 'open',
      reference_links: attachmentUrls,
    }).select('id').single();

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.push(inserted?.id ? ROUTES.clientProjectWorkspace(inserted.id) : ROUTES.clientDashboard);
  };

  const riskLabel = (score: number) => {
    if (score <= 3) return { text: 'Brief is clear and complete.', level: 'low' };
    if (score <= 6) return { text: 'Some clarification advised before posting.', level: 'medium' };
    return { text: 'Detailed scoping recommended before proceeding.', level: 'high' };
  };

  // Parse Gemini markdown (## Section\nbody) into section objects
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
      <header className={styles.pageHeader}>
        <div className="container">
          <button className={styles.backLink} onClick={() => router.back()}>← Dashboard</button>
          <p className={styles.eyebrow}>New Project Brief</p>
          <h1 className={styles.pageTitle}>Scope Your Project</h1>
          <p className={styles.pageSubtitle}>
            Share your vision. Our intelligent system will help structure it for the best results.
          </p>
        </div>
      </header>

      <section className={styles.section}>
        <div className="container">
          <form className={styles.formBody} onSubmit={handleSubmit}>

            {/* ── Row 1: Title (full width) ── */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Project Title</label>
              <input
                name="title"
                className={styles.fieldInput}
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g. Luxury Apartment Interior — Phase 2"
              />
            </div>

            {/* ── Row 2: Category + Deadline ── */}
            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Category</label>
                <input
                  name="category"
                  className={styles.fieldInput}
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="Interior, Exterior, Retail…"
                />
              </div>
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
            </div>

            {/* ── Row 3: Max Budget ── */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Max Budget (USD)</label>
              <div className={styles.budgetWrap}>
                <span className={styles.budgetSymbol}>$</span>
                <input
                  type="number"
                  name="budgetMax"
                  className={styles.fieldInput}
                  value={formData.budgetMax}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
            </div>

            {/* ── Divider ── */}
            <div className={styles.sectionDivider} />

            {/* ── Row 4: Project Brief ── */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Project Brief</label>
              <p className={styles.fieldHint}>
                Describe your project in detail. The more context you provide, the better the quotes you will receive.
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
                  placeholder="Describe your vision. Let our AI structure it. (Helpful details: Interior/Exterior, number of views, lighting mood, key materials, camera angles)."
                />
              )}
            </div>

            {/* ── AI Scoping ── */}
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

                    {/* Risk score — large typographic number */}
                    <div className={styles.riskRow}>
                      <span className={`${styles.riskNumber} ${styles[`riskNum_${risk.level}`]}`}>
                        {aiResult.riskScore}
                      </span>
                      <div className={styles.riskDetail}>
                        <span className={styles.riskDetailLabel}>Complexity Score /10</span>
                        <span className={styles.riskDetailText}>{risk.text}</span>
                      </div>
                    </div>

                    {/* AI narrative feedback */}
                    <p className={styles.scopingFeedback}>{aiResult.feedback}</p>

                    {/* Structured brief — section-by-section, no scroll cap */}
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

            {/* ── Divider ── */}
            <div className={styles.sectionDivider} />

            {/* ── File Upload ── */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Reference Files (optional)</label>
              <p className={styles.fieldHint}>
                Floor plans, mood boards, or reference imagery. Avoid sharing personal contact details.
              </p>
              {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? (
                <CldUploadWidget
                  uploadPreset="de_artisa_uploads"
                  options={{ multiple: true, resourceType: 'auto' }}
                  onSuccess={(result: any) => {
                    if (result.event === 'success') {
                      setAttachmentUrls((prev) => [...prev, result.info.secure_url]);
                    }
                  }}
                >
                  {({ open }) => (
                    <div>
                      <button type="button" className={styles.uploadBtn} onClick={() => open()}>
                        Upload Files
                      </button>
                      {attachmentUrls.length > 0 && (
                        <div className={styles.fileList}>
                          {attachmentUrls.map((url) => (
                            <span key={url} className={styles.fileItem}>
                              {url.split('/').pop()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CldUploadWidget>
              ) : (
                <div>
                  <button type="button" className={styles.uploadBtn} disabled>
                    Upload Files (storage not configured)
                  </button>
                </div>
              )}
            </div>

            {message && <p className={styles.formNotice}>{message}</p>}

            {/* ── Submit ── */}
            <div className={styles.formActions}>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Posting…' : 'Post Project →'}
              </button>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => router.push(ROUTES.clientProjects)}
              >
                Cancel
              </button>
            </div>

          </form>
        </div>
      </section>
    </Layout>
  );
}
