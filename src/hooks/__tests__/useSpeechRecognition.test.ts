import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useSpeechRecognition } from '../useSpeechRecognition';

// Minimal SpeechRecognition mock factory
function createMockRecognition() {
  const instance = {
    continuous: false,
    interimResults: false,
    lang: '',
    onstart: null as (() => void) | null,
    onresult: null as ((e: SpeechRecognitionEvent) => void) | null,
    onerror: null as ((e: SpeechRecognitionErrorEvent) => void) | null,
    onend: null as (() => void) | null,
    start: vi.fn(),
    stop: vi.fn(),
  };
  return instance;
}

type MockRecognitionInstance = ReturnType<typeof createMockRecognition>;

let mockInstance: MockRecognitionInstance;

const MockSpeechRecognition = vi.fn(() => {
  mockInstance = createMockRecognition();
  return mockInstance;
});

describe('useSpeechRecognition', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as Window & { SpeechRecognition?: unknown }).SpeechRecognition;
    delete (window as Window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
  });

  describe('not-supported error', () => {
    it('sets error to not-supported when SpeechRecognition API is absent', () => {
      // Ensure both APIs are undefined
      delete (window as Window & { SpeechRecognition?: unknown }).SpeechRecognition;
      delete (window as Window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

      const { result } = renderHook(() => useSpeechRecognition());

      expect(result.current.error).toBe('not-supported');
    });

    it('sets error to not-supported when startRecording is called without API', () => {
      delete (window as Window & { SpeechRecognition?: unknown }).SpeechRecognition;
      delete (window as Window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

      const { result } = renderHook(() => useSpeechRecognition());

      act(() => {
        result.current.startRecording();
      });

      expect(result.current.error).toBe('not-supported');
      expect(result.current.isRecording).toBe(false);
    });
  });

  describe('permission-denied error', () => {
    beforeEach(() => {
      (window as Window & { SpeechRecognition?: unknown }).SpeechRecognition =
        MockSpeechRecognition as unknown as typeof SpeechRecognition;
    });

    it('sets error to permission-denied when recognition fires a not-allowed error', () => {
      const { result } = renderHook(() => useSpeechRecognition());

      act(() => {
        result.current.startRecording();
      });

      act(() => {
        mockInstance.onerror?.({ error: 'not-allowed' } as SpeechRecognitionErrorEvent);
      });

      expect(result.current.error).toBe('permission-denied');
      expect(result.current.isRecording).toBe(false);
    });

    it('sets error to permission-denied when recognition fires a service-not-allowed error', () => {
      const { result } = renderHook(() => useSpeechRecognition());

      act(() => {
        result.current.startRecording();
      });

      act(() => {
        mockInstance.onerror?.({ error: 'service-not-allowed' } as SpeechRecognitionErrorEvent);
      });

      expect(result.current.error).toBe('permission-denied');
      expect(result.current.isRecording).toBe(false);
    });
  });

  describe('transcript saved on stop', () => {
    beforeEach(() => {
      (window as Window & { SpeechRecognition?: unknown }).SpeechRecognition =
        MockSpeechRecognition as unknown as typeof SpeechRecognition;
    });

    it('retains transcript after stopRecording is called', () => {
      const { result } = renderHook(() => useSpeechRecognition());

      act(() => {
        result.current.startRecording();
      });

      // Simulate a final result
      act(() => {
        mockInstance.onresult?.({
          resultIndex: 0,
          results: [
            Object.assign([{ transcript: 'Hello world', confidence: 1 }], { isFinal: true, length: 1 }),
          ],
        } as unknown as SpeechRecognitionEvent);
      });

      act(() => {
        result.current.stopRecording();
      });

      expect(result.current.transcript).toBe('Hello world');
      expect(result.current.isRecording).toBe(false);
      expect(result.current.interimTranscript).toBe('');
    });

    it('clears interimTranscript on stop but keeps final transcript', () => {
      const { result } = renderHook(() => useSpeechRecognition());

      act(() => {
        result.current.startRecording();
      });

      // Simulate an interim result
      act(() => {
        mockInstance.onresult?.({
          resultIndex: 0,
          results: [
            Object.assign([{ transcript: 'typing...', confidence: 0.5 }], { isFinal: false, length: 1 }),
          ],
        } as unknown as SpeechRecognitionEvent);
      });

      expect(result.current.interimTranscript).toBe('typing...');

      act(() => {
        result.current.stopRecording();
      });

      expect(result.current.interimTranscript).toBe('');
      expect(result.current.transcript).toBe('');
    });
  });
});
