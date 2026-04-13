// Feature: interview-prep-app, Property 1: Topic grouping correctness
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { groupTopicsByCategory } from '../groupTopicsByCategory';
import { Category, Topic } from '../../types';

const categoryArb = fc.constantFrom<Category>('Behavioral', 'Technical', 'Leadership');

const topicArb = fc.record<Topic>({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.string({ minLength: 1, maxLength: 100 }),
  category: categoryArb,
  questions: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 }),
});

describe('Property 1: Topic grouping correctness', () => {
  it('every topic appears in exactly one group under its declared category', () => {
    fc.assert(
      fc.property(fc.array(topicArb, { minLength: 0, maxLength: 20 }), (topics) => {
        const grouped = groupTopicsByCategory(topics);

        for (const topic of topics) {
          // appears in its own category
          expect(grouped[topic.category]).toContainEqual(topic);

          // does not appear in other categories
          const otherCategories = (['Behavioral', 'Technical', 'Leadership'] as Category[]).filter(
            c => c !== topic.category
          );
          for (const cat of otherCategories) {
            expect(grouped[cat]).not.toContainEqual(topic);
          }
        }

        // total count matches
        const total = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0);
        expect(total).toBe(topics.length);
      }),
      { numRuns: 100 }
    );
  });
});
