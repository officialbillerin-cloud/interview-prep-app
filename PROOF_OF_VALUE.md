# Preptimize — Proof of Value

## The Problem

Job interviews are high-stakes, time-pressured, and deeply personal — yet most candidates prepare with generic question lists that have nothing to do with their actual background or the specific role they're applying for.

The result: candidates walk in underprepared, give vague answers, and lose opportunities they were qualified for.

---

## The Solution

**Preptimize** is an AI-powered interview preparation platform that turns your CV and target job into a personalized practice session — in under 60 seconds.

Upload your CV. Paste a job posting. Speak your answers out loud. Get scored, analyzed, and coached — instantly.

---

## Core Value Propositions

### 1. Personalized to You — Not Generic

Most interview prep tools give everyone the same questions. Preptimize reads your actual CV and the specific job you're applying for, then generates questions that reflect your background, your skills, and the role's requirements.

A software engineer applying to a fintech startup gets different questions than a product manager applying to a healthcare company — even for the same topic category.

### 2. Practice by Speaking, Not Typing

Interviews happen out loud. Preptimize uses your browser's built-in speech recognition to capture your spoken answers in real time — no typing, no shortcuts. You practice the way you'll actually perform.

### 3. AI Feedback That Actually Helps

After each session, Groq's `llama-3.3-70b-versatile` model evaluates your answers across two dimensions:

- **Content quality** — structure, specificity, relevance, use of STAR method
- **Tone appropriateness** — behavioral answers need accountability; technical answers need precision; leadership answers need strategic authority

You get a score, a commentary on what worked, a tone analysis, and specific improvement tips — not generic praise.

### 4. Zero Friction

- No account required
- No app to download
- Works in any modern browser
- Your scores and history are saved locally — private by default
- Free to use

### 5. Covers the Full Interview Landscape

9 topics across 3 categories that map to how real interviews are structured:

| Category | Topics |
|---|---|
| Behavioral | Conflict Resolution, Teamwork & Collaboration, Adaptability |
| Technical | System Design, Debugging & Problem Solving, Code Quality & Best Practices |
| Leadership | Driving Results, Mentoring & Coaching, Strategic Thinking |

---

## Key Features

### Classic Mode
- 9 curated topic cards with expert-crafted questions
- Speak your answers, get AI-scored feedback
- Track your best score per topic
- Mastery system — score 92+ to unlock harder questions
- Full session history

### Tailored Mode *(v1.1)*
- Upload your CV (PDF or TXT, up to 5MB)
- Optionally paste any job posting URL — LinkedIn, company careers pages, any site
- AI reads your profile and the role, generates 9 personalized questions
- One single AI call — fast, reliable, rate-limit safe
- Graceful fallback to classic questions if generation fails

---

## Technical Differentiators

| Feature | How it works |
|---|---|
| CV parsing | Client-side via pdfjs-dist — your CV never leaves your browser |
| Job URL extraction | Server-side via Tavily API — handles JavaScript-rendered pages, LinkedIn, any site |
| Question generation | Single Groq API call for all 9 questions — avoids rate limits, fast response |
| AI scoring | Groq `llama-3.3-70b-versatile` with structured JSON output |
| API key security | All AI calls proxied through Vercel serverless functions — keys never exposed to client |
| Fallback scoring | Local heuristic scorer activates if AI is unavailable — app always works |
| Privacy | No backend database, no user accounts, no data collection |

---

## User Journey (Demo Script)

**Scene 1 — The Problem**
> "You've got a big interview coming up. You've read the job description. You know your CV. But when you try to practice, you're stuck with the same generic questions everyone else uses."

**Scene 2 — Classic Mode**
> "Open Preptimize. Pick a topic — say, System Design. Click the mic. Answer out loud. Get your score, your feedback, your improvement tips. Repeat until you're ready."

**Scene 3 — Tailored Mode**
> "Now switch to Tailored Mode. Upload your CV. Paste the LinkedIn job posting. Hit Start. In about 15 seconds, every topic card has questions written specifically for you — your background, their role."

**Scene 4 — The Result**
> "You walk into that interview having practiced the exact questions you're likely to face. You know your score. You know your weak spots. You've already improved."

**Scene 5 — The Pitch**
> "Preptimize. Practice smarter. Interview better."

---

## Metrics & Proof Points

- **9 topics** covering the full behavioral, technical, and leadership interview landscape
- **2 scoring dimensions** per answer — content quality and tone appropriateness
- **0 accounts required** — zero friction to start
- **< 60 seconds** from landing page to first tailored question set
- **100% private** — no data leaves the browser except to the AI APIs
- **Fallback scoring** — works even when AI is unavailable
- **Mastery system** — tracks progress and unlocks harder questions at 92+ score

---

## Target Audience

- **Job seekers** preparing for interviews at any level
- **Career changers** entering a new field who need to practice unfamiliar question types
- **Recent graduates** who lack interview experience
- **Professionals** preparing for senior or leadership roles
- **Bootcamp graduates** and self-taught developers preparing for technical interviews

---

## Competitive Landscape

| Platform | Personalized to CV | Spoken answers | AI feedback | Free | No account |
|---|---|---|---|---|---|
| **Preptimize** | ✅ | ✅ | ✅ | ✅ | ✅ |
| Interviewing.io | ❌ | ✅ | Partial | ❌ | ❌ |
| Pramp | ❌ | ✅ | Human | ✅ | ❌ |
| ChatGPT (manual) | Manual | ❌ | ✅ | Partial | ❌ |
| Generic question lists | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## Version Roadmap

| Version | Status | Description |
|---|---|---|
| v1.0 | ✅ Live | Classic Mode — AI scoring, speech, mastery, history |
| v1.1 | ✅ Live | Tailored Mode — CV upload, job URL, personalized questions |
| v1.2 | Planned | Multi-round sessions, difficulty progression |
| v1.3 | Planned | Export feedback as PDF, share results |
| v2.0 | Planned | Team/recruiter mode, candidate benchmarking |
