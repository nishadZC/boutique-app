# Auth Service Dockerfile
FROM node:20-alpine AS builder

RUN apk update && apk upgrade --no-cache

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

RUN apk update && apk upgrade --no-cache

WORKDIR /app

# Copy package files and install production dependencies only and clean npm cache
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist

# Create non-root group & user
RUN apk add --no-cache shadow
RUN groupadd -r -g 1001 nodejs
RUN useradd -r -u 1001 -g nodejs nodejs

USER nodejs

EXPOSE 3002

CMD ["node", "dist/index.js"]
