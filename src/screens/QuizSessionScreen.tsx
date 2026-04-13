import React, { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { MicrophoneButton } from '../components/MicrophoneButton';
import { RecordingIndicator } from '../components/RecordingIndicator';

const LOGO_ID = 'quiz-logo-ellipse';

function PaperPlaneAnimation({ onDone }: { onDone: () => void }) {
  const planeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const logoEl = document.getElementById(LOGO_ID);
    let targetX = window.innerWidth / 2, targetY = 40;
    if (logoEl) {
      const rect = logoEl.getBoundingClientRect();
      targetX = rect.left + rect.width / 2;
      targetY = rect.top + rect.height / 2;
    }
    const dx = targetX - window.innerWidth / 2;
    const dy = targetY - window.innerHeight / 2;
    if (planeRef.current) {
      planeRef.current.style.setProperty('--dx', `${dx}px`);
      planeRef.current.style.setProperty('--dy', `${dy}px`);
    }
    const t = setTimeout(onDone, 1400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      <div ref={planeRef} className="absolute plane-fly" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
        <svg width="56" height="56" viewBox="0 0 64 64" fill="none">
          <path d="M4 32L60 4L44 60L32 40L4 32Z" fill="white" fillOpacity="0.95" stroke="#4a90d9" strokeWidth="1.5"/>
          <path d="M32 40L44 60L38 36L32 40Z" fill="#4a90d9" fillOpacity="0.7"/>
          <path d="M4 32L38 36L60 4L4 32Z" fill="white" fillOpacity="0.4"/>
        </svg>
      </div>
      <style>{`
        @keyframes plane-fly {
          0%   { transform: translate(-50%,-50%) scale(1.1) rotate(0deg); opacity:1; }
          30%  { opacity:1; }
          100% { transform: translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(0.15) rotate(15deg); opacity:0; }
        }
        .plane-fly { animation: plane-fly 1.3s cubic-bezier(0.4,0,0.2,1) forwards; }
      `}</style>
    </div>
  );
}

const Q_LABELS = ['Q1', 'Q2', 'Q3'];

export function QuizSessionScreen() {
  const { selectedTopic, currentQuestionIndex, transcripts, saveTranscript, advanceQuestion, goBackToTopics } = useAppContext();
  const { isRecording, transcript, interimTranscript, startRecording, stopRecording, error, retry } = useSpeechRecognition();

  const wasRecordingRef = useRef(false);
  const transcriptQuestionRef = useRef(currentQuestionIndex);
  const [showAnimation, setShowAnimation] = useState(false);
  const [pendingAdvance, setPendingAdvance] = useState(false);
  // iOS text fallback
  const [textInput, setTextInput] = useState('');
  const speechNotSupported = error === 'not-supported';

  useEffect(() => {
    if (transcriptQuestionRef.current !== currentQuestionIndex) {
      transcriptQuestionRef.current = currentQuestionIndex;
      if (isRecording) stopRecording();
      setTextInput('');
    }
  }, [currentQuestionIndex]);

  useEffect(() => {
    if (wasRecordingRef.current && !isRecording && transcript) {
      saveTranscript(transcriptQuestionRef.current, transcript);
    }
    wasRecordingRef.current = isRecording;
  }, [isRecording]);

  const handleAnimationDone = () => {
    setShowAnimation(false);
    if (pendingAdvance) { setPendingAdvance(false); advanceQuestion(); }
  };

  if (!selectedTopic) return null;

  const totalQuestions = selectedTopic.questions.length;
  const currentQuestion = selectedTopic.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const savedTranscript = transcripts[currentQuestionIndex] ?? '';
  const effectiveTranscript = speechNotSupported ? textInput : (savedTranscript || transcript);
  const hasTranscript = effectiveTranscript.trim().length > 0;
  const progress = (currentQuestionIndex / totalQuestions) * 100;

  const handleToggle = () => { if (isRecording) stopRecording(); else startRecording(); };

  const handleNext = () => {
    const t = speechNotSupported ? textInput : (transcript || transcripts[currentQuestionIndex] || '');
    if (t.trim()) saveTranscript(currentQuestionIndex, t.trim());
    if (isRecording) stopRecording();
    setShowAnimation(true);
    setPendingAdvance(true);
  };

  return (
    <div className="min-h-screen bg-pattern flex flex-col">
      {showAnimation && <PaperPlaneAnimation onDone={handleAnimationDone} />}

      {/* Header */}
      <header className="glass border-b border-white/8">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-3 md:py-5 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <ellipse id={LOGO_ID} cx="16" cy="16" rx="10" ry="15" fill="url(#lgq)" transform="rotate(-20 16 16)" />
              <defs>
                <linearGradient id="lgq" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#7ab3e8" />
                  <stop offset="100%" stopColor="#1a2744" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-lg md:text-xl font-black text-white">Preptimize</span>
          </div>
          <button onClick={goBackToTopics} className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-[#7ab3e8] hover:text-white transition-all px-3 md:px-4 py-2 rounded-xl glass hover:bg-white/10 border border-white/10">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Back to Topics</span>
            <span className="sm:hidden">Back</span>
          </button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="w-full h-0.5 bg-white/5">
        <div className="h-full bg-gradient-to-r from-cyan-400 via-[#4a90d9] to-blue-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Main — stacked on mobile, side-by-side on desktop */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-8 py-4 md:py-8 flex flex-col md:flex-row gap-4 md:gap-8">

        {/* Answers panel — horizontal scroll on mobile, sidebar on desktop */}
        <aside className="md:w-60 md:shrink-0 md:flex md:flex-col md:gap-3 md:pt-1">
          <p className="text-xs font-black text-white/30 uppercase tracking-widest mb-2">Your Answers</p>
          {/* Mobile: horizontal row */}
          <div className="flex md:hidden gap-2 overflow-x-auto pb-1">
            {Q_LABELS.map((label, i) => {
              const saved = i < currentQuestionIndex ? (transcripts[i] ?? '') : '';
              const isCurrent = i === currentQuestionIndex;
              const isDone = i < currentQuestionIndex;
              return (
                <div key={i} className={`shrink-0 w-28 rounded-xl p-3 border transition-all ${
                  isCurrent ? 'border-cyan-400/40 bg-cyan-400/5' : isDone ? 'border-white/10 glass' : 'border-white/5 bg-white/[0.02] opacity-30'
                }`}>
                  <p className={`text-xs font-black uppercase tracking-widest mb-1 ${isCurrent ? 'text-cyan-400' : 'text-white/30'}`}>{label}</p>
                  <p className="text-xs text-white/50 line-clamp-2 italic">
                    {isDone && saved ? saved : isCurrent && effectiveTranscript ? effectiveTranscript : 'Not yet answered'}
                  </p>
                </div>
              );
            })}
          </div>
          {/* Desktop: vertical stack */}
          <div className="hidden md:flex flex-col gap-3">
            {Q_LABELS.map((label, i) => {
              const saved = i < currentQuestionIndex ? (transcripts[i] ?? '') : '';
              const isCurrent = i === currentQuestionIndex;
              const isDone = i < currentQuestionIndex;
              return (
                <div key={i} className={`rounded-2xl p-4 border transition-all duration-300 ${
                  isCurrent ? 'border-cyan-400/40 bg-cyan-400/5 shadow-[0_0_20px_rgba(34,211,238,0.1)]'
                  : isDone ? 'border-white/10 glass' : 'border-white/5 bg-white/[0.02] opacity-30'
                }`}>
                  <p className={`text-xs font-black uppercase tracking-widest mb-1.5 ${isCurrent ? 'text-cyan-400' : 'text-white/30'}`}>{label}</p>
                  {isDone && saved ? (
                    <p className="text-xs text-white/60 leading-relaxed line-clamp-4">{saved}</p>
                  ) : isCurrent && (isRecording || transcript || textInput) ? (
                    <p className="text-xs text-white/70 leading-relaxed line-clamp-4 italic">
                      {textInput || transcript}{isRecording && interimTranscript && <span className="text-cyan-400"> {interimTranscript}</span>}
                    </p>
                  ) : (
                    <p className="text-xs text-white/20 italic">{isCurrent ? 'Answer here…' : 'Not yet answered'}</p>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Question + input */}
        <div className="flex-1 flex flex-col">
          <p className="text-cyan-400 text-xs font-black uppercase tracking-widest mb-3 md:mb-5 text-center">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </p>

          <div className="glass-strong rounded-2xl md:rounded-3xl p-5 md:p-10 mb-4 md:mb-6">
            <h2 className="text-lg md:text-2xl font-black text-white leading-snug text-center">{currentQuestion}</h2>
          </div>

          {/* iOS text fallback */}
          {speechNotSupported ? (
            <div className="mb-4 md:mb-5">
              <p className="text-xs text-amber-300/80 text-center mb-3">
                🎤 Voice recording isn't available on this browser. Type your answer below.
              </p>
              <textarea
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                placeholder="Type your answer here…"
                rows={4}
                className="w-full rounded-2xl border border-cyan-400/30 bg-cyan-400/5 p-4 text-sm text-white/90 placeholder-white/20 resize-none focus:outline-none focus:border-cyan-400/60 transition-colors"
              />
            </div>
          ) : (
            <>
              {error === 'permission-denied' && (
                <div role="alert" className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 text-center mb-4 flex flex-col items-center gap-3">
                  <p className="text-sm text-red-300">Microphone access was denied.</p>
                  <button onClick={retry} className="px-5 py-2 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-400 transition-colors">Retry</button>
                </div>
              )}

              {!error && (
                <div className="flex flex-col items-center gap-3 mb-4 md:mb-5">
                  <MicrophoneButton isRecording={isRecording} onToggle={handleToggle} />
                  <RecordingIndicator isRecording={isRecording} />
                </div>
              )}

              <div className={`rounded-2xl border p-4 mb-4 min-h-[72px] transition-all duration-300 ${
                isRecording ? 'border-cyan-400/40 bg-cyan-400/5' : effectiveTranscript ? 'border-[#4a90d9]/30 glass' : 'border-white/5 bg-white/[0.02]'
              }`} aria-live="polite">
                <p className="text-xs font-black text-cyan-400/70 uppercase tracking-widest mb-2">Your answer</p>
                {effectiveTranscript || (isRecording && interimTranscript) ? (
                  <p className="text-sm text-white/90 leading-relaxed">
                    {effectiveTranscript}
                    {isRecording && interimTranscript && <span className="text-cyan-400 italic"> {interimTranscript}</span>}
                  </p>
                ) : (
                  <p className="text-sm text-white/20 italic">{isRecording ? 'Listening…' : 'Tap the mic to start recording'}</p>
                )}
              </div>
            </>
          )}

          <div className="flex gap-3 mt-auto">
            {currentQuestionIndex > 0 && (
              <button onClick={goBackToTopics} className="flex-1 py-3.5 md:py-4 rounded-2xl glass border border-white/15 text-white/60 font-bold hover:bg-white/10 hover:text-white transition-all">
                ← Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!hasTranscript}
              className={`flex-1 py-3.5 md:py-4 rounded-2xl font-black text-sm md:text-base transition-all duration-300 focus:outline-none
                ${hasTranscript
                  ? 'bg-gradient-to-r from-[#4a90d9] to-cyan-400 text-white glow-blue cursor-pointer'
                  : 'glass border border-white/10 text-white/20 cursor-not-allowed'
                }`}
            >
              {isLastQuestion ? 'Finish & Get Feedback →' : 'Next Question →'}
            </button>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-4 right-4 md:right-7 z-20">
        <p className="text-white/30 text-xs font-medium">A Platform by Ohad Biller</p>
      </footer>
    </div>
  );
}
