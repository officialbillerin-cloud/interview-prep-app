import React from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { TopicSelectionScreen } from './screens/TopicSelectionScreen';
import { QuizSessionScreen } from './screens/QuizSessionScreen';
import { ResultsView } from './screens/ResultsView';

function AppScreens() {
  const { screen } = useAppContext();

  switch (screen) {
    case 'quiz-session':
      return <QuizSessionScreen />;
    case 'results':
      return <ResultsView />;
    case 'topic-selection':
    default:
      return <TopicSelectionScreen />;
  }
}

export function App() {
  return (
    <AppProvider>
      <AppScreens />
    </AppProvider>
  );
}
