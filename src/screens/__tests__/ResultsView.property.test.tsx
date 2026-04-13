// Feature: interview-prep-app, Property 9: Results_View renders complete scoring data
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ResultsView } from '../ResultsView';
import type { QuestionFeedback, ScoringResult } from '../../types';

vi.mock('../../context/AppContext', () => ({
  useAppContext: vi.fn(),
}));

vi.mock('../../hooks/useAnthropicScorer', () => ({
  useAnthropicScorer: vi.fn(),
}));

vi.mock('../../hooks/useScoreStore', () => ({
  useScoreStore: vi.fn(),
}));

import { useAppContext } from '../../context/AppContext';
import { useAnthropicScorer } from '../../hooks/useAnthropicScorer';
import { useScoreStore } from '../../hooks/useScoreStore';

const mockUseAppContext = useAppContext as ReturnType<typeof vi.fn>;
const mockUseAnthropicScorer = useAnthropicScorer as ReturnType<typeof vi.fn>;
const mockUseScoreStore = useScoreStore as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();

  mockUseAppContext.mockReturnValue({
    transcripts: ['t1', 't2', 't3'],
    selectedTopic: {
      id: 'test-topic',
      name: 'Test Topic',
      description: 'desc',
      category: 'Behavioral',
      questions: ['Q1', 'Q2', 'Q3'],
    },
    goBackToTopics: vi.fn(),
    screen: 'results',
    currentQuestionIndex: 0,
    scoringResult: null,
    selectTopic: vi.fn(),
    saveTranscript: vi.fn(),
    advanceQuestion: vi.fn(),
    setScoringResult: vi.fn(),
  });

  mockUseScoreStore.mockReturnValue({
    getScore: vi.fn().mockReturnValue(null),
    saveScore: vi.fn(),
    allScores: {},
  });
});

// Arbitrary for a single QuestionFeedback
const questionFeedbackArb = (index: number) =>
  fc.record({
    questionIndex: fc.constant(index),
    question: fc.string({ minLength: 1, maxLength: 80 }),
    transcript: fc.string({ minLength: 1, maxLength: 80 }),
    commentary: fc.string({ minLength: 1, maxLength: 120 }),
    improvementTips: fc.string({ minLength: 1, maxLength: 120 }),
  });

// Arbitrary for a full ScoringResult with exactly 3 feedback items
const scoringResultArb: fc.Arbitrary<ScoringResult> = fc
  .tuple(
    fc.integer({ min: 0, max: 10 }),
    questionFeedbackArb(0),
    questionFeedbackArb(1),
    questionFeedbackArb(2)
  )
  .map(([score, fb0, fb1, fb2]) => ({ score, feedback: [fb0, fb1, fb2] }));

/**
 * **Validates: Requirements 5.1, 5.2, 5.3**
 *
 * Property 9: Results_View renders complete scoring data
 *
 * For any ScoringResult, the Results_View should render the overall score
 * prominently and, for each of the 3 questions, display the question text,
 * commentary, and improvement tips together in the same section.
 */
describe('Property 9: Results_View renders complete scoring data', () => {
  it('renders overall score and all per-question feedback for any ScoringResult', () => {
    fc.assert(
      fc.property(scoringResultArb, (result: ScoringResult) => {
        mockUseAnthropicScorer.mockReturnValue({
          score: result.score,
          feedback: result.feedback,
          isLoading: false,
          error: null,
          submit: vi.fn(),
          retry: vi.fn(),
        });

        const { unmount } = render(<ResultsView />);

        // Requirement 5.1 — overall score rendered prominently
        const scoreEl = screen.getByTestId('overall-score');
        expect(scoreEl.textContent).toBe(String(result.score));

        // Requirements 5.2 & 5.3 — each question's text, commentary, and improvement tips visible
        for (const fb of result.feedback) {
          expect(screen.getAllByText(fb.question).length).toBeGreaterThan(0);
          expect(screen.getAllByText(fb.commentary).length).toBeGreaterThan(0);
          expect(screen.getAllByText(fb.improvementTips).length).toBeGreaterThan(0);
        }

        unmount();
      }),
      { numRuns: 100 }
    );
  });
});
