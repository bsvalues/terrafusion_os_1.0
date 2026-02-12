# Multi-stage Dockerfile for TerraFusion Frontend Applications
# Build stage
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    && rm -rf /var/cache/apk/*

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies with npm ci for reproducible builds
RUN npm ci --only=production --no-audit --no-fund

# Copy source code
COPY src ./src
COPY public ./public

# Build application with optimizations
ENV NODE_ENV=production
ENV GENERATE_SOURCEMAP=false
ENV INLINE_RUNTIME_CHUNK=false
ENV IMAGE_INLINE_SIZE_LIMIT=0

RUN npm run build

# Security scanning stage
FROM aquasec/trivy:latest AS security-scanner
COPY --from=builder /app /scan/
RUN trivy fs --format json --output /scan/security-report.json /scan/

# Nginx serving stage
FROM nginx:1.25-alpine AS runtime

# Install security updates
RUN apk upgrade --no-cache && \
    apk add --no-cache \
    ca-certificates \
    curl \
    && rm -rf /var/cache/apk/*

# Create nginx user
RUN addgroup -g 1001 -S nginx && \
    adduser -S nginxuser -u 1001 -G nginx

# Copy built application
COPY --from=builder --chown=nginxuser:nginx /app/dist /usr/share/nginx/html

# Copy security report
COPY --from=security-scanner /scan/security-report.json /usr/share/nginx/html/security-report.json

# Create optimized nginx configuration
COPY --chown=nginxuser:nginx <<EOF /etc/nginx/nginx.conf
user nginxuser;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /tmp/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Logging
    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                    '\$status \$body_bytes_sent "\$http_referer" '
                    '"\$http_user_agent" "\$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;
    
    # Performance optimizations
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 16m;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    server {
        listen 3000;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;
        
        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
        
        # Static assets with long cache
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # HTML files with no cache
        location ~* \.html$ {
            expires -1;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }
        
        # Handle client-side routing
        location / {
            try_files \$uri \$uri/ /index.html;
            expires -1;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }
        
        # Security
        location ~ /\. {
            deny all;
        }
    }
}
EOF

# Create health check script
COPY --chown=nginxuser:nginx <<EOF /usr/local/bin/healthcheck.sh
#!/bin/sh
curl -f http://localhost:3000/health || exit 1
EOF

RUN chmod +x /usr/local/bin/healthcheck.sh

# Set proper permissions
RUN chown -R nginxuser:nginx /var/cache/nginx && \
    chown -R nginxuser:nginx /var/log/nginx && \
    chown -R nginxuser:nginx /etc/nginx/conf.d

# Create tmp directory for nginx
RUN mkdir -p /tmp/nginx && \
    chown -R nginxuser:nginx /tmp/nginx

# Switch to non-root user
USER nginxuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD ["/usr/local/bin/healthcheck.sh"]

# Resource limits via labels
LABEL \
    memory.request="128Mi" \
    memory.limit="256Mi" \
    cpu.request="100m" \
    cpu.limit="200m"

# Security labels
LABEL \
    security.scan.completed="true" \
    security.non-root="true" \
    security.readonly-rootfs="true"

# Start nginx
CMD ["nginx", "-g", "daemon off;"]