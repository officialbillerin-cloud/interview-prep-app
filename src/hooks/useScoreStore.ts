import { useState } from 'react';

const STORAGE_KEY = 'interview-prep-scores';

type ScoreStoreData = Record<string, number>;

function readFromStorage(): ScoreStoreData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeToStorage(data: ScoreStoreData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // graceful degradation
  }
}

export function useScoreStore() {
  const [allScores, setAllScores] = useState<ScoreStoreData>(readFromStorage);

  const getScore = (topicId: string): number | null => {
    const val = allScores[topicId];
    return val !== undefined ? val : null;
  };

  const saveScore = (topicId: string, score: number): void => {
    const updated = { ...allScores, [topicId]: score };
    writeToStorage(updated);
    setAllScores(updated);
  };

  return { getScore, saveScore, allScores };
}
