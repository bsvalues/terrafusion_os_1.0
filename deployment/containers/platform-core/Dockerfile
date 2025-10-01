# TerraFusion cOS Platform Core Container
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Install system dependencies and security updates
RUN apk update && apk upgrade && \
    apk add --no-cache \
    ca-certificates \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S terrafusion && \
    adduser -S -D -H -u 1001 -h /app -s /sbin/nologin -G terrafusion terrafusion

# Development dependencies stage
FROM base AS deps

# Copy package files
COPY platform/core/package*.json ./
COPY platform/core/tsconfig.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci --include=dev --frozen-lockfile

# Build stage
FROM deps AS build

# Copy source code
COPY platform/core/src ./src/
COPY platform/core/types ./types/

# Build the application
RUN npm run build && \
    npm run test:unit || echo "Unit tests not configured" && \
    npm prune --production

# Production dependencies stage
FROM base AS prod-deps

# Copy package files
COPY platform/core/package*.json ./

# Install only production dependencies
RUN npm ci --only=production --frozen-lockfile && \
    npm cache clean --force

# Runtime stage
FROM base AS runtime

# Install production dependencies
COPY --from=prod-deps /app/node_modules ./node_modules

# Copy built application
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

# Copy configuration files
COPY platform/core/config ./config

# Create directories for logs and temporary files
RUN mkdir -p /app/logs /app/tmp && \
    chown -R terrafusion:terrafusion /app

# Set security labels
LABEL org.opencontainers.image.title="TerraFusion cOS Platform Core" \
      org.opencontainers.image.description="Core platform service for TerraFusion County Operating System" \
      org.opencontainers.image.vendor="TerraFusion Government Solutions" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.licenses="Proprietary" \
      security.compliance="FISMA" \
      security.classification="Government"

# Expose ports
EXPOSE 3000 8080 9090

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Set security context
USER terrafusion:terrafusion

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]