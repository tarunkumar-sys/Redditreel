'use client';

import { useEffect, useRef, useState, useCallback, memo } from 'react';
import {
  Heart, MessageCircle, ExternalLink, Volume2, VolumeX,
  ArrowBigUp, Play, Film, Image as Img, Flame,
  AlertCircle, Share2, ChevronDown, Bookmark,
} from 'lucide-react';
import type { ReelPost } from '../app/api/reddit/route';

/* ── Helpers ── */
const fmt = (n: number) =>
  n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(n);

const ago = (utc: number) => {
  if (typeof window === 'undefined') {
    // Server-side: return a placeholder
    return 'recently';
  }
  const s = Date.now() / 1000 - utc;
  if (s < 3600)   return `${Math.floor(s / 60)}m ago`;
  if (s < 86400)  return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return `${Math.floor(s / 604800)}w ago`;
};

const hsl = (s: string) => (s.charCodeAt(0) * 37 + (s.charCodeAt(1) || 0) * 13) % 360;

/* ════════════════════════════════════════
   Single Reel (memoised for perf)
════════════════════════════════════════ */
interface SlideProps {
  reel:       ReelPost;
  isActive:   boolean;
  preload:    boolean;
  index:      number;
  isSaved:    boolean;
  onSave:     (reel: ReelPost) => void;
  onSkip:     () => void;
}

const ReelSlide = memo(function ReelSlide({ reel, isActive, preload, index, isSaved, onSave, onSkip }: SlideProps) {
  const vidRef = useRef<HTMLVideoElement>(null);
  const [muted,     setMuted]     = useState(true);
  const [playing,   setPlaying]   = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [liked,     setLiked]     = useState(false);
  const [heart,     setHeart]     = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [vidErr,    setVidErr]    = useState(false);
  const [imgErr,    setImgErr]    = useState(false);

  /* Touch gestures */
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [translateX,  setTranslateX]  = useState(0);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = e.targetTouches[0].clientX - touchStartX;
    const maxDrag = 80;
    setTranslateX(Math.max(-maxDrag, Math.min(maxDrag, diff * 0.45)));
  };

  const onTouchEnd = () => {
    if (touchStartX !== null) {
      if (translateX <= -22) { /* left swipe > 50px */
        onSkip();
      } else if (translateX >= 22) { /* right swipe > 50px */
        onSave(reel);
      }
    }
    setTranslateX(0);
    setTouchStartX(null);
  };

  /* video lifecycle */
  useEffect(() => {
    const v = vidRef.current;
    if (!v || !reel.isVideo || vidErr) return;
    if (isActive) {
      v.currentTime = 0;
      const playPromise = v.play();
      if (playPromise !== undefined) {
        playPromise.then(() => setPlaying(true)).catch(() => setPlaying(false));
      }
    } else {
      v.pause();
      setPlaying(false);
      if (!preload) { v.currentTime = 0; setProgress(0); }
    }
  }, [isActive, preload, reel.isVideo, vidErr]);

  const onTimeUpdate = useCallback(() => {
    const v = vidRef.current;
    if (v?.duration) setProgress(v.currentTime / v.duration * 100);
  }, []);

  const togglePlay = () => {
    const v = vidRef.current;
    if (!v) return;
    if (playing) { v.pause(); setPlaying(false); }
    else v.play().then(() => setPlaying(true)).catch(() => {});
  };

  const doubleTap = () => {
    setLiked(true); setHeart(true);
    setTimeout(() => setHeart(false), 900);
  };

  const hasVid = reel.isVideo && !!reel.videoUrl && !vidErr;
  const hasImg = !!reel.imageUrl && !imgErr;
  const bg     = `hsl(${(index * 43) % 360},30%,7%)`;

  return (
    <div
      className="reel-slide"
      style={{ 
        background: bg,
        transform: `translateX(${translateX}px)`,
        transition: touchStartX === null ? 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)' : 'none'
      }}
      role="article"
      aria-label={reel.title}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Media ── */}
      <div style={{ position: 'absolute', inset: 0 }}>
        {hasVid ? (
          <video
            ref={vidRef}
            src={reel.videoUrl!}
            muted={muted}
            loop
            playsInline
            autoPlay
            preload={isActive ? 'auto' : preload ? 'metadata' : 'none'}
            onTimeUpdate={onTimeUpdate}
            onError={() => setVidErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
        ) : hasImg ? (
          <img
            src={reel.imageUrl!}
            alt={reel.title}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgErr(true)}
            style={{
              width: '100%', height: '100%', objectFit: 'contain', display: 'block',
              opacity: imgLoaded ? 1 : 0, transition: 'opacity .4s',
            }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 12,
            background: `linear-gradient(135deg,hsl(${hsl(reel.subreddit)},50%,9%),hsl(${(hsl(reel.subreddit)+60)%360},40%,5%))`,
          }}>
            <AlertCircle size={48} color="var(--text-3)" strokeWidth={1} />
            <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Media unavailable</p>
          </div>
        )}
      </div>

      {/* ── Gradient overlays ── */}
      <div className="overlay-top"    style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 90,  zIndex: 5 }} />
      <div className="overlay-bottom" style={{ position: 'absolute', inset: 0, zIndex: 5 }} />

      {/* ── Tap to play/pause · double-tap to like ── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 6, cursor: hasVid ? 'pointer' : 'default' }}
        onClick={hasVid ? togglePlay : undefined}
        onDoubleClick={doubleTap} />

      {/* Heart pop */}
      {heart && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          zIndex: 30, pointerEvents: 'none',
          animation: 'heartPop .9s ease both',
        }}>
          <Heart size={88} fill="#ff2d55" color="#ff2d55" />
        </div>
      )}

      {/* Paused indicator */}
      {hasVid && !playing && isActive && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)', zIndex: 12, pointerEvents: 'none',
          width: 60, height: 60, borderRadius: '50%',
          background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Play size={22} fill="#fff" color="#fff" />
        </div>
      )}

      {/* ── Top bar ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: '14px 14px 0',
      }}>
        <a
          href={`https://reddit.com/r/${reel.subreddit}`}
          target="_blank" rel="noopener noreferrer"
          className="glass-pill"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 11px', textDecoration: 'none',
            color: '#fff', fontSize: 12, fontWeight: 700,
          }}
        >
          <span style={{ color: 'var(--accent)' }}>r/</span>
          {reel.subreddit}
          {reel.isNsfw && <span className="badge-nsfw">18+</span>}
        </a>

        {hasVid && (
          <button
            onClick={() => setMuted(m => !m)}
            className="glass-pill"
            style={{
              width: 36, height: 36, border: 'none', cursor: 'pointer', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        )}
      </div>

      {/* ── Right actions ── */}
      <div className="reel-actions">
        <div className="act-btn" role="button" tabIndex={0}
          onClick={() => setLiked(l => !l)}
          onKeyDown={e => e.key === 'Enter' && setLiked(l => !l)}
          aria-label={liked ? 'Unlike' : 'Like'}
        >
          <div className={`act-icon${liked ? ' is-active' : ''}`}>
            <Heart size={19} fill={liked ? '#ff2d55' : 'none'} color={liked ? '#ff2d55' : '#fff'} />
          </div>
          <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>
            {fmt(reel.score + (liked ? 1 : 0))}
          </span>
        </div>

        <a className="act-btn" href={reel.permalink} target="_blank" rel="noopener noreferrer"
          aria-label="View comments" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="act-icon"><MessageCircle size={19} color="#fff" /></div>
          <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>{fmt(reel.numComments)}</span>
        </a>

        {/* Save / Bookmark */}
        <div className="act-btn" role="button" tabIndex={0}
          onClick={() => onSave(reel)}
          onKeyDown={e => e.key === 'Enter' && onSave(reel)}
          aria-label={isSaved ? 'Remove from saved' : 'Save reel'}
        >
          <div className={`act-icon${isSaved ? ' is-active' : ''}`}>
            <Bookmark size={19} fill={isSaved ? 'var(--accent)' : 'none'} color={isSaved ? 'var(--accent)' : '#fff'} />
          </div>
          <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>{isSaved ? 'Saved' : 'Save'}</span>
        </div>

        <a className="act-btn" href={reel.permalink} target="_blank" rel="noopener noreferrer"
          aria-label="Open on Reddit" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="act-icon"><ExternalLink size={17} color="#fff" /></div>
          <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>Reddit</span>
        </a>

        <div className="act-btn" aria-label="Upvote ratio">
          <div className="act-icon"><ArrowBigUp size={19} color="#fff" /></div>
          <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>
            {Math.round(reel.upvoteRatio * 100)}%
          </span>
        </div>
      </div>

      {/* ── Bottom info ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '18px 14px 28px', zIndex: 10,
        /* avoid overlapping action btns */
        paddingRight: 76,
      }}>
        {/* Author */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg,hsl(${hsl(reel.author)},70%,50%),hsl(${(hsl(reel.author)+120)%360},70%,35%))`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800, color: '#fff',
          }}>
            {(reel.author[0] ?? 'u').toUpperCase()}
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>u/{reel.author}</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', lineHeight: 1.2 }}>{ago(reel.createdUtc)}</p>
          </div>
        </div>

        {/* Title */}
        <p style={{
          fontSize: 13, color: '#fff', lineHeight: 1.45, marginBottom: 10, fontWeight: 500,
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          textShadow: '0 1px 4px rgba(0,0,0,.6)',
        }}>
          {reel.title}
        </p>

        {/* Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <span className="chip"><ArrowBigUp size={10} />{fmt(reel.score)}</span>
          <span className="chip">{reel.isVideo ? <Film size={10} /> : <Img size={10} />}{reel.isVideo ? 'Video' : 'Image'}</span>
          {reel.relevanceScore > 80 && <span className="chip"><Flame size={10} />Hot</span>}
        </div>
      </div>

      {/* Progress bar */}
      {hasVid && (
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
});

/* ════════════════════════════════════════
   Empty / Loading states
════════════════════════════════════════ */
/* ════════════════════════════════════════
   Skeleton loading card — Instagram Reels style
════════════════════════════════════════ */
function ReelSkeleton() {
  return (
    <div className="reel-slide" style={{ background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 16 }}>
      {/* Top badge skeleton */}
      <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', gap: 8 }}>
        <div className="skeleton" style={{ width: 100, height: 28, borderRadius: 100 }} />
      </div>
      {/* Main content area shimmer */}
      <div className="skeleton" style={{ position: 'absolute', inset: 0, borderRadius: 0, opacity: 0.6 }} />
      {/* Right actions skeleton */}
      <div style={{ position: 'absolute', right: 14, bottom: 110, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%' }} />
            <div className="skeleton" style={{ width: 28, height: 10, borderRadius: 4 }} />
          </div>
        ))}
      </div>
      {/* Bottom info skeleton */}
      <div style={{ paddingRight: 76, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="skeleton" style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0 }} />
          <div className="skeleton" style={{ width: 100, height: 12, borderRadius: 4 }} />
        </div>
        <div className="skeleton" style={{ width: '85%', height: 13, borderRadius: 4 }} />
        <div className="skeleton" style={{ width: '60%', height: 13, borderRadius: 4 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {[70, 55, 45].map(w => (
            <div key={w} className="skeleton" style={{ width: w, height: 22, borderRadius: 100 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 32, background: 'var(--bg-base)' }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Film size={32} color="var(--accent)" strokeWidth={1.5} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--text-1)', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Start with a search</p>
        <p style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1.55, maxWidth: 240 }}>
          Type what you want to watch in the chat panel — AI will build a reel feed for you
        </p>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, maxWidth: 280 }}>
        {['Lion videos', 'Funny fails', 'Car crashes', 'Gaming clips', 'Space content'].map(s => (
          <span key={s} className="chip" style={{ fontSize: 12, padding: '5px 12px' }}>{s}</span>
        ))}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReelSkeleton />
    </div>
  );
}

/* ════════════════════════════════════════
   Feed container
════════════════════════════════════════ */
interface Props {
  reels:      ReelPost[];
  loading:    boolean;
  onLoadMore: () => void;
  savedIds:   Set<string>;
  onSaveReel: (reel: ReelPost) => void;
}

export default function ReelFeed({ reels, loading, onLoadMore, savedIds, onSaveReel }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  /* IntersectionObserver – detect active slide & trigger load-more 5 before end */
  useEffect(() => {
    const box = containerRef.current;
    if (!box) return;

    const obs = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.isIntersecting) {
          const idx = Number(e.target.getAttribute('data-idx'));
          setActiveIdx(idx);
          // Trigger load-more when within 5 slides of end
          if (idx >= reels.length - 5 && !loading) onLoadMore();
        }
      }
    }, { root: box, threshold: 0.65 });

    box.querySelectorAll('.reel-slide[data-idx]').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [reels.length, loading, onLoadMore]);

  const onSkipReel = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
    }
  }, []);

  if (loading && reels.length === 0) return <LoadingState />;
  if (!loading && reels.length === 0) return <EmptyState />;

  return (
    <div style={{ width: '100%', height: '100%', background: '#000', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 460, position: 'relative', height: '100%', backgroundColor: 'var(--bg-base)', overflow: 'hidden' }}>
        
        {/* Counter badge removed */}

        {/* Scroll container */}
        <div ref={containerRef} className="reel-scroll">

        {reels.map((reel, i) => (
          <div key={`${reel.id}-${i}`} className="reel-slide" data-idx={i}
            style={{ height: '100%' }}>
            <ReelSlide
              reel={reel}
              isActive={i === activeIdx}
              preload={i === activeIdx + 1}
              index={i}
              isSaved={savedIds.has(reel.id)}
              onSave={onSaveReel}
              onSkip={onSkipReel}
            />
          </div>
        ))}

        {/* Inline loading skeleton at end */}
        {loading && reels.length > 0 && (
          <div className="reel-slide" data-noscroll style={{ scrollSnapAlign: 'start' }}>
            <ReelSkeleton />
          </div>
        )}
      </div>

      {/* Scroll hint */}
      {reels.length > 0 && activeIdx === 0 && (
        <div className="anim-bounceUp" style={{
          position: 'absolute', bottom: 80, left: '50%', zIndex: 50,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, pointerEvents: 'none',
        }}>
          <ChevronDown size={20} color="rgba(255,255,255,.45)" />
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', whiteSpace: 'nowrap' }}>Scroll for next reel</p>
        </div>
      )}
      
      </div>
    </div>
  );
}
