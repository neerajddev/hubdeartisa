'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout/Layout';
import Button from '@/components/Button/Button';
import Link from 'next/link';
import { ROUTES } from '@/constants/brand';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

export default function Home() {
  const [mode, setMode] = useState<'hire' | 'getHired'>('hire');
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
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [featuredArtists.length]);

  const showPreviousArtist = () => {
    setCurrentArtistIndex((prev) =>
      prev === 0 ? featuredArtists.length - 1 : prev - 1
    );
  };

  const showNextArtist = () => {
    setCurrentArtistIndex((prev) => (prev + 1) % featuredArtists.length);
  };

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
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className="container">
          <nav className={styles.topRightNav} aria-label="Quick links">
            <Link href={ROUTES.blog} className={styles.topRightLink}>Blog</Link>
            <Link href={ROUTES.faqs} className={styles.topRightLink}>FAQs</Link>
            <Link href={ROUTES.contactUs} className={styles.topRightLink}>Contact Us</Link>
            <Link href={ROUTES.howItWorks} className={styles.topRightLink}>How It Works</Link>
          </nav>

          <div className={styles.topToggleWrap}>
            <span className={styles.topToggleLabel}>I&apos;d like to</span>
            <div className={styles.topToggle} role="group" aria-label="Primary actions">
              <button
                type="button"
                onClick={() => setMode('hire')}
                className={`${styles.toggleOption} ${mode === 'hire' ? styles.toggleOptionActive : ''}`}
                aria-pressed={mode === 'hire'}
              >
                Hire 3D Artists
              </button>
              <button
                type="button"
                onClick={() => setMode('getHired')}
                className={`${styles.toggleOption} ${mode === 'getHired' ? styles.toggleOptionActive : ''}`}
                aria-pressed={mode === 'getHired'}
              >
                Get Hired
              </button>
            </div>
          </div>

          <div className={styles.heroContent}>
            {mode === 'hire' ? (
              <>
                <div className={styles.heroLeft}>
                  <h1 className={styles.heroTitle}>
                    Stunning 3D Architectural Renderings<br />
                    <span className="text-accent">Made Easy</span>
                  </h1>
                  <p className={styles.heroDescription}>
                    De'Artisa Hub offers high-quality, fast, and affordable 3D Visualization Services for architects, designers, and developers. Find and hire the best 3D Artist from our global professional network and create stunning visuals for your projects.
                  </p>
                  <div className={styles.heroActionsWrapper}>
                    <div className={styles.heroActions}>
                      <Link href={ROUTES.visualizers}>
                        <Button size="large">Find 3D Artists</Button>
                      </Link>
                      <Link href={ROUTES.signIn}>
                        <Button variant="secondary" size="large">Sign In</Button>
                      </Link>
                    </div>
                    {featuredArtists.length > 0 && (
                      <div className={styles.artistShowcase}>
                        <h3 className={styles.showcaseTitle}>Our Top Artists</h3>
                        <div className={styles.artistCarousel}>
                          <button
                            type="button"
                            className={styles.carouselArrow}
                            onClick={showPreviousArtist}
                            aria-label="Previous artist"
                          >
                            ‹
                          </button>

                          <div className={styles.artistList}>
                            {featuredArtists.map((artist, index) => (
                              <div key={artist.id} className={`${styles.artistCard} ${getArtistCardStateClass(index)}`}>
                                <div className={styles.artistAvatar}>
                                  {artist.full_name.charAt(0)}
                                </div>
                                <div className={styles.artistInfo}>
                                  <div className={styles.artistName}>{artist.full_name}</div>
                                  <div className={styles.artistLocation}>
                                    {artist.state}, {artist.country}
                                  </div>
                                  <div className={styles.artistRating}>★ {artist.rating.toFixed(1)}/5</div>
                                </div>
                                <div className={styles.artistExperience}>
                                  {artist.experience}
                                </div>
                              </div>
                            ))}
                          </div>

                          <button
                            type="button"
                            className={styles.carouselArrow}
                            onClick={showNextArtist}
                            aria-label="Next artist"
                          >
                            ›
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.heroRight}>
                  <div className={styles.heroImages}>
                    <div className={`${styles.heroImage} ${styles.heroImage1}`}>
                      <span className={styles.imageLabel}>Interior</span>
                    </div>
                    <div className={`${styles.heroImage} ${styles.heroImage2}`}>
                      <span className={styles.imageLabel}>Exterior</span>
                    </div>
                    <div className={`${styles.heroImage} ${styles.heroImage3}`}>
                      <span className={styles.imageLabel}>3D Floor Plan</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className={styles.heroLeft}>
                  <h1 className={styles.heroTitle}>
                    Get Hired for Your 3D Skills<br />
                    <span className="text-accent">Grow Your Global Client Base</span>
                  </h1>
                  <p className={styles.heroDescription}>
                    Join De&apos;Artisa Hub as a professional 3D artist, receive project invites from architects and developers, and manage your work with secure milestones and timely payouts.
                  </p>
                  <div className={styles.heroActions}>
                    <Link href="/register/artist">
                      <Button size="large">Join as 3D Artist</Button>
                    </Link>
                    <Link href={ROUTES.signIn}>
                      <Button variant="secondary" size="large">Sign In</Button>
                    </Link>
                  </div>
                </div>
                <div className={styles.heroRight}>
                  <div className={styles.heroImages}>
                    <div className={`${styles.heroImage} ${styles.heroImage1} ${styles.heroImageArtist1}`}>
                      <span className={styles.imageLabel}>Freelance</span>
                    </div>
                    <div className={`${styles.heroImage} ${styles.heroImage2} ${styles.heroImageArtist2}`}>
                      <span className={styles.imageLabel}>Portfolio</span>
                    </div>
                    <div className={`${styles.heroImage} ${styles.heroImage3} ${styles.heroImageArtist3}`}>
                      <span className={styles.imageLabel}>Projects</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {mode === 'hire' ? (
        <>
          {/* How It Works */}
          <section className={styles.section}>
            <div className="container">
              <h2 className={styles.sectionTitle}>How It Works</h2>
              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>01</div>
                  <h3 className={styles.stepTitle}>Post a Job</h3>
                  <p className={styles.stepDescription}>
                    Create a design brief using our quick and easy online form. Receive offers from our global network of 3D artists.
                  </p>
                </div>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>02</div>
                  <h3 className={styles.stepTitle}>Hire the Best 3D Artist</h3>
                  <p className={styles.stepDescription}>
                    Review portfolios, ratings, and offers. Hire your preferred artist by depositing the agreed fee into escrow.
                  </p>
                </div>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>03</div>
                  <h3 className={styles.stepTitle}>Collaborate Online</h3>
                  <p className={styles.stepDescription}>
                    Work together seamlessly using our online collaboration tools. Exchange files, provide feedback, and track progress.
                  </p>
                </div>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>04</div>
                  <h3 className={styles.stepTitle}>Approve &amp; Pay</h3>
                  <p className={styles.stepDescription}>
                    Review final deliverables, approve the work, and close the job. Funds are released to the artist once approved.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className={styles.section}>
            <div className="container">
              <h2 className={styles.sectionTitle}>Why De'Artisa Hub</h2>
              <div className={styles.features}>
                <div className={styles.feature}>
                  <h3 className={styles.featureTitle}>Global Artist Network</h3>
                  <p className={styles.featureDescription}>
                    Access talented 3D artists from around the world. Save money and get exceptional results by outsourcing your projects.
                  </p>
                </div>
                <div className={styles.feature}>
                  <h3 className={styles.featureTitle}>Secure Escrow Payment</h3>
                  <p className={styles.featureDescription}>
                    Your funds are protected. Artists are only paid when you approve the final work, ensuring quality and satisfaction.
                  </p>
                </div>
                <div className={styles.feature}>
                  <h3 className={styles.featureTitle}>Seamless Collaboration</h3>
                  <p className={styles.featureDescription}>
                    Manage projects efficiently with our online collaboration tools that streamline feedback, notifications, and file transfers.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* About */}
          <section className={styles.section}>
            <div className="container">
              <h2 className={styles.sectionTitle}>About Us</h2>
              <div className={styles.aboutContent}>
                <p className={styles.aboutText}>
                  De'Artisa Hub offers the best architectural rendering and 3D visualization services, committed to delivering high-quality solutions that bring your projects to life with clarity and precision. Whether you&apos;re an architect, designer, or property developer, our advanced 3D rendering services turn your concepts into vivid, tangible realities, aiding in effective decision-making.
                </p>
                <p className={styles.aboutText}>
                  Our goal is to offer the best 3D visualization services at unbeatable prices and speed. To achieve this, we leverage our global talent network and suite of proprietary online collaboration tools that streamline the feedback, notification, file transfer, and payment processes.
                </p>
              </div>

              <h3 className={styles.subsectionTitle}>Our Services</h3>
              <div className={styles.servicesList}>
                <div className={styles.serviceItem}>
                  <h4 className={styles.serviceTitle}>Exterior &amp; Interior Renderings</h4>
                  <p className={styles.serviceDescription}>
                    Photorealistic visualizations of building exteriors and interior spaces, showcasing materials, lighting, and design details.
                  </p>
                </div>
                <div className={styles.serviceItem}>
                  <h4 className={styles.serviceTitle}>3D Floor Plans</h4>
                  <p className={styles.serviceDescription}>
                    Three-dimensional floor plans that provide realistic views of spatial layouts and design flow.
                  </p>
                </div>
                <div className={styles.serviceItem}>
                  <h4 className={styles.serviceTitle}>Architectural Animations</h4>
                  <p className={styles.serviceDescription}>
                    Dynamic walkthroughs and flythroughs that bring architectural designs to life with immersive experiences.
                  </p>
                </div>
                <div className={styles.serviceItem}>
                  <h4 className={styles.serviceTitle}>Virtual Reality Experiences</h4>
                  <p className={styles.serviceDescription}>
                    Cutting-edge VR visualizations that allow clients to explore spaces before construction begins.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className={styles.cta}>
            <div className="container">
              <div className={styles.ctaContent}>
                <h2 className={styles.ctaTitle}>Ready to bring your vision to life?</h2>
                <p className={styles.ctaDescription}>
                  Start your project today with our network of expert 3D artists.
                </p>
                <Link href={ROUTES.getStarted}>
                  <Button size="large">Get Started</Button>
                </Link>
              </div>
            </div>
          </section>
        </>
      ) : (
        <>
          {/* How It Works for Artists */}
          <section className={styles.section}>
            <div className="container">
              <h2 className={styles.sectionTitle}>How It Works for Artists</h2>
              <div className={styles.steps}>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>01</div>
                  <h3 className={styles.stepTitle}>Create Your Profile</h3>
                  <p className={styles.stepDescription}>
                    Build a strong artist profile with your services, rates, software expertise, and portfolio samples.
                  </p>
                </div>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>02</div>
                  <h3 className={styles.stepTitle}>Receive Project Invitations</h3>
                  <p className={styles.stepDescription}>
                    Get matched with clients looking for your style and skills, then submit offers confidently.
                  </p>
                </div>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>03</div>
                  <h3 className={styles.stepTitle}>Deliver Great Work</h3>
                  <p className={styles.stepDescription}>
                    Collaborate with clients using built-in messaging and file sharing from brief to final delivery.
                  </p>
                </div>
                <div className={styles.step}>
                  <div className={styles.stepNumber}>04</div>
                  <h3 className={styles.stepTitle}>Get Paid Securely</h3>
                  <p className={styles.stepDescription}>
                    Complete milestones and receive secure payouts as soon as your work is approved.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Why Artists Join */}
          <section className={styles.section}>
            <div className="container">
              <h2 className={styles.sectionTitle}>Why Artists Join De&apos;Artisa Hub</h2>
              <div className={styles.features}>
                <div className={styles.feature}>
                  <h3 className={styles.featureTitle}>Global Opportunities</h3>
                  <p className={styles.featureDescription}>
                    Work with architects, developers, and studios worldwide on exciting visualization projects.
                  </p>
                </div>
                <div className={styles.feature}>
                  <h3 className={styles.featureTitle}>Fair &amp; Transparent Payments</h3>
                  <p className={styles.featureDescription}>
                    Clearly defined milestones and escrow-backed payments help you work with confidence.
                  </p>
                </div>
                <div className={styles.feature}>
                  <h3 className={styles.featureTitle}>Professional Growth</h3>
                  <p className={styles.featureDescription}>
                    Build your reputation through reviews, completed projects, and a strong public portfolio.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Services Artists Can Offer */}
          <section className={styles.section}>
            <div className="container">
              <h2 className={styles.sectionTitle}>Services You Can Offer</h2>
              <div className={styles.servicesList}>
                <div className={styles.serviceItem}>
                  <h4 className={styles.serviceTitle}>Interior &amp; Exterior Rendering</h4>
                  <p className={styles.serviceDescription}>
                    Provide high-end still renders for residential, commercial, and mixed-use projects.
                  </p>
                </div>
                <div className={styles.serviceItem}>
                  <h4 className={styles.serviceTitle}>3D Floor Plans</h4>
                  <p className={styles.serviceDescription}>
                    Deliver easy-to-understand spatial visualizations that help clients present concepts clearly.
                  </p>
                </div>
                <div className={styles.serviceItem}>
                  <h4 className={styles.serviceTitle}>Animation &amp; Walkthroughs</h4>
                  <p className={styles.serviceDescription}>
                    Create immersive project videos that communicate design intent and storytelling effectively.
                  </p>
                </div>
                <div className={styles.serviceItem}>
                  <h4 className={styles.serviceTitle}>VR / Interactive Experiences</h4>
                  <p className={styles.serviceDescription}>
                    Help clients explore designs interactively with VR-ready and real-time visual outputs.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className={styles.cta}>
            <div className="container">
              <div className={styles.ctaContent}>
                <h2 className={styles.ctaTitle}>Ready to get hired as a 3D artist?</h2>
                <p className={styles.ctaDescription}>
                  Join De&apos;Artisa Hub and start connecting with clients who need your visualization expertise.
                </p>
                <Link href="/register/artist">
                  <Button size="large">Create Artist Profile</Button>
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </Layout>
  );
}
