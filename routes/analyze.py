import os
import time

from fastapi import APIRouter, UploadFile, File, HTTPException

from config import Config
from services import STTService, ClaimExtractor, SearchService, FactChecker, CrossExaminer

router = APIRouter()


class _InMemoryAudioFile:
    """
    Adapter so the existing STTService (originally written for a Streamlit
    UploadedFile, which exposes .name and a synchronous .read()) can be
    reused unchanged with a FastAPI UploadFile without modifying
    stt_service.py.
    """

    def __init__(self, filename: str, data: bytes):
        self.name = filename
        self._data = data

    def read(self) -> bytes:
        return self._data


def _require_api_keys():
    missing = []
    if not Config.GROQ_API_KEY:
        missing.append("GROQ_API_KEY")
    if not Config.TAVILY_API_KEY:
        missing.append("TAVILY_API_KEY")
    if missing:
        raise HTTPException(
            status_code=503,
            detail=(
                "Server is not configured correctly: missing environment "
                f"variable(s) {', '.join(missing)}. Set them in your "
                "deployment environment (e.g. Vercel Project Settings)."
            ),
        )


def _compute_credibility_score(verdicts: list[dict]) -> dict:
    """
    NOTE: This scoring logic did not exist in the original project — the
    original app only rendered a per-claim verdict pill. It is a simple,
    transparent aggregation over the verdicts/confidences already produced
    by fact_checker.py; it does not alter how any individual claim is
    verified.

    Weighting: TRUE contributes its confidence, MIXED contributes half its
    confidence, FALSE and UNVERIFIED contribute 0. Claims with no evidence
    (UNVERIFIED) are excluded from the denominator rather than counted as
    failures, per the project's rule that absence of evidence does not mean
    a claim is false.
    """
    if not verdicts:
        return {
            "score": None,
            "scale": "0-100",
            "basis": "No verifiable claims were extracted.",
            "counts": {"TRUE": 0, "FALSE": 0, "MIXED": 0, "UNVERIFIED": 0},
        }

    counts = {"TRUE": 0, "FALSE": 0, "MIXED": 0, "UNVERIFIED": 0}
    weighted_total = 0.0
    denom = 0

    for v in verdicts:
        verdict = v.get("verdict", "UNVERIFIED")
        confidence = v.get("confidence", 0.0) or 0.0
        if verdict not in counts:
            verdict = "UNVERIFIED"
        counts[verdict] += 1

        if verdict == "TRUE":
            weighted_total += confidence
            denom += 1
        elif verdict == "MIXED":
            weighted_total += confidence * 0.5
            denom += 1
        elif verdict == "FALSE":
            weighted_total += 0.0
            denom += 1
        # UNVERIFIED: excluded from denom entirely (no evidence != false)

    if denom == 0:
        score = None
        basis = "All claims were unverified (no evidence found); no score could be computed."
    else:
        score = round((weighted_total / denom) * 100, 1)
        basis = f"Weighted average over {denom} claim(s) with evidence-backed verdicts."

    return {"score": score, "scale": "0-100", "basis": basis, "counts": counts}


# Display-friendly labels layered on top of the original TRUE/FALSE/MIXED/
# UNVERIFIED verdict values produced by fact_checker.py. The underlying
# verdict and verification rule are unchanged; this is presentation only.
_VERDICT_LABELS = {
    "TRUE": "Supported",
    "FALSE": "Contradicted",
    "MIXED": "Mixed",
    "UNVERIFIED": "Unverified",
}


@router.post("/api/analyze")
async def analyze_pitch(audio: UploadFile = File(...)):
    start_time = time.time()

    # ---- 1. Validate config -------------------------------------------------
    _require_api_keys()

    # ---- 2. Validate the upload ---------------------------------------------
    if audio is None or not audio.filename:
        raise HTTPException(status_code=400, detail="No audio file was provided.")

    ext = os.path.splitext(audio.filename)[1].lower()
    if ext not in Config.ALLOWED_AUDIO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported audio format '{ext or 'unknown'}'. "
                f"Allowed formats: {', '.join(sorted(Config.ALLOWED_AUDIO_EXTENSIONS))}."
            ),
        )

    data = await audio.read()

    if not data:
        raise HTTPException(status_code=400, detail="Uploaded audio file is empty or corrupt.")

    if len(data) > Config.MAX_AUDIO_BYTES:
        raise HTTPException(
            status_code=413,
            detail=(
                f"Audio file is too large ({len(data) / (1024 * 1024):.1f} MB). "
                f"Maximum allowed size is {Config.MAX_AUDIO_BYTES / (1024 * 1024):.0f} MB "
                "due to serverless request body limits."
            ),
        )

    # ---- 3. Speech-to-text ----------------------------------------------------
    try:
        stt = STTService()
        audio_wrapper = _InMemoryAudioFile(audio.filename, data)
        transcript = stt.transcribe_audio(audio_wrapper)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Speech-to-text failed: {str(e)}")

    transcript = (transcript or "").strip()
    if not transcript:
        raise HTTPException(
            status_code=422,
            detail="No clear speech could be transcribed from the uploaded audio.",
        )

    # ---- 4. Claim extraction ---------------------------------------------------
    try:
        extractor = ClaimExtractor()
        claims = extractor.extract_claims(transcript)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Claim extraction failed: {str(e)}")

    # ---- 5. Evidence search + verification + cross-exam, per claim -------------
    results = []
    verdicts_for_scoring = []

    if claims:
        try:
            searcher = SearchService()
            checker = FactChecker()
            cross_examiner = CrossExaminer()
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Failed to initialize verification services: {str(e)}")

        for item in claims:
            claim_text = item.get("claim", "")
            if not claim_text:
                continue

            try:
                search_results = searcher.search_claim(claim_text)
            except Exception as e:
                # search_service already catches its own errors and returns a
                # fallback result list, but guard here too in case that
                # contract changes.
                search_results = [{"title": "Search Failed", "url": "", "snippet": str(e)}]

            verdict_info = checker.verify_claim(claim_text, search_results)
            verdict = verdict_info.get("verdict", "UNVERIFIED")
            explanation = verdict_info.get("explanation", "")

            questions = cross_examiner.generate_questions(claim_text, verdict, explanation)

            verdicts_for_scoring.append(verdict_info)

            results.append(
                {
                    "id": item.get("id"),
                    "claim": claim_text,
                    "category": item.get("category", "General Fact"),
                    "verdict": verdict,
                    "verdict_label": _VERDICT_LABELS.get(verdict, verdict),
                    "confidence": verdict_info.get("confidence", 0.0),
                    "explanation": explanation,
                    "evidence": search_results,
                    "sources": verdict_info.get("sources", []),
                    "cross_examiner_questions": questions,
                }
            )

    credibility = _compute_credibility_score(verdicts_for_scoring)

    return {
        "transcript": transcript,
        "claims": results,
        "claim_count": len(results),
        "credibility_score": credibility,
        "metadata": {
            "processing_time_seconds": round(time.time() - start_time, 2),
            "audio_filename": audio.filename,
            "audio_size_bytes": len(data),
            "stt_model": Config.WHISPER_MODEL,
            "llm_model": Config.GROQ_MODEL,
        },
    }
