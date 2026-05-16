import React from 'react';
import Layout from '@/components/Layout/Layout';
import styles from './page.module.css';

export default function AboutPage() {
  return (
    <Layout>
      <section className={styles.manifesto}>
        <div className="container">
          <div className={styles.inner}>
            <p className={styles.overline}>Our Origins</p>
            <h1 className={styles.heading}>
              Built by artists.<br />
              Engineered for scale.
            </h1>
            <div className={styles.divider} />
            <p className={styles.body}>
              We didn&apos;t start as a software company. We started in the trenches of 3D design.
              Since 2022, our core team has partnered with over 150 top interior designers and studios
              to deliver more than 2,500 premium visualizations.
            </p>
            <p className={styles.body}>
              We experienced the friction of traditional freelance work firsthand&mdash;scattered files,
              endless email chains, and mixed quality. De&apos;Artisa Hub is our solution. We built the
              exact infrastructure we always wished we had: a curated network of elite global talent,
              backed by a flawless project engine.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}

