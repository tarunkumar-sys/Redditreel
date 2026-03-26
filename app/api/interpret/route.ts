import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

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
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

interface InterpretedQuery {
  keywords: string[];
  subreddits: string[];
  category: string;
  sort: 'hot' | 'top' | 'new';
  mediaType: 'video' | 'image' | 'any';
  intent: string;
  nsfw: boolean;
  enhancedQuery: string;
}

const CATEGORY_MAP: Record<string, { subreddits: string[]; keywords: string[] }> = {
  animals: { subreddits: ['aww', 'NatureIsFuckingLit', 'AnimalsBeingBros'], keywords: ['animal', 'pet', 'cute', 'wild'] },
  funny: { subreddits: ['funny', 'unexpected', 'Wellthatsucks'], keywords: ['laugh', 'humor', 'comedy', 'hilarious'] },
  gaming: { subreddits: ['gaming', 'GamePhysics', 'PS5'], keywords: ['game', 'play', 'level', 'boss'] },
  sports: { subreddits: ['sports', 'nba', 'soccer', 'nfl'], keywords: ['sport', 'goal', 'score', 'match'] },
  cars: { subreddits: ['cars', 'IdiotsInCars', 'Roadcam', 'carporn'], keywords: ['car', 'vehicle', 'drive', 'crash', 'auto'] },
  music: { subreddits: ['Music', 'listentothis', 'WeAreTheMusicMakers'], keywords: ['music', 'song', 'band', 'concert'] },
  tech: { subreddits: ['technology', 'programming', 'webdev'], keywords: ['tech', 'code', 'software', 'AI', 'computer'] },
  science: { subreddits: ['science', 'space', 'InterestingAsFuck'], keywords: ['science', 'space', 'physics', 'research'] },
  cooking: { subreddits: ['GifRecipes', 'food', 'Cooking'], keywords: ['food', 'recipe', 'cook', 'eat', 'chef'] },
  nature: { subreddits: ['earthporn', 'NatureIsFuckingLit', 'wildlifephotography'], keywords: ['nature', 'landscape', 'wildlife', 'outdoor'] },
  fails: { subreddits: ['Wellthatsucks', 'CrappyDesign', 'instantregret'], keywords: ['fail', 'mistake', 'error', 'oops'] },
  art: { subreddits: ['Art', 'DigitalArt', 'drawing', 'painting'], keywords: ['art', 'draw', 'paint', 'creative', 'design'] },
};

async function interpretWithOllama(query: string): Promise<InterpretedQuery | null> {
  try {
    const prompt = `You are a Reddit search assistant. Analyze the user query and return a JSON response.

User Query: "${query}"

Return JSON with these exact fields:
{
  "keywords": ["keyword1", "keyword2"], // 2-4 relevant search keywords
  "category": "animals|funny|gaming|sports|cars|music|tech|science|cooking|nature|fails|art|general",
  "sort": "hot|top|new",
  "mediaType": "video|image|any",
  "intent": "brief description of what user wants",
  "nsfw": false,
  "enhancedQuery": "improved search query"
}

Only return valid JSON, no other text.`;

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || 'llama3.2',
        prompt,
        stream: false,
        options: { temperature: 0.3, num_predict: 200 },
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const text = data.response?.trim();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    const categoryData = CATEGORY_MAP[parsed.category] || CATEGORY_MAP['animals'];

    return {
      keywords: parsed.keywords || [],
      subreddits: categoryData.subreddits,
      category: parsed.category || 'general',
      sort: parsed.sort || 'hot',
      mediaType: parsed.mediaType || 'any',
      intent: parsed.intent || query,
      nsfw: parsed.nsfw || false,
      enhancedQuery: parsed.enhancedQuery || query,
    };
  } catch {
    return null;
  }
}

function ruleBasedInterpret(query: string): InterpretedQuery {
  const q = query.toLowerCase();
  let category = 'general';
  let sort: 'hot' | 'top' | 'new' = 'hot';

  // Detect sort
  if (q.includes('top') || q.includes('best') || q.includes('popular')) sort = 'top';
  else if (q.includes('new') || q.includes('latest') || q.includes('recent')) sort = 'new';

  // Detect category
  if (q.match(/lion|tiger|bear|dog|cat|bird|elephant|whale|shark|wolf|fox|monkey|panda|koala|gorilla|deer|rabbit/)) category = 'animals';
  else if (q.match(/funny|meme|laugh|humor|hilarious|comedy|fail|lol/)) category = 'funny';
  else if (q.match(/game|gaming|minecraft|fortnite|cod|cs|valorant|gta|pokemon/)) category = 'gaming';
  else if (q.match(/sport|football|basketball|soccer|cricket|tennis|baseball|nba|nfl/)) category = 'sports';
  else if (q.match(/car|truck|vehicle|crash|accident|drift|race|supercar|ferrari|lamborghini/)) category = 'cars';
  else if (q.match(/music|song|band|concert|guitar|piano|rap|hiphop|rock|jazz/)) category = 'music';
  else if (q.match(/code|coding|programming|software|tech|computer|AI|robot|hack/)) category = 'tech';
  else if (q.match(/science|space|physics|chemistry|biology|nasa|spacex|rocket/)) category = 'science';
  else if (q.match(/food|cook|recipe|bake|chef|restaurant|eat|meal/)) category = 'cooking';
  else if (q.match(/nature|forest|ocean|mountain|river|waterfall|wildlife|landscape/)) category = 'nature';

  const categoryData = CATEGORY_MAP[category] || CATEGORY_MAP['animals'];

  // Extract keywords
  const stopWords = new Set(['find', 'show', 'me', 'get', 'the', 'a', 'an', 'some', 'videos', 'video', 'gifs', 'best', 'top', 'new', 'latest', 'funny', 'cool', 'awesome', 'great']);
  const keywords = q.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));

  const nsfw = q.includes('nsfw') || q.includes('18+') || q.includes('adult');

  return {
    keywords: keywords.slice(0, 4),
    subreddits: categoryData.subreddits,
    category,
    sort,
    mediaType: 'any',
    intent: `${category} content — "${keywords.slice(0, 2).join(' ') || query}"`,
    nsfw,
    enhancedQuery: keywords.join(' ') || query,
  };
}

export async function POST(request: NextRequest) {
  // Require authentication
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const { query } = await request.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const trimmedQuery = query.trim().slice(0, 500);

    // Try AI interpretation first, fall back to rule-based
    let interpreted: InterpretedQuery;
    let aiEngine: 'ollama' | 'rules' = 'rules';
    const aiResult = await interpretWithOllama(trimmedQuery);
    if (aiResult) {
      interpreted = aiResult;
      aiEngine = 'ollama';
    } else {
      interpreted = ruleBasedInterpret(trimmedQuery);
    }

    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    const kw   = interpreted.keywords.length > 0 ? interpreted.keywords.join(', ') : trimmedQuery;

    const chatResponse =
      `Found **${cap(interpreted.category)}** content for you!\n\n` +
      `**Query:** ${trimmedQuery}\n` +
      `**Keywords:** ${kw}\n` +
      `**Sort by:** ${cap(interpreted.sort)}\n` +
      `**Subreddits:** r/${interpreted.subreddits.slice(0, 3).join(', r/')}\n\n` +
      `Fetching your reel feed now…`;

    return NextResponse.json({
      success: true,
      aiEngine,
      interpreted,
      chatResponse,
    });
  } catch (error) {
    console.error('[Interpret API Error]', error);
    return NextResponse.json({ error: 'Failed to interpret query' }, { status: 500 });
  }
}
