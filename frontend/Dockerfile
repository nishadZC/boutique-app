# Build stage
FROM node:26-alpine3.24 AS builder

RUN apk update && apk upgrade --no-cache

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install --ignore-scripts --prefer-offline --no-audit

# Copy only the application source (explicit allowlist, not COPY . .)
COPY index.html tsconfig.json tsconfig.node.json vite.config.ts vitest.config.mts ./
COPY src ./src
COPY public ./public

# Build the React app
RUN npm run build

# Production stage - serve with nginx as a non-root user
FROM nginxinc/nginx-unprivileged:1.31.5-alpine3.24-slim

# Copy built app from builder
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Expose port
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]