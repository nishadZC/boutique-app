FROM node:26-alpine3.24 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
# Copy only the application source (explicit allowlist, not COPY . .)
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:26-alpine3.24
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY --from=builder /app/dist ./dist
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs
USER nodejs
EXPOSE 3006
CMD ["node", "dist/index.js"]
