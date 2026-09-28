# Auth Service Dockerfile
FROM node:26-alpine3.24 AS builder

RUN apk upgrade --no-cache

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install --ignore-scripts --no-audit --no-fund

# Copy only the application source (explicit allowlist, not COPY . .)
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

RUN npm prune --omit=dev

# Production stage
FROM node:26-alpine3.24

RUN apk upgrade --no-cache
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

WORKDIR /app

# Copy the built application and production dependencies from the builder.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

USER node

EXPOSE 3002

CMD ["node", "dist/index.js"]
