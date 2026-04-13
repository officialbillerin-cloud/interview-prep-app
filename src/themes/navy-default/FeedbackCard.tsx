import React from 'react';
import type { QuestionFeedback } from '../types';

interface ScoreBarProps {
  label: string;
  score: number;
  color: string;
}

function ScoreBar({ label, score, color }: ScoreBarProps) {
  const pct = Math.max(0, Math.min(100, score));
  const scoreColor =
    pct >= 75 ? 'text-emerald-400' :
    pct >= 50 ? 'text-[#7ab3e8]' :
    pct >= 30 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold uppercase tracking-widest text-white/50">{label}</span>
        <span className={`text-sm font-extrabold ${scoreColor}`}>{pct}</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface FeedbackCardProps {
  feedback: QuestionFeedback;
  index: number;
}

export function FeedbackCard({ feedback, index }: FeedbackCardProps) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-5 backdrop-blur-sm">
      {/* Question header */}
      <div className="flex items-start gap-3">
        <span className="shrink-0 w-7 h-7 rounded-full bg-[#4a90d9]/20 border border-[#4a90d9]/40 flex items-center justify-center text-xs font-bold text-[#7ab3e8]">
          {index + 1}
        </span>
        <p className="text-sm font-semibold text-white leading-snug">{feedback.question}</p>
      </div>

      {/* Score bars */}
      <div className="space-y-3 p-4 rounded-xl bg-white/[0.03] border border-white/5">
        <ScoreBar
          label="Answer Score"
          score={feedback.questionScore}
          color={
            feedback.questionScore >= 75 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
            feedback.questionScore >= 50 ? 'bg-gradient-to-r from-[#2d5a8e] to-[#4a90d9]' :
            feedback.questionScore >= 30 ? 'bg-gradient-to-r from-amber-600 to-amber-400' :
            'bg-gradient-to-r from-red-700 to-red-500'
          }
        />
        <ScoreBar
          label="Tone Score"
          score={feedback.toneScore}
          color={
            feedback.toneScore >= 75 ? 'bg-gradient-to-r from-purple-500 to-purple-400' :
            feedback.toneScore >= 50 ? 'bg-gradient-to-r from-indigo-600 to-indigo-400' :
            feedback.toneScore >= 30 ? 'bg-gradient-to-r from-amber-600 to-amber-400' :
            'bg-gradient-to-r from-red-700 to-red-500'
          }
        />
      </div>

      {/* Tone analysis */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-1.5">Tone Analysis</p>
        <p className="text-sm text-white/75 leading-relaxed">{feedback.toneAnalysis}</p>
      </div>

      {/* Commentary */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-[#7ab3e8] mb-1.5">Commentary</p>
        <p className="text-sm text-white/80 leading-relaxed">{feedback.commentary}</p>
      </div>

      {/* Improvement tips */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-1.5">Improvement Tips</p>
        <p className="text-sm text-white/80 leading-relaxed">{feedback.improvementTips}</p>
      </div>
    </div>
  );
}
