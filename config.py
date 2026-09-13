import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
    WHISPER_MODEL = "whisper-large-v3"
    GROQ_MODEL = "openai/gpt-oss-120b"

    PAGE_TITLE = "AI Pitch Auditor - Live Fact Checker"
    PAGE_ICON = "🎙️"

    # Vercel Hobby/Pro serverless functions cap the request body well under
    # this value; we enforce our own limit first so we can return a clean
    # JSON error instead of a raw platform-level rejection.
    MAX_AUDIO_BYTES = 10 * 1024 * 1024  # 10 MB
    ALLOWED_AUDIO_EXTENSIONS = {".mp3", ".wav", ".m4a"}
