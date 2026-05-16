'use client';

import React, { useState } from 'react';
import Layout from '@/components/Layout/Layout';
import Button from '@/components/Button/Button';
import Link from 'next/link';
import { ROUTES } from '@/constants/brand';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

const SPECIALTIES = [
  'Interior Rendering',
  'Exterior Rendering',
  '3D Floor Plans',
  'Architectural Animation',
  'Virtual Reality',
  'Landscape Design',
  'Other',
];

export default function ArtistRegistrationPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    state: '',
    country: '',
    experience: '',
    specialties: [] as string[],
    customSpecialty: '',
    languages: '',
    phone: '',
    bio: '',
    portfolioUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData({
      ...formData,
      specialties: formData.specialties.includes(specialty)
        ? formData.specialties.filter(s => s !== specialty)
        : [...formData.specialties, specialty],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.specialties.length === 0) {
      setError('Please select at least one specialty.');
      return;
    }

    setLoading(true);

    try {
      // Check for duplicate application
      const { data: existing } = await supabase
        .from('artist_applications')
        .select('email')
        .eq('email', formData.email)
        .maybeSingle();

      if (existing) {
        throw new Error('An application with this email already exists. Our team will be in touch.');
      }

      // Submit application — no auth account created yet
      const { error: insertError } = await supabase
        .from('artist_applications')
        .insert({
          full_name: formData.fullName,
          email: formData.email,
          state: formData.state,
          country: formData.country,
          experience: formData.experience,
          specialties: formData.specialties,
          custom_specialty: formData.customSpecialty || null,
          languages: formData.languages,
          phone: formData.phone || null,
          bio: formData.bio,
          portfolio_url: formData.portfolioUrl || null,
          status: 'pending_review',
        });

      if (insertError) throw insertError;

      setSubmitted(true);
    } catch (err: any) {
      console.error('Application error:', err);
      setError(err.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Layout>
        <section className={styles.successSection}>
          <div className="container">
            <div className={styles.successCard}>
              <div className={styles.successIcon}>✦</div>
              <h1 className={styles.successTitle}>Application Received.</h1>
              <p className={styles.successMessage}>
                Our curation team will carefully review your portfolio and experience.
                We maintain a highly selective network — accepting only the{' '}
                <strong>top 10% of applicants</strong> to ensure every client receives
                exceptional quality.
              </p>
              <p className={styles.successSub}>
                You will receive a personalised response at <strong>{formData.email}</strong> within 3–5 business days.
              </p>
              <Link href={ROUTES.home} className={styles.successBackLink}>
                Return to Home
              </Link>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.pageHeader}>
        <div className="container">
          <div className={styles.headerBadge}>Curated Artist Network</div>
          <h1 className={styles.pageTitle}>Apply to Join De&apos;Artisa Hub</h1>
          <p className={styles.pageDescription}>
            We selectively onboard the world&apos;s finest 3D visualization artists.
            Submit your application and our curation team will be in touch.
          </p>
        </div>
      </div>

      <section className={styles.formSection}>
        <div className="container">
          <div className={styles.formContainer}>
            <form onSubmit={handleSubmit} className={styles.form}>
              {error && (
                <div className={styles.errorMessage}>
                  {error}
                </div>
              )}

              <div className={styles.formGroup}>
                <label htmlFor="fullName" className={styles.label}>Full Name *</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="state" className={styles.label}>State / Region *</label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Enter your state"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="country" className={styles.label}>Country *</label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Enter your country"
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="experience" className={styles.label}>Years of Experience *</label>
                <select
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  className={styles.select}
                  required
                >
                  <option value="">Select experience level</option>
                  <option value="0-2 years">0–2 years</option>
                  <option value="3-5 years">3–5 years</option>
                  <option value="6-10 years">6–10 years</option>
                  <option value="10+ years">10+ years</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Specialties * (select all that apply)</label>
                <div className={styles.checkboxGrid}>
                  {SPECIALTIES.map((specialty) => (
                    <label key={specialty} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.specialties.includes(specialty)}
                        onChange={() => handleSpecialtyToggle(specialty)}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxText}>{specialty}</span>
                    </label>
                  ))}
                </div>
              </div>

              {formData.specialties.includes('Other') && (
                <div className={styles.formGroup}>
                  <label htmlFor="customSpecialty" className={styles.label}>Please specify your specialty</label>
                  <input
                    type="text"
                    id="customSpecialty"
                    name="customSpecialty"
                    value={formData.customSpecialty}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Enter your specialty..."
                  />
                </div>
              )}

              <div className={styles.formGroup}>
                <label htmlFor="languages" className={styles.label}>Languages *</label>
                <input
                  type="text"
                  id="languages"
                  name="languages"
                  value={formData.languages}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="e.g., English, Spanish, French"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="phone" className={styles.label}>Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="portfolioUrl" className={styles.label}>
                  Portfolio URL *
                  <span className={styles.labelHint}> — Behance, ArtStation, personal site, or Google Drive</span>
                </label>
                <input
                  type="url"
                  id="portfolioUrl"
                  name="portfolioUrl"
                  value={formData.portfolioUrl}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="https://"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="bio" className={styles.label}>Professional Statement *</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className={styles.textarea}
                  rows={5}
                  placeholder="Describe your specialisation, the calibre of projects you work on, and what distinguishes your work..."
                  required
                />
              </div>

              <div className={styles.formActions}>
                <Button type="submit" size="large" fullWidth disabled={loading}>
                  {loading ? 'Submitting Application…' : 'Submit Application'}
                </Button>
              </div>

              <div className={styles.formFooter}>
                <p className={styles.footerText}>
                  Already approved?{' '}
                  <Link href={ROUTES.signIn} className={styles.footerLink}>Sign In</Link>
                </p>
                <p className={styles.footerText}>
                  Looking to hire?{' '}
                  <Link href="/register/client" className={styles.footerLink}>Register as Client</Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>

      <div className={styles.backBar}>
        <div className="container">
          <Link href={ROUTES.home} className={styles.backLink}>← Back to Home</Link>
        </div>
      </div>
    </Layout>
  );
}
