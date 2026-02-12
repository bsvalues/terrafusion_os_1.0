# TerraFusion Enterprise Deployment Dockerfile
# Multi-stage build for optimal production image

# Stage 1: Build environment
FROM node:18-alpine AS builder

# Install security updates and build dependencies
RUN apk update && apk upgrade && apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY packages/*/package.json ./packages/*/

# Install dependencies with production optimizations
RUN npm ci --only=production --ignore-scripts

# Copy source code
COPY . .

# Copy theme configuration to root for build
COPY config/theme.json ./theme.json

# Build client and server
RUN npm run build:production

# Stage 2: Production runtime
FROM node:18-alpine AS runtime

# Create non-root user for security
RUN addgroup -g 1001 -S terrafusion && \
    adduser -S terrafusion -u 1001

# Install runtime dependencies and security updates
RUN apk update && apk upgrade && apk add --no-cache \
    dumb-init \
    curl \
    postgresql-client \
    redis \
    nginx

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=terrafusion:terrafusion /app/dist ./dist
COPY --from=builder --chown=terrafusion:terrafusion /app/node_modules ./node_modules
COPY --from=builder --chown=terrafusion:terrafusion /app/package.json ./package.json
COPY --from=builder --chown=terrafusion:terrafusion /app/shared ./shared

# Copy production configuration files
COPY --chown=terrafusion:terrafusion config/production/ ./config/
COPY --chown=terrafusion:terrafusion scripts/production/ ./scripts/

# Create necessary directories
RUN mkdir -p /app/logs /app/uploads /app/backups && \
    chown -R terrafusion:terrafusion /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Expose port
EXPOSE 3000

# Switch to non-root user
USER terrafusion

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/index.js"]

# Use official Node.js LTS image
FROM node:18-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install --production

# Copy source code
COPY . .

# Build Next.js app
RUN npm run build

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "start"] 