'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout/Layout';
import Button from '@/components/Button/Button';
import { supabase } from '@/lib/supabase';
import { ROUTES } from '@/constants/brand';
import styles from './page.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    try {
      const redirectTo = `${window.location.origin}${ROUTES.resetPassword}`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (resetError) throw resetError;
      setNotice('Check your email for a password reset link.');
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Unable to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className={styles.pageHeader}>
        <div className="container">
          <h1 className={styles.pageTitle}>Forgot Password</h1>
          <p className={styles.pageDescription}>
            Enter your email and we’ll send a reset link.
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
                <label htmlFor="email" className={styles.label}>
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formActions}>
                <Button type="submit" size="large" fullWidth disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </div>

              <div className={styles.formFooter}>
                <p className={styles.footerText}>
                  Remembered your password?{' '}
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
