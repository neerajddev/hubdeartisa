'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Layout from '@/components/Layout/Layout';
import { supabase } from '@/lib/supabase';
import { ROUTES } from '@/constants/brand';
import styles from './page.module.css';

interface MessageRow {
  id: string;
  project_id: string;
  sender_id: string;
  sender_role: 'client' | 'artist';
  content: string;
  created_at: string;
}

const CONTACT_PATTERN =
  /([A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,})|(\+?[\d][\d\s\-().]{7,}\d)/i;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ClientProjectMessagesPage() {
  const params = useParams();
  const projectId = params?.id as string;

  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [projectTitle, setProjectTitle] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial data load
  useEffect(() => {
    if (!projectId) return;

    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id ?? null;
      setCurrentUserId(userId);

      if (!userId) {
        setNotice('Please sign in to view messages.');
        setLoading(false);
        return;
      }

      const [{ data: proj }, { data: msgs, error: msgsError }] = await Promise.all([
        supabase
          .from('projects')
          .select('title')
          .eq('id', projectId)
          .single(),
        supabase
          .from('project_messages')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true }),
      ]);

      if ((proj as any)?.title) setProjectTitle((proj as any).title);
      if (msgsError) {
        setNotice(msgsError.message);
      } else {
        setMessages((msgs as MessageRow[]) ?? []);
      }
      setLoading(false);
    };

    load();
  }, [projectId]);

  // Realtime subscription — new INSERTs on this project
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`project_messages:client:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_messages',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const incoming = payload.new as MessageRow;
          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) return prev;
            const tempIdx = prev.findIndex(
              (m) =>
                m.id.startsWith('temp-') &&
                m.sender_role === incoming.sender_role &&
                m.content === incoming.content,
            );
            if (tempIdx !== -1) {
              const next = [...prev];
              next[tempIdx] = incoming;
              return next;
            }
            return [...prev, incoming];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || sending) return;

    if (CONTACT_PATTERN.test(trimmed)) {
      setNotice('Contact details (email / phone) are not permitted in messages.');
      return;
    }
    if (!currentUserId) {
      setNotice('Please sign in to send messages.');
      return;
    }

    setNotice(null);
    setSending(true);

    const optimisticId = `temp-${Date.now()}`;
    const optimistic: MessageRow = {
      id: optimisticId,
      project_id: projectId,
      sender_id: currentUserId,
      sender_role: 'client',
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInputValue('');
    textareaRef.current?.focus();

    const { error } = await supabase.from('project_messages').insert({
      project_id: projectId,
      sender_id: currentUserId,
      sender_role: 'client',
      content: trimmed,
    });

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setNotice(error.message);
      setInputValue(trimmed);
    }

    setSending(false);
  }, [inputValue, sending, currentUserId, projectId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Layout>
      {/* ── PAGE HEADER ── */}
      <header className={styles.pageHeader}>
        <div className="container">
          <Link href={ROUTES.clientProjectWorkspace(projectId)} className={styles.backLink}>
            &larr; Back to Workspace
          </Link>
          <p className={styles.eyebrow}>Project Chat</p>
          <h1 className={styles.pageTitle}>{projectTitle || 'Conversation'}</h1>
          <p className={styles.pageSubtitle}>
            All communication is securely managed within De&apos;Artisa Hub.
            Contact details are not permitted.
          </p>
        </div>
      </header>

      {/* ── CHAT SURFACE ── */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.chatCard}>

            {/* Messages window */}
            <div className={styles.messagesList}>
              {loading && (
                <div className={styles.loadingState}>
                  <span className={styles.loadingDot} />
                  <span className={styles.loadingDot} />
                  <span className={styles.loadingDot} />
                </div>
              )}

              {!loading && messages.length === 0 && (
                <div className={styles.emptyState}>
                  <span className={styles.emptyIcon}>&#10022;</span>
                  <p>No messages yet. Start the conversation below.</p>
                </div>
              )}

              {messages.map((msg) => {
                // Client page: client = right (mine), artist = left (theirs)
                const isMine = msg.sender_role === 'client';
                return (
                  <div
                    key={msg.id}
                    className={`${styles.messageRow} ${isMine ? styles.rowRight : styles.rowLeft}`}
                  >
                    {!isMine && (
                      <div className={styles.avatarTheirs} aria-label="Artist">A</div>
                    )}
                    <div
                      className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleTheirs} ${
                        msg.id.startsWith('temp-') ? styles.bubblePending : ''
                      }`}
                    >
                      <p className={styles.bubbleText}>{msg.content}</p>
                      <span className={styles.bubbleTime}>{formatTime(msg.created_at)}</span>
                    </div>
                    {isMine && (
                      <div className={styles.avatarMine} aria-label="You">C</div>
                    )}
                  </div>
                );
              })}

              <div ref={bottomRef} />
            </div>

            {/* Notice bar */}
            {notice && (
              <div className={styles.noticeBar} role="alert">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {notice}
              </div>
            )}

            {/* Composer */}
            <div className={styles.composer}>
              <textarea
                ref={textareaRef}
                className={styles.composerInput}
                rows={2}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write a message&#8230; (Enter to send, Shift+Enter for new line)"
                disabled={sending || !currentUserId}
                maxLength={2000}
              />
              <button
                className={styles.sendBtn}
                onClick={handleSend}
                disabled={sending || !inputValue.trim() || !currentUserId}
                aria-label="Send message"
              >
                {sending ? (
                  <span className={styles.sendingSpinner} />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                )}
              </button>
            </div>

          </div>
        </div>
      </section>
    </Layout>
  );
}
