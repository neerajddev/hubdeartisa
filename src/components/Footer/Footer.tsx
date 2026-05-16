import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';
import { ROUTES } from '@/constants/brand';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerContent}>

          {/* Col 1 — Brand */}
          <div className={styles.footerSection}>
            <div className={styles.logo}>
              <span className={styles.logoDeArtisa}>De&apos;Artisa</span>
              <span className={styles.logoHub}>&nbsp;Hub</span>
            </div>
            <p className={styles.tagline}>
              Where architectural vision meets elite 3D artistry. Curated talent for the world&apos;s most discerning studios.
            </p>
          </div>

          {/* Col 2 — Platform */}
          <div className={styles.footerSection}>
            <h4 className={styles.footerTitle}>Platform</h4>
            <nav className={styles.footerNav}>
              <Link href={ROUTES.visualizers} className={styles.footerLink}>Browse Artists</Link>
              <Link href={ROUTES.howItWorks} className={styles.footerLink}>How It Works</Link>
              <Link href={ROUTES.jobs} className={styles.footerLink}>Open Briefs</Link>
            </nav>
          </div>

          {/* Col 3 — Company */}
          <div className={styles.footerSection}>
            <h4 className={styles.footerTitle}>Company</h4>
            <nav className={styles.footerNav}>
              <Link href={ROUTES.about} className={styles.footerLink}>About Us</Link>
              <Link href={ROUTES.blog} className={styles.footerLink}>Editorial Blog</Link>
              <Link href={ROUTES.contactUs} className={styles.footerLink}>Contact</Link>
            </nav>
          </div>

          {/* Col 4 — Legal */}
          <div className={styles.footerSection}>
            <h4 className={styles.footerTitle}>Legal</h4>
            <nav className={styles.footerNav}>
              <a href="#" className={styles.footerLink}>Privacy Policy</a>
              <a href="#" className={styles.footerLink}>Terms of Service</a>
            </nav>
          </div>

        </div>

        <div className={styles.footerBottom}>
          <p className={styles.copyright}>
            &copy; {currentYear} De&apos;Artisa Hub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

