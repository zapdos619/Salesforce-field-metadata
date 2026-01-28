// Vercel Serverless Function - Proxy for Gemini API
// This keeps your API key SECRET on the server
// No password required - for you and your team

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    // Your Gemini API key is stored in Vercel Environment Variables
    // NOT in the code! This keeps it completely secret.
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'API key not configured. Please set GEMINI_API_KEY in Vercel environment variables.' 
      });
    }
    
    // Call Gemini API from server - Using Gemini 3 Flash (same as before)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ 
        error: errorData.error?.message || 'API request failed' 
      });
    }

    const data = await response.json();
    
    // Return the result
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error: ' + error.message 
    });
  }
}