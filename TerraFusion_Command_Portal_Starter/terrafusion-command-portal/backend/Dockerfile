# TerraFusion Backend - Government-grade Container
# Multi-stage build for security and optimization

# Build stage
FROM rust:1.75.0-slim as builder

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

# Copy manifests
COPY Cargo.toml Cargo.lock ./

# Create dummy main.rs to build dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs

# Build dependencies (cached layer)
RUN cargo build --release
RUN rm src/main.rs

# Copy source code
COPY src ./src

# Build application
RUN cargo build --release --bin tf_command_portal_api

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
COPY --from=builder /app/target/release/tf_command_portal_api /app/tf_command_portal_api
RUN chown appuser:appuser /app/tf_command_portal_api && chmod +x /app/tf_command_portal_api

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
CMD ["./tf_command_portal_api"]
