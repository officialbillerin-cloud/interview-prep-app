import React, { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { MicrophoneButton } from '../components/MicrophoneButton';
import { RecordingIndicator } from '../components/RecordingIndicator';

// Logo SVG id for animation target reference
const LOGO_ID = 'quiz-logo-ellipse';

function PaperPlaneAnimation({ onDone }: { onDone: () => void }) {
  const planeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Find logo position in DOM
    const logoEl = document.getElementById(LOGO_ID);
    let targetX = window.innerWidth / 2;
    let targetY = 40;
    if (logoEl) {
      const rect = logoEl.getBoundingClientRect();
      targetX = rect.left + rect.width / 2;
      targetY = rect.top + rect.height / 2;
    }

    const startX = window.innerWidth / 2;
    const startY = window.innerHeight / 2;
    const dx = targetX - startX;
    const dy = targetY - startY;

    if (planeRef.current) {
      planeRef.current.style.setProperty('--dx', `${dx}px`);
      planeRef.current.style.setProperty('--dy', `${dy}px`);
    }

    const t = setTimeout(onDone, 1400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      <div
        ref={planeRef}
        className="absolute plane-fly"
        style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
      >
        <svg width="56" height="56" viewBox="0 0 64 64" fill="none">
          <path d="M4 32L60 4L44 60L32 40L4 32Z" fill="white" fillOpacity="0.95" stroke="#4a90d9" strokeWidth="1.5"/>
          <path d="M32 40L44 60L38 36L32 40Z" fill="#4a90d9" fillOpacity="0.7"/>
          <path d="M4 32L38 36L60 4L4 32Z" fill="white" fillOpacity="0.4"/>
        </svg>
      </div>
      <style>{`
        @keyframes plane-fly {
          0%   { transform: translate(-50%, -50%) scale(1.1) rotate(0deg); opacity: 1; }
          30%  { opacity: 1; }
          100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.15) rotate(15deg); opacity: 0; }
        }
        .plane-fly { animation: plane-fly 1.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
      `}</style>
    </div>
  );
}

const Q_LABELS = ['Q1', 'Q2', 'Q3'];

export function QuizSessionScreen() {
  const {
    selectedTopic,
    currentQuestionIndex,
    transcripts,
    saveTranscript,
    advanceQuestion,
    goBackToTopics,
  } = useAppContext();

  const {
    isRecording,
    transcript,
    interimTranscript,
    startRecording,
    stopRecording,
    error,
    retry,
  } = useSpeechRecognition();

  const wasRecordingRef = useRef(false);
  const transcriptQuestionRef = useRef(currentQuestionIndex);
  const [showAnimation, setShowAnimation] = useState(false);
  const [pendingAdvance, setPendingAdvance] = useState(false);

  // Reset live transcript tracking when question changes
  useEffect(() => {
    if (transcriptQuestionRef.current !== currentQuestionIndex) {
      transcriptQuestionRef.current = currentQuestionIndex;
      if (isRecording) stopRecording();
    }
  }, [currentQuestionIndex]);

  // Save transcript on recording stop
  useEffect(() => {
    if (wasRecordingRef.current && !isRecording && transcript) {
      saveTranscript(transcriptQuestionRef.current, transcript);
    }
    wasRecordingRef.current = isRecording;
  }, [isRecording]);

  const handleAnimationDone = () => {
    setShowAnimation(false);
    if (pendingAdvance) {
      setPendingAdvance(false);
      advanceQuestion();
    }
  };

  if (!selectedTopic) return null;

  const totalQuestions = selectedTopic.questions.length;
  const currentQuestion = selectedTopic.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  // Current question: show live transcript or saved
  const savedTranscript = transcripts[currentQuestionIndex] ?? '';
  const hasTranscript = savedTranscript.trim().length > 0 || transcript.trim().length > 0;
  const displayTranscript = savedTranscript || transcript;

  const handleToggle = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const handleNext = () => {
    // Save current live transcript immediately before advancing
    // (don't rely solely on the isRecording effect which fires async)
    const currentTranscript = transcript || transcripts[currentQuestionIndex] || '';
    if (currentTranscript.trim()) {
      saveTranscript(currentQuestionIndex, currentTranscript.trim());
    }
    if (isRecording) stopRecording();
    setShowAnimation(true);
    setPendingAdvance(true);
  };

  const progress = (currentQuestionIndex / totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-pattern flex flex-col">
      {showAnimation && <PaperPlaneAnimation onDone={handleAnimationDone} />}

      {/* Header */}
      <header className="border-b border-white/10 bg-[#0f1c35]/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <ellipse id={LOGO_ID} cx="16" cy="16" rx="10" ry="15" fill="url(#lgq)" transform="rotate(-20 16 16)" />
              <defs>
                <linearGradient id="lgq" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#7ab3e8" />
                  <stop offset="100%" stopColor="#1a2744" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-lg font-bold text-white">Preptimize</span>
          </div>
          <button
            onClick={goBackToTopics}
            className="flex items-center gap-2 text-sm text-[#7ab3e8] hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Topics
          </button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="w-full h-1 bg-white/10">
        <div
          className="h-1 bg-gradient-to-r from-[#4a90d9] to-[#7ab3e8] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 flex gap-6">

        {/* LEFT — saved answers panel */}
        <aside className="w-64 shrink-0 flex flex-col gap-3 pt-2">
          <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Your Answers</p>
          {Q_LABELS.map((label, i) => {
            // Only show saved answer if this question has been completed (i < currentQuestionIndex)
            const saved = i < currentQuestionIndex ? (transcripts[i] ?? '') : '';
            const isCurrent = i === currentQuestionIndex;
            const isDone = i < currentQuestionIndex;
            const isFuture = i > currentQuestionIndex;
            return (
              <div
                key={i}
                className={`rounded-2xl p-4 border transition-all duration-200 ${
                  isCurrent
                    ? 'border-[#4a90d9]/50 bg-[#4a90d9]/10'
                    : isDone
                    ? 'border-white/10 bg-white/5'
                    : 'border-white/5 bg-white/[0.02] opacity-40'
                }`}
              >
                <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isCurrent ? 'text-[#7ab3e8]' : 'text-white/40'}`}>
                  {label}
                </p>
                {isDone && saved ? (
                  <p className="text-xs text-white/70 leading-relaxed line-clamp-4">{saved}</p>
                ) : isCurrent && (isRecording || transcript) ? (
                  <p className="text-xs text-white/70 leading-relaxed line-clamp-4 italic">
                    {transcript}
                    {isRecording && interimTranscript && (
                      <span className="text-[#7ab3e8]"> {interimTranscript}</span>
                    )}
                  </p>
                ) : (
                  <p className="text-xs text-white/20 italic">
                    {isCurrent ? 'Tap mic to answer…' : 'Not yet answered'}
                  </p>
                )}
              </div>
            );
          })}
        </aside>

        {/* RIGHT — question + mic */}
        <div className="flex-1 flex flex-col">
          <p className="text-[#7ab3e8] text-sm font-semibold uppercase tracking-widest mb-4 text-center">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </p>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-6 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-white leading-snug text-center">
              {currentQuestion}
            </h2>
          </div>

          {error === 'not-supported' && (
            <div role="alert" className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-sm text-amber-300 text-center mb-4">
              Speech recognition is not supported. Please use Chrome or Edge.
            </div>
          )}
          {error === 'permission-denied' && (
            <div role="alert" className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 text-center mb-4 flex flex-col items-center gap-3">
              <p className="text-sm text-red-300">Microphone access was denied.</p>
              <button onClick={retry} className="px-5 py-2 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-400 transition-colors">
                Retry
              </button>
            </div>
          )}

          {!error && (
            <div className="flex flex-col items-center gap-3 mb-4">
              <MicrophoneButton isRecording={isRecording} onToggle={handleToggle} />
              <RecordingIndicator isRecording={isRecording} />
            </div>
          )}

          {/* Live transcript box — centered below mic */}
          <div className={`rounded-2xl border p-4 mb-4 min-h-[72px] transition-all duration-200 ${
            isRecording || displayTranscript
              ? 'border-[#4a90d9]/30 bg-[#4a90d9]/5'
              : 'border-white/5 bg-white/[0.02]'
          }`} aria-live="polite">
            <p className="text-xs font-semibold text-[#7ab3e8] uppercase tracking-widest mb-1">Your answer</p>
            {displayTranscript || (isRecording && interimTranscript) ? (
              <p className="text-sm text-white/90 leading-relaxed">
                {displayTranscript}
                {isRecording && interimTranscript && (
                  <span className="text-[#7ab3e8] italic"> {interimTranscript}</span>
                )}
              </p>
            ) : (
              <p className="text-sm text-white/20 italic">
                {isRecording ? 'Listening…' : 'Tap the mic to start recording your answer'}
              </p>
            )}
          </div>

          <div className="flex gap-3 mt-auto">
            {currentQuestionIndex > 0 && (
              <button
                onClick={goBackToTopics}
                className="flex-1 py-3.5 rounded-2xl border border-white/20 text-white/70 font-semibold hover:bg-white/10 hover:text-white transition-all duration-200"
              >
                ← Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!hasTranscript}
              aria-disabled={!hasTranscript}
              className={`flex-1 py-3.5 rounded-2xl font-bold text-base transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#4a90d9]/40
                ${hasTranscript
                  ? 'bg-gradient-to-r from-[#2d5a8e] to-[#4a90d9] text-white hover:from-[#4a90d9] hover:to-[#7ab3e8] shadow-lg shadow-[#4a90d9]/20 cursor-pointer'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
                }`}
            >
              {isLastQuestion ? 'Finish & Get Feedback →' : 'Next Question →'}
            </button>
          </div>
        </div>
      </main>

      {/* Fixed bottom-right attribution */}
      <footer className="fixed bottom-4 right-6 z-20">
        <p className="text-white/40 text-xs">A Platform by Ohad Biller</p>
      </footer>
    </div>
  );
}
