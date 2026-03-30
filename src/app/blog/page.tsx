import React from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout/Layout';
import { ROUTES } from '@/constants/brand';
import styles from './page.module.css';

export default function BlogPage() {
  return (
    <Layout>
      <section className={styles.pageSection}>
        <div className="container">
          <h1 className={styles.pageTitle}>Blog</h1>
          <p className={styles.pageDescription}>
            Insights, tips, and trends in architectural visualization and 3D rendering.
          </p>
          <Link href={ROUTES.home} className={styles.backLink}>
            ← Back to Home
          </Link>
        </div>
      </section>
    </Layout>
  );
}
