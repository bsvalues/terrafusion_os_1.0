# TerraFusion Government OS - Demo API Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --silent

# Copy source code
COPY . .

# Create data directory
RUN mkdir -p /app/data

# Add demo metadata labels
LABEL org.terrafusion.service="demo-api-server" \
      org.terrafusion.version="1.0.0" \
      org.terrafusion.county="Benton County" \
      org.terrafusion.demo="true" \
      org.terrafusion.properties="89247" \
      org.terrafusion.ai-agents="1008" \
      org.terrafusion.performance="949x"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))" || exit 1

# Expose port
EXPOSE 8080

# Start server
CMD ["node", "demo-api-server.js"]