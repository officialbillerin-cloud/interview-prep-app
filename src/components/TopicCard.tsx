import React from 'react';
import { Topic, Category } from '../types';
import { CARD_ACCENT } from '../screens/TopicSelectionScreen';

interface TopicCardProps {
  topic: Topic;
  score: number | null;
  category: Category;
  mastered: boolean;
  hasNewQuestions: boolean;
  onSelect: () => void;
}

export function TopicCard({ topic, score, category, mastered, hasNewQuestions, onSelect }: TopicCardProps) {
  const accent = CARD_ACCENT[category];

  return (
    <button
      onClick={onSelect}
      className={`
        group relative w-full h-full text-left p-4 rounded-2xl
        glass border transition-all duration-200 cursor-pointer overflow-hidden card-shimmer
        ${mastered
          ? 'border-amber-400/40 hover:border-amber-400/80 hover:bg-amber-400/5'
          : `${accent.border} ${accent.activeBorder} hover:bg-white/10`
        }
        hover:shadow-lg hover:-translate-y-0.5
      `}
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200
        ${mastered ? 'bg-amber-400' : accent.dot}`}
      />

      {/* Mastery crown overlay */}
      {mastered && (
        <div className="absolute top-2 right-2 text-amber-400 text-xs">🏆</div>
      )}

      <div className="flex justify-between items-start mb-2 pr-5">
        <h3 className={`font-bold text-sm leading-tight transition-colors
          ${mastered ? 'text-amber-200 group-hover:text-amber-100' : `text-white/90 ${accent.text}`}`}>
          {topic.name}
        </h3>
        {score !== null && !mastered && (
          <span className={`shrink-0 text-xs font-black border px-2 py-0.5 rounded-full ${accent.badge}`} data-testid="score-indicator">
            {score}
          </span>
        )}
        {mastered && (
          <span className="shrink-0 text-xs font-black border px-2 py-0.5 rounded-full bg-amber-400/15 border-amber-400/40 text-amber-300" data-testid="score-indicator">
            {score}
          </span>
        )}
      </div>

      <p className="text-xs text-white/45 leading-relaxed mb-2 line-clamp-2">{topic.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {mastered ? (
            <span className="text-xs font-bold text-amber-400/80">✦ Passed</span>
          ) : (
            <span className="text-xs text-white/25 font-semibold">{topic.questions.length} questions</span>
          )}
          {hasNewQuestions && (
            <span className="text-xs font-bold text-emerald-400/80">↑ Advanced</span>
          )}
        </div>
        <svg className={`w-3.5 h-3.5 transition-all duration-200 group-hover:translate-x-0.5
          ${mastered ? 'text-amber-400/40 group-hover:text-amber-400' : `text-white/20 ${accent.text}`}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}
