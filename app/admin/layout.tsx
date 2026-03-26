import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from 'next/link';
import { Home, LogOut } from 'lucide-react';
import { signOut } from "@/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') redirect('/');

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-base)', display: 'flex', color: 'var(--text-1)' }}>
      <aside style={{ width: 260, borderRight: '1px solid var(--border)', background: 'var(--bg-elevated)', padding: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--accent)', marginBottom: 30 }}>ReelAI Admin</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 10, height: 'calc(100% - 60px)' }}>
          <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, background: 'var(--bg-card)', color: 'var(--text-1)', fontWeight: 600, textDecoration: 'none' }}>
            <Home size={16} /> Dashboard
          </Link>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, color: 'var(--text-2)', fontWeight: 600, textDecoration: 'none' }}>
            ← Back to App
          </Link>
          <form action={async () => { 'use server'; await signOut({ redirectTo: '/' }) }} style={{ marginTop: 'auto' }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, color: '#ff4444', background: 'rgba(255,0,0,.1)', border: 'none', cursor: 'pointer', width: '100%', fontWeight: 600 }}>
              <LogOut size={16} /> Sign Out
            </button>
          </form>
        </nav>
      </aside>
      <main style={{ flex: 1, padding: 40, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
