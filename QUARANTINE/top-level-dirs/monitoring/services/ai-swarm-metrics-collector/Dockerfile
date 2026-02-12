FROM python:3.11-slim

# Government-grade AI Swarm Metrics Collector
# Collects comprehensive metrics from 1,008 AI agents

LABEL maintainer="TerraFusion Government Team <devops@terrafusion.gov>"
LABEL description="AI Swarm Metrics Collector for Government Compliance"
LABEL version="1.0.0"
LABEL compliance="FISMA"

# Create non-root user for security
RUN groupadd -r aiswarm && useradd -r -g aiswarm -u 1001 aiswarm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Set working directory
WORKDIR /app

# Copy requirements first for better Docker layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directories for logs and metrics
RUN mkdir -p /app/logs /app/metrics \
    && chown -R aiswarm:aiswarm /app

# Switch to non-root user
USER aiswarm

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:9400/health || exit 1

# Expose metrics port
EXPOSE 9400

# Environment variables for configuration
ENV PYTHONUNBUFFERED=1
ENV LOG_LEVEL=INFO
ENV METRICS_PORT=9400
ENV AI_SWARM_SIZE=1008
ENV GOVERNMENT_COMPLIANCE=true

# Start the metrics collector
CMD ["python", "ai_swarm_metrics_collector.py"]