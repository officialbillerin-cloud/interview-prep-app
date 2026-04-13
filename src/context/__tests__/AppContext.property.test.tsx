// Feature: interview-prep-app, Property 4: Quiz session never exceeds 3 questions
// Feature: interview-prep-app, Property 11: Session state resets on back navigation
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { AppProvider, useAppContext } from '../AppContext';
import { topics } from '../../data/topics';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppProvider>{children}</AppProvider>
);

describe('Property 4: Quiz session never exceeds 3 questions', () => {
  it('currentQuestionIndex never exceeds 2 regardless of advance call count', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 20 }), (advanceCount) => {
        const { result } = renderHook(() => useAppContext(), { wrapper });

        act(() => { result.current.selectTopic(topics[0]); });

        for (let i = 0; i < advanceCount; i++) {
          act(() => { result.current.advanceQuestion(); });
        }

        expect(result.current.currentQuestionIndex).toBeLessThanOrEqual(2);
      }),
      { numRuns: 100 }
    );
  });

  it('advancing from index 0 increments to 1, from 1 to 2', () => {
    const { result } = renderHook(() => useAppContext(), { wrapper });
    act(() => { result.current.selectTopic(topics[0]); });
    expect(result.current.currentQuestionIndex).toBe(0);
    act(() => { result.current.advanceQuestion(); });
    expect(result.current.currentQuestionIndex).toBe(1);
    act(() => { result.current.advanceQuestion(); });
    expect(result.current.currentQuestionIndex).toBe(2);
  });

  it('advancing from index 2 transitions to results screen', () => {
    const { result } = renderHook(() => useAppContext(), { wrapper });
    act(() => { result.current.selectTopic(topics[0]); });
    act(() => { result.current.advanceQuestion(); });
    act(() => { result.current.advanceQuestion(); });
    act(() => { result.current.advanceQuestion(); });
    expect(result.current.screen).toBe('results');
  });
});

describe('Property 11: Session state resets on back navigation', () => {
  it('goBackToTopics always resets index, transcripts, and selectedTopic', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2 }),
        fc.array(fc.string(), { minLength: 0, maxLength: 3 }),
        (advanceCount, transcriptTexts) => {
          const { result } = renderHook(() => useAppContext(), { wrapper });

          act(() => { result.current.selectTopic(topics[0]); });
          transcriptTexts.forEach((text, i) => {
            act(() => { result.current.saveTranscript(i, text); });
          });
          for (let i = 0; i < advanceCount; i++) {
            act(() => { result.current.advanceQuestion(); });
          }

          act(() => { result.current.goBackToTopics(); });

          expect(result.current.currentQuestionIndex).toBe(0);
          expect(result.current.transcripts).toEqual([]);
          expect(result.current.selectedTopic).toBeNull();
          expect(result.current.screen).toBe('topic-selection');
        }
      ),
      { numRuns: 100 }
    );
  });
});
