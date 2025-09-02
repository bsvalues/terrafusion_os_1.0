# TerraFusion OS 1.0 - Production Dockerfile
# Government-Grade Security | Multi-Stage Build | Performance Optimized
# Target: Production Government Deployment with 1,008 AI Agents

# Stage 1: Build Environment
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build-env
LABEL maintainer="TerraFusion Production Engineering"
LABEL version="1.0.0"
LABEL environment="production"
LABEL security.level="government-grade"
LABEL ai.agents="1008"
LABEL compliance="FISMA,FedRAMP,SOC2"

# Install build dependencies
RUN apk add --no-cache \
    curl \
    git \
    ca-certificates \
    openssl \
    && update-ca-certificates \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /src

# Copy solution file first
COPY backend/TerraFusion.sln ./

# Copy all project files
COPY backend/TerraFusion.Abstractions/*.csproj ./TerraFusion.Abstractions/
COPY backend/TerraFusion.Core/*.csproj ./TerraFusion.Core/
COPY backend/TerraFusion.Data/*.csproj ./TerraFusion.Data/
COPY backend/TerraFusion.API/*.csproj ./TerraFusion.API/

# Copy Directory.Packages.props if it exists
COPY backend/Directory.Packages.prop[s] ./

# Restore dependencies
RUN dotnet restore TerraFusion.sln --verbosity minimal

# Copy source code
COPY backend/TerraFusion.Abstractions/ ./TerraFusion.Abstractions/
COPY backend/TerraFusion.Core/ ./TerraFusion.Core/
COPY backend/TerraFusion.Data/ ./TerraFusion.Data/
COPY backend/TerraFusion.API/ ./TerraFusion.API/

# Build application
RUN dotnet publish TerraFusion.API/TerraFusion.API.csproj \
    -c Release \
    -o /app/publish \
    --no-restore \
    --verbosity minimal \
    /p:PublishTrimmed=false \
    /p:PublishSingleFile=false \
    /p:TreatWarningsAsErrors=false

# Stage 2: Production Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS production
LABEL maintainer="TerraFusion Production Engineering"
LABEL version="1.0.0"
LABEL environment="production"
LABEL security.level="government-grade"

# Install production runtime dependencies
RUN apk add --no-cache \
    curl \
    ca-certificates \
    tzdata \
    icu-libs \
    libgcc \
    libssl3 \
    libcrypto3 \
    && update-ca-certificates \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S terrafusion && \
    adduser -S terrafusion -u 1001 -G terrafusion

# Set working directory
WORKDIR /app

# Copy published application
COPY --from=build-env --chown=terrafusion:terrafusion /app/publish ./

# Create required directories
RUN mkdir -p /app/logs /app/data /app/temp && \
    chown -R terrafusion:terrafusion /app

# Configure environment
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:8080;https://+:8443
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false
ENV DOTNET_EnableDiagnostics=0
ENV DOTNET_USE_POLLING_FILE_WATCHER=true
ENV DOTNET_RUNNING_IN_CONTAINER=true

# Set security and performance optimizations
ENV COMPlus_EnableDiagnostics=0
ENV DOTNET_gcServer=1
ENV DOTNET_gcConcurrent=1
ENV DOTNET_GCRetainVM=1

# Switch to non-root user
USER terrafusion

# Expose ports
EXPOSE 8080 8443

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Entry point
ENTRYPOINT ["dotnet", "TerraFusion.API.dll"]
