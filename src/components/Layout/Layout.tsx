import React from 'react';
import TopNav from '@/components/TopNav/TopNav';
import Footer from '@/components/Footer/Footer';
import styles from './Layout.module.css';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className={styles.layoutWrapper}>
      <TopNav />
      <div className={styles.mainWrapper}>
        <main className={styles.mainContent}>{children}</main>
        <Footer />
      </div>
    </div>
  );
}
