# Terrafusion Operations Dashboard

A comprehensive real-time monitoring and management dashboard for the Terrafusion ecosystem.

## Features

- **Real-time Monitoring**: Live updates via WebSocket connections
- **Service Health Tracking**: Monitor all 8 Terrafusion services
- **System Metrics**: CPU, memory, disk, and network usage
- **Alert Management**: Critical alerts with severity levels
- **Infrastructure Overview**: Database, cache, and system status
- **Quick Actions**: Health checks, service restarts, log viewing
- **Historical Charts**: Visualize trends over time
- **Export Capabilities**: Download metrics as CSV

## Architecture

### Components

1. **API Server** (`enhanced_api_server.py`)
   - Flask-based REST API
   - Socket.IO for real-time updates
   - Comprehensive endpoints for metrics and control

2. **Metrics Collector** (`metrics_collector.py`)
   - Background thread for continuous monitoring
   - Collects system, service, database, and cache metrics
   - Alert generation based on thresholds

3. **WebSocket Handler** (`websocket_handler.py`)
   - Manages real-time client connections
   - Broadcasts metrics updates
   - Handles client subscriptions

4. **Web Interface** (`templates/dashboard.html`)
   - Responsive Bootstrap 5 design
   - Real-time charts with Chart.js
   - Interactive service controls

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure settings in `config.py` or via environment variables

3. Start the dashboard:
```bash
./start_dashboard.sh
```

## Configuration

Key configuration options in `config.py`:

- `API_PORT`: Dashboard port (default: 9999)
- `METRICS_COLLECTION_INTERVAL`: How often to collect metrics (default: 30s)
- `ALERT_THRESHOLDS`: Customize alert trigger levels
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string

## API Endpoints

### Metrics
- `GET /api/metrics/summary` - Current metrics overview
- `GET /api/metrics/system` - Historical system metrics
- `GET /api/metrics/services` - Service health and stats
- `GET /api/metrics/database` - Database performance
- `GET /api/metrics/cache` - Redis cache metrics

### Monitoring
- `GET /api/alerts` - Active alerts
- `GET /api/system/info` - System information
- `GET /api/logs/<service_id>` - Service logs

### Actions
- `POST /api/services/<service_id>/restart` - Restart a service
- `POST /api/actions/health-check` - Run health check
- `POST /api/actions/backup` - Trigger backup
- `POST /api/actions/security-scan` - Run security scan

## WebSocket Events

### Client to Server
- `connect` - Initial connection
- `subscribe` - Subscribe to metric types
- `ping` - Keep-alive

### Server to Client
- `metrics_update` - Regular metrics broadcast
- `critical_alert` - High-priority alerts
- `service_action` - Service state changes

## Security

- CORS configuration for API access
- Session security with HTTPOnly cookies
- Rate limiting on sensitive endpoints
- SSL/TLS support for production

## Monitoring Thresholds

Default alert thresholds:
- CPU: 80%
- Memory: 85%
- Disk: 90%
- Response Time: 1000ms
- Error Rate: 5%

## Troubleshooting

### Dashboard won't start
- Check if port 9999 is available
- Verify Python dependencies are installed
- Check database and Redis connectivity

### No real-time updates
- Ensure WebSocket port is not blocked
- Check browser console for connection errors
- Verify Socket.IO is properly initialized

### Missing metrics
- Check if services are running
- Verify service health endpoints
- Review collector logs

## Development

### Running in development mode
```bash
export DASHBOARD_DEBUG=true
python enhanced_api_server.py
```

### Adding new metrics
1. Update `MetricsCollector` class
2. Add collection method
3. Update storage structure
4. Add API endpoint
5. Update frontend display

### Testing
```bash
pytest tests/
```

## Performance Considerations

- Metrics are stored in memory with configurable retention
- Redis used for persistence and cross-instance sharing
- WebSocket broadcasts are throttled to prevent overload
- Charts limited to last N data points for performance

## License

Part of the Terrafusion Enterprise Suite