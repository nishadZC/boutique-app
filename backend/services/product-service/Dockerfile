FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY backend/services/product-service/package*.json ./backend/services/product-service/
RUN npm ci

COPY backend/services/product-service ./backend/services/product-service
RUN npm run build -w product-service

FROM node:20-alpine3.19

RUN apk update && apk upgrade --no-cache

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/services/product-service/node_modules ./backend/services/product-service/node_modules
COPY --from=builder /app/backend/services/product-service/dist ./backend/services/product-service/dist
COPY --from=builder /app/backend/services/product-service/package.json ./backend/services/product-service/

RUN addgroup -S appgroup && adduser -S appuser -G appgroup && chown -R appuser:appgroup /app
USER appuser

EXPOSE 3003
CMD ["node", "backend/services/product-service/dist/index.js"]
