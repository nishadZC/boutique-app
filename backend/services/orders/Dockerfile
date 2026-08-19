FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY backend/services/orders/package*.json ./backend/services/orders/
RUN npm ci

COPY backend/services/orders ./backend/services/orders
RUN npm run build -w orders-service

FROM node:20-alpine3.19

RUN apk update && apk upgrade --no-cache

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/services/orders/node_modules ./backend/services/orders/node_modules
COPY --from=builder /app/backend/services/orders/dist ./backend/services/orders/dist
COPY --from=builder /app/backend/services/orders/package.json ./backend/services/orders/

RUN addgroup -S appgroup && adduser -S appuser -G appgroup && chown -R appuser:appgroup /app
USER appuser

EXPOSE 3002
CMD ["node", "backend/services/orders/dist/index.js"]
