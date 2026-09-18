export const config = { maxDuration: 15 };

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

  const query = req.query?.query || req.query?.q || '';
  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    return res.status(400).json({ error: 'Missing query parameter', photos: [] });
  }

  const userKey = req.query?.userKey || req.headers?.['x-user-key'] || '';
  const serverKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY || '';
  const apiKey = (typeof userKey === 'string' && userKey.trim().length > 0) ? userKey.trim() : serverKey;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server API key not configured', photos: [] });
  }

  try {
    // Step 1: Text Search to find the place and get photo references
    const searchResponse = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.photos,places.formattedAddress',
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: 'it',
        maxResultCount: 1,
      }),
    });

    if (!searchResponse.ok) {
      const errBody = await searchResponse.text();
      console.error(`Places Text Search failed (${searchResponse.status}):`, errBody);
      return res.status(searchResponse.status).json({ 
        error: `Places API error: ${searchResponse.status}`, 
        details: errBody,
        photos: [] 
      });
    }

    const searchData = await searchResponse.json();
    const place = searchData.places?.[0];

    if (!place || !place.photos || place.photos.length === 0) {
      return res.status(200).json({ 
        photos: [], 
        place: place?.displayName?.text || null,
        address: place?.formattedAddress || null,
        message: 'No photos found for this place' 
      });
    }

    // Step 2: Build photo URLs from photo references
    // The Places API (New) photo endpoint: GET https://places.googleapis.com/v1/{name}/media
    // name = places/{placeId}/photos/{photoReference}
    const maxPhotos = Math.min(place.photos.length, 5);
    const photoUrls: { url: string; width: number; height: number; authors: string[] }[] = [];

    for (let i = 0; i < maxPhotos; i++) {
      const photoRef = place.photos[i];
      const photoName = photoRef.name; // e.g. "places/ChIJ.../photos/AUy..."

      // The photo media URL - this returns a redirect to the actual image
      const mediaUrl = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=800&maxWidthPx=1200&key=${apiKey}`;

      // Fetch the photo to get the final redirected URL
      try {
        const photoRes = await fetch(mediaUrl, { redirect: 'follow' });
        if (photoRes.ok) {
          // The final URL after redirect is the actual image URL
          const finalUrl = photoRes.url;
          photoUrls.push({
            url: finalUrl,
            width: photoRef.widthPx || 1200,
            height: photoRef.heightPx || 800,
            authors: (photoRef.authorAttributions || []).map((a: any) => a.displayName || 'Google'),
          });
        }
      } catch (photoErr) {
        console.warn(`Failed to fetch photo ${i}:`, photoErr);
      }
    }

    return res.status(200).json({
      photos: photoUrls,
      place: place.displayName?.text || query,
      address: place.formattedAddress || null,
      placeId: place.id || null,
    });

  } catch (error: any) {
    console.error('PlacePhotos proxy error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal Server Error', 
      photos: [] 
    });
  }
}
