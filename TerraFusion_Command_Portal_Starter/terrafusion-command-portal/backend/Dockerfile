# TerraFusion Backend - Government-grade Container
# Multi-stage build for security and optimization

# Build stage
FROM rust:1.83.0-slim as builder

# Install dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app user for security
RUN adduser --disabled-password --gecos '' --shell /bin/bash --home /app appuser

# Set working directory
WORKDIR /app

# Copy manifest (Cargo.lock may be absent in repo)
COPY Cargo.toml ./

# Create dummy main.rs to build dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs

# Build dependencies (cached layer)
RUN cargo build --release
RUN rm src/main.rs

# Copy source code
COPY src ./src

# Build application
RUN cargo build --release --bin terrafusion_developer_platform

# Runtime stage
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create app user
RUN adduser --disabled-password --gecos '' --shell /bin/bash --home /app appuser

# Create directories
RUN mkdir -p /app/data && chown -R appuser:appuser /app

# Copy binary from builder
COPY --from=builder /app/target/release/terrafusion_developer_platform /app/terrafusion_developer_platform
RUN chown appuser:appuser /app/terrafusion_developer_platform && chmod +x /app/terrafusion_developer_platform

# Security configurations
USER appuser
WORKDIR /app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8787/health/live || exit 1

# Expose port
EXPOSE 8787

# Environment variables
ENV RUST_LOG=info
ENV REPO_ROOT=/app/data

# Run application
CMD ["./terrafusion_developer_platform"]
