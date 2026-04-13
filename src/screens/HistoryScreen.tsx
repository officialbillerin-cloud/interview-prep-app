import React, { useState } from 'react';
import { useSessionHistory, SessionRecord } from '../hooks/useSessionHistory';

interface Props {
  onClose: () => void;
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 75 ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
    : score >= 50 ? 'text-[#7ab3e8] bg-[#4a90d9]/10 border-[#4a90d9]/30'
    : score >= 30 ? 'text-amber-400 bg-amber-400/10 border-amber-400/30'
    : 'text-red-400 bg-red-400/10 border-red-400/30';
  return (
    <span className={`text-xs font-bold border px-2 py-0.5 rounded-full ${color}`}>
      {score}/100
    </span>
  );
}

function SessionDetail({ record, onBack }: { record: SessionRecord; onBack: () => void }) {
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-[#7ab3e8] hover:text-white transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to history
      </button>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-bold">{record.topic.name}</p>
          <p className="text-white/40 text-xs">{new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <ScoreBadge score={record.score} />
      </div>

      <div className="space-y-3">
        {record.result.feedback.map((fb, i) => (
          <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2">
            <p className="text-xs font-bold text-[#7ab3e8] uppercase tracking-widest">Q{i + 1}</p>
            <p className="text-sm font-semibold text-white">{fb.question}</p>
            <div className="flex gap-4">
              <div>
                <p className="text-xs text-white/40">Answer</p>
                <p className="text-sm font-bold text-white">{fb.questionScore}</p>
              </div>
              <div>
                <p className="text-xs text-white/40">Tone</p>
                <p className="text-sm font-bold text-white">{fb.toneScore}</p>
              </div>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">{fb.commentary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HistoryScreen({ onClose }: Props) {
  const { history, clearHistory } = useSessionHistory();
  const [selected, setSelected] = useState<SessionRecord | null>(null);

  return (
    <div className="fixed inset-0 z-50 bg-[#0f1c35]/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0f1c35]/80">
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <ellipse cx="16" cy="16" rx="10" ry="15" fill="url(#lgh)" transform="rotate(-20 16 16)" />
              <defs>
                <linearGradient id="lgh" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#7ab3e8" />
                  <stop offset="100%" stopColor="#1a2744" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-lg font-bold text-white">Session History</span>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full px-4 md:px-6 py-6 md:py-8">
        {selected ? (
          <SessionDetail record={selected} onBack={() => setSelected(null)} />
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <svg className="w-12 h-12 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-white/40 text-sm">No sessions yet. Complete a quiz to see your history.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/40 text-xs uppercase tracking-widest">{history.length} session{history.length !== 1 ? 's' : ''}</p>
              <button onClick={clearHistory} className="text-xs text-red-400/60 hover:text-red-400 transition-colors">
                Clear all
              </button>
            </div>
            {[...history].reverse().map(record => (
              <button
                key={record.id}
                onClick={() => setSelected(record)}
                className="w-full text-left rounded-2xl bg-white/5 border border-white/10 hover:border-[#4a90d9]/40 hover:bg-white/8 transition-all p-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{record.topic.name}</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <ScoreBadge score={record.score} />
                  <svg className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      <footer className="fixed bottom-4 right-6 z-20">
        <p className="text-white/40 text-xs">A Platform by Ohad Biller</p>
      </footer>
    </div>
  );
}
