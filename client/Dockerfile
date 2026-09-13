# Build stage
# Build context is the REPO ROOT (see docker-compose.prod.yml) so the
# "@aifc/contracts": "file:../shared" dependency resolves to /app/shared.
FROM node:22-alpine AS builder

# Optional build-time Vite env (backward compatible: defaults keep
# same-origin /api behavior used by docker compose dev + prod).
# Local compose builds pass no args => VITE_API_URL="" => api.ts uses '/api'.
# Manual override still works:
#   docker build --build-arg VITE_API_URL=https://api.example.com ...
ARG VITE_API_URL=""
ARG VITE_STRIPE_PUBLISHABLE_KEY=""
ARG VITE_STRIPE_BASIC_PRICE_ID=""
ARG VITE_STRIPE_PRO_PRICE_ID=""
ENV VITE_API_URL=$VITE_API_URL \
    VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY \
    VITE_STRIPE_BASIC_PRICE_ID=$VITE_STRIPE_BASIC_PRICE_ID \
    VITE_STRIPE_PRO_PRICE_ID=$VITE_STRIPE_PRO_PRICE_ID

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

# Runtime-configurable backend + port (Render sets PORT automatically;
# BACKEND_URL points at the public server URL on Render, defaults to the
# compose-network backend for docker-compose.prod.yml self-host).
# NOTE: we do NOT use /etc/nginx/templates/*.template (its blanket envsubst
# would also rewrite nginx vars like $host/$uri). Instead docker-entrypoint.sh
# substitutes ONLY ${PORT} and ${BACKEND_URL}.
RUN apk add --no-cache gettext
ENV BACKEND_URL=http://server:5000 \
    PORT=80

# Nginx source template (uses ${PORT} and ${BACKEND_URL}; nginx $vars intact)
COPY client/nginx.conf /etc/nginx/feedwise-default.conf.tmpl
COPY client/docker-entrypoint.sh /docker-entrypoint.d/40-feedwise-envsubst.sh
RUN chmod +x /docker-entrypoint.d/40-feedwise-envsubst.sh

# Copy built files from builder stage
COPY --from=builder /app/client/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check (PORT-aware: Render overrides PORT at runtime)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD sh -c 'wget --no-verbose --tries=1 --spider http://localhost:${PORT:-80} || exit 1'

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
