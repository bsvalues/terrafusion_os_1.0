# Multi-stage build for AI Swarm Supreme Commander
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++ git

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY config/ ./config/

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS runtime

# Install runtime dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    curl \
    ca-certificates

# Install Python AI dependencies
RUN pip3 install --no-cache-dir \
    numpy \
    pandas \
    scikit-learn \
    transformers \
    torch \
    asyncio-mqtt \
    redis \
    psycopg2-binary

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001 -G nodejs

# Copy built application
COPY --from=builder --chown=nodeuser:nodejs /app/dist ./dist
COPY --from=builder --chown=nodeuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodeuser:nodejs /app/package*.json ./

# Copy AI models and configurations
COPY --chown=nodeuser:nodejs ai-models/ ./ai-models/
COPY --chown=nodeuser:nodejs swarm-config/ ./swarm-config/

# Create necessary directories
RUN mkdir -p logs temp ai-cache && \
    chown -R nodeuser:nodejs logs temp ai-cache

# Switch to non-root user
USER nodeuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000

CMD ["node", "dist/supreme-commander.js"]