# Layer 3: Trust Fabric Dockerfile
FROM python:3.11-slim

LABEL maintainer="TerraFusion Trust Fabric Team"
LABEL description="Pure cryptographic attestation service - Layer 3"

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create application directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY attestation_service.py .

# Create data directory for attestations
RUN mkdir -p /app/data

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:7000/health || exit 1

# Expose port
EXPOSE 7000

# Run as non-root user
RUN groupadd -r trustfabric && useradd -r -g trustfabric trustfabric
RUN chown -R trustfabric:trustfabric /app
USER trustfabric

# Start the service
CMD ["python", "attestation_service.py"]
