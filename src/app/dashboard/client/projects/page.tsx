'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout/Layout';
import { supabase } from '@/lib/supabase';
import { ROUTES } from '@/constants/brand';
import styles from './page.module.css';

type Project = {
  id: string;
  title: string;
  status: string;
  budget_min: number;
  budget_max: number;
  deadline: string | null;
  created_at: string;
};

export default function ClientProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) {
        setMessage('Please sign in to view your projects.');
        setLoading(false);
        return;
      }

      const { data: clientProfile, error: clientError } = await supabase
        .from('client_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (clientError || !clientProfile?.id) {
        setMessage('Please complete your client profile to manage projects.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('projects')
        .select('id, title, status, budget_min, budget_max, deadline, created_at')
        .eq('client_id', clientProfile.id)
        .order('created_at', { ascending: false });

      if (error) {
        setMessage(error.message);
      } else {
        setProjects(data || []);
      }
      setLoading(false);
    };

    loadProjects();
  }, []);

  const stats = [
    { label: 'Open Projects', value: projects.filter((p) => p.status === 'open').length },
    { label: 'Assigned', value: projects.filter((p) => p.status === 'assigned').length },
    { label: 'In Progress', value: projects.filter((p) => p.status === 'in_progress').length },
    { label: 'Completed', value: projects.filter((p) => p.status === 'completed').length },
  ];

  return (
    <Layout>
      <div className={styles.pageHeader}>
        <div className="container">
          <div className={styles.headerRow}>
            <div>
              <h1 className={styles.pageTitle}>Projects</h1>
              <p className={styles.pageDescription}>
                Manage briefs, compare quotes, and track delivery timelines.
              </p>
            </div>
            <Link href={ROUTES.newClientProject} className={styles.primaryButton}>
              Post Project
            </Link>
          </div>
        </div>
      </div>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.statsGrid}>
            {stats.map((stat) => (
              <div key={stat.label} className={styles.statCard}>
                <p className={styles.statLabel}>{stat.label}</p>
                <h3 className={styles.statValue}>{stat.value}</h3>
              </div>
            ))}
          </div>

          {message && <p className={styles.notice}>{message}</p>}

          {loading ? (
            <p className={styles.notice}>Loading projects...</p>
          ) : (
            <div className={styles.projectGrid}>
              {projects.length === 0 && (
                <div className={styles.emptyState}>
                  <h2>No projects yet</h2>
                  <p>Post your first brief to start receiving quotes.</p>
                  <Link href={ROUTES.newClientProject} className={styles.primaryButton}>
                    Post Project
                  </Link>
                </div>
              )}
              {projects.map((project) => (
                <article key={project.id} className={styles.projectCard}>
                  <div>
                    <p className={styles.projectStatus}>{project.status.replace('_', ' ')}</p>
                    <h3 className={styles.projectTitle}>{project.title}</h3>
                    <div className={styles.projectMeta}>
                      <span>Max Budget: ₹{project.budget_max}</span>
                      <span>Deadline: {project.deadline || 'Flexible'}</span>
                    </div>
                  </div>
                  <div className={styles.cardActions}>
                    <Link
                      href={ROUTES.clientProjectQuotes(project.id)}
                      className={styles.secondaryButton}
                    >
                      View Quotes
                    </Link>
                    <Link
                      href={ROUTES.clientProjectAgreement(project.id)}
                      className={styles.ghostButton}
                    >
                      Agreement
                    </Link>
                    <Link
                      href={ROUTES.clientProjectPayment(project.id)}
                      className={styles.ghostButton}
                    >
                      Payment
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
