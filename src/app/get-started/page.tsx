import React from 'react';
import Layout from '@/components/Layout/Layout';
import Link from 'next/link';
import { ROUTES } from '@/constants/brand';
import styles from './page.module.css';

/* ── Icons ──────────────────────────────────────────────────────── */

const ArchIcon = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 38V26C6 15.507 13.163 7 22 7C30.837 7 38 15.507 38 26V38" stroke="#092B2F" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M6 38H38" stroke="#092B2F" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M13 38V28C13 20.268 17.029 14 22 14C26.971 14 31 20.268 31 28V38" stroke="#092B2F" strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.38" />
    <path d="M2 38H42" stroke="#092B2F" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const DiamondIcon = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 5L38 17L22 39L6 17L22 5Z" stroke="#092B2F" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M6 17H38" stroke="#092B2F" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M22 5L30 17L22 39" stroke="#092B2F" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.35" />
    <path d="M22 5L14 17L22 39" stroke="#092B2F" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.28" />
    <path d="M13 17L22 5L31 17" stroke="#092B2F" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.55" />
  </svg>
);

const CheckIcon = () => (
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="8.5" cy="8.5" r="7.5" stroke="#BDAD9D" strokeWidth="1" />
    <path d="M5.5 8.5L7.5 10.5L11.5 6.5" stroke="#BDAD9D" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Page ───────────────────────────────────────────────────────── */

export default function GetStartedPage() {
  return (
    <Layout>

      {/* PAGE HEADER */}
      <div className={styles.pageHeader}>
        <div className="container">
          <p className={styles.eyebrow}>Invitation Only Network</p>
          <h1 className={styles.pageTitle}>Where Precision Meets Prestige</h1>
          <p className={styles.pageDescription}>
            De&apos;Artisa Hub is built for those who refuse to compromise.
            Join a curated community of the world&apos;s finest architectural artists
            and visionary clients.
          </p>
        </div>
      </div>

      {/* CHOICE SECTION */}
      <section className={styles.choiceSection}>
        <div className="container">
          <div className={styles.cardsGrid}>

            {/* CLIENT CARD */}
            <div className={styles.glassCard}>
              <div className={styles.cardInner}>
                <div className={styles.iconWrap}>
                  <ArchIcon />
                </div>
                <p className={styles.cardEyebrow}>For Visionary Clients</p>
                <h2 className={styles.cardTitle}>Commission Excellence</h2>
                <p className={styles.cardDescription}>
                  Commission world-class 3D visualization for your most ambitious
                  architectural projects, backed by full escrow protection.
                </p>
                <ul className={styles.featureList}>
                  {[
                    "Post curated project briefs",
                    "Receive competitive proposals",
                    "Secure escrow payments",
                    "Seamless project collaboration",
                    "Access global talent network",
                  ].map((item) => (
                    <li key={item} className={styles.featureItem}>
                      <CheckIcon />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register/client" className={styles.cardCta}>
                  Begin as Client
                  <span className={styles.ctaArrow}>→</span>
                </Link>
              </div>
            </div>

            {/* ARTIST CARD */}
            <div className={styles.glassCard}>
              <div className={styles.cardInner}>
                <div className={styles.iconWrap}>
                  <DiamondIcon />
                </div>
                <p className={styles.cardEyebrow}>For Elite Artists</p>
                <h2 className={styles.cardTitle}>Define Your Legacy</h2>
                <p className={styles.cardDescription}>
                  Showcase your craft to the world&apos;s most discerning clients
                  and build a reputation that transcends borders.
                </p>
                <ul className={styles.featureList}>
                  {[
                    "Curated portfolio showcase",
                    "Receive exclusive opportunities",
                    "Command your own rates",
                    "Work with global visionaries",
                    "Guaranteed secure payments",
                  ].map((item) => (
                    <li key={item} className={styles.featureItem}>
                      <CheckIcon />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register/artist" className={styles.cardCta}>
                  Apply as Artist
                  <span className={styles.ctaArrow}>→</span>
                </Link>
              </div>
            </div>

          </div>

          <div className={styles.signInSection}>
            <p className={styles.signInText}>
              Already a member?{' '}
              <Link href="/sign-in" className={styles.signInLink}>Sign In</Link>
            </p>
          </div>
        </div>
      </section>

      <div className={styles.backBar}>
        <div className="container">
          <Link href={ROUTES.home} className={styles.backLink}>← Back to Home</Link>
        </div>
      </div>

    </Layout>
  );
}
