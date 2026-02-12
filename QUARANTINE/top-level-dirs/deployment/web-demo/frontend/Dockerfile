# TerraFusion Government OS - Demo Frontend Dockerfile
FROM nginx:alpine

# Copy demo frontend
COPY . /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf 2>/dev/null || echo "# Basic nginx config" > /etc/nginx/conf.d/default.conf

# Add demo metadata labels
LABEL org.terrafusion.service="demo-frontend" \
      org.terrafusion.version="1.0.0" \
      org.terrafusion.county="Benton County" \
      org.terrafusion.demo="true" \
      org.terrafusion.properties="89247" \
      org.terrafusion.ai-agents="1008"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]