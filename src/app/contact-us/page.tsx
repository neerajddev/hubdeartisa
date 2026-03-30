import React from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout/Layout';
import { ROUTES } from '@/constants/brand';
import styles from './page.module.css';

export default function ContactUsPage() {
  return (
    <Layout>
      <section className={styles.pageSection}>
        <div className="container">
          <h1 className={styles.pageTitle}>Contact Us</h1>
          <p className={styles.pageDescription}>
            Reach us for support, partnerships, or project guidance. We are here to help.
          </p>
          <Link href={ROUTES.home} className={styles.backLink}>
            ← Back to Home
          </Link>
        </div>
      </section>
    </Layout>
  );
}
