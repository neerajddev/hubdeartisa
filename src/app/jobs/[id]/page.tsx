'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Layout from '@/components/Layout/Layout';
import { supabase } from '@/lib/supabase';
import { renderInlineMarkdown } from '@/lib/richText';
import styles from './page.module.css';

export default function JobDetailPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const [project, setProject] = useState<any>(null);
  const [artistId, setArtistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ timeline: '', notes: '' });
  const [services, setServices] = useState<Array<{ name: string; rate: string }>>([
    { name: 'Modeling', rate: '' },
  ]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [alreadyQuoted, setAlreadyQuoted] = useState(false);
  const currencySymbol = '₹';

  const containsContactInfo = (value: string) => {
    const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
    const phoneRegex = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/;
    return emailRegex.test(value) || phoneRegex.test(value);
  };

  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) {
        setMessage('Please sign in to submit a quote.');
        setLoading(false);
        return;
      }

      const { data: artistProfile } = await supabase
        .from('artist_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      setArtistId(artistProfile?.id || null);

      if (artistProfile?.id) {
        const { data: existingQuote } = await supabase
          .from('project_quotes')
          .select('id')
          .eq('project_id', projectId)
          .eq('artist_id', artistProfile.id)
          .maybeSingle();
        if (existingQuote) setAlreadyQuoted(true);
      }

      const { data } = await supabase
        .from('projects')
        .select('id, title, description, category, budget_min, budget_max, deadline, status, reference_links, client_id')
        .eq('id', projectId)
        .single();

      setProject(data);
      setLoading(false);
    };

    if (projectId) {
      load();
    }
  }, [projectId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!artistId) {
      setMessage('Complete your artist profile before submitting quotes.');
      return;
    }

    if (containsContactInfo(form.notes)) {
      setMessage('Please remove phone numbers or emails from your quote notes.');
      return;
    }

    if (!termsAccepted) {
      setMessage('Please accept the terms before submitting your quote.');
      return;
    }

    const cleanedServices = services
      .map((service) => ({
        name: service.name.trim(),
        rate: Number(service.rate || 0),
      }))
      .filter((service) => service.name && service.rate > 0);

    if (cleanedServices.length === 0) {
      setMessage('Please add at least one service with a valid rate.');
      return;
    }

    const totalAmount = cleanedServices.reduce((sum, service) => sum + service.rate, 0);

    const pdfUrl = await generateAndUploadQuotePdf({
      project,
      services: cleanedServices,
      timeline: Number(form.timeline || 0),
      notes: form.notes,
      totalAmount,
    });

    if (!pdfUrl) {
      setMessage('Unable to generate quote PDF. Please try again.');
      return;
    }

    const { error } = await supabase.from('project_quotes').insert({
      project_id: projectId,
      artist_id: artistId,
      amount: totalAmount,
      timeline_days: Number(form.timeline),
      notes: form.notes,
      services: cleanedServices,
      pdf_url: pdfUrl,
      terms_accepted_at: new Date().toISOString(),
    });

    if (error) {
      setMessage(error.message);
    } else {
      await notifyQuoteParties(pdfUrl, totalAmount);
      setAlreadyQuoted(true);
      setForm({ timeline: '', notes: '' });
      setServices([{ name: 'Modeling', rate: '' }]);
      setTermsAccepted(false);
    }
  };

  const totalAmount = useMemo(
    () => services.reduce((sum, service) => sum + Number(service.rate || 0), 0),
    [services]
  );

  const handleServiceChange = (index: number, field: 'name' | 'rate', value: string) => {
    setServices((prev) =>
      prev.map((service, idx) => (idx === index ? { ...service, [field]: value } : service))
    );
  };

  const addServiceRow = () => {
    setServices((prev) => [...prev, { name: '', rate: '' }]);
  };

  const removeServiceRow = (index: number) => {
    setServices((prev) => prev.filter((_, idx) => idx !== index));
  };

  const generateAndUploadQuotePdf = async ({
    project,
    services,
    timeline,
    notes,
    totalAmount,
  }: {
    project: any;
    services: Array<{ name: string; rate: number }>;
    timeline: number;
    notes: string;
    totalAmount: number;
  }) => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text("De'Artisa Hub Quote", 14, 18);
      doc.setFontSize(12);
      doc.text(`Project: ${project?.title || ''}`, 14, 30);
      doc.text(`Timeline: ${timeline} days`, 14, 38);

      doc.text('Services:', 14, 50);
      let y = 58;
      services.forEach((service) => {
        doc.text(`• ${service.name}: ${currencySymbol}${service.rate}`, 18, y);
        y += 8;
      });
      doc.text(`Total: ${currencySymbol}${totalAmount}`, 14, y + 6);

      if (notes) {
        doc.text('Notes:', 14, y + 18);
        doc.setFontSize(10);
        doc.text(doc.splitTextToSize(notes, 180), 14, y + 26);
      }

      const pdfBlob = doc.output('blob');
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      if (!cloudName) return null;

      const formData = new FormData();
      formData.append('file', pdfBlob, `quote-${project?.id || 'project'}.pdf`);
      formData.append('upload_preset', 'de_artisa_uploads');
      formData.append('resource_type', 'raw');

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.secure_url as string;
    } catch (error) {
      return null;
    }
  };

  const notifyQuoteParties = async (pdfUrl: string, totalAmount: number) => {
    if (!project?.client_id || !artistId) return;

    const [{ data: clientProfile }, { data: artistProfile }] = await Promise.all([
      supabase
        .from('client_profiles')
        .select('user_id, email')
        .eq('id', project.client_id)
        .single(),
      supabase
        .from('artist_profiles')
        .select('user_id, email')
        .eq('id', artistId)
        .single(),
    ]);

    const clientMessage = `You received a new quote for ${project.title}. Total: ${currencySymbol}${totalAmount}. Download: ${pdfUrl}`;
    const artistMessage = `Your quote for ${project.title} was submitted. Total: ${currencySymbol}${totalAmount}. Download: ${pdfUrl}`;

    if (clientProfile?.user_id) {
      await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: clientProfile.user_id,
          email: clientProfile.email,
          message: clientMessage,
        }),
      });
    }

    if (artistProfile?.user_id) {
      await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: artistProfile.user_id,
          email: artistProfile.email,
          message: artistMessage,
        }),
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className={styles.stateWrap}>
          <div className="container"><p className={styles.hint}>Loading brief&hellip;</p></div>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className={styles.stateWrap}>
          <div className="container"><p className={styles.hint}>Project not found.</p></div>
        </div>
      </Layout>
    );
  }

  // Parse AI-structured brief (## headings) into sections
  const parseSections = (md: string): Array<{ title: string; body: string }> =>
    md.split(/\n?## /).filter(Boolean).map((chunk) => {
      const nl = chunk.indexOf('\n');
      return {
        title: nl > -1 ? chunk.slice(0, nl).trim() : chunk.trim(),
        body:  nl > -1 ? chunk.slice(nl + 1).trim() : '',
      };
    });

  const briefSections = project.description ? parseSections(project.description) : [];

  return (
    <Layout>

      {/* ── PAGE HEADER ── */}
      <header className={styles.pageHeader}>
        <div className="container">
          <button className={styles.backLink} onClick={() => window.history.back()}>← Browse Briefs</button>
          <p className={styles.eyebrow}>{project.category || 'Open Brief'}</p>
          <h1 className={styles.pageTitle}>{project.title}</h1>
          <div className={styles.headerMeta}>
            {project.budget_max > 0 && (
              <span className={styles.metaItem}>Budget: {currencySymbol}{project.budget_max.toLocaleString()}</span>
            )}
            {project.deadline && (
              <span className={styles.metaItem}>Deadline: {project.deadline}</span>
            )}
          </div>
        </div>
      </header>

      {/* ── TWO-COLUMN BODY ── */}
      <section className={styles.bodySection}>
        <div className="container">
          <div className={styles.twoCol}>

            {/* LEFT — BRIEF */}
            <div className={styles.briefCol}>
              <p className={styles.colEyebrow}>Project Brief</p>

              {briefSections.length > 1
                ? briefSections.map((sec, i) => (
                    <div key={i} className={styles.briefSection}>
                      <p className={styles.briefSectionTitle}>{sec.title}</p>
                      <p className={styles.briefSectionBody}>{renderInlineMarkdown(sec.body)}</p>
                    </div>
                  ))
                : project.description
                  ? <p className={styles.briefText}>{project.description}</p>
                  : <p className={styles.hint}>No description provided.</p>
              }

              {project.reference_links?.length > 0 && (
                <div className={styles.refBlock}>
                  <p className={styles.colEyebrow} style={{ marginTop: '2rem' }}>Reference Links</p>
                  <ul className={styles.refList}>
                    {project.reference_links.map((link: string) => (
                      <li key={link}>
                        <a href={link} target="_blank" rel="noreferrer" className={styles.refLink}>
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* RIGHT — QUOTE FORM or SUBMITTED STATE */}
            <div className={styles.quoteCol}>

              {alreadyQuoted ? (
                <div className={styles.quotedConfirm}>
                  <p className={styles.quotedIcon}>✓</p>
                  <p className={styles.quotedTitle}>Quote Submitted.</p>
                  <p className={styles.quotedSub}>Awaiting client review. You’ll be notified when the client makes a decision.</p>
                </div>
              ) : (
                <>
              <p className={styles.colEyebrow}>Submit a Quote</p>

              <form className={styles.quoteForm} onSubmit={handleSubmit}>

                {/* Service breakdown */}
                <div className={styles.servicesBlock}>
                  <div className={styles.servicesBlockHeader}>
                    <span className={styles.fieldLabel}>Service Breakdown</span>
                    <button type="button" className={styles.addServiceBtn} onClick={addServiceRow}>
                      + Add
                    </button>
                  </div>
                  {services.map((service, index) => (
                    <div key={index} className={styles.serviceRow}>
                      <input
                        type="text"
                        className={styles.fieldInput}
                        placeholder="Service (e.g., Modeling)"
                        value={service.name}
                        onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                      />
                      <div className={styles.serviceRateWrap}>
                        <span className={styles.budgetSymbol}>{currencySymbol}</span>
                        <input
                          type="number"
                          className={styles.fieldInput}
                          placeholder="Rate"
                          value={service.rate}
                          onChange={(e) => handleServiceChange(index, 'rate', e.target.value)}
                        />
                      </div>
                      {services.length > 1 && (
                        <button type="button" className={styles.removeServiceBtn} onClick={() => removeServiceRow(index)}>
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <div className={styles.serviceTotal}>
                    <span className={styles.fieldLabel}>Total Quote</span>
                    <span className={styles.serviceTotalValue}>{currencySymbol}{totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Timeline (days)</label>
                  <input
                    type="number"
                    className={styles.fieldInput}
                    value={form.timeline}
                    onChange={(e) => setForm({ ...form, timeline: e.target.value })}
                    required
                    placeholder="e.g. 14"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Cover Letter</label>
                  <p className={styles.fieldHint}>
                    Describe your approach. Avoid sharing contact details.
                  </p>
                  <textarea
                    className={styles.fieldTextarea}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={5}
                    placeholder="Outline your approach, experience with similar projects, and why you're the right fit…"
                  />
                </div>

                <div className={styles.termsBlock}>
                  <p className={styles.termsTitle}>Quote Terms</p>
                  <ul className={styles.termsList}>
                    <li>All communication stays on De&apos;Artisa Hub.</li>
                    <li>Delivery follows the agreed timeline.</li>
                    <li>Payments are held in escrow until client approval.</li>
                  </ul>
                  <label className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                    />
                    <span>I agree to the quote terms.</span>
                  </label>
                </div>

                {message && <p className={styles.notice}>{message}</p>}

                <button type="submit" className={styles.submitBtn}>
                  Submit Quote →
                </button>

              </form>
              </>
              )}
            </div>

          </div>
        </div>
      </section>

    </Layout>
  );
}
