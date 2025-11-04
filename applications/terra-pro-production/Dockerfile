FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Development image, keep everything for better debugging
FROM base AS development
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV development
EXPOSE 5000
CMD ["npm", "run", "dev"]

# Production image, copy all files and build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 terrafusion
USER terrafusion

# Only copy build files and node_modules with production dependencies
COPY --from=builder --chown=terrafusion:nodejs /app/dist ./dist
COPY --from=builder --chown=terrafusion:nodejs /app/package.json ./package.json

# Install only production dependencies
RUN npm ci --only=production

# Set environment variables
ENV PORT 5000
EXPOSE 5000

# Start the server
CMD ["node", "dist/server/index.js"]