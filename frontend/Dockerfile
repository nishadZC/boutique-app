# Build stage
FROM node:26-alpine3.24 AS builder

RUN apk update && apk upgrade --no-cache

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install --prefer-offline --no-audit

# Copy only the application source (explicit allowlist, not COPY . .)
COPY index.html tsconfig.json tsconfig.node.json vite.config.ts vitest.config.mts ./
COPY src ./src
COPY public ./public

# Build the React app
RUN npm run build

# Production stage - serve with nginx
FROM nginx:1.30.5-alpine3.24-slim

RUN apk update && apk upgrade --no-cache && \
    addgroup -g 101 -S nginx && \
    adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx || true

# Copy built app from builder
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create nginx cache directory and remove default config
RUN mkdir -p /var/cache/nginx && \
    chown -R nginx:nginx /var/cache/nginx /var/log/nginx /etc/nginx/conf.d && \
    rm -f /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Run as nginx user for security
USER nginx

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]