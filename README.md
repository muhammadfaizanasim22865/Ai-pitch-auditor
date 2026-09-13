# 🎙️ AI Pitch Auditor

> **Don't just hear the pitch. Verify it.**

AI Pitch Auditor is an AI-powered investor due-diligence tool that analyzes startup pitches, extracts factual claims, searches for supporting evidence, verifies those claims, calculates a credibility score, and generates investor-style cross-examination questions.

Instead of simply summarizing what a founder says, AI Pitch Auditor asks:

**"Can we actually verify this?"**

---

## 🚀 Live Demo

### Frontend

**https://ai-pitch-auditor-fro-nhmx.bolt.host/**

### Backend API

**https://ai-pitch-auditor.vercel.app/**

### API Documentation

**https://ai-pitch-auditor.vercel.app/docs**

---

## 💡 What Problem Does It Solve?

Startup pitches are full of numbers and claims:

* "We have 100,000 users."
* "Revenue grew 40% this year."
* "Customers reduced costs by 30%."
* "We are generating $50,000 MRR."

Investors need more than confident statements.

AI Pitch Auditor turns a founder's pitch into a structured verification report by combining:

🎙️ Speech-to-text
🧠 AI claim extraction
🔎 Web evidence search
✅ Claim verification
📊 Credibility scoring
⚔️ Investor-style cross-examination

The goal is not to automatically label unsupported claims as false.

**Absence of evidence ≠ evidence of falsehood.**

Claims that cannot be independently verified are marked **Unverified**.

---

# 🔄 How It Works

```text
        Founder Pitch
              │
              ▼
    ┌─────────────────────┐
    │ Audio Recording /   │
    │ Audio Upload        │
    └──────────┬──────────┘
               │
               ▼
       🎙️ Speech-to-Text
          Groq Whisper
               │
               ▼
       🧠 Claim Extraction
          Groq LLM
               │
               ▼
       🔎 Evidence Search
            Tavily
               │
               ▼
       ✅ Claim Verification
          Groq LLM
               │
       ┌───────┼────────┐
       ▼       ▼        ▼
   Supported  Mixed  Contradicted
               │
               └───────┐
                       ▼
                  Unverified
                       │
                       ▼
             📊 Credibility Score
                       │
                       ▼
             ⚔️ Cross-Examiner
                  Questions
                       │
                       ▼
              Investor Report
```

---

# ✨ Key Features

## 🎙️ Record a Pitch

Record a pitch directly from the browser using the microphone.

The frontend uses the browser's `MediaRecorder` API and sends the recorded audio to the same analysis pipeline used for uploaded files.

## 📁 Upload Audio

Upload an existing pitch recording for analysis.

Supported audio formats include:

* MP3
* WAV
* M4A
* Browser-recorded audio formats supported by the application

## 📝 Automatic Transcription

The system converts the founder's speech into text using **Groq Whisper**.

## 🧠 Claim Extraction

The AI identifies meaningful factual claims from the transcript and categorizes them, such as:

* Traction
* Growth
* Financial
* Performance
* Market
* Product

## 🔎 Evidence Search

Each factual claim is checked against publicly available web information using **Tavily**.

The system collects:

* Relevant sources
* Source titles
* Evidence snippets
* URLs

## ✅ Claim Verification

Claims receive one of four verdicts:

| Verdict             | Meaning                                      |
| ------------------- | -------------------------------------------- |
| 🟢 **Supported**    | Evidence supports the claim                  |
| 🔴 **Contradicted** | Evidence conflicts with the claim            |
| 🟡 **Mixed**        | Evidence partially supports the claim        |
| ⚪ **Unverified**    | No sufficient independent evidence was found |

### Important principle

> **Unverified does not mean false.**

A claim is only marked Contradicted when the available evidence actually conflicts with it.

## 📊 Credibility Score

The system generates a credibility score based on evidence-backed claim verdicts and confidence.

Claims that are simply unverified are not treated as automatically false.

## ⚔️ Cross-Examiner

For each claim, AI Pitch Auditor generates investor-style follow-up questions.

For example:

> **Claim:** "We have 100,000 active users."

The Cross-Examiner may ask:

> "How do you define an active user, and what percentage of those users are monthly active?"

This turns the system from a simple fact checker into a lightweight **AI due-diligence assistant**.

## 📋 Investor Takeaway

The final dashboard summarizes:

* Overall credibility
* Claim distribution
* Important evidence
* Unverified or contradicted claims
* Cross-examination questions
* Investor-focused observations

---

# 🏗️ Architecture

```text
┌──────────────────────────────────────────┐
│              Frontend                    │
│                                          │
│      React + TypeScript + Vite           │
│      Tailwind CSS                        │
│                                          │
│  Record Pitch  │  Upload Audio           │
└────────────────┬─────────────────────────┘
                 │
                 │ POST /api/analyze
                 ▼
┌──────────────────────────────────────────┐
│              FastAPI Backend             │
│                Vercel                   │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ Speech-to-Text                     │  │
│  │ Claim Extraction                   │  │
│  │ Evidence Search                    │  │
│  │ Claim Verification                 │  │
│  │ Credibility Scoring                │  │
│  │ Cross-Examiner                     │  │
│  └────────────────────────────────────┘  │
└───────────────┬──────────────┬───────────┘
                │              │
                ▼              ▼
          ┌───────────┐   ┌───────────┐
          │   Groq    │   │  Tavily   │
          │           │   │           │
          │ Whisper   │   │ Web Search│
          │ LLM       │   │ Evidence  │
          └───────────┘   └───────────┘
```

---

# 🛠️ Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Browser MediaRecorder API

### Backend

* Python
* FastAPI
* Vercel Serverless Functions

### AI

* Groq Whisper
* Groq LLM
* `openai/gpt-oss-120b`

### Evidence Search

* Tavily

### Deployment

* **Frontend:** Bolt
* **Backend:** Vercel
* **Source Control:** GitHub

---

# 📁 Project Structure

```text
Ai-pitch-auditor/
│
├── api/
│   └── index.py                 # Vercel serverless entrypoint
│
├── routes/
│   ├── __init__.py
│   ├── analyze.py               # Main pitch analysis endpoint
│   └── health.py                # Health check endpoint
│
├── services/
│   ├── __init__.py
│   ├── stt_service.py           # Speech-to-text
│   ├── claim_extractor.py       # Claim extraction
│   ├── search_service.py        # Tavily evidence search
│   ├── fact_checker.py          # Claim verification
│   └── cross_examiner.py        # Investor questions
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AnalysisProgress.tsx
│   │   │   ├── ClaimCard.tsx
│   │   │   ├── CredibilityScore.tsx
│   │   │   ├── CrossExaminer.tsx
│   │   │   ├── ErrorState.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── InvestorTakeaway.tsx
│   │   │   ├── LandingPage.tsx
│   │   │   ├── RecordPitch.tsx
│   │   │   ├── ResultsDashboard.tsx
│   │   │   └── UploadArea.tsx
│   │   ├── api.ts
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── main.tsx
│   │   └── types.ts
│   │
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── ...
│
├── main.py                      # FastAPI application
├── config.py                    # Environment configuration
├── requirements.txt             # Python dependencies
├── vercel.json                  # Vercel configuration
├── .env.example                 # Environment variable template
├── README.md
└── test_pitch.mp3               # Sample pitch audio
```

---

# ⚙️ Local Development

## 1. Clone the repository

```bash
git clone https://github.com/muhammadfaizanasim22865/Ai-pitch-auditor.git
cd Ai-pitch-auditor
```

---

## 2. Backend Setup

Create a Python virtual environment:

### Windows

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### macOS / Linux

```bash
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

## 3. Configure Environment Variables

Create a `.env` file from the example:

### Windows PowerShell

```powershell
Copy-Item .env.example .env
```

Then add your API keys:

```env
GROQ_API_KEY=your_groq_api_key
TAVILY_API_KEY=your_tavily_api_key
FRONTEND_URL=http://localhost:5173
```

**Never commit `.env` or expose API keys in the frontend.**

---

## 4. Run the Backend

```powershell
python -m uvicorn main:app --reload --port 8000
```

The API will be available at:

```text
http://127.0.0.1:8000
```

Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

Health check:

```text
http://127.0.0.1:8000/api/health
```

---

# 🖥️ Frontend Setup

Open a second terminal:

```powershell
cd frontend
```

Install dependencies:

```powershell
npm install
```

Create:

```text
frontend/.env
```

Add:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Run the frontend:

```powershell
npm run dev
```

The Vite development server will provide the local frontend URL.

---

# 🔌 API

## Health Check

```http
GET /api/health
```

Response:

```json
{
  "status": "ok"
}
```

---

## Analyze Pitch

```http
POST /api/analyze
Content-Type: multipart/form-data
```

Request field:

| Field   | Type | Required |
| ------- | ---- | -------- |
| `audio` | File | Yes      |

Example:

```bash
curl -X POST http://127.0.0.1:8000/api/analyze \
  -F "audio=@test_pitch.mp3"
```

The response contains:

```json
{
  "transcript": "...",
  "claims": [],
  "claim_count": 4,
  "credibility_score": {
    "score": 82.5,
    "scale": "0-100",
    "basis": "Weighted average..."
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

Each claim can include:

```json
{
  "id": 1,
  "claim": "The company has 100,000 registered users.",
  "category": "Traction",
  "verdict": "UNVERIFIED",
  "verdict_label": "Unverified",
  "confidence": 0.82,
  "explanation": "...",
  "evidence": [],
  "sources": [],
  "cross_examiner_questions": []
}
```

---

# 🧠 Verification Philosophy

AI Pitch Auditor intentionally follows a conservative verification philosophy.

### Supported

Reliable evidence supports the claim.

### Contradicted

Reliable evidence directly conflicts with the claim.

### Mixed

Evidence supports some parts of the claim but conflicts with or fails to support others.

### Unverified

There is not enough independent evidence to establish whether the claim is true.

This distinction is important because:

```text
No evidence
     ≠
False claim
```

The system should help investors identify where **due diligence is required**, rather than pretending that a search engine can magically prove everything.

---

# 🔐 Security

API keys are kept on the backend.

The frontend does **not** contain:

* `GROQ_API_KEY`
* `TAVILY_API_KEY`

Environment variables should be configured through:

* `.env` for local development
* Vercel Environment Variables for production

Never commit:

```text
.env
```

to GitHub.

---

# ☁️ Production Deployment

## Backend

The FastAPI backend is deployed on **Vercel**.

Production API:

```text
https://ai-pitch-auditor.vercel.app
```

Required environment variables:

```text
GROQ_API_KEY
TAVILY_API_KEY
FRONTEND_URL
```

`FRONTEND_URL` should point to the deployed frontend so FastAPI CORS allows browser requests.

---

## Frontend

The current frontend is deployed through **Bolt**.

Production frontend:

```text
https://ai-pitch-auditor-fro-nhmx.bolt.host/
```

The frontend communicates with the deployed FastAPI backend through:

```text
POST https://ai-pitch-auditor.vercel.app/api/analyze
```

---

# 🧪 Testing

The system has been tested end-to-end with both supported input flows:

```text
🎙️ Record Pitch
       ↓
   Analyze Pitch
       ↓
    FastAPI API
       ↓
   AI Pipeline
       ↓
   Results Dashboard
```

and:

```text
📁 Upload Audio
       ↓
   Analyze Pitch
       ↓
    FastAPI API
       ↓
   AI Pipeline
       ↓
   Results Dashboard
```

Both browser recording and uploaded audio are supported by the current frontend.

---

# 🎯 Hackathon MVP

The current MVP focuses on the core investor workflow:

* [x] Browser pitch recording
* [x] Audio upload
* [x] Speech-to-text
* [x] Claim extraction
* [x] Web evidence search
* [x] Claim verification
* [x] Credibility scoring
* [x] Evidence display
* [x] Cross-examiner questions
* [x] Investor takeaway
* [x] FastAPI backend
* [x] Production deployment
* [x] Full-stack GitHub repository

---

# 🔮 Future Improvements

Potential future versions could include:

* 📝 Direct text pitch analysis
* 📄 Pitch deck/PDF analysis
* 🏢 Company/entity-aware evidence matching
* 📈 Historical startup metrics tracking
* 🧾 Financial statement verification
* 🔗 Source credibility/ranking
* 👥 Investor collaboration
* 📊 Portfolio-level startup comparison
* 🧠 More advanced multi-agent due-diligence workflows
* 🔐 Authentication and persistent reports

---

# 👥 Team

**AI Pitch Auditor** was developed as a team project for **Pak Angels Cohort 11**.

The project combines AI engineering, backend development, frontend development, web research, and investor-focused product design into a single due-diligence workflow.

---

# 📜 License

This project is developed as a hackathon/project prototype.

Add an explicit open-source license here if the project is later intended to be publicly licensed.

---

## ⭐ Why AI Pitch Auditor?

Investors don't just need to hear what a startup claims.

They need to know:

> **What can actually be verified?**

AI Pitch Auditor turns a spoken startup pitch into an evidence-backed verification report, helping investors spend less time manually checking claims and more time asking the questions that matter.
