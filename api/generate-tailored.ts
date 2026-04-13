import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Groq API key not configured' });
  }

  const { cvText, jobText, topics } = req.body as {
    cvText: string;
    jobText?: string;
    topics: { id: string; name: string; description: string; category: string }[];
  };

  if (!cvText || !topics?.length) {
    return res.status(400).json({ error: 'Missing cvText or topics' });
  }

  // Truncate inputs to stay well within token limits
  const cv = cvText.slice(0, 3000);
  const job = jobText ? jobText.slice(0, 2000) : null;

  const topicList = topics
    .map((t, i) => `${i + 1}. [${t.category}] ${t.name} (id: ${t.id}) — ${t.description}`)
    .join('\n');

  const prompt = `You are a senior interview coach. Generate personalized interview questions tailored to this candidate.

CANDIDATE CV:
${cv}

TARGET ROLE / JOB POSTING:
${job ?? 'Not provided — use CV context only'}

Generate exactly 3 interview questions for EACH of the following ${topics.length} topics.
Questions must be specific to the candidate's background, skills, and target role.
Do NOT use generic questions — make them personal and relevant.

Topics:
${topicList}

Respond with ONLY valid JSON, no markdown:
{
  "topics": [
    { "topicId": "conflict-resolution", "questions": ["q1", "q2", "q3"] },
    { "topicId": "teamwork-collaboration", "questions": ["q1", "q2", "q3"] }
  ]
}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a senior interview coach. Always respond with valid JSON only.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Groq error:', response.status, err);
      return res.status(response.status).json({ error: 'Groq API error', detail: err });
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content ?? null;
    return res.status(200).json({ text });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
