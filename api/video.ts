// Vercel Serverless Function (Node.js runtime)
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL required' });

    const serverKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
    
    if (!serverKey) {
      return res.status(500).json({ error: 'API_KEY_REQUIRED' });
    }

    // Append the server key securely
    const secureUrl = `${url}&key=${serverKey}`;

    const videoResponse = await fetch(secureUrl);
    
    if (!videoResponse.ok) {
        return res.status(videoResponse.status).json({ error: 'Failed to fetch video' });
    }

    // Proxy the video stream
    res.setHeader('Content-Type', videoResponse.headers.get('content-type') || 'video/mp4');
    
    // Pipe the response body to the client
    const buffer = await videoResponse.arrayBuffer();
    res.send(Buffer.from(buffer));
    
  } catch (error) {
    console.error("Video Proxy Error:", error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
