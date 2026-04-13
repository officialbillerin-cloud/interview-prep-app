import React, { createContext, useContext, useState } from 'react';
import { AppState, Screen, Topic, ScoringResult } from '../types';

interface AppContextValue extends AppState {
  selectTopic: (topic: Topic) => void;
  saveTranscript: (index: number, text: string) => void;
  advanceQuestion: () => void;
  goBackToTopics: () => void;
  setScoringResult: (result: ScoringResult) => void;
}

const initialState: AppState = {
  screen: 'topic-selection',
  selectedTopic: null,
  currentQuestionIndex: 0,
  transcripts: [],
  scoringResult: null,
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  const selectTopic = (topic: Topic) => {
    setState(s => ({ ...s, selectedTopic: topic, screen: 'quiz-session' as Screen }));
  };

  const saveTranscript = (index: number, text: string) => {
    setState(s => {
      const transcripts = [...s.transcripts];
      transcripts[index] = text;
      return { ...s, transcripts };
    });
  };

  const advanceQuestion = () => {
    setState(s => {
      if (s.currentQuestionIndex >= 2) {
        return { ...s, screen: 'results' as Screen };
      }
      return { ...s, currentQuestionIndex: s.currentQuestionIndex + 1 };
    });
  };

  const goBackToTopics = () => {
    setState({
      ...initialState,
    });
  };

  const setScoringResult = (result: ScoringResult) => {
    setState(s => ({ ...s, scoringResult: result }));
  };

  return (
    <AppContext.Provider value={{ ...state, selectTopic, saveTranscript, advanceQuestion, goBackToTopics, setScoringResult }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
