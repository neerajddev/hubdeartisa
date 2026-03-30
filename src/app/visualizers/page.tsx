'use client';

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout/Layout';
import Card from '@/components/Card/Card';
import Button from '@/components/Button/Button';
import Link from 'next/link';
import { ROUTES } from '@/constants/brand';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

export default function VisualizersPage() {
  const [artists, setArtists] = useState<Array<{
    id: string;
    full_name: string;
    state: string;
    country: string;
    experience: string;
    specialties: string[];
    thumbnails: Array<{ id: string; image_url: string; category: string }>;
    rateRange: { min: number; max: number } | null;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArtists = async () => {
      const { data } = await supabase
        .from('artist_profiles')
        .select('id, full_name, state, country, experience, specialties')
        .order('created_at', { ascending: false });

      const artistRows = data || [];
      const artistIds = artistRows.map((artist) => artist.id);

      const { data: portfolioRows } = artistIds.length
        ? await supabase
            .from('artist_portfolio')
            .select('id, artist_id, image_url, category')
            .in('artist_id', artistIds)
        : { data: [] };

      const { data: rateRows } = artistIds.length
        ? await supabase
            .from('artist_rates')
            .select('artist_id, min_price, max_price')
            .in('artist_id', artistIds)
        : { data: [] };

      const portfolioByArtist = new Map<string, Array<{ id: string; image_url: string; category: string }>>();
      (portfolioRows || []).forEach((row: any) => {
        const list = portfolioByArtist.get(row.artist_id) || [];
        list.push({ id: row.id, image_url: row.image_url, category: row.category });
        portfolioByArtist.set(row.artist_id, list);
      });

      const rateByArtist = new Map<string, { min: number; max: number }>();
      (rateRows || []).forEach((row: any) => {
        const current = rateByArtist.get(row.artist_id) || { min: Infinity, max: 0 };
        rateByArtist.set(row.artist_id, {
          min: Math.min(current.min, row.min_price || 0),
          max: Math.max(current.max, row.max_price || 0),
        });
      });

      const mapped = artistRows.map((artist) => {
        const rates = rateByArtist.get(artist.id);
        const range = rates && rates.min !== Infinity ? rates : null;
        return {
          ...artist,
          thumbnails: (portfolioByArtist.get(artist.id) || []).slice(0, 3),
          rateRange: range,
        };
      });

      setArtists(mapped);
      setLoading(false);
    };

    loadArtists();
  }, []);

  return (
    <Layout>
      <div className={styles.pageHeader}>
        <div className="container">
          <h1 className={styles.pageTitle}>Find 3D Artists</h1>
          <p className={styles.pageDescription}>
            Browse our global network of professional 3D artists. Save money and get exceptional results by finding the perfect artist for your project.
          </p>
        </div>
      </div>

      <section className={styles.visualizersSection}>
        <div className="container">
          {loading && (
            <p>Loading artists...</p>
          )}
          {!loading && artists.length === 0 && (
            <p>No artists yet. Please check back soon.</p>
          )}
          <div className={styles.visualizersGrid}>
            {artists.map((artist) => (
              <Card key={artist.id} variant="hover">
                <div className={styles.visualizerCard}>
                  <div className={styles.visualizerHeader}>
                    <div className={styles.visualizerAvatar}>
                      {artist.full_name.charAt(0)}
                    </div>
                    <div className={styles.visualizerInfo}>
                      <h3 className={styles.visualizerName}>{artist.full_name}</h3>
                      <p className={styles.visualizerLocation}>{artist.state}, {artist.country}</p>
                    </div>
                  </div>

                  <div className={styles.workThumbnails}>
                    {artist.thumbnails.length > 0 ? (
                      artist.thumbnails.map((thumb) => (
                        <div key={thumb.id} className={styles.thumbnail}>
                          <img src={thumb.image_url} alt={thumb.category || 'Portfolio'} />
                        </div>
                      ))
                    ) : (
                      <div className={styles.thumbnailPlaceholder}>
                        No work uploaded yet
                      </div>
                    )}
                  </div>

                  <div className={styles.experience}>
                    <span className={styles.expLabel}>Experience:</span>
                    <span className={styles.expValue}>{artist.experience}</span>
                  </div>

                  <div className={styles.servicesSection}>
                    <h4 className={styles.servicesTitle}>Services</h4>
                    <div className={styles.specialties}>
                      {artist.specialties.slice(0, 4).map((specialty, index) => (
                        <span key={index} className={styles.specialty}>
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <Link href={ROUTES.visualizerProfile(artist.id)}>
                      <Button variant="outline" fullWidth>View Profile</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <div className={styles.backBar}>
        <div className="container">
          <Link href={ROUTES.home} className={styles.backLink}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </Layout>
  );
}
