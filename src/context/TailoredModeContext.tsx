import React, { createContext, useContext, useState } from 'react';

export type TailoredMode = 'classic' | 'tailored';
export type TailoredQuestionStatus = 'loading' | 'ready' | 'fallback';

export interface TailoredTopicEntry {
  questions: string[];
  status: TailoredQuestionStatus;
}

export type TailoredQuestionMap = Record<string, TailoredTopicEntry>;

interface TailoredModeContextValue {
  mode: TailoredMode;
  setMode: (mode: TailoredMode) => void;
  cvText: string | null;
  setCvText: (text: string) => void;
  jobPostingText: string | null;
  setJobPostingText: (text: string | null) => void;
  generatedQuestions: TailoredQuestionMap;
  setGeneratedQuestions: (map: TailoredQuestionMap) => void;
  clearTailoredState: () => void;
}

const TailoredModeContext = createContext<TailoredModeContextValue | null>(null);

export function TailoredModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<TailoredMode>('classic');
  const [cvText, setCvText] = useState<string | null>(null);
  const [jobPostingText, setJobPostingText] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<TailoredQuestionMap>({});

  const clearTailoredState = () => {
    setCvText(null);
    setJobPostingText(null);
    setGeneratedQuestions({});
  };

  return (
    <TailoredModeContext.Provider value={{
      mode, setMode, cvText, setCvText,
      jobPostingText, setJobPostingText,
      generatedQuestions, setGeneratedQuestions,
      clearTailoredState,
    }}>
      {children}
    </TailoredModeContext.Provider>
  );
}

export function useTailoredMode(): TailoredModeContextValue {
  const ctx = useContext(TailoredModeContext);
  if (!ctx) throw new Error('useTailoredMode must be used within TailoredModeProvider');
  return ctx;
}
