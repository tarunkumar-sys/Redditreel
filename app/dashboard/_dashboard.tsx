'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { MessageCircle, BookMarked, Flame } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import { useToast } from '@/components/ToastContext';
import ChatPanel from '../../components/ChatPanel';
import ReelFeed  from '../../components/ReelFeed';
import Notepad from '../../components/Notepad';
import { getSavedReelsAction, saveReelToDbAction, removeReelFromDbAction } from '../actions/db';
import type { ReelPost }  from '../api/reddit/route';
import type { SavedReel } from '../../components/Notepad';

/* ── Types ── */
type ToastType   = 'success' | 'error' | 'info';
interface Toast   { id: string; msg: string; type: ToastType; }
type MobileTab   = 'chat' | 'feed' | 'notes';
type SidebarView = 'chat' | 'notepad';

/* Feed engine pagination state */
interface Pagination {
  subs:    string;         // comma-separated pool snapshot
  seenIds: Set<string>;    // all IDs shown so far (dedup)
}

export default function DashboardPage({ avatar }: { avatar?: React.ReactNode }) {
  const [reels,       setReels]       = useState<ReelPost[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [nsfw,        setNsfw]        = useState(false);
  const [query,       setQuery]       = useState('');
  const [mobileTab,   setMobileTab]   = useState<MobileTab>('chat');
  const [sidebarView, setSidebarView] = useState<SidebarView>('chat');
  const [savedReels,  setSavedReels]  = useState<SavedReel[]>([]);
  const { addToast } = useToast();
  const [showNsfwModal, setShowNsfwModal] = useState(false);
  const [reelToSave, setReelToSave] = useState<ReelPost | null>(null);
  const [saveTagInput, setSaveTagInput] = useState('');

  const queryRef = useRef('');
  const nsfwRef  = useRef(false);
  const pagRef   = useRef<Pagination>({ subs: '', seenIds: new Set() });
  const loadingRef = useRef(false);
  const lastFetchId = useRef(0);


  /* Hydrate saved reels from DB */
  useEffect(() => {
    getSavedReelsAction().then(setSavedReels).catch(() => {});
  }, []);

  /* ── Core fetch helper ── */
  const fetchReels = useCallback(async (
    q: string,
    isNsfw: boolean,
    pag: Pagination,
    append: boolean,
    retryCount: number = 0,
    overrideFetchId?: number
  ) => {
    if (loadingRef.current && retryCount === 0 && append) return;

    const currentId = overrideFetchId ?? ++lastFetchId.current;

    if (retryCount === 0) {
      loadingRef.current = true;
      setLoading(true);
    }

    try {
      const params = new URLSearchParams({
        query:  q,
        nsfw:   String(isNsfw),
        limit:  '25',
        ...(pag.subs    ? { subs:    pag.subs }                                    : {}),
        ...(pag.seenIds.size ? { seenIds: [...pag.seenIds].slice(-300).join(',') } : {}),
      });

      const res  = await fetch(`/api/reddit?${params}`);
      const data = await res.json();

      if (currentId !== lastFetchId.current) return;

      if (data.success && data.reels?.length > 0) {
        const newReels: ReelPost[] = data.reels;
        const updatedSeen = new Set(pag.seenIds);
        newReels.forEach((r: ReelPost) => updatedSeen.add(r.id));
        // Also absorb any extra preloaded IDs returned by the server
        if (data.pagination?.newSeenIds) {
          data.pagination.newSeenIds.split(',').filter(Boolean).forEach((id: string) => updatedSeen.add(id));
        }
        pagRef.current = {
          subs:    data.pagination?.subs ?? pag.subs,
          seenIds: updatedSeen,
        };
        setReels(prev => append ? [...prev, ...newReels] : newReels);
        if (!append) setMobileTab('feed');
      } else if (data.success && retryCount < 3) {
        // Pool returned nothing — retry with cleared seenIds to avoid deadlock
        const freshPag = { ...pag, seenIds: new Set<string>() };
        await fetchReels(q, isNsfw, freshPag, append, retryCount + 1, currentId);
      }
    } catch {
      // silent
    } finally {
      if (retryCount === 0 && currentId === lastFetchId.current) {
        setLoading(false);
        loadingRef.current = false;
      }
    }
  }, []);

  const onSearch = useCallback(async (q: string, isNsfw: boolean) => {
    setQuery(q);
    setReels([]);
    queryRef.current = q;
    nsfwRef.current  = isNsfw;
    pagRef.current = { subs: '', seenIds: new Set() };
    await fetchReels(q, isNsfw, pagRef.current, false);
  }, [fetchReels]);

  const onLoadMore = useCallback(async () => {
    await fetchReels(queryRef.current, nsfwRef.current, pagRef.current, true);
  }, [fetchReels]);

  // Track watch events for personalization weights
  const onWatchReel = useCallback((subreddit: string) => {
    fetch('/api/reddit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'watch', subreddit }),
    }).catch(() => {});
  }, []);


  const toggleNsfw = useCallback(() => {
    if (nsfwRef.current) {
      setNsfw(false);
      nsfwRef.current = false;
      onSearch(queryRef.current, false);
      return;
    }
    const expiry = localStorage.getItem('nsfw-consent-expiry');
    if (expiry && parseInt(expiry) > Date.now()) {
      setNsfw(true);
      nsfwRef.current = true;
      onSearch(queryRef.current, true);
    } else {
      setShowNsfwModal(true);
    }
  }, [onSearch]);

  const confirmNsfw = () => {
    localStorage.setItem('nsfw-consent-expiry', (Date.now() + 24 * 60 * 60 * 1000).toString());
    setNsfw(true);
    nsfwRef.current = true;
    setShowNsfwModal(false);
    onSearch(queryRef.current, true);
  };

  const onSaveReel = useCallback(async (reel: ReelPost) => {
    const already = savedReels.some(r => r.id === reel.id);
    try {
      if (already) {
        await removeReelFromDbAction(reel.id);
        setSavedReels(prev => prev.filter(r => r.id !== reel.id));
      } else {
        setReelToSave(reel);
      }
    } catch { /* ignore */ }
  }, [savedReels, addToast]);

  const confirmSaveReel = async () => {
    if (!reelToSave) return;
    const tagList = saveTagInput.trim() ? [saveTagInput.trim()] : [];
    try {
      const dbReel = await saveReelToDbAction(reelToSave, tagList);
      if (dbReel && 'error' in dbReel) return;
      setSavedReels(prev => [{ ...reelToSave, savedAt: dbReel.savedAt.getTime(), tags: tagList }, ...prev]);
      addToast('Reel saved to Notepad!', 'success');
      setReelToSave(null);
      setSaveTagInput('');
    } catch { /* ignore */ }
  };

  const onRemoveReel = useCallback(async (id: string) => {
    try {
      await removeReelFromDbAction(id);
      setSavedReels(prev => prev.filter(r => r.id !== id));
    } catch { /* ignore */ }
  }, []);

  const onUpdateReel = useCallback((updated: SavedReel) => {
    setSavedReels(prev => prev.map(r => r.id === updated.id ? updated : r));
  }, []);

  const onReelClick = useCallback((reel: SavedReel) => {
    // Put the clicked reel at the front of the feed and switch to feed view
    setReels(prev => {
      const without = prev.filter(r => r.id !== reel.id);
      return [reel, ...without];
    });
    setMobileTab('feed');
  }, []);

  const savedIds = new Set(savedReels.map(r => r.id));
  const openNotepad = () => { setSidebarView('notepad'); setMobileTab('notes'); };
  const openChat    = () => { setSidebarView('chat');    if (mobileTab === 'notes') setMobileTab('chat'); };

  return (
    <div className={`app-shell${nsfw ? ' nsfw-mode' : ''}`}>
      {avatar}

      {/* ══ LEFT: Sidebar ══ */}
      <aside className={`app-sidebar${mobileTab === 'feed' ? ' tab-hidden' : ''}`}>
        <div className="sidebar-tabs">
          <button
            className={`sidebar-tab${sidebarView === 'chat' ? ' is-active' : ''}`}
            onClick={openChat}
          >
            <MessageCircle size={13} /> Chat
          </button>
          <button
            className={`sidebar-tab${sidebarView === 'notepad' ? ' is-active' : ''}`}
            onClick={openNotepad}
          >
            <BookMarked size={13} /> Notepad
          </button>        </div>

        {sidebarView === 'chat' && (
          <ChatPanel
            onSearch={onSearch}
            loading={loading}
            nsfw={nsfw}
            onNsfwToggle={toggleNsfw}
            currentQuery={query}
          />
        )}
        {sidebarView === 'notepad' && (
          <Notepad savedReels={savedReels} onRemoveReel={onRemoveReel} onUpdateReel={onUpdateReel} onReelClick={onReelClick} />
        )}
      </aside>

      {/* ══ RIGHT: Reel feed ══ */}
      <main className={`app-feed${mobileTab === 'chat' || mobileTab === 'notes' ? ' tab-hidden' : ''}`}>
        <ReelFeed
          reels={reels}
          loading={loading}
          onLoadMore={onLoadMore}
          savedIds={savedIds}
          onSaveReel={onSaveReel}
        />
      </main>

      {/* ══ MOBILE: Bottom tab bar ══ */}
      <nav className="app-tabbar">
        <button id="tab-chat"
          className={`tab-btn${mobileTab === 'chat' ? ' is-active' : ''}`}
          onClick={openChat} aria-label="Chat">
          <MessageCircle size={20} /><span>Chat</span>
        </button>
        <button id="tab-feed"
          className={`tab-btn${mobileTab === 'feed' ? ' is-active' : ''}`}
          onClick={() => setMobileTab('feed')} aria-label="Reels">
          <AppIcon size={20} /><span>Reels</span>
        </button>
        <button id="tab-notes"
          className={`tab-btn${mobileTab === 'notes' ? ' is-active' : ''}`}
          onClick={openNotepad} aria-label="Notepad">
          <BookMarked size={20} /><span>Notepad</span>
        </button>
      </nav>

      {/* ══ Adult Consent Modal ══ */}
      {showNsfwModal && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="anim-fadeUp" style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--accent-border)',
            borderRadius: 16, padding: '24px 28px', maxWidth: 400, width: '100%',
            textAlign: 'center', boxShadow: '0 10px 40px rgba(255,45,85,.15)',
          }}>
            <Flame size={44} color="var(--accent)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: '#fff' }}>Age Verification</h2>
            <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 24 }}>
              This mode contains unfiltered adult content (18+). By proceeding, you confirm that you are over 18 and consent to viewing such material.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowNsfwModal(false)}
                style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-1)', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmNsfw}
                style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px var(--accent-glow)' }}
              >
                I am 18+
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Save Sheet Modal ══ */}
      {reelToSave && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'
        }} onClick={() => setReelToSave(null)}>
          <div className="anim-fadeUp" onClick={e => e.stopPropagation()} style={{
            background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)',
            borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: '24px 20px 32px',
            boxShadow: '0 -10px 40px rgba(0,0,0,.5)',
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Save Reel</h3>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 12 }}>Add an optional tag (e.g., Hilarious, Watch later)</p>
            <input
              autoFocus
              type="text"
              value={saveTagInput}
              onChange={e => setSaveTagInput(e.target.value)}
              onKeyDown={e => { if(e.key === 'Enter') confirmSaveReel() }}
              placeholder="Type a tag..."
              className="chat-input"
              style={{ width: '100%', marginBottom: 16, height: 44, alignSelf: 'stretch' }}
            />
            <button
              onClick={confirmSaveReel}
              style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
            >
              Save to Notepad
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
