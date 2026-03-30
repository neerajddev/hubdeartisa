import React from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout/Layout';
import { ROUTES } from '@/constants/brand';
import styles from './page.module.css';

export default function FaqsPage() {
  return (
    <Layout>
      <section className={styles.pageSection}>
        <div className="container">
          <h1 className={styles.pageTitle}>FAQs</h1>
          <p className={styles.pageDescription}>
            Common questions about hiring artists, project timelines, and secure payments.
          </p>
          <Link href={ROUTES.home} className={styles.backLink}>
            ← Back to Home
          </Link>
        </div>
      </section>
    </Layout>
  );
}
