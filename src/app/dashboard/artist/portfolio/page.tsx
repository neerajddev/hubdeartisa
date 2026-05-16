'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Layout from '@/components/Layout/Layout';
import { supabase } from '@/lib/supabase';
import { CldUploadWidget } from 'next-cloudinary';
import styles from './page.module.css';

interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  image_url: string;
  description: string | null;
}

export default function ArtistPortfolioPage() {
  const [artistId, setArtistId] = useState<string | null>(null);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadPortfolio = useCallback(async (id: string) => {
    const { data } = await supabase
      .from('artist_portfolio')
      .select('id, title, category, image_url, description')
      .eq('artist_id', id)
      .order('created_at', { ascending: false });
    setItems(data || []);
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) { setLoading(false); return; }

      const { data } = await supabase
        .from('artist_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (data?.id) {
        setArtistId(data.id);
        await loadPortfolio(data.id);
      }
      setLoading(false);
    };

    init();
  }, [loadPortfolio]);

  const handleUploadSuccess = useCallback(async (result: any) => {
    if (!artistId) return;
    setUploading(true);
    setNotice(null);

    // next-cloudinary v6 onSuccess: result has { event: 'success', info: {...} }
    // fall back to result directly in case the widget passes info without wrapper
    const info = result?.info ?? result;
    const imageUrl: string = info.secure_url;
    const originalFilename: string = info.original_filename || 'Untitled';
    const title = originalFilename.replace(/[-_]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

    if (!imageUrl) {
      setNotice({ type: 'error', text: 'Upload succeeded but image URL was missing.' });
      setUploading(false);
      return;
    }

    const { error } = await supabase.from('artist_portfolio').insert({
      artist_id: artistId,
      title,
      category: 'Visualization',
      image_url: imageUrl,
      description: null,
    });

    if (error) {
      setNotice({ type: 'error', text: error.message });
    } else {
      setNotice({ type: 'success', text: 'Work added to your exhibition.' });
      await loadPortfolio(artistId);
    }
    setUploading(false);
  }, [artistId, loadPortfolio]);

  const handleDelete = async (itemId: string) => {
    if (!artistId) return;
    setDeletingId(itemId);
    const { error } = await supabase.from('artist_portfolio').delete().eq('id', itemId);
    if (error) {
      setNotice({ type: 'error', text: error.message });
    } else {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    }
    setDeletingId(null);
  };

  return (
    <Layout>

      {/* ── PAGE HEADER ── */}
      <header className={styles.pageHeader}>
        <div className="container">
          <button className={styles.backLink} onClick={() => window.history.back()}>← Studio</button>
          <p className={styles.eyebrow}>Artist Studio</p>
          <h1 className={styles.pageTitle}>Manage Exhibition</h1>
          <p className={styles.pageSubtitle}>
            Curate the masterpieces that appear on your public profile. Keep it focused — your best work only.
          </p>
        </div>
      </header>

      <section className={styles.section}>
        <div className="container">

          {notice && (
            <p className={notice.type === 'success' ? styles.noticeSuccess : styles.noticeError}>
              {notice.text}
            </p>
          )}

          {/* ── UPLOAD ZONE ── */}
          <div className={styles.uploadZone}>
            <div className={styles.uploadInner}>
              <svg className={styles.uploadIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M12 16V8m0 0L9 11m3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 16.5V18a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p className={styles.uploadLabel}>Drop a masterpiece here</p>
              <p className={styles.uploadHint}>JPEG, PNG, WEBP · Max 10 MB</p>

              {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? (
                <CldUploadWidget
                  uploadPreset="de_artisa_uploads"
                  options={{
                    sources: ['local', 'url'],
                    resourceType: 'image',
                    clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
                    maxFileSize: 10485760,
                    multiple: false,
                  }}
                  onSuccess={handleUploadSuccess}
                >
                  {({ open }) => (
                    <button
                      type="button"
                      className={styles.uploadBtn}
                      onClick={() => open()}
                      disabled={uploading || !artistId}
                    >
                      {uploading ? 'Saving…' : 'Upload Image'}
                    </button>
                  )}
                </CldUploadWidget>
              ) : (
                <button type="button" className={styles.uploadBtn} disabled>
                  Cloudinary not configured
                </button>
              )}
            </div>
          </div>

          {/* ── PORTFOLIO GRID ── */}
          {loading ? (
            <p className={styles.hint}>Loading exhibition&hellip;</p>
          ) : items.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>Your exhibition is empty.</p>
              <p className={styles.hint}>Upload your first piece above to get started.</p>
            </div>
          ) : (
            <>
              <p className={styles.gridEyebrow}>{items.length} {items.length === 1 ? 'piece' : 'pieces'} in your exhibition</p>
              <div className={styles.grid}>
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={styles.gridItem}
                    onMouseEnter={() => setHoveredId(item.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <img src={item.image_url} alt={item.title} className={styles.gridImg} />

                    {/* Hover overlay */}
                    <div className={`${styles.overlay} ${hoveredId === item.id ? styles.overlayVisible : ''}`}>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        aria-label={`Delete ${item.title}`}
                      >
                        {deletingId === item.id ? (
                          <span className={styles.deletingDot} />
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18" aria-hidden>
                            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        )}
                      </button>
                      <p className={styles.overlayTitle}>{item.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      </section>

    </Layout>
  );
}
