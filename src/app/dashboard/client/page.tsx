'use client';

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout/Layout';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ROUTES } from '@/constants/brand';
import styles from './page.module.css';

interface Project {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

const STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export default function ClientDashboardPage() {
  const [name, setName] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) { setLoading(false); return; }

      const [{ data: profile }, { data: clientProfile }] = await Promise.all([
        supabase.from('client_profiles').select('full_name').eq('user_id', userId).single(),
        supabase.from('client_profiles').select('id').eq('user_id', userId).single(),
      ]);

      if (profile?.full_name) setName(profile.full_name);

      if (clientProfile?.id) {
        const { data: rows } = await supabase
          .from('projects')
          .select('id, title, status, created_at')
          .eq('client_id', clientProfile.id)
          .order('created_at', { ascending: false });

        setProjects(
          (rows || []).map((r) => ({
            id: r.id,
            name: r.title,
            status: r.status,
            createdAt: r.created_at,
          }))
        );
      }

      setLoading(false);
    };

    load();
  }, []);

  const filteredProjects = projects
    .filter((p) => activeFilter === 'all' || p.status === activeFilter)
    .filter((p) => !searchQuery.trim() || p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Layout>

      {/* HEADER */}
      <section className={styles.dashHeader}>
        <div className="container">
          <div className={styles.headerRow}>
            <div>
              <p className={styles.eyebrow}>Client Portal</p>
              <h1 className={styles.dashTitle}>
                {name ? `Welcome back, ${name.split(' ')[0]}.` : 'Your Projects.'}
              </h1>
            </div>
            <Link href={ROUTES.newClientProject} className={styles.newProjectBtn}>
              + Start New Project
            </Link>
          </div>
        </div>
      </section>

      {/* PROJECT LIST */}
      <section className={styles.listSection}>
        <div className="container">

          {loading && <p className={styles.hint}>Loading&hellip;</p>}

          {!loading && projects.length > 0 && (
            <div className={styles.filterRow}>
              <div className={styles.filterBar}>
                {['all', 'open', 'in_progress', 'completed'].map((f) => (
                  <button
                    key={f}
                    className={`${styles.filterBtn} ${activeFilter === f ? styles.filterBtnActive : ''}`}
                    onClick={() => setActiveFilter(f)}
                  >
                    {f === 'all' ? 'All' : STATUS_LABEL[f] ?? f}
                  </button>
                ))}
              </div>
              <div className={styles.searchWrap}>
                <svg className={styles.searchIcon} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <circle cx="8.5" cy="8.5" r="5.25" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search projects…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          )}

          {!loading && projects.length === 0 && (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>No projects yet.</p>
              <p className={styles.hint}>
                Start by creating a brief — our AI will help you scope it perfectly.
              </p>
            </div>
          )}

          {filteredProjects.length > 0 && (
            <ul className={styles.projectList}>
              {filteredProjects.map((project) => (
                <li key={project.id} className={styles.projectRow}>
                  <div className={styles.rowLeft}>
                    <span className={styles.projectName}>{project.name}</span>
                    <span className={styles.projectDate}>{formatDate(project.createdAt)}</span>
                  </div>
                  <div className={styles.rowMiddle}>
                    <span className={styles.projectStatus}>
                      {STATUS_LABEL[project.status] ?? project.status}
                    </span>
                  </div>
                  <div className={styles.rowRight}>
                    <Link
                      href={ROUTES.clientProjectWorkspace(project.id)}
                      className={styles.workspaceLink}
                    >
                      Enter Workspace →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}

        </div>
      </section>

    </Layout>
  );
}
