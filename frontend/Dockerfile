# Build stage
# Build context is the repo root, so the workspace's single package-lock.json
# is available and `npm ci` installs exactly the versions CI tested.
FROM node:26-alpine3.24 AS builder

RUN apk update && apk upgrade --no-cache

WORKDIR /app

# Root manifest + lock file, and the frontend's manifest (npm workspaces)
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/
RUN npm ci -w frontend --ignore-scripts --no-audit --no-fund

# Copy only the application source (explicit allowlist, not COPY . .)
COPY frontend/index.html frontend/tsconfig.json frontend/tsconfig.node.json frontend/vite.config.ts frontend/vitest.config.mts frontend/
COPY frontend/src frontend/src
COPY frontend/public frontend/public

# Build the React app
RUN npm run build -w frontend

# Production stage - serve with nginx as a non-root user
FROM nginxinc/nginx-unprivileged:1.31.5-alpine3.24-slim

# Pick up Alpine security fixes released after the base image was built
USER root
RUN apk upgrade --no-cache
USER 101

# Copy built app from builder
COPY --from=builder --chown=nginx:nginx /app/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY frontend/nginx.conf /etc/nginx/nginx.conf

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Expose port
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
