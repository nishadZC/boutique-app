FROM python:3.12-slim-bookworm

WORKDIR /app

# Upgrade base OS packages to fix OS-level CVEs and install dependencies securely
RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
    libglib2.0-0 libsm6 libxext6 libxrender-dev libgomp1 curl \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user for security (Trivy DS002 fix)
RUN useradd -m -r -s /bin/bash appuser

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy only the application source files (explicit allowlist, not a
# recursive `COPY . .`, so nothing outside this list can end up in the
# image regardless of .dockerignore).
COPY --chown=appuser:appuser main.py color_rules.py skin_tone_analyzer.py ./

# Switch to the non-root user
USER appuser

EXPOSE 5001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5001", "--workers", "2"]
