from fastapi import APIRouter

router = APIRouter()


@router.get("/api/health")
def health_check():
    """Simple liveness check. No external calls, no API keys required."""
    return {"status": "ok"}
