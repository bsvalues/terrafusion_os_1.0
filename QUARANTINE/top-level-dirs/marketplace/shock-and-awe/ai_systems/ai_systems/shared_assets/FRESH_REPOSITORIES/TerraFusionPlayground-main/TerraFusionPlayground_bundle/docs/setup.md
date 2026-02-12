# TerraFusion Playground Setup Guide

## Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- Docker and Docker Compose
- Redis
- Python 3.8 or higher (for TensorFlow)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/terrafusion-playground.git
cd terrafusion-playground
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit `.env` with your configuration.

## Development

1. Start the development server:
```bash
npm run dev
```

2. Run tests:
```bash
npm test
```

3. Check code quality:
```bash
npm run lint
npm run format:check
```

## Building

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Docker Deployment

1. Build the Docker image:
```bash
docker build -t terrafusion-playground .
```

2. Run with Docker Compose:
```bash
docker-compose up -d
```

## Monitoring

1. Access Prometheus metrics:
```
http://localhost:9090
```

2. View Grafana dashboards:
```
http://localhost:3001
```

## Security

1. Generate JWT secret:
```bash
openssl rand -base64 32
```
Add the output to your `.env` file as `JWT_SECRET`.

2. Set up SSL certificates:
```bash
# For development
mkcert localhost
```

## Performance Tuning

1. Adjust Redis configuration:
```bash
# Edit redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
```

2. Configure Node.js:
```bash
# Add to .env
NODE_OPTIONS="--max-old-space-size=4096"
```

## Troubleshooting

### Common Issues

1. Port conflicts:
```bash
# Check port usage
netstat -tulpn | grep LISTEN
```

2. Memory issues:
```bash
# Monitor memory usage
top -o mem
```

3. Docker issues:
```bash
# Clean up Docker
docker system prune -a
```

### Logs

1. Application logs:
```bash
tail -f logs/app.log
```

2. Docker logs:
```bash
docker-compose logs -f
```

## Maintenance

1. Update dependencies:
```bash
npm update
```

2. Clean up:
```bash
npm run clean
```

3. Backup:
```bash
# Backup data
tar -czf backup.tar.gz data/
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Support

For support, please:
1. Check the documentation
2. Search existing issues
3. Create a new issue if needed

## License

This project is licensed under the MIT License - see the LICENSE file for details. 