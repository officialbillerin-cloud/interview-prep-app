# Requirements Document

## Introduction

A single-page React + TypeScript interview preparation application for job seekers. The app guides users through three screens: topic selection, a voice-recorded quiz session, and an AI-scored results view. Audio responses are transcribed via the Web Speech API and scored by Claude (Anthropic API). Scores are persisted in localStorage so users can track progress across sessions.

## Glossary

- **App**: The single-page interview preparation application.
- **Topic**: A named interview subject (e.g., "Conflict Resolution") belonging to one of three categories: Behavioral, Technical, or Leadership.
- **Topic_Card**: A UI card displaying a Topic's name, description, question count, and previous score.
- **Category**: A grouping of Topics — one of: Behavioral, Technical, or Leadership.
- **Quiz_Session**: A sequence of exactly 3 questions drawn from a selected Topic.
- **Question**: A single interview prompt presented to the user during a Quiz_Session.
- **Recording**: An audio capture of the user's spoken answer to a Question, initiated and stopped via the Microphone_Button.
- **Microphone_Button**: The UI control that starts and stops a Recording.
- **Recording_Indicator**: An animated pulse element visible while a Recording is in progress.
- **Transcript**: The text produced by the Web_Speech_API from a completed Recording.
- **Web_Speech_API**: The browser's built-in SpeechRecognition interface used for audio transcription.
- **AI_Scorer**: The Anthropic Claude API endpoint used to generate scores and feedback from Transcripts.
- **Score**: A numeric value from 0 to 10 representing the quality of a user's Quiz_Session responses.
- **Feedback**: Per-question textual commentary and improvement tips returned by the AI_Scorer.
- **Results_View**: The screen displayed after all 3 questions are answered, showing the Score and Feedback.
- **Score_Store**: The localStorage mechanism keyed by Topic ID used to persist Scores between sessions.
- **App_State**: The global React Context that manages navigation between screens and shared session data.

---

## Requirements

### Requirement 1: Topic Selection Screen

**User Story:** As a job seeker, I want to browse interview topics organized by category, so that I can choose a relevant subject to practice.

#### Acceptance Criteria

1. THE App SHALL display a Topic Selection screen as the default screen on load.
2. THE App SHALL render Topics grouped under the three Category headings: Behavioral, Technical, and Leadership.
3. THE App SHALL display each Topic as a Topic_Card containing the topic name, a short description, and the number of available questions.
4. WHEN a user has a previously saved Score for a Topic, THE Topic_Card SHALL display that Score alongside the other topic details.
5. WHEN a user has no previously saved Score for a Topic, THE Topic_Card SHALL display no score indicator.
6. WHEN a user selects a Topic_Card, THE App SHALL navigate to the Quiz_Session screen for that Topic.

---

### Requirement 2: Quiz Session Screen

**User Story:** As a job seeker, I want to answer interview questions by speaking my responses, so that I can practice realistic verbal communication.

#### Acceptance Criteria

1. WHEN a Quiz_Session begins, THE App SHALL display the first Question of the selected Topic.
2. THE Quiz_Session SHALL present exactly 3 Questions per session, one at a time.
3. THE App SHALL display a Microphone_Button on the Question screen.
4. WHEN the user clicks the Microphone_Button while no Recording is active, THE App SHALL start a Recording using the Web_Speech_API.
5. WHEN a Recording is active, THE App SHALL display the Recording_Indicator as an animated pulse.
6. WHEN the user clicks the Microphone_Button while a Recording is active, THE App SHALL stop the Recording and save the resulting Transcript.
7. WHEN a Transcript has been saved for the current Question, THE App SHALL enable the Next_Question button.
8. WHEN the Next_Question button is activated on a question that is not the last, THE App SHALL advance to the next Question.
9. WHEN the Next_Question button is activated on the last Question, THE App SHALL navigate to the Results_View.
10. WHILE a Recording is active, THE App SHALL display the live interim Transcript text to the user.

---

### Requirement 3: Microphone Permission Handling

**User Story:** As a job seeker, I want clear feedback when microphone access is unavailable, so that I can resolve the issue and continue practicing.

#### Acceptance Criteria

1. IF the browser denies microphone permission, THEN THE App SHALL display an error message explaining that microphone access is required.
2. IF the browser denies microphone permission, THEN THE App SHALL display a Retry button that re-requests microphone permission when activated.
3. IF the Web_Speech_API is not supported by the browser, THEN THE App SHALL display an error message indicating that the browser does not support speech recognition.

---

### Requirement 4: AI Scoring and Feedback

**User Story:** As a job seeker, I want AI-generated scores and feedback on my answers, so that I can understand my performance and improve.

#### Acceptance Criteria

1. WHEN the user completes all 3 Questions in a Quiz_Session, THE App SHALL send all 3 Transcripts to the AI_Scorer via the Anthropic Claude API.
2. THE AI_Scorer SHALL return a single overall Score between 0 and 10 for the Quiz_Session.
3. THE AI_Scorer SHALL return per-question Feedback containing commentary and improvement tips for each of the 3 answers.
4. WHILE the AI_Scorer request is in progress, THE App SHALL display a loading indicator on the Results_View.
5. IF the AI_Scorer request fails, THEN THE App SHALL display an error message and a Retry button that re-submits the Transcripts.
6. THE App SHALL read the Anthropic API key exclusively from the `VITE_ANTHROPIC_API_KEY` environment variable.

---

### Requirement 5: Results View

**User Story:** As a job seeker, I want to review my overall score and per-question feedback after a session, so that I can learn from my performance.

#### Acceptance Criteria

1. THE Results_View SHALL display the overall Score (0–10) prominently.
2. THE Results_View SHALL display per-question Feedback for each of the 3 Questions, including commentary and improvement tips.
3. THE Results_View SHALL display the Question text alongside its corresponding Feedback.
4. WHEN the Results_View is displayed, THE App SHALL save the Score to the Score_Store keyed by the Topic ID.
5. WHEN the user activates the "Back to Topics" control on the Results_View, THE App SHALL navigate back to the Topic Selection screen.

---

### Requirement 6: Score Persistence

**User Story:** As a job seeker, I want my previous scores saved locally, so that I can track my improvement over time without needing an account.

#### Acceptance Criteria

1. THE Score_Store SHALL persist Scores in localStorage under a key derived from the Topic ID.
2. WHEN the App loads, THE App SHALL read all previously saved Scores from the Score_Store and reflect them on the corresponding Topic_Cards.
3. WHEN a new Score is saved for a Topic that already has a stored Score, THE Score_Store SHALL replace the previous Score with the new Score.

---

### Requirement 7: Application State Management

**User Story:** As a job seeker, I want seamless navigation between screens, so that the app feels cohesive and my session data is not lost mid-flow.

#### Acceptance Criteria

1. THE App SHALL manage screen navigation and session data through a single React Context (App_State).
2. THE App_State SHALL track the current screen, the selected Topic, the current Question index, and the collected Transcripts.
3. WHEN the user navigates back to the Topic Selection screen, THE App_State SHALL reset the Quiz_Session data.
