## TerraFusion.API - .NET 8 multi-stage Dockerfile (normalized to port 5000)

# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src
ARG GIT_SHA=unknown

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
COPY src/TerraFusion.CurrentUse/*.csproj ./src/TerraFusion.CurrentUse/
COPY src/TerraFusion.Operations/*.csproj ./src/TerraFusion.Operations/
COPY src/TerraFusion.Levy/*.csproj ./src/TerraFusion.Levy/
COPY tools/TerraFusion.AuthProvisioner/*.csproj ./tools/TerraFusion.AuthProvisioner/

# Restore dependencies (project-level restore resolves transitive deps without
# requiring test projects, which are excluded by .dockerignore)
RUN dotnet restore src/TerraFusion.API/TerraFusion.API.csproj --verbosity minimal
RUN dotnet restore tools/TerraFusion.AuthProvisioner/TerraFusion.AuthProvisioner.csproj --verbosity minimal

# Copy source
COPY src/TerraFusion.Abstractions/ ./src/TerraFusion.Abstractions/
COPY src/TerraFusion.AI/ ./src/TerraFusion.AI/
COPY src/TerraFusion.Core/ ./src/TerraFusion.Core/
COPY src/TerraFusion.Data/ ./src/TerraFusion.Data/
COPY src/TerraFusion.API/ ./src/TerraFusion.API/
COPY src/TerraFusion.Sync/ ./src/TerraFusion.Sync/
COPY src/TerraFusion.Consciousness/ ./src/TerraFusion.Consciousness/
COPY src/TerraFusion.CostForge/ ./src/TerraFusion.CostForge/
COPY src/TerraFusion.CurrentUse/ ./src/TerraFusion.CurrentUse/
COPY src/TerraFusion.Operations/ ./src/TerraFusion.Operations/
COPY src/TerraFusion.Levy/ ./src/TerraFusion.Levy/
COPY tools/TerraFusion.AuthProvisioner/ ./tools/TerraFusion.AuthProvisioner/

# Publish
RUN dotnet publish src/TerraFusion.API/TerraFusion.API.csproj \
    -c Release \
    -o /app/publish \
    --no-restore \
    /p:SourceRevisionId="${GIT_SHA}" \
    --verbosity minimal

RUN dotnet publish tools/TerraFusion.AuthProvisioner/TerraFusion.AuthProvisioner.csproj \
    -c Release \
    -o /app/auth-provisioner \
    --no-restore \
    --verbosity minimal

# Fail before image export if any emitted project retains a vulnerable dependency identity.
RUN grep -q -E '"(Microsoft\.Kiota\.Abstractions/1\.9\.1|Npgsql/8\.0\.0|SQLitePCLRaw\.lib\.e_sqlite3/2\.1\.6)"' \
    /app/publish/*.deps.json /app/auth-provisioner/*.deps.json; \
    test "$?" -eq 1

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
COPY src/TerraFusion.CurrentUse/*.csproj ./src/TerraFusion.CurrentUse/
COPY src/TerraFusion.Operations/*.csproj ./src/TerraFusion.Operations/
COPY src/TerraFusion.Levy/*.csproj ./src/TerraFusion.Levy/

# Restore (project-level to avoid test project dependency)
RUN dotnet restore src/TerraFusion.API/TerraFusion.API.csproj --verbosity minimal

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

# Exact digest-bound Forge payload is supplied as a named BuildKit context.
FROM forge-valuation-kernel AS forge-valuation-kernel-payload

# Stage 3: Runtime (Production)
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS runtime
WORKDIR /app
ARG GIT_SHA=unknown

# Security: run as non-root
RUN addgroup -g 1001 -S terrafusion && adduser -S terrafusion -u 1001 -G terrafusion
USER terrafusion

# Configure app to listen on port 5000
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://0.0.0.0:5000
ENV TF_GIT_SHA=${GIT_SHA}
ENV RustKernels__ValuationKernelPath=/app/.terrafusion/runtime/forge/valuation/terraforge-kernel-valuation
ENV RustKernels__ValuationKernelManifestPath=/app/.terrafusion/runtime/forge/valuation/producer-manifest.json
ENV RustKernels__ValuationKernelSourceCommit=24059c3642339f36877cb454ca63683180915b71
ENV RustKernels__ValuationKernelArtifactType=terraforge.valuation-kernel.linux-x64-musl@1
ENV RustKernels__ValuationKernelProducerCommit=3fc296da17aaca4c32dd9b727ab62d2d3725d789
ENV RustKernels__ValuationKernelProducerManifestSha256=3d83a4a998eabb30b2993e6c777ae5924ca2a7e6f1bd915f7698606fd077fcd6
ENV RustKernels__ValuationKernelExecutableSha256=a371d8f421b66cd2f83073ed108c885facc97323f9a351547d7293259978c298

# Copy published app and the exact Forge producer payload.
COPY --from=build /app/publish ./
COPY --from=build /app/auth-provisioner ./tools/TerraFusion.AuthProvisioner/
COPY --from=forge-valuation-kernel-payload --chmod=0555 /terraforge-kernel-valuation /app/.terrafusion/runtime/forge/valuation/terraforge-kernel-valuation
COPY --from=forge-valuation-kernel-payload --chmod=0444 /manifest.json /app/.terrafusion/runtime/forge/valuation/producer-manifest.json

# Expose and healthcheck
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget -qO- http://127.0.0.1:5000/health || exit 1

ENTRYPOINT ["dotnet","TerraFusion.API.dll"]
