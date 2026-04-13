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
  if (typeof score !== 'number' || score < 0 || score > 10) return null;

  const feedback = obj['feedback'];
  if (!Array.isArray(feedback) || feedback.length !== 3) return null;

  const validatedFeedback: QuestionFeedback[] = [];
  for (const item of feedback) {
    if (typeof item !== 'object' || item === null) return null;
    const f = item as Record<string, unknown>;

    if (
      typeof f['questionIndex'] !== 'number' ||
      typeof f['question'] !== 'string' ||
      typeof f['transcript'] !== 'string' ||
      typeof f['commentary'] !== 'string' ||
      typeof f['improvementTips'] !== 'string' ||
      f['commentary'] === '' ||
      f['improvementTips'] === ''
    ) {
      return null;
    }

    validatedFeedback.push({
      questionIndex: f['questionIndex'] as number,
      question: f['question'] as string,
      transcript: f['transcript'] as string,
      commentary: f['commentary'] as string,
      improvementTips: f['improvementTips'] as string,
    });
  }

  return { score, feedback: validatedFeedback };
}
