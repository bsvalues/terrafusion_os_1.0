# ══════════════════════════════════════════════════════════════════
# TerraFusion OS Frontend - Production Build (Vite + React 18)
# ══════════════════════════════════════════════════════════════════

# Stage 1: Build
# Build context is REPO ROOT (set in docker-compose). All COPY paths
# are relative to the repo root, not to this Dockerfile's directory.
FROM node:20-alpine AS build
WORKDIR /app

# Enable corepack so pnpm is available (exact pin prevents version drift)
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy workspace root config + lockfile (single source of truth)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy frontend package manifest into its workspace slot
COPY frontend/package.json frontend/package.json

# Install only the frontend workspace (frozen = deterministic + CI-safe)
# .npmrc: raise fetch-timeout and retries for Docker networking reliability
RUN echo "fetch-timeout=120000" >> .npmrc && echo "fetch-retries=5" >> .npmrc
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter ./frontend...

# Copy workspace packages (vite.config.ts resolve aliases reference packages/ui/src/)
COPY packages/ packages/

# Copy frontend source
COPY frontend/ frontend/

# Build from workspace root
WORKDIR /app/frontend

# Build production bundle
# Override outDir with absolute path: vite.config.ts root is apps/os-shell,
# so a relative --outDir would be under that root. We need /app/dist for nginx stage.
RUN npx vite build --outDir /app/dist

# Assert build produced output (fail fast, not silent 502)
RUN test -f /app/dist/index.html || (echo 'ERROR: /app/dist/index.html missing after build' && exit 1)

# Stage 2: Runtime (nginx)
FROM nginx:1.27-alpine AS production
WORKDIR /usr/share/nginx/html

# Remove default nginx content
RUN rm -rf ./*

# Copy built assets from build stage
COPY --from=build /app/dist ./

# Copy nginx configuration (server block goes to conf.d, not main nginx.conf)
# Build context is repo root, so path is frontend/nginx.conf
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Health check — nginx.conf listens on port 80
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# Stage 3: Development (with hot-reload)
# NOTE: dev stage also uses repo-root build context
FROM node:20-alpine AS development
WORKDIR /app

# Install development tools
RUN apk add --no-cache git python3 make g++
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy workspace root config + lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy frontend package manifest
COPY frontend/package.json frontend/package.json

# Install all dependencies (including dev)
RUN echo "fetch-timeout=120000" >> .npmrc && echo "fetch-retries=5" >> .npmrc
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --filter ./frontend...

# Copy frontend source
COPY frontend/ frontend/
WORKDIR /app/frontend

# Environment
ENV NODE_ENV=development
ENV VITE_API_URL=http://api:5000

# Enable hot reloading
ENV CHOKIDAR_USEPOLLING=true

EXPOSE 3000

# Start dev server with hot reload
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
