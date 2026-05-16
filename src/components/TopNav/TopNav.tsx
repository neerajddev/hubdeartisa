'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ROUTES } from '@/constants/brand';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import styles from './TopNav.module.css';

const PUBLIC_NAV_LINKS = [
  { label: 'Browse Artists', href: ROUTES.visualizers },
  { label: 'Blog', href: ROUTES.blog },
];

const AUTH_NAV_LINKS = [
  { label: 'Browse Artists', href: ROUTES.visualizers },
];

// ── Reusable dropdown ─────────────────────────────────────────────
function NavDropdown({ label, items }: {
  label: string;
  items: { href: string; title: string; sub: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className={styles.dropdown} ref={ref}>
      <button
        type="button"
        className={styles.dropdownTrigger}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {label}
        <span className={`${styles.dropdownCaret} ${open ? styles.dropdownCaretOpen : ''}`}>
          ▾
        </span>
      </button>

      {open && (
        <div className={styles.dropdownMenu} role="menu">
          {items.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.dropdownItem} ${i === items.length - 1 ? styles.dropdownItemLast : ''}`}
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              <span className={styles.dropdownItemTitle}>{item.title}</span>
              <span className={styles.dropdownItemSub}>{item.sub}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setUserRole(null); return; }
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => setUserRole(data?.role ?? null));
  }, [user]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push(ROUTES.home);
    router.refresh();
  }

  const artistMenuItems = [
    { href: ROUTES.artistPortfolio, title: 'Portfolio Gallery', sub: 'Manage images & work samples' },
    { href: ROUTES.artistSettings,  title: 'Profile Settings',  sub: 'Bio, rates & services' },
  ];

  const clientMenuItems = [
    { href: '/dashboard/client/settings', title: 'Account Settings', sub: 'Name, company & contact' },
  ];

  return (
    <header className={`glass-header ${styles.topNav}`}>
      <div className={styles.inner}>

        {/* Left — Logo */}
        <Link href={ROUTES.home} className={styles.logo}>
          De<span className={styles.logoApostrophe}>&apos;</span>Artisa{' '}
          <span className={styles.logoHub}>Hub</span>
        </Link>

        {/* Center — Site Nav Links */}
        <nav className={styles.navLinks} aria-label="Main navigation">
          {(user ? AUTH_NAV_LINKS : PUBLIC_NAV_LINKS).map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={`${styles.navLink} ${pathname === href ? styles.navLinkActive : ''}`}
            >
              {label}
            </Link>
          ))}
          {userRole === 'artist' && (
            <Link
              href={ROUTES.artistBrowse}
              className={`${styles.navLink} ${pathname === ROUTES.artistBrowse ? styles.navLinkActive : ''}`}
            >
              Find Work
            </Link>
          )}
        </nav>

        {/* Right — Auth Actions */}
        <div className={styles.actions}>
          {!loading && (
            user ? (
              <>
                {userRole === 'artist' && (
                  <NavDropdown label="Manage Profile" items={artistMenuItems} />
                )}
                {userRole === 'client' && (
                  <NavDropdown label="Firm Settings" items={clientMenuItems} />
                )}
                <Link href={ROUTES.dashboard} className={styles.dashboardLink}>
                  Dashboard
                </Link>
                <button className={styles.signOutBtn} onClick={handleSignOut}>
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link href={ROUTES.signIn} className={styles.signInLink}>
                  Sign In
                </Link>
                <Link href="/register/artist" className={styles.applyBtn}>
                  Apply as Artist
                </Link>
              </>
            )
          )}
        </div>

      </div>
    </header>
  );
}
