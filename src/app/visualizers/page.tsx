'use client';

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout/Layout';
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

      const portfolioByArtist = new Map<string, Array<{ id: string; image_url: string; category: string }>>();
      (portfolioRows || []).forEach((row: any) => {
        const list = portfolioByArtist.get(row.artist_id) || [];
        list.push({ id: row.id, image_url: row.image_url, category: row.category });
        portfolioByArtist.set(row.artist_id, list);
      });

      const mapped = artistRows
        .map((artist) => ({
          ...artist,
          thumbnails: (portfolioByArtist.get(artist.id) || []).slice(0, 1),
        }))
        .filter((artist) => artist.thumbnails.length > 0);

      setArtists(mapped);
      setLoading(false);
    };

    loadArtists();
  }, []);

  return (
    <Layout>
      <div className={styles.pageHeader}>
        <div className="container">
          <p className={styles.pageEyebrow}>Curated Network</p>
          <h1 className={styles.pageTitle}>The Artists</h1>
          <p className={styles.pageDescription}>
            Top-10% talent. Reviewed, verified, exceptional.
          </p>
        </div>
      </div>

      <section className={styles.visualizersSection}>
        <div className="container">
          {loading && (
            <p className={styles.stateText}>Loading&hellip;</p>
          )}
          {!loading && artists.length === 0 && (
            <p className={styles.stateText}>No artists yet. Check back soon.</p>
          )}
          <div className={styles.visualizersGrid}>
            {artists.map((artist) => (
              <Link
                key={artist.id}
                href={ROUTES.visualizerProfile(artist.id)}
                className={styles.artistCard}
              >
                <div className={styles.artistHero}>
                  <img
                    src={artist.thumbnails[0].image_url}
                    alt={artist.full_name}
                    className={styles.artistHeroImg}
                  />
                </div>
                <div className={styles.artistBody}>
                  <h3 className={styles.artistName}>{artist.full_name}</h3>
                  <p className={styles.artistMeta}>
                    {artist.state}, {artist.country}&ensp;&middot;&ensp;{artist.experience}
                  </p>
                  {artist.specialties.length > 0 && (
                    <p className={styles.artistServices}>
                      {artist.specialties.slice(0, 3).join(', ')}
                    </p>
                  )}
                  <span className={styles.portfolioLink}>View Portfolio &rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}

