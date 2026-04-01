# Terrafusion Civil Infrastructure Intelligence Platform

A cutting-edge Geographic Information System (GIS) workflow solution for county assessor offices, delivering advanced geospatial data processing with intelligent document management and robust collaborative features.

## Architecture Overview

Terrafusion combines modern web technologies with advanced AI capabilities to create a comprehensive civil infrastructure management platform:

- **Frontend**: React 18 + TypeScript with Mapbox/Leaflet integration
- **Backend**: Node.js + Express with WebSocket support
- **Database**: PostgreSQL with PostGIS for spatial data
- **AI Engine**: Anthropic Claude for document intelligence
- **Real-time**: WebSocket-based collaborative features

## Key Features

### Advanced Mapping & GIS
- Interactive mapping with multiple provider support (Mapbox, Leaflet, ArcGIS)
- Dynamic layer management with opacity controls
- Professional measurement tools (area, distance, perimeter)
- Spatial analysis capabilities (buffers, intersections, proximity)
- Real-time collaborative map editing

### Document Intelligence
- AI-powered document classification and processing
- Legal description parsing with coordinate extraction
- OCR capabilities for scanned documents
- Automated metadata extraction
- Version control and audit trails

### Property Management
- Comprehensive parcel database management
- Automated assessment workflows
- Compliance monitoring and reporting
- Complete change history tracking
- Integration with state property databases

### Collaborative Workflows
- Real-time multi-user editing
- Contextual annotations and comments
- Task assignment and progress tracking
- WebSocket-based live updates
- Role-based access control

## Technical Stack

### Frontend Dependencies
```json
{
  "react": "^18.0.0",
  "typescript": "^5.0.0",
  "@mapbox/mapbox-gl-draw": "^1.4.0",
  "leaflet": "^1.9.0",
  "wouter": "^3.0.0",
  "@tanstack/react-query": "^5.0.0",
  "@radix-ui/react-*": "Latest",
  "tailwindcss": "^3.0.0",
  "framer-motion": "^11.0.0"
}
```

### Backend Dependencies
```json
{
  "express": "^4.18.0",
  "ws": "^8.0.0",
  "drizzle-orm": "^0.29.0",
  "postgres": "^3.4.0",
  "@anthropic-ai/sdk": "^0.17.0",
  "jsonwebtoken": "^9.0.0",
  "bcryptjs": "^2.4.0",
  "multer": "^1.4.0"
}
```

## Environment Configuration

Create a `.env` file with the following required variables:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/terrafusion"

# API Keys
ANTHROPIC_API_KEY="your_anthropic_api_key"
MAPBOX_ACCESS_TOKEN="your_mapbox_token"
ARCGIS_API_KEY="your_arcgis_key"

# Security
JWT_SECRET="your_jwt_secret_key"
SESSION_SECRET="your_session_secret"

# Application
NODE_ENV="development"
PORT=5000
```

## Installation & Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+ with PostGIS extension
- Git

### Installation Steps

1. **Clone the repository**
```bash
git clone https://github.com/your-org/terrafusion-gis.git
cd terrafusion-gis
```

2. **Install dependencies**
```bash
npm install
```

3. **Database setup**
```bash
# Install PostgreSQL and PostGIS
sudo apt-get install postgresql postgresql-contrib postgis

# Create database
createdb terrafusion
psql terrafusion -c "CREATE EXTENSION postgis;"

# Run migrations
npm run db:push
```

4. **Environment configuration**
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Start development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Development Workflow

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run preview      # Preview production build

# Database
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Drizzle Studio for database management
npm run db:seed      # Seed database with sample data

# Testing
npm test             # Run unit tests
npm run test:e2e     # Run end-to-end tests
npm run test:api     # Test API endpoints

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm run format       # Format code with Prettier
```

### Project Structure

```
terrafusion-gis/
├── client/src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI components (shadcn)
│   │   ├── maps/           # Map-specific components
│   │   ├── documents/      # Document processing components
│   │   └── collaborative/  # Real-time collaboration features
│   ├── pages/              # Application pages/routes
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions and configurations
│   ├── services/           # API service functions
│   └── types/              # TypeScript type definitions
├── server/
│   ├── routes/             # API route handlers
│   ├── services/           # Business logic services
│   ├── middleware/         # Express middleware
│   ├── storage.ts          # Database interface
│   └── index.ts           # Server entry point
├── shared/
│   └── schema.ts          # Shared database schema
├── __tests__/             # Test files
└── docs/                  # Additional documentation
```

## API Documentation

### Authentication Endpoints
```
POST /api/login          # User authentication
GET  /api/auth/user      # Get current user
POST /api/logout         # User logout
```

### GIS Data Endpoints
```
GET    /api/parcels      # Retrieve parcel data
POST   /api/parcels      # Create new parcel
PUT    /api/parcels/:id  # Update parcel
DELETE /api/parcels/:id  # Delete parcel
```

### Document Processing
```
POST /api/documents/upload    # Upload document for processing
POST /api/documents/classify  # AI-powered classification
GET  /api/documents/:id       # Retrieve document data
```

### Real-time WebSocket Events
```
map_update              # Broadcast map changes
annotation_created      # New annotation added
user_presence          # User online/offline status
document_processed     # Document processing complete
```

## Deployment

### Production Build
```bash
npm run build
npm run preview  # Test production build locally
```

### Docker Deployment
```bash
# Build container
docker build -t terrafusion-gis .

# Run with docker-compose
docker-compose up -d
```

### Environment Variables for Production
```env
NODE_ENV=production
DATABASE_URL="postgresql://prod_user:prod_pass@db_host:5432/terrafusion"
REDIS_URL="redis://redis_host:6379"
SESSION_SECRET="complex_production_secret"
JWT_SECRET="complex_jwt_secret"
```

## Security Considerations

### Data Protection
- All sensitive data encrypted at rest (AES-256)
- TLS 1.3 enforced for all connections
- Regular automated backups with encryption
- GDPR/CCPA compliance measures

### Access Control
- JWT-based authentication with refresh tokens
- Role-based permissions (Admin, Assessor, Viewer)
- API rate limiting and DDoS protection
- Session management with automatic expiration

### Audit & Compliance
- Complete audit trail for all system actions
- Immutable change history for legal compliance
- Regular security assessments
- SOC 2 compliance framework

## Performance Optimization

### Frontend Optimization
- Code splitting with lazy loading
- Image optimization and compression
- Service worker for offline capabilities
- Memory-efficient map rendering

### Backend Optimization
- Database query optimization with indexes
- Redis caching for frequent queries
- Connection pooling for database
- Horizontal scaling with load balancers

## Testing Strategy

### Unit Testing
```bash
npm test                    # Run all unit tests
npm run test:coverage      # Generate coverage report
```

### Integration Testing
```bash
npm run test:api           # Test API endpoints
npm run test:db            # Test database operations
```

### End-to-End Testing
```bash
npm run test:e2e           # Full application testing
npm run test:visual        # Visual regression testing
```

## Contributing

### Development Guidelines
1. Follow TypeScript strict mode
2. Use ESLint and Prettier for code formatting
3. Write comprehensive tests for new features
4. Document API changes in OpenAPI format
5. Follow semantic versioning for releases

### Code Review Process
1. Create feature branch from `main`
2. Implement changes with tests
3. Submit pull request with detailed description
4. Address review feedback
5. Merge after approval and CI passing

## Troubleshooting

### Common Issues

**Database Connection Errors**
```bash
# Check PostgreSQL service
sudo systemctl status postgresql
# Verify PostGIS extension
psql -d terrafusion -c "SELECT PostGIS_version();"
```

**WebSocket Connection Issues**
```bash
# Check firewall settings
sudo ufw status
# Verify port availability
netstat -tulpn | grep :5000
```

**API Key Configuration**
```bash
# Verify environment variables
printenv | grep API_KEY
# Test API connectivity
curl -H "Authorization: Bearer $ANTHROPIC_API_KEY" https://api.anthropic.com/v1/messages
```

## Support & Documentation

- **Technical Documentation**: [docs/technical/](docs/technical/)
- **User Guides**: [docs/user-guides/](docs/user-guides/)
- **API Reference**: [docs/api/](docs/api/)
- **Contributing Guide**: [CONTRIBUTING.md](CONTRIBUTING.md)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Benton County Assessor's Office for requirements and testing
- Open source GIS community for mapping libraries
- Anthropic for AI capabilities
- Contributors and maintainers