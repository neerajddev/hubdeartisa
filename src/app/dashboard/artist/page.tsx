'use client';

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout/Layout';
import { supabase } from '@/lib/supabase';
import { ROUTES } from '@/constants/brand';
import styles from './page.module.css';

export default function ArtistDashboardPage() {
  const [name, setName] = useState('');
  const [artistId, setArtistId] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [jobSearch, setJobSearch] = useState('');
  const [activeJobs, setActiveJobs] = useState<Array<{
    id: string;
    title: string;
    status: string;
    progress: number;
    due: string;
    budget: string;
    client: string;
    accent: string;
  }>>([]);
  const [earningsSnapshot, setEarningsSnapshot] = useState({
    available: 0,
    escrow: 0,
    pending: 0,
  });

  const getJobStatusClass = (status: string) => {
    if (status === 'In Production') return styles.statusInProduction;
    if (status === 'Revision') return styles.statusReview;
    if (status === 'Pending Review') return styles.statusPending;
    if (status.toLowerCase() === 'completed') return styles.statusCompleted;
    return styles.statusActive;
  };

  const [portfolio, setPortfolio] = useState<Array<{
    id: string;
    title: string;
    description: string | null;
    category: string;
    image_url: string;
  }>>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) {
        setProfileLoaded(true);
        return;
      }

      const { data } = await supabase
        .from('artist_profiles')
        .select('id, full_name, state, country, experience, specialties, custom_specialty, languages, phone, bio, hourly_rate, min_rate, max_rate')
        .eq('user_id', userId)
        .single();

      if (data?.full_name) setName(data.full_name);
      if (data?.id) setArtistId(data.id);

      setProfileLoaded(true);
    };

    loadProfile();
  }, []);

  useEffect(() => {
    const loadDashboard = async () => {
      if (!artistId) return;

      const { data: assignedProjects } = await supabase
        .from('projects')
        .select('id, title, status, deadline, budget_min, budget_max, client_id')
        .eq('selected_artist_id', artistId)
        .order('created_at', { ascending: false });

      const clientIds = (assignedProjects || []).map((p: any) => p.client_id).filter(Boolean);
      const { data: clientRows } = clientIds.length
        ? await supabase
            .from('client_profiles')
            .select('id, full_name')
            .in('id', clientIds)
        : { data: [] };

      const clientMap = new Map<string, string>();
      (clientRows || []).forEach((row: any) => clientMap.set(row.id, row.full_name));

      const { data: paymentRows } = (assignedProjects || []).length
        ? await supabase
            .from('project_payments')
            .select('project_id, amount, status')
            .in('project_id', (assignedProjects || []).map((p: any) => p.id))
        : { data: [] };

      const paidTotal = (paymentRows || [])
        .filter((row: any) => row.status === 'paid')
        .reduce((sum: number, row: any) => sum + (row.amount || 0), 0);
      const escrowTotal = (paymentRows || [])
        .filter((row: any) => row.status === 'created')
        .reduce((sum: number, row: any) => sum + (row.amount || 0), 0);

      const completedCount = (assignedProjects || []).filter((p: any) => p.status === 'completed').length;
      const totalCount = (assignedProjects || []).length;

      const statusProgress: Record<string, number> = {
        assigned: 30,
        in_progress: 65,
        completed: 100,
      };

      const jobs = (assignedProjects || []).map((project: any) => ({
        id: project.id,
        title: project.title,
        status: project.status === 'assigned'
          ? 'In Production'
          : project.status === 'in_progress'
            ? 'In Production'
            : project.status === 'completed'
              ? 'Completed'
              : project.status.replace('_', ' '),
        progress: statusProgress[project.status] ?? 20,
        due: project.deadline || 'Flexible',
        budget: `₹${project.budget_max || 0}`,
        client: clientMap.get(project.client_id) || 'Client',
        accent: '',
      }));

      setActiveJobs(jobs);
      setEarningsSnapshot({
        available: paidTotal,
        escrow: escrowTotal,
        pending: 0,
      });
    };

    loadDashboard();
  }, [artistId]);

  const loadPortfolio = async () => {
      if (!artistId) return;
      const { data, error } = await supabase
        .from('artist_portfolio')
        .select('id, title, description, category, image_url')
        .eq('artist_id', artistId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error.message);
        return;
      }

      setPortfolio(data || []);
    };

  useEffect(() => {
    loadPortfolio();
  }, [artistId]);

  const filteredJobs = activeJobs
    .filter((j) => jobFilter === 'all' || j.status.toLowerCase() === jobFilter)
    .filter((j) => !jobSearch.trim() || j.title.toLowerCase().includes(jobSearch.toLowerCase()) || j.client.toLowerCase().includes(jobSearch.toLowerCase()));

  const handlePrev = () => {
    if (activeIndex === null || portfolio.length === 0) return;
    setActiveIndex((prev) => (prev === null ? null : (prev - 1 + portfolio.length) % portfolio.length));
  };

  const handleNext = () => {
    if (activeIndex === null || portfolio.length === 0) return;
    setActiveIndex((prev) => (prev === null ? null : (prev + 1) % portfolio.length));
  };

  return (
    <Layout>
      {/* ── STUDIO HEADER ── */}
      <header className={styles.pageHeader}>
        <div className="container">
          <p className={styles.eyebrow}>Artist Studio</p>
          <h1 className={styles.pageTitle}>
            {name ? `Welcome back, ${name}.` : 'Your Studio.'}
          </h1>
          <p className={styles.studioMeta}>
            {activeJobs.length} active {activeJobs.length === 1 ? 'brief' : 'briefs'}
            {earningsSnapshot.escrow > 0 && `\u00a0·\u00a0₹${earningsSnapshot.escrow} in escrow`}
            {earningsSnapshot.available > 0 && `\u00a0·\u00a0₹${earningsSnapshot.available} available`}
          </p>
        </div>
      </header>

      <section className={styles.section}>
        <div className="container">

          {/* ── WORK QUEUE ── */}
          <div className={styles.queueBlock}>
            <p className={styles.blockEyebrow}>Work Queue</p>
            <h2 className={styles.blockTitle}>Active Briefs</h2>

            {/* Filter + search row */}
            {activeJobs.length > 0 && (
              <div className={styles.filterRow}>
                <div className={styles.filterBar}>
                  {['all', 'active', 'completed'].map((f) => (
                    <button
                      key={f}
                      className={`${styles.filterBtn} ${jobFilter === f ? styles.filterBtnActive : ''}`}
                      onClick={() => setJobFilter(f)}
                    >
                      {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
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
                    placeholder="Search by brief or client…"
                    value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Table headers */}
            <div className={styles.tableHeaders}>
              <span className={styles.tableHeaderCell}>Client</span>
              <span className={styles.tableHeaderCell}>Brief</span>
              <span className={styles.tableHeaderCell}>Status</span>
              <span className={styles.tableHeaderCell} />
            </div>

            {filteredJobs.length === 0 ? (
              <p className={styles.emptyState}>No projects match this filter.</p>
            ) : (
              <div className={styles.jobList}>
                {filteredJobs.map((job) => (
                  <div key={job.id} className={styles.jobRow}>
                    <p className={styles.jobClient}>{job.client}</p>
                    <p className={styles.jobTitle}>{job.title}</p>
                    <p className={`${styles.jobStatus} ${getJobStatusClass(job.status)}`}>
                      {job.status}
                    </p>
                    <button
                      className={styles.workspaceBtn}
                      onClick={() => (window.location.href = ROUTES.artistJobWorkspace(job.id))}
                    >
                      Enter Workspace &rarr;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <hr className={styles.divider} />

          {/* ── PORTFOLIO GALLERY ── */}
          <div className={styles.portfolioBlock}>
            <p className={styles.blockEyebrow}>Portfolio</p>
            <h2 className={styles.blockTitle}>Exhibition</h2>

            {portfolio.length === 0 ? (
              <p className={styles.emptyState}>No work in your portfolio yet.</p>
            ) : (
              <div className={styles.galleryGrid}>
                {portfolio.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={styles.galleryItem}
                    onClick={() => setActiveIndex(portfolio.findIndex((p) => p.id === item.id))}
                  >
                    <img src={item.image_url} alt={item.title} />
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ── LIGHTBOX ── */}
      {activeIndex !== null && portfolio[activeIndex] && (
        <div className={styles.lightbox} onClick={() => setActiveIndex(null)}>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.lightboxClose} onClick={() => setActiveIndex(null)}>
              ×
            </button>
            <button className={styles.lightboxNavLeft} onClick={handlePrev}>
              ‹
            </button>
            <img
              src={portfolio[activeIndex].image_url}
              alt="Work preview"
              className={styles.lightboxImage}
            />
            <button className={styles.lightboxNavRight} onClick={handleNext}>
              ›
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
