'use client';

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout/Layout';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

const SERVICE_OPTIONS = [
  'Interior Rendering',
  'Exterior Rendering',
  '3D Floor Plans',
  'Architectural Animation',
  'Virtual Reality',
  'Landscape Design',
  'Product Visualization',
  'Other',
];

export default function ArtistSettingsPage() {
  const [artistId, setArtistId] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: '',
    country: '',
    state: '',
    bio: '',
    starting_rate: '',
    phone: '',
    languages: '',
    experience: '',
  });
  const [services, setServices] = useState<string[]>([]);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) { setLoading(false); return; }

      const { data } = await supabase
        .from('artist_profiles')
        .select('id, full_name, country, state, bio, min_rate, phone, languages, experience, specialties')
        .eq('user_id', userId)
        .single();

      if (data?.id) {
        setArtistId(data.id);
        setForm({
          full_name: data.full_name || '',
          country: data.country || '',
          state: data.state || '',
          bio: data.bio || '',
          starting_rate: data.min_rate != null ? String(data.min_rate) : '',
          phone: data.phone || '',
          languages: data.languages || '',
          experience: data.experience || '',
        });
        setServices(data.specialties || []);
      }
      setLoading(false);
    };

    load();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setStatus(null);
  };

  const toggleService = (svc: string) => {
    setServices((prev) =>
      prev.includes(svc) ? prev.filter((s) => s !== svc) : [...prev, svc]
    );
    setStatus(null);
  };

  const handleSave = async () => {
    if (!artistId) return;
    setSaving(true);
    setStatus(null);

    const { error } = await supabase
      .from('artist_profiles')
      .update({
        full_name: form.full_name,
        country: form.country,
        state: form.state,
        bio: form.bio,
        min_rate: form.starting_rate ? Number(form.starting_rate) : null,
        phone: form.phone || null,
        languages: form.languages || null,
        experience: form.experience || null,
        specialties: services,
      })
      .eq('id', artistId);

    if (error) {
      setStatus({ type: 'error', text: error.message });
    } else {
      setStatus({ type: 'success', text: 'Profile saved.' });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className={styles.stateWrap}>
          <div className="container"><p className={styles.hint}>Loading settings…</p></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>

      {/* ── PAGE HEADER ── */}
      <header className={styles.pageHeader}>
        <div className="container">
          <button className={styles.backLink} onClick={() => window.history.back()}>← Studio</button>
          <p className={styles.eyebrow}>Artist Studio</p>
          <h1 className={styles.pageTitle}>Profile Settings</h1>
          <p className={styles.pageSubtitle}>
            Manage your public-facing artist profile. This information appears on your storefront and in client searches.
          </p>
        </div>
      </header>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.formWrap}>

            {/* ── IDENTITY ── */}
            <fieldset className={styles.fieldset}>
              <legend className={styles.fieldsetLegend}>Identity</legend>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="full_name">Full Name</label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  className={styles.input}
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="Your display name"
                />
              </div>

              <div className={styles.twoCol}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="country">Country</label>
                  <input
                    id="country"
                    name="country"
                    type="text"
                    className={styles.input}
                    value={form.country}
                    onChange={handleChange}
                    placeholder="e.g. India"
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="state">City / State</label>
                  <input
                    id="state"
                    name="state"
                    type="text"
                    className={styles.input}
                    value={form.state}
                    onChange={handleChange}
                    placeholder="e.g. Mumbai"
                  />
                </div>
              </div>

              <div className={styles.twoCol}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="languages">Languages</label>
                  <input
                    id="languages"
                    name="languages"
                    type="text"
                    className={styles.input}
                    value={form.languages}
                    onChange={handleChange}
                    placeholder="e.g. English, Hindi"
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="experience">Years of Experience</label>
                  <input
                    id="experience"
                    name="experience"
                    type="text"
                    className={styles.input}
                    value={form.experience}
                    onChange={handleChange}
                    placeholder="e.g. 5"
                  />
                </div>
              </div>
            </fieldset>

            {/* ── DIVIDER ── */}
            <div className={styles.divider} />

            {/* ── BIO ── */}
            <fieldset className={styles.fieldset}>
              <legend className={styles.fieldsetLegend}>Bio</legend>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="bio">About You</label>
                <p className={styles.fieldHint}>
                  This appears on your public profile. Be specific about your style and process.
                </p>
                <textarea
                  id="bio"
                  name="bio"
                  className={styles.textarea}
                  value={form.bio}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Describe your background, visual style, and the kinds of projects you do best work on…"
                />
              </div>
            </fieldset>

            {/* ── DIVIDER ── */}
            <div className={styles.divider} />

            {/* ── RATES & CONTACT ── */}
            <fieldset className={styles.fieldset}>
              <legend className={styles.fieldsetLegend}>Rates &amp; Contact</legend>

              <div className={styles.twoCol}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="starting_rate">Starting Rate (₹)</label>
                  <div className={styles.rateWrap}>
                    <span className={styles.ratePre}>₹</span>
                    <input
                      id="starting_rate"
                      name="starting_rate"
                      type="number"
                      className={styles.input}
                      value={form.starting_rate}
                      onChange={handleChange}
                      placeholder="e.g. 25000"
                    />
                  </div>
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="phone">WhatsApp / Phone</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    className={styles.input}
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            </fieldset>

            {/* ── DIVIDER ── */}
            <div className={styles.divider} />

            {/* ── SERVICES ── */}
            <fieldset className={styles.fieldset}>
              <legend className={styles.fieldsetLegend}>Services Offered</legend>
              <p className={styles.fieldHint}>Select all that apply. These appear as tags on your storefront.</p>
              <div className={styles.serviceGrid}>
                {SERVICE_OPTIONS.map((svc) => (
                  <button
                    key={svc}
                    type="button"
                    onClick={() => toggleService(svc)}
                    className={`${styles.serviceChip} ${services.includes(svc) ? styles.serviceChipActive : ''}`}
                  >
                    {svc}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* ── SAVE ── */}
            <div className={styles.saveRow}>
              {status && (
                <p className={status.type === 'success' ? styles.noticeSuccess : styles.noticeError}>
                  {status.text}
                </p>
              )}
              <button
                type="button"
                className={styles.saveBtn}
                onClick={handleSave}
                disabled={saving || !artistId}
              >
                {saving ? 'Saving…' : 'Save Profile'}
              </button>
            </div>

          </div>
        </div>
      </section>

    </Layout>
  );
}
