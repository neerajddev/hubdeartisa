import React from 'react';
import Layout from '@/components/Layout/Layout';
import Card from '@/components/Card/Card';
import Link from 'next/link';
import { ROUTES } from '@/constants/brand';
import styles from './page.module.css';

export default function HowItWorksPage() {
  return (
    <Layout>
      <div className={styles.pageHeader}>
        <div className="container">
          <h1 className={styles.pageTitle}>How It Works</h1>
          <p className={styles.pageDescription}>
            Find and hire the best 3D Artist from our global network in four simple steps
          </p>
        </div>
      </div>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.processSteps}>
            <div className={styles.processStep}>
              <div className={styles.stepNumber}>01</div>
              <Card padding="large">
                <div className={styles.stepIcon}>
                  <div className={styles.iconPlaceholder}>Post</div>
                </div>
                <h3 className={styles.stepTitle}>Post a Job</h3>
                <p className={styles.stepDescription}>
                  Create a design brief by completing our quick and easy online form. Describe your project requirements, upload reference files, and set your timeline. Receive competitive offers from our global network of 3D artists who specialize in your project type.
                </p>
              </Card>
            </div>

            <div className={styles.processStep}>
              <div className={styles.stepNumber}>02</div>
              <Card padding="large">
                <div className={styles.stepIcon}>
                  <div className={styles.iconPlaceholder}>Hire</div>
                </div>
                <h3 className={styles.stepTitle}>Hire the Best 3D Artist</h3>
                <p className={styles.stepDescription}>
                  Review and compare offers, portfolios, ratings, language levels, and time zones to select the perfect artist for your project. Complete a 25% escrow payment to secure the artist. Payment is only released when all work is approved and the job is closed.
                </p>
              </Card>
            </div>

            <div className={styles.processStep}>
              <div className={styles.stepNumber}>03</div>
              <Card padding="large">
                <div className={styles.stepIcon}>
                  <div className={styles.iconPlaceholder}>Collaborate</div>
                </div>
                <h3 className={styles.stepTitle}>Collaborate Online</h3>
                <p className={styles.stepDescription}>
                  Work together seamlessly using our proprietary online collaboration tools. You'll be notified of progress updates and when feedback is required. Exchange files, provide revisions, and track milestones—all within our streamlined platform.
                </p>
              </Card>
            </div>

            <div className={styles.processStep}>
              <div className={styles.stepNumber}>04</div>
              <Card padding="large">
                <div className={styles.stepIcon}>
                  <div className={styles.iconPlaceholder}>Approve</div>
                </div>
                <h3 className={styles.stepTitle}>Approve & Pay</h3>
                <p className={styles.stepDescription}>
                  Review each deliverable and approve when no more changes are required. Once all assets are approved, the job will be closed and funds will be automatically transferred from your escrow account to the 3D artist. Quality guaranteed.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.benefitsSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Why Choose De'Artisa Hub</h2>
          <div className={styles.benefits}>
            <div className={styles.benefit}>
              <h3 className={styles.benefitTitle}>Global Talent Network</h3>
              <p className={styles.benefitDescription}>
                Our 3D artist network spans multiple countries. Save money and get exceptional results by outsourcing your projects to specialized professionals worldwide.
              </p>
            </div>
            <div className={styles.benefit}>
              <h3 className={styles.benefitTitle}>Escrow Protection</h3>
              <p className={styles.benefitDescription}>
                Your payment is fully protected with our escrow system. Artists are only paid after you approve all deliverables, ensuring quality and satisfaction.
              </p>
            </div>
            <div className={styles.benefit}>
              <h3 className={styles.benefitTitle}>Streamlined Collaboration</h3>
              <p className={styles.benefitDescription}>
                Manage jobs seamlessly with our online collaboration tools that handle feedback, notifications, file transfers, and payment processes efficiently.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.backBar}>
        <div className="container">
          <Link href={ROUTES.home} className={styles.backLink}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </Layout>
  );
}
