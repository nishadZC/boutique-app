FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY backend/services/auth/package*.json ./backend/services/auth/
RUN npm ci

COPY backend/services/auth ./backend/services/auth
RUN npm run build -w auth-service

FROM node:20-alpine3.19

RUN apk update && apk upgrade --no-cache

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/services/auth/node_modules ./backend/services/auth/node_modules
COPY --from=builder /app/backend/services/auth/dist ./backend/services/auth/dist
COPY --from=builder /app/backend/services/auth/package.json ./backend/services/auth/

RUN addgroup -S appgroup && adduser -S appuser -G appgroup && chown -R appuser:appgroup /app
USER appuser

EXPOSE 3001
CMD ["node", "backend/services/auth/dist/index.js"]
