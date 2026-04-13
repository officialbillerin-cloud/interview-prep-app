import React from 'react';

interface MicrophoneButtonProps {
  isRecording: boolean;
  onToggle: () => void;
}

export function MicrophoneButton({ isRecording, onToggle }: MicrophoneButtonProps) {
  return (
    <button
      onClick={onToggle}
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      aria-pressed={isRecording}
      className={`
        relative flex items-center justify-center w-20 h-20 rounded-full
        transition-all duration-300 focus:outline-none focus:ring-4
        ${isRecording
          ? 'bg-gradient-to-br from-red-500 to-red-700 focus:ring-red-400/40 shadow-xl shadow-red-500/30 scale-110'
          : 'bg-gradient-to-br from-[#2d5a8e] to-[#4a90d9] focus:ring-[#4a90d9]/40 shadow-lg shadow-[#4a90d9]/20 hover:scale-105'
        }
      `}
    >
      {/* Pulse ring when recording */}
      {isRecording && (
        <span className="absolute inset-0 rounded-full animate-ping bg-red-500 opacity-20" />
      )}
      {isRecording ? (
        <svg className="w-7 h-7 text-white relative z-10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      ) : (
        <svg className="w-7 h-7 text-white relative z-10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-1 18.93V22h2v-2.07A8.001 8.001 0 0 0 20 12h-2a6 6 0 0 1-12 0H4a8.001 8.001 0 0 0 7 7.93z" />
        </svg>
      )}
    </button>
  );
}
