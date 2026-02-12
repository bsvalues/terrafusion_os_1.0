# TerraFusion API Gateway - Quantum-Optimized Load Balancing
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy nginx configuration (from services/api-gateway/ directory)
COPY services/api-gateway/nginx.conf /etc/nginx/nginx.conf

# Expose ports
EXPOSE 8086

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:8086/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
