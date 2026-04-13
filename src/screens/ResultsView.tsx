import React, { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAnthropicScorer } from '../hooks/useAnthropicScorer';
import { useScoreStore } from '../hooks/useScoreStore';
import { useSessionHistory } from '../hooks/useSessionHistory';
import { useTopicMastery, MASTERY_THRESHOLD } from '../hooks/useTopicMastery';
import { useQuestionGenerator } from '../hooks/useQuestionGenerator';
import { FeedbackCard } from '../components/FeedbackCard';

function ScoreRing({ score }: { score: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const ringColor = score >= MASTERY_THRESHOLD ? '#fbbf24'
    : score >= 75 ? '#34d399'
    : score >= 50 ? '#22d3ee'
    : score >= 30 ? '#f59e0b' : '#ef4444';
  const glowColor = score >= MASTERY_THRESHOLD ? 'rgba(251,191,36,0.5)'
    : score >= 75 ? 'rgba(52,211,153,0.4)'
    : score >= 50 ? 'rgba(34,211,238,0.4)'
    : score >= 30 ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.4)';

  return (
    <div className="relative flex items-center justify-center w-44 h-44 mx-auto">
      <svg className="absolute inset-0 -rotate-90" width="176" height="176" viewBox="0 0 176 176">
        <circle cx="88" cy="88" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
        <circle cx="88" cy="88" r={r} fill="none" stroke={ringColor} strokeWidth="12"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 14px ${glowColor})` }}
        />
      </svg>
      <div className="text-center">
        <p className="text-6xl font-black text-white" data-testid="overall-score">{score}</p>
        <p className="text-xs text-white/40 font-bold uppercase tracking-widest">out of 100</p>
      </div>
    </div>
  );
}

export function ResultsView() {
  const { transcripts, selectedTopic, goBackToTopics } = useAppContext();
  const { score, feedback, isLoading, error, submit, retry } = useAnthropicScorer();
  const { saveScore } = useScoreStore();
  const { saveSession } = useSessionHistory();
  const { recordMastery, saveGeneratedQuestions } = useTopicMastery();
  const { generateQuestions, state: genState } = useQuestionGenerator();
  const submitted = useRef(false);
  const sessionSaved = useRef(false);
  const [justMastered, setJustMastered] = useState(false);

  useEffect(() => {
    if (submitted.current) return;
    if (!selectedTopic) return;
    const filled = transcripts.filter(t => t && t.trim().length > 0);
    if (filled.length >= selectedTopic.questions.length) {
      submitted.current = true;
      submit(transcripts, selectedTopic.questions);
      return;
    }
    const timeout = setTimeout(() => {
      if (!submitted.current) {
        submitted.current = true;
        const padded = selectedTopic.questions.map((_, i) => transcripts[i]?.trim() || '(no answer provided)');
        submit(padded, selectedTopic.questions);
      }
    }, 3000);
    return () => clearTimeout(timeout);
  }, [transcripts, selectedTopic]);

  useEffect(() => {
    if (score === null || !selectedTopic || !feedback || sessionSaved.current) return;
    sessionSaved.current = true;
    saveScore(selectedTopic.id, score);
    saveSession(selectedTopic, { score, feedback });

    // Check mastery
    const newlyMastered = recordMastery(selectedTopic.id, selectedTopic.name, score);
    if (newlyMastered) {
      setJustMastered(true);
      // Generate new questions in background
      generateQuestions(selectedTopic).then(questions => {
        if (questions) saveGeneratedQuestions(selectedTopic.id, questions);
      });
    }
  }, [score, selectedTopic, feedback]);

  const isMasteryScore = score !== null && score >= MASTERY_THRESHOLD;

  return (
    <div className="min-h-screen bg-pattern flex flex-col">
      <header className="glass border-b border-white/8">
        <div className="max-w-3xl mx-auto px-8 py-5 flex items-center gap-3">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <ellipse cx="16" cy="16" rx="10" ry="15" fill="url(#lg3)" transform="rotate(-20 16 16)" />
            <defs>
              <linearGradient id="lg3" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#7ab3e8" />
                <stop offset="100%" stopColor="#1a2744" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-xl font-black text-white">Preptimize</span>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-8 py-12 space-y-8">
        <h1 className="text-4xl font-black text-white text-center">Your Results</h1>

        {isLoading && (
          <div className="flex flex-col items-center py-20 gap-5">
            <div className="relative h-14 w-14">
              <div className="absolute inset-0 rounded-full border-4 border-cyan-400/20" />
              <div className="absolute inset-0 rounded-full border-4 border-t-cyan-400 animate-spin" />
            </div>
            <p className="text-cyan-400 font-semibold">Analyzing your answers…</p>
            <p className="text-white/30 text-sm">This may take a few seconds</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-6 text-center space-y-3">
            <p className="text-red-300 font-bold">Scoring unavailable</p>
            <p className="text-red-200/60 text-sm">Could not connect to the AI scoring service. Check your connection and try again.</p>
            <button onClick={retry} className="px-6 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-400 transition-colors">Retry</button>
          </div>
        )}

        {!isLoading && !error && score !== null && (
          <>
            {/* Mastery banner */}
            {justMastered && (
              <div className="rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-400/40 p-5 flex items-center gap-4">
                <span className="text-3xl">🏆</span>
                <div>
                  <p className="text-amber-300 font-black text-base">Topic Mastered!</p>
                  <p className="text-amber-200/70 text-sm mt-0.5">
                    You scored {score}/100 on <span className="font-bold">{selectedTopic?.name}</span>.
                    {genState === 'generating' ? ' Generating harder questions…' : genState === 'done' ? ' New advanced questions are ready.' : ''}
                  </p>
                </div>
              </div>
            )}

            {/* Score card */}
            <div className={`glass-strong rounded-3xl p-10 text-center ${isMasteryScore ? 'shadow-[0_0_80px_rgba(251,191,36,0.2)]' : 'shadow-[0_0_80px_rgba(74,144,217,0.15)]'}`}>
              <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-8">Overall Score</p>
              <ScoreRing score={score} />
              {isMasteryScore && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <span className="text-amber-400 text-xs font-black uppercase tracking-widest">✦ Mastery Level</span>
                </div>
              )}
            </div>

            {feedback && feedback.length > 0 && (
              <div className="space-y-5">
                <h2 className="text-xl font-black text-white">Per-Question Feedback</h2>
                {feedback.map((fb, i) => (
                  <FeedbackCard key={fb.questionIndex} feedback={fb} index={i} />
                ))}
              </div>
            )}
          </>
        )}

        <button
          onClick={goBackToTopics}
          className="w-full py-4 rounded-2xl glass border border-white/15 text-white/60 font-bold hover:bg-white/10 hover:text-white transition-all duration-200"
        >
          ← Back to Topics
        </button>
      </main>

      <footer className="fixed bottom-5 right-7 z-20">
        <p className="text-white/30 text-xs font-medium">A Platform by Ohad Biller</p>
      </footer>
    </div>
  );
}
