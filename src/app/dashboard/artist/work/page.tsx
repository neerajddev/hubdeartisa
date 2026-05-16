'use client';

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout/Layout';
import { supabase } from '@/lib/supabase';
import { CldUploadWidget } from 'next-cloudinary';
import styles from './page.module.css';

export default function ArtistWorkPage() {
  const [artistId, setArtistId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    category: '',
    image_url: '',
    description: '',
  });
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadArtist = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) return;

      const { data } = await supabase
        .from('artist_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (data?.id) setArtistId(data.id);
    };

    loadArtist();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    setStatus(null);
  };

  const handleSave = async () => {
    if (!artistId) return;
    if (!form.title || !form.category || !form.image_url) {
      setStatus('Please add title, category, and image URL.');
      return;
    }

    setSaving(true);
    setStatus(null);

    const { error } = await supabase
      .from('artist_portfolio')
      .insert({
        artist_id: artistId,
        title: form.title,
        description: form.description || null,
        category: form.category,
        image_url: form.image_url,
      });

    if (error) {
      setStatus(error.message);
    } else {
      setStatus('Work added successfully.');
      setForm({ title: '', category: '', image_url: '', description: '' });
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
          <h1 className={styles.pageTitle}>Add Work</h1>
          <p className={styles.pageDescription}>Upload your work to appear on your artist profile.</p>
        </div>
      </div>

      <section className={styles.section}>
        <div className="container">
          {status && <p className={styles.notice}>{status}</p>}
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Title</label>
              <input className={styles.input} name="title" value={form.title} onChange={handleChange} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Category</label>
              <input className={styles.input} name="category" value={form.category} onChange={handleChange} />
            </div>
            <div className={styles.formGroupFull}>
              <label className={styles.label}>Upload Image</label>
              {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? (
                <CldUploadWidget
                  uploadPreset="de_artisa_uploads"
                  onSuccess={(result: any) => {
                    if (result.event === 'success') {
                      setForm({ ...form, image_url: result.info.secure_url });
                    }
                  }}
                >
                  {({ open }) => (
                    <div>
                      <button
                        type="button"
                        className={styles.uploadButton}
                        onClick={() => open()}
                      >
                        Choose Image
                      </button>
                      {form.image_url && (
                        <div className={styles.imagePreview}>
                          <img src={form.image_url} alt="Preview" />
                          <p className={styles.imageUrl}>{form.image_url}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CldUploadWidget>
              ) : (
                <button type="button" className={styles.uploadButton} disabled>
                  Choose Image (storage not configured)
                </button>
              )}
            </div>
            <div className={styles.formGroupFull}>
              <label className={styles.label}>Description</label>
              <textarea className={styles.textarea} name="description" value={form.description} onChange={handleChange} rows={3} />
            </div>
          </div>
          <button className={styles.cardButton} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Work'}
          </button>
        </div>
      </section>
    </Layout>
  );
}
