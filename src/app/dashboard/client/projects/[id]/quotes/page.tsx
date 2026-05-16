'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout/Layout';
import { supabase } from '@/lib/supabase';
import { ROUTES } from '@/constants/brand';
import styles from './page.module.css';

type Quote = {
  id: string;
  amount: number;
  timeline_days: number;
  notes: string | null;
  status: string;
  services?: Array<{ name: string; rate: number }>;
  artist_profiles: Array<{
    id: string;
    full_name: string;
    country: string;
  }>;
};

export default function ClientProjectQuotesPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [projectTitle, setProjectTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const currencySymbol = '₹';

  useEffect(() => {
    const loadQuotes = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) {
        setMessage('Please sign in to view quotes.');
        setLoading(false);
        return;
      }

      const { data: project } = await supabase
        .from('projects')
        .select('id, title')
        .eq('id', projectId)
        .single();

      setProjectTitle(project?.title || '');

      const { data, error } = await supabase
        .from('project_quotes')
        .select('id, amount, timeline_days, notes, status, services, artist_profiles(id, full_name, country)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        setMessage(error.message);
      } else {
        const normalized = (data || []).map((row: any) => ({
          ...row,
          artist_profiles: Array.isArray(row.artist_profiles) ? row.artist_profiles : row.artist_profiles ? [row.artist_profiles] : [],
        }));
        setQuotes(normalized);
      }
      setLoading(false);
    };

    if (projectId) {
      loadQuotes();
    }
  }, [projectId]);

  const handleSelect = async (quote: Quote) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    const artistProfile = quote.artist_profiles?.[0];
    if (!userId || !artistProfile?.id) {
      setMessage('Unable to select this quote yet.');
      return;
    }

    const { data: clientProfile } = await supabase
      .from('client_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!clientProfile?.id) {
      setMessage('Complete your client profile first.');
      return;
    }

    // Only record the chosen quote — status stays 'open' until payment confirms.
    // selected_artist_id is set by the payment verification route after signature check.
    const { error } = await supabase
      .from('projects')
      .update({ selected_quote_id: quote.id })
      .eq('id', projectId);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push(ROUTES.clientProjectPayment(projectId));
  };

  return (
    <Layout>
      <header className={styles.pageHeader}>
        <div className="container">
          <button className={styles.backLink} onClick={() => router.back()}>← Dashboard</button>
          <p className={styles.eyebrow}>Project Quotes</p>
          <h1 className={styles.pageTitle}>Quotes for {projectTitle}</h1>
          <p className={styles.metaHint}>Compare offers and choose your preferred artist.</p>
        </div>
      </header>

      <section className={styles.section}>
        <div className="container">
          {message && <p className={styles.notice}>{message}</p>}
          {loading ? (
            <p className={styles.notice}>Loading quotes…</p>
          ) : (
            <div className={styles.quoteList}>
              {quotes.length === 0 && (
                <p className={styles.emptyState}>No quotes yet. Artists will appear here once they respond to your brief.</p>
              )}
              {quotes.map((quote) => {
                const artist = quote.artist_profiles?.[0];
                return (
                  <article key={quote.id} className={styles.quoteRow}>
                    <div className={styles.quoteLeft}>
                      <p className={styles.artistName}>{artist?.full_name || 'Artist'}</p>
                      <p className={styles.artistLocation}>{artist?.country || 'Remote'}</p>
                    </div>

                    <div className={styles.quoteCenter}>
                      <p className={styles.quoteAmount}>{currencySymbol}{quote.amount.toLocaleString()}</p>
                      <p className={styles.quoteSub}>{quote.timeline_days} days</p>
                    </div>

                    {quote.services && quote.services.length > 0 && (
                      <div className={styles.quoteServices}>
                        {quote.services.map((s, i) => (
                          <span key={`${s.name}-${i}`} className={styles.serviceTag}>
                            {s.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {quote.notes && (
                      <p className={styles.quoteNotes}>{quote.notes}</p>
                    )}

                    <div className={styles.quoteActions}>
                      <button className={styles.selectBtn} onClick={() => handleSelect(quote)}>
                        Select Artist →
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
