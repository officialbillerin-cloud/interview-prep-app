import { Category, Topic } from '../types';

export function groupTopicsByCategory(topics: Topic[]): Record<Category, Topic[]> {
  const result: Record<Category, Topic[]> = {
    Behavioral: [],
    Technical: [],
    Leadership: [],
  };
  for (const topic of topics) {
    result[topic.category].push(topic);
  }
  return result;
}
