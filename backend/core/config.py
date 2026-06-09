import os
from urllib.parse import urlparse

# Resolve .env path
env_path = ".env"
if not os.path.exists(env_path):
    # Try looking in parent directories up to 3 levels
    for level in range(1, 4):
        candidate = os.path.join(*([".."] * level), ".env")
        if os.path.exists(candidate):
            env_path = candidate
            break

# Load env variables manually from .env if found
if os.path.exists(env_path):
    print(f"Loading environment variables from {env_path}")
    with open(env_path, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                parts = line.split("=", 1)
                if len(parts) == 2:
                    os.environ[parts[0].strip()] = parts[1].strip()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://127.0.0.1:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "adsa")

# Attempt to extract database name from MONGODB_URL path if DATABASE_NAME not explicitly set in environment
if "DATABASE_NAME" not in os.environ and MONGODB_URL:
    try:
        parsed = urlparse(MONGODB_URL)
        path = parsed.path.strip("/")
        if path:
            DATABASE_NAME = path.split("?")[0]
    except Exception:
        pass

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
REPORT_DIR = os.getenv("REPORT_DIR", "reports")
MODEL_DIR = os.getenv("MODEL_DIR", "trained_models")
PROCESSED_DIR = os.getenv("PROCESSED_DIR", "processed")
EVALUATION_RESULTS_DIR = os.getenv("EVALUATION_RESULTS_DIR", "evaluation_results")

# Ensure critical directories exist
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(REPORT_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)
os.makedirs(EVALUATION_RESULTS_DIR, exist_ok=True)
