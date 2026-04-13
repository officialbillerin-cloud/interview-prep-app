import { useState, useCallback } from 'react';

export interface MasteryRecord {
  topicId: string;
  topicName: string;
  score: number;
  masteredAt: string;
  generatedQuestions: string[] | null; // null = not yet generated
}

const STORAGE_KEY = 'preptimize-mastery';
const MASTERY_THRESHOLD = 92;

function readMastery(): Record<string, MasteryRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function writeMastery(data: Record<string, MasteryRecord>): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* graceful */ }
}

export function useTopicMastery() {
  const [mastery, setMastery] = useState<Record<string, MasteryRecord>>(readMastery);

  const isMastered = useCallback((topicId: string): boolean => {
    return !!mastery[topicId];
  }, [mastery]);

  const getMasteryRecord = useCallback((topicId: string): MasteryRecord | null => {
    return mastery[topicId] ?? null;
  }, [mastery]);

  const getGeneratedQuestions = useCallback((topicId: string): string[] | null => {
    return mastery[topicId]?.generatedQuestions ?? null;
  }, [mastery]);

  const recordMastery = useCallback((topicId: string, topicName: string, score: number): boolean => {
    if (score < MASTERY_THRESHOLD) return false;
    if (mastery[topicId]) return false; // already mastered

    const record: MasteryRecord = {
      topicId,
      topicName,
      score,
      masteredAt: new Date().toISOString(),
      generatedQuestions: null,
    };
    const updated = { ...mastery, [topicId]: record };
    writeMastery(updated);
    setMastery(updated);
    return true; // newly mastered
  }, [mastery]);

  const saveGeneratedQuestions = useCallback((topicId: string, questions: string[]): void => {
    setMastery(prev => {
      if (!prev[topicId]) return prev;
      const updated = {
        ...prev,
        [topicId]: { ...prev[topicId], generatedQuestions: questions },
      };
      writeMastery(updated);
      return updated;
    });
  }, []);

  const masteredList = Object.values(mastery).sort(
    (a, b) => new Date(b.masteredAt).getTime() - new Date(a.masteredAt).getTime()
  );

  return { isMastered, getMasteryRecord, getGeneratedQuestions, recordMastery, saveGeneratedQuestions, masteredList };
}

export { MASTERY_THRESHOLD };
