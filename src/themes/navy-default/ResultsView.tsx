import React, { useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAnthropicScorer } from '../hooks/useAnthropicScorer';
import { useScoreStore } from '../hooks/useScoreStore';
import { useSessionHistory } from '../hooks/useSessionHistory';
import { FeedbackCard } from '../components/FeedbackCard';

function ScoreRing({ score }: { score: number }) {
  const pct = (score / 100) * 100;
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const ringColor = score >= 75 ? '#34d399' : score >= 50 ? '#4a90d9' : score >= 30 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative flex items-center justify-center w-40 h-40 mx-auto">
      <svg className="absolute inset-0 -rotate-90" width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        <circle
          cx="80" cy="80" r={r} fill="none"
          stroke={ringColor} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="text-center">
        <p className="text-5xl font-extrabold text-white" data-testid="overall-score">{score}</p>
        <p className="text-xs text-[#7ab3e8] font-semibold">out of 100</p>
      </div>
    </div>
  );
}

export function ResultsView() {
  const { transcripts, selectedTopic, goBackToTopics } = useAppContext();
  const { score, feedback, isLoading, error, submit, retry } = useAnthropicScorer();
  const { saveScore } = useScoreStore();
  const { saveSession } = useSessionHistory();
  const submitted = useRef(false);

  // Wait until all transcripts are saved before submitting.
  // The last transcript may arrive slightly after the screen mounts
  // due to async React state updates from stopRecording → saveTranscript.
  useEffect(() => {
    if (submitted.current) return;
    if (!selectedTopic) return;

    const totalQuestions = selectedTopic.questions.length;
    const filledTranscripts = transcripts.filter(t => t && t.trim().length > 0);

    // All questions answered — submit
    if (filledTranscripts.length >= totalQuestions) {
      submitted.current = true;
      submit(transcripts, selectedTopic.questions);
      return;
    }

    // Not all transcripts ready yet — wait up to 3s then submit anyway
    const timeout = setTimeout(() => {
      if (!submitted.current) {
        submitted.current = true;
        // Fill any missing transcripts with placeholder so Gemini still gets context
        const filled = selectedTopic.questions.map((_, i) => transcripts[i]?.trim() || '(no answer provided)');
        submit(filled, selectedTopic.questions);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [transcripts, selectedTopic]);

  useEffect(() => {
    if (score !== null && selectedTopic && feedback) {
      saveScore(selectedTopic.id, score);
      saveSession(selectedTopic, { score, feedback });
    }
  }, [score, selectedTopic, feedback]);

  return (
    <div className="min-h-screen bg-pattern flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0f1c35]/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <ellipse cx="16" cy="16" rx="10" ry="15" fill="url(#lg3)" transform="rotate(-20 16 16)" />
            <defs>
              <linearGradient id="lg3" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#7ab3e8" />
                <stop offset="100%" stopColor="#1a2744" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-lg font-bold text-white">Preptimize</span>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10 space-y-8">
        <h1 className="text-3xl font-extrabold text-white text-center">Your Results</h1>

        {isLoading && (
          <div className="flex flex-col items-center py-16 gap-4">
            <div className="h-12 w-12 rounded-full border-4 border-[#4a90d9] border-t-transparent animate-spin" />
            <p className="text-[#7ab3e8] font-medium">Analyzing your answers… this may take a few seconds</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-6 text-center space-y-3">
            <p className="text-red-300 font-semibold">Scoring unavailable</p>
            <p className="text-red-200/70 text-sm">Could not connect to the AI scoring service. Check your internet connection and try again.</p>
            <button
              onClick={retry}
              className="px-6 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-400 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && score !== null && (
          <>
            {/* Score card */}
            <div className="rounded-3xl bg-gradient-to-br from-[#1e3a5f] to-[#0f1c35] border border-white/10 p-8 text-center">
              <p className="text-[#7ab3e8] text-sm font-bold uppercase tracking-widest mb-6">Overall Score</p>
              <ScoreRing score={score} />
            </div>

            {feedback && feedback.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white">Per-Question Feedback</h2>
                {feedback.map((fb, i) => (
                  <FeedbackCard key={fb.questionIndex} feedback={fb} index={i} />
                ))}
              </div>
            )}
          </>
        )}

        <button
          onClick={goBackToTopics}
          className="w-full py-3.5 rounded-2xl border border-white/20 text-white/70 font-semibold hover:bg-white/10 hover:text-white transition-all duration-200"
        >
          ← Back to Topics
        </button>
      </main>

      <footer className="fixed bottom-4 right-6 z-20">
        <p className="text-white/40 text-xs">A Platform by Ohad Biller</p>
      </footer>
    </div>
  );
}
