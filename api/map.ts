// Vercel Serverless Function
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { markers } = req.query;
    const serverKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
    
    if (!serverKey) {
      return res.status(500).json({ error: 'API_KEY_REQUIRED' });
    }

    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=600x400&maptype=terrain&${markers}&key=${serverKey}`;

    const mapResponse = await fetch(mapUrl);
    
    if (!mapResponse.ok) {
        return res.status(mapResponse.status).json({ error: 'Failed to fetch map' });
    }

    res.setHeader('Content-Type', mapResponse.headers.get('content-type') || 'image/png');
    const buffer = await mapResponse.arrayBuffer();
    res.send(Buffer.from(buffer));
    
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
