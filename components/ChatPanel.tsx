'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import AppIcon from '@/components/AppIcon';
import {
  Send, Search, Clapperboard, Flame, TrendingUp, Clock,
  Cat, Gamepad2, Car, Code2, Leaf, UtensilsCrossed, Rocket,
  Music, Dumbbell, ChevronRight, Sparkles, Wifi, Film,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  time: Date;
}

interface Props {
  onSearch:     (query: string, nsfw: boolean) => void;
  loading:      boolean;
  nsfw:         boolean;
  onNsfwToggle: () => void;
  currentQuery: string;
  reelCount:    number;
}

const SUGGESTIONS = [
  { icon: <Cat size={11} />,             label: 'Lion videos',    q: 'find lion videos' },
  { icon: <Flame size={11} />,           label: 'Funny fails',    q: 'funny fail videos' },
  { icon: <Car size={11} />,             label: 'Car crashes',    q: 'car crashes dashcam' },
  { icon: <Code2 size={11} />,           label: 'Coding memes',   q: 'funny coding memes' },
  { icon: <Gamepad2 size={11} />,        label: 'Gaming clips',   q: 'epic gaming moments' },
  { icon: <Leaf size={11} />,            label: 'Nature',         q: 'stunning nature landscapes' },
  { icon: <UtensilsCrossed size={11} />, label: 'Cooking',        q: 'amazing cooking recipes' },
  { icon: <Rocket size={11} />,          label: 'Space',          q: 'space exploration videos' },
  { icon: <Music size={11} />,           label: 'Live music',     q: 'live music performance' },
  { icon: <Dumbbell size={11} />,        label: 'Sports',         q: 'sports amazing moments' },
] as const;

const NSFW_SUGGESTIONS = [
  { icon: <Flame size={11} />,    label: 'Hot & Trending',  q: 'hot nsfw trending content' },
  { icon: <TrendingUp size={11}/>,label: 'Top Rated',       q: 'top rated adult content' },
  { icon: <Film size={11} />,     label: 'Adult Videos',    q: 'adult nsfw videos top' },
  { icon: <Sparkles size={11} />, label: 'OnlyFans Style',  q: 'onlyfans style nsfw top' },
  { icon: <Dumbbell size={11} />, label: 'Gym Thirst Traps',q: 'gym thirst traps nsfw' },
  { icon: <Music size={11} />,    label: 'Dance Videos',    q: 'sexy dance videos nsfw top' },
  { icon: <Rocket size={11} />,   label: 'Wild Moments',    q: 'wild nsfw moments top reddit' },
  { icon: <Cat size={11} />,      label: 'Amateur',         q: 'amateur nsfw top reddit' },
] as const;

function md(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

export default function ChatPanel({ onSearch, loading, nsfw, onNsfwToggle, currentQuery, reelCount }: Props) {
  const WELCOME_NORMAL = '**Welcome to Reddit Reel AI!**\n\nTell me what you want to watch and I\'ll curate a personalised reel feed from Reddit.\n\nTry: *"find lion videos"*, *"funny fails"*, *"car crashes"*, or *"space exploration"*';
  const WELCOME_NSFW   = '**Welcome to Adult Mode** 🔞\n\nYou\'re now in unrestricted mode. I\'ll surface the top-rated 18+ content from Reddit — no filter, no limits.\n\nTry: *"hot trending nsfw"*, *"top amateur videos"*, *"wild moments"*, or *"thirst traps"*';

  const [messages, setMessages] = useState<Message[]>([{
    id: '0', role: 'assistant', time: new Date(),
    text: WELCOME_NORMAL,
  }]);
  const [input,    setInput]    = useState('');
  const [typing,   setTyping]   = useState(false);
  const [aiOnline, setAiOnline] = useState<boolean | null>(null);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const hasSent = messages.length > 1;

  /* Swap welcome message when NSFW is toggled (only if no search done yet) */
  useEffect(() => {
    setMessages(prev => {
      if (prev.length > 1) return prev; // user already chatted — don't overwrite
      return [{ id: '0', role: 'assistant', time: prev[0].time, text: nsfw ? WELCOME_NSFW : WELCOME_NORMAL }];
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nsfw]);

  /* Scroll messages to bottom */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  /* Probe Ollama once */
  useEffect(() => {
    fetch('/api/interpret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'test' }),
    })
      .then(r => r.json())
      .then(d => setAiOnline(d.aiEngine === 'ollama'))
      .catch(() => setAiOnline(false));
  }, []);

  const send = useCallback(async (override?: string) => {
    const q = (override ?? input).trim();
    if (!q || loading) return;
    setInput('');

    setMessages(p => [...p, { id: Date.now().toString(), role: 'user', text: q, time: new Date() }]);
    setTyping(true);

    try {
      const res  = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      setMessages(p => [...p, {
        id: (Date.now() + 1).toString(), role: 'assistant',
        text: data.chatResponse || `Searching for "${q}"…`,
        time: new Date(),
      }]);
      onSearch(q, nsfw);
    } catch {
      setMessages(p => [...p, {
        id: (Date.now() + 1).toString(), role: 'assistant',
        text: `Searching for **"${q}"** on Reddit…`,
        time: new Date(),
      }]);
      onSearch(q, nsfw);
    } finally {
      setTyping(false);
    }
  }, [input, loading, nsfw, onSearch]);

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  /* Auto-grow textarea */
  const onInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 90) + 'px';
    setInput(el.value);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <header style={{
        padding: '16px 18px 14px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        {/* Brand row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <AppIcon size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="font-display" style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-.4px', lineHeight: 1.2 }}>
              Reddit Reel <span className="gradient-text">AI</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>AI-powered video discovery</div>
          </div>
          {/* AI engine badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            {aiOnline === true && (
              <><Wifi size={12} color="var(--accent)" /><span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700 }}>AI</span></>
            )}
          </div>
        </div>

        {/* Controls row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* NSFW toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1 }}>
            <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>NSFW</span>
            <button
              id="nsfw-toggle"
              onClick={onNsfwToggle}
              className="toggle"
              aria-label="Toggle NSFW content"
              style={{ background: nsfw ? 'var(--accent)' : 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <div className="toggle-thumb" style={{ left: nsfw ? 22 : 3 }} />
            </button>
          </div>

          {/* Reel count removed */}
        </div>

        {/* Current query */}
        {currentQuery && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
            <Search size={11} color="var(--text-3)" />
            <span style={{ fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentQuery.length > 40 ? currentQuery.slice(0, 40) + '…' : currentQuery}
            </span>
          </div>
        )}
      </header>

      {/* ── Messages ── */}
      <div className="scroll-thin" style={{
        flex: 1, overflowY: 'auto', padding: '14px 16px',
        display: 'flex', flexDirection: 'column', gap: 10,
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        {messages.map((m, i) => (
          <div
            key={m.id}
            className="anim-fadeUp"
            style={{ animationDelay: `${i * 0.03}s`, display: 'flex', flexDirection: 'column', gap: 3,
              alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}
          >
            <div className={m.role === 'user' ? 'msg-user' : 'msg-bot'}>
              <span dangerouslySetInnerHTML={{ __html: md(m.text) }} />
            </div>
            <time style={{ fontSize: 10, color: 'var(--text-3)', paddingInline: 4 }}>
              {m.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </time>
          </div>
        ))}

        {/* Typing dots */}
        {typing && (
          <div className="anim-fadeIn">
            <div className="msg-bot" style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '10px 14px' }}>
              {[0,1,2].map(i => (
                <div key={i} className="typing-dot" style={{
                  width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)',
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Suggestions (only before first search) ── */}
      {!hasSent && (
        <div style={{ padding: '0 16px 12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
            <Sparkles size={11} color="var(--text-3)" />
            <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase' }}>
              {nsfw ? 'Adult Quick Searches' : 'Quick Searches'}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(nsfw ? NSFW_SUGGESTIONS : SUGGESTIONS).map(s => (
              <button key={s.q} className="pill" onClick={() => send(s.q)} disabled={loading}>
                {s.icon}{s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sort filters (after first search) */}
      {hasSent && !loading && (
        <div style={{ padding: '0 16px 10px', display: 'flex', gap: 6, flexShrink: 0 }}>
          {[
            { icon: <Flame size={11} />,      label: 'Hot', suffix: 'hot' },
            { icon: <TrendingUp size={11} />,  label: 'Top', suffix: 'top' },
            { icon: <Clock size={11} />,       label: 'New', suffix: 'new' },
          ].map(s => (
            <button key={s.suffix} className="pill" style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => currentQuery && send(`${currentQuery} ${s.suffix}`)}>
              {s.icon}{s.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Input bar ── */}
      <footer style={{
        padding: '10px 14px 14px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-surface)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            id="chat-input"
            value={input}
            onChange={onInput}
            onKeyDown={onKey}
            placeholder={nsfw ? 'What adult content do you want?' : 'What do you want to watch?'}
            rows={1}
            className="chat-input"
          />
          <button
            id="send-btn"
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="btn-send"
            aria-label="Send"
          >
            {loading
              ? <div className="spinner spinner-sm anim-spin" />
              : <ChevronRight size={18} />}
          </button>
        </div>
        <p style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'center', marginTop: 6 }}>
          Enter to search · Shift+Enter for new line
        </p>
      </footer>
    </div>
  );
}
