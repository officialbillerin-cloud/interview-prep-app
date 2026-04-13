# Preptimize — System Design

## Overview

Preptimize is a single-page web application that helps job seekers practice interview answers using speech recognition and receive AI-powered scoring and feedback. Built with React, TypeScript, Vite, and Tailwind CSS.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (SPA)                        │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Topic      │    │    Quiz      │    │   Results    │  │
│  │  Selection   │───▶│   Session    │───▶│    View      │  │
│  │   Screen     │    │   Screen     │    │              │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│          │                  │                   │           │
│          └──────────────────┴───────────────────┘           │
│                             │                               │
│                    ┌────────▼────────┐                      │
│                    │   AppContext    │                       │
│                    │  (State Store) │                       │
│                    └────────────────┘                       │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    Hooks Layer                       │   │
│  │  useSpeechRecognition │ useScoreStore │ useScorer    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                │                            │
└────────────────────────────────┼────────────────────────────┘
                                 │ HTTPS fetch
                    ┌────────────▼────────────┐
                    │   Google Gemini API      │
                    │  (generativelanguage     │
                    │   .googleapis.com)       │
                    └─────────────────────────┘
```

---

## Data Flow

### 1. Topic Selection
- Static topic data loaded from `src/data/topics.ts`
- Topics grouped by category (Behavioral / Technical / Leadership)
- Previous scores read from `localStorage` via `useScoreStore`
- User selects a topic → `AppContext.selectTopic()` → screen transitions to `quiz-session`

### 2. Quiz Session
```
User speaks
    │
    ▼
Web Speech API (window.SpeechRecognition)
    │  continuous: true, interimResults: true
    ▼
useSpeechRecognition hook
    │  accumulates final transcript segments
    │  exposes interimTranscript for live display
    ▼
User clicks "Next Question"
    │
    ├─ saveTranscript(index, text) → AppContext.transcripts[]
    ├─ Paper plane animation plays
    └─ advanceQuestion() → next question or results screen
```

### 3. Scoring & Analysis
```
ResultsView mounts
    │
    ▼
Wait for all transcripts to be populated (max 3s)
    │
    ▼
useAnthropicScorer.submit(transcripts, questions)
    │
    ▼
Build structured prompt with all Q&A pairs
    │
    ▼
Gemini API call (gemini-2.0-flash-lite → gemini-2.0-flash → gemini-2.5-flash)
    │  with exponential backoff on 429 rate limits
    ▼
Parse JSON response → validate structure
    │
    ▼
Compute overall score = average(questionScores)  ← always calculated locally
    │
    ▼
Display: ScoreRing + per-question FeedbackCards with score bars
    │
    ▼
saveScore(topicId, score) → localStorage
```

---

## State Management

**AppContext** (React Context + useState):
```
AppState {
  screen: 'topic-selection' | 'quiz-session' | 'results'
  selectedTopic: Topic | null
  currentQuestionIndex: 0 | 1 | 2
  transcripts: string[]        ← indexed by question
  scoringResult: ScoringResult | null
}
```

**localStorage** (via useScoreStore):
```
"interview-prep-scores": { [topicId: string]: number }
```

---

## Scoring Model

Each question is scored on two dimensions:

| Dimension | Description | Range |
|-----------|-------------|-------|
| questionScore | Content quality, structure, relevance | 0–100 |
| toneScore | Tone appropriateness for question type | 0–100 |

**Overall Score** = `Math.round(sum(questionScores) / count)`

Tone rubric by category:
- **Behavioral** → reflective, accountable, collaborative
- **Technical** → precise, confident, analytical
- **Leadership** → authoritative yet humble, strategic

---

## Resilience Strategy

| Failure | Handling |
|---------|----------|
| 429 Rate limit | Exponential backoff: 3s → 6s → 12s → 24s, then try next model |
| Model unavailable | Fallback chain: flash-lite → flash → 2.5-flash |
| All models fail | Local heuristic scorer (word count + quality signals) |
| Parse error | JSON extraction with regex fallback |
| Missing transcript | Placeholder text sent to API |

---

## Component Tree

```
App
└── AppProvider
    ├── TopicSelectionScreen
    │   └── TopicCard (×9)
    ├── QuizSessionScreen
    │   ├── PaperPlaneAnimation
    │   ├── MicrophoneButton
    │   └── RecordingIndicator
    └── ResultsView
        ├── ScoreRing
        └── FeedbackCard (×3)
            └── ScoreBar (×2 per card)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS |
| Speech | Web Speech API (browser-native) |
| AI Scoring | Google Gemini API (gemini-2.0-flash) |
| State | React Context + useState |
| Persistence | localStorage |
| Testing | Vitest + @testing-library/react + fast-check (PBT) |

---

## Key Design Decisions

**Why browser-native speech recognition?**
Zero latency, no server round-trip, no cost. Tradeoff: Chrome/Edge only.

**Why Gemini over OpenAI?**
Free tier available. Tradeoff: stricter rate limits on free tier.

**Why local fallback scorer?**
Users always get a result even when API is unavailable. Maintains trust.

**Why React Context over Redux/Zustand?**
App state is simple and shallow — 5 fields. Context avoids unnecessary complexity.

**Why property-based testing?**
Interview prep scoring logic has invariants (score bounds, state transitions) that are hard to cover with example-based tests alone. fast-check generates hundreds of edge cases automatically.
