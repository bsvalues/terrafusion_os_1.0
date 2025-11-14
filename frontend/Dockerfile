# ══════════════════════════════════════════════════════════════════
# TerraFusion OS Frontend - Production Build (Vite + React 18)
# ══════════════════════════════════════════════════════════════════

# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source
COPY . .

# Build production bundle
RUN npm run build

# Stage 2: Runtime (nginx)
FROM nginx:alpine AS production
WORKDIR /usr/share/nginx/html

# Remove default nginx content
RUN rm -rf ./*

# Copy built assets from build stage
COPY --from=build /app/dist ./

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:3000/ || exit 1

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]

# Stage 3: Development (with hot-reload)
FROM node:20-alpine AS development
WORKDIR /app

# Install development tools
RUN apk add --no-cache git python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev) with legacy peer deps for Storybook compatibility
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Environment
ENV NODE_ENV=development
ENV VITE_API_URL=http://api:5000

# Enable hot reloading
ENV CHOKIDAR_USEPOLLING=true

EXPOSE 3000

# Start dev server with hot reload
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
