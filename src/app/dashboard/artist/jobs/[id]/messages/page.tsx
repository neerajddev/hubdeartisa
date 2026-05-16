'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Layout from '@/components/Layout/Layout';
import { supabase } from '@/lib/supabase';
import { ROUTES } from '@/constants/brand';
import styles from './page.module.css';

interface MessageRow {
  id: string;
  sender_user_id: string;
  sender_role: string;
  message: string;
  created_at: string;
}

export default function ArtistProjectMessagesPage() {
  const params = useParams();
  const projectId = params?.id as string;

  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);

  const containsContactInfo = (value: string) => {
    const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
    const phoneRegex = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/;
    return emailRegex.test(value) || phoneRegex.test(value);
  };

  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user?.id) {
        setNotice('Please sign in to view messages.');
        setLoading(false);
        return;
      }

      // Load project title for header
      const { data: proj } = await supabase
        .from('projects')
        .select('title')
        .eq('id', projectId)
        .single();
      if (proj?.title) setProjectTitle(proj.title);

      const { data, error } = await supabase
        .from('project_messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) {
        setNotice(error.message);
      } else {
        setMessages(data || []);
      }
      setLoading(false);
    };

    if (projectId) load();
  }, [projectId]);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = newMessage.trim();
    if (!trimmed) return;
    if (containsContactInfo(trimmed)) {
      setNotice('Please remove phone numbers or emails from messages.');
      return;
    }

    setSending(true);
    setNotice(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) {
      setNotice('Please sign in.');
      setSending(false);
      return;
    }

    const { error } = await supabase.from('project_messages').insert({
      project_id: projectId,
      sender_user_id: userId,
      sender_role: 'artist',
      message: trimmed,
    });

    if (error) {
      setNotice(error.message);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          sender_user_id: userId,
          sender_role: 'artist',
          message: trimmed,
          created_at: new Date().toISOString(),
        },
      ]);
      setNewMessage('');
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Layout>
      <header className={styles.pageHeader}>
        <div className="container">
          <a href={ROUTES.artistJobWorkspace(projectId)} className={styles.backLink}>
            ← Back
          </a>
          <p className={styles.eyebrow}>Project Messages</p>
          <h1 className={styles.pageTitle}>{projectTitle || 'Conversation'}</h1>
          <p className={styles.pageSubtitle}>
            All communication stays inside De’Artisa Hub. Contact sharing is not permitted.
          </p>
        </div>
      </header>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.chatWrap}>

            {/* ── CHAT HISTORY ── */}
            <div className={styles.messagesList}>
              {loading && <p className={styles.notice}>Loading messages…</p>}
              {!loading && messages.length === 0 && (
                <p className={styles.emptyState}>No messages yet. Start the conversation below.</p>
              )}
              {messages.map((row) => {
                const isClient = row.sender_role === 'client';
                return (
                  <div
                    key={row.id}
                    className={`${styles.messageRow} ${isClient ? styles.messageRowClient : styles.messageRowArtist}`}
                  >
                    <div className={`${styles.bubble} ${isClient ? styles.bubbleClient : styles.bubbleArtist}`}>
                      <p className={styles.bubbleText}>{row.message}</p>
                      <span className={styles.bubbleTime}>
                        {new Date(row.created_at).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* ── NOTICE ── */}
            {notice && <p className={styles.notice}>{notice}</p>}

            {/* ── COMPOSER ── */}
            <div className={styles.composer}>
              <textarea
                className={styles.composerInput}
                rows={2}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write a message… (Enter to send)"
              />
              <button
                className={styles.sendBtn}
                onClick={handleSend}
                disabled={sending || !newMessage.trim()}
              >
                {sending ? 'Sending…' : 'Send →'}
              </button>
            </div>

          </div>
        </div>
      </section>
    </Layout>
  );
}
