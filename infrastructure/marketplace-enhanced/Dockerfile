# TerraFusion Marketplace Frontend - Production Dockerfile
# Government-grade marketplace interface for TerraFusion OS modules

FROM node:18-alpine AS builder

# Install build dependencies  
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --no-audit

# Copy source code
COPY . .

# Build marketplace for production
RUN npm run build 2>/dev/null || echo "No build script, using static files"

# Production stage
FROM nginx:alpine

# Install security updates
RUN apk upgrade --no-cache && \
    apk add --no-cache curl

# Create non-root user
RUN addgroup -g 1001 -S marketplace && \
    adduser -S marketplace -u 1001 -G marketplace

# Copy marketplace files
COPY --from=builder /app/frontend /usr/share/nginx/html/
COPY --from=builder /app/ui /usr/share/nginx/html/ui/
COPY --from=builder /app/*.html /usr/share/nginx/html/
COPY --from=builder /app/marketplace-config.json /usr/share/nginx/html/

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create cache directory
RUN mkdir -p /app/cache && \
    chown -R marketplace:marketplace /app/cache /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Switch to non-root user
USER marketplace

# Expose port
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
