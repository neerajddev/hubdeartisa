'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants/brand';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import styles from './Header.module.css';

export default function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setRole(null); return; }
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => setRole(data?.role ?? null));
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push(ROUTES.home);
  };

  return (
    <header className={styles.header}>
      <div className="container">
        <div className={styles.headerContent}>
          <Link href={ROUTES.home} className={styles.logo}>
            <span className={styles.logoDeArtisa}>DeArtisa</span>
            <span className={styles.logoAccent}>&apos;</span>
            <span className={styles.logoHub}>Hub</span>
          </Link>

          <nav className={styles.nav}>
            <Link href={ROUTES.visualizers} className={styles.navLink}>
              Find Visualizers
            </Link>
          </nav>

          <div className={styles.actions}>
            {loading ? null : user ? (
              <>
                {role === 'artist' && (
                  <div className={styles.dropdown}>
                    <button className={styles.dropdownTrigger} type="button">
                      Manage Profile
                      <span className={styles.dropdownCaret} aria-hidden="true">▾</span>
                    </button>
                    <div className={styles.dropdownMenu}>
                      <Link href={ROUTES.artistPortfolio} className={styles.dropdownItem}>
                        Portfolio
                        <span className={styles.dropdownItemSub}>Manage images &amp; work</span>
                      </Link>
                      <Link href={ROUTES.artistSettings} className={styles.dropdownItem}>
                        Settings
                        <span className={styles.dropdownItemSub}>Bio, rates &amp; services</span>
                      </Link>
                    </div>
                  </div>
                )}
                <Link
                  href={role === 'artist' ? ROUTES.artistDashboard : ROUTES.clientDashboard}
                  className={styles.btnSecondary}
                >
                  Dashboard
                </Link>
                <button className={styles.btnPrimary} onClick={handleSignOut}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href={ROUTES.signIn} className={styles.btnSecondary}>
                  Sign In
                </Link>
                <Link href={ROUTES.getStarted} className={styles.btnPrimary}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
