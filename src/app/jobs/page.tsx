'use client';

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout/Layout';
import Button from '@/components/Button/Button';
import { supabase } from '@/lib/supabase';
import { ROUTES } from '@/constants/brand';
import { stripInlineMarkdown } from '@/lib/richText';
import styles from './page.module.css';

// ── Parse AI-generated markdown brief (## Section\nbody) into sections ──
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

export default function JobsPage() {
  const [accessState, setAccessState] = useState<'checking' | 'allowed' | 'blocked'>('checking');
  const [accessMessage, setAccessMessage] = useState('Checking access...');
  const [projects, setProjects] = useState<Array<{
    id: string;
    title: string;
    description: string | null;
    budget_min: number;
    budget_max: number;
    deadline: string | null;
    created_at: string;
  }>>([]);

  useEffect(() => {
    const checkAccess = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;

      if (!userId) {
        setAccessState('blocked');
        setAccessMessage('Please sign in to view available jobs.');
        return;
      }

      const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (roleRow?.role !== 'artist') {
        setAccessState('blocked');
        setAccessMessage('Only 3D artists can view and quote on jobs.');
        return;
      }

      setAccessState('allowed');
    };

    checkAccess();
  }, []);

  useEffect(() => {
    if (accessState !== 'allowed') return;

    const loadProjects = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, description, budget_min, budget_max, deadline, created_at')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (!error) {
        setProjects(data || []);
      }
    };

    loadProjects();
  }, [accessState]);

  if (accessState === 'blocked') {
    return (
      <Layout>
        <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
          <h1>{accessMessage}</h1>
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <Button onClick={() => (window.location.href = ROUTES.signIn)}>Sign In</Button>
            <Button variant="outline" onClick={() => (window.location.href = ROUTES.home)}>
              Back Home
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.pageHeader}>
        <div className="container">
          <h1 className={styles.pageTitle}>Find 3D Work</h1>
          <p className={styles.pageDescription}>
            Browse client projects and submit your quote.
          </p>
        </div>
      </div>

      <section className={styles.section}>
        <div className="container">
          {projects.length === 0 ? (
            <div className={styles.emptyState}>
              <h2>No jobs yet</h2>
              <p>Client projects will appear here once they post briefs.</p>
              <Button variant="outline" onClick={() => (window.location.href = ROUTES.home)}>
                Back Home
              </Button>
            </div>
          ) : (
            <div className={styles.jobsList}>
              {projects.map((project) => {
                const sections = project.description ? parseSections(project.description) : [];
                const hasStructured = sections.length > 1;
                // Show first 2 sections in the listing view
                const previewSections = hasStructured ? sections.slice(0, 2) : [];

                return (
                  <article key={project.id} className={styles.jobEntry}>
                    {/* ── TOP ROW: eyebrow + budget ── */}
                    <div className={styles.entryTopRow}>
                      <span className={styles.entryEyebrow}>Open Brief</span>
                      <span className={styles.entryBudget}>
                        ₹{project.budget_min.toLocaleString()} – ₹{project.budget_max.toLocaleString()}
                      </span>
                    </div>

                    {/* ── MAIN ROW: content + sidebar ── */}
                    <div className={styles.entryBody}>
                      {/* Left: title + brief preview */}
                      <div className={styles.entryContent}>
                        <h2 className={styles.entryTitle}>{project.title}</h2>

                        {hasStructured ? (
                          previewSections.map((sec, i) => (
                            <div key={i} className={styles.entrySection}>
                              <p className={styles.entrySectionLabel}>{sec.title}</p>
                              <p className={styles.entrySectionBody}>
                                {(() => { const c = stripInlineMarkdown(sec.body); return c.length > 180 ? `${c.slice(0, 180)}…` : c; })()}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className={styles.entryDescription}>
                            {project.description
                              ? project.description.length > 240
                                ? `${project.description.slice(0, 240)}…`
                                : project.description
                              : 'No brief description provided.'}
                          </p>
                        )}
                      </div>

                      {/* Right: deadline + actions */}
                      <div className={styles.entrySidebar}>
                        <div className={styles.entryMeta}>
                          <p className={styles.entryMetaLabel}>Deadline</p>
                          <p className={styles.entryMetaValue}>{project.deadline || 'Flexible'}</p>
                        </div>
                        <div className={styles.entryMeta}>
                          <p className={styles.entryMetaLabel}>Posted</p>
                          <p className={styles.entryMetaValue}>
                            {new Date(project.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className={styles.entryActions}>
                          <Button
                            size="small"
                            onClick={() => (window.location.href = ROUTES.jobDetail(project.id))}
                          >
                            Submit Quote
                          </Button>
                          <Button
                            variant="outline"
                            size="small"
                            onClick={() => (window.location.href = ROUTES.jobDetail(project.id))}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
