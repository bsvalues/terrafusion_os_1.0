# TerraFusion AI Consciousness - Elite AI Swarm Orchestration Build
# 50,000+ agent coordination with quantum consciousness optimization
FROM rust:1.83-bookworm AS builder

WORKDIR /build

# Step 1: Copy workspace configuration and lockfile
COPY Cargo.toml Cargo.lock ./
COPY .cargo/ .cargo/

# Step 2: Copy all services (required for workspace compilation)
COPY services ./services

# Step 3: Build with championship optimization
RUN cargo build --release --manifest-path services/os-consciousness/Cargo.toml

# Runtime stage with AI/ML support
FROM debian:bookworm-slim

# Install runtime dependencies for AI/ML stack
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    curl \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 terrafusion

WORKDIR /app

# Copy binary from builder
COPY --from=builder /build/target/release/terrafusion-os-consciousness /app/

# Set ownership
RUN chown -R terrafusion:terrafusion /app

USER terrafusion

EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:8081/health || exit 1

CMD ["/app/terrafusion-os-consciousness"]
