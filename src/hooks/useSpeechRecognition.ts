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

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

function getSpeechRecognitionConstructor(): typeof SpeechRecognition | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<SpeechRecognitionError>(
    getSpeechRecognitionConstructor() === null ? 'not-supported' : null
  );

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  // Whether the user explicitly stopped (vs browser auto-stopping on silence)
  const stoppedByUserRef = useRef(false);
  const transcriptRef = useRef('');

  const createAndStart = useCallback((existingTranscript: string) => {
    const SpeechRecognitionCtor = getSpeechRecognitionConstructor();
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let finalChunk = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalChunk += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
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

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('permission-denied');
        stoppedByUserRef.current = true;
      }
      setIsRecording(false);
      setInterimTranscript('');
    };

    recognition.onend = () => {
      setInterimTranscript('');
      // If user didn't explicitly stop, restart to handle silence pauses
      if (!stoppedByUserRef.current) {
        try {
          recognition.start();
        } catch {
          setIsRecording(false);
        }
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
    const SpeechRecognitionCtor = getSpeechRecognitionConstructor();
    if (!SpeechRecognitionCtor) {
      setError('not-supported');
      return;
    }
    setError(null);
    setTranscript('');
    setInterimTranscript('');
    transcriptRef.current = '';
    stoppedByUserRef.current = false;
    createAndStart('');
  }, [createAndStart]);

  const stopRecording = useCallback(() => {
    stoppedByUserRef.current = true;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setInterimTranscript('');
  }, []);

  const retry = useCallback(() => {
    setError(null);
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(stream => {
        stream.getTracks().forEach(track => track.stop());
        setError(null);
      })
      .catch(() => {
        setError('permission-denied');
      });
  }, []);

  return { isRecording, transcript, interimTranscript, startRecording, stopRecording, error, retry };
}
