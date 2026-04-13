# Preptimize — Documentation

## What is Preptimize?

Preptimize is a browser-based interview preparation platform. It guides job seekers through structured practice sessions: pick a topic, speak your answers out loud, and receive AI-generated scores and feedback — all without creating an account or leaving the browser.

Two modes are available:

- **Classic Mode** — Practice with curated, expert-crafted questions across 9 topics
- **Tailored Mode** — Upload your CV and optionally a job posting URL; the AI generates personalized questions specific to your background and target role

No account required. Speech recognition runs natively in the browser. Scores are saved locally so progress persists across sessions.

---

## Getting Started

### Prerequisites

- Node.js 18+
- A modern browser (Chrome or Edge recommended — required for Web Speech API)
- A [Groq API key](https://console.groq.com) for AI scoring and question generation
- A [Tavily API key](https://app.tavily.com) for job posting URL extraction (Tailored Mode)

### Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy the env template and fill in your keys
cp .env.example .env
# Edit .env and set:
#   VITE_GROQ_API_KEY=your_groq_key
#   TAVILY_API_KEY=your_tavily_key

# 3. Start the dev server
npm run dev
```

### Environment Variables

| Variable | Where used | Purpose |
|---|---|---|
| `VITE_GROQ_API_KEY` | Browser (dev only) | Direct Groq API calls on localhost |
| `GROQ_API_KEY` | Vercel serverless | Groq API calls in production via `/api/score` and `/api/generate-tailored` |
| `TAVILY_API_KEY` | Vercel serverless | Job posting URL extraction via Tavily in production |

> In production, the frontend never holds any API key. All AI calls are proxied through Vercel serverless functions.

---

## Application Flow

### Classic Mode

```
Topic Selection → Quiz Session (3 questions) → Results View
       ↑                                              |
       └──────────── "Back to Topics" ───────────────┘
```

### Tailored Mode

```
Topic Selection (Tailored toggle)
       ↓
CV Upload Screen
  ├── Upload PDF/TXT CV (required, up to 5MB / 6000 chars)
  └── Job Posting URL (optional — LinkedIn, company careers, etc.)
       ↓
"Start Tailored Session" → Single Groq call generates all 9 questions
       ↓
Topic Grid (cards show "✦ Tailored" or "↓ Classic" badges)
       ↓
Quiz Session (3 tailored questions) → Results View
```

---

### 1. Topic Selection Screen

The landing screen. Topics are grouped into three categories:

- **Behavioral** — Conflict Resolution, Teamwork & Collaboration, Adaptability
- **Technical** — System Design, Debugging & Problem Solving, Code Quality & Best Practices
- **Leadership** — Driving Results, Mentoring & Coaching, Strategic Thinking

A **Classic / Tailored** mode toggle sits in the top-right corner. Switching to Tailored shows the CV upload interface. Switching back to Classic clears all tailored state.

### 2. CV Upload Screen (Tailored Mode only)

- Drag-and-drop or click-to-upload zone for PDF or TXT files (max 5 MB)
- Displays filename and character count after successful parse
- Optional job posting URL field — fetched server-side via Tavily (handles LinkedIn, JS-rendered pages, company career sites)
- "Start Tailored Session" CTA — disabled until CV is parsed
- Generates all 9 tailored questions in a single Groq API call
- Auto-retries once on 429 rate limit errors

### 3. Quiz Session Screen

After selecting a topic, you answer 3 questions one at a time by speaking into your microphone.

- Click the microphone button to start recording
- An animated pulse indicator shows when recording is active
- Live transcript appears on screen as you speak
- Click the microphone button again to stop and save your answer
- The "Next" button activates once a transcript is saved
- On the final question, "Next" becomes "Finish" and navigates to results

### 4. Results View

After completing all 3 questions, your answers are sent to the AI scorer. While scoring is in progress, a loading spinner is shown.

Once complete, you see:
- An overall score (0–100) displayed in a circular score ring
- Per-question feedback cards, each showing:
  - The question text and your transcript
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

Always computed locally — never trusted from the AI response:

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
| PDF Parsing | pdfjs-dist (client-side) |
| Job URL Extraction | Tavily API (server-side) |
| AI Scoring | Groq API — `llama-3.3-70b-versatile` |
| AI Question Generation | Groq API — `llama-3.3-70b-versatile` |
| State | React Context + useState |
| Persistence | localStorage |
| Deployment | Vercel (SPA + serverless functions) |
| Testing | Vitest + @testing-library/react + fast-check |

---

### High-Level System Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                            Browser (SPA)                             │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                          App.tsx                              │  │
│  └──────────────────────────┬────────────────────────────────────┘  │
│                             │                                        │
│              ┌──────────────▼──────────────┐                        │
│              │         AppProvider          │  Global state          │
│              │   + TailoredModeProvider     │  (screen, topic, etc.) │
│              └──────────────┬──────────────┘                        │
│                             │ screen switch                          │
│          ┌──────────────────┼──────────────────┐                    │
│          ▼                  ▼                  ▼                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │    Topic     │  │     Quiz     │  │   Results    │              │
│  │  Selection   │  │   Session    │  │    View      │              │
│  │   Screen     │  │   Screen     │  │              │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                  │                       │
│  ┌──────▼──────┐          │                  │                       │
│  │ CVUpload    │          │                  │                       │
│  │ Screen      │          │                  │                       │
│  │ (Tailored)  │          │                  │                       │
│  └──────┬──────┘          │                  │                       │
│         │                 │                  │                       │
│  ┌──────▼─────────────────▼──────────────────▼──────┐               │
│  │                     Hooks Layer                   │               │
│  │  useSpeechRecognition  │  useScoreStore           │               │
│  │  useAnthropicScorer    │  useSessionHistory       │               │
│  │  useCVParser           │  useTailoredQuestions    │               │
│  │  useTopicMastery       │  useQuestionGenerator    │               │
│  └──────────────┬─────────────────┬─────────────────┘               │
│                 │                 │                                  │
│          Web Speech API      localStorage                            │
│          pdfjs-dist                                                  │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
        ▼                    ▼
┌──────────────┐    ┌──────────────────┐
│ /api/score   │    │ /api/generate-   │
│ (Vercel fn)  │    │ tailored         │
│ AI Scoring   │    │ (Vercel fn)      │
└──────┬───────┘    │ Question Gen     │
       │            └────────┬─────────┘
       │                     │
       └──────────┬──────────┘
                  ▼
        ┌──────────────────┐
        │    Groq API      │
        │ llama-3.3-70b    │
        └──────────────────┘

        ┌──────────────────┐
        │ /api/fetch-job-  │
        │ posting          │
        │ (Vercel fn)      │
        └────────┬─────────┘
                 ▼
        ┌──────────────────┐
        │   Tavily API     │
        │ (URL extraction) │
        └──────────────────┘
```

---

### Component Tree

```
App
└── AppProvider                          (global state — screen, topic, transcripts)
    └── TailoredModeProvider             (tailored state — mode, cvText, questions)
        ├── TopicSelectionScreen
        │   ├── CVUploadScreen           (Tailored Mode only)
        │   ├── HistoryScreen            (toggled via local state)
        │   └── TopicCard ×9
        ├── QuizSessionScreen
        │   ├── MicrophoneButton
        │   └── RecordingIndicator
        └── ResultsView
            ├── ScoreRing
            └── FeedbackCard ×3
```

---

### State Machine

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

---

### Tailored Mode Data Flow

```
1. User clicks "Tailored" toggle
   └── TailoredModeContext.mode = 'tailored'
       └── CVUploadScreen renders

2. User uploads CV (PDF or TXT)
   └── useCVParser
       ├── Validates MIME type + file size (≤5MB)
       ├── PDF → pdfjs-dist extracts text (client-side)
       ├── TXT → FileReader reads UTF-8
       └── Stores up to 6000 chars in TailoredModeContext.cvText

3. User pastes job posting URL (optional)
   └── POST /api/fetch-job-posting { url }
       └── Tavily API extracts clean text from any URL
           (handles LinkedIn, JS-rendered pages, company sites)
           └── Stores up to 4000 chars in TailoredModeContext.jobPostingText

4. User clicks "Start Tailored Session"
   └── useTailoredQuestions.generate(cvText, jobPostingText)
       ├── Sets all 9 topics to status: 'loading'
       ├── POST /api/generate-tailored { cvText, jobText, topics[9] }
       │   └── Single Groq call — generates all 9 questions at once
       │       (avoids rate limit issues from multiple parallel calls)
       │   └── Auto-retries once on 429 with retry-after delay
       └── Parses response → sets each topic to status: 'ready' or 'fallback'

5. Topic grid renders
   ├── 'ready' → "✦ Tailored" badge, uses generated questions
   ├── 'fallback' → "↓ Classic" badge, uses static questions
   └── 'loading' → pulsing skeleton overlay, non-interactive

6. User selects a topic
   └── If status === 'ready': uses generated questions
       If status === 'fallback': uses static questions
```

---

### Serverless Functions

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/score` | POST | Proxies scoring prompts to Groq. Holds `GROQ_API_KEY` server-side. |
| `/api/generate-tailored` | POST | Generates all 9 tailored questions in a single Groq call. |
| `/api/fetch-job-posting` | POST | Extracts clean text from any job posting URL via Tavily API. |

All functions use CommonJS (`api/package.json` sets `"type": "commonjs"`) to avoid ESM/CJS conflicts with Vercel's Node.js runtime.

---

### Scoring Pipeline

```
submit(transcripts, questions)
    │
    ├── buildPrompt() → structured prompt with all 3 Q&A pairs
    │
    ├── [production]  POST /api/score { prompt }
    │   [development] POST groq.com directly (VITE_GROQ_API_KEY)
    │
    ├── extractJSON() → validateResult() → computeOverallScore()
    │   └── overall score always computed locally
    │
    └── [on failure] generateFallbackResult()
        └── heuristic scoring: word count, STAR keywords,
            first-person language, quantitative details
```

---

### Persistence Layer

```
localStorage
├── "interview-prep-scores"
│   └── Record<topicId, number>  — best score per topic
│
└── "preptimize-session-history"
    └── SessionRecord[]  (capped at 50 entries)
```

Tailored Mode state is **in-memory only** (React Context). It is never persisted to localStorage and resets on page refresh.

---

## Data Models

```ts
type Category = 'Behavioral' | 'Technical' | 'Leadership';

interface Topic {
  id: string;
  name: string;
  description: string;
  category: Category;
  questions: string[];
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

// Tailored Mode
type TailoredMode = 'classic' | 'tailored';
type TailoredQuestionStatus = 'loading' | 'ready' | 'fallback';

interface TailoredTopicEntry {
  questions: string[];       // always exactly 3
  status: TailoredQuestionStatus;
}

type TailoredQuestionMap = Record<string, TailoredTopicEntry>;
```

---

## Custom Hooks

### `useSpeechRecognition`
Wraps the browser's `SpeechRecognition` API with auto-restart, interim results, and permission error handling.

### `useAnthropicScorer`
Full scoring lifecycle — calls `/api/score` in production, Groq directly in dev, falls back to local heuristic scorer on failure.

### `useCVParser`
Client-side PDF/TXT parsing via pdfjs-dist. Validates MIME type and file size. Returns up to 6000 chars of extracted text.

### `useTailoredQuestions`
Sends a single POST to `/api/generate-tailored` with CV text, job text, and all 9 topic definitions. Handles 429 retry, JSON parsing, and per-topic fallback.

### `useScoreStore`
Reads/writes best scores to localStorage.

### `useSessionHistory`
Manages up to 50 past session records in localStorage.

### `useTopicMastery`
Tracks mastered topics (score ≥ 92) and advanced question generation.

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Microphone permission denied | Error message + Retry button |
| Browser doesn't support speech | Error message — user must switch browsers |
| Groq API failure (scoring) | Falls back to local heuristic scorer |
| Groq API 429 (tailored generation) | Auto-retries once after rate limit window |
| Groq API failure (tailored generation) | All topics fall back to static questions |
| Malformed AI response | JSON extraction with regex fallback |
| CV file too large (>5MB) | Inline error, file rejected |
| Unsupported CV file type | Inline error, file rejected |
| Job URL unreachable / blocked | Inline warning, user can proceed without job context |
| localStorage unavailable | Scores degrade gracefully |

---

## Build & Deployment

```
Local dev:
  npm run dev
  └── Vite dev server
      ├── Browser calls Groq directly (VITE_GROQ_API_KEY)
      └── Tavily calls go through /api/fetch-job-posting (needs TAVILY_API_KEY)

Production build:
  npm run build
  └── tsc + vite build → dist/

Vercel deployment:
  vercel.json
  ├── buildCommand: "npm run build"
  ├── outputDirectory: "dist"
  └── Serverless functions: api/score.ts, api/generate-tailored.ts, api/fetch-job-posting.ts

Required Vercel environment variables:
  GROQ_API_KEY     — Groq API key (server-side only)
  TAVILY_API_KEY   — Tavily API key (server-side only)
```

---

## Testing

```bash
npm test          # run all tests once
npm run test:watch  # watch mode
```

Test suite includes unit tests, property-based tests (fast-check, 100+ iterations), and integration tests.

---

## Project Structure

```
├── api/
│   ├── score.ts                  # Vercel fn — AI scoring proxy
│   ├── generate-tailored.ts      # Vercel fn — tailored question generation
│   ├── fetch-job-posting.ts      # Vercel fn — Tavily job URL extraction
│   ├── package.json              # { "type": "commonjs" } — CJS override
│   └── tsconfig.json
├── src/
│   ├── components/               # TopicCard, MicrophoneButton, etc.
│   ├── context/
│   │   ├── AppContext.tsx         # Global app state
│   │   └── TailoredModeContext.tsx # Tailored mode state
│   ├── data/                     # Static topic definitions
│   ├── hooks/
│   │   ├── useAnthropicScorer.ts
│   │   ├── useCVParser.ts
│   │   ├── useTailoredQuestions.ts
│   │   ├── useSpeechRecognition.ts
│   │   ├── useScoreStore.ts
│   │   ├── useSessionHistory.ts
│   │   ├── useTopicMastery.ts
│   │   └── useQuestionGenerator.ts
│   ├── screens/
│   │   ├── TopicSelectionScreen.tsx
│   │   ├── CVUploadScreen.tsx
│   │   ├── QuizSessionScreen.tsx
│   │   ├── ResultsView.tsx
│   │   └── HistoryScreen.tsx
│   ├── types.ts
│   └── utils/
├── .env.example
├── vercel.json
└── vite.config.ts
```

---

## Version History

| Version | Description |
|---|---|
| v1.0-baseline | Classic Mode — AI scoring, speech recognition, mastery system, session history |
| v1.1 | Tailored Mode — CV upload (pdfjs-dist), job URL extraction (Tavily), single-call question generation (Groq), 429 retry logic |
