import { useState, useCallback } from 'react';
import { topics } from '../data/topics';
import { useTailoredMode, TailoredQuestionMap } from '../context/TailoredModeContext';

export interface UseTailoredQuestionsResult {
  generate: (cvText: string, jobPostingText: string | null) => Promise<void>;
  isGenerating: boolean;
  error: string | null;
}

const topicPayload = topics.map(t => ({
  id: t.id,
  name: t.name,
  description: t.description,
  category: t.category,
}));

async function callGenerateTailored(cvText: string, jobText: string | null): Promise<string> {
  const body = JSON.stringify({ cvText, jobText, topics: topicPayload });
  const headers = { 'Content-Type': 'application/json' };

  const attempt = async () => fetch('/api/generate-tailored', { method: 'POST', headers, body });

  let res = await attempt();

  // Retry once on 429 after waiting for the rate limit window
  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get('retry-after') ?? '20', 10);
    await new Promise(resolve => setTimeout(resolve, (retryAfter + 2) * 1000));
    res = await attempt();
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(`API error ${res.status}: ${errData.error ?? errData.detail ?? 'unknown'}`);
  }

  const data = await res.json();
  return data?.text ?? '';
}

export function useTailoredQuestions(): UseTailoredQuestionsResult {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setGeneratedQuestions } = useTailoredMode();

  const generate = useCallback(async (cvText: string, jobPostingText: string | null) => {
    setIsGenerating(true);
    setError(null);

    // Set all topics to loading
    const loadingMap: TailoredQuestionMap = {};
    for (const topic of topics) {
      loadingMap[topic.id] = { questions: topic.questions, status: 'loading' };
    }
    setGeneratedQuestions({ ...loadingMap });

    try {
      const text = await callGenerateTailored(cvText, jobPostingText);

      const cleaned = text
        .replace(/^```(?:json)?[\r\n]*/i, '')
        .replace(/[\r\n]*```\s*$/i, '')
        .trim();

      const parsed = JSON.parse(cleaned);
      const topicsArr: { topicId: string; questions: string[] }[] = parsed?.topics ?? [];

      const finalMap: TailoredQuestionMap = { ...loadingMap };

      for (const item of topicsArr) {
        const qs = Array.isArray(item.questions) ? [...item.questions] : [];
        if (qs.length > 0) {
          while (qs.length < 3) qs.push(qs[qs.length - 1]);
          finalMap[item.topicId] = { questions: qs.slice(0, 3), status: 'ready' };
        }
      }

      // Any topic not returned → fallback to static
      for (const topic of topics) {
        if (finalMap[topic.id]?.status === 'loading') {
          finalMap[topic.id] = { questions: topic.questions, status: 'fallback' };
        }
      }

      setGeneratedQuestions(finalMap);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Generation failed';
      setError(msg);
      // Full fallback so user can still practice
      const fallbackMap: TailoredQuestionMap = {};
      for (const topic of topics) {
        fallbackMap[topic.id] = { questions: topic.questions, status: 'fallback' };
      }
      setGeneratedQuestions(fallbackMap);
    } finally {
      setIsGenerating(false);
    }
  }, [setGeneratedQuestions]);

  return { generate, isGenerating, error };
}
