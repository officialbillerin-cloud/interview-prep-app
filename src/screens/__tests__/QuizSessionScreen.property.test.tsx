// Feature: interview-prep-app, Property 5: Next button enabled iff transcript exists
// Feature: interview-prep-app, Property 6: Interim transcript is displayed while recording
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { QuizSessionScreen } from '../QuizSessionScreen';
import { topics } from '../../data/topics';
import type { UseSpeechRecognitionReturn } from '../../hooks/useSpeechRecognition';

const mockTopic = topics[0];

vi.mock('../../context/AppContext', () => ({
  useAppContext: vi.fn(),
}));

vi.mock('../../hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: vi.fn(),
}));

import { useAppContext } from '../../context/AppContext';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

const mockUseAppContext = useAppContext as ReturnType<typeof vi.fn>;
const mockUseSpeechRecognition = useSpeechRecognition as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

/**
 * **Validates: Requirements 2.7**
 *
 * Property 5: Next button enabled iff transcript exists
 *
 * For any combination of live transcript and saved transcript,
 * the Next button's enabled state must match whether a non-empty
 * transcript is present.
 */
describe('Property 5: Next button enabled iff transcript exists', () => {
  it('button enabled state matches transcript presence for any transcript string', () => {
    // Arbitraries for transcript strings (empty vs non-empty)
    const transcriptArb = fc.string();
    const savedTranscriptArb = fc.string();

    fc.assert(
      fc.property(transcriptArb, savedTranscriptArb, (liveTranscript, savedTranscript) => {
        const speechState: UseSpeechRecognitionReturn = {
          isRecording: false,
          transcript: liveTranscript,
          interimTranscript: '',
          startRecording: vi.fn(),
          stopRecording: vi.fn(),
          error: null,
          retry: vi.fn(),
        };

        mockUseSpeechRecognition.mockReturnValue(speechState);
        mockUseAppContext.mockReturnValue({
          selectedTopic: mockTopic,
          currentQuestionIndex: 0,
          transcripts: [savedTranscript],
          saveTranscript: vi.fn(),
          advanceQuestion: vi.fn(),
          screen: 'quiz-session',
          scoringResult: null,
          selectTopic: vi.fn(),
          goBackToTopics: vi.fn(),
          setScoringResult: vi.fn(),
        });

        const { unmount } = render(<QuizSessionScreen />);

        const hasTranscript =
          savedTranscript.trim().length > 0 || liveTranscript.trim().length > 0;

        const btn = screen.getByRole('button', { name: /next|finish/i });
        if (hasTranscript) {
          expect(btn).not.toBeDisabled();
        } else {
          expect(btn).toBeDisabled();
        }

        unmount();
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * **Validates: Requirements 2.10**
 *
 * Property 6: Interim transcript is displayed while recording
 *
 * For any non-empty interim transcript string, when recording is active,
 * the interim text must be visible in the rendered QuizSessionScreen.
 */
describe('Property 6: Interim transcript is displayed while recording', () => {
  it('interim transcript text is visible for any non-empty string while recording', () => {
    // Only non-empty strings — empty interim is not rendered by the component
    const interimArb = fc.string({ minLength: 1 });

    fc.assert(
      fc.property(interimArb, (interimTranscript) => {
        const speechState: UseSpeechRecognitionReturn = {
          isRecording: true,
          transcript: '',
          interimTranscript,
          startRecording: vi.fn(),
          stopRecording: vi.fn(),
          error: null,
          retry: vi.fn(),
        };

        mockUseSpeechRecognition.mockReturnValue(speechState);
        mockUseAppContext.mockReturnValue({
          selectedTopic: mockTopic,
          currentQuestionIndex: 0,
          transcripts: [],
          saveTranscript: vi.fn(),
          advanceQuestion: vi.fn(),
          screen: 'quiz-session',
          scoringResult: null,
          selectTopic: vi.fn(),
          goBackToTopics: vi.fn(),
          setScoringResult: vi.fn(),
        });

        const { unmount, container } = render(<QuizSessionScreen />);

        expect(container.textContent).toContain(interimTranscript);

        unmount();
      }),
      { numRuns: 100 }
    );
  });
});
