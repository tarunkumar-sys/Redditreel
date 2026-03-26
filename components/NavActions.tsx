import { auth } from '@/auth';
import Link from 'next/link';
import UserAvatarPill from './UserAvatarPill';

export default async function NavActions({ onLoginClick }: { onLoginClick?: string }) {
  const session = await auth();
  const user = session?.user;

  if (user) {
    return (
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Link href="/dashboard" style={{
          padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          color: 'rgba(255,255,255,.75)', textDecoration: 'none',
          border: '1px solid rgba(255,255,255,.1)',
          transition: 'color .2s',
        }}>
          Dashboard
        </Link>
        <UserAvatarPill
          name={user.name ?? ''}
          email={user.email ?? ''}
          image={user.image ?? null}
          role={(user as any).role ?? 'USER'}
        />
      </div>
    );
  }

  // Unauthenticated — render Sign In + Get Started as a form so the client
  // page can wire up the modal via a custom event on click.
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <button
        data-login-trigger
        className="nav-link"
        style={{
          padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          color: 'rgba(255,255,255,.55)',
          border: '1px solid rgba(255,255,255,.1)',
          background: 'none', cursor: 'pointer',
          transition: 'color .2s',
        }}
      >
        Sign In
      </button>
      <button
        data-login-trigger
        className="cta-btn"
        style={{
          padding: '9px 20px', borderRadius: 10, fontSize: 13, fontWeight: 800,
          background: '#ff2d55', color: '#fff',
          border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(255,45,85,.4)',
          transition: 'transform .2s, box-shadow .2s',
        }}
      >
        Get Started
      </button>
    </div>
  );
}
