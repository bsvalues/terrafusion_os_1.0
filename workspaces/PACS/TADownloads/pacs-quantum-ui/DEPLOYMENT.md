# TrueAutomation/PACS Quantum AI UI - Deployment Guide

## 🚀 Production Deployment

### Prerequisites

- Node.js 18+ and npm 9+
- Production backend API running
- SignalR hub configured
- Environment variables configured

### Build Process

```bash
# Install dependencies
npm install

# Production build
npm run build

# Build output in dist/ directory
```

### Environment Configuration

Create `.env.production` file:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_SIGNALR_URL=http://localhost:8080/signalr
VITE_APP_NAME=PACS Quantum AI UI
VITE_ENABLE_ANALYTICS=false
```

### Deployment Options

#### Option 1: Static File Server (Nginx)

```nginx
server {
    listen 80;
    server_name pacs-quantum-ui.example.com;
    root /var/www/pacs-quantum-ui/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8080/api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /signalr {
        proxy_pass http://localhost:8080/signalr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

#### Option 2: IIS (Windows Server)

1. Copy `dist/` contents to IIS directory
2. Configure URL Rewrite:
   - Pattern: `(.*)`
   - Action: Rewrite to `/index.html`
3. Configure Reverse Proxy for `/api` and `/signalr`

#### Option 3: Docker

```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Health Check

The application exposes health check endpoint:
- `/health` - Returns application status

### Performance Optimization

Production build includes:
- Code splitting (vendor chunks)
- Tree shaking
- Minification
- Gzip compression
- Source maps (disabled in production)

### Security Considerations

1. **CSP Headers**: Configure Content Security Policy
2. **HTTPS**: Always use HTTPS in production
3. **API Security**: Validate API responses
4. **Error Handling**: Don't expose sensitive error details

### Monitoring

- Application logs via browser console
- Error tracking (integrate Sentry, LogRocket, etc.)
- Performance monitoring (Web Vitals)
- SignalR connection monitoring

### Rollback Strategy

1. Keep previous builds
2. Use versioned deployments
3. Feature flags for gradual rollout

## 📊 Build Statistics

- **Total Bundle Size**: ~1.4 MB (uncompressed)
- **Gzipped**: ~450 KB
- **Vendor Chunks**: Optimized and cached separately
- **First Load**: < 200 KB (main bundle)

## 🔧 Development vs Production

### Development
- Hot Module Replacement (HMR)
- Source maps enabled
- Detailed error messages
- Development-only warnings

### Production
- Optimized bundles
- No source maps (optional)
- Error boundaries
- Minified code

