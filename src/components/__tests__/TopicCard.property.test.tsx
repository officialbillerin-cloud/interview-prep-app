// Feature: interview-prep-app, Property 2: TopicCard renders all required fields
// Feature: interview-prep-app, Property 3: TopicCard score display matches stored score
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { TopicCard } from '../TopicCard';
import { Category, Topic } from '../../types';

const categoryArb = fc.constantFrom<Category>('Behavioral', 'Technical', 'Leadership');

const topicArb = fc.record<Topic>({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.string({ minLength: 1, maxLength: 100 }),
  category: categoryArb,
  questions: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 }),
});

describe('Property 2: TopicCard renders all required fields', () => {
  it('renders name, description, and question count for any topic', () => {
    fc.assert(
      fc.property(topicArb, (topic) => {
        const { unmount } = render(<TopicCard topic={topic} score={null} onSelect={() => {}} />);
        expect(screen.getByText(topic.name)).toBeTruthy();
        expect(screen.getByText(topic.description)).toBeTruthy();
        expect(screen.getByText(`${topic.questions.length} questions`)).toBeTruthy();
        unmount();
      }),
      { numRuns: 100 }
    );
  });
});

describe('Property 3: TopicCard score display matches stored score', () => {
  it('shows score indicator iff score is non-null', () => {
    fc.assert(
      fc.property(topicArb, fc.option(fc.integer({ min: 0, max: 10 }), { nil: null }), (topic, score) => {
        const { unmount } = render(<TopicCard topic={topic} score={score} onSelect={() => {}} />);
        const indicator = screen.queryByTestId('score-indicator');
        if (score !== null) {
          expect(indicator).toBeTruthy();
        } else {
          expect(indicator).toBeNull();
        }
        unmount();
      }),
      { numRuns: 100 }
    );
  });
});
