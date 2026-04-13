import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Tavily API key not configured' });
  }

  const { url } = req.body as { url?: string };
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return res.status(400).json({ error: 'Missing required parameter: url' });
  }

  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return res.status(400).json({ error: 'Only http and https URLs are supported' });
  }

  try {
    const response = await fetch('https://api.tavily.com/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        urls: [url.trim()],
        include_raw_content: false,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Tavily error:', response.status, err);
      return res.status(502).json({ error: `Failed to fetch job posting: ${response.status}` });
    }

    const data = await response.json();
    // Tavily extract returns { results: [{ url, raw_content, ... }] }
    const result = data?.results?.[0];
    const text = result?.raw_content ?? result?.content ?? '';

    if (!text) {
      return res.status(502).json({ error: 'No content extracted from URL' });
    }

    // Truncate to 4000 chars to keep within token budget
    return res.status(200).json({ text: text.slice(0, 4000) });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(502).json({ error: 'Failed to fetch job posting' });
  }
}
