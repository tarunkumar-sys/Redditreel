'use server'

import { prisma, auth } from "@/auth";
import { ReelPost } from "@/app/api/reddit/route";
import type { SavedReel as SavedReelModel, Note as NoteModel } from '@prisma/client';

export async function getBoardsAction() {
  const session = await auth();
  if (!session?.user?.id) return [];
  return prisma.board.findMany({ where: { userId: session.user.id } });
}

export async function createBoardAction(name: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  return prisma.board.create({ data: { name, userId: session.user.id } });
}

export async function deleteBoardAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) return;
  await prisma.board.deleteMany({ where: { id, userId: session.user.id } });
}

export async function getSavedReelsAction() {
  const session = await auth();
  if (!session?.user?.id) return [];
  const reels = await prisma.savedReel.findMany({ where: { userId: session.user.id }, orderBy: { savedAt: 'desc' } });

  return reels.map((r: SavedReelModel) => ({
    id: r.id, title: r.title, subreddit: r.subreddit, author: r.author,
    score: r.score, numComments: r.numComments, permalink: r.permalink,
    videoUrl: r.videoUrl, imageUrl: r.imageUrl, isVideo: r.isVideo,
    isNsfw: r.isNsfw, createdUtc: r.createdUtc, upvoteRatio: r.upvoteRatio,
    thumbnail: r.thumbnail, relevanceScore: r.relevanceScore,
    savedAt: r.savedAt.getTime(), tags: JSON.parse(r.tags || "[]"), boardId: r.boardId ?? undefined
  }));
}

export async function saveReelToDbAction(reel: ReelPost, tags: string[] = []) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const result = await prisma.savedReel.upsert({
    where: { id: reel.id },
    create: {
      id: reel.id, title: reel.title, subreddit: reel.subreddit, author: reel.author,
      score: reel.score, numComments: reel.numComments, permalink: reel.permalink,
      videoUrl: reel.videoUrl, imageUrl: reel.imageUrl, isVideo: reel.isVideo,
      isNsfw: reel.isNsfw, createdUtc: Number(reel.createdUtc), upvoteRatio: reel.upvoteRatio,
      thumbnail: reel.thumbnail, relevanceScore: reel.relevanceScore,
      tags: JSON.stringify(tags), userId: session.user.id
    },
    update: { tags: JSON.stringify(tags) }
  });

  await prisma.userActivity.create({ data: { userId: session.user.id, type: 'save_reel', payload: JSON.stringify({ reelId: reel.id, subreddit: reel.subreddit }) } });

  return result;
}

export async function removeReelFromDbAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) return;
  await prisma.savedReel.deleteMany({ where: { id, userId: session.user.id } });
  await prisma.userActivity.create({ data: { userId: session.user.id, type: 'remove_reel', payload: JSON.stringify({ reelId: id }) } });
}

export async function updateReelBoardAction(reelId: string, boardId: string | null) {
  const session = await auth();
  if (!session?.user?.id) return;
  await prisma.savedReel.updateMany({ where: { id: reelId, userId: session.user.id }, data: { boardId } });
}

export async function getNotesAction() {
  const session = await auth();
  if (!session?.user?.id) return [];
  const n = await prisma.note.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: 'desc' } });
  return n.map((note: NoteModel) => ({ id: note.id, text: note.text, createdAt: note.createdAt.getTime() }));
}

export async function saveNoteToDbAction(text: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const note = await prisma.note.create({ data: { text, userId: session.user.id } });
  return { id: note.id, text: note.text, createdAt: note.createdAt.getTime() };
}

export async function deleteNoteFromDbAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) return;
  await prisma.note.deleteMany({ where: { id, userId: session.user.id } });
  await prisma.userActivity.create({ data: { userId: session.user.id, type: 'delete_note', payload: JSON.stringify({ noteId: id }) } });
}
