# TFT-187: Multi-stage Dockerfile for TerraFusion Frontend
# Build: docker build -t terrafusion-frontend .  (from repo root)
# Run:   docker run -p 3000:80 terrafusion-frontend

# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
ARG VITE_BUILD_SHA=dev
ENV VITE_BUILD_SHA=$VITE_BUILD_SHA

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy workspace root config + lockfile (single source of truth)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy frontend package manifest and deterministic dependency-evidence generator
COPY frontend/package.json frontend/package.json
COPY scripts/ci/frontend_dependency_sbom.mjs scripts/ci/frontend_dependency_sbom.mjs

# Install dependencies (frozen = deterministic + CI-safe), then capture both the
# browser production closure and the complete dependency closure used by this build.
RUN echo "fetch-timeout=120000" >> .npmrc && echo "fetch-retries=5" >> .npmrc
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter ./frontend...
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm licenses list --json --prod --filter ./frontend... > /tmp/frontend-browser-production-licenses.json \
    && node scripts/ci/frontend_dependency_sbom.mjs \
       /tmp/frontend-browser-production-licenses.json /app/frontend-dependencies.spdx.json browser-production \
    && pnpm licenses list --json --filter ./frontend... > /tmp/frontend-docker-build-licenses.json \
    && node scripts/ci/frontend_dependency_sbom.mjs \
       /tmp/frontend-docker-build-licenses.json /app/frontend-build-dependencies.spdx.json docker-build \
    && rm /tmp/frontend-browser-production-licenses.json /tmp/frontend-docker-build-licenses.json

# Copy workspace packages (vite resolve aliases)
COPY packages/ packages/

# Copy frontend source
COPY frontend/ frontend/

# Build production bundle
WORKDIR /app/frontend
RUN NODE_OPTIONS="--max-old-space-size=4096" pnpm exec vite build --outDir /app/dist

# Assert build produced output
RUN test -f /app/dist/index.html || (echo 'ERROR: /app/dist/index.html missing after build' && exit 1)

# ── Runtime stage ────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production
WORKDIR /usr/share/nginx/html

# Remove default nginx content
RUN rm -rf ./*

# Copy built assets
COPY --from=build /app/dist ./

# Preserve the exact dependency-resolution inputs that produced this bundle.
# This path is outside the nginx document root, so it is available to image
# inventory tooling without being served to end users.
RUN mkdir -p /usr/share/terrafusion/sbom/frontend
COPY --from=build /app/package.json /usr/share/terrafusion/sbom/package.json
COPY --from=build /app/pnpm-lock.yaml /usr/share/terrafusion/sbom/pnpm-lock.yaml
COPY --from=build /app/pnpm-workspace.yaml /usr/share/terrafusion/sbom/pnpm-workspace.yaml
COPY --from=build /app/frontend/package.json /usr/share/terrafusion/sbom/frontend/package.json
COPY --from=build /app/frontend-dependencies.spdx.json /usr/share/terrafusion/sbom/frontend-dependencies.spdx.json
COPY --from=build /app/frontend-build-dependencies.spdx.json /usr/share/terrafusion/sbom/frontend-build-dependencies.spdx.json

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
