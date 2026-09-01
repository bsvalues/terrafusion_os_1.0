# TFT-187: Multi-stage Dockerfile for TerraFusion Frontend
# Build: docker build -t terrafusion-frontend .  (from repo root)
# Run:   docker run -p 3000:80 terrafusion-frontend

# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
ARG VITE_BUILD_SHA=dev
ENV VITE_BUILD_SHA=$VITE_BUILD_SHA
ARG VITE_WASHINGTON_LAUNCH_MANIFEST_SHA256
ARG WASHINGTON_LAUNCH_DATA_SOURCE_URL
ENV VITE_WASHINGTON_LAUNCH_MANIFEST_SHA256=$VITE_WASHINGTON_LAUNCH_MANIFEST_SHA256

# Missing public-data inputs are a supported navigation-only posture: the shell
# still exposes all 39 counties and reports unsupported county data honestly.
# A configured public-data package remains fail closed and must supply both its
# credential-free source and exact manifest trust pin.
RUN launch_pin="$VITE_WASHINGTON_LAUNCH_MANIFEST_SHA256"; \
    launch_source="$WASHINGTON_LAUNCH_DATA_SOURCE_URL"; \
    if [ -z "$launch_pin" ] && [ -z "$launch_source" ]; then \
      echo 'Building the Washington navigation-only fallback without hosted county data'; \
    elif [ -z "$launch_pin" ] || [ -z "$launch_source" ]; then \
      echo 'ERROR: VITE_WASHINGTON_LAUNCH_MANIFEST_SHA256 and WASHINGTON_LAUNCH_DATA_SOURCE_URL must be supplied together' && exit 1; \
    else \
      printf '%s' "$launch_pin" | grep -Eq '^[0-9a-f]{64}$' \
        || (echo 'ERROR: VITE_WASHINGTON_LAUNCH_MANIFEST_SHA256 must be a lowercase SHA-256 digest' && exit 1); \
    fi

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy workspace root config, lockfile, and deterministic pnpm patches.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches/ patches/

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

# When configured, package the exact public Washington JSON surface attested by
# the client pin. The credential-free HTTPS packager fetches only read-only
# manifest/status/advertised-detail/attested-shard routes, checks every digest
# and public provenance claim, and refuses an empty assessor package. Without a
# configured pair, preserve an empty static route for the shell's honest
# navigation-only fallback.
COPY scripts/ci/package_washington_launch_data.mjs scripts/ci/package_washington_launch_data.mjs
COPY frontend/apps/os-shell/src/lib/washingtonPublicSourceInventory.data.json frontend/apps/os-shell/src/lib/washingtonPublicSourceInventory.data.json
RUN if [ -n "$VITE_WASHINGTON_LAUNCH_MANIFEST_SHA256" ]; then \
      node scripts/ci/package_washington_launch_data.mjs \
        "$WASHINGTON_LAUNCH_DATA_SOURCE_URL" \
        "$VITE_WASHINGTON_LAUNCH_MANIFEST_SHA256" \
        /app/washington-launch-data; \
    else \
      mkdir -p /app/washington-launch-data; \
    fi

# Copy workspace packages (vite resolve aliases)
COPY packages/ packages/

# Copy frontend source
COPY frontend/ frontend/

# The tracked package supports local exact-package acceptance, but production
# images receive Washington launch data only through the deployment-pinned
# packager above. Remove the tracked copy before Vite copies public assets so a
# navigation-only image cannot serve or activate county data without its pin.
RUN rm -rf /app/frontend/apps/os-shell/public/launch-data/washington

# Build production bundle
WORKDIR /app/frontend
RUN NODE_OPTIONS="--max-old-space-size=4096" pnpm exec vite build --outDir /app/dist

# Assert build produced output
RUN test -f /app/dist/index.html || (echo 'ERROR: /app/dist/index.html missing after build' && exit 1)

# ── Runtime stage ────────────────────────────────────────────────────────────
FROM nginx:1.30.4-alpine3.24@sha256:97d490c12ba55b4946b01546d1c3ed324e8d41ab1c9fcb2a616aa470620e5b46 AS production
WORKDIR /usr/share/nginx/html

# Remove default nginx content
RUN rm -rf ./*

# Copy built assets
COPY --from=build /app/dist ./

# Configured same-origin public launch data travels with the bundle whose pin
# authenticates it; the navigation-only image copies an empty directory.
COPY --from=build /app/washington-launch-data ./launch-data/washington/

# Preserve the exact dependency-resolution inputs that produced this bundle.
# This path is outside the nginx document root, so it is available to image
# inventory tooling without being served to end users.
RUN mkdir -p /usr/share/terrafusion/sbom/frontend /usr/share/terrafusion/sbom/patches
COPY --from=build /app/package.json /usr/share/terrafusion/sbom/package.json
COPY --from=build /app/pnpm-lock.yaml /usr/share/terrafusion/sbom/pnpm-lock.yaml
COPY --from=build /app/pnpm-workspace.yaml /usr/share/terrafusion/sbom/pnpm-workspace.yaml
COPY --from=build /app/frontend/package.json /usr/share/terrafusion/sbom/frontend/package.json
COPY --from=build /app/patches/@mapbox__jsonlint-lines-primitives@2.0.2.patch /usr/share/terrafusion/sbom/patches/@mapbox__jsonlint-lines-primitives@2.0.2.patch
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
COPY patches/ patches/
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
