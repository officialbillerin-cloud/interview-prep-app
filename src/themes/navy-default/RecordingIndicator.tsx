import React from 'react';

interface RecordingIndicatorProps {
  isRecording: boolean;
}

export function RecordingIndicator({ isRecording }: RecordingIndicatorProps) {
  if (!isRecording) return null;

  return (
    <div className="flex items-center gap-2" role="status" aria-live="polite" aria-label="Recording in progress">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
      </span>
      <span className="text-sm font-semibold text-red-400 tracking-wide">Recording</span>
    </div>
  );
}
