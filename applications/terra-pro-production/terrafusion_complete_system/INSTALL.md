# TerraFusionPlatform Installation Guide

This guide provides instructions for setting up and running the TerraFusionPlatform on your local development environment.

## Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- PostgreSQL database

## Installation Steps

### 1. Set up the database

Make sure you have PostgreSQL running. Set the `DATABASE_URL` environment variable to point to your PostgreSQL database:

```bash
export DATABASE_URL=postgresql://username:password@localhost:5432/terrafusion
```

### 2. Install dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt
```

### 3. Run database migrations

```bash
npm run db:push
```

This will set up the necessary tables in your database.

### 4. Start the application

```bash
# Start the full application (frontend + API)
npm run dev
```

The application will be available at http://localhost:5000

## Testing the AI Valuation Endpoints

You can test the AI valuation endpoints using the included test script:

```bash
node test-ai-valuation.js
```

### Testing with curl

#### Get valuation by property ID:

```bash
curl -X GET http://localhost:5000/api/ai/value/1
```

#### Get valuation by property details:

```bash
curl -X POST \
  http://localhost:5000/api/ai/value \
  -H 'Content-Type: application/json' \
  -d '{
    "address": {
      "street": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "zipCode": "12345"
    },
    "propertyType": "single-family",
    "bedrooms": 3,
    "bathrooms": 2,
    "squareFeet": 1800,
    "yearBuilt": 1990,
    "lotSize": 0.25,
    "features": [
      {"name": "Fireplace"},
      {"name": "Hardwood Floors"}
    ],
    "condition": "Good"
  }'
```

## Project Structure

- `server/` - Express server files
  - `routes/` - API route handlers
  - `valuation-service.js` - AI valuation service
- `client/` - React frontend
  - `src/pages/` - React components for different pages
  - `src/components/` - Reusable UI components
- `backend/` - Python backend services
  - `valuation_engine.py` - Core valuation model
- `shared/` - Code shared between frontend and backend
  - `schema.ts` - Database schema definitions

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Port for the Express server (default: 5000)
- `NODE_ENV` - Environment mode (development, production)

## Running in Production

For production deployments, build the frontend and run the server:

```bash
# Build the frontend
npm run build

# Start the server in production mode
NODE_ENV=production node server/index.js
```

## Troubleshooting

- If you encounter database connection issues, verify your `DATABASE_URL` is correct and that PostgreSQL is running.
- If the API endpoints aren't working, check the server logs for any error messages.
- For frontend issues, check the browser console for errors.
