FROM python:3.12-slim-bookworm

WORKDIR /app

# Upgrade base OS packages to fix OS-level CVEs and install dependencies securely
RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
    libglib2.0-0 libsm6 libxext6 libxrender-dev libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user for security (Trivy DS002 fix)
RUN useradd -m -r -s /bin/bash appuser

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# pip is a build-time tool, not needed to run the app, and vendors its own
# old internal copies of several libraries (e.g. msgpack 1.1.2, bundled
# under pip._vendor - unrelated to and older than the msgpack this app
# actually depends on) that otherwise show up as unfixable findings in
# vulnerability scans despite never being reachable at runtime.
RUN pip uninstall -y pip

# Copy only the application source files (explicit allowlist, not a
# recursive `COPY . .`, so nothing outside this list - secrets, local
# env files, etc. - can ever end up in the image regardless of
# .dockerignore).
COPY --chown=appuser:appuser main.py metrics.py color_rules.py skin_tone_analyzer.py ./

# Switch to the non-root user
USER appuser

EXPOSE 5001

# Single worker: prometheus_client's default in-memory registry isn't
# safe to share across multiple worker processes without extra
# multiprocess setup (each would report incomplete/inconsistent counters
# to the /metrics scrape). Horizontal scaling is handled by the
# Kubernetes HPA instead of multiple workers per pod.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5001", "--workers", "1"]
