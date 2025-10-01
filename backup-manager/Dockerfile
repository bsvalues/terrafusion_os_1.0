# TerraFusion Backup Manager Dockerfile
FROM alpine:latest

# Install required tools
RUN apk add --no-cache \
    bash \
    curl \
    postgresql-client \
    rsync \
    tar \
    gzip \
    coreutils \
    cronie

WORKDIR /app

# Copy backup scripts
COPY backup-script.sh /app/
COPY restore-script.sh /app/
COPY cleanup-script.sh /app/

# Make scripts executable
RUN chmod +x /app/*.sh

# Create backup directory
RUN mkdir -p /backups

# Setup cron for scheduled backups
RUN echo "0 2 * * * /app/backup-script.sh" | crontab -

# Health check
HEALTHCHECK --interval=60s --timeout=10s --start-period=30s --retries=3 \
  CMD test -f /tmp/backup-manager-health || exit 1

# Non-root user for security
RUN addgroup -g 1001 -S backups
RUN adduser -S terrafusion -u 1001 -G backups
USER terrafusion

CMD ["crond", "-f", "-d", "8"]