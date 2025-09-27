# TerraFusion cOS 2.0 - Frontend Dockerfile
# MIT PhD Systems Design Engineer Standards

FROM node:18-alpine

# Set environment variables
ENV NODE_ENV=development
ENV VITE_API_URL=http://localhost:8000

# Install dependencies
RUN apk add --no-cache git

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
