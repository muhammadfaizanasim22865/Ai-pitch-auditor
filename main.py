from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import Config
from routes import health, analyze

app = FastAPI(
    title="AI Pitch Auditor API",
    description="Verifies factual claims made in investor pitch audio.",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
# FRONTEND_URL is read from the environment (see config.py / .env.example).
# We always allow localhost:3000 for local frontend development in addition
# to whatever FRONTEND_URL is set to, so devs don't need to change env vars
# just to run the frontend locally against a deployed backend (or vice versa).
_allowed_origins = {Config.FRONTEND_URL, "http://localhost:3000"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(_allowed_origins),
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(analyze.router)


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    # Centralized, consistent error shape. Never leak internal
    # exception tracebacks or secrets — only whatever readable message
    # the route explicitly constructed.
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": "An unexpected server error occurred."},
    )


@app.get("/")
def root():
    return {"service": "AI Pitch Auditor API", "docs": "/docs", "health": "/api/health"}
