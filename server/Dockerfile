# Build stage
# Build context is the REPO ROOT (see docker-compose.prod.yml) so the
# "@aifc/contracts": "file:../shared" dependency resolves to /app/shared.
FROM node:22-alpine AS builder

WORKDIR /app

# Copy server + shared manifests for dependency resolution
COPY server/package*.json server/
COPY shared/package*.json shared/

# Install shared package deps (needs zod + typescript to build)
# Retry + timeout config keeps npm ci alive on flaky networks
WORKDIR /app/shared
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 180000 \
    && npm config set fetch-timeout 900000 \
    && npm ci --legacy-peer-deps

# Install server dependencies (legacy-peer-deps: better-auth peerOptional vitest range)
WORKDIR /app/server
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 180000 \
    && npm config set fetch-timeout 900000 \
    && npm ci --legacy-peer-deps

# Copy source code
WORKDIR /app
COPY server ./server
COPY shared ./shared

# Build TypeScript (build script builds shared contracts first;
# prebuild hook runs prisma generate)
WORKDIR /app/server
RUN npm run build

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Copy server + shared manifests for dependency resolution
COPY server/package*.json server/
COPY shared/package*.json shared/

# Install shared production deps (zod for the compiled contracts)
WORKDIR /app/shared
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 180000 \
    && npm config set fetch-timeout 900000 \
    && npm ci --only=production --legacy-peer-deps

# Install server production dependencies only (includes prisma CLI for migrate deploy)
WORKDIR /app/server
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 180000 \
    && npm config set fetch-timeout 900000 \
    && npm ci --only=production --legacy-peer-deps

# Copy built files, shared contracts output, and migration history
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/prisma ./prisma
COPY --from=builder /app/shared/dist ../shared/dist
COPY --from=builder /app/shared/package.json ../shared/package.json

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Deploy pending migrations, then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
