'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants/brand';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

// ── Inline style constants ─────────────────────────────────────────
const S = {
  header: {
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
    borderBottom: '1px solid #EDE9E3',
    backdropFilter: 'blur(14px)',
    backgroundColor: 'rgba(245,243,239,0.92)',
    height: 64,
    display: 'flex',
    alignItems: 'center',
  } as React.CSSProperties,

  inner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 1.5rem',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1.5rem',
  } as React.CSSProperties,

  logo: {
    fontFamily: "'Montserrat', sans-serif",
    fontSize: '1.6rem',
    fontWeight: 700,
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    letterSpacing: '-0.02em',
  } as React.CSSProperties,

  logoMain: { color: '#092B2F' } as React.CSSProperties,
  logoAccent: { color: '#BDAD9D' } as React.CSSProperties,

  nav: { display: 'flex', gap: '1.5rem', alignItems: 'center' } as React.CSSProperties,

  navLink: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 400,
    fontSize: '0.9rem',
    color: '#092B2F',
    textDecoration: 'none',
  } as React.CSSProperties,

  actions: { display: 'flex', gap: '0.75rem', alignItems: 'center' } as React.CSSProperties,

  btnPrimary: {
    background: '#092B2F',
    color: '#F5F3EF',
    border: '1px solid #092B2F',
    borderRadius: 999,
    padding: '0.6rem 1.25rem',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
  } as React.CSSProperties,

  btnOutline: {
    background: 'transparent',
    color: '#092B2F',
    border: '1px solid #E4E0D8',
    borderRadius: 999,
    padding: '0.6rem 1.25rem',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
  } as React.CSSProperties,

  dropdownWrap: { position: 'relative' as const } as React.CSSProperties,

  dropdownTrigger: {
    background: 'transparent',
    color: '#092B2F',
    border: '1px solid #E4E0D8',
    borderRadius: 999,
    padding: '0.6rem 1.1rem',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
  } as React.CSSProperties,

  dropdownMenu: {
    position: 'absolute' as const,
    top: 'calc(100% + 8px)',
    right: 0,
    minWidth: 210,
    background: '#F5F3EF',
    border: '1px solid rgba(0,0,0,0.09)',
    borderRadius: 12,
    boxShadow: '0 14px 40px rgba(15,23,42,0.14)',
    zIndex: 200,
    overflow: 'hidden',
  } as React.CSSProperties,

  dropdownItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.1rem',
    padding: '0.85rem 1.1rem',
    borderBottom: '1px solid #EDE9E3',
    textDecoration: 'none',
    color: '#092B2F',
    transition: 'background 0.15s',
  } as React.CSSProperties,

  dropdownLabel: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '0.875rem',
    fontWeight: 600,
  } as React.CSSProperties,

  dropdownSub: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '0.72rem',
    color: '#666',
    fontWeight: 400,
  } as React.CSSProperties,
};

// ── Dropdown component ─────────────────────────────────────────────
function Dropdown({ label, items }: {
  label: string;
  items: { href: string; title: string; sub: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div style={S.dropdownWrap} ref={ref}>
      <button
        type="button"
        style={S.dropdownTrigger}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {label}
        <span style={{ fontSize: '0.6rem', opacity: 0.55, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s' }}>
          ▾
        </span>
      </button>

      {open && (
        <div style={S.dropdownMenu} role="menu">
          {items.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                ...S.dropdownItem,
                borderBottom: i === items.length - 1 ? 'none' : '1px solid #EDE9E3',
              }}
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              <span style={S.dropdownLabel}>{item.title}</span>
              <span style={S.dropdownSub}>{item.sub}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Header ─────────────────────────────────────────────────────────
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

  const artistMenuItems = [
    { href: ROUTES.artistPortfolio, title: 'Portfolio Gallery', sub: 'Manage images & work samples' },
    { href: ROUTES.artistSettings,  title: 'Profile Settings',  sub: 'Bio, rates & services' },
  ];

  const clientMenuItems = [
    { href: '/dashboard/client/settings', title: 'Account Settings', sub: 'Name, company & contact' },
  ];

  return (
    <header style={S.header}>
      <div style={S.inner}>
        {/* Logo */}
        <Link href={ROUTES.home} style={S.logo}>
          <span style={S.logoMain}>DeArtisa</span>
          <span style={S.logoAccent}>&apos;Hub</span>
        </Link>

        {/* Nav */}
        <nav style={S.nav}>
          <Link href={ROUTES.visualizers} style={S.navLink}>
            Find Visualizers
          </Link>
        </nav>

        {/* Actions */}
        <div style={S.actions}>
          {loading ? null : user ? (
            <>
              {role === 'artist' && (
                <Dropdown label="Manage Profile" items={artistMenuItems} />
              )}
              {role === 'client' && (
                <Dropdown label="Firm Settings" items={clientMenuItems} />
              )}
              <Link
                href={role === 'artist' ? ROUTES.artistDashboard : ROUTES.clientDashboard}
                style={S.btnOutline}
              >
                Dashboard
              </Link>
              <button style={S.btnPrimary} onClick={handleSignOut}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href={ROUTES.signIn} style={S.btnOutline}>
                Sign In
              </Link>
              <Link href={ROUTES.getStarted} style={S.btnPrimary}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}


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

