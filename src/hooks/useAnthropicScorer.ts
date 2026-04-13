import { useState, useCallback, useRef } from 'react';
import type { QuestionFeedback, ScoringResult } from '../types';

export type ScorerError = 'config-error' | 'network-error' | 'api-error' | 'parse-error';

interface UseAnthropicScorerResult {
  score: number | null;
  feedback: QuestionFeedback[] | null;
  isLoading: boolean;
  error: ScorerError | null;
  submit: (transcripts: string[], questions: string[]) => void;
  retry: () => void;
}

function computeOverallScore(feedback: QuestionFeedback[]): number {
  if (feedback.length === 0) return 0;
  return Math.round(feedback.reduce((acc, f) => acc + f.questionScore, 0) / feedback.length);
}

function buildPrompt(transcripts: string[], questions: string[]): string {
  const answers = questions
    .map((q, i) => `Question ${i + 1}: ${q}\nCandidate's Answer: ${transcripts[i]?.trim() || '(no answer provided)'}`)
    .join('\n\n---\n\n');

  return `You are a meticulous senior interview coach. Evaluate these interview answers strictly based on what was actually said.

${answers}

Score each answer on two dimensions (integers 0-100):

questionScore — content quality:
- 90-100: Exceptional, STAR structure, specific, insightful
- 70-89: Good, mostly structured and relevant
- 50-69: Average, partial answer, lacks specifics
- 30-49: Weak, vague or missing key elements
- 0-29: Very poor or no answer

toneScore — tone appropriateness:
- Behavioral questions need: reflective, accountable, collaborative tone
- Technical questions need: precise, confident, analytical tone
- Leadership questions need: authoritative yet humble, strategic tone
- 90-100: Perfect tone for context
- 70-89: Mostly appropriate
- 50-69: Neutral
- 30-49: Somewhat mismatched
- 0-29: Clearly inappropriate

Respond with ONLY valid JSON, no markdown, no extra text:
{"feedback":[{"questionIndex":0,"question":"exact question","transcript":"exact answer","questionScore":65,"toneScore":70,"toneAnalysis":"2-3 sentences on tone quality and fit","commentary":"2-4 sentences on content quality, what worked and what didn't","improvementTips":"2-4 sentences with specific actionable advice and study recommendations"},{"questionIndex":1,"question":"exact question","transcript":"exact answer","questionScore":55,"toneScore":60,"toneAnalysis":"2-3 sentences","commentary":"2-4 sentences","improvementTips":"2-4 sentences"},{"questionIndex":2,"question":"exact question","transcript":"exact answer","questionScore":70,"toneScore":75,"toneAnalysis":"2-3 sentences","commentary":"2-4 sentences","improvementTips":"2-4 sentences"}]}`;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(val)));
}

function extractJSON(raw: string): { feedback: QuestionFeedback[] } | null {
  const text = raw
    .replace(/^```(?:json)?[\r\n]*/i, '')
    .replace(/[\r\n]*```\s*$/i, '')
    .trim();

  const tryParse = (s: string) => {
    try { return validateResult(JSON.parse(s)); } catch { return null; }
  };

  return tryParse(text) ?? (() => {
    const m = text.match(/\{[\s\S]*\}/);
    return m ? tryParse(m[0]) : null;
  })();
}

function validateResult(parsed: unknown): { feedback: QuestionFeedback[] } | null {
  if (typeof parsed !== 'object' || parsed === null) return null;
  const obj = parsed as Record<string, unknown>;
  const feedbackRaw = obj['feedback'];
  if (!Array.isArray(feedbackRaw) || feedbackRaw.length === 0) return null;

  const feedback: QuestionFeedback[] = feedbackRaw.map((item: unknown, i: number) => {
    const f = (typeof item === 'object' && item !== null ? item : {}) as Record<string, unknown>;
    let qScore = f['questionScore'];
    if (typeof qScore === 'string') qScore = parseFloat(qScore as string);
    let tScore = f['toneScore'];
    if (typeof tScore === 'string') tScore = parseFloat(tScore as string);

    return {
      questionIndex: typeof f['questionIndex'] === 'number' ? f['questionIndex'] : i,
      question: String(f['question'] ?? ''),
      transcript: String(f['transcript'] ?? ''),
      questionScore: clamp(typeof qScore === 'number' && !isNaN(qScore) ? qScore : 40, 0, 100),
      toneScore: clamp(typeof tScore === 'number' && !isNaN(tScore) ? tScore : 40, 0, 100),
      toneAnalysis: String(f['toneAnalysis'] || ''),
      commentary: String(f['commentary'] || ''),
      improvementTips: String(f['improvementTips'] || ''),
    };
  });

  return { feedback };
}

async function callGroq(apiKey: string, prompt: string): Promise<ScoringResult> {
  // In production (Vercel), call the proxy endpoint to keep the key server-side
  // In development, call Groq directly using the local env key
  const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

  let text: string | null = null;

  if (isProduction) {
    // Call Vercel serverless proxy
    let response: Response;
    try {
      response = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
    } catch {
      throw { type: 'network-error' as ScorerError };
    }
    if (!response.ok) throw { type: 'api-error' as ScorerError };
    const data = await response.json().catch(() => null);
    text = data?.text ?? null;
  } else {
    // Direct Groq call for local development
    let response: Response;
    try {
      response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are a senior interview coach. Always respond with valid JSON only — no markdown, no explanation, just the raw JSON object.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 4096,
          response_format: { type: 'json_object' },
        }),
      });
    } catch {
      throw { type: 'network-error' as ScorerError };
    }
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error('Groq API error:', response.status, errText);
      throw { type: 'api-error' as ScorerError };
    }
    const data = await response.json().catch(() => null);
    text = data?.choices?.[0]?.message?.content ?? null;
  }

  if (!text) throw { type: 'parse-error' as ScorerError };

  const parsed = extractJSON(text);
  if (!parsed) {
    console.error('Groq parse failed. Raw:', text);
    throw { type: 'parse-error' as ScorerError };
  }

  return { score: computeOverallScore(parsed.feedback), feedback: parsed.feedback };
}

function analyzeFallback(answer: string, question: string): { commentary: string; toneAnalysis: string; improvementTips: string } {
  const words = answer.trim().split(/\s+/).filter(Boolean);
  const wc = words.length;
  const hasI = /\b(i|my|me|myself)\b/i.test(answer);
  const hasStar = /\b(situation|task|action|result|because|so|outcome)\b/i.test(answer);
  const hasNumbers = /\d+/.test(answer);
  const isBehavioral = /time you|situation|example|tell me about/i.test(question);
  const isTechnical = /design|system|approach|how would|debug|solve/i.test(question);

  if (wc === 0) return {
    commentary: 'No answer was recorded for this question.',
    toneAnalysis: 'No tone to evaluate — no answer was provided.',
    improvementTips: 'Prepare a structured answer using the STAR method (Situation, Task, Action, Result).',
  };

  if (wc < 30) return {
    commentary: `The answer was brief (${wc} words) and likely lacked sufficient detail. ${hasStar ? 'Some structural elements were present.' : 'No clear structure was detected.'} Interviewers expect substantive answers that demonstrate depth.`,
    toneAnalysis: hasI ? 'First-person language is appropriate, but the brevity may come across as underprepared.' : 'The answer lacked personal ownership — "I" statements help establish accountability.',
    improvementTips: `Expand to at least 60-90 words. ${isBehavioral ? 'Use STAR: Situation → Task → Action → Result.' : 'Provide concrete examples and explain your reasoning.'} Practice out loud to build fluency.`,
  };

  return {
    commentary: `The answer was ${wc > 80 ? 'detailed' : 'moderate'} (${wc} words). ${hasStar ? 'A narrative structure was present.' : 'Clearer structure would help.'} ${hasNumbers ? 'Quantitative details strengthen credibility.' : 'Adding specific numbers or outcomes would strengthen the answer.'}`,
    toneAnalysis: isTechnical
      ? `The tone appeared ${hasI ? 'personal and engaged' : 'somewhat impersonal'}. Technical questions benefit from confident, analytical language. ${hasNumbers ? 'Specifics helped convey precision.' : 'More precise language would improve the technical impression.'}`
      : `The tone appeared ${hasI ? 'personal and accountable, appropriate for this question type.' : 'somewhat detached — first-person ownership language strengthens behavioral answers.'} ${hasStar ? 'The narrative flow was present.' : 'A more structured narrative would improve impact.'}`,
    improvementTips: `${hasNumbers ? '' : 'Add specific metrics to quantify your impact. '}${hasStar ? '' : 'Structure using STAR: Situation → Task → Action → Result. '}Study strong ${isBehavioral ? 'behavioral' : isTechnical ? 'technical' : 'leadership'} answer examples on Glassdoor or Levels.fyi.`,
  };
}

function generateFallbackResult(transcripts: string[], questions: string[]): ScoringResult {
  const feedback: QuestionFeedback[] = questions.map((q, i) => {
    const answer = transcripts[i]?.trim() || '';
    const wc = answer.split(/\s+/).filter(Boolean).length;

    let questionScore = 0;
    if (wc === 0) questionScore = 0;
    else if (wc < 15) questionScore = clamp(wc * 2, 5, 25);
    else if (wc < 30) questionScore = clamp(30 + wc, 30, 49);
    else if (wc < 60) questionScore = clamp(45 + Math.floor(wc / 3), 45, 65);
    else questionScore = clamp(60 + Math.floor(wc / 10), 60, 78);

    if (/\d+/.test(answer)) questionScore = clamp(questionScore + 5, 0, 85);
    if (/\b(result|outcome|achieved|improved|reduced|increased)\b/i.test(answer)) questionScore = clamp(questionScore + 5, 0, 85);

    const toneScore = wc === 0 ? 0 : clamp(questionScore - 5, 0, 85);
    const { commentary, toneAnalysis, improvementTips } = analyzeFallback(answer, q);

    return { questionIndex: i, question: q, transcript: answer || '(no answer provided)', questionScore, toneScore, toneAnalysis, commentary, improvementTips };
  });

  return { score: computeOverallScore(feedback), feedback };
}

export function useAnthropicScorer(): UseAnthropicScorerResult {
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<QuestionFeedback[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ScorerError | null>(null);
  const lastArgsRef = useRef<{ transcripts: string[]; questions: string[] } | null>(null);

  const run = useCallback(async (transcripts: string[], questions: string[]) => {
    const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
    const apiKey = import.meta.env.VITE_GROQ_API_KEY as string | undefined;

    // In production we use the /api/score proxy (no client-side key needed)
    // In dev we need the local key
    if (!isProduction && !apiKey) { setError('config-error'); return; }

    setIsLoading(true);
    setError(null);
    setScore(null);
    setFeedback(null);

    try {
      const result = await callGroq(apiKey ?? '', buildPrompt(transcripts, questions));
      setScore(result.score);
      setFeedback(result.feedback);
    } catch (err) {
      console.warn('Groq API failed, using local analysis:', err);
      const fallback = generateFallbackResult(transcripts, questions);
      setScore(fallback.score);
      setFeedback(fallback.feedback);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submit = useCallback((transcripts: string[], questions: string[]) => {
    lastArgsRef.current = { transcripts, questions };
    run(transcripts, questions);
  }, [run]);

  const retry = useCallback(() => {
    if (lastArgsRef.current) run(lastArgsRef.current.transcripts, lastArgsRef.current.questions);
  }, [run]);

  return { score, feedback, isLoading, error, submit, retry };
}
