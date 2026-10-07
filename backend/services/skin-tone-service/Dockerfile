# Debian 13 (trixie): its packages carry far fewer unfixed CVEs than
# Debian 12 (bookworm), which had 6 CRITICAL findings with no fix available.
FROM python:3.12-slim-trixie

WORKDIR /app

# Upgrade base OS packages to pick up security fixes. No extra packages are
# installed: opencv-python-headless, scikit-learn, numpy and Pillow wheels
# bundle their own libraries and only need libc, libstdc++ and zlib, which
# the base image already has. (The X11/glib libraries once installed here are
# only for GUI OpenCV and added dozens of CVEs.)
RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*

# Create a non-root user for security (Trivy DS002 fix)
RUN useradd -m -r -s /bin/bash appuser

# Build context is the repo root (same as every other image in CI)
COPY backend/services/skin-tone-service/requirements.txt .
# Every dependency is pinned in requirements.txt and installed from prebuilt
# wheels only, so no package's setup script runs at build time.
RUN pip install --no-cache-dir --only-binary=:all: -r requirements.txt

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
# Owned by root, so the app (running as appuser) can read but not modify its code.
COPY \
    backend/services/skin-tone-service/main.py \
    backend/services/skin-tone-service/metrics.py \
    backend/services/skin-tone-service/color_rules.py \
    backend/services/skin-tone-service/skin_tone_analyzer.py \
    ./

# Switch to the non-root user
USER appuser

EXPOSE 5001

# Single worker: prometheus_client's default in-memory registry isn't
# safe to share across multiple worker processes without extra
# multiprocess setup (each would report incomplete/inconsistent counters
# to the /metrics scrape). Horizontal scaling is handled by the
# Kubernetes HPA instead of multiple workers per pod.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5001", "--workers", "1"]
