# TerraFusion Government Compliance - FISMA-High Security Build
# Government-grade compliance validation with championship optimization
FROM rust:1.83-bookworm AS builder

WORKDIR /build

# Step 1: Copy workspace configuration and lockfile
COPY Cargo.toml Cargo.lock ./
COPY .cargo/ .cargo/

# Step 2: Copy all services
COPY services ./services

# Step 3: Build with championship optimization
RUN cargo build --release --manifest-path services/government-compliance/Cargo.toml

# Runtime stage - hardened for government compliance
FROM debian:bookworm-slim

# Install runtime dependencies with security focus
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 terrafusion

WORKDIR /app

# Copy binary from builder
COPY --from=builder /build/target/release/terrafusion-government-compliance /app/

# Set ownership and permissions
RUN chown -R terrafusion:terrafusion /app && \
    chmod 500 /app/terrafusion-government-compliance

USER terrafusion

EXPOSE 8082

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:8082/health || exit 1

CMD ["/app/terrafusion-government-compliance"]
