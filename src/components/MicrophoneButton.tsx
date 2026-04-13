import React from 'react';

export function MicrophoneButton({ isRecording, onToggle }: { isRecording: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      aria-pressed={isRecording}
      className={`
        relative flex items-center justify-center w-20 h-20 rounded-full
        transition-all duration-300 focus:outline-none select-none
        ${isRecording
          ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-[0_0_32px_rgba(239,68,68,0.5),0_0_64px_rgba(239,68,68,0.2)] scale-110'
          : 'bg-gradient-to-br from-blue-500 to-blue-700 shadow-[0_0_24px_rgba(74,144,217,0.4)] hover:scale-105 hover:shadow-[0_0_40px_rgba(74,144,217,0.6)] active:scale-95'
        }
      `}
    >
      {isRecording && (
        <>
          <span className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-20" />
          <span className="absolute -inset-2 rounded-full border border-red-400/30 animate-pulse" />
        </>
      )}
      {isRecording ? (
        <svg className="w-7 h-7 text-white relative z-10" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="6" width="12" height="12" rx="2.5" />
        </svg>
      ) : (
        <svg className="w-7 h-7 text-white relative z-10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-1 18.93V22h2v-2.07A8.001 8.001 0 0 0 20 12h-2a6 6 0 0 1-12 0H4a8.001 8.001 0 0 0 7 7.93z" />
        </svg>
      )}
    </button>
  );
}
