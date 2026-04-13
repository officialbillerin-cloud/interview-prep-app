import { useState, useRef, useCallback } from 'react';

type SpeechRecognitionError = 'permission-denied' | 'not-supported' | null;

export interface UseSpeechRecognitionReturn {
  isRecording: boolean;
  transcript: string;
  interimTranscript: string;
  startRecording: () => void;
  stopRecording: () => void;
  error: SpeechRecognitionError;
  retry: () => void;
}

// Use any to avoid TypeScript DOM lib version issues with Speech API
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpeechRecognition = any;

function getSpeechRecognitionConstructor(): AnySpeechRecognition | null {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<SpeechRecognitionError>(
    getSpeechRecognitionConstructor() === null ? 'not-supported' : null
  );

  const recognitionRef = useRef<AnySpeechRecognition>(null);
  const stoppedByUserRef = useRef(false);
  const transcriptRef = useRef('');

  const createAndStart = useCallback((existingTranscript: string) => {
    const SpeechRecognitionCtor = getSpeechRecognitionConstructor();
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsRecording(true);

    recognition.onresult = (event: AnySpeechRecognition) => {
      let interim = '';
      let finalChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalChunk += result[0].transcript;
        else interim += result[0].transcript;
      }
      if (finalChunk) {
        const updated = transcriptRef.current
          ? transcriptRef.current + ' ' + finalChunk.trim()
          : finalChunk.trim();
        transcriptRef.current = updated;
        setTranscript(updated);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: AnySpeechRecognition) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('permission-denied');
        stoppedByUserRef.current = true;
      }
      setIsRecording(false);
      setInterimTranscript('');
    };

    recognition.onend = () => {
      setInterimTranscript('');
      if (!stoppedByUserRef.current) {
        try { recognition.start(); } catch { setIsRecording(false); }
      } else {
        setIsRecording(false);
      }
    };

    recognitionRef.current = recognition;
    transcriptRef.current = existingTranscript;
    try {
      recognition.start();
    } catch {
      setError('permission-denied');
      setIsRecording(false);
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!getSpeechRecognitionConstructor()) { setError('not-supported'); return; }
    setError(null);
    setTranscript('');
    setInterimTranscript('');
    transcriptRef.current = '';
    stoppedByUserRef.current = false;
    createAndStart('');
  }, [createAndStart]);

  const stopRecording = useCallback(() => {
    stoppedByUserRef.current = true;
    if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; }
    setIsRecording(false);
    setInterimTranscript('');
  }, []);

  const retry = useCallback(() => {
    setError(null);
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => { stream.getTracks().forEach(t => t.stop()); setError(null); })
      .catch(() => setError('permission-denied'));
  }, []);

  return { isRecording, transcript, interimTranscript, startRecording, stopRecording, error, retry };
}
