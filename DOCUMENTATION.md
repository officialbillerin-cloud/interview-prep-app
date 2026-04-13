# Preptimize — Documentation

## What is Preptimize?

Preptimize is a browser-based interview preparation platform. It guides job seekers through structured practice sessions: pick a topic, speak your answers out loud, and receive AI-generated scores and feedback — all without creating an account or leaving the browser.

No backend required for the core experience. Speech recognition runs natively in the browser. Scores are saved locally so progress persists across sessions.

---

## Getting Started

### Prerequisites

- Node.js 18+
- A modern browser (Chrome or Edge recommended — required for Web Speech API)
- A [Groq API key](https://console.groq.com) for AI scoring

### Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy the env template and fill in your key
cp .env.example .env
# Edit .env and set VITE_GROQ_API_KEY=your_key_here

# 3. Start the dev server
npm run dev
```

### Environment Variables

| Variable | Where used | Purpose |
|---|---|---|
| `VITE_GROQ_API_KEY` | Browser (dev only) | Direct Groq API calls on localhost |
| `GROQ_API_KEY` | Vercel serverless | Groq API calls in production via `/api/score` |

> In production, the frontend never holds the API key. All AI calls are proxied through the Vercel serverless function at `/api/score`.

---

## Application Flow

```
Topic Selection → Quiz Session (3 questions) → Results View
       ↑                                              |
       └──────────── "Back to Topics" ───────────────┘
```

### 1. Topic Selection Screen

The landing screen. Topics are grouped into three categories:

- **Behavioral** — Conflict Resolution, Teamwork & Collaboration, Adaptability
- **Technical** — System Design, Debugging & Problem Solving, Code Quality & Best Practices
- **Leadership** — Driving Results, Mentoring & Coaching, Strategic Thinking

Each topic card shows the topic name, a short description, question count, and your previous best score (if any).

### 2. Quiz Session Screen

After selecting a topic, you answer 3 questions one at a time by speaking into your microphone.

- Click the microphone button to start recording
- An animated pulse indicator shows when recording is active
- Live transcript appears on screen as you speak
- Click the microphone button again to stop and save your answer
- The "Next" button activates once a transcript is saved
- On the final question, "Next" becomes "Finish" and navigates to results

### 3. Results View

After completing all 3 questions, your answers are sent to the AI scorer. While scoring is in progress, a loading spinner is shown.

Once complete, you see:
- An overall score (0–100) displayed in a circular score ring
- Per-question feedback cards, each showing:
  - The question text
  - Your transcript
  - Content score and tone score (with visual bars)
  - Commentary on what worked and what didn't
  - Tone analysis
  - Specific improvement tips

Your score is automatically saved to localStorage for that topic.

---

## Scoring System

### Scale

All scores use **0–100**.

### Per-Question Dimensions

Each answer is evaluated on two axes:

| Dimension | What it measures | Range |
|---|---|---|
| `questionScore` | Content quality, structure, relevance | 0–100 |
| `toneScore` | Tone appropriateness for the question category | 0–100 |

### Tone Rubric by Category

| Category | Expected tone |
|---|---|
| Behavioral | Reflective, accountable, collaborative |
| Technical | Precise, confident, analytical |
| Leadership | Authoritative yet humble, strategic |

### Overall Score Calculation

The overall score is always computed locally — never trusted from the AI response:

```ts
Math.round(sum(questionScores) / feedback.length)
```

### Score Ranges

| Range | Label |
|---|---|
| 90–100 | Exceptional |
| 70–89 | Good |
| 50–69 | Average |
| 30–49 | Weak |
| 0–29 | Very poor |

---

## Architecture

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS |
| Speech | Web Speech API (browser-native) |
| AI Scoring | Groq API — `llama-3.3-70b-versatile` |
| State | React Context + useState |
| Persistence | localStorage |
| Deployment | Vercel (SPA + serverless function) |
| Testing | Vitest + @testing-library/react + fast-check |

---

### High-Level System Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                          Browser (SPA)                           │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                        App.tsx                          │    │
│  │                    (entry, no router)                   │    │
│  └───────────────────────┬─────────────────────────────────┘    │
│                          │                                       │
│              ┌───────────▼────────────┐                         │
│              │       AppProvider      │  React Context           │
│              │  (global state store)  │  useState only           │
│              └───────────┬────────────┘                         │
│                          │ screen switch                         │
│          ┌───────────────┼───────────────┐                      │
│          ▼               ▼               ▼                      │
│  ┌──────────────┐ ┌────────────┐ ┌─────────────┐               │
│  │    Topic     │ │    Quiz    │ │   Results   │               │
│  │  Selection   │ │  Session   │ │    View     │               │
│  │   Screen     │ │   Screen   │ │             │               │
│  └──────┬───────┘ └─────┬──────┘ └──────┬──────┘               │
│         │               │               │                       │
│         │        ┌──────┴──────┐        │                       │
│         │        │  Components │        │                       │
│         │        │  Mic Button │        │                       │
│         │        │  Rec Indic. │        │                       │
│         │        │  PaperPlane │        │                       │
│         │        └──────┬──────┘        │                       │
│         │               │               │                       │
│  ┌──────▼───────────────▼───────────────▼──────┐               │
│  │                  Hooks Layer                 │               │
│  │  useSpeechRecognition │ useScoreStore        │               │
│  │  useAnthropicScorer   │ useSessionHistory    │               │
│  └──────────────────┬────────────┬─────────────┘               │
│                     │            │                              │
│              Web Speech API  localStorage                       │
│              (browser-native)                                   │
└─────────────────────┬────────────────────────────────────────────┘
                      │ HTTPS POST /api/score (prod)
                      │ HTTPS POST groq.com   (dev)
         ┌────────────▼────────────┐
         │   Vercel Serverless     │  api/score.ts
         │   (Node.js 20.x)        │  holds GROQ_API_KEY
         └────────────┬────────────┘
                      │
         ┌────────────▼────────────┐
         │      Groq API           │
         │  llama-3.3-70b-versatile│
         └─────────────────────────┘
```

---

### Component Tree

```
App
└── AppProvider                        (React Context — global state)
    ├── TopicSelectionScreen
    │   ├── HistoryScreen              (toggled via local state)
    │   └── TopicCard ×9
    ├── QuizSessionScreen
    │   ├── PaperPlaneAnimation        (transition effect on Next)
    │   ├── MicrophoneButton
    │   └── RecordingIndicator
    └── ResultsView
        ├── ScoreRing                  (SVG circular score display)
        └── FeedbackCard ×3
```

---

### State Machine

`AppContext` drives all navigation. There is no router — screen transitions are pure state changes.

```
                    selectTopic(topic)
  topic-selection ──────────────────────► quiz-session
        ▲                                      │
        │                                      │ advanceQuestion()
        │                              (index 0→1, 1→2, 2→results)
        │                                      │
        │           goBackToTopics()           ▼
        └──────────────────────────────── results
```

State shape:

```ts
AppState {
  screen: 'topic-selection' | 'quiz-session' | 'results'
  selectedTopic: Topic | null
  currentQuestionIndex: 0 | 1 | 2       // never exceeds 2
  transcripts: string[]                  // indexed by question
  scoringResult: ScoringResult | null
}
```

Context actions:

| Action | Effect |
|---|---|
| `selectTopic(topic)` | Sets `selectedTopic`, transitions to `quiz-session` |
| `saveTranscript(index, text)` | Stores transcript at given question index |
| `advanceQuestion()` | Increments index, or transitions to `results` if at index 2 |
| `goBackToTopics()` | Full state reset back to `initialState` |
| `setScoringResult(result)` | Stores the completed `ScoringResult` |

---

### Data Flow: Full Session

```
1. App loads
   └── TopicSelectionScreen renders
       ├── groupTopicsByCategory(topics) → groups by Behavioral/Technical/Leadership
       ├── useScoreStore.allScores → reads localStorage for previous scores
       └── TopicCard renders per topic with optional score badge

2. User selects a topic
   └── selectTopic(topic) → screen: 'quiz-session'

3. Quiz session (repeated 3×)
   ├── QuizSessionScreen renders current question
   ├── User clicks MicrophoneButton
   │   └── useSpeechRecognition.startRecording()
   │       └── window.SpeechRecognition starts
   │           ├── onresult → accumulates finalChunk into transcriptRef
   │           │             → sets interimTranscript for live display
   │           └── onend   → auto-restarts if user hasn't stopped (handles silence)
   ├── User clicks MicrophoneButton again
   │   └── useSpeechRecognition.stopRecording()
   │       └── stoppedByUserRef = true → recognition.stop()
   ├── QuizSessionScreen detects isRecording → false + transcript present
   │   └── saveTranscript(index, transcript) → AppContext.transcripts[index]
   └── User clicks Next / Finish
       ├── PaperPlaneAnimation plays (1.3s)
       └── advanceQuestion() → next question or screen: 'results'

4. Results
   ├── ResultsView mounts
   ├── Waits for all transcripts (max 3s timeout for late arrivals)
   ├── useAnthropicScorer.submit(transcripts, questions)
   │   ├── buildPrompt() → structured prompt with all Q&A pairs
   │   ├── [production]  POST /api/score → Vercel fn → Groq API
   │   ├── [development] POST groq.com directly with VITE_GROQ_API_KEY
   │   ├── extractJSON(response) → validateResult() → computeOverallScore()
   │   └── [on failure]  generateFallbackResult() → local heuristic scoring
   ├── score + feedback set → ScoreRing + FeedbackCards render
   └── useScoreStore.saveScore(topicId, score) → localStorage
       useSessionHistory.saveSession(topic, result) → localStorage (last 50)

5. User clicks "Back to Topics"
   └── goBackToTopics() → full state reset → screen: 'topic-selection'
       └── TopicCard now shows updated score badge
```

---

### Speech Recognition Internals

`useSpeechRecognition` wraps the browser's `SpeechRecognition` API with a few important behaviors:

- `continuous: true` — keeps listening across natural speech pauses
- `interimResults: true` — fires partial results for live display
- Auto-restart on `onend` — the browser stops recognition on silence; the hook restarts it automatically unless the user explicitly stopped (`stoppedByUserRef`)
- Final transcript segments are accumulated in `transcriptRef` and joined with spaces, so pauses don't lose words
- On `permission-denied` or `not-allowed` errors, `stoppedByUserRef` is set to prevent restart loops

```
startRecording()
    │
    ├── clears transcript state
    ├── stoppedByUserRef = false
    └── createAndStart('')
            │
            └── new SpeechRecognition()
                    continuous: true
                    interimResults: true
                    │
                    ├── onresult → accumulate finals, set interim
                    ├── onerror → set error state, stop
                    └── onend   → restart if !stoppedByUser

stopRecording()
    ├── stoppedByUserRef = true
    └── recognition.stop()
            └── onend fires → sees stoppedByUser → setIsRecording(false)
```

---

### Scoring Pipeline Internals

```
submit(transcripts, questions)
    │
    ├── buildPrompt()
    │   └── formats all 3 Q&A pairs into a structured coach prompt
    │       with explicit JSON schema in the instruction
    │
    ├── callGroq(apiKey, prompt)
    │   ├── [prod]  POST /api/score  { prompt }
    │   │           → Vercel fn adds Authorization header, calls Groq
    │   └── [dev]   POST groq.com/openai/v1/chat/completions
    │               model: llama-3.3-70b-versatile
    │               temperature: 0.3
    │               response_format: { type: 'json_object' }
    │
    ├── extractJSON(rawText)
    │   ├── strips markdown code fences if present
    │   ├── JSON.parse()
    │   └── regex fallback: extracts first {...} block if parse fails
    │
    ├── validateResult()
    │   └── clamps all scores to 0–100, fills missing fields with defaults
    │
    ├── computeOverallScore()
    │   └── Math.round(sum(questionScores) / feedback.length)
    │       ← always local, never from AI response
    │
    └── [on any failure] generateFallbackResult()
        └── heuristic scoring based on:
            word count, STAR keywords, first-person language,
            quantitative details, question type detection
```

---

### Persistence Layer

Two independent localStorage stores, both with graceful degradation (try/catch on all reads and writes):

```
localStorage
├── "interview-prep-scores"
│   └── Record<topicId, number>
│       read on: TopicSelectionScreen mount (via useScoreStore.allScores)
│       written on: ResultsView mount (after scoring completes)
│
└── "preptimize-session-history"
    └── SessionRecord[]  (capped at 50 entries)
        read on: HistoryScreen open
        written on: ResultsView mount (alongside score save)
```

---

### Build & Deployment

```
Local dev:
  npm run dev
  └── Vite dev server
      └── Browser calls Groq directly (VITE_GROQ_API_KEY)

Production build:
  npm run build
  └── tsc (type check) + vite build → dist/

Vercel deployment:
  vercel.json
  ├── buildCommand: "npm run build"
  ├── outputDirectory: "dist"
  ├── framework: "vite"
  └── functions:
      └── api/score.ts → Node.js 20.x serverless function
          └── reads GROQ_API_KEY from Vercel env vars
              proxies prompt to Groq, returns { text }
```

### localStorage Keys

| Key | Contents |
|---|---|
| `interview-prep-scores` | `Record<topicId, number>` — best score per topic |
| `preptimize-session-history` | Array of up to 50 past `SessionRecord` objects |

---

## API & Scoring Pipeline

### Local Development

The frontend calls Groq directly:

```
Browser → https://api.groq.com/openai/v1/chat/completions
          Authorization: Bearer VITE_GROQ_API_KEY
```

### Production (Vercel)

The frontend detects production via `window.location.hostname !== 'localhost'` and routes through the serverless proxy:

```
Browser → POST /api/score (Vercel function)
               ↓
          Groq API (key stays server-side)
```

The proxy at `api/score.ts` holds `GROQ_API_KEY` as a Vercel environment variable — never exposed to the client.

### Fallback Scorer

When the Groq API is unavailable (network failure, rate limit, etc.), a local heuristic scorer runs instead. It analyzes:

- Word count
- Presence of STAR-method keywords (situation, task, action, result)
- Use of first-person language
- Quantitative details (numbers, metrics)
- Question type (behavioral / technical / leadership)

The fallback always produces real commentary based on the actual answer — never generic placeholder text.

---

## Data Models

```ts
type Category = 'Behavioral' | 'Technical' | 'Leadership';

interface Topic {
  id: string;
  name: string;
  description: string;
  category: Category;
  questions: string[];  // at least 3
}

interface QuestionFeedback {
  questionIndex: number;
  question: string;
  transcript: string;
  questionScore: number;     // 0–100
  toneScore: number;         // 0–100
  toneAnalysis: string;
  commentary: string;
  improvementTips: string;
}

interface ScoringResult {
  score: number;             // 0–100, computed locally
  feedback: QuestionFeedback[];
}
```

---

## Custom Hooks

### `useSpeechRecognition`

Wraps the browser's `SpeechRecognition` API.

```ts
{
  isRecording: boolean
  transcript: string          // final transcript after stop
  interimTranscript: string   // live text while recording
  startRecording: () => void
  stopRecording: () => void
  error: 'permission-denied' | 'not-supported' | null
  retry: () => void           // re-requests microphone permission
}
```

### `useAnthropicScorer`

Handles the full scoring lifecycle.

```ts
{
  score: number | null
  feedback: QuestionFeedback[] | null
  isLoading: boolean
  error: 'config-error' | 'network-error' | 'api-error' | 'parse-error' | null
  submit: (transcripts: string[], questions: string[]) => void
  retry: () => void
}
```

### `useScoreStore`

Reads and writes best scores to localStorage.

```ts
{
  getScore: (topicId: string) => number | null
  saveScore: (topicId: string, score: number) => void
  allScores: Record<string, number>
}
```

### `useSessionHistory`

Manages a history of up to 50 past sessions.

```ts
{
  history: SessionRecord[]
  saveSession: (topic: Topic, result: ScoringResult) => SessionRecord
  clearHistory: () => void
  getTopicHistory: (topicId: string) => SessionRecord[]
}
```

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Microphone permission denied | Error message + Retry button that re-requests permission |
| Browser doesn't support speech | Error message — no retry, user must switch browsers |
| Groq API failure | Falls back to local heuristic scorer automatically |
| Malformed AI response | JSON extraction with regex fallback; parse error state if unrecoverable |
| Missing API key | `config-error` state surfaced to the user |
| localStorage unavailable | Scores degrade gracefully — app continues to function |

---

## Deployment

### Vercel

1. Push to GitHub and connect the repo to Vercel
2. Set `GROQ_API_KEY` in the Vercel dashboard under Environment Variables
3. Deploy — the `api/score.ts` serverless function is picked up automatically via `vercel.json`

`VITE_GROQ_API_KEY` is only needed locally and should never be set in Vercel.

---

## Testing

```bash
# Run all tests once
npm test

# Watch mode
npm run test:watch
```

The test suite includes:

- **Unit tests** — component rendering, hook behavior, edge cases
- **Property-based tests** — using fast-check with 100+ iterations per property, covering:
  - Topic grouping correctness
  - Score persistence round-trips
  - Quiz session state bounds
  - Scoring result structure validity
  - Session reset on back navigation
- **Integration tests** — full session flow with mocked Speech API and mocked Groq API

---

## Project Structure

```
├── api/
│   └── score.ts              # Vercel serverless proxy for Groq
├── src/
│   ├── components/           # Shared UI components
│   ├── context/              # AppContext — global state
│   ├── data/                 # Static topic data
│   ├── hooks/                # Custom React hooks
│   ├── screens/              # Top-level screen components
│   ├── themes/               # Theme variants
│   ├── types.ts              # Core TypeScript interfaces
│   └── utils/                # Pure utility functions
├── .env.example              # Environment variable template
├── vercel.json               # Vercel deployment config
└── vite.config.ts            # Vite build config
```
