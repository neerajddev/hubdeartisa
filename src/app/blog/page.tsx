import React from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout/Layout';
import { blogPosts } from '@/lib/blogData';
import styles from './page.module.css';

export const metadata = {
  title: "The Visualization Review | De'Artisa Hub",
  description:
    'In-depth articles on architectural visualization, 3D rendering technology, AI in design, and the business of creative practice.',
};

export default function BlogPage() {
  const [featured, ...rest] = blogPosts;

  return (
    <Layout>
      {/* ── MASTHEAD ── */}
      <header className={styles.masthead}>
        <div className="container">
          <p className={styles.mastheadLabel}>The Visualization Review</p>
          <p className={styles.mastheadSub}>
            Craft · Technology · Industry · Business
          </p>
        </div>
      </header>

      {/* ── FEATURED ARTICLE ── */}
      <section className={styles.featuredSection}>
        <div className="container">
          <div className={styles.featuredInner}>
            <div className={styles.featuredMeta}>
              <span className={styles.eyebrow}>{featured.category}</span>
              <span className={styles.metaDivider}>·</span>
              <span className={styles.metaDate}>{featured.date}</span>
              <span className={styles.metaDivider}>·</span>
              <span className={styles.metaRead}>{featured.readTime}</span>
            </div>
            <h1 className={styles.featuredTitle}>
              <Link href={`/blog/${featured.slug}`} className={styles.titleLink}>
                {featured.title}
              </Link>
            </h1>
            <p className={styles.featuredExcerpt}>{featured.excerpt}</p>
            <Link href={`/blog/${featured.slug}`} className={styles.readLink}>
              Read Essay →
            </Link>
          </div>
        </div>
      </section>

      {/* ── ARTICLE GRID ── */}
      <section className={styles.gridSection}>
        <div className="container">
          <div className={styles.grid}>
            {rest.map((post) => (
              <article key={post.id} className={styles.card}>
                <span className={styles.eyebrow}>{post.category}</span>
                <h2 className={styles.cardTitle}>
                  <Link href={`/blog/${post.slug}`} className={styles.titleLink}>
                    {post.title}
                  </Link>
                </h2>
                <p className={styles.cardExcerpt}>{post.excerpt}</p>
                <div className={styles.cardFooter}>
                  <span className={styles.cardDate}>{post.date}</span>
                  <span className={styles.metaDivider}>·</span>
                  <span className={styles.cardRead}>{post.readTime}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
