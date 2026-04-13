import React from 'react';
import type { QuestionFeedback } from '../types';

function ScoreBar({ label, score, colorClass }: { label: string; score: number; colorClass: string }) {
  const pct = Math.max(0, Math.min(100, score));
  const textColor = pct >= 75 ? 'text-emerald-400' : pct >= 50 ? 'text-cyan-400' : pct >= 30 ? 'text-amber-400' : 'text-red-400';
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-black uppercase tracking-widest text-white/40">{label}</span>
        <span className={`text-sm font-black ${textColor}`}>{pct}</span>
      </div>
      <div className="h-2.5 rounded-full bg-white/8 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function FeedbackCard({ feedback, index }: { feedback: QuestionFeedback; index: number }) {
  const qColor = feedback.questionScore >= 75 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
    : feedback.questionScore >= 50 ? 'bg-gradient-to-r from-cyan-500 to-[#4a90d9]'
    : feedback.questionScore >= 30 ? 'bg-gradient-to-r from-amber-600 to-amber-400'
    : 'bg-gradient-to-r from-red-700 to-red-500';

  const tColor = feedback.toneScore >= 75 ? 'bg-gradient-to-r from-purple-500 to-purple-400'
    : feedback.toneScore >= 50 ? 'bg-gradient-to-r from-indigo-500 to-indigo-400'
    : feedback.toneScore >= 30 ? 'bg-gradient-to-r from-amber-600 to-amber-400'
    : 'bg-gradient-to-r from-red-700 to-red-500';

  return (
    <div className="glass-strong rounded-3xl p-7 space-y-6 shadow-[0_0_40px_rgba(74,144,217,0.08)]">
      {/* Question header */}
      <div className="flex items-start gap-4">
        <span className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#4a90d9] to-cyan-400 flex items-center justify-center text-xs font-black text-white shadow-[0_0_12px_rgba(74,144,217,0.5)]">
          {index + 1}
        </span>
        <p className="text-base font-bold text-white leading-snug">{feedback.question}</p>
      </div>

      {/* Score bars */}
      <div className="space-y-4 p-5 rounded-2xl bg-white/[0.03] border border-white/5">
        <ScoreBar label="Answer Score" score={feedback.questionScore} colorClass={qColor} />
        <ScoreBar label="Tone Score" score={feedback.toneScore} colorClass={tColor} />
      </div>

      <div>
        <p className="text-xs font-black uppercase tracking-widest text-purple-400 mb-2">Tone Analysis</p>
        <p className="text-sm text-white/70 leading-relaxed">{feedback.toneAnalysis}</p>
      </div>
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-2">Commentary</p>
        <p className="text-sm text-white/75 leading-relaxed">{feedback.commentary}</p>
      </div>
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-2">Improvement Tips</p>
        <p className="text-sm text-white/75 leading-relaxed">{feedback.improvementTips}</p>
      </div>
    </div>
  );
}
