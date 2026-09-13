import sys
import os

# Allow importing main.py, config.py, routes/, services/ which live one
# directory up from this Vercel function file.
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app  # noqa: E402

# Vercel's Python runtime looks for a module-level ASGI/WSGI app callable.
