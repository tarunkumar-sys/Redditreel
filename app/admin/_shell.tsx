'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard, Users, BarChart2, ShieldAlert,
  Film, Settings, LogOut, ChevronRight, Menu, ArrowLeft,
} from 'lucide-react';
import AppIcon from '@/components/AppIcon';

/* ── Types ── */
interface AdminInfo { name: string; email: string; id: string; }

interface NavItem {
  id:    string;
  icon:  React.ReactNode;
  label: string;
  href:  string;
}

const NAV: NavItem[] = [
  { id: 'overview',  icon: <LayoutDashboard size={18} />, label: 'Overview',    href: '/admin' },
  { id: 'users',     icon: <Users size={18} />,           label: 'Users',       href: '/admin?view=users' },
  { id: 'analytics', icon: <BarChart2 size={18} />,       label: 'Analytics',   href: '/admin?view=analytics' },
  { id: 'content',   icon: <ShieldAlert size={18} />,     label: 'NSFW / SFW',  href: '/admin?view=content' },
  { id: 'reels',     icon: <Film size={18} />,            label: 'Browse Reels',href: '/admin?view=reels' },
  { id: 'settings',  icon: <Settings size={18} />,        label: 'Settings',    href: '/admin?view=settings' },
];

/* ── Sidebar nav item ── */
function NavLink({ item, expanded, active }: { item: NavItem; expanded: boolean; active: boolean }) {
  return (
    <Link
      href={item.href}
      title={!expanded ? item.label : undefined}
      style={{
        display: 'flex', alignItems: 'center',
        gap: expanded ? 12 : 0,
        padding: expanded ? '10px 14px' : '10px 0',
        justifyContent: expanded ? 'flex-start' : 'center',
        borderRadius: 10,
        textDecoration: 'none',
        fontWeight: 600,
        fontSize: 13,
        color: active ? '#fff' : 'var(--text-2)',
        background: active ? 'var(--accent)' : 'transparent',
        transition: 'background .15s, color .15s',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg-hover)'; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}
    >
      <span style={{ flexShrink: 0 }}>{item.icon}</span>
      {expanded && <span>{item.label}</span>}
    </Link>
  );
}

/* ── Shell ── */
export default function AdminShell({
  children,
  admin,
  onSignOut,
}: {
  children: React.ReactNode;
  admin: AdminInfo;
  onSignOut: () => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get('view') || 'overview';

  const isActive = (item: NavItem) => {
    const itemUrl = new URL(item.href, 'http://localhost'); // dummy base
    const itemView = itemUrl.searchParams.get('view') || 'overview';
    return pathname === '/admin' && view === itemView;
  };

  const W = expanded ? 220 : 60;

  return (
    <div style={{ display: 'flex', height: '100dvh', background: 'var(--bg-base)', color: 'var(--text-1)', overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: W, minWidth: W, maxWidth: W,
        height: '100%',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        transition: 'width .22s cubic-bezier(.4,0,.2,1), min-width .22s, max-width .22s',
        overflow: 'hidden',
        flexShrink: 0,
        zIndex: 20,
      }}>

        {/* Logo + toggle */}
        <div style={{
          height: 56, display: 'flex', alignItems: 'center',
          padding: expanded ? '0 14px' : '0',
          justifyContent: expanded ? 'space-between' : 'center',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          {expanded && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AppIcon size={24} />
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)', whiteSpace: 'nowrap' }}>
                Reel <span style={{ color: 'var(--accent)' }}>Admin</span>
              </span>
            </div>
          )}
          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--text-2)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              transition: 'background .15s',
            }}
            aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <Menu size={15} />
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: expanded ? '12px 10px' : '12px 6px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto', overflowX: 'hidden' }}>
          {expanded && (
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.8px', textTransform: 'uppercase', padding: '4px 6px 8px', whiteSpace: 'nowrap' }}>
              Platform
            </p>
          )}
          {NAV.map(item => (
            <NavLink key={item.id} item={item} expanded={expanded} active={isActive(item)} />
          ))}
        </nav>

        {/* Back to app + sign out */}
        <div style={{ padding: expanded ? '10px 10px 14px' : '10px 6px 14px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Link
            href="/"
            title={!expanded ? 'Back to App' : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: expanded ? 10 : 0,
              justifyContent: expanded ? 'flex-start' : 'center',
              padding: expanded ? '9px 12px' : '9px 0',
              borderRadius: 8, textDecoration: 'none',
              color: 'var(--text-2)', fontSize: 13, fontWeight: 600,
              transition: 'background .15s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg-hover)'}
            onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'}
          >
            <ArrowLeft size={16} />
            {expanded && <span>Back to App</span>}
          </Link>

          <form action={onSignOut}>
            <button
              type="submit"
              title={!expanded ? 'Sign Out' : undefined}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                gap: expanded ? 10 : 0,
                justifyContent: expanded ? 'flex-start' : 'center',
                padding: expanded ? '9px 12px' : '9px 0',
                borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'transparent', color: '#ef4444',
                fontSize: 13, fontWeight: 600,
                transition: 'background .15s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,.1)'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
            >
              <LogOut size={16} />
              {expanded && <span>Sign Out</span>}
            </button>
          </form>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <header style={{
          height: 56, flexShrink: 0,
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center',
          padding: '0 24px',
          justifyContent: 'space-between',
          background: 'var(--bg-surface)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-3)' }}>
            <span>Admin</span>
            <ChevronRight size={12} />
            <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>
              {view === 'overview' ? 'Overview' : view.charAt(0).toUpperCase() + view.slice(1)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 12px', borderRadius: 100,
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: 'var(--accent)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 800, color: '#fff',
              }}>
                {admin.name[0]?.toUpperCase()}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>{admin.name}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-subtle)', padding: '2px 6px', borderRadius: 4 }}>ADMIN</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
