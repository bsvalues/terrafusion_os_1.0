# TerraFusion OS 1.0 - Multi-stage Docker Build
# Production-ready containerization

# Stage 1: Backend Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS backend-build
WORKDIR /src

# Copy backend solution and projects
COPY backend/*.sln ./
COPY backend/TerraFusion.API/*.csproj ./TerraFusion.API/
COPY backend/TerraFusion.Core/*.csproj ./TerraFusion.Core/
COPY backend/TerraFusion.Data/*.csproj ./TerraFusion.Data/
COPY backend/TerraFusion.Abstractions/*.csproj ./TerraFusion.Abstractions/

# Restore dependencies
RUN dotnet restore

# Copy source code
COPY backend/ ./

# Build backend
RUN dotnet publish TerraFusion.API/TerraFusion.API.csproj -c Release -o /app/backend

# Stage 2: Frontend Build
FROM node:20-alpine AS frontend-build
WORKDIR /src

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build frontend
RUN npm run build

# Stage 3: AI Services Build
FROM node:20-alpine AS ai-services-build
WORKDIR /src

# Copy AI services
COPY compose/ai-services/package*.json ./
RUN npm ci

COPY compose/ai-services/*.js ./

# Stage 4: Runtime Image
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

# Install Node.js for AI services
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 terrafusion && \
    chown -R terrafusion:terrafusion /app

# Copy backend from build stage
COPY --from=backend-build --chown=terrafusion:terrafusion /app/backend ./backend

# Copy frontend from build stage
COPY --from=frontend-build --chown=terrafusion:terrafusion /src/dist ./frontend

# Copy AI services from build stage
COPY --from=ai-services-build --chown=terrafusion:terrafusion /src ./ai-services

# Copy scripts and configuration
COPY --chown=terrafusion:terrafusion scripts/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

# Install netcat for service checks
RUN apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/*

# Create data directory for SQLite
RUN mkdir -p /app/data && chown terrafusion:terrafusion /app/data

# Environment variables
ENV ASPNETCORE_URLS=http://+:5000 \
    ASPNETCORE_ENVIRONMENT=Production \
    NODE_ENV=production \
    DATABASE_PATH=/app/data/terrafusion.db

# Expose ports
EXPOSE 5000 3000 3001 3002 3003

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Switch to non-root user
USER terrafusion

# Entry point
ENTRYPOINT ["./docker-entrypoint.sh"]
