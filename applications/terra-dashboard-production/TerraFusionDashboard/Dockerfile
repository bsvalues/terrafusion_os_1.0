# TerraFusion Platform - Production Container Configuration
# Multi-stage build for optimal performance
FROM node:20-alpine as builder

# Set work directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine as production

# Install runtime dependencies
RUN apk add --no-cache curl postgresql-client

# Create application user
RUN addgroup -g 1001 -S terrafusion && \
    adduser -S -D -H -u 1001 -s /sbin/nologin -G terrafusion terrafusion

# Set work directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared

# Create necessary directories
RUN mkdir -p /app/logs /app/data && \
    chown -R terrafusion:terrafusion /app

# Switch to non-root user
USER terrafusion

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5000/api/system/health || exit 1

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "run", "dev"]