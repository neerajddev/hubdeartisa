'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout/Layout';
import Button from '@/components/Button/Button';
import { ROUTES } from '@/constants/brand';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

export default function VisualizerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const visualizerId = params.id as string;
  const [role, setRole] = useState<'client' | 'artist' | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [visualizer, setVisualizer] = useState<{
    id: string;
    full_name: string;
    state: string;
    country: string;
    experience: string;
    specialties: string[];
    languages: string;
    bio: string;
    hourly_rate: number;
    min_rate: number;
    max_rate: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<Array<{
    id: string;
    title: string;
    description: string | null;
    category: string;
    image_url: string;
  }>>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [rates, setRates] = useState<Array<{
    id: string;
    specialty: string;
    rate_type: string;
    min_price: number;
    max_price: number;
  }>>([]);

  useEffect(() => {
    const loadRole = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      setIsAuthenticated(!!userId);

      if (!userId) {
        setRole(null);
        return;
      }

      const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      setRole((roleRow?.role as 'client' | 'artist') || null);
    };

    loadRole();
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      const { data } = await supabase
        .from('artist_profiles')
        .select('id, full_name, state, country, experience, specialties, languages, bio, hourly_rate, min_rate, max_rate')
        .eq('id', visualizerId)
        .single();

      setVisualizer(data || null);
      setLoading(false);

      if (data?.id) {
        const { data: portfolioData } = await supabase
          .from('artist_portfolio')
          .select('id, title, description, category, image_url')
          .eq('artist_id', data.id)
          .order('created_at', { ascending: false });

        setPortfolio(portfolioData || []);

        const { data: rateData } = await supabase
          .from('artist_rates')
          .select('id, specialty, rate_type, min_price, max_price')
          .eq('artist_id', data.id)
          .order('specialty', { ascending: true });

        setRates(rateData || []);
      }
    };

    loadProfile();
  }, [visualizerId]);
  
  if (!visualizer && !loading) {
    return (
      <Layout>
        <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
          <h1>Visualizer not found</h1>
        </div>
      </Layout>
    );
  }

  const handleHire = () => {
    if (!visualizer) {
      return;
    }

    if (!isAuthenticated) {
      alert('Please sign in to assign work to a 3D artist.');
      router.push(ROUTES.signIn);
      return;
    }

    if (role !== 'client') {
      alert('Only clients can assign work to 3D artists.');
      return;
    }

    router.push(ROUTES.hire(visualizer.id));
  };

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

      {/* EDITORIAL HEADER */}
      <section className={styles.profileHeader}>
        <div className="container">
          {loading ? (
            <p className={styles.loadingText}>Loading&hellip;</p>
          ) : (
            <div className={styles.headerInner}>
              <div className={styles.headerLeft}>
                <div className={styles.avatarSmall}>
                  {visualizer?.full_name.charAt(0)}
                </div>
                <div>
                  <p className={styles.headerEyebrow}>3D Artist</p>
                  <h1 className={styles.name}>{visualizer?.full_name}</h1>
                  <p className={styles.headerMeta}>
                    {visualizer?.state}, {visualizer?.country}&ensp;&middot;&ensp;{visualizer?.experience}
                  </p>
                </div>
              </div>
              {role !== 'artist' && (
                <div className={styles.headerCta}>
                  <Button size="large" onClick={handleHire}>Hire Now</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* BIO & DETAILS */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionBody}>
            {visualizer?.bio && (
              <p className={styles.bio}>{visualizer.bio}</p>
            )}
            <div className={styles.metaRow}>
              <div className={styles.metaBlock}>
                <p className={styles.metaLabel}>Specialties</p>
                <p className={styles.metaValue}>
                  {visualizer?.specialties?.join(', ') || '—'}
                </p>
              </div>
              <div className={styles.metaBlock}>
                <p className={styles.metaLabel}>Languages</p>
                <p className={styles.metaValue}>{visualizer?.languages || 'English'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PORTFOLIO GRID */}
      <section className={styles.section}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Work</h2>
          {portfolio.length === 0 && (
            <p className={styles.emptyText}>No work uploaded yet.</p>
          )}
          <div className={styles.portfolioGrid}>
            {portfolio.map((item, i) => (
              <button
                key={item.id}
                type="button"
                className={styles.portfolioItem}
                onClick={() => setActiveIndex(i)}
                aria-label={`View ${item.title}`}
              >
                <img
                  src={item.image_url}
                  alt={item.title}
                  className={styles.portfolioImg}
                />
                {item.category && (
                  <span className={styles.portfolioCategory}>{item.category}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING MENU */}
      {rates.length > 0 && (
        <section className={styles.section}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Pricing</h2>
            <div className={styles.ratesMenu}>
              {rates.map((rate) => (
                <div key={rate.id} className={styles.rateRow}>
                  <span className={styles.rateService}>{rate.specialty}</span>
                  <span className={styles.rateType}>{rate.rate_type}</span>
                  <span className={styles.ratePrice}>${rate.min_price.toLocaleString()} &ndash; ${rate.max_price.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* LIGHTBOX */}
      {activeIndex !== null && portfolio[activeIndex] && (
        <div className={styles.lightbox} onClick={() => setActiveIndex(null)}>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.lightboxClose} onClick={() => setActiveIndex(null)}>×</button>
            <button className={styles.lightboxNavLeft} onClick={handlePrev}>‹</button>
            <img
              src={portfolio[activeIndex].image_url}
              alt="Work preview"
              className={styles.lightboxImage}
            />
            <button className={styles.lightboxNavRight} onClick={handleNext}>›</button>
          </div>
        </div>
      )}

    </Layout>
  );
}
