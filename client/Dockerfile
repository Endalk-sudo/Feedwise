# Build stage
# Build context is the REPO ROOT (see docker-compose.prod.yml) so the
# "@aifc/contracts": "file:../shared" dependency resolves to /app/shared.
FROM node:22-alpine AS builder

WORKDIR /app

# Copy client + shared manifests for dependency resolution
COPY client/package*.json client/
COPY shared/package*.json shared/

# Install shared package deps (needs zod + typescript to build)
# Retry + timeout config keeps npm ci alive on flaky networks
WORKDIR /app/shared
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 180000 \
    && npm config set fetch-timeout 900000 \
    && npm ci --legacy-peer-deps

# Install client dependencies (legacy-peer-deps: see AGENTS.md CI notes)
WORKDIR /app/client
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 180000 \
    && npm config set fetch-timeout 900000 \
    && npm ci --legacy-peer-deps

# Copy source code
WORKDIR /app
COPY client ./client
COPY shared ./shared

# Build the app (prebuild hook builds shared contracts first)
WORKDIR /app/client
RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine AS production

# Copy custom nginx config
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder stage
COPY --from=builder /app/client/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
