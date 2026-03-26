'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { createAvatar } from '@dicebear/core';
import { adventurer } from '@dicebear/collection';

/* Generate a deterministic SVG data-URI from the user's email */
function getDicebearSvg(seed: string): string {
  const avatar = createAvatar(adventurer, {
    seed,
    backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
    backgroundType: ['gradientLinear'],
  });
  return avatar.toDataUri();
}

interface Props {
  name: string;
  email: string;
  image?: string | null;
  role: string;
}

export default function UserAvatarPill({ name, email, image, role }: Props) {
  const [open, setOpen] = useState(false);
  const [customImgErr, setCustomImgErr] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const roleLabel = role === 'ADMIN' ? 'Admin' : 'Member';
  const seed = email || name || 'user';
  const dicebearSrc = getDicebearSvg(seed);
  // Prefer custom image; fall back to DiceBear
  const avatarSrc = (image && !customImgErr) ? image : dicebearSrc;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'fixed', top: 12, right: 16, zIndex: 400 }}>

      {/* ── Pill ── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center',
          background: 'rgba(10,10,10,0.95)',
          border: '1px solid rgba(255,255,255,.1)',
          borderRadius: 999,
          padding: '3px 10px 3px 3px',
          cursor: 'pointer',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 2px 12px rgba(0,0,0,.6)',
          transition: 'border-color .2s',
          outline: 'none',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(220,20,60,.4)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.1)')}
      >
        {/* Avatar */}
        <div style={{
          width: 26, height: 26, borderRadius: '50%',
          overflow: 'hidden', flexShrink: 0,
          background: '#111',
          border: '1.5px solid rgba(220,20,60,.3)',
        }}>
          <img
            src={avatarSrc}
            alt={name || email}
            onError={() => { if (image && !customImgErr) setCustomImgErr(true); }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>

        {/* Separator */}
        <div style={{
          width: 1, height: 20,
          background: 'rgba(255,255,255,.1)',
          margin: '0 9px', flexShrink: 0,
        }} />

        {/* Name + role */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1, marginRight: 7 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#f5f5f5', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
            {name || email}
          </span>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#dc143c', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
            {roleLabel}
          </span>
        </div>

        {/* Chevron */}
        <ChevronDown
          size={12}
          color="rgba(255,255,255,.45)"
          style={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}
        />
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          minWidth: 200,
          background: 'rgba(10,10,10,0.98)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(220,20,60,.2)',
          borderRadius: 16,
          padding: '6px',
          boxShadow: '0 16px 48px rgba(0,0,0,.8)',
          animation: 'fadeUp .18s ease both',
        }}>
          {/* Header */}
          <div style={{
            padding: '10px 12px',
            borderBottom: '1px solid rgba(255,255,255,.06)',
            marginBottom: 4,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#111' }}>
              <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#f5f5f5', marginBottom: 1 }}>{name || email}</p>
              <p style={{ fontSize: 11, color: '#555' }}>{email}</p>
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            style={{
              width: '100%', padding: '10px 12px',
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'none', border: 'none', borderRadius: 10,
              color: 'rgba(255,255,255,.55)', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', textAlign: 'left',
              transition: 'background .15s, color .15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,45,85,.1)';
              e.currentTarget.style.color = 'var(--accent)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = 'rgba(255,255,255,.55)';
            }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
