---
inclusion: always
---

# Scoring System Rules

## Scale
All scores use 0-100. Never use 0-10.

## Overall Score Calculation
The overall score MUST always be computed locally as:
```
Math.round(sum(questionScores) / feedback.length)
```
Never trust the AI-provided overall score. Always recalculate it from the individual question scores.

## Per-Question Dimensions
Each question has two scores:
- `questionScore` (0-100): Content quality, structure, relevance
- `toneScore` (0-100): Tone appropriateness for the question category

## Tone Rubric by Category
- Behavioral: reflective, accountable, collaborative
- Technical: precise, confident, analytical  
- Leadership: authoritative yet humble, strategic

## Score Ranges
- 90-100: Exceptional
- 70-89: Good
- 50-69: Average
- 30-49: Weak
- 0-29: Very poor

## Fallback Scorer
When the AI API fails, always use the local heuristic fallback in `useAnthropicScorer.ts`.
The fallback must produce real commentary based on actual answer content — never generic placeholder text.

## AI Provider
Currently using Groq (llama-3.3-70b-versatile) via:
- Local dev: direct API call using `VITE_GROQ_API_KEY`
- Production: Vercel proxy at `/api/score` using `GROQ_API_KEY`
