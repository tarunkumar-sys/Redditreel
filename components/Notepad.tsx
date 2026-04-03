'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '@/components/ToastContext';
import { useScrollLock } from '@/lib/useScrollLock';
import {
  StickyNote, Bookmark, Plus, Trash2, Film, ExternalLink,
  X, PenLine, FolderPlus, ArrowLeft,
} from 'lucide-react';
import type { ReelPost } from '../app/api/reddit/route';
import {
  getBoardsAction, createBoardAction, deleteBoardAction, updateReelBoardAction,
  getNotesAction, saveNoteToDbAction, deleteNoteFromDbAction,
} from '@/app/actions/db';

/* ── Types ── */
export interface SavedNote { id: string; text: string; time: number; }
export interface SavedReel extends ReelPost { savedAt: number; boardId?: string; tags?: string[]; }
export interface Board { id: string; name: string; }

interface Props {
  savedReels:  SavedReel[];
  onRemoveReel: (id: string) => void;
  onUpdateReel: (reel: SavedReel) => void;
  onReelClick?: (reel: SavedReel) => void;
}

/* ── New Board Modal ── */
function NewBoardModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState('');
  useScrollLock(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = () => { if (name.trim()) { onCreate(name.trim()); onClose(); } };

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div
        className="anim-fadeUp"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '24px 22px', width: '100%', maxWidth: 340,
          boxShadow: '0 20px 60px rgba(0,0,0,.6)',
        }}
      >
        <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14, color: 'var(--text-1)' }}>New Board</h3>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(); }}
          placeholder="Board name…"
          className="chat-input"
          style={{ width: '100%', height: 44, marginBottom: 14 }}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '10px', borderRadius: 10,
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--text-2)', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!name.trim()}
            style={{
              flex: 1, padding: '10px', borderRadius: 10, border: 'none',
              background: name.trim() ? 'var(--accent)' : 'var(--bg-hover)',
              color: name.trim() ? '#fff' : 'var(--text-3)',
              fontWeight: 700, cursor: name.trim() ? 'pointer' : 'not-allowed',
              transition: 'background .2s, color .2s',
            }}
          >
            Create
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Main Component ── */
export default function Notepad({ savedReels, onRemoveReel, onUpdateReel, onReelClick }: Props) {
  const [notes,         setNotes]         = useState<SavedNote[]>([]);
  const [boards,        setBoards]        = useState<Board[]>([]);
  const [draft,         setDraft]         = useState('');
  const [view,          setView]          = useState<'reels' | 'notes'>('reels');
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [draggingReel,  setDraggingReel]  = useState<SavedReel | null>(null);
  const [showNewBoard,  setShowNewBoard]  = useState(false);
  const { addToast } = useToast();
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    getNotesAction().then(n => setNotes(n.map(x => ({ id: x.id, text: x.text, time: x.createdAt }))));
    getBoardsAction().then(setBoards);
  }, []);

  const addNote = useCallback(async () => {
    const t = draft.trim();
    if (!t) return;
    const newNote = await saveNoteToDbAction(t);
    if ('error' in newNote) { addToast('Sign in to save notes', 'error'); return; }
    setNotes(prev => [{ id: newNote.id, text: newNote.text, time: newNote.createdAt }, ...prev]);
    addToast('Note saved', 'success');
    setDraft('');
    if (textRef.current) textRef.current.style.height = 'auto';
  }, [draft, addToast]);

  const deleteNote = useCallback(async (id: string) => {
    await deleteNoteFromDbAction(id);
    setNotes(prev => prev.filter(n => n.id !== id));
    addToast('Note deleted', 'info');
  }, [addToast]);

  const onNoteKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addNote(); }
  };
  const onNoteInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    setDraft(el.value);
  };

  const handleCreateBoard = async (name: string) => {
    const newBoard = await createBoardAction(name);
    if ('error' in newBoard) { addToast('Sign in to create boards', 'error'); return; }
    setBoards(prev => [...prev, newBoard as Board]);
    addToast('Board created', 'success');
  };

  const handleDropToBoard = async (boardId: string) => {
    if (!draggingReel) return;
    const target = boardId === 'all' ? null : boardId;
    await updateReelBoardAction(draggingReel.id, target);
    onUpdateReel({ ...draggingReel, boardId: target || undefined });
    setDraggingReel(null);
  };

  const deleteBoard = async (id: string) => {
    if (!window.confirm('Delete this board? Reels will remain in All Saved Reels.')) return;
    await deleteBoardAction(id);
    savedReels.forEach(r => { if (r.boardId === id) onUpdateReel({ ...r, boardId: undefined }); });
    setBoards(prev => prev.filter(b => b.id !== id));
    if (activeBoardId === id) setActiveBoardId(null);
  };

  const getReelsForBoard = (boardId: string | null) => {
    if (boardId === 'all' || boardId === null) return savedReels;
    return savedReels.filter(r => r.boardId === boardId);
  };

  const fmtDate = (ms: number) =>
    new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="notepad">
      {/* ── View switcher ── */}
      <div className="sidebar-tabs" style={{ borderTop: 'none' }}>
        <button className={`sidebar-tab${view === 'reels' ? ' is-active' : ''}`} onClick={() => setView('reels')}>
          <Bookmark size={13} /> Saved Reels
        </button>
        <button className={`sidebar-tab${view === 'notes' ? ' is-active' : ''}`} onClick={() => setView('notes')}>
          <StickyNote size={13} /> Notes
        </button>
      </div>

      {/* ══ SAVED REELS VIEW ══ */}
      {view === 'reels' && (
        <>
          {activeBoardId === null ? (
            /* ── Boards grid ── */
            <div className="scroll-thin" style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Your Boards</span>
                <button
                  onClick={() => setShowNewBoard(true)}
                  className="pill"
                  style={{ background: 'var(--accent)', color: '#fff', border: 'none' }}
                >
                  <Plus size={12} /> New Board
                </button>
              </div>
              <div className="boards-grid">
                <BoardCard
                  id="all" name="All Saved Reels" reels={getReelsForBoard('all')}
                  onClick={() => setActiveBoardId('all')}
                />
                {boards.map(b => (
                  <BoardCard
                    key={b.id} id={b.id} name={b.name} reels={getReelsForBoard(b.id)}
                    onClick={() => setActiveBoardId(b.id)}
                    onDrop={() => handleDropToBoard(b.id)}
                    onDelete={(e: React.MouseEvent) => { e.stopPropagation(); deleteBoard(b.id); }}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* ── Board detail ── */
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              {/* Back + title */}
              <div style={{
                padding: '10px 14px', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
              }}>
                <button
                  onClick={() => setActiveBoardId(null)}
                  aria-label="Back to boards"
                  style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    border: '1px solid var(--border)', background: 'transparent',
                    color: 'var(--text-2)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'border-color .18s, color .18s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-2)'; }}
                >
                  <ArrowLeft size={14} />
                </button>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>
                  {activeBoardId === 'all' ? 'All Saved Reels' : boards.find(b => b.id === activeBoardId)?.name}
                </span>
              </div>

              {/* Reel grid */}
              <div className="scroll-thin" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {(() => {
                  const boardReels = getReelsForBoard(activeBoardId);
                  return (
                    <div className="saved-reel-grid" style={{ paddingBottom: draggingReel ? 120 : 14 }}>
                      {boardReels.map(reel => (
                        <div
                          key={reel.id}
                          className="saved-reel-card"
                          draggable
                          onDragStart={e => { e.dataTransfer.setData('text/plain', reel.id); setDraggingReel(reel); }}
                          onDragEnd={() => setDraggingReel(null)}
                          onClick={() => onReelClick?.(reel)}
                          style={{ cursor: 'pointer' }}
                        >
                          {(() => {
                            const thumb = reel.imageUrl || reel.thumbnail;
                            return thumb ? (
                              <img src={thumb} alt={reel.title} className="saved-reel-thumb"
                                onError={e => {
                                  const img = e.target as HTMLImageElement;
                                  // try the other source before giving up
                                  if (reel.thumbnail && img.src !== reel.thumbnail) {
                                    img.src = reel.thumbnail;
                                  } else {
                                    img.style.display = 'none';
                                  }
                                }} />
                            ) : (
                              <div className="saved-reel-thumb-placeholder">
                                <Film size={20} color="var(--text-3)" strokeWidth={1.5} />
                              </div>
                            );
                          })()}
                          <button className="sr-rm" onClick={e => { e.stopPropagation(); onRemoveReel(reel.id); }} aria-label="Remove">
                            <X size={12} />
                          </button>
                          <div className="saved-reel-info">
                            <p className="saved-reel-title">{reel.title}</p>
                            <p className="saved-reel-sub">r/{reel.subreddit}</p>
                          </div>
                          <a
                            href={reel.permalink} target="_blank" rel="noopener noreferrer"
                            className="sr-link"
                            onClick={e => e.stopPropagation()}
                            style={{
                              position: 'absolute', bottom: 28, right: 6,
                              background: 'rgba(0,0,0,.65)', border: 'none', borderRadius: '50%',
                              width: 22, height: 22, display: 'none',
                              alignItems: 'center', justifyContent: 'center',
                              color: '#fff', cursor: 'pointer',
                            }}
                          >
                            <ExternalLink size={11} />
                          </a>
                        </div>
                      ))}
                      {boardReels.length === 0 && (
                        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-3)', fontSize: 13, gridColumn: '1 / -1' }}>
                          No reels here yet.
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Drag dock */}
              {draggingReel && (
                <div className="drag-dock anim-fadeUp">
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8, textAlign: 'center', textTransform: 'uppercase' }}>
                    Drop to move
                  </div>
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                    {boards.filter(b => b.id !== activeBoardId).map(b => (
                      <div key={b.id} className="drag-target"
                        onDragOver={e => e.preventDefault()}
                        onDrop={() => handleDropToBoard(b.id)}
                      >
                        {b.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ══ NOTES VIEW ══ */}
      {view === 'notes' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end' }}>
              <textarea
                ref={textRef} value={draft} onChange={onNoteInput} onKeyDown={onNoteKey}
                placeholder="Write a note… (Enter to save)" className="note-input" rows={2}
              />
              <button
                onClick={addNote} disabled={!draft.trim()}
                style={{
                  width: 38, height: 38, borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: draft.trim() ? 'var(--accent)' : 'var(--bg-elevated)',
                  color: draft.trim() ? '#fff' : 'var(--text-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'background .2s, color .2s',
                }}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
          <div className="scroll-thin" style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notes.length === 0 ? (
              <div className="np-empty" style={{ flex: 'none', paddingTop: 40 }}>
                <PenLine size={32} color="var(--text-3)" strokeWidth={1} />
                <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-2)' }}>No notes yet</p>
              </div>
            ) : (
              notes.map(n => (
                <div key={n.id} className="note-card anim-fadeUp">
                  <p style={{ paddingRight: 20 }}>{n.text}</p>
                  <time style={{ fontSize: 10, color: 'var(--text-3)', display: 'block', marginTop: 6 }}>
                    {fmtDate(n.time)}
                  </time>
                  <button className="note-del" onClick={() => deleteNote(n.id)}><Trash2 size={13} /></button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* New Board Modal */}
      {showNewBoard && (
        <NewBoardModal onClose={() => setShowNewBoard(false)} onCreate={handleCreateBoard} />
      )}
    </div>
  );
}

/* ── Board Card ── */
function BoardCard({ id, name, reels, onClick, onDrop, onDelete }: {
  id: string; name: string; reels: SavedReel[];
  onClick: () => void; onDrop?: () => void; onDelete?: (e: React.MouseEvent) => void;
}) {
  const [isOver, setIsOver] = useState(false);
  const top4 = reels.slice(0, 4);

  return (
    <div
      className={`board-card${isOver ? ' drag-over' : ''}`}
      onClick={onClick}
      onDragOver={e => { e.preventDefault(); if (onDrop) setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={e => { e.preventDefault(); setIsOver(false); onDrop?.(); }}
    >
      <div className="board-grid-2x2">
        {top4.length === 0 ? (
          <div className="board-empty"><FolderPlus size={32} color="var(--text-3)" /></div>
        ) : (
          <>
            {top4.map(r => {
              const thumb = r.imageUrl || r.thumbnail;
              return thumb
                ? <img key={r.id} src={thumb} alt="" className="board-thumb"
                    onError={e => { (e.target as HTMLImageElement).style.background = 'var(--bg-card)'; (e.target as HTMLImageElement).style.display = 'none'; }} />
                : <div key={r.id} className="board-thumb" style={{ background: 'var(--bg-card)' }} />;
            })}
            {Array.from({ length: 4 - top4.length }).map((_, i) => (
              <div key={'fill' + i} className="board-thumb" style={{ background: 'var(--bg-card)' }} />
            ))}
          </>
        )}
      </div>
      <div style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{reels.length} reels</div>
        </div>
        {onDelete && (
          <button
            className="sr-rm"
            onClick={onDelete}
            style={{ position: 'static', display: 'flex' }}
            aria-label="Delete board"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
