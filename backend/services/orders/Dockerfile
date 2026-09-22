# Orders Service Dockerfile
FROM node:26-alpine3.24 AS builder

RUN apk update && apk upgrade --no-cache

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy only the application source (explicit allowlist, not COPY . .)
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM node:26-alpine3.24

RUN apk update && apk upgrade --no-cache

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN apk add --no-cache shadow
RUN groupadd -r -g 1001 nodejs
RUN useradd -r -u 1001 -g nodejs nodejs

USER nodejs

EXPOSE 3005

CMD ["node", "dist/index.js"]
