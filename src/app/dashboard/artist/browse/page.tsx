'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout/Layout';
import { supabase } from '@/lib/supabase';
import { ROUTES } from '@/constants/brand';
import styles from './page.module.css';

interface OpenProject {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  budget_max: number | null;
  deadline: string | null;
  created_at: string;
  client_profiles: { full_name: string | null }[] | null;
}

export default function ArtistBrowsePage() {
  const [projects, setProjects] = useState<OpenProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('projects')
        .select('id, title, description, category, budget_max, deadline, created_at, client_profiles(full_name)')
        .eq('status', 'open')
        .is('selected_artist_id', null)
        .order('created_at', { ascending: false });

      setProjects((data as OpenProject[]) || []);
      setLoading(false);
    };

    load();
  }, []);

  const stripMarkdown = (text: string) =>
    text.replace(/##[^\n]*/g, '').replace(/\*+/g, '').trim();

  return (
    <Layout>

      {/* ── PAGE HEADER ── */}
      <section className={styles.pageHeader}>
        <div className="container">
          <p className={styles.eyebrow}>Marketplace</p>
          <h1 className={styles.pageTitle}>Open Briefs</h1>
          <p className={styles.pageSubtitle}>
            Curated projects from verified clients. Review each brief and submit your quote.
          </p>
        </div>
      </section>

      {/* ── LEDGER ── */}
      <section className={styles.ledgerSection}>
        <div className="container">

          {/* Column Headers */}
          <div className={styles.ledgerHeader}>
            <span className={styles.colClient}>Client</span>
            <span className={styles.colBrief}>Project Brief</span>
            <span className={styles.colBudget}>Budget</span>
            <span className={styles.colDeadline}>Timeline</span>
            <span className={styles.colAction} />
          </div>

          {loading && <p className={styles.hint}>Loading briefs&hellip;</p>}

          {!loading && projects.length === 0 && (
            <p className={styles.emptyState}>
              No open briefs at the moment. Check back soon.
            </p>
          )}

          {projects.map((p) => {
            const preview = p.description
              ? stripMarkdown(p.description).slice(0, 130) + (p.description.length > 130 ? '…' : '')
              : null;
            return (
              <div key={p.id} className={styles.ledgerRow}>
                <span className={styles.colClient}>
                  {p.client_profiles?.[0]?.full_name ?? 'Client'}
                </span>

                <div className={styles.colBrief}>
                  <p className={styles.briefTitle}>{p.title}</p>
                  {preview && <p className={styles.briefPreview}>{preview}</p>}
                  {p.category && (
                    <span className={styles.categoryTag}>{p.category}</span>
                  )}
                </div>

                <span className={styles.colBudget}>
                  {p.budget_max ? `₹${p.budget_max.toLocaleString()}` : 'Open'}
                </span>

                <span className={styles.colDeadline}>
                  {p.deadline ?? 'Flexible'}
                </span>

                <span className={styles.colAction}>
                  <Link href={ROUTES.jobDetail(p.id)} className={styles.quoteBtn}>
                    View &amp; Quote
                  </Link>
                </span>
              </div>
            );
          })}

        </div>
      </section>

    </Layout>
  );
}
