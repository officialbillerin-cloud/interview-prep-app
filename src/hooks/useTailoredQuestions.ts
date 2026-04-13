import { useState, useCallback } from 'react';
import { topics } from '../data/topics';
import { useTailoredMode, TailoredQuestionMap } from '../context/TailoredModeContext';

export interface UseTailoredQuestionsResult {
  generate: (cvText: string, jobPostingText: string | null) => Promise<void>;
  isGenerating: boolean;
  error: string | null;
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
      // Single API call for all 9 topics
      const res = await fetch('/api/generate-tailored', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvText,
          jobText: jobPostingText,
          topics: topics.map(t => ({
            id: t.id,
            name: t.name,
            description: t.description,
            category: t.category,
          })),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(`API error ${res.status}: ${errData.error ?? 'unknown'}`);
      }

      const data = await res.json();
      const text: string = data?.text ?? '';

      const cleaned = text.replace(/^```(?:json)?[\r\n]*/i, '').replace(/[\r\n]*```\s*$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      const topicsArr: { topicId: string; questions: string[] }[] = parsed?.topics ?? [];

      const finalMap: TailoredQuestionMap = { ...loadingMap };

      for (const item of topicsArr) {
        const qs = Array.isArray(item.questions) ? item.questions : [];
        if (qs.length > 0) {
          while (qs.length < 3) qs.push(qs[qs.length - 1]);
          finalMap[item.topicId] = { questions: qs.slice(0, 3), status: 'ready' };
        }
      }

      // Any topic not returned → fallback
      for (const topic of topics) {
        if (finalMap[topic.id]?.status === 'loading') {
          finalMap[topic.id] = { questions: topic.questions, status: 'fallback' };
        }
      }

      setGeneratedQuestions(finalMap);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Generation failed';
      setError(msg);
      // Full fallback
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
