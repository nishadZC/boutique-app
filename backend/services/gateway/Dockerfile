FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY backend/services/gateway/package*.json ./backend/services/gateway/
RUN npm ci

COPY backend/services/gateway ./backend/services/gateway
RUN npm run build -w gateway-service

FROM node:20-alpine3.19

RUN apk update && apk upgrade --no-cache

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/services/gateway/node_modules ./backend/services/gateway/node_modules
COPY --from=builder /app/backend/services/gateway/dist ./backend/services/gateway/dist
COPY --from=builder /app/backend/services/gateway/package.json ./backend/services/gateway/

RUN addgroup -S appgroup && adduser -S appuser -G appgroup && chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000
CMD ["node", "backend/services/gateway/dist/index.js"]
