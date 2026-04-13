import { useState, useCallback } from 'react';
import type { ScoringResult, Topic } from '../types';

export interface SessionRecord {
  id: string;
  date: string;           // ISO string
  topic: Topic;
  score: number;
  result: ScoringResult;
}

const STORAGE_KEY = 'preptimize-session-history';

function readHistory(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeHistory(records: SessionRecord[]): void {
  try {
    // Keep last 50 sessions
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(-50)));
  } catch { /* graceful degradation */ }
}

export function useSessionHistory() {
  const [history, setHistory] = useState<SessionRecord[]>(readHistory);

  const saveSession = useCallback((topic: Topic, result: ScoringResult) => {
    const record: SessionRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: new Date().toISOString(),
      topic,
      score: result.score,
      result,
    };
    setHistory(prev => {
      const updated = [...prev, record].slice(-50);
      writeHistory(updated);
      return updated;
    });
    return record;
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    writeHistory([]);
  }, []);

  const getTopicHistory = useCallback((topicId: string) => {
    return history.filter(r => r.topic.id === topicId).slice(-10);
  }, [history]);

  return { history, saveSession, clearHistory, getTopicHistory };
}
