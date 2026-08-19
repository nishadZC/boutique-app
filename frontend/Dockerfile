# Build stage
FROM node:20-alpine AS builder

RUN apk update && apk upgrade --no-cache

WORKDIR /app

COPY package*.json ./
COPY frontend/package*.json ./frontend/
RUN npm ci

COPY frontend ./frontend

RUN npm run build -w frontend

# Production stage - serve with nginx
FROM nginx:1.25-alpine

RUN apk update && apk upgrade --no-cache &&     addgroup -g 101 -S nginx &&     adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx || true

COPY --from=builder --chown=nginx:nginx /app/frontend/build /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/nginx.conf

RUN mkdir -p /var/cache/nginx &&     chown -R nginx:nginx /var/cache/nginx /var/log/nginx /etc/nginx/conf.d &&     rm -f /etc/nginx/conf.d/default.conf

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3     CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

USER nginx
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
