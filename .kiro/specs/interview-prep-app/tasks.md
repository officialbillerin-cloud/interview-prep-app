# Implementation Plan: Interview Prep App

## Overview

Build a single-page React + TypeScript app with Vite and Tailwind CSS. Implementation proceeds in layers: project scaffold → data models and state → topic selection UI → quiz session UI with speech → AI scoring and results → score persistence → wiring and integration.

## Tasks

- [x] 1. Scaffold project and define core types
  - Initialize Vite + React + TypeScript project with Tailwind CSS configured
  - Create `src/types.ts` with all data model interfaces: `Topic`, `Category`, `QuestionFeedback`, `ScoringResult`, `Screen`, `AppState`
  - Add seed topic data in `src/data/topics.ts` with at least 3 topics per category (Behavioral, Technical, Leadership), each with at least 3 questions
  - Configure `VITE_ANTHROPIC_API_KEY` in `.env.example`
  - _Requirements: 1.2, 2.2, 4.6, 7.1, 7.2_

- [x] 2. Implement AppContext and state management
  - [x] 2.1 Create `src/context/AppContext.tsx` with `AppProvider` and `useAppContext` hook
    - Initial state: `screen: 'topic-selection'`, `selectedTopic: null`, `currentQuestionIndex: 0`, `transcripts: []`, `scoringResult: null`
    - Implement `selectTopic(topic)` → transitions to `quiz-session`
    - Implement `saveTranscript(index, text)` → stores transcript at given index
    - Implement `advanceQuestion()` → increments `currentQuestionIndex` (max 2), transitions to `results` when called on index 2
    - Implement `goBackToTopics()` → resets session data and transitions to `topic-selection`
    - Implement `setScoringResult(result)` → stores scoring result
    - _Requirements: 7.1, 7.2, 7.3, 2.2, 2.8, 2.9_

  - [ ]* 2.2 Write unit tests for AppContext
    - Test initial state is `topic-selection` screen
    - Test `selectTopic` transitions to `quiz-session`
    - Test `advanceQuestion` from index 0 → 1, index 1 → 2, index 2 → `results`
    - Test `goBackToTopics` resets `selectedTopic`, `currentQuestionIndex`, `transcripts`
    - _Requirements: 7.1, 7.2, 7.3, 2.2, 2.8_

  - [x] 2.3 Write property test for quiz session question bounds (Property 4)
    - **Property 4: Quiz session never exceeds 3 questions**
    - **Validates: Requirements 2.2, 2.8**
    - Use fast-check to generate random sequences of advance actions and assert `currentQuestionIndex` never exceeds 2
    - Tag: `// Feature: interview-prep-app, Property 4: Quiz session never exceeds 3 questions`

  - [x] 2.4 Write property test for session state reset (Property 11)
    - **Property 11: Session state resets on back navigation**
    - **Validates: Requirements 7.3**
    - Use fast-check to generate random in-progress session states and assert `goBackToTopics` always resets index, transcripts, and selectedTopic
    - Tag: `// Feature: interview-prep-app, Property 11: Session state resets on back navigation`

- [x] 3. Implement useScoreStore hook
  - [x] 3.1 Create `src/hooks/useScoreStore.ts`
    - Read/write `localStorage` key `"interview-prep-scores"` as `Record<string, number>`
    - Implement `getScore(topicId)` → returns number or null
    - Implement `saveScore(topicId, score)` → overwrites existing score for that topic
    - Expose `allScores` as reactive state
    - Wrap all localStorage calls in try/catch for graceful degradation
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 3.2 Write unit tests for useScoreStore
    - Test returns null for unknown topic
    - Test overwrites existing score
    - Test graceful degradation when localStorage throws
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 3.3 Write property test for score persistence round-trip (Property 10)
    - **Property 10: Score persistence round-trip**
    - **Validates: Requirements 5.4, 6.1, 6.2, 6.3**
    - Use fast-check to generate random topic IDs and score values; assert `saveScore` then `getScore` returns the same value and overwrites previous
    - Tag: `// Feature: interview-prep-app, Property 10: Score persistence round-trip`

- [x] 4. Implement Topic Selection screen
  - [x] 4.1 Create `src/utils/groupTopicsByCategory.ts` pure function
    - Groups a `Topic[]` into `Record<Category, Topic[]>`
    - _Requirements: 1.2_

  - [ ]* 4.2 Write property test for topic grouping correctness (Property 1)
    - **Property 1: Topic grouping correctness**
    - **Validates: Requirements 1.2**
    - Use fast-check to generate random topic arrays with mixed categories; assert every topic appears in exactly one group under its declared category
    - Tag: `// Feature: interview-prep-app, Property 1: Topic grouping correctness`

  - [x] 4.3 Create `src/components/TopicCard.tsx`
    - Renders topic name, description, question count, and optional previous score
    - Accepts `topic: Topic`, `score: number | null`, `onSelect: () => void`
    - _Requirements: 1.3, 1.4, 1.5_

  - [ ]* 4.4 Write property test for TopicCard renders all required fields (Property 2)
    - **Property 2: TopicCard renders all required fields**
    - **Validates: Requirements 1.3**
    - Use fast-check to generate random Topic objects; assert rendered output contains name, description, and question count
    - Tag: `// Feature: interview-prep-app, Property 2: TopicCard renders all required fields`

  - [x] 4.5 Write property test for TopicCard score display (Property 3)
    - **Property 3: TopicCard score display matches stored score**
    - **Validates: Requirements 1.4, 1.5**
    - Use fast-check to generate random topics with/without scores; assert score indicator present iff score is non-null
    - Tag: `// Feature: interview-prep-app, Property 3: TopicCard score display matches stored score`

  - [x] 4.6 Create `src/screens/TopicSelectionScreen.tsx`
    - Uses `groupTopicsByCategory` to render topics under category headings
    - Reads `allScores` from `useScoreStore` via context
    - Calls `selectTopic(topic)` on card click
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement speech recognition hook and quiz UI components
  - [x] 6.1 Create `src/hooks/useSpeechRecognition.ts`
    - Wraps `window.SpeechRecognition` / `window.webkitSpeechRecognition`
    - Returns `isRecording`, `transcript`, `interimTranscript`, `startRecording`, `stopRecording`, `error`, `retry`
    - Sets `error: 'not-supported'` when API unavailable; `error: 'permission-denied'` on permission denial
    - `retry()` re-invokes `getUserMedia` to re-request permission
    - _Requirements: 2.4, 2.5, 2.6, 2.10, 3.1, 3.2, 3.3_

  - [x] 6.2 Write unit tests for useSpeechRecognition
    - Test `not-supported` error state when API absent
    - Test `permission-denied` error state
    - Test transcript saved on stop
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 6.3 Create `src/components/MicrophoneButton.tsx`
    - Toggles recording; visually distinct when active
    - Accepts `isRecording: boolean`, `onToggle: () => void`
    - _Requirements: 2.3, 2.4, 2.6_

  - [x] 6.4 Create `src/components/RecordingIndicator.tsx`
    - Animated pulse shown while `isRecording` is true
    - _Requirements: 2.5_

  - [x] 6.5 Create `src/screens/QuizSessionScreen.tsx`
    - Displays current question from `selectedTopic.questions[currentQuestionIndex]`
    - Hosts `MicrophoneButton` and `RecordingIndicator`
    - Shows live `interimTranscript` while recording
    - Next/Finish button enabled only when transcript exists for current question
    - Calls `saveTranscript` on stop, `advanceQuestion` on Next/Finish
    - Shows permission-denied error + Retry button; shows not-supported error message
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 3.1, 3.2, 3.3_

  - [x] 6.6 Write unit tests for QuizSessionScreen
    - Test Next button disabled without transcript; enabled with transcript
    - Test interim transcript displayed while recording
    - _Requirements: 2.7, 2.10_

  - [x] 6.7 Write property test for Next button enabled iff transcript exists (Property 5)
    - **Property 5: Next button enabled iff transcript exists**
    - **Validates: Requirements 2.7**
    - Use fast-check to generate random transcript strings (empty vs non-empty); assert button enabled state matches transcript presence
    - Tag: `// Feature: interview-prep-app, Property 5: Next button enabled iff transcript exists`

  - [x] 6.8 Write property test for interim transcript display (Property 6)
    - **Property 6: Interim transcript is displayed while recording**
    - **Validates: Requirements 2.10**
    - Use fast-check to generate random interim transcript strings; assert each is visible in rendered QuizSessionScreen while recording is active
    - Tag: `// Feature: interview-prep-app, Property 6: Interim transcript is displayed while recording`

- [x] 7. Implement AI scoring hook and results UI
  - [x] 7.1 Create `src/utils/parseScoringResponse.ts`
    - Parses Claude's text output into `ScoringResult`
    - Returns error state for malformed JSON or structurally invalid responses
    - _Requirements: 4.2, 4.3_

  - [x] 7.2 Write property test for parsed scoring result validity (Property 8)
    - **Property 8: Parsed scoring result is structurally valid**
    - **Validates: Requirements 4.2, 4.3**
    - Use fast-check to generate random well-formed Claude response shapes; assert parsed result has `0 ≤ score ≤ 10` and feedback array of exactly 3 items with non-empty commentary and improvementTips
    - Tag: `// Feature: interview-prep-app, Property 8: Parsed scoring result is structurally valid`

  - [x] 7.3 Create `src/hooks/useAnthropicScorer.ts`
    - Reads API key from `import.meta.env.VITE_ANTHROPIC_API_KEY`; surfaces config error if missing
    - `submit(transcripts, questions)` sends structured prompt to Claude API
    - Returns `score`, `feedback`, `isLoading`, `error`, `retry`
    - `retry()` re-submits the same transcripts
    - Handles network failures, non-2xx responses, and malformed JSON
    - _Requirements: 4.1, 4.4, 4.5, 4.6_

  - [ ]* 7.4 Write unit tests for useAnthropicScorer
    - Test loading state while request in flight
    - Test error state on API failure
    - Test retry re-submits transcripts
    - Test config error when API key missing
    - _Requirements: 4.4, 4.5, 4.6_

  - [ ]* 7.5 Write property test for all 3 transcripts included in scoring request (Property 7)
    - **Property 7: All 3 transcripts included in scoring request**
    - **Validates: Requirements 4.1**
    - Use fast-check to generate random transcript content; assert the request payload always includes all 3 transcripts without omission or modification
    - Tag: `// Feature: interview-prep-app, Property 7: All 3 transcripts included in scoring request`

  - [x] 7.6 Create `src/components/FeedbackCard.tsx`
    - Displays question text, commentary, and improvement tips
    - _Requirements: 5.2, 5.3_

  - [x] 7.7 Create `src/screens/ResultsView.tsx`
    - Displays overall score prominently
    - Renders a `FeedbackCard` per question
    - Shows loading indicator while `isLoading`
    - Shows error message + Retry button on failure
    - Calls `saveScore` on mount via `useScoreStore`
    - "Back to Topics" calls `goBackToTopics()`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 7.8 Write unit tests for ResultsView
    - Test loading indicator shown while scoring
    - Test error + retry shown on failure
    - _Requirements: 4.4, 4.5_

  - [x] 7.9 Write property test for ResultsView renders complete scoring data (Property 9)
    - **Property 9: Results_View renders complete scoring data**
    - **Validates: Requirements 5.1, 5.2, 5.3**
    - Use fast-check to generate random ScoringResult objects; assert overall score is rendered prominently and each question's text, commentary, and improvement tips appear together
    - Tag: `// Feature: interview-prep-app, Property 9: Results_View renders complete scoring data`

- [x] 8. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Wire everything together
  - [x] 9.1 Create `src/App.tsx` rendering `AppProvider` and switching on `screen` to render the correct screen component
    - _Requirements: 7.1_

  - [x] 9.2 Create `src/main.tsx` entry point mounting `App` into the DOM
    - _Requirements: 1.1_

  - [x] 9.3 Write integration test for full session flow
    - Mock Web Speech API and Anthropic API
    - Flow: select topic → answer 3 questions → view results → verify score persisted → return to topics → verify score shown on TopicCard
    - _Requirements: 1.4, 2.1, 2.9, 4.1, 5.4, 6.2_

- [x] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check with a minimum of 100 iterations per property
- Unit tests and property tests are complementary — both should be present for full coverage
