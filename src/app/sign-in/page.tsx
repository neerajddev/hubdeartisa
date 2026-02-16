'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout/Layout';
import Button from '@/components/Button/Button';
import Link from 'next/link';
import { ROUTES } from '@/constants/brand';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

type PendingRegistration = {
  role: 'client' | 'artist';
  profile: Record<string, any>;
};

export default function SignInPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
  };

  const finalizePendingRegistration = async (userId: string) => {
    const pendingRaw = localStorage.getItem('pendingRegistration');
    if (!pendingRaw) return;

    let pending: PendingRegistration | null = null;
    try {
      pending = JSON.parse(pendingRaw) as PendingRegistration;
    } catch {
      localStorage.removeItem('pendingRegistration');
      return;
    }

    if (!pending?.role || !pending.profile) {
      localStorage.removeItem('pendingRegistration');
      return;
    }

    if (pending.role === 'client') {
      const { data: existingClient } = await supabase
        .from('client_profiles')
        .select('id')
        .eq('user_id', userId);

      if (!existingClient || existingClient.length === 0) {
        const { error: profileError } = await supabase
          .from('client_profiles')
          .insert({
            user_id: userId,
            full_name: pending.profile.full_name,
            email: pending.profile.email,
            state: pending.profile.state,
            country: pending.profile.country,
            phone: pending.profile.phone || null,
          });

        if (profileError) throw profileError;
      }
    }

    if (pending.role === 'artist') {
      const { data: existingArtist } = await supabase
        .from('artist_profiles')
        .select('id')
        .eq('user_id', userId);

      if (!existingArtist || existingArtist.length === 0) {
        const { error: profileError } = await supabase
          .from('artist_profiles')
          .insert({
            user_id: userId,
            full_name: pending.profile.full_name,
            email: pending.profile.email,
            state: pending.profile.state,
            country: pending.profile.country,
            experience: pending.profile.experience,
            specialties: pending.profile.specialties,
            custom_specialty: pending.profile.custom_specialty || null,
            languages: pending.profile.languages,
            phone: pending.profile.phone || null,
            bio: pending.profile.bio,
          });

        if (profileError) throw profileError;
      }
    }

    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId);

    if (!existingRole || existingRole.length === 0) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: pending.role,
        });

      if (roleError) throw roleError;
    }

    localStorage.removeItem('pendingRegistration');
  };

  const getUserRole = async (userId: string) => {
    const { data: roleRow } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    return roleRow?.role as 'client' | 'artist' | undefined;
  };

  const inferAndCreateRole = async (userId: string) => {
    const { data: clientProfile } = await supabase
      .from('client_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (clientProfile?.id) {
      await supabase.from('user_roles').insert({ user_id: userId, role: 'client' });
      return 'client' as const;
    }

    const { data: artistProfile } = await supabase
      .from('artist_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (artistProfile?.id) {
      await supabase.from('user_roles').insert({ user_id: userId, role: 'artist' });
      return 'artist' as const;
    }

    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;
      if (!data.user) throw new Error('Sign in failed');

      await finalizePendingRegistration(data.user.id);
      let role = await getUserRole(data.user.id);
      if (!role) {
        role = await inferAndCreateRole(data.user.id);
      }
      if (role === 'client') {
        router.push(ROUTES.clientDashboard);
        return;
      }
      if (role === 'artist') {
        router.push(ROUTES.artistDashboard);
        return;
      }
      router.push(ROUTES.dashboard);
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className={styles.pageHeader}>
        <div className="container">
          <h1 className={styles.pageTitle}>Sign In</h1>
          <p className={styles.pageDescription}>
            Access your De'Artisa Hub account
          </p>
        </div>
      </div>

      <section className={styles.formSection}>
        <div className="container">
          <div className={styles.formContainer}>
            <form onSubmit={handleSubmit} className={styles.form}>
              {error && (
                <div className={styles.errorMessage}>
                  {error}
                </div>
              )}

              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.label}>
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
                <div className={styles.formFooter}>
                  <Link href={ROUTES.forgotPassword} className={styles.footerLink}>
                    Forgot password?
                  </Link>
                </div>
              </div>

              <div className={styles.formActions}>
                <Button type="submit" size="large" fullWidth disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </div>

              <div className={styles.formFooter}>
                <p className={styles.footerText}>
                  Don’t have an account?{' '}
                  <Link href={ROUTES.getStarted} className={styles.footerLink}>
                    Get Started
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
}
