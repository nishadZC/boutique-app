FROM node:26-alpine3.24 AS builder
RUN apk upgrade --no-cache
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund
# Copy only the application source (explicit allowlist, not COPY . .)
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
RUN npm prune --omit=dev

FROM node:26-alpine3.24
RUN apk upgrade --no-cache
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
USER node
EXPOSE 3004
CMD ["node", "dist/index.js"]