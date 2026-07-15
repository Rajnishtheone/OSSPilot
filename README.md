# OSSPilot

A LangGraph agent that helps new open-source contributors find their first
issue — extracts skills from free text, loops back to ask for clarification
when unsure, and matches you to real, currently-open GitHub issues either by
your tech stack or by a program label (GSSoC, Hacktoberfest, or any custom
label).

Built for the IBM SkillsBuild / CSRBOX Agentic AI internship.

## Architecture

```
frontend/  Next.js + TypeScript, hybrid split-screen UI
  ├── terminal chat (left)   — drives the conversation
  └── issue dashboard (right) — bento-grid results, bookmarks, contributing guide

backend/   FastAPI + LangGraph
  ├── extraction node   — LLM (Groq/Llama 3.3) pulls skills/interests/confidence
  ├── conditional edge  — low confidence → ask to clarify, else → proceed
  └── recommend node    — searches GitHub (by repo or by label), scores, ranks
```

**Design note**: unlike a notebook, a web backend can't pause mid-request and
wait for input. So the "loop back and ask a clarifying question" behavior is
handled per-request: if confidence is low, the API returns a question instead
of results; the frontend shows it in the terminal, the user answers, and the
frontend sends a new request with the combined message. Same loop-back
experience for the user, cleaner and more scalable on the server side.

## Local setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # then paste your real Groq key into .env
uvicorn app.main:app --reload
```

Get a free Groq key at https://console.groq.com/keys

Backend runs at `http://localhost:8000`. Check `http://localhost:8000/docs`
for interactive API docs (FastAPI generates this automatically).

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local      # default already points at localhost:8000
npm run dev
```

Frontend runs at `http://localhost:3000`.

## Deployment

### Backend → Render

1. Push this repo to GitHub
2. On Render: New → Web Service → connect your repo
3. Root directory: `backend`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add environment variable: `GROQ_API_KEY` = your key
7. Deploy — copy the resulting URL (e.g. `https://osspilot-api.onrender.com`)

### Frontend → Vercel

1. On Vercel: New Project → import the same repo
2. Root directory: `frontend`
3. Add environment variable: `NEXT_PUBLIC_API_URL` = your Render backend URL
4. Deploy

### After both are live

Update the `allow_origins` list in `backend/app/main.py` from `["*"]` to your
actual Vercel URL, for tighter security, then redeploy the backend.

## Extending it further

- `backend/app/config.py` — add more skills/repos to `REPO_MAP`
- Add a `GITHUB_TOKEN` env var (personal access token, no special scopes
  needed for public repos) to raise GitHub's rate limit from 60/hour to
  5000/hour — useful once you start demoing this to people
- Bookmarks currently save to the browser's `localStorage` (per-device only);
  swap in a real database (MongoDB, since you already know it) if you want
  bookmarks to persist across devices
