# TFT-187: Multi-stage Dockerfile for TerraFusion Frontend
# Build: docker build -t terrafusion-frontend .  (from repo root)
# Run:   docker run -p 3000:80 terrafusion-frontend

# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy workspace root config + lockfile (single source of truth)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy frontend package manifest
COPY frontend/package.json frontend/package.json

# Install dependencies (frozen = deterministic + CI-safe)
RUN echo "fetch-timeout=120000" >> .npmrc && echo "fetch-retries=5" >> .npmrc
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter ./frontend...

# Copy workspace packages (vite resolve aliases)
COPY packages/ packages/

# Copy frontend source
COPY frontend/ frontend/

# Build production bundle
WORKDIR /app/frontend
RUN npx vite build --outDir /app/dist

# Assert build produced output
RUN test -f /app/dist/index.html || (echo 'ERROR: /app/dist/index.html missing after build' && exit 1)

# ── Runtime stage ────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production
WORKDIR /usr/share/nginx/html

# Remove default nginx content
RUN rm -rf ./*

# Copy built assets
COPY --from=build /app/dist ./

# Copy nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:80/ || exit 1

EXPOSE 80

LABEL org.opencontainers.image.title="TerraFusion Frontend" \
      org.opencontainers.image.description="TerraFusion OS React Frontend" \
      org.opencontainers.image.vendor="TerraFusion" \
      terrafusion.component="frontend" \
      terrafusion.compliance="FISMA-High"

CMD ["nginx", "-g", "daemon off;"]

# ── Development stage ────────────────────────────────────────────────────────
FROM node:20-alpine AS development
WORKDIR /app

RUN apk add --no-cache git python3 make g++
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json frontend/package.json

RUN echo "fetch-timeout=120000" >> .npmrc && echo "fetch-retries=5" >> .npmrc
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --filter ./frontend...

COPY frontend/ frontend/
WORKDIR /app/frontend

ENV NODE_ENV=development
ENV VITE_API_URL=http://api:5000
ENV CHOKIDAR_USEPOLLING=true

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
