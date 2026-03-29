'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Users, Film, StickyNote, Activity, Shield, TrendingUp,
  Search, Trash2, UserCheck, UserX, Eye, X, BarChart2,
  ChevronRight, Hash, Clock, Send, Download,
} from 'lucide-react';
import { deleteUserAction, suspendUserAction, activateUserAction, getUserDetail } from '@/app/actions/admin';
import ReelFeed from '@/components/ReelFeed';
import type { ReelPost } from '@/app/api/reddit/route';

/* ── Types ── */
type View = 'overview' | 'users' | 'analytics' | 'content' | 'reels' | 'settings';

interface StatCard { label: string; value: number; icon: React.ReactNode; accent?: boolean; }
interface User {
  id: string; name: string | null; email: string | null;
  role: string; createdAt: string; suspended: boolean;
  _count: { savedReels: number; notes: number; activities: number };
}
interface Stats {
  usersCount: number; reelsCount: number; notesCount: number;
  dau: number; nsfwCount: number; sfwCount: number;
  subreddits: Array<{ subreddit: string; _count: { _all: number } }>;
  mostSearchedQueries: Array<{ id: string; query: string; hits: number }>;
  userGrowth: Array<{ date: string; count: number }>;
  recentUsers: User[];
}

/* ── Stat card ── */
function Stat({ label, value, icon, accent }: StatCard) {
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: `1px solid ${accent ? 'var(--accent-border)' : 'var(--border)'}`,
      borderRadius: 14, padding: '18px 20px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: accent ? 'var(--accent-subtle)' : 'var(--bg-hover)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: accent ? 'var(--accent)' : 'var(--text-2)',
        }}>{icon}</div>
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-1)', lineHeight: 1 }}>{value.toLocaleString()}</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}

/* ── NEW: SVG Line Chart ── */
function LineChart({ data, label }: { data: Array<{ date: string; count: number }>; label: string }) {
  const width = 500;
  const height = 180;
  const padding = { top: 20, right: 20, bottom: 25, left: 35 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  if (!data.length) return <div style={{ color: 'var(--text-3)', textAlign: 'center', padding: 40 }}>No data</div>;

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const minCount = Math.min(...data.map(d => d.count), 0);
  const yScale = (count: number) => innerHeight - ((count - minCount) / (maxCount - minCount || 1)) * innerHeight;

  const points = data.map((d, i) => {
    const x = data.length > 1 ? (i / (data.length - 1)) * innerWidth : innerWidth / 2;
    const y = yScale(d.count);
    return `${x},${y}`;
  }).join(' ');

  // Show unique ticks from first, middle, and last date on x‑axis
  const indices = data.length > 1
    ? Array.from(new Set([0, Math.floor((data.length - 1) / 2), data.length - 1]))
    : [0];

  const xTicks = indices.map(idx => ({
    label: data[idx].date.slice(5), // "MM-DD"
    x: data.length > 1 ? (idx / (data.length - 1)) * innerWidth : innerWidth / 2,
  }));

  // Y‑axis ticks (min, middle, max)
  const yTicks = [minCount, (minCount + maxCount) / 2, maxCount].map((val, i) => ({
    value: Math.round(val),
    y: yScale(val),
    id: i, // stable key
  }));

  return (
    <div>
      <p style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</p>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
        {/* Grid lines (horizontal) */}
        {yTicks.map(({ y, value, id }) => (
          <g key={id}>
            <line x1={padding.left} y1={y + padding.top} x2={width - padding.right} y2={y + padding.top} stroke="var(--border)" strokeWidth="1" strokeDasharray="3,3" />
            <text x={padding.left - 6} y={y + padding.top + 3} fill="var(--text-3)" fontSize={10} textAnchor="end">{value}</text>
          </g>
        ))}

        {/* Axes */}
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="var(--border)" strokeWidth="1" />
        <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="var(--border)" strokeWidth="1" />

        {/* Line */}
        <polyline points={points} fill="none" stroke="var(--accent)" strokeWidth="2" transform={`translate(${padding.left}, ${padding.top})`} />

        {/* Data points (circles) */}
        {data.map((d, i) => {
          const x = data.length > 1 ? (i / (data.length - 1)) * innerWidth : innerWidth / 2;
          const y = yScale(d.count);
          return (
            <circle
              key={`${d.date}-${i}`}
              cx={x + padding.left}
              cy={y + padding.top}
              r="3"
              fill="var(--accent)"
              stroke="var(--bg-surface)"
              strokeWidth="1.5"
            >
              <title>{`${d.date}: ${d.count} users`}</title>
            </circle>
          );
        })}

        {/* X‑axis ticks */}
        {xTicks.map((tick, i) => (
          <text key={`${tick.label}-${i}`} x={tick.x + padding.left} y={height - padding.bottom + 16} fill="var(--text-3)" fontSize={10} textAnchor="middle">{tick.label}</text>
        ))}
      </svg>
    </div>
  );
}

/* ── User detail modal ── */
function UserModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof getUserDetail>> | null>(null);
  const [tab, setTab] = useState<'reels' | 'notes' | 'activity'>('reels');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserDetail(userId).then(d => { setData(d); setLoading(false); });
  }, [userId]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 720, maxHeight: '85vh',
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 20, display: 'flex', flexDirection: 'column',
        boxShadow: '0 32px 80px rgba(0,0,0,.6)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)' }}>{data?.name ?? '…'}</h2>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{data?.email}</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={15} />
          </button>
        </div>

        {/* Info row */}
        {data && (
          <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 24, flexShrink: 0, flexWrap: 'wrap' }}>
            {[
              { label: 'Role', value: data.role },
              { label: 'Status', value: data.suspended ? '🔴 Suspended' : '🟢 Active' },
              { label: 'Joined', value: new Date(data.createdAt).toLocaleDateString() },
              { label: 'Saved Reels', value: data.reels.length },
              { label: 'Notes', value: data.notes.length },
              { label: 'Activities', value: data.activities.length },
            ].map(i => (
              <div key={i.label}>
                <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{i.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginTop: 2 }}>{i.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          {(['reels', 'notes', 'activity'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer',
              background: 'transparent', fontSize: 12, fontWeight: 700,
              color: tab === t ? 'var(--accent)' : 'var(--text-3)',
              borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`,
              textTransform: 'capitalize', transition: 'color .15s',
            }}>{t}</button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {loading && <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Loading…</p>}
          {data && tab === 'reels' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.reels.length === 0 && <p style={{ color: 'var(--text-3)', fontSize: 13 }}>No saved reels.</p>}
              {data.reels.map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-3)' }}>r/{r.subreddit} · {r.isNsfw ? '🔞 NSFW' : 'SFW'}</p>
                  </div>
                  <a href={r.permalink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: 11, fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>
                    <Eye size={14} />
                  </a>
                </div>
              ))}
            </div>
          )}
          {data && tab === 'notes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.notes.length === 0 && <p style={{ color: 'var(--text-3)', fontSize: 13 }}>No notes.</p>}
              {data.notes.map(n => (
                <div key={n.id} style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 13, color: 'var(--text-1)', whiteSpace: 'pre-wrap' }}>{n.text}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 6 }}>{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
          {data && tab === 'activity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {data.activities.length === 0 && <p style={{ color: 'var(--text-3)', fontSize: 13 }}>No activity.</p>}
              {data.activities.map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <Activity size={12} color="var(--accent)" />
                  <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>{a.type}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 'auto' }}>{new Date(a.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions footer */}
        {data && (
          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, flexShrink: 0 }}>
            <form action={async () => { data.suspended ? await activateUserAction(data.id) : await suspendUserAction(data.id); onClose(); }}>
              <button type="submit" style={{
                padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12,
                background: data.suspended ? 'rgba(34,197,94,.15)' : 'rgba(251,191,36,.15)',
                color: data.suspended ? '#22c55e' : '#fbbf24',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {data.suspended ? <><UserCheck size={13} /> Activate</> : <><UserX size={13} /> Suspend</>}
              </button>
            </form>
            {data.role !== 'ADMIN' && (
              <form action={async () => { await deleteUserAction(data.id); onClose(); }}>
                <button type="submit" style={{
                  padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12,
                  background: 'rgba(239,68,68,.15)', color: '#ef4444',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Trash2 size={13} /> Delete User
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Admin Reel Viewer ── */
interface Pagination {
  subs: string; subIdx: number; after: string | null;
  sortCycle: number; seenIds: Set<string>;
}

function AdminReelViewer() {
  const [reels,   setReels]   = useState<ReelPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [input,   setInput]   = useState('');
  const [query,   setQuery]   = useState('');
  const [nsfw,    setNsfw]    = useState(false);

  const pagRef     = useRef<Pagination>({ subs: '', subIdx: 0, after: null, sortCycle: 0, seenIds: new Set() });
  const loadingRef = useRef(false);
  const lastId     = useRef(0);

  const fetchReels = useCallback(async (
    q: string, isNsfw: boolean, pag: Pagination, append: boolean, retry = 0, fid?: number
  ) => {
    if (loadingRef.current && retry === 0 && append) return;
    const currentId = fid ?? ++lastId.current;
    if (retry === 0) { loadingRef.current = true; setLoading(true); }

    try {
      const params = new URLSearchParams({
        query: q, nsfw: String(isNsfw), limit: '12',
        subIdx: String(pag.subIdx), sortCycle: String(pag.sortCycle),
        ...(pag.subs  ? { subs:  pag.subs }  : {}),
        ...(pag.after ? { after: pag.after }  : {}),
        ...(pag.seenIds.size ? { seenIds: [...pag.seenIds].slice(-200).join(',') } : {}),
      });
      const res  = await fetch(`/api/reddit?${params}`);
      const data = await res.json();
      if (currentId !== lastId.current) return;

      if (data.success && data.reels?.length > 0) {
        const p = data.pagination;
        const seen = new Set(pag.seenIds);
        data.reels.forEach((r: ReelPost) => seen.add(r.id));
        pagRef.current = { subs: p.subs ?? pag.subs, subIdx: p.subIdx ?? 0, after: p.after ?? null, sortCycle: p.sortCycle ?? 0, seenIds: seen };
        setReels(prev => append ? [...prev, ...data.reels] : data.reels);
      } else if (data.success && retry < 6 && data.pagination) {
        const p = data.pagination;
        await fetchReels(q, isNsfw, { ...pag, subs: p.subs ?? pag.subs, subIdx: p.subIdx ?? 0, after: p.after ?? null, sortCycle: p.sortCycle ?? 0 }, append, retry + 1, currentId);
      }
    } catch { /* silent */ } finally {
      if (retry === 0 && currentId === lastId.current) { setLoading(false); loadingRef.current = false; }
    }
  }, []);

  const doSearch = useCallback((q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    setReels([]);
    pagRef.current = { subs: '', subIdx: 0, after: null, sortCycle: 0, seenIds: new Set() };
    fetchReels(q, nsfw, pagRef.current, false);
  }, [fetchReels, nsfw]);

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') doSearch(input);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* ── Header row: title left, search right ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-1)', marginBottom: 4 }}>Browse Reels</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Preview content — no activity logged</p>
        </div>

        {/* Search controls */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Input */}
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Search reels…"
              style={{
                paddingLeft: 32, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
                borderRadius: 10, border: '1px solid var(--border)',
                background: 'var(--bg-elevated)', color: 'var(--text-1)',
                fontSize: 13, outline: 'none', width: 220, boxSizing: 'border-box',
                transition: 'border-color .2s',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Search button */}
          <button
            onClick={() => doSearch(input)}
            disabled={!input.trim() || loading}
            style={{
              height: 38, padding: '0 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
              opacity: (!input.trim() || loading) ? 0.5 : 1, transition: 'opacity .2s',
            }}
          >
            <Send size={13} /> Search
          </button>

          {/* NSFW toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 12px', height: 38, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-elevated)', flexShrink: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>NSFW</span>
            <button
              onClick={() => setNsfw(n => !n)}
              style={{ width: 34, height: 19, borderRadius: 100, border: 'none', cursor: 'pointer', position: 'relative', background: nsfw ? 'var(--accent)' : 'var(--bg-hover)', transition: 'background .2s', flexShrink: 0 }}
            >
              <div style={{ position: 'absolute', top: 2, left: nsfw ? 17 : 2, width: 15, height: 15, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Empty state ── */}
      {!query && !loading && (
        <div style={{ height: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-3)', background: 'var(--bg-elevated)', borderRadius: 14, border: '1px solid var(--border)' }}>
          <Film size={36} strokeWidth={1} />
          <p style={{ fontSize: 14, fontWeight: 600 }}>Search to preview reels</p>
          <p style={{ fontSize: 12 }}>No activity is logged for admin preview sessions</p>
        </div>
      )}

      {/* ── Reel — phone-sized card, centered ── */}
      {(query || loading) && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: 380, height: 680,
            borderRadius: 20, overflow: 'hidden',
            border: '1px solid var(--border)',
            boxShadow: '0 24px 60px rgba(0,0,0,.5)',
            flexShrink: 0,
          }}>
            <ReelFeed
              reels={reels}
              loading={loading}
              onLoadMore={() => fetchReels(query, nsfw, pagRef.current, true)}
              savedIds={new Set()}
              onSaveReel={() => {}}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main dashboard client ── */
export default function AdminDashboardClient({ stats, view }: { stats: Stats; view: string }) {
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const filtered = stats.recentUsers.filter(u =>
    !userSearch || u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Overview ── */}
      {(view === 'overview' || !view) && (
        <>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-1)', marginBottom: 4 }}>Platform Overview</h1>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Real-time snapshot of your platform</p>
          </div>

          {/* Stat grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 28 }}>
            <Stat label="Total Users"   value={stats.usersCount}  icon={<Users size={16} />}      accent />
            <Stat label="Saved Reels"   value={stats.reelsCount}  icon={<Film size={16} />} />
            <Stat label="Notes"         value={stats.notesCount}  icon={<StickyNote size={16} />} />
            <Stat label="DAU (24h)"     value={stats.dau}         icon={<Activity size={16} />}   accent />
            <Stat label="NSFW Content"  value={stats.nsfwCount}   icon={<Shield size={16} />} />
            <Stat label="SFW Content"   value={stats.sfwCount}    icon={<TrendingUp size={16} />} />
          </div>

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
              <LineChart data={stats.userGrowth} label="User Growth (last 14 days)" />
            </div>
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
              <p style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Top Searches</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {stats.mostSearchedQueries.map((q, i) => (
                  <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', width: 16, textAlign: 'right' }}>{i + 1}</span>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg-hover)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 3, background: 'var(--accent)', width: `${(q.hits / (stats.mostSearchedQueries[0]?.hits || 1)) * 100}%` }} />
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, minWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.query}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', minWidth: 28, textAlign: 'right' }}>{q.hits}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top subreddits */}
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
            <p style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 700, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Most Saved Subreddits</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {stats.subreddits.map(s => (
                <div key={s.subreddit} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 100, background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                  <Hash size={10} color="var(--accent)" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>{s.subreddit}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{s._count._all}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Users ── */}
      {view === 'users' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-1)', marginBottom: 4 }}>Users</h1>
              <p style={{ fontSize: 13, color: 'var(--text-3)' }}>{stats.usersCount} total accounts</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => window.open('/api/admin/export/users')}
                style={{
                  height: 38, padding: '0 16px', borderRadius: 10, border: '1px solid var(--border)',
                  background: 'var(--bg-elevated)', color: 'var(--text-1)', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'background .2s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)'}
              >
                <Download size={14} /> Export CSV
              </button>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                <input
                  value={userSearch} onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search users…"
                  style={{ paddingLeft: 34, paddingRight: 14, paddingTop: 9, paddingBottom: 9, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-1)', fontSize: 13, outline: 'none', width: 220 }}
                />
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-hover)', borderBottom: '1px solid var(--border)' }}>
                  {['User', 'Role', 'Status', 'Joined', 'Content', ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: h === '' ? 'right' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background .1s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                          {(u.name ?? u.email ?? '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{u.name ?? '—'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: u.role === 'ADMIN' ? 'rgba(59,130,246,.15)' : 'var(--bg-hover)', color: u.role === 'ADMIN' ? '#60a5fa' : 'var(--text-2)' }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: u.suspended ? 'rgba(239,68,68,.12)' : 'rgba(34,197,94,.12)', color: u.suspended ? '#ef4444' : '#22c55e' }}>
                        {u.suspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text-3)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} />
                        {new Date(u.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text-3)' }}>
                      {u._count.savedReels} reels · {u._count.notes} notes
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button onClick={() => setSelectedUser(u.id)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-1)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <Eye size={12} /> View <ChevronRight size={11} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No users found.</div>
            )}
          </div>
        </>
      )}

      {/* ── Analytics ── */}
      {view === 'analytics' && (
        <>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-1)', marginBottom: 4 }}>Analytics</h1>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Platform usage and growth metrics</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 14, padding: 24 }}>
              <LineChart data={stats.userGrowth} label="User Registrations (last 14 days)" />
            </div>
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 14, padding: 24 }}>
              <p style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Content Distribution</p>
              <div style={{ display: 'flex', gap: 16 }}>
                {[
                  { label: 'SFW', value: stats.sfwCount, color: '#22c55e' },
                  { label: 'NSFW', value: stats.nsfwCount, color: 'var(--accent)' },
                ].map(item => {
                  const pct = stats.reelsCount ? Math.round((item.value / stats.reelsCount) * 100) : 0;
                  return (
                    <div key={item.label} style={{ flex: 1, background: 'var(--bg-hover)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                      <div style={{ fontSize: 28, fontWeight: 900, color: item.color }}>{pct}%</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, marginTop: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{item.value.toLocaleString()} reels</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 14, padding: 24 }}>
            <p style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Search Trends</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.mostSearchedQueries.map((q, i) => {
                const pct = (q.hits / (stats.mostSearchedQueries[0]?.hits || 1)) * 100;
                return (
                  <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-3)', width: 20, textAlign: 'right', fontWeight: 700 }}>#{i + 1}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', width: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.query}</span>
                    <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--bg-hover)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 4, background: 'var(--accent)', width: `${pct}%`, transition: 'width .4s' }} />
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-3)', width: 40, textAlign: 'right' }}>{q.hits}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ── NSFW/SFW Content ── */}
      {view === 'content' && (
        <>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-1)', marginBottom: 4 }}>Content Moderation</h1>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>NSFW vs SFW content breakdown</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
            <Stat label="Total Reels"  value={stats.reelsCount}  icon={<Film size={16} />} />
            <Stat label="SFW Reels"    value={stats.sfwCount}    icon={<TrendingUp size={16} />} />
            <Stat label="NSFW Reels"   value={stats.nsfwCount}   icon={<Shield size={16} />} accent />
          </div>
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 14, padding: 24 }}>
            <p style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Content Ratio</p>
            <div style={{ height: 20, borderRadius: 10, overflow: 'hidden', background: 'var(--bg-hover)', display: 'flex' }}>
              <div style={{ width: `${stats.reelsCount ? (stats.sfwCount / stats.reelsCount) * 100 : 50}%`, background: '#22c55e', transition: 'width .5s' }} />
              <div style={{ flex: 1, background: 'var(--accent)' }} />
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: '#22c55e' }} /><span style={{ fontSize: 12, color: 'var(--text-2)' }}>SFW ({stats.reelsCount ? Math.round((stats.sfwCount / stats.reelsCount) * 100) : 0}%)</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent)' }} /><span style={{ fontSize: 12, color: 'var(--text-2)' }}>NSFW ({stats.reelsCount ? Math.round((stats.nsfwCount / stats.reelsCount) * 100) : 0}%)</span></div>
            </div>
          </div>
        </>
      )}

      {/* ── Browse Reels ── */}
      {view === 'reels' && <AdminReelViewer />}

      {/* ── Settings ── */}
      {view === 'settings' && (
        <>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-1)', marginBottom: 4 }}>Settings</h1>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Platform configuration</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Platform Name', value: 'Reddit Reel AI', desc: 'Displayed in the header and emails' },
              { label: 'Default User Role', value: 'USER', desc: 'Role assigned to new registrations' },
              { label: 'NSFW Mode', value: 'User-controlled', desc: 'Users can toggle NSFW content themselves' },
              { label: 'Max Saved Reels', value: 'Unlimited', desc: 'Per-user saved reel limit' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{s.desc}</div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-subtle)', padding: '4px 10px', borderRadius: 6 }}>{s.value}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* User detail modal */}
      {selectedUser && (
        <UserModal userId={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  );
}