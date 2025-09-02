# 🏆 BENTON COUNTY DYNASTY - BASE DOCKERFILE
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Create directories
RUN mkdir -p /app/logs /app/data /app/models /app/results

# Set permissions
RUN chmod +x *.py *.sh

# Default command
CMD ["python3", "DYNASTY_MASTER_ORCHESTRATOR.py"]