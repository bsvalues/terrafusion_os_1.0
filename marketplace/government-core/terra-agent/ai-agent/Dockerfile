# Day 4 - Production Deployment
# TerraAgent AI + MCP Server Docker Container

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY dist/ ./dist/
COPY .env.example ./.env

# Create non-root user
RUN addgroup -g 1001 -S terraagent && \
    adduser -S terraagent -u 1001

# Set ownership
RUN chown -R terraagent:terraagent /app
USER terraagent

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Start command
CMD ["node", "dist/index.js"]
