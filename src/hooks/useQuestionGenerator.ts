import { useState, useCallback } from 'react';
import type { Topic } from '../types';

export type GeneratorState = 'idle' | 'generating' | 'done' | 'error';

function buildGenerationPrompt(topic: Topic): string {
  return `You are a senior interview coach. A candidate has mastered the topic "${topic.name}" (${topic.category} category) by scoring 92+ out of 100.

Generate 3 NEW, more challenging interview questions for this topic. The questions should:
- Be harder and more nuanced than the original questions
- Require deeper reflection, specific examples, and advanced thinking
- Push the candidate beyond surface-level answers
- Be appropriate for senior-level interviews

Original questions (do NOT repeat these):
${topic.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Respond with ONLY a JSON object, no markdown:
{"questions":["<question 1>","<question 2>","<question 3>"]}`;
}

export function useQuestionGenerator() {
  const [state, setState] = useState<GeneratorState>('idle');

  const generateQuestions = useCallback(async (topic: Topic): Promise<string[] | null> => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
    if (!apiKey) return null;

    setState('generating');

    try {
      const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
      let text: string | null = null;

      if (isProduction) {
        const res = await fetch('/api/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: buildGenerationPrompt(topic) }),
        });
        if (!res.ok) throw new Error('proxy error');
        const data = await res.json();
        text = data?.text ?? null;
      } else {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: 'You are a senior interview coach. Respond with valid JSON only.' },
              { role: 'user', content: buildGenerationPrompt(topic) },
            ],
            temperature: 0.7,
            max_tokens: 512,
            response_format: { type: 'json_object' },
          }),
        });
        if (!res.ok) throw new Error('groq error');
        const data = await res.json();
        text = data?.choices?.[0]?.message?.content ?? null;
      }

      if (!text) throw new Error('empty response');

      const cleaned = text.replace(/^```(?:json)?[\r\n]*/i, '').replace(/[\r\n]*```\s*$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      const questions: string[] = parsed?.questions;

      if (!Array.isArray(questions) || questions.length < 3) throw new Error('invalid format');

      setState('done');
      return questions.slice(0, 3);
    } catch (err) {
      console.error('Question generation failed:', err);
      setState('error');
      return null;
    }
  }, []);

  return { state, generateQuestions };
}
