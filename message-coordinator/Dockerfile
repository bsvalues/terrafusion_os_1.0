# TerraFusion Message Coordinator Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY . .

# Create logs directory
RUN mkdir -p /app/logs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1

# Non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S terrafusion -u 1001
USER terrafusion

EXPOSE 3002

CMD ["node", "index.js"]