## TerraFusion.API - .NET 8 multi-stage Dockerfile (normalized to port 5000)

# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src

# Copy solution and project files for restore
COPY TerraFusion.sln ./
COPY Directory.Packages.props ./
COPY TerraFusion.Abstractions/*.csproj ./TerraFusion.Abstractions/
COPY TerraFusion.AI/*.csproj ./TerraFusion.AI/
COPY TerraFusion.Core/*.csproj ./TerraFusion.Core/
COPY TerraFusion.Data/*.csproj ./TerraFusion.Data/
COPY TerraFusion.API/*.csproj ./TerraFusion.API/
COPY TerraFusion.Sync/*.csproj ./TerraFusion.Sync/
COPY TerraFusion.Consciousness/*.csproj ./TerraFusion.Consciousness/
COPY TerraFusion.CostForge/*.csproj ./TerraFusion.CostForge/

# Restore dependencies
RUN dotnet restore TerraFusion.sln --verbosity minimal

# Copy source
COPY TerraFusion.Abstractions/ ./TerraFusion.Abstractions/
COPY TerraFusion.AI/ ./TerraFusion.AI/
COPY TerraFusion.Core/ ./TerraFusion.Core/
COPY TerraFusion.Data/ ./TerraFusion.Data/
COPY TerraFusion.API/ ./TerraFusion.API/
COPY TerraFusion.Sync/ ./TerraFusion.Sync/
COPY TerraFusion.Consciousness/ ./TerraFusion.Consciousness/
COPY TerraFusion.CostForge/ ./TerraFusion.CostForge/

# Publish
RUN dotnet publish TerraFusion.API/TerraFusion.API.csproj \
    -c Release \
    -o /app/publish \
    --no-restore \
    --verbosity minimal

# Stage 2: Development (with hot-reload)
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS development
WORKDIR /app

# Copy project files for restore
COPY TerraFusion.sln ./
COPY Directory.Packages.props ./
COPY TerraFusion.Abstractions/*.csproj ./TerraFusion.Abstractions/
COPY TerraFusion.AI/*.csproj ./TerraFusion.AI/
COPY TerraFusion.Core/*.csproj ./TerraFusion.Core/
COPY TerraFusion.Data/*.csproj ./TerraFusion.Data/
COPY TerraFusion.API/*.csproj ./TerraFusion.API/
COPY TerraFusion.Sync/*.csproj ./TerraFusion.Sync/
COPY TerraFusion.Consciousness/*.csproj ./TerraFusion.Consciousness/
COPY TerraFusion.CostForge/*.csproj ./TerraFusion.CostForge/

# Restore
RUN dotnet restore TerraFusion.sln --verbosity minimal

# Copy all source
COPY . ./

# Install EF Core tools
RUN dotnet tool install --global dotnet-ef --version 8.0.*
ENV PATH="$PATH:/root/.dotnet/tools"

# Configure environment
ENV ASPNETCORE_ENVIRONMENT=Development
ENV ASPNETCORE_URLS=http://0.0.0.0:5000

EXPOSE 5000

# Use watch for hot-reload
CMD ["dotnet", "watch", "--project", "TerraFusion.API/TerraFusion.API.csproj", "run", "--no-launch-profile"]

# Stage 3: Runtime (Production)
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS runtime
WORKDIR /app

# Security: run as non-root
RUN addgroup -g 1001 -S terrafusion && adduser -S terrafusion -u 1001 -G terrafusion
USER terrafusion

# Configure app to listen on port 5000
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://0.0.0.0:5000

# Copy published app
COPY --from=build /app/publish ./

# Expose and healthcheck
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:5000/health || exit 1

ENTRYPOINT ["dotnet","TerraFusion.API.dll"]
