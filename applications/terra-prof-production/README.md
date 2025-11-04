# TerraFusionPro: Next-Generation Real Estate Appraisal Platform

TerraFusionPro is a comprehensive real estate appraisal platform combining field data collection, geospatial analysis, and AI-powered valuation tools.

## Overview

This monorepo structure contains all the microservices, web clients, and shared libraries that make up the TerraFusionPro platform. It is designed for collaborative development and streamlined DevOps processes.

### Platform Components

- **Web Client**: Browser-based dashboard for appraisers, reviewers, and clients
- **API Gateway**: Central entry point for all API requests with authentication
- **Microservices**:
  - User Service: Authentication and user management
  - Property Service: Property data management
  - Form Service: Dynamic form creation and submissions
  - Analysis Service: Valuations and comparable property analysis
  - Report Service: Report generation and management

### Tech Stack

- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based auth
- **API Architecture**: RESTful microservices
- **Infrastructure**: Docker, Kubernetes (optional)

## Getting Started

### Prerequisites

- Node.js 20 or higher
- PostgreSQL 14 or higher
- Docker (optional for containerized development)

### Setup Instructions

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/terrafusionpro.git
cd terrafusionpro
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory with the following variables:

```
DATABASE_URL=postgres://username:password@localhost:5432/terrafusionpro
JWT_SECRET=your-jwt-secret-key
```

4. **Initialize the database**

```bash
npm run db:push
```

5. **Start the services**

```bash
# Start the web client
npm run start

# Start the API gateway (in a separate terminal)
npm run start:api

# To start individual services
npm run start:property
npm run start:user
npm run start:form
```

### Default Credentials

- **Admin User**:
  - Email: `admin@terrafusionpro.com`
  - Password: `admin123`

## Project Structure

```
terrafusionpro/
├── packages/
│   ├── api/             # API Gateway
│   ├── web-client/      # Web dashboard
│   ├── field-app/       # Mobile field data collection app
│   ├── shared/          # Shared utilities and schemas
│   │   ├── schema/      # Database schema definitions
│   │   ├── migrations/  # Database migrations
│   │   └── scripts/     # Utility scripts
│   └── agents/          # AI processing agents
├── services/
│   ├── user-service/    # User authentication and management
│   ├── property-service/ # Property data management
│   ├── form-service/    # Form creation and management
│   ├── analysis-service/ # Value analysis and comparisons
│   └── report-service/  # Report generation
├── infrastructure/      # Kubernetes, Docker configurations
├── docs/                # Documentation
└── tests/               # Tests
```

## Key Features

- **Comprehensive Property Management**: Detailed property records with images, features, and location data
- **Dynamic Forms**: Customizable form templates for various property types
- **Comparable Property Analysis**: AI-powered comparable selection and adjustments
- **Market Analysis**: Trend analysis and value estimates
- **Report Generation**: Customizable report formats and templates

## Development Workflow

### Adding a New Feature

1. Create a feature branch from `main`
2. Implement your changes
3. Write tests
4. Submit a pull request

### Database Migrations

To make schema changes:

1. Update the schema in `packages/shared/schema/index.js`
2. Run `npm run db:push` to apply the changes

## License

Proprietary - All rights reserved

---

© 2025 TerraFusionPro