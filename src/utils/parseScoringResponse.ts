import type { ScoringResult, QuestionFeedback } from '../types';

export function parseScoringResponse(raw: string): ScoringResult | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null) return null;
  const obj = parsed as Record<string, unknown>;

  const score = obj['score'];
  if (typeof score !== 'number' || score < 0 || score > 100) return null;

  const feedback = obj['feedback'];
  if (!Array.isArray(feedback) || feedback.length === 0) return null;

  const validatedFeedback: QuestionFeedback[] = [];
  for (const item of feedback) {
    if (typeof item !== 'object' || item === null) return null;
    const f = item as Record<string, unknown>;
    validatedFeedback.push({
      questionIndex: typeof f['questionIndex'] === 'number' ? f['questionIndex'] : 0,
      question: String(f['question'] ?? ''),
      transcript: String(f['transcript'] ?? ''),
      questionScore: typeof f['questionScore'] === 'number' ? f['questionScore'] : 50,
      toneScore: typeof f['toneScore'] === 'number' ? f['toneScore'] : 50,
      toneAnalysis: String(f['toneAnalysis'] ?? ''),
      commentary: String(f['commentary'] ?? ''),
      improvementTips: String(f['improvementTips'] ?? ''),
    });
  }

  return { score, feedback: validatedFeedback };
}
