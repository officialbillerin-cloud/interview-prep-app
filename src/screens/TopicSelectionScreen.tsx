import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useScoreStore } from '../hooks/useScoreStore';
import { useTopicMastery } from '../hooks/useTopicMastery';
import { useTailoredMode } from '../context/TailoredModeContext';
import { groupTopicsByCategory } from '../utils/groupTopicsByCategory';
import { TopicCard } from '../components/TopicCard';
import { CVUploadScreen } from './CVUploadScreen';
import { topics } from '../data/topics';
import { Category, Topic } from '../types';
import { HistoryScreen } from './HistoryScreen';

const CATEGORIES: Category[] = ['Behavioral', 'Technical', 'Leadership'];

export const CARD_ACCENT: Record<Category, {
  border: string; activeBorder: string; badge: string; text: string;
  dot: string; sectionLabel: string; divider: string;
}> = {
  Behavioral: {
    border: 'border-blue-400/20', activeBorder: 'hover:border-blue-400/70',
    badge: 'bg-blue-500/15 border-blue-400/35 text-blue-200', text: 'group-hover:text-blue-200',
    dot: 'bg-blue-400', sectionLabel: 'text-blue-300', divider: 'from-blue-400/40 to-transparent',
  },
  Technical: {
    border: 'border-violet-400/20', activeBorder: 'hover:border-violet-400/70',
    badge: 'bg-violet-500/15 border-violet-400/35 text-violet-200', text: 'group-hover:text-violet-200',
    dot: 'bg-violet-400', sectionLabel: 'text-violet-300', divider: 'from-violet-400/40 to-transparent',
  },
  Leadership: {
    border: 'border-amber-400/20', activeBorder: 'hover:border-amber-400/70',
    badge: 'bg-amber-500/15 border-amber-400/35 text-amber-200', text: 'group-hover:text-amber-200',
    dot: 'bg-amber-400', sectionLabel: 'text-amber-300', divider: 'from-amber-400/40 to-transparent',
  },
};

export function TopicSelectionScreen() {
  const { selectTopic } = useAppContext();
  const { getScore } = useScoreStore();
  const { isMastered, masteredList, getGeneratedQuestions } = useTopicMastery();
  const { mode, setMode, generatedQuestions, clearTailoredState } = useTailoredMode();
  const grouped = groupTopicsByCategory(topics);
  const [showHistory, setShowHistory] = useState(false);

  if (showHistory) return <HistoryScreen onClose={() => setShowHistory(false)} />;

  const handleSelectTopic = (topic: Topic) => {
    if (mode === 'tailored') {
      const entry = generatedQuestions[topic.id];
      if (entry?.status === 'ready') {
        selectTopic({ ...topic, questions: entry.questions });
        return;
      }
    }
    const generated = getGeneratedQuestions(topic.id);
    selectTopic(generated?.length === 3 ? { ...topic, questions: generated } : topic);
  };

  const handleModeSwitch = (newMode: 'classic' | 'tailored') => {
    clearTailoredState();
    setMode(newMode);
  };

  const hasMastered = masteredList.length > 0;
  const hasGeneratedQuestions = Object.values(generatedQuestions).some(
    e => e.status === 'ready' || e.status === 'fallback'
  );

  return (
    // Mobile: scrollable. Desktop: fixed height no-scroll
    <div className="min-h-screen md:h-screen bg-pattern flex flex-col md:overflow-hidden">
      {/* Header */}
      <header className="shrink-0 glass border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <ellipse cx="16" cy="16" rx="10" ry="15" fill="url(#lg)" transform="rotate(-20 16 16)" />
              <defs>
                <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#93c5fd" />
                  <stop offset="100%" stopColor="#1e3a5f" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-lg md:text-xl font-black tracking-tight text-white">Preptimize</span>
          </div>
          <button
            onClick={() => setShowHistory(true)}
            className="group flex items-center gap-1.5 text-xs md:text-sm font-semibold text-blue-200/80 hover:text-white transition-all px-3 md:px-4 py-2 rounded-xl glass border border-white/10 hover:border-blue-400/50 hover:bg-blue-400/10"
          >
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            History
          </button>
        </div>
      </header>

      {/* Mastered panel — horizontal strip on mobile, sidebar on desktop */}
      {hasMastered && (
        <div className="md:hidden shrink-0 px-4 py-2 flex gap-2 overflow-x-auto border-b border-white/5">
          <span className="shrink-0 text-amber-400 text-xs font-black uppercase tracking-widest self-center mr-1">🏆</span>
          {masteredList.map(record => (
            <div key={record.topicId} className="shrink-0 rounded-xl px-3 py-1.5 bg-amber-500/10 border border-amber-400/30 flex items-center gap-2">
              <span className="text-xs font-bold text-white/80">{record.topicName}</span>
              <span className="text-xs font-black text-amber-400">{record.score}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 flex min-h-0 max-w-6xl mx-auto w-full px-4 md:px-8 py-4 md:py-5 gap-6">
        {/* LEFT sidebar — desktop only */}
        {hasMastered && (
          <aside className="hidden md:flex w-52 shrink-0 flex-col gap-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-amber-400 text-sm">🏆</span>
              <p className="text-xs font-black text-amber-300 uppercase tracking-widest">Mastered</p>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto">
              {masteredList.map(record => (
                <div key={record.topicId} className="rounded-xl p-3 bg-amber-500/10 border border-amber-400/30">
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <p className="text-xs font-bold text-white/90 leading-tight">{record.topicName}</p>
                    <span className="shrink-0 text-xs font-black text-amber-400 bg-amber-400/15 border border-amber-400/30 px-1.5 py-0.5 rounded-full">{record.score}</span>
                  </div>
                  <span className="text-xs text-amber-400/80 font-semibold">✦ Passed</span>
                  {!!getGeneratedQuestions(record.topicId) && (
                    <p className="text-xs text-emerald-400/80 mt-1 font-medium">↑ New questions ready</p>
                  )}
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* Main grid */}
        <main className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3 md:mb-5 shrink-0">
            <div>
              <h1 className="text-lg md:text-xl font-black text-white tracking-tight">Choose a Topic</h1>
              <p className="text-blue-200/60 text-xs mt-0.5 font-medium hidden sm:block">Select a category to begin your practice session</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Mode toggle */}
              <div className="flex items-center gap-1 p-1 rounded-xl glass border border-white/10">
                <button
                  onClick={() => handleModeSwitch('classic')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'classic' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'}`}
                >Classic</button>
                <button
                  onClick={() => handleModeSwitch('tailored')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'tailored' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30' : 'text-white/40 hover:text-white/70'}`}
                >Tailored</button>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/30 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">AI Scoring Active</span>
              </div>
            </div>
          </div>

          {/* Tailored Mode banner */}
          {mode === 'tailored' && (
            <div className="shrink-0 mb-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-400/25">
              <span className="text-cyan-400 text-xs">✦</span>
              <span className="text-xs font-bold text-cyan-300">Tailored Mode Active — questions personalized to your profile</span>
            </div>
          )}

          {/* CV Upload screen when tailored and no questions yet */}
          {mode === 'tailored' && !hasGeneratedQuestions && (
            <div className="flex-1 overflow-y-auto">
              <CVUploadScreen />
            </div>
          )}

          {/* Categories grid */}
          {(mode === 'classic' || hasGeneratedQuestions) && (
          <div className="flex-1 flex flex-col gap-3 md:gap-4 overflow-y-auto md:overflow-hidden md:min-h-0">
            {CATEGORIES.map(category => {
              const accent = CARD_ACCENT[category];
              return (
                <div key={category} className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center gap-3 mb-2 shrink-0">
                    <span className={`w-2 h-2 rounded-full ${accent.dot}`} />
                    <span className={`text-xs font-black uppercase tracking-widest ${accent.sectionLabel}`}>{category}</span>
                    <div className={`flex-1 h-px bg-gradient-to-r ${accent.divider}`} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 flex-1">
                    {grouped[category].map(topic => (
                      <TopicCard
                        key={topic.id}
                        topic={topic}
                        score={getScore(topic.id)}
                        category={category}
                        mastered={isMastered(topic.id)}
                        hasNewQuestions={!!getGeneratedQuestions(topic.id)}
                        onSelect={() => handleSelectTopic(topic)}
                        tailoredStatus={mode === 'tailored' ? generatedQuestions[topic.id]?.status : undefined}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </main>
      </div>

      <footer className="fixed bottom-4 right-4 md:right-6 z-20">
        <p className="text-white/25 text-xs font-medium">A Platform by Ohad Biller</p>
      </footer>
    </div>
  );
}
