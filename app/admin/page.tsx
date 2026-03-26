import { getAdminStats, deleteUserAction } from '@/app/actions/admin';
import Link from 'next/link';
import { Trash2, Shield, Users, Film, StickyNote, Flame } from 'lucide-react';
import { revalidatePath } from 'next/cache';

export default async function AdminDashboard() {
  const stats = await getAdminStats();

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>Platform Overview</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Users', value: stats.usersCount, icon: <Users /> },
          { label: 'Saved Reels', value: stats.reelsCount, icon: <Film /> },
          { label: 'Notes', value: stats.notesCount, icon: <StickyNote /> },
          { label: 'DAU (24h)', value: stats.dau, icon: <Flame /> },
          { label: 'NSFW', value: stats.nsfwCount, icon: <Shield /> },
          { label: 'SFW', value: stats.sfwCount, icon: <Shield /> },
        ].map((s) => (
          <div key={s.label} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: 20, borderRadius: 16 }}>
            <div style={{ color: 'var(--accent)', marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 900 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <section style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 16, padding: 18, marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Most searched queries</h2>
        <ol style={{ marginLeft: 18, color: 'var(--text-2)' }}>
          {stats.mostSearchedQueries.map((q) => (
            <li key={q.id}>{q.query} ({q.hits})</li>
          ))}
        </ol>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Most saved subreddits</h2>
          <ul style={{ marginLeft: 18, color: 'var(--text-2)' }}>
            {stats.subreddits.map((item) => (
              <li key={item.subreddit}>{item.subreddit} ({item._count._all})</li>
            ))}
          </ul>
        </div>
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>User growth (last 90 days)</h2>
          <ul style={{ marginLeft: 18, color: 'var(--text-2)' }}>
            {stats.userGrowth.map((item) => (
              <li key={item.date}>{item.date}: {item.count}</li>
            ))}
          </ul>
        </div>
      </section>

      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Manage Users</h2>
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', fontSize: 12, textTransform: 'uppercase', color: 'var(--text-3)' }}>
              <th style={{ padding: '16px 20px' }}>User</th>
              <th style={{ padding: '16px 20px' }}>Role</th>
              <th style={{ padding: '16px 20px' }}>Content Stats</th>
              <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentUsers.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontWeight: 600 }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{u.email}</div>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 8px', borderRadius: 100, background: u.role === 'ADMIN' ? 'rgba(59,130,246,.2)' : 'var(--bg-card)', color: u.role === 'ADMIN' ? '#3b82f6' : 'var(--text-2)' }}>
                    {u.role === 'ADMIN' ? <Shield size={10} style={{ display: 'inline', marginRight: 4 }} /> : null}{u.role}
                  </span>
                </td>
                <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--text-2)' }}>
                  {u._count.savedReels} reels, {u._count.notes} notes
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                  <Link href={`/admin/user/${u.id}`} style={{ marginRight: 16, fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Manage Content</Link>
                  <form action={async () => { 'use server'; await deleteUserAction(u.id); revalidatePath('/admin'); }} style={{ display: 'inline' }}>
                    <button disabled={u.role === 'ADMIN'} style={{ background: 'none', border: 'none', color: u.role === 'ADMIN' ? 'var(--text-3)' : '#ff4444', cursor: u.role === 'ADMIN' ? 'not-allowed' : 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
