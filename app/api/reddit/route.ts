import { NextRequest, NextResponse } from 'next/server';
import { prisma, auth } from '@/auth';

/* ═══════════════════════════════════════════════════════
   AUTH GUARD — Prevent unauthorized API access
═══════════════════════════════════════════════════════ */
async function requireAuth(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }
  return null;
}

async function trackSearchQuery(query: string) {
  if (!query || query.trim().length === 0) return;
  const normalized = query.trim().toLowerCase();
  await prisma.searchQuery.upsert({
    where: { query: normalized },
    create: { query: normalized, hits: 1 },
    update: { hits: { increment: 1 } },
  });
}

async function trackUserActivity(type: string, data: Record<string, unknown> = {}) {
  try {
    const session = await auth();
    if (!session?.user?.id) return;
    await prisma.userActivity.create({
      data: { userId: session.user.id, type, payload: JSON.stringify(data) },
    });
  } catch (err) {
    // ignore for read path
  }
}

/* ═══════════════════════════════════════════════════════
   REDDIT OAUTH — client-credentials token (server-side)
═══════════════════════════════════════════════════════ */
let _tokenCache: { token: string; expires: number } | null = null;

async function getToken(): Promise<string | null> {
  if (_tokenCache && Date.now() < _tokenCache.expires) return _tokenCache.token;

  const id  = process.env.REDDIT_CLIENT_ID;
  const sec = process.env.REDDIT_CLIENT_SECRET;
  if (!id || !sec) return null;

  try {
    const res = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${id}:${sec}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent':   'RedditReelAI/2.0 by RedditReelDev',
      },
      body: 'grant_type=client_credentials',
    });
    if (!res.ok) return null;
    const d = await res.json();
    if (!d.access_token) return null;
    _tokenCache = { token: d.access_token, expires: Date.now() + (d.expires_in - 120) * 1000 };
    return _tokenCache.token;
  } catch { return null; }
}

/* ═══════════════════════════════════════════════════════
   COMMUNITY LISTS
   — sourced from reddit.com/best/communities + curated
═══════════════════════════════════════════════════════ */

// Normal-mode communities per category (10-15 per category, rotated)
const NORMAL_POOLS: Record<string, string[]> = {
  animals:  ['NatureIsFuckingLit','aww','AnimalsBeingBros','BeAmazed','nextfuckinglevel','WildernessBackpacking','rarepuppers','cats','dogs','Zoomies','AnimalsOnReddit','wildlifephotography','HumansBeingBros'],
  funny:    ['funny','Unexpected','instant_regret','therewasanattempt','Wellthatsucks','facepalm','maybemaybemaybe','holdmybeer','Tiktokcringe','youseeingthis','CrazyFuckingVideos','AbruptChaos','ClipsThatFellOffReddit'],
  gaming:   ['gaming','GamePhysics','Unexpected','PS5','XboxSeriesX','PCGaming','Minecraft','GTA','gaming','nerdgaming','pcmasterrace','gamedev','gifsofgaming'],
  sports:   ['sports','nba','soccer','nfl','cricket','MMA','hockey','baseball','tennis','Olympics','nextfuckinglevel','football','AmazingAthletics'],
  cars:     ['IdiotsInCars','Roadcam','dashcam','cars','CarsInDepth','carporn','Justrolledintotheshop','AutoDetailing','NASCAR','formula1','rallying','Autos'],
  music:    ['Music','WeAreTheMusicMakers','listentothis','LiveJamBand','concerts','ThisIsOurMusic','guitar','piano','beatmakers','hiphopheads','EDM','Metal'],
  tech:     ['technology','programming','webdev','geek','techsupportgore','softwaregore','mildlyinteresting','ProgrammerHumor','compsci','Futurology'],
  science:  ['space','nasa','Astronomy','Physics','chemistry','biology','InterestingAsFuck','Damnthatsinteresting','woahdude','science','cosmology','EarthPorn'],
  cooking:  ['GifRecipes','food','Cooking','FoodPorn','BBQ','sushi','pasta','Baking','CastIronCooking','MealPrepSunday','AskCulinary','grilling'],
  nature:   ['EarthPorn','NatureIsFuckingLit','wildlifephotography','Waterfalls','DesertPorn','SkyPorn','BeachPorn','springlifeporn','TreesSuckingThingsUp','clouds'],
  fails:    ['Wellthatsucks','CrappyDesign','mildlyinfuriating','instant_regret','therewasanattempt','ATBGE','BadDesign','facepalm','Oopsie','AskReddit'],
  art:      ['Art','DigitalArt','drawing','painting','Sculpture','Illustration','ConceptArt','graffiti','woahdude','awe','PixelArt','animation'],
  crashes:  ['IdiotsInCars','Roadcam','dashcam','PublicFreakout','CrazyFuckingVideos','WTF','Unexpected','dashcamgifs'],
  coding:   ['programming','webdev','learnprogramming','reactjs','Python','javascript','rust','golang','cpp','devops','MachineLearning','AIResearch'],
  general:  ['nextfuckinglevel','oddlysatisfying','PublicFreakout','interestingasfuck','Damnthatsinteresting','BeAmazed','woahdude','WTF','maybemaybemaybe','AbruptChaos','nextfuckinglevel','CrazyFuckingVideos','unexpected'],
};

// NSFW adult communities — trending/top sources
const NSFW_POOLS: Record<string, string[]> = {
  default:  ['nsfw','NSFW','nsfwvideos','nsfw_gifs','RealGirls','gonewild','Amateur','holdthemoan','PetiteGoneWild','Boobies','BigBoobs','tiktoknsfw','nsfw_videos','SexyVideo','18_nsfw'],
  hot:      ['NSFW','nsfw','nsfwvideos','HotWifeHub','RealGirls','Amateur','nsfw_gifs','gonewild','holdthemoan','GirlsOnTelegram','onlyfansleaks5'],
  top:      ['gonewild','RealGirls','Amateur','Boobies','PetiteGoneWild','BigBoobs','nsfw_videos','tiktoknsfw','18_nsfw','NSFWvideos','thickfitness'],
  dance:    ['SexyDance','tiktoknsfw','NSFWhot','nsfwvideos','sexy_videos'],
  gym:      ['GymMotivation','thickfitness','FitNakedGirls','fitness'],
  amateur:  ['Amateur','gonewild','selfies','RealGirls','PetiteGoneWild'],
  cosplay:  ['nsfwcosplay','cosplaynsfw','CosplayGirls'],
  gaming:   ['gamingnsfw','nsfwgaming','overwatchnsfw','LeagueOfSluts'],
};

/* ═══════════════════════════════════════════════════════
   CATEGORY → POOL KEY mapping (matches interpret route)
═══════════════════════════════════════════════════════ */
function getCommunityPool(query: string, nsfw: boolean): string[] {
  const q = query.toLowerCase();

  if (nsfw) {
    if (q.match(/cosplay|anime|hentai/)) return NSFW_POOLS.cosplay;
    if (q.match(/game|gaming|overwatch/)) return NSFW_POOLS.gaming;
    if (q.match(/dance|tiktok/))  return NSFW_POOLS.dance;
    if (q.match(/gym|thirst|fit/)) return NSFW_POOLS.gym;
    if (q.match(/amateur/))        return NSFW_POOLS.amateur;
    if (q.match(/top|best/))       return NSFW_POOLS.top;
    return NSFW_POOLS.hot;
  }

  if (q.match(/lion|tiger|bear|dog|cat|bird|elephant|whale|shark|wolf|animal|pet|wildlife/)) return NORMAL_POOLS.animals;
  if (q.match(/funny|meme|fail|lol|humor|hilarious|comedy/))   return NORMAL_POOLS.funny;
  if (q.match(/game|gaming|minecraft|fortnite|cod|valorant|gta|pokemon/)) return NORMAL_POOLS.gaming;
  if (q.match(/sport|football|basketball|soccer|cricket|tennis|nba|nfl/)) return NORMAL_POOLS.sports;
  if (q.match(/car|truck|crash|accident|drift|race|ferrari|lamborghini/)) return NORMAL_POOLS.cars;
  if (q.match(/music|song|concert|guitar|piano|rap|hiphop/))   return NORMAL_POOLS.music;
  if (q.match(/code|coding|programming|software|tech|ai|robot/)) return NORMAL_POOLS.coding;
  if (q.match(/science|space|physics|nasa|rocket|astronomy/))  return NORMAL_POOLS.science;
  if (q.match(/food|cook|recipe|bake|chef|restaurant/))        return NORMAL_POOLS.cooking;
  if (q.match(/nature|forest|ocean|mountain|waterfall|landscape/)) return NORMAL_POOLS.nature;
  if (q.match(/crash|accident|dashcam|roadcam/))               return NORMAL_POOLS.crashes;
  if (q.match(/art|draw|paint|creative|design|sketch/))        return NORMAL_POOLS.art;
  return NORMAL_POOLS.general;
}

function detectSort(query: string, nsfw: boolean): 'hot' | 'top' | 'new' {
  if (nsfw) return 'top';   // NSFW always fetches top
  const q = query.toLowerCase();
  if (q.match(/top|best|popular|trending|viral/)) return 'top';
  if (q.match(/new|latest|recent/)) return 'new';
  return 'hot';
}

/* ═══════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════ */
interface RedditChild {
  data: {
    id: string;
    title: string;
    subreddit: string;
    author: string;
    score: number;
    num_comments: number;
    url: string;
    permalink: string;
    thumbnail: string;
    is_video: boolean;
    over_18: boolean;
    media?: { reddit_video?: { fallback_url: string; hls_url: string } };
    secure_media?: { reddit_video?: { fallback_url: string; hls_url: string } };
    preview?: {
      images?: Array<{ source: { url: string }; resolutions: Array<{ url: string }> }>;
      reddit_video_preview?: { fallback_url: string };
    };
    crosspost_parent_list?: RedditChild['data'][];
    post_hint?: string;
    domain?: string;
    created_utc: number;
    upvote_ratio: number;
    gilded: number;
  };
}

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

/* ═══════════════════════════════════════════════════════
   FETCH one subreddit (OAuth → public fallback)
═══════════════════════════════════════════════════════ */
async function fetchSub(sub: string, sort: string, limit: number, after?: string): Promise<{ posts: RedditChild['data'][]; nextAfter: string | null }> {
  const qs = `?limit=${limit}&raw_json=1${after ? `&after=${after}` : ''}`;
  const token = await getToken();

  const tryFetch = async (base: string, headers: HeadersInit) => {
    const res = await fetch(`${base}/r/${sub}/${sort}.json${qs}`, { headers, next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json();
  };

  let data: { data?: { children?: RedditChild[]; after?: string | null } } | null = null;

  // 1. OAuth API
  if (token) {
    try {
      data = await tryFetch('https://oauth.reddit.com', {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'RedditReelAI/2.0',
      });
    } catch { /* fall through */ }
  }

  // 2. Public JSON fallback
  if (!data) {
    try {
      data = await tryFetch('https://www.reddit.com', {
        'User-Agent': 'RedditReelAI/2.0',
        Accept: 'application/json',
      });
    } catch { return { posts: [], nextAfter: null }; }
  }

  const children = data?.data?.children ?? [];
  return {
    posts: children.map((c: RedditChild) => c.data),
    nextAfter: data?.data?.after ?? null,
  };
}

/* ═══════════════════════════════════════════════════════
   MEDIA EXTRACTION
═══════════════════════════════════════════════════════ */
function extractMedia(post: RedditChild['data']): { videoUrl: string | null; imageUrl: string | null; isVideo: boolean } {
  const rv = post.media?.reddit_video || post.secure_media?.reddit_video;
  if (rv) return { videoUrl: rv.hls_url?.replace(/&amp;/g, '&') ?? rv.fallback_url?.replace(/&amp;/g, '&') ?? null, imageUrl: post.thumbnail?.startsWith('http') ? post.thumbnail : null, isVideo: true };

  if (post.crosspost_parent_list?.length) {
    const cp = post.crosspost_parent_list[0];
    const crv = cp.media?.reddit_video || cp.secure_media?.reddit_video;
    if (crv) return { videoUrl: crv.hls_url?.replace(/&amp;/g, '&') ?? crv.fallback_url?.replace(/&amp;/g, '&') ?? null, imageUrl: null, isVideo: true };
  }

  const pv = post.preview?.reddit_video_preview;
  if (pv) return { videoUrl: pv.fallback_url?.replace(/&amp;/g, '&') ?? null, imageUrl: null, isVideo: true };

  if (post.url?.match(/\.(mp4|webm|gifv)$/i)) return { videoUrl: post.url.replace(/\.gifv$/i, '.mp4'), imageUrl: null, isVideo: true };
  if (post.url?.match(/\.gif$/i)) return { videoUrl: null, imageUrl: post.url, isVideo: false };

  const img = post.preview?.images?.[0];
  if (img) {
    const src = img.source?.url?.replace(/&amp;/g, '&');
    if (src) return { videoUrl: null, imageUrl: src, isVideo: false };
  }

  if (post.thumbnail?.startsWith('http')) return { videoUrl: null, imageUrl: post.thumbnail, isVideo: false };
  return { videoUrl: null, imageUrl: null, isVideo: false };
}

function hasMedia(post: RedditChild['data']): boolean {
  const { videoUrl, imageUrl } = extractMedia(post);
  return !!(videoUrl || imageUrl) && (
    post.is_video || post.post_hint === 'image' || post.post_hint === 'rich:video' ||
    post.post_hint === 'hosted:video' || !!post.preview?.images?.length ||
    !!(post.url?.match(/\.(mp4|webm|gif|gifv)$/i)) ||
    !!(post.domain?.match(/gfycat|redgifs|imgur|v\.redd\.it/))
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN ROUTE
═══════════════════════════════════════════════════════ */
export async function GET(request: NextRequest) {
  // Require authentication
  const authError = await requireAuth(request);
  if (authError) return authError;

  const sp       = request.nextUrl.searchParams;
  const query    = sp.get('query') || 'trending videos';
  const nsfw     = sp.get('nsfw') === 'true';
  const limit    = Math.min(Math.max(parseInt(sp.get('limit') || '12'), 5), 25);

  // Analytics hooks
  await trackSearchQuery(query);
  await trackUserActivity('search', { query, nsfw });

  // Pagination state passed from client
  const subIdxParam    = parseInt(sp.get('subIdx') ?? '0');
  const afterParam     = sp.get('after') ?? undefined;
  const subsParam      = sp.get('subs') ?? '';          // comma-separated pool snapshot
  const sortCycleParam = parseInt(sp.get('sortCycle') ?? '0'); // 0=hot/top, 1=new, 2=top (cycle for variety)

  try {
    const pool = subsParam ? subsParam.split(',') : getCommunityPool(query, nsfw);
    const sorts: Array<'hot' | 'top' | 'new'> = nsfw
      ? ['top', 'hot', 'new']
      : [detectSort(query, nsfw), 'top', 'new'];
    const sort = sorts[sortCycleParam % sorts.length];

    // Current subreddit index (wraps around for true infinite)
    const subIdx  = subIdxParam % pool.length;
    const sub   = pool[subIdx];
    const seenIds = new Set<string>((sp.get('seenIds') ?? '').split(',').filter(Boolean));

    // Fetch from current sub
    const { posts, nextAfter } = await fetchSub(sub, sort, limit, afterParam);

    // Filter
    const valid: ReelPost[] = [];
    for (const post of posts) {
      if (seenIds.has(post.id)) continue;
      if (!hasMedia(post)) continue;
      if (!nsfw && post.over_18) continue;
      if (nsfw && !post.over_18 && Math.random() > 0.3) continue; // prefer NSFW in adult mode

      const { videoUrl, imageUrl, isVideo } = extractMedia(post);
      const score =
        Math.log10(Math.max(post.score, 1)) * 20 +
        Math.log10(Math.max(post.num_comments, 1)) * 8 +
        post.upvote_ratio * 15 +
        (post.is_video ? 10 : 0);

      valid.push({
        id: post.id, title: post.title, subreddit: post.subreddit, author: post.author,
        score: post.score, numComments: post.num_comments,
        permalink: `https://reddit.com${post.permalink}`,
        videoUrl, imageUrl, isVideo, isNsfw: post.over_18,
        createdUtc: post.created_utc, upvoteRatio: post.upvote_ratio,
        thumbnail: post.thumbnail?.startsWith('http') ? post.thumbnail : null,
        relevanceScore: Math.round(score),
      });
    }

    // If this subreddit is exhausted (no after), advance to next
    let nextSubIdx  = subIdx;
    let nextAfterOut: string | null = nextAfter;
    let nextSortCycle = sortCycleParam;

    if (!nextAfter || valid.length < 4) {
      nextSubIdx = (subIdx + 1) % pool.length;
      nextAfterOut = null;
      // After one full pool rotation, cycle sort for variety
      if (nextSubIdx === 0) nextSortCycle = (sortCycleParam + 1) % sorts.length;
    }

    return NextResponse.json({
      success: true,
      reels: valid,
      pagination: {
        subs:      pool.join(','),
        subIdx:    nextSubIdx,
        after:     nextAfterOut,
        sortCycle: nextSortCycle,
        currentSub: sub,
      },
      meta: { query, nsfw, sort, sub, total: valid.length },
    });
  } catch (err) {
    console.error('[Reddit API]', err);
    return NextResponse.json({ success: false, error: 'Fetch failed', reels: [] }, { status: 500 });
  }
}
