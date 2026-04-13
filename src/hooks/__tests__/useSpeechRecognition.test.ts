import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useSpeechRecognition } from '../useSpeechRecognition';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => any;

function createMockRecognition() {
  return {
    continuous: false,
    interimResults: false,
    lang: '',
    onstart: null as AnyFn | null,
    onresult: null as AnyFn | null,
    onerror: null as AnyFn | null,
    onend: null as AnyFn | null,
    start: vi.fn(),
    stop: vi.fn(),
  };
}

type MockRecognitionInstance = ReturnType<typeof createMockRecognition>;
let mockInstance: MockRecognitionInstance;

const MockSpeechRecognition = vi.fn(() => {
  mockInstance = createMockRecognition();
  return mockInstance;
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const w = window as any;

describe('useSpeechRecognition', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete w.SpeechRecognition;
    delete w.webkitSpeechRecognition;
  });

  describe('not-supported error', () => {
    it('sets error to not-supported when SpeechRecognition API is absent', () => {
      delete w.SpeechRecognition;
      delete w.webkitSpeechRecognition;
      const { result } = renderHook(() => useSpeechRecognition());
      expect(result.current.error).toBe('not-supported');
    });

    it('sets error to not-supported when startRecording is called without API', () => {
      delete w.SpeechRecognition;
      delete w.webkitSpeechRecognition;
      const { result } = renderHook(() => useSpeechRecognition());
      act(() => { result.current.startRecording(); });
      expect(result.current.error).toBe('not-supported');
      expect(result.current.isRecording).toBe(false);
    });
  });

  describe('permission-denied error', () => {
    beforeEach(() => { w.SpeechRecognition = MockSpeechRecognition; });

    it('sets error to permission-denied on not-allowed', () => {
      const { result } = renderHook(() => useSpeechRecognition());
      act(() => { result.current.startRecording(); });
      act(() => { mockInstance.onerror?.({ error: 'not-allowed' }); });
      expect(result.current.error).toBe('permission-denied');
    });

    it('sets error to permission-denied on service-not-allowed', () => {
      const { result } = renderHook(() => useSpeechRecognition());
      act(() => { result.current.startRecording(); });
      act(() => { mockInstance.onerror?.({ error: 'service-not-allowed' }); });
      expect(result.current.error).toBe('permission-denied');
    });
  });

  describe('transcript saved on stop', () => {
    beforeEach(() => { w.SpeechRecognition = MockSpeechRecognition; });

    it('retains transcript after stopRecording', () => {
      const { result } = renderHook(() => useSpeechRecognition());
      act(() => { result.current.startRecording(); });
      act(() => {
        mockInstance.onresult?.({
          resultIndex: 0,
          results: [Object.assign([{ transcript: 'Hello world', confidence: 1 }], { isFinal: true, length: 1 })],
        });
      });
      act(() => { result.current.stopRecording(); });
      expect(result.current.transcript).toBe('Hello world');
      expect(result.current.isRecording).toBe(false);
    });

    it('clears interimTranscript on stop', () => {
      const { result } = renderHook(() => useSpeechRecognition());
      act(() => { result.current.startRecording(); });
      act(() => {
        mockInstance.onresult?.({
          resultIndex: 0,
          results: [Object.assign([{ transcript: 'typing...', confidence: 0.5 }], { isFinal: false, length: 1 })],
        });
      });
      expect(result.current.interimTranscript).toBe('typing...');
      act(() => { result.current.stopRecording(); });
      expect(result.current.interimTranscript).toBe('');
    });
  });
});
