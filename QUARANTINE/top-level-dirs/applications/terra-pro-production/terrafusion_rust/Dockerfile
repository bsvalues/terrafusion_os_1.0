# Multi-stage Dockerfile for TerraFusion Rust Platform
FROM rust:1.77-slim as builder

# Install system dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency files first for better caching
COPY Cargo.toml Cargo.lock ./

# Create a dummy main.rs to build dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release --bin terrafusion
RUN rm -rf src

# Copy source code
COPY src ./src

# Build the application
RUN cargo build --release --bin terrafusion

# Runtime stage
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN groupadd -r terrafusion && useradd -r -g terrafusion terrafusion

WORKDIR /app

# Copy the binary from builder stage
COPY --from=builder /app/target/release/terrafusion /app/terrafusion

# Create necessary directories
RUN mkdir -p data logs models uploads exports temp && \
    chown -R terrafusion:terrafusion /app

USER terrafusion

EXPOSE 8080 8081

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

CMD ["./terrafusion", "run"]