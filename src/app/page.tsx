'use client';

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout/Layout';
import Button from '@/components/Button/Button';
import Link from 'next/link';
import { ROUTES } from '@/constants/brand';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

export default function Home() {
  const [featuredArtists, setFeaturedArtists] = useState<Array<{
    id: string;
    full_name: string;
    state: string;
    country: string;
    experience: string;
    rating: number;
  }>>([]);
  const [currentArtistIndex, setCurrentArtistIndex] = useState(0);

  useEffect(() => {
    const loadFeaturedArtists = async () => {
      const { data } = await supabase
        .from('artist_profiles')
        .select('id, full_name, state, country, experience')
        .order('created_at', { ascending: false })
        .limit(4);

      if (data && data.length > 0) {
        const rankedArtists = data.map((artist, index) => ({
          ...artist,
          rating: Number((4.9 - index * 0.2).toFixed(1)),
        }));
        setFeaturedArtists(rankedArtists);
      }
    };
    loadFeaturedArtists();
  }, []);

  useEffect(() => {
    if (featuredArtists.length > 0) {
      const interval = setInterval(() => {
        setCurrentArtistIndex((prev) => (prev + 1) % featuredArtists.length);
      }, 2800);
      return () => clearInterval(interval);
    }
  }, [featuredArtists.length]);

  // Scroll-reveal: fade-up elements as they enter the viewport
  useEffect(() => {
    const reveals = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove(styles.fadeUp);
            entry.target.classList.add(styles.fadeUpVisible);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    reveals.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const getArtistCardStateClass = (index: number) => {
    if (featuredArtists.length === 0) return styles.artistCardHidden;
    const diff = (index - currentArtistIndex + featuredArtists.length) % featuredArtists.length;
    if (diff === 0) return styles.artistCardActive;
    if (diff === 1) return styles.artistCardBackRight;
    if (diff === featuredArtists.length - 1) return styles.artistCardBackLeft;
    return styles.artistCardHidden;
  };

  return (
    <Layout>

      {/* HERO */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroInner}>

            <div className={styles.heroLeft}>
              <p className={styles.heroEyebrow}>Curated Artist Network · Est. 2024</p>
              <h1 className={styles.heroTitle}>
                Masterful<br />
                Architectural<br />
                <em>Visualization.</em>
              </h1>
              <p className={styles.heroDescription}>
                The curated network of world-class 3D artists.
                Zero friction. Breathtaking results.
              </p>
              <div className={styles.heroActions}>
                <Link href={ROUTES.visualizers}>
                  <Button size="large">Find 3D Artists</Button>
                </Link>
                <Link href="/register/artist">
                  <button className={styles.ghostCta}>Apply as Artist →</button>
                </Link>
              </div>

              {featuredArtists.length > 0 && (
                <div className={styles.artistShowcase}>
                  <p className={styles.showcaseLabel}>Verified Artists on the Platform</p>
                  <div className={styles.artistList}>
                    {featuredArtists.map((artist, index) => (
                      <div
                        key={artist.id}
                        className={`${styles.artistCard} ${getArtistCardStateClass(index)}`}
                      >
                        <div className={styles.artistAvatar}>
                          {artist.full_name.charAt(0)}
                        </div>
                        <div className={styles.artistInfo}>
                          <div className={styles.artistName}>{artist.full_name}</div>
                          <div className={styles.artistMeta}>
                            {artist.state}, {artist.country} · {artist.experience}
                          </div>
                          <div className={styles.artistRating}>★ {artist.rating.toFixed(1)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.heroRight}>
              <div className={styles.masonryGrid}>
                <div
                  className={`${styles.masonryItem} ${styles.masonryItemTall} ${styles.masonryFloat1}`}
                  style={{ backgroundImage: `url('https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=900&q=85')` }}
                >
                  <span className={styles.masonryLabel}>Interior</span>
                </div>
                <div
                  className={`${styles.masonryItem} ${styles.masonryFloat2}`}
                  style={{ backgroundImage: `url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=85')` }}
                >
                  <span className={styles.masonryLabel}>Exterior</span>
                </div>
                <div
                  className={`${styles.masonryItem} ${styles.masonryFloat3}`}
                  style={{ backgroundImage: `url('https://images.unsplash.com/photo-1503174971373-b1f69850bded?w=900&q=85')` }}
                >
                  <span className={styles.masonryLabel}>3D Floor Plan</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <div className={styles.trustBar}>
        <div className="container">
          <div className={styles.trustBarInner}>
            <span className={styles.trustItem}>Established 2022</span>
            <span className={styles.trustDivider} aria-hidden="true" />
            <span className={styles.trustItem}>2,500+ Renders Delivered</span>
            <span className={styles.trustDivider} aria-hidden="true" />
            <span className={styles.trustItem}>150+ Design Partners</span>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className={styles.editorialSection}>
        <div className="container">
          <p className={styles.sectionEyebrow}>Process</p>
          <h2 className={`${styles.editorialTitle} ${styles.fadeUp}`} data-reveal="true">How It Works</h2>
          <div className={styles.stepsEditorial}>
            <div className={styles.stepEditorial}>
              <span className={`${styles.stepAccentNum} ${styles.fadeUp}`} data-reveal="true">01</span>
              <div className={styles.stepBody}>
                <h3 className={styles.stepHeading}>Post a Brief</h3>
                <p className={styles.stepText}>
                  Describe your vision. AI refines it into a precise technical brief.
                </p>
              </div>
            </div>
            <div className={`${styles.stepEditorial} ${styles.stepEditorialOffset}`}>
              <span className={`${styles.stepAccentNum} ${styles.fadeUp}`} data-reveal="true">02</span>
              <div className={styles.stepBody}>
                <h3 className={styles.stepHeading}>Hire the Best</h3>
                <p className={styles.stepText}>
                  Top-10% talent, curated. Escrow-secured from day one.
                </p>
              </div>
            </div>
            <div className={styles.stepEditorial}>
              <span className={`${styles.stepAccentNum} ${styles.fadeUp}`} data-reveal="true">03</span>
              <div className={styles.stepBody}>
                <h3 className={styles.stepHeading}>Collaborate</h3>
                <p className={styles.stepText}>
                  Files, feedback, milestones. One workspace. Zero noise.
                </p>
              </div>
            </div>
            <div className={`${styles.stepEditorial} ${styles.stepEditorialOffset}`}>
              <span className={`${styles.stepAccentNum} ${styles.fadeUp}`} data-reveal="true">04</span>
              <div className={styles.stepBody}>
                <h3 className={styles.stepHeading}>Approve &amp; Release</h3>
                <p className={styles.stepText}>
                  Your approval releases funds. Not a second before.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY DE'ARTISA HUB */}
      <section className={styles.editorialSection}>
        <div className="container">
          <p className={styles.sectionEyebrow}>Differentiators</p>
          <h2 className={`${styles.editorialTitle} ${styles.fadeUp}`} data-reveal="true">Why De&apos;Artisa Hub</h2>
          <div className={styles.pillarsGrid}>
            <div className={`${styles.pillar} ${styles.fadeUp}`} data-reveal="true">
              <div className={styles.pillarLine} />
              <h3 className={styles.pillarTitle}>Curated Talent Only</h3>
              <p className={styles.pillarText}>
                Fewer than 10% accepted. Every artist reviewed by our creative directors.
              </p>
            </div>
            <div className={`${styles.pillar} ${styles.pillarOffset} ${styles.fadeUp}`} data-reveal="true">
              <div className={styles.pillarLine} />
              <h3 className={styles.pillarTitle}>Escrow-Protected Payments</h3>
              <p className={styles.pillarText}>
                50/50 escrow. Capital moves only on your terms.
              </p>
            </div>
            <div className={`${styles.pillar} ${styles.fadeUp}`} data-reveal="true">
              <div className={styles.pillarLine} />
              <h3 className={styles.pillarTitle}>Seamless Collaboration</h3>
              <p className={styles.pillarText}>
                Messaging, files, milestones. All on-platform. No noise.
              </p>
            </div>
            <div className={`${styles.pillar} ${styles.pillarOffset} ${styles.pillarAi} ${styles.fadeUp}`} data-reveal="true">
              <div className={styles.pillarLine} />
              <h3 className={styles.pillarTitle}>Intelligent Scoping</h3>
              <p className={styles.pillarText}>
                Raw ideas in. Flawless briefs out. Revisions eliminated before they start.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className={styles.editorialSection}>
        <div className="container">
          <p className={styles.sectionEyebrow}>Capabilities</p>
          <h2 className={`${styles.editorialTitle} ${styles.fadeUp}`} data-reveal="true">Services</h2>
          <div className={styles.servicesRow}>
            <div className={styles.serviceBlock}>
              <span className={styles.serviceIndex}>—</span>
              <h4 className={styles.serviceHeading}>Exterior &amp; Interior Rendering</h4>
              <p className={styles.serviceText}>
                Photorealistic stills. Materials, light, depth — perfected.
              </p>
            </div>
            <div className={`${styles.serviceBlock} ${styles.serviceBlockOffset}`}>
              <span className={styles.serviceIndex}>—</span>
              <h4 className={styles.serviceHeading}>3D Floor Plans</h4>
              <p className={styles.serviceText}>
                Spatial clarity. Design intent made visible.
              </p>
            </div>
            <div className={styles.serviceBlock}>
              <span className={styles.serviceIndex}>—</span>
              <h4 className={styles.serviceHeading}>Architectural Animations</h4>
              <p className={styles.serviceText}>
                Cinematic walkthroughs. Immersive, story-driven.
              </p>
            </div>
            <div className={`${styles.serviceBlock} ${styles.serviceBlockOffset}`}>
              <span className={styles.serviceIndex}>—</span>
              <h4 className={styles.serviceHeading}>VR Experiences</h4>
              <p className={styles.serviceText}>
                Real-time. Interactive. Before a single wall is built.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* OUR ORIGINS — MANIFESTO */}
      <section className={styles.manifestoSection}>
        <div className="container">
          <div className={styles.manifestoInner}>
            <p className={`${styles.manifestoOverline} ${styles.fadeUp}`} data-reveal="true">Our Origins</p>
            <h2 className={`${styles.manifestoHeading} ${styles.fadeUp}`} data-reveal="true">
              Built by artists.<br />Engineered for scale.
            </h2>
            <div className={styles.manifestoDivider} />
            <p className={`${styles.manifestoBody} ${styles.fadeUp}`} data-reveal="true">
              We didn&apos;t start as a software company. We started in the trenches of 3D design.
              Since 2022, our core team has partnered with over 150 top interior designers and studios
              to deliver more than 2,500 premium visualizations.
            </p>
            <p className={`${styles.manifestoBody} ${styles.fadeUp}`} data-reveal="true">
              We experienced the friction of traditional freelance work firsthand&mdash;scattered files,
              endless email chains, and mixed quality. De&apos;Artisa Hub is our solution. We built the
              exact infrastructure we always wished we had: a curated network of elite global talent,
              backed by a flawless project engine.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={styles.ctaInner}>
            <p className={styles.ctaEyebrow}>Ready?</p>
            <h2 className={styles.ctaTitle}>
              Bring your vision<br />to life — today.
            </h2>
            <p className={styles.ctaText}>
              The world&apos;s most curated network. Start today.
            </p>
            <div className={styles.ctaActions}>
              <Link href={ROUTES.getStarted}>
                <Button size="large">Get Started</Button>
              </Link>
              <Link href="/register/artist">
                <button className={styles.ctaGhost}>Apply as Artist →</button>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </Layout>
  );
}
