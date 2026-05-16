'use client';

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout/Layout';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants/brand';
import styles from './page.module.css';

export default function ClientSettingsPage() {
  const router = useRouter();
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    company: '',
  });

  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) { setLoading(false); return; }

      const { data } = await supabase
        .from('client_profiles')
        .select('id, full_name, company, phone')
        .eq('user_id', userId)
        .single();

      if (data) {
        setClientId(data.id);
        setForm({
          full_name: data.full_name || '',
          phone:     data.phone     || '',
          company:   data.company   || '',
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setStatus(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    setSaving(true);
    setStatus(null);

    const { error } = await supabase
      .from('client_profiles')
      .update({
        full_name: form.full_name,
        phone:     form.phone     || null,
        company:   form.company   || null,
      })
      .eq('id', clientId);

    setSaving(false);
    setStatus(error
      ? { type: 'error', text: error.message }
      : { type: 'success', text: 'Settings saved.' }
    );
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
          <button className={styles.backLink} onClick={() => router.back()}>← Dashboard</button>
          <p className={styles.eyebrow}>Firm Settings</p>
          <h1 className={styles.pageTitle}>Account Settings</h1>
          <p className={styles.pageSubtitle}>
            Update your firm details. These appear on projects and communications with artists.
          </p>
        </div>
      </header>

      {/* ── FORM ── */}
      <section className={styles.section}>
        <div className="container">
          <form onSubmit={handleSave} className={styles.formWrap}>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="full_name">Full Name</label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                className={styles.input}
                value={form.full_name}
                onChange={handleChange}
                placeholder="e.g. Arjun Mehta"
              />
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

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="company">
                Company / Studio Name <span style={{ fontWeight: 400, opacity: 0.6 }}>(Optional)</span>
              </label>
              <input
                id="company"
                name="company"
                type="text"
                className={styles.input}
                value={form.company}
                onChange={handleChange}
                placeholder="e.g. Mehta Design Studio"
              />
            </div>

            <div className={styles.saveRow}>
              {status && (
                <p className={status.type === 'success' ? styles.noticeSuccess : styles.noticeError}>
                  {status.text}
                </p>
              )}
              <button type="submit" className={styles.saveBtn} disabled={saving || !clientId}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button type="button" className={styles.cancelLink} onClick={() => router.push(ROUTES.clientDashboard)}>
                Cancel
              </button>
            </div>

          </form>
        </div>
      </section>

    </Layout>
  );
}
