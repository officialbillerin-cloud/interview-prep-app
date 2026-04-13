import React from 'react';
import { Topic, Category } from '../types';
import { CARD_ACCENT } from '../screens/TopicSelectionScreen';

interface TopicCardProps {
  topic: Topic;
  score: number | null;
  category: Category;
  onSelect: () => void;
}

export function TopicCard({ topic, score, category, onSelect }: TopicCardProps) {
  const accent = CARD_ACCENT[category];

  return (
    <button
      onClick={onSelect}
      className={`group w-full text-left p-5 rounded-2xl border ${accent.border} bg-white/5 ${accent.glow} hover:bg-white/10 hover:shadow-lg transition-all duration-200 backdrop-blur-sm`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className={`font-bold text-white ${accent.text} transition-colors`}>{topic.name}</h3>
        {score !== null && (
          <span className={`ml-2 text-xs font-bold border px-2 py-0.5 rounded-full ${accent.badge}`} data-testid="score-indicator">
            {score}/10
          </span>
        )}
      </div>
      <p className="text-sm text-white/60 mb-3 leading-relaxed">{topic.description}</p>
      <p className="text-xs text-white/30 font-medium">{topic.questions.length} questions</p>
    </button>
  );
}
