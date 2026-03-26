/* ── Base Reddit Types ── */
export interface ReelPost {
  id: string;
  title: string;
  subreddit: string;
  author: string;
  score: number;
  numComments: number;
  permalink: string;
  videoUrl: string | null;
  imageUrl: string | null;
  isVideo: boolean;
  isNsfw: boolean;
  createdUtc: number;
  upvoteRatio: number;
  thumbnail: string | null;
  relevanceScore: number;
}

/* ── UI & State Types ── */
export type ToastType = 'success' | 'error' | 'info';
export interface Toast {
  id: string;
  msg: string;
  type: ToastType;
}

export type MobileTab = 'chat' | 'feed' | 'notes';
export type SidebarView = 'chat' | 'notepad';

/* ── Pagination Logic ── */
export interface Pagination {
  subs: string;      // Comma-separated community pool snapshot
  subIdx: number;    // Current position in pool
  after: string | null;
  sortCycle: number;
  seenIds: Set<string>;
}

/* ── Saved Content ── */
export interface SavedReel extends ReelPost {
  savedAt: number;
  tags?: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  time: Date;
}
