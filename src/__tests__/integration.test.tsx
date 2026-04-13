import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { App } from '../App';

// ── Mock useSpeechRecognition ──────────────────────────────────────────────
type SpeechController = {
  setTranscript: (t: string) => void;
  setIsRecording: (v: boolean) => void;
};

let speechController: SpeechController = {
  setTranscript: () => {},
  setIsRecording: () => {},
};

vi.mock('../hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: () => {
    const [isRecording, setIsRecording] = React.useState(false);
    const [transcript, setTranscript] = React.useState('');

    const setTranscriptRef = React.useRef(setTranscript);
    const setIsRecordingRef = React.useRef(setIsRecording);
    setTranscriptRef.current = setTranscript;
    setIsRecordingRef.current = setIsRecording;

    React.useEffect(() => {
      speechController = {
        setTranscript: (t) => setTranscriptRef.current(t),
        setIsRecording: (v) => setIsRecordingRef.current(v),
      };
    }, []);

    return {
      isRecording,
      transcript,
      interimTranscript: '',
      startRecording: () => setIsRecording(true),
      stopRecording: () => setIsRecording(false),
      error: null,
      retry: () => {},
    };
  },
}));

// ── Mock useAnthropicScorer ────────────────────────────────────────────────
const FIXED_SCORE = 8;
const FIXED_FEEDBACK = [
  { questionIndex: 0, question: 'Q1', transcript: 'Answer 1', commentary: 'Good answer', improvementTips: 'Be more specific' },
  { questionIndex: 1, question: 'Q2', transcript: 'Answer 2', commentary: 'Solid', improvementTips: 'Add examples' },
  { questionIndex: 2, question: 'Q3', transcript: 'Answer 3', commentary: 'Well structured', improvementTips: 'Keep it concise' },
];

vi.mock('../hooks/useAnthropicScorer', () => ({
  useAnthropicScorer: () => {
    const [score, setScore] = React.useState<number | null>(null);
    const [feedback, setFeedback] = React.useState<typeof FIXED_FEEDBACK | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);

    const submit = React.useCallback(() => {
      setIsLoading(true);
      Promise.resolve().then(() => {
        setScore(FIXED_SCORE);
        setFeedback(FIXED_FEEDBACK);
        setIsLoading(false);
      });
    }, []);

    return { score, feedback, isLoading, error: null, submit, retry: () => {} };
  },
}));

// ── localStorage mock ──────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

// ── Helper ─────────────────────────────────────────────────────────────────
async function recordAnswer(transcript: string) {
  await act(async () => { speechController.setIsRecording(true); });
  await act(async () => {
    speechController.setTranscript(transcript);
    speechController.setIsRecording(false);
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe('Integration: full happy-path flow', () => {
  beforeEach(() => { localStorageMock.clear(); });
  afterEach(() => { vi.clearAllMocks(); });

  it('select topic → answer 3 questions → view results → score persisted → back to topics → score shown on TopicCard', async () => {
    const user = userEvent.setup();
    render(<App />);

    // 1. Topic Selection
    expect(screen.getByText('Interview Prep')).toBeInTheDocument();
    await user.click(screen.getByText('Conflict Resolution'));

    // 2. Question 1
    expect(screen.getByText(/Question 1 of 3/i)).toBeInTheDocument();
    await recordAnswer('Answer to question one');
    const next1 = screen.getByRole('button', { name: /next/i });
    expect(next1).not.toBeDisabled();
    await user.click(next1);

    // 3. Question 2
    expect(screen.getByText(/Question 2 of 3/i)).toBeInTheDocument();
    await recordAnswer('Answer to question two');
    await user.click(screen.getByRole('button', { name: /next/i }));

    // 4. Question 3
    expect(screen.getByText(/Question 3 of 3/i)).toBeInTheDocument();
    await recordAnswer('Answer to question three');
    await user.click(screen.getByRole('button', { name: /finish/i }));

    // 5. Results screen
    await waitFor(() => expect(screen.getByText('Your Results')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId('overall-score')).toHaveTextContent(String(FIXED_SCORE)));

    // 6. Score persisted
    await waitFor(() => {
      const stored = localStorageMock.getItem('interview-prep-scores');
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!)['conflict-resolution']).toBe(FIXED_SCORE);
    });

    // 7. Back to Topics
    await user.click(screen.getByRole('button', { name: /back to topics/i }));
    expect(screen.getByText('Interview Prep')).toBeInTheDocument();

    // 8. Score shown on TopicCard
    await waitFor(() => {
      expect(screen.getByTestId('score-indicator')).toHaveTextContent(`${FIXED_SCORE}/10`);
    });
  });
});
