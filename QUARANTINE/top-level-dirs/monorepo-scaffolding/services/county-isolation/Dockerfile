# TerraFusion County Isolation - Sovereign Data Boundary Build
# Multi-tenant isolation for 39 Washington State counties
FROM rust:1.83-bookworm AS builder

WORKDIR /build

# Step 1: Copy workspace configuration and lockfile
COPY Cargo.toml Cargo.lock ./
COPY .cargo/ .cargo/

# Step 2: Copy all services
COPY services ./services

# Step 3: Build with championship optimization
RUN cargo build --release --manifest-path services/county-isolation/Cargo.toml

# Runtime stage
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 terrafusion

WORKDIR /app

# Copy binary from builder
COPY --from=builder /build/target/release/terrafusion-county-isolation /app/

# Set ownership
RUN chown -R terrafusion:terrafusion /app

USER terrafusion

EXPOSE 8083

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:8083/health || exit 1

CMD ["/app/terrafusion-county-isolation"]
