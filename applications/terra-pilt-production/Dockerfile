# TerraFusionPilt - Optimized Production Container
# Multi-stage build for minimal production image

# Stage 1: Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./

# Install dependencies
RUN npm ci --only=production --silent

# Copy source code
COPY client/ ./client/
COPY server/ ./server/
COPY shared/ ./shared/

# Build application
RUN npm run build

# Stage 2: Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S terrafusion -u 1001

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production --silent && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=terrafusion:nodejs /app/dist ./dist
COPY --from=builder --chown=terrafusion:nodejs /app/client/dist ./client/dist

# Copy necessary runtime files
COPY --chown=terrafusion:nodejs server/config ./server/config
COPY --chown=terrafusion:nodejs server/utils ./server/utils

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5009
ENV DATABASE_URL=""

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const http = require('http'); \
    const options = { host: 'localhost', port: 5009, path: '/api/health', timeout: 2000 }; \
    const req = http.request(options, (res) => { \
    if (res.statusCode === 200) process.exit(0); \
    else process.exit(1); \
    }); \
    req.on('error', () => process.exit(1)); \
    req.end();"

# Switch to non-root user
USER terrafusion

# Expose port
EXPOSE 5009

# Start application
CMD ["node", "dist/index.js"]

# Metadata
LABEL maintainer="TerraFusion Team"
LABEL version="2.0.0"
LABEL description="TerraFusionPilt - AI That Understands Land" 