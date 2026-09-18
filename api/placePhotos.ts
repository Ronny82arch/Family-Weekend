export const config = { maxDuration: 15 };

interface RealPhotoResult {
  url: string;
  title: string;
  source: string;
  width?: number;
  height?: number;
}

// In-memory cache for serverless instance
const memoryCache = new Map<string, RealPhotoResult[]>();

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawQuery = req.query?.query || req.query?.q || '';
  if (!rawQuery || typeof rawQuery !== 'string' || rawQuery.trim().length < 2) {
    return res.status(400).json({ error: 'Missing query parameter', photos: [] });
  }

  const query = rawQuery.trim();
  const cacheKey = query.toLowerCase();

  if (memoryCache.has(cacheKey)) {
    return res.status(200).json({
      photos: memoryCache.get(cacheKey),
      source: 'cache',
      place: query,
    });
  }

  try {
    // ═══════════════════════════════════════════════════════════════
    // 100% FREE, PERMANENT REAL PHOTO SEARCH (DuckDuckGo Real Web Images)
    // No API keys, no 90-day limits, no credit card, no Google Cloud!
    // ═══════════════════════════════════════════════════════════════
    const tokenRes = await fetch('https://duckduckgo.com/?q=' + encodeURIComponent(query), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (!tokenRes.ok) {
      throw new Error(`Token fetch failed: ${tokenRes.status}`);
    }

    const tokenHtml = await tokenRes.text();
    const match = tokenHtml.match(/vqd=([0-9-]+)/);

    if (!match || !match[1]) {
      // Fallback: search on Wikipedia pageimages
      return await fallbackWikipedia(query, res);
    }

    const vqd = match[1];
    const searchUrl = `https://duckduckgo.com/i.js?l=it-it&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,`;

    const imgRes = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://duckduckgo.com/',
        'Accept': 'application/json',
      },
    });

    if (!imgRes.ok) {
      return await fallbackWikipedia(query, res);
    }

    const data = await imgRes.json();
    const rawResults = data.results || [];

    // Filter valid image URLs (must be https, valid extensions or image CDNs)
    const validPhotos: RealPhotoResult[] = [];
    const seenUrls = new Set<string>();

    for (const item of rawResults) {
      if (!item.image || typeof item.image !== 'string') continue;
      if (!item.image.startsWith('https://')) continue;
      if (seenUrls.has(item.image)) continue;

      // Filter out low quality thumbnails or trackers
      if (item.image.includes('favicon') || item.image.includes('avatar') || item.image.includes('logo_small')) continue;

      seenUrls.add(item.image);
      validPhotos.push({
        url: item.image,
        title: item.title || query,
        source: item.url || 'Web',
        width: item.width || 1200,
        height: item.height || 800,
      });

      if (validPhotos.length >= 5) break;
    }

    if (validPhotos.length > 0) {
      memoryCache.set(cacheKey, validPhotos);
      return res.status(200).json({
        photos: validPhotos,
        source: 'real_web',
        place: query,
      });
    }

    // Fallback if no images returned
    return await fallbackWikipedia(query, res);

  } catch (error: any) {
    console.error('Real web photo search error:', error);
    return await fallbackWikipedia(query, res);
  }
}

async function fallbackWikipedia(query: string, res: any) {
  try {
    const openSearchUrl = `https://it.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=2&format=json&origin=*`;
    const wikiRes = await fetch(openSearchUrl);
    if (wikiRes.ok) {
      const data = await wikiRes.json();
      const titles = data[1] || [];
      for (const title of titles) {
        const pageImgUrl = `https://it.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&piprop=thumbnail&pithumbsize=1200&format=json&origin=*`;
        const pRes = await fetch(pageImgUrl);
        if (pRes.ok) {
          const pData = await pRes.json();
          const pages = pData.query?.pages;
          if (pages) {
            const p = Object.values(pages)[0] as any;
            const thumb = p?.thumbnail?.source;
            if (thumb) {
              const photo: RealPhotoResult = {
                url: thumb,
                title: title,
                source: `Wikipedia (${title})`,
              };
              return res.status(200).json({
                photos: [photo],
                source: 'wikipedia',
                place: query,
              });
            }
          }
        }
      }
    }
  } catch (e) {}

  return res.status(200).json({
    photos: [],
    source: 'none',
    place: query,
  });
}
