import React from 'react';
import Layout from '@/components/Layout/Layout';
import Card from '@/components/Card/Card';
import Link from 'next/link';
import { ROUTES } from '@/constants/brand';
import styles from './page.module.css';

export default function GetStartedPage() {
  return (
    <Layout>
      <div className={styles.pageHeader}>
        <div className="container">
          <h1 className={styles.pageTitle}>Get Started</h1>
          <p className={styles.pageDescription}>
            Choose how you want to join De'Artisa Hub
          </p>
        </div>
      </div>

      <section className={styles.optionsSection}>
        <div className="container">
          <div className={styles.optionsGrid}>
            {/* Join as Client */}
            <Card variant="hover">
              <div className={styles.optionCard}>
                <div className={styles.optionIcon}>
                  <div className={styles.iconCircle}>C</div>
                </div>
                <h2 className={styles.optionTitle}>Join as a Client</h2>
                <p className={styles.optionDescription}>
                  I'm looking to hire talented 3D artists for my architectural visualization projects.
                </p>
                <ul className={styles.featureList}>
                  <li>Post project briefs</li>
                  <li>Receive competitive offers</li>
                  <li>Secure escrow payments</li>
                  <li>Collaborate seamlessly</li>
                  <li>Access global talent network</li>
                </ul>
                <Link href="/register/client" className={styles.optionButton}>
                  <button className={styles.btnPrimary}>Continue as Client</button>
                </Link>
              </div>
            </Card>

            {/* Join as Artist */}
            <Card variant="hover">
              <div className={styles.optionCard}>
                <div className={styles.optionIcon}>
                  <div className={styles.iconCircle}>A</div>
                </div>
                <h2 className={styles.optionTitle}>Join as a 3D Artist</h2>
                <p className={styles.optionDescription}>
                  I'm a 3D visualization professional ready to showcase my work and find great projects.
                </p>
                <ul className={styles.featureList}>
                  <li>Create your profile & portfolio</li>
                  <li>Receive project opportunities</li>
                  <li>Set your own rates</li>
                  <li>Work with global clients</li>
                  <li>Secure payment guarantee</li>
                </ul>
                <Link href="/register/artist" className={styles.optionButton}>
                  <button className={styles.btnPrimary}>Continue as Artist</button>
                </Link>
              </div>
            </Card>
          </div>

          <div className={styles.signInSection}>
            <p className={styles.signInText}>
              Already have an account?{' '}
              <Link href="/sign-in" className={styles.signInLink}>
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </section>

      <div className={styles.backBar}>
        <div className="container">
          <Link href={ROUTES.home} className={styles.backLink}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </Layout>
  );
}
