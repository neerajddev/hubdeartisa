'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout/Layout';
import Button from '@/components/Button/Button';
import { supabase } from '@/lib/supabase';
import { ROUTES } from '@/constants/brand';
import styles from './page.module.css';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSessionReady(!!data.session);
    };
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionReady(!!session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!sessionReady) {
      setError('Reset link is invalid or expired. Please request a new reset link.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setNotice('Password updated successfully. Redirecting to sign in...');
      setTimeout(() => router.push(ROUTES.signIn), 1200);
    } catch (err: any) {
      setError(err.message || 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className={styles.pageHeader}>
        <div className="container">
          <h1 className={styles.pageTitle}>Reset Password</h1>
          <p className={styles.pageDescription}>
            Create a new password for your account.
          </p>
        </div>
      </div>

      <section className={styles.formSection}>
        <div className="container">
          <div className={styles.formContainer}>
            <form onSubmit={handleSubmit} className={styles.form}>
              {error && <div className={styles.errorMessage}>{error}</div>}
              {notice && <div className={styles.notice}>{notice}</div>}

              <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.label}>
                  New Password *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword" className={styles.label}>
                  Confirm Password *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formActions}>
                <Button type="submit" size="large" fullWidth disabled={loading}>
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
              </div>

              <div className={styles.formFooter}>
                <p className={styles.footerText}>
                  Back to{' '}
                  <Link href={ROUTES.signIn} className={styles.footerLink}>
                    Sign in
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
