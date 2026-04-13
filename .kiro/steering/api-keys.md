---
inclusion: always
---

# API Key Security Rules

## NEVER do these
- Hardcode API keys in source files
- Commit `.env` to git (it is in `.gitignore`)
- Call external AI APIs directly from the browser in production
- Log API keys to the console

## ALWAYS do these
- Store keys in `.env` using the `VITE_` prefix for client-side Vite access
- Use the Vercel serverless proxy (`/api/score`) in production for AI calls
- Use direct API calls only in local development (`localhost`)
- Reference `.env.example` when adding new environment variables

## Current env variables
- `VITE_GROQ_API_KEY` — Groq API key for local development
- `GROQ_API_KEY` — Groq API key for Vercel serverless function (set in Vercel dashboard)

## Vercel deployment
When deploying, set `GROQ_API_KEY` as an environment variable in the Vercel dashboard.
The frontend detects production via `window.location.hostname !== 'localhost'` and routes through `/api/score`.
