// Feature: interview-prep-app, Property 8: Parsed scoring result is structurally valid
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { parseScoringResponse } from '../parseScoringResponse';

/**
 * Validates: Requirements 4.2, 4.3
 * Property 8: Parsed scoring result is structurally valid
 *
 * For any well-formed Claude response shape, parseScoringResponse must return
 * a result where 0 ≤ score ≤ 10 and feedback is an array of exactly 3 items,
 * each with non-empty commentary and improvementTips.
 */

const feedbackItemArb = fc.record({
  questionIndex: fc.integer({ min: 0, max: 2 }),
  question: fc.string({ minLength: 1 }),
  transcript: fc.string(),
  commentary: fc.string({ minLength: 1 }),
  improvementTips: fc.string({ minLength: 1 }),
});

const wellFormedResponseArb = fc
  .tuple(
    fc.integer({ min: 0, max: 10 }),
    fc.tuple(feedbackItemArb, feedbackItemArb, feedbackItemArb),
  )
  .map(([score, [f0, f1, f2]]) =>
    JSON.stringify({ score, feedback: [f0, f1, f2] }),
  );

describe('parseScoringResponse – Property 8', () => {
  it('returns a structurally valid ScoringResult for any well-formed input', () => {
    fc.assert(
      fc.property(wellFormedResponseArb, (raw) => {
        const result = parseScoringResponse(raw);

        expect(result).not.toBeNull();
        expect(result!.score).toBeGreaterThanOrEqual(0);
        expect(result!.score).toBeLessThanOrEqual(10);
        expect(result!.feedback).toHaveLength(3);

        for (const item of result!.feedback) {
          expect(item.commentary.length).toBeGreaterThan(0);
          expect(item.improvementTips.length).toBeGreaterThan(0);
        }
      }),
    );
  });

  it('returns null for malformed JSON', () => {
    fc.assert(
      fc.property(fc.string(), (raw) => {
        // Only test strings that are not valid JSON
        try {
          JSON.parse(raw);
          return; // skip valid JSON strings
        } catch {
          expect(parseScoringResponse(raw)).toBeNull();
        }
      }),
    );
  });

  it('returns null when score is out of range', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ max: -1 }),
          fc.integer({ min: 11 }),
        ),
        fc.tuple(feedbackItemArb, feedbackItemArb, feedbackItemArb),
        (score, [f0, f1, f2]) => {
          const raw = JSON.stringify({ score, feedback: [f0, f1, f2] });
          expect(parseScoringResponse(raw)).toBeNull();
        },
      ),
    );
  });

  it('returns null when feedback does not have exactly 3 items', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10 }),
        fc.array(feedbackItemArb, { minLength: 0, maxLength: 10 }).filter(
          (arr) => arr.length !== 3,
        ),
        (score, feedback) => {
          const raw = JSON.stringify({ score, feedback });
          expect(parseScoringResponse(raw)).toBeNull();
        },
      ),
    );
  });
});
