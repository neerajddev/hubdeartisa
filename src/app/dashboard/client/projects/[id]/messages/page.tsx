'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout/Layout';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

interface MessageRow {
  id: string;
  sender_user_id: string;
  sender_role: string;
  message: string;
  created_at: string;
}

export default function ClientProjectMessagesPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const containsContactInfo = (value: string) => {
    const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
    const phoneRegex = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/;
    return emailRegex.test(value) || phoneRegex.test(value);
  };

  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user?.id) {
        setMessage('Please sign in to view messages.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('project_messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) {
        setMessage(error.message);
      } else {
        setMessages(data || []);
      }
      setLoading(false);
    };

    if (projectId) {
      load();
    }
  }, [projectId]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    if (containsContactInfo(newMessage)) {
      setMessage('Please remove phone numbers or emails from messages.');
      return;
    }

    setSending(true);
    setMessage(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) {
      setMessage('Please sign in.');
      setSending(false);
      return;
    }

    const { error } = await supabase.from('project_messages').insert({
      project_id: projectId,
      sender_user_id: userId,
      sender_role: 'client',
      message: newMessage.trim(),
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}`,
          sender_user_id: userId,
          sender_role: 'client',
          message: newMessage.trim(),
          created_at: new Date().toISOString(),
        },
      ]);
      setNewMessage('');
    }

    setSending(false);
  };

  return (
    <Layout>
      <header className={styles.pageHeader}>
        <div className="container">
          <button className={styles.backLink} onClick={() => router.back()}>← Dashboard</button>
          <p className={styles.eyebrow}>Project Messages</p>
          <h1 className={styles.pageTitle}>Conversation</h1>
          <p className={styles.pageSubtitle}>Keep all communication inside De’Artisa Hub.</p>
        </div>
      </header>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.chatWrap}>
            {loading ? (
              <p className={styles.notice}>Loading messages…</p>
            ) : (
              <div className={styles.messagesList}>
                {messages.length === 0 && (
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
              </div>
            )}

            <div className={styles.composer}>
              <textarea
                className={styles.composerInput}
                rows={2}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Write a message…"
              />
              <button
                className={styles.sendBtn}
                onClick={handleSend}
                disabled={sending || !newMessage.trim()}
              >
                {sending ? 'Sending…' : 'Send →'}
              </button>
            </div>
            {message && <p className={styles.notice}>{message}</p>}
          </div>
        </div>
      </section>
    </Layout>
  );
}
