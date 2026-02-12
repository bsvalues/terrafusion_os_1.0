# TerraFusion Harris PACS Bridge - Legacy System Integration Build
# Harris PACS v9.0 integration with championship data synchronization
FROM rust:1.83-bookworm AS builder

WORKDIR /build

# Step 1: Copy workspace configuration and lockfile
COPY Cargo.toml Cargo.lock ./
COPY .cargo/ .cargo/

# Step 2: Copy all services
COPY services ./services

# Step 3: Build with championship optimization
RUN cargo build --release --manifest-path services/harris-pacs-bridge/Cargo.toml

# Runtime stage with MSSQL support
FROM debian:bookworm-slim

# Install runtime dependencies including FreeTDS for MSSQL
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    curl \
    freetds-bin \
    freetds-common \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 terrafusion

WORKDIR /app

# Copy binary from builder
COPY --from=builder /build/target/release/terrafusion-harris-pacs-bridge /app/

# Create logs directory
RUN mkdir -p /app/logs && chown -R terrafusion:terrafusion /app

USER terrafusion

EXPOSE 8084

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:8084/health || exit 1

CMD ["/app/terrafusion-harris-pacs-bridge"]
