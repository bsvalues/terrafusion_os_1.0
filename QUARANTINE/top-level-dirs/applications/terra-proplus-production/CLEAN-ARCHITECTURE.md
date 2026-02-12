# Terrafusion Professional - Clean Architecture

## Project Structure

```
├── server/
│   ├── index.js          # Main server entry point
│   ├── index.ts          # TypeScript server implementation
│   ├── storage.ts        # Database storage layer
│   ├── db.ts            # Database connection
│   └── init-db.ts       # Database initialization
├── shared/
│   ├── schema.ts        # Drizzle database schema
│   └── terrainsight-schema.ts
├── client/
│   ├── src/             # React frontend source
│   ├── dist/            # Build output
│   ├── public/          # Static assets
│   ├── index.html       # Main HTML template
│   ├── package.json     # Client dependencies
│   ├── vite.config.ts   # Vite configuration
│   └── tailwind.config.js
├── packages/            # Monorepo structure (future)
├── scripts/
│   └── init-db.ts       # Database initialization script
├── docs/               # Documentation
├── kubernetes/         # K8s deployment configs
├── helm/              # Helm charts
├── terraform/         # Infrastructure as code
├── archive/           # Archived/unused code
│   ├── legacy-servers/
│   ├── duplicate-html/
│   ├── unused-scripts/
│   ├── legacy-config/
│   └── migration-files/
└── package.json       # Root dependencies
```

## Active Components

### Server Layer (`server/`)
- **index.js** - Production server with Express.js and clean API routes
- **index.ts** - TypeScript implementation for type safety
- **storage.ts** - Database abstraction layer using Drizzle ORM
- **db.ts** - PostgreSQL connection management

### Shared Layer (`shared/`)
- **schema.ts** - Complete Drizzle schema with relations and validation
- Type definitions for Properties, Appraisals, Comparables, Market Data

### Frontend (`client/`)
- React application with TypeScript
- Tailwind CSS for styling
- Vite for build tooling
- Component-based architecture

## API Endpoints

- `GET /api/properties` - List all properties
- `GET /api/properties/:id` - Get specific property
- `POST /api/properties` - Create new property
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property
- `GET /api/appraisals` - List appraisals (with filters)
- `POST /api/appraisals` - Create new appraisal
- `GET /api/comparables` - List comparables by appraisal
- `POST /api/comparables` - Create new comparable
- `GET /api/market-data` - Get market data by zip code

## Clean Workspace Principles

1. **Single Source of Truth** - No duplicate implementations
2. **TypeScript First** - Type safety throughout the stack
3. **Archive System** - Unused code preserved but separated
4. **Production Ready** - Clean, maintainable, scalable code
5. **Infrastructure as Code** - Complete deployment automation

## Development Commands

- `npm run dev` - Start development server
- `npm run db:push` - Push schema changes to database
- `npm run db:generate` - Generate database migrations

## Quality Standards

- Zero placeholder data in production
- Complete error handling
- Comprehensive logging
- Security best practices
- Performance optimization
- Scalable architecture