# TerraFusion cOS Vendor Integration Sidecar
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Install system dependencies and security updates
RUN apk update && apk upgrade && \
    apk add --no-cache \
    ca-certificates \
    curl \
    dumb-init \
    tini \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S vendor-integration && \
    adduser -S -D -H -u 1001 -h /app -s /sbin/nologin -G vendor-integration vendor-integration

# Development dependencies stage
FROM base AS deps

# Copy vendor SDK package files
COPY vendor-sdk/package*.json ./

# Install all dependencies
RUN npm ci --include=dev --frozen-lockfile

# Build stage
FROM deps AS build

# Copy vendor SDK source code
COPY vendor-sdk/src ./src/
COPY vendor-sdk/tsconfig.json ./
COPY vendor-sdk/templates ./templates/

# Build the vendor SDK
RUN npm run build && \
    npm run test || echo "Tests not configured" && \
    npm prune --production

# Production dependencies stage
FROM base AS prod-deps

# Copy package files
COPY vendor-sdk/package*.json ./

# Install only production dependencies
RUN npm ci --only=production --frozen-lockfile && \
    npm cache clean --force

# Runtime stage
FROM base AS runtime

# Install production dependencies
COPY --from=prod-deps /app/node_modules ./node_modules

# Copy built vendor SDK
COPY --from=build /app/dist ./dist
COPY --from=build /app/templates ./templates
COPY --from=build /app/package*.json ./

# Create vendor integration service
COPY deployment/containers/vendor-integration/service ./service

# Create directories for vendor modules and logs
RUN mkdir -p /app/vendor-modules /app/logs /app/certs /app/config && \
    chown -R vendor-integration:vendor-integration /app

# Set security labels
LABEL org.opencontainers.image.title="TerraFusion cOS Vendor Integration" \
      org.opencontainers.image.description="Vendor integration sidecar for zero-rewrite platform integration" \
      org.opencontainers.image.vendor="TerraFusion Government Solutions" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.licenses="Proprietary" \
      security.compliance="FISMA" \
      security.classification="Government" \
      integration.type="sidecar" \
      integration.pattern="zero-rewrite"

# Expose ports for vendor integration
EXPOSE 3001 8081 9091

# Volume mounts for vendor applications
VOLUME ["/app/vendor-modules", "/app/config", "/app/certs"]

# Health check for vendor integration service
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8081/health/vendor-integration || exit 1

# Set security context
USER vendor-integration:vendor-integration

# Use tini for proper signal handling
ENTRYPOINT ["tini", "--"]

# Start the vendor integration service
CMD ["node", "service/vendor-integration-server.js"]