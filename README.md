# AI Pitch Auditor — FastAPI Backend

An AI-powered investor pitch verification API. Upload founder pitch audio and
get back the transcript, extracted factual claims, evidence-based verdicts,
a credibility score, and investor-style cross-examination questions.

This is the FastAPI backend, converted from an earlier Streamlit prototype.
The original Streamlit UI (`app.py`, `.streamlit/`) is kept in the repo for
reference but is **not used** by this backend and is not required for
deployment.

## Pipeline

```
Audio upload
  → Speech-to-text            (services/stt_service.py, Groq Whisper)
  → Claim extraction          (services/claim_extractor.py, Groq LLM)
  → Evidence search            (services/search_service.py, Tavily)
  → Claim verification         (services/fact_checker.py, Groq LLM)
      → TRUE | FALSE | MIXED | UNVERIFIED
  → Cross-examiner questions   (services/cross_examiner.py, Groq LLM)
  → Credibility score           (computed in routes/analyze.py)
  → JSON response
```

All core AI logic (STT, claim extraction, search, verification) is reused
unchanged from the original project. See **Notes on scope** below for the
two small additions made to satisfy the API contract.

## Project structure

```
AI-Pitch-Auditor-main/
├── main.py                 # FastAPI app, CORS, error handlers
├── api/
│   └── index.py             # Vercel serverless entrypoint (imports main:app)
├── config.py                 # Env var loading (unchanged, + FRONTEND_URL/limits)
├── routes/
│   ├── health.py             # GET /api/health
│   └── analyze.py            # POST /api/analyze
├── services/                 # Reused from the original project
│   ├── stt_service.py
│   ├── claim_extractor.py
│   ├── search_service.py
│   ├── fact_checker.py
│   └── cross_examiner.py     # NEW — see "Notes on scope"
├── requirements.txt
├── vercel.json
├── .env.example
├── .gitignore
├── test_pitch.mp3            # Sample audio for manual testing
├── app.py                    # Legacy Streamlit UI (unused by the API)
└── .streamlit/                # Legacy Streamlit config (unused by the API)
```

## Local setup

1. **Create a virtual environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate      # Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and fill in your real keys:
   ```env
   GROQ_API_KEY=your_real_groq_key
   TAVILY_API_KEY=your_real_tavily_key
   FRONTEND_URL=http://localhost:3000
   ```
   `.env` is git-ignored — never commit it.

4. **Run the API locally**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

5. **Verify**
   - `GET http://127.0.0.1:8000/api/health` → `{"status": "ok"}`
   - `http://127.0.0.1:8000/docs` → interactive Swagger UI
   - Test `/api/analyze` with the included sample:
     ```bash
     curl -X POST http://127.0.0.1:8000/api/analyze \
       -F "audio=@test_pitch.mp3;type=audio/mpeg"
     ```

## API contract

### `GET /api/health`
```json
{ "status": "ok" }
```

### `POST /api/analyze`
`multipart/form-data`, one field:

| Field | Type | Required | Notes |
|---|---|---|---|
| `audio` | file | yes | `.mp3`, `.wav`, or `.m4a`, max 10 MB |

**Success response `200`:**
```json
{
  "transcript": "Hello investors, welcome to EcoTech Solutions...",
  "claims": [
    {
      "id": 1,
      "claim": "The company achieved two million dollars in ARR last year.",
      "category": "Financial",
      "verdict": "UNVERIFIED",
      "verdict_label": "Unverified",
      "confidence": 0.2,
      "explanation": "No independent evidence was found to confirm this figure.",
      "evidence": [
        { "title": "...", "url": "...", "snippet": "..." }
      ],
      "sources": ["https://..."],
      "cross_examiner_questions": [
        "Can you share the audited revenue report supporting this figure?"
      ]
    }
  ],
  "claim_count": 4,
  "credibility_score": {
    "score": 62.5,
    "scale": "0-100",
    "basis": "Weighted average over 3 claim(s) with evidence-backed verdicts.",
    "counts": { "TRUE": 1, "FALSE": 0, "MIXED": 1, "UNVERIFIED": 1 }
  },
  "metadata": {
    "processing_time_seconds": 8.42,
    "audio_filename": "test_pitch.mp3",
    "audio_size_bytes": 243264,
    "stt_model": "whisper-large-v3",
    "llm_model": "openai/gpt-oss-120b"
  }
}
```

**Error responses** (`{"error": "..."}`):

| Status | Meaning |
|---|---|
| 400 | No audio provided, unsupported format, or empty/corrupt file |
| 413 | Audio file exceeds the 10 MB limit |
| 422 | Audio was readable but no speech could be transcribed |
| 502 | STT, claim extraction, or verification service call failed |
| 503 | Server is missing required API keys |
| 500 | Unexpected server error |

Error responses never include API keys or internal stack traces.

## Verdict semantics (unchanged from the original project)

- `TRUE` / `FALSE` / `MIXED` / `UNVERIFIED` are produced exactly as before by
  `fact_checker.py`. `verdict_label` (Supported / Contradicted / Mixed /
  Unverified) is an additional display-friendly field layered on top for the
  frontend — it does not change the verification rule.
- **Absence of evidence does not mean a claim is false.** A claim with no
  search evidence is `UNVERIFIED`, never `FALSE`, and is excluded from the
  credibility score's denominator rather than penalized.

## CORS

Configured via `FRONTEND_URL`. `http://localhost:3000` is always allowed in
addition, so local frontend development works regardless of what
`FRONTEND_URL` is set to in your environment.

## Deploying to Vercel

1. **Install the Vercel CLI** (if you don't have it):
   ```bash
   npm install -g vercel
   ```

2. **Log in** (interactive — requires your browser):
   ```bash
   vercel login
   ```

3. **Link and deploy** from the project root:
   ```bash
   vercel
   ```
   Follow the prompts to link/create the project.

4. **Set environment variables** in the Vercel dashboard (Project → Settings
   → Environment Variables), or via CLI:
   ```bash
   vercel env add GROQ_API_KEY
   vercel env add TAVILY_API_KEY
   vercel env add FRONTEND_URL
   ```

5. **Deploy to production:**
   ```bash
   vercel --prod
   ```

6. **Verify:**
   ```bash
   curl https://YOUR-VERCEL-DOMAIN/api/health
   ```
   and open `https://YOUR-VERCEL-DOMAIN/docs`.

> This step requires your Vercel account and browser-based login, so it
> can't be completed on your behalf — see the final report for exactly
> where this was left off.

## Frontend integration notes (for Lovable or any frontend)

- Base URL: your Vercel deployment domain.
- Send `POST /api/analyze` as `multipart/form-data` with a single `audio`
  file field — not JSON.
- Set the frontend's own `FRONTEND_URL` value in the backend's Vercel env
  vars so CORS allows it.
- All responses are JSON; check for a top-level `"error"` key to detect
  failures instead of relying solely on HTTP status.

## Notes on scope (please read)

The original codebase's fact-checking pipeline stops at a per-claim verdict
(`TRUE`/`FALSE`/`MIXED`/`UNVERIFIED`) with confidence, explanation, and
sources — there was no credibility-scoring code and no cross-examiner
question generator anywhere in the project, even though the task
description mentions both. To deliver a complete `/api/analyze` response
without inventing new core verification behavior, two small additive pieces
were built:

1. **`services/cross_examiner.py`** — a new service, structurally identical
   to `fact_checker.py` (same Groq client pattern), that generates 1–3
   follow-up questions per claim. If it fails, it returns `[]` and never
   breaks the rest of the response.
2. **Credibility score** — computed in `routes/analyze.py` from the
   verdicts/confidences already returned by the unmodified
   `fact_checker.py`. It's a simple, transparent weighted average — it does
   not change how any individual claim is verified.

Neither change touches `stt_service.py`, `claim_extractor.py`,
`search_service.py`, or `fact_checker.py`, which are reused exactly as they
were.
