# TerraFusion Operations Dashboard Frontend

## Overview

A real-time monitoring and management dashboard for the TerraFusion OS ecosystem. Built with React, TypeScript, and Socket.IO for live data streaming from the Python backend.

## Features

### 🌍 System Overview
- Real-time system metrics (CPU, Memory, Disk, Network)
- Government OS status indicators
- System uptime tracking
- Connection status monitoring

### 🔧 Module Management
- Hot-swappable module status tracking
- Module lifecycle management (Start/Stop/Restart)
- Health check monitoring
- Configuration management

### 🌐 Service Monitoring
- Multi-service status dashboard
- Response time tracking
- Port and URL monitoring
- Service health checks

### 📄 Real-time Log Viewer
- Live log streaming via Socket.IO
- Multi-level filtering (Error, Warning, Info, Debug)
- Source-based filtering
- Search functionality
- Export capabilities

### 🚨 Alert Management
- Real-time alert notifications
- Alert categorization and filtering
- Dismissal and management controls
- Detailed alert inspection

## Architecture

### Frontend Stack
- **React 18.2.0** - UI Framework
- **TypeScript** - Type safety
- **Socket.IO Client** - Real-time communication
- **Vite** - Build tool and dev server
- **CSS3** - Custom styling with TerraFusion branding

### Backend Integration
- **Socket.IO Server** - Python backend on port \${{TF_DEBUG_PORT:-9999}}
- **Real-time Events** - System metrics, logs, alerts
- **RESTful API** - Configuration and control endpoints

## Installation

```bash
# Navigate to frontend directory
cd /workspaces/terrafusion_os_1.0/modules/specialized/operations_dashboard/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## Development Server

The frontend runs on port \${{TF_DEBUG_PORT:-9999}} and connects to the Python backend on the same port via Socket.IO.

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Component Structure

```
src/
├── components/
│   ├── Header.tsx              # Navigation and connection status
│   ├── SystemOverview.tsx      # System metrics dashboard
│   ├── ModuleStatus.tsx        # Module management interface
│   ├── ServiceMonitoring.tsx   # Service status monitoring
│   ├── LogViewer.tsx          # Real-time log streaming
│   └── AlertsPanel.tsx        # Alert management system
├── App.tsx                    # Main application component
├── App.css                    # Application styles
├── index.css                  # Global styles and branding
└── main.tsx                   # Application entry point
```

## Socket.IO Events

### Incoming Events (from Python backend)
- `system_metrics` - CPU, memory, disk, network data
- `service_status` - Service health and response times
- `module_status` - Module states and configurations
- `new_alert` - Real-time alert notifications
- `new_log` - Live log entries

### Outgoing Events (to Python backend)
- `connect` - Connection establishment
- `disconnect` - Connection termination
- Custom control events for module/service management

## TerraFusion Branding

### Color Scheme
- **Primary**: `#00ff88` (TerraFusion Green)
- **Secondary**: `#0066cc` (Government Blue)
- **Accent**: `#ff6b35` (Alert Orange)
- **Dark**: `#1a1a2e` (Background Dark)
- **Success**: `#00ff88` (Green)
- **Warning**: `#ffa500` (Orange)
- **Danger**: `#ff4757` (Red)

### Design Elements
- Glassmorphism effects with backdrop blur
- Gradient backgrounds and buttons
- Government-appropriate professional styling
- Responsive design for multiple screen sizes
- Accessibility-compliant color contrast

## Integration Points

### Python Backend Connection
```typescript
const socket = io('http://localhost:\${{TF_DEBUG_PORT:-9999}}', {
  transports: ['websocket', 'polling']
})
```

### Real-time Data Handling
```typescript
socket.on('system_metrics', (data: SystemMetrics) => {
  setSystemMetrics(data)
})
```

## Production Deployment

### Build Process
```bash
npm run build
```

### Static Asset Serving
The built assets can be served by:
- Nginx reverse proxy
- Express.js static middleware
- Python Flask static files
- Government-approved CDN

### Environment Configuration
- `VITE_API_URL` - Backend API endpoint
- `VITE_SOCKET_URL` - Socket.IO server URL
- `VITE_ENVIRONMENT` - Deployment environment

## Government Compliance

### Security Features
- CSP (Content Security Policy) headers
- HTTPS enforcement in production
- Input sanitization and validation
- Government-approved dependencies only

### Accessibility
- WCAG 2.1 AA compliance
- Screen reader compatibility
- Keyboard navigation support
- High contrast mode support

### Performance
- Code splitting and lazy loading
- Asset optimization and compression
- Service worker for offline capabilities
- Government bandwidth optimization

## Development Guidelines

### Code Standards
- TypeScript strict mode enabled
- ESLint and Prettier configuration
- Component-based architecture
- Props interface definitions

### Testing Strategy
- Unit tests with Jest/Vitest
- Component testing with Testing Library
- Integration tests for Socket.IO
- E2E tests with Playwright

### Git Workflow
- Feature branch development
- Pull request reviews required
- Automated testing on commits
- Government change approval process

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Verify Python backend is running on port \${{TF_DEBUG_PORT:-9999}}
   - Check firewall settings
   - Validate Socket.IO server configuration

2. **Missing Data**
   - Confirm backend is sending events
   - Check browser console for errors
   - Verify component state management

3. **Performance Issues**
   - Monitor component re-renders
   - Check for memory leaks
   - Optimize real-time data handling

### Debug Mode
```bash
# Enable debug logging
VITE_DEBUG=true npm run dev
```

## License

Government software - All rights reserved
TerraFusion OS - County Government Operating System

## Support

- Internal documentation: `docs/operations-dashboard/`
- Government IT support: Contact system administrators
- Development team: TerraFusion Engineering Team