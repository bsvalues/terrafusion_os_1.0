# TerraFusion OS Core - Championship-Level Multi-stage Build
# Using Rust 1.83 for ICU dependency compatibility (Unicode support)
FROM rust:1.83-bookworm AS builder

WORKDIR /build

# Step 1: Copy workspace configuration and lockfile
COPY Cargo.toml Cargo.lock ./
COPY .cargo/ .cargo/

# Step 2: Copy all services (required for workspace compilation)
COPY services ./services

# Step 3: Build with championship optimization (lockfile ensures deterministic builds)
RUN cargo build --release --manifest-path services/os-core/Cargo.toml

# Runtime stage - minimal footprint
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN useradd -m -u 1000 terrafusion

WORKDIR /app

# Copy binary from builder
COPY --from=builder /build/target/release/terrafusion-os-core /app/

# Set ownership
RUN chown -R terrafusion:terrafusion /app

USER terrafusion

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

CMD ["/app/terrafusion-os-core"]
