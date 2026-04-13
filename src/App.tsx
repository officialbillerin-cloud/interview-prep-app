import React from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { TailoredModeProvider } from './context/TailoredModeContext';
import { TopicSelectionScreen } from './screens/TopicSelectionScreen';
import { QuizSessionScreen } from './screens/QuizSessionScreen';
import { ResultsView } from './screens/ResultsView';

function AppScreens() {
  const { screen } = useAppContext();
  switch (screen) {
    case 'quiz-session': return <QuizSessionScreen />;
    case 'results': return <ResultsView />;
    default: return <TopicSelectionScreen />;
  }
}

export function App() {
  return (
    <AppProvider>
      <TailoredModeProvider>
        <AppScreens />
      </TailoredModeProvider>
    </AppProvider>
  );
}
