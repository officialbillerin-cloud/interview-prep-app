import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useScoreStore } from '../hooks/useScoreStore';
import { groupTopicsByCategory } from '../utils/groupTopicsByCategory';
import { TopicCard } from '../components/TopicCard';
import { topics } from '../data/topics';
import { Category } from '../types';
import { HistoryScreen } from './HistoryScreen';

const CATEGORIES: Category[] = ['Behavioral', 'Technical', 'Leadership'];

const BADGE_GRADIENT: Record<Category, string> = {
  Behavioral: 'from-blue-500 to-blue-700',
  Technical:  'from-indigo-500 to-indigo-700',
  Leadership: 'from-[#c8a96e] to-[#a07840]',
};

export const CARD_ACCENT: Record<Category, { border: string; glow: string; badge: string; text: string }> = {
  Behavioral: {
    border: 'border-blue-500/30',
    glow:   'hover:border-blue-400/60 hover:shadow-blue-500/10',
    badge:  'bg-blue-500/15 border-blue-400/30 text-blue-300',
    text:   'group-hover:text-blue-300',
  },
  Technical: {
    border: 'border-indigo-500/30',
    glow:   'hover:border-indigo-400/60 hover:shadow-indigo-500/10',
    badge:  'bg-indigo-500/15 border-indigo-400/30 text-indigo-300',
    text:   'group-hover:text-indigo-300',
  },
  Leadership: {
    border: 'border-[#c8a96e]/30',
    glow:   'hover:border-[#c8a96e]/60 hover:shadow-[#c8a96e]/10',
    badge:  'bg-[#c8a96e]/15 border-[#c8a96e]/30 text-[#e8c98e]',
    text:   'group-hover:text-[#e8c98e]',
  },
};

export function TopicSelectionScreen() {
  const { selectTopic } = useAppContext();
  const { getScore } = useScoreStore();
  const grouped = groupTopicsByCategory(topics);
  const [showHistory, setShowHistory] = useState(false);

  if (showHistory) {
    return <HistoryScreen onClose={() => setShowHistory(false)} />;
  }

  return (
    <div className="min-h-screen bg-pattern flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0f1c35]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <ellipse cx="16" cy="16" rx="10" ry="15" fill="url(#lg)" transform="rotate(-20 16 16)" />
              <defs>
                <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#7ab3e8" />
                  <stop offset="100%" stopColor="#1a2744" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-xl font-bold tracking-tight text-white">Preptimize</span>
          </div>
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-2 text-sm text-[#7ab3e8] hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            History
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-white mb-2">Choose a Topic</h1>
          <p className="text-[#7ab3e8] text-lg">Practice your answers and get AI-powered feedback.</p>
        </div>

        {CATEGORIES.map(category => (
          <section key={category} className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${BADGE_GRADIENT[category]} uppercase tracking-widest`}>
                {category}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {grouped[category].map(topic => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  score={getScore(topic.id)}
                  category={category}
                  onSelect={() => selectTopic(topic)}
                />
              ))}
            </div>
          </section>
        ))}
      </main>

      <footer className="fixed bottom-4 right-6 z-20">
        <p className="text-white/40 text-xs">A Platform by Ohad Biller</p>
      </footer>
    </div>
  );
}
