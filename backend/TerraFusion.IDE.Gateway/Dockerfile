# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files
COPY ["TerraFusion.IDE.Gateway/TerraFusion.IDE.Gateway.csproj", "TerraFusion.IDE.Gateway/"]
COPY ["../TerraFusion.Core/TerraFusion.Core.csproj", "TerraFusion.Core/"]
COPY ["../TerraFusion.Security/TerraFusion.Security.csproj", "TerraFusion.Security/"]

# Restore dependencies
RUN dotnet restore "TerraFusion.IDE.Gateway/TerraFusion.IDE.Gateway.csproj"

# Copy source code
COPY . .

# Build and publish
WORKDIR "/src/TerraFusion.IDE.Gateway"
RUN dotnet build "TerraFusion.IDE.Gateway.csproj" -c Release -o /app/build
RUN dotnet publish "TerraFusion.IDE.Gateway.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Create logs directory
RUN mkdir -p /app/logs

# Copy published application
COPY --from=build /app/publish .

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser && chown -R appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:7000/health || exit 1

EXPOSE 7000

ENTRYPOINT ["dotnet", "TerraFusion.IDE.Gateway.dll"]