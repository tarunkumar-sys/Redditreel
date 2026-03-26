import { getUserContentAction, adminDeleteReelAction, adminDeleteNoteAction, checkAdmin } from '@/app/actions/admin';
import Link from 'next/link';
import { Trash2, ArrowLeft } from 'lucide-react';
import { revalidatePath } from 'next/cache';

export default async function ManageUserPage({ params }: { params: { id: string } }) {
  await checkAdmin();
  const data = await getUserContentAction(params.id);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', color: 'var(--text-1)' }}>
      <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-3)', fontSize: 13, textDecoration: 'none', marginBottom: 24, fontWeight: 600 }}>
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>
      
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 32 }}>User Moderation</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        {/* REELS */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Saved Reels ({data.reels.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.reels.map(r => (
              <div key={r.id} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: 16, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>r/{r.subreddit}</div>
                </div>
                <form action={async () => { 'use server'; await adminDeleteReelAction(r.id); revalidatePath(`/admin/user/${params.id}`); }}>
                  <button style={{ background: 'rgba(255,0,0,.1)', border: 'none', color: '#ff4444', padding: 8, borderRadius: 8, cursor: 'pointer' }}><Trash2 size={14} /></button>
                </form>
              </div>
            ))}
            {data.reels.length === 0 && <div style={{ color: 'var(--text-3)', fontSize: 13 }}>No saved reels.</div>}
          </div>
        </div>

        {/* NOTES */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Notes ({data.notes.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.notes.map(n => (
              <div key={n.id} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: 16, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: 14, color: 'var(--text-1)', whiteSpace: 'pre-wrap' }}>{n.text}</div>
                <form action={async () => { 'use server'; await adminDeleteNoteAction(n.id); revalidatePath(`/admin/user/${params.id}`) }}>
                  <button style={{ background: 'rgba(255,0,0,.1)', border: 'none', color: '#ff4444', padding: 8, borderRadius: 8, cursor: 'pointer', marginLeft: 16 }}><Trash2 size={14} /></button>
                </form>
              </div>
            ))}
            {data.notes.length === 0 && <div style={{ color: 'var(--text-3)', fontSize: 13 }}>No notes.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
