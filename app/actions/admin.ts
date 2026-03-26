'use server'

import { prisma, auth } from "@/auth";

export async function checkAdmin() {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') throw new Error("Forbidden");
  return session;
}

export async function getAdminStats() {
  await checkAdmin();
  const usersCount = await prisma.user.count();
  const reelsCount = await prisma.savedReel.count();
  const notesCount = await prisma.note.count();

  const dauGroup = await prisma.session.groupBy({
    by: ['userId'],
    where: { expires: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });
  const dau = dauGroup.length;

  const subreddits = await prisma.savedReel.groupBy({
    by: ['subreddit'],
    _count: { _all: true },
    orderBy: { _count: { subreddit: 'desc' } },
    take: 7,
  });

  const mostSearchedQueries = await prisma.searchQuery.findMany({
    orderBy: { hits: 'desc' },
    take: 5,
  });

  const nsfwCount = await prisma.savedReel.count({ where: { isNsfw: true } });
  const sfwCount = reelsCount - nsfwCount;

  const userGrowthRaw = await prisma.user.findMany({
    where: { createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true }
  });

  const userGrowth = userGrowthRaw.reduce((acc, user) => {
    const day = user.createdAt.toISOString().slice(0, 10);
    const item = acc.find((entry) => entry.date === day);
    if (item) item.count += 1;
    else acc.push({ date: day, count: 1 });
    return acc;
  }, [] as Array<{ date: string; count: number }>);

  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { savedReels: true, notes: true } },
    },
  });

  return {
    usersCount,
    reelsCount,
    notesCount,
    dau,
    nsfwCount,
    sfwCount,
    subreddits,
    mostSearchedQueries,
    userGrowth,
    recentUsers,
  };
}

export async function deleteUserAction(id: string) {
  const session = await checkAdmin();
  if (session.user.id === id) throw new Error("Cannot delete yourself");
  await prisma.user.delete({ where: { id } });
}

export async function getUserContentAction(userId: string) {
  await checkAdmin();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      savedReels: { orderBy: { savedAt: 'desc' } },
      notes: { orderBy: { createdAt: 'desc' } }
    }
  });
  if (!user) throw new Error("User not found");
  
  return {
    reels: user.savedReels.map(r => ({ ...r, savedAt: r.savedAt.getTime(), createdUtc: Number(r.createdUtc) })),
    notes: user.notes.map(n => ({ ...n, createdAt: n.createdAt.getTime() }))
  };
}

export async function adminDeleteReelAction(id: string) {
  await checkAdmin();
  await prisma.savedReel.delete({ where: { id } });
}

export async function adminDeleteNoteAction(id: string) {
  await checkAdmin();
  await prisma.note.delete({ where: { id } });
}
