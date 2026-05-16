import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Layout from '@/components/Layout/Layout';
import { blogPosts, getPostBySlug } from '@/lib/blogData';
import BlogAiSummary from './BlogAiSummary';
import styles from './page.module.css';

// ── Static params for full SSG ──────────────────────────────────────
export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

// ── Dynamic SEO metadata ──────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = getPostBySlug(params.slug);
  if (!post) return {};

  return {
    title: `${post.title} | The Visualization Review`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────
export default function BlogArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  const paragraphs = post.content.split('\n\n').filter(Boolean);

  return (
    <Layout>
      <article>
        {/* ── ARTICLE HEADER ── */}
        <header className={styles.articleHeader}>
          <div className={styles.headerContainer}>
            <Link href="/blog" className={styles.backLink}>
              ← The Visualization Review
            </Link>

            <div className={styles.articleMeta}>
              <span className={styles.eyebrow}>{post.category}</span>
              <span className={styles.metaDivider}>·</span>
              <span className={styles.metaItem}>{post.date}</span>
              <span className={styles.metaDivider}>·</span>
              <span className={styles.metaItem}>{post.readTime}</span>
            </div>

            <h1 className={styles.articleTitle}>{post.title}</h1>
            <p className={styles.articleLead}>{post.excerpt}</p>

            {/* ── AI EXECUTIVE SUMMARY ── */}
            <BlogAiSummary content={post.content} />
          </div>
        </header>

        {/* ── ARTICLE DIVIDER ── */}
        <div className={styles.dividerWrap}>
          <div className={styles.divider} />
        </div>

        {/* ── ARTICLE BODY ── */}
        <div className={styles.bodyContainer}>
          <div className={styles.bodyInner}>
            {paragraphs.map((para, i) => (
              <p key={i} className={styles.bodyPara}>
                {para}
              </p>
            ))}
          </div>

          {/* ── ARTICLE FOOTER ── */}
          <footer className={styles.articleFooter}>
            <div className={styles.footerRule} />
            <div className={styles.footerInner}>
              <p className={styles.footerLabel}>Continue Reading</p>
              <Link href="/blog" className={styles.footerBack}>
                ← All Essays
              </Link>
            </div>
          </footer>
        </div>
      </article>
    </Layout>
  );
}
