'use client';

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout/Layout';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

const RATE_TYPES = ['Per View', 'Per Area', 'Per Min', 'Per Hr'];

export default function ArtistRatesPage() {
  const [artistId, setArtistId] = useState<string | null>(null);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, { rateType: string; min: number; max: number }>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadRates = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) return;

      const { data } = await supabase
        .from('artist_profiles')
        .select('id, specialties')
        .eq('user_id', userId)
        .single();

      if (data?.id) setArtistId(data.id);
      setSpecialties(data?.specialties || []);

      const { data: rateRows } = await supabase
        .from('artist_rates')
        .select('specialty, rate_type, min_price, max_price')
        .eq('artist_id', data?.id || '')
        .order('specialty', { ascending: true });

      const mapped: Record<string, { rateType: string; min: number; max: number }> = {};
      (rateRows || []).forEach((row: any) => {
        mapped[row.specialty] = {
          rateType: row.rate_type || 'Per View',
          min: row.min_price || 0,
          max: row.max_price || 0,
        };
      });
      setRows(mapped);
    };

    loadRates();
  }, []);

  const handleRateChange = (specialty: string, field: 'min' | 'max' | 'rateType', value: number | string) => {
    setRows((prev) => ({
      ...prev,
      [specialty]: {
        rateType: field === 'rateType' ? String(value) : prev[specialty]?.rateType || 'Per View',
        min: field === 'min' ? Number(value) : prev[specialty]?.min || 0,
        max: field === 'max' ? Number(value) : prev[specialty]?.max || 0,
      },
    }));
    setStatus(null);
  };

  const handleSave = async () => {
    if (!artistId) return;
    setSaving(true);
    setStatus(null);

    const payload = specialties.map((specialty) => ({
      artist_id: artistId,
      specialty,
      rate_type: rows[specialty]?.rateType || 'Per View',
      min_price: rows[specialty]?.min || 0,
      max_price: rows[specialty]?.max || 0,
    }));

    const { error } = await supabase
      .from('artist_rates')
      .upsert(payload, { onConflict: 'artist_id,specialty,rate_type' });

    if (error) {
      setStatus(error.message);
    } else {
      setStatus('Rates updated successfully.');
    }

    setSaving(false);
  };

  return (
    <Layout>
      <div className={styles.pageHeader}>
        <div className="container">
          <button className={styles.backButton} onClick={() => window.history.back()}>
            ← Back
          </button>
          <h1 className={styles.pageTitle}>Add Rate</h1>
          <p className={styles.pageDescription}>
            Set your pricing per specialty and rate type.
          </p>
        </div>
      </div>

      <section className={styles.section}>
        <div className="container">
          {status && <p className={styles.notice}>{status}</p>}
          <div className={styles.rateTable}>
            <div className={styles.rateHeader}>
              <span>Specialty</span>
              <span>Rate Type</span>
              <span>Min (INR)</span>
              <span>Max (INR)</span>
            </div>
            {specialties.map((specialty) => (
              <div key={specialty} className={styles.rateRow}>
                <span className={styles.rateSpecialty}>{specialty}</span>
                <select
                  className={styles.select}
                  value={rows[specialty]?.rateType || 'Per View'}
                  onChange={(e) => handleRateChange(specialty, 'rateType', e.target.value)}
                >
                  {RATE_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <input
                  className={styles.input}
                  type="number"
                  value={rows[specialty]?.min || 0}
                  onChange={(e) => handleRateChange(specialty, 'min', Number(e.target.value))}
                />
                <input
                  className={styles.input}
                  type="number"
                  value={rows[specialty]?.max || 0}
                  onChange={(e) => handleRateChange(specialty, 'max', Number(e.target.value))}
                />
              </div>
            ))}
            {specialties.length === 0 && <p>No specialties found. Update your profile first.</p>}
          </div>
          <button className={styles.cardButton} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Rates'}
          </button>
        </div>
      </section>
    </Layout>
  );
}
