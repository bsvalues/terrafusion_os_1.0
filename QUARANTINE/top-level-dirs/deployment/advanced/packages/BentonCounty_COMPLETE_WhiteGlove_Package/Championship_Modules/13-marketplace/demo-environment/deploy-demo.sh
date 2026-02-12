#!/bin/bash
echo "Deploying TerraFusion Demo Environment..."

# Check if running on server
if [ ! -d "/var/www" ]; then
    echo "This script should be run on the production server"
    exit 1
fi

# Create demo directory
sudo mkdir -p /var/www/terrafusion-demo

# Copy demo files
sudo cp -r * /var/www/terrafusion-demo/

# Set permissions
sudo chown -R www-data:www-data /var/www/terrafusion-demo
sudo chmod -R 755 /var/www/terrafusion-demo

# Install demo API dependencies
cd /var/www/terrafusion-demo
npm install express

# Start demo API with PM2
pm2 start demo-api.js --name terrafusion-demo-api

# Configure nginx
sudo cp demo.nginx.conf /etc/nginx/sites-available/demo.terrafusionmarket.io
sudo ln -sf /etc/nginx/sites-available/demo.terrafusionmarket.io /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Demo environment deployed at demo.terrafusionmarket.io"
