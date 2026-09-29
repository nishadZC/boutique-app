# Wishlist Service Dockerfile
# Build context is the repo root, so the workspace's single package-lock.json
# is available and `npm ci` installs exactly the versions CI tested.
FROM node:26-alpine3.24 AS builder

RUN apk upgrade --no-cache

WORKDIR /app

# Root manifest + lock file, and this service's manifest (npm workspaces)
COPY package.json package-lock.json ./
COPY backend/services/wishlist-service/package.json backend/services/wishlist-service/
RUN npm ci -w backend/services/wishlist-service --ignore-scripts --no-audit --no-fund

# Copy only the application source (explicit allowlist, not COPY . .)
COPY backend/services/wishlist-service/tsconfig.json backend/services/wishlist-service/
COPY backend/services/wishlist-service/src backend/services/wishlist-service/src

# Build TypeScript
RUN npm run build -w backend/services/wishlist-service

# Drop dev dependencies. The service's own node_modules only exists when a
# dependency needs a different version than the hoisted one; create it so the
# COPY below always has something to copy.
RUN npm prune --omit=dev -w backend/services/wishlist-service && mkdir -p backend/services/wishlist-service/node_modules

# Production stage
FROM node:26-alpine3.24

RUN apk upgrade --no-cache
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

# Same layout as the builder, so Node resolves hoisted and nested packages
WORKDIR /app/backend/services/wishlist-service

# Copy the built application and production dependencies from the builder.
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/backend/services/wishlist-service/node_modules ./node_modules
COPY --from=builder /app/backend/services/wishlist-service/dist ./dist

USER node

EXPOSE 3007

CMD ["node", "dist/index.js"]
