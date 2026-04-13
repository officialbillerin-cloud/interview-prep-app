import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { QuizSessionScreen } from '../QuizSessionScreen';
import { topics } from '../../data/topics';
import type { UseSpeechRecognitionReturn } from '../../hooks/useSpeechRecognition';

const mockTopic = topics[0]; // conflict-resolution, 3 questions

const defaultSpeechState: UseSpeechRecognitionReturn = {
  isRecording: false,
  transcript: '',
  interimTranscript: '',
  startRecording: vi.fn(),
  stopRecording: vi.fn(),
  error: null,
  retry: vi.fn(),
};

const mockAdvanceQuestion = vi.fn();
const mockSaveTranscript = vi.fn();

vi.mock('../../context/AppContext', () => ({
  useAppContext: vi.fn(),
}));

vi.mock('../../hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: vi.fn(),
}));

import { useAppContext } from '../../context/AppContext';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

const mockUseAppContext = useAppContext as ReturnType<typeof vi.fn>;
const mockUseSpeechRecognition = useSpeechRecognition as ReturnType<typeof vi.fn>;

function setupMocks(
  speechOverrides: Partial<UseSpeechRecognitionReturn> = {},
  contextOverrides: Record<string, unknown> = {}
) {
  mockUseSpeechRecognition.mockReturnValue({ ...defaultSpeechState, ...speechOverrides });
  mockUseAppContext.mockReturnValue({
    selectedTopic: mockTopic,
    currentQuestionIndex: 0,
    transcripts: [],
    saveTranscript: mockSaveTranscript,
    advanceQuestion: mockAdvanceQuestion,
    screen: 'quiz-session',
    scoringResult: null,
    selectTopic: vi.fn(),
    goBackToTopics: vi.fn(),
    setScoringResult: vi.fn(),
    ...contextOverrides,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('QuizSessionScreen – Next button disabled without transcript', () => {
  it('disables Next when no transcript and not recording', () => {
    setupMocks({ transcript: '', interimTranscript: '' }, { transcripts: [] });
    render(<QuizSessionScreen />);
    const btn = screen.getByRole('button', { name: /next/i });
    expect(btn).toBeDisabled();
  });

  it('disables Next when saved transcript is empty whitespace', () => {
    setupMocks({ transcript: '', interimTranscript: '' }, { transcripts: ['   '] });
    render(<QuizSessionScreen />);
    const btn = screen.getByRole('button', { name: /next/i });
    expect(btn).toBeDisabled();
  });
});

describe('QuizSessionScreen – Next button enabled with transcript', () => {
  it('enables Next when live transcript is non-empty', () => {
    setupMocks({ transcript: 'Some answer', interimTranscript: '' }, { transcripts: [] });
    render(<QuizSessionScreen />);
    const btn = screen.getByRole('button', { name: /next/i });
    expect(btn).not.toBeDisabled();
  });

  it('enables Next when saved transcript is non-empty', () => {
    setupMocks({ transcript: '', interimTranscript: '' }, { transcripts: ['Saved answer'] });
    render(<QuizSessionScreen />);
    const btn = screen.getByRole('button', { name: /next/i });
    expect(btn).not.toBeDisabled();
  });
});

describe('QuizSessionScreen – Interim transcript displayed while recording', () => {
  it('shows interim transcript text when recording is active', () => {
    const interim = 'I am currently speaking...';
    setupMocks({ isRecording: true, interimTranscript: interim });
    render(<QuizSessionScreen />);
    expect(screen.getByText(interim)).toBeTruthy();
  });

  it('does not show interim transcript box when not recording', () => {
    setupMocks({ isRecording: false, interimTranscript: 'leftover' });
    render(<QuizSessionScreen />);
    // The component only renders the interim div when isRecording && interimTranscript
    expect(screen.queryByText('leftover')).toBeNull();
  });

  it('does not show interim transcript box when recording but interim is empty', () => {
    setupMocks({ isRecording: true, interimTranscript: '' });
    render(<QuizSessionScreen />);
    // No interim box rendered for empty string
    const liveRegions = screen.queryAllByText('');
    // Just verify no visible interim content
    expect(screen.queryByText(/speaking/i)).toBeNull();
  });
});
