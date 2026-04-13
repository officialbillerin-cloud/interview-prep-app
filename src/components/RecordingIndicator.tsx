import React from 'react';

export function RecordingIndicator({ isRecording }: { isRecording: boolean }) {
  if (!isRecording) return null;
  return (
    <div className="flex items-center gap-2" role="status" aria-live="polite">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400" />
      </span>
      <span className="text-sm font-bold text-cyan-400 tracking-wide">Recording</span>
    </div>
  );
}
