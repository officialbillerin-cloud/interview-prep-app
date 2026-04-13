import { Topic } from '../types';

export const topics: Topic[] = [
  // Behavioral
  {
    id: 'conflict-resolution',
    name: 'Conflict Resolution',
    description: 'Practice handling workplace disagreements and interpersonal challenges.',
    category: 'Behavioral',
    questions: [
      'Tell me about a time you had a conflict with a coworker. How did you handle it?',
      'Describe a situation where you disagreed with your manager. What did you do?',
      'Give an example of a time you had to navigate a difficult team dynamic.',
    ],
  },
  {
    id: 'teamwork-collaboration',
    name: 'Teamwork & Collaboration',
    description: 'Demonstrate your ability to work effectively with others toward shared goals.',
    category: 'Behavioral',
    questions: [
      'Describe a successful team project you contributed to. What was your role?',
      'Tell me about a time you helped a struggling teammate. What did you do?',
      'Give an example of when you had to collaborate with someone whose work style differed from yours.',
    ],
  },
  {
    id: 'adaptability',
    name: 'Adaptability',
    description: 'Show how you handle change, ambiguity, and unexpected challenges.',
    category: 'Behavioral',
    questions: [
      'Tell me about a time you had to adapt quickly to a significant change at work.',
      'Describe a situation where you had to work with incomplete information. How did you proceed?',
      'Give an example of a time a project changed direction mid-way. How did you respond?',
    ],
  },

  // Technical
  {
    id: 'system-design',
    name: 'System Design',
    description: 'Walk through your approach to designing scalable and reliable systems.',
    category: 'Technical',
    questions: [
      'How would you design a URL shortening service like bit.ly?',
      'Walk me through how you would design a notification system for a large-scale application.',
      'How would you approach designing a rate limiter for an API?',
    ],
  },
  {
    id: 'debugging-problem-solving',
    name: 'Debugging & Problem Solving',
    description: 'Demonstrate your systematic approach to diagnosing and fixing technical issues.',
    category: 'Technical',
    questions: [
      'Describe your process when you encounter a bug you cannot immediately reproduce.',
      'Tell me about a particularly challenging technical problem you solved. What was your approach?',
      'How do you prioritize and tackle technical debt in a codebase?',
    ],
  },
  {
    id: 'code-quality',
    name: 'Code Quality & Best Practices',
    description: 'Discuss your standards for writing maintainable, testable, and clean code.',
    category: 'Technical',
    questions: [
      'How do you ensure the code you write is maintainable by others?',
      'What is your approach to writing tests, and how do you decide what to test?',
      'Describe how you handle code reviews — both giving and receiving feedback.',
    ],
  },

  // Leadership
  {
    id: 'driving-results',
    name: 'Driving Results',
    description: 'Illustrate how you set goals, motivate teams, and deliver outcomes.',
    category: 'Leadership',
    questions: [
      'Tell me about a time you led a team to meet a challenging deadline. What did you do?',
      'Describe a situation where you had to motivate a team that was losing momentum.',
      'Give an example of a goal you set for your team and how you tracked progress toward it.',
    ],
  },
  {
    id: 'mentoring-coaching',
    name: 'Mentoring & Coaching',
    description: 'Share how you develop talent and support the growth of those around you.',
    category: 'Leadership',
    questions: [
      'Tell me about a time you mentored a junior colleague. What was your approach?',
      'Describe a situation where you helped someone on your team improve a specific skill.',
      'How do you give constructive feedback to someone who is resistant to it?',
    ],
  },
  {
    id: 'strategic-thinking',
    name: 'Strategic Thinking',
    description: 'Demonstrate your ability to think long-term and align work with broader goals.',
    category: 'Leadership',
    questions: [
      'Describe a time you identified a strategic opportunity that others had overlooked.',
      'Tell me about a decision you made that required balancing short-term costs with long-term benefits.',
      'How do you ensure your team\'s day-to-day work aligns with the organization\'s broader strategy?',
    ],
  },
];
