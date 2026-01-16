# Multi-stage Dockerfile for TerraFusion Backend (Rust)
# Build stage
FROM rust:1.75-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    musl-dev \
    pkgconfig \
    openssl-dev \
    postgresql-dev \
    libc6-compat

# Create app user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Set working directory
WORKDIR /app

# Copy dependency files
COPY Cargo.toml Cargo.lock ./
COPY src ./src

# Build with optimizations
ENV RUSTFLAGS="-C target-cpu=native -C opt-level=3 -C link-arg=-s"
ENV CARGO_PROFILE_RELEASE_CODEGEN_UNITS=1
ENV CARGO_PROFILE_RELEASE_LTO=true
ENV CARGO_PROFILE_RELEASE_PANIC=abort

RUN cargo build --release --locked

# Security scanning stage
FROM aquasec/trivy:latest AS security-scanner
COPY --from=builder /app/target/release/terrafusion-backend /scan/
RUN trivy fs --format json --output /scan/security-report.json /scan/

# Runtime stage
FROM alpine:3.23.2 AS runtime

# Install runtime dependencies
RUN apk add --no-cache \
    ca-certificates \
    libgcc \
    openssl \
    postgresql-client \
    curl \
    && rm -rf /var/cache/apk/*

# Create app user and directories
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup && \
    mkdir -p /app/logs /app/data && \
    chown -R appuser:appgroup /app

# Copy binary from builder
COPY --from=builder --chown=appuser:appgroup /app/target/release/terrafusion-backend /app/

# Copy security report
COPY --from=security-scanner /scan/security-report.json /app/security-report.json

# Set up health check script
COPY --chown=appuser:appgroup <<EOF /app/healthcheck.sh
#!/bin/sh
curl -f http://localhost:8080/health || exit 1
EOF

RUN chmod +x /app/healthcheck.sh

# Switch to non-root user
USER appuser

# Set working directory
WORKDIR /app

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD ["./healthcheck.sh"]

# Resource limits via labels
LABEL \
    memory.request="256Mi" \
    memory.limit="512Mi" \
    cpu.request="250m" \
    cpu.limit="500m"

# Security labels
LABEL \
    security.scan.completed="true" \
    security.non-root="true" \
    security.readonly-rootfs="true"

# Set environment variables
ENV RUST_LOG=info
ENV RUST_BACKTRACE=1

# Start the application
ENTRYPOINT ["./terrafusion-backend"]