'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

interface Props {
  content: string;
}

export default function BlogAiSummary({ content }: Props) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const generate = async () => {
      try {
        const res = await fetch('/api/ai/blog-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
        const json = await res.json();
        if (json.summary) {
          setSummary(json.summary);
        } else {
          setIsError(true);
        }
      } catch {
        setIsError(true);
      }
    };
    generate();
  }, [content]);

  return (
    <div className={styles.aiSummary}>
      <p className={styles.aiSummaryEyebrow}>✨ AI Executive Summary</p>
      {isError ? (
        <p className={styles.aiSummaryText} style={{ opacity: 0.45 }}>
          Summary unavailable at this time.
        </p>
      ) : summary ? (
        <p className={styles.aiSummaryText}>{summary}</p>
      ) : (
        <p className={styles.aiSummaryLoading}>✨ AI is analyzing this article…</p>
      )}
    </div>
  );
}
