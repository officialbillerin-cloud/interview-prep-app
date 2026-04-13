export type Category = 'Behavioral' | 'Technical' | 'Leadership';

export interface Topic {
  id: string;
  name: string;
  description: string;
  category: Category;
  questions: string[];
}

export interface QuestionFeedback {
  questionIndex: number;
  question: string;
  transcript: string;
  questionScore: number;      // 0-100: how well this specific answer was
  toneScore: number;          // 0-100: appropriateness of tone for this question
  toneAnalysis: string;       // description of tone used and whether it fit
  commentary: string;         // what they did well / what was weak
  improvementTips: string;    // specific study topics, frameworks, next steps
}

export interface ScoringResult {
  score: number;              // 0-100 overall
  feedback: QuestionFeedback[];
}

export type Screen = 'topic-selection' | 'quiz-session' | 'results';

export interface AppState {
  screen: Screen;
  selectedTopic: Topic | null;
  currentQuestionIndex: number;
  transcripts: string[];
  scoringResult: ScoringResult | null;
}
