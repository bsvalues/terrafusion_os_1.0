## TerraFusion.API - .NET 8 multi-stage Dockerfile (normalized to port 5000)

# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src

# Copy solution and project files for restore
COPY TerraFusion.sln ./
COPY Directory.Packages.props ./
COPY src/TerraFusion.Abstractions/*.csproj ./src/TerraFusion.Abstractions/
COPY src/TerraFusion.AI/*.csproj ./src/TerraFusion.AI/
COPY src/TerraFusion.Core/*.csproj ./src/TerraFusion.Core/
COPY src/TerraFusion.Data/*.csproj ./src/TerraFusion.Data/
COPY src/TerraFusion.API/*.csproj ./src/TerraFusion.API/
COPY src/TerraFusion.Sync/*.csproj ./src/TerraFusion.Sync/
COPY src/TerraFusion.Consciousness/*.csproj ./src/TerraFusion.Consciousness/
COPY src/TerraFusion.CostForge/*.csproj ./src/TerraFusion.CostForge/
COPY src/TerraFusion.Operations/*.csproj ./src/TerraFusion.Operations/
COPY src/TerraFusion.Levy/*.csproj ./src/TerraFusion.Levy/
COPY tests/TerraFusion.Unit.Tests/*.csproj ./tests/TerraFusion.Unit.Tests/
COPY tests/TerraFusion.Unit.SmokeTests/*.csproj ./tests/TerraFusion.Unit.SmokeTests/
COPY tests/TerraFusion.Integration.Tests/*.csproj ./tests/TerraFusion.Integration.Tests/
COPY tests/TerraFusion.Tests.Unit/*.csproj ./tests/TerraFusion.Tests.Unit/

# Restore dependencies
RUN dotnet restore TerraFusion.sln --verbosity minimal

# Copy source
COPY src/TerraFusion.Abstractions/ ./src/TerraFusion.Abstractions/
COPY src/TerraFusion.AI/ ./src/TerraFusion.AI/
COPY src/TerraFusion.Core/ ./src/TerraFusion.Core/
COPY src/TerraFusion.Data/ ./src/TerraFusion.Data/
COPY src/TerraFusion.API/ ./src/TerraFusion.API/
COPY src/TerraFusion.Sync/ ./src/TerraFusion.Sync/
COPY src/TerraFusion.Consciousness/ ./src/TerraFusion.Consciousness/
COPY src/TerraFusion.CostForge/ ./src/TerraFusion.CostForge/
COPY src/TerraFusion.Operations/ ./src/TerraFusion.Operations/
COPY src/TerraFusion.Levy/ ./src/TerraFusion.Levy/

# Publish
RUN dotnet publish src/TerraFusion.API/TerraFusion.API.csproj \
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
COPY src/TerraFusion.Abstractions/*.csproj ./src/TerraFusion.Abstractions/
COPY src/TerraFusion.AI/*.csproj ./src/TerraFusion.AI/
COPY src/TerraFusion.Core/*.csproj ./src/TerraFusion.Core/
COPY src/TerraFusion.Data/*.csproj ./src/TerraFusion.Data/
COPY src/TerraFusion.API/*.csproj ./src/TerraFusion.API/
COPY src/TerraFusion.Sync/*.csproj ./src/TerraFusion.Sync/
COPY src/TerraFusion.Consciousness/*.csproj ./src/TerraFusion.Consciousness/
COPY src/TerraFusion.CostForge/*.csproj ./src/TerraFusion.CostForge/
COPY src/TerraFusion.Operations/*.csproj ./src/TerraFusion.Operations/
COPY src/TerraFusion.Levy/*.csproj ./src/TerraFusion.Levy/
COPY tests/TerraFusion.Unit.Tests/*.csproj ./tests/TerraFusion.Unit.Tests/
COPY tests/TerraFusion.Unit.SmokeTests/*.csproj ./tests/TerraFusion.Unit.SmokeTests/
COPY tests/TerraFusion.Integration.Tests/*.csproj ./tests/TerraFusion.Integration.Tests/
COPY tests/TerraFusion.Tests.Unit/*.csproj ./tests/TerraFusion.Tests.Unit/

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
CMD ["dotnet", "watch", "--project", "src/TerraFusion.API/TerraFusion.API.csproj", "run", "--no-launch-profile"]

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
