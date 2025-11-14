# TerraFusion Quantum Optimizer - Championship Performance Build
# Quantum-enhanced optimization with native CPU targeting
FROM rust:1.83-bookworm AS builder

WORKDIR /build

# Quantum optimization: native CPU instructions for maximum performance
ENV RUSTFLAGS="-C target-cpu=native"

# Step 1: Copy workspace configuration and lockfile
COPY Cargo.toml Cargo.lock ./
COPY .cargo/ .cargo/

# Step 2: Copy all services
COPY services ./services

# Step 3: Build with championship quantum optimization
RUN cargo build --release --manifest-path services/quantum-optimizer/Cargo.toml

# Runtime stage
FROM debian:bookworm-slim

# Install runtime dependencies
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
COPY --from=builder /build/target/release/terrafusion-quantum-optimizer /app/

# Set ownership
RUN chown -R terrafusion:terrafusion /app

USER terrafusion

EXPOSE 8085

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:8085/health || exit 1

CMD ["/app/terrafusion-quantum-optimizer"]
